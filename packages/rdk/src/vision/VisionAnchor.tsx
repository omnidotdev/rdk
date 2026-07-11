import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Object3D, Vector3 } from "three";

import { landmarksCentroid, landmarkToWorld } from "./landmarkMapping";
import useVisionBackend from "./useVisionBackend";

import type { ReactNode } from "react";
import type { Group, InstancedMesh } from "three";
import type { LandmarkDetection, VisionFrame } from "./types";

/** Capacity for debug markers (MediaPipe face mesh is the largest at 478) */
const MAX_LANDMARKS = 478;

export type VisionAnchorProps = {
  /** Landmark task to anchor to (hands, faces, or poses) */
  task: "hands" | "faces" | "poses";
  /** Which detection to anchor to when several are present (default 0) */
  index?: number;
  /** Render a marker at every landmark for debugging */
  debug?: boolean;
  /** Mirror x to match a mirrored (selfie) preview (default true) */
  mirror?: boolean;
  /**
   * Per-frame lerp factor (0-1) smoothing the anchor toward the detection.
   * 1 snaps instantly; lower gives smoother, laggier motion (default 0.4).
   */
  smoothing?: number;
  /** Content rendered anchored at the detection centroid */
  children?: ReactNode;
};

const detectionsFor = (
  frame: VisionFrame,
  task: VisionAnchorProps["task"],
): LandmarkDetection[] => {
  if (task === "faces") return frame.faces;
  if (task === "poses") return frame.poses;
  return frame.hands;
};

/**
 * Anchors its children to the centroid of a detected hand, face, or pose from
 * the active vision session, optionally rendering per-landmark debug markers.
 * Updates imperatively in the render loop (no per-frame React state; debug
 * markers use a single instanced mesh). Renders inside an R3F Canvas (e.g. as a
 * child of `VisionOverlay`).
 */
const VisionAnchor = ({
  task,
  index = 0,
  debug = false,
  mirror = true,
  smoothing = 0.4,
  children,
}: VisionAnchorProps) => {
  const { onDetection, isSuccess } = useVisionBackend();
  const { viewport } = useThree();

  const frameRef = useRef<VisionFrame | null>(null);
  const groupRef = useRef<Group>(null);
  const instancedRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const target = useMemo(() => new Vector3(), []);

  // Hidden until the first detection arrives
  useEffect(() => {
    if (groupRef.current) groupRef.current.visible = false;
    if (instancedRef.current) instancedRef.current.count = 0;
  }, []);

  useEffect(() => {
    if (!isSuccess) return;
    return onDetection((frame) => {
      frameRef.current = frame;
    });
  }, [isSuccess, onDetection]);

  useFrame(() => {
    const frame = frameRef.current;
    const group = groupRef.current;
    if (!frame || !group) return;

    const detection = detectionsFor(frame, task)[index];
    const instanced = instancedRef.current;

    if (!detection || detection.landmarks.length === 0) {
      group.visible = false;
      if (instanced) instanced.count = 0;
      return;
    }
    const wasVisible = group.visible;
    group.visible = true;

    const centroid = landmarksCentroid(detection.landmarks);
    const [cx, cy, cz] = landmarkToWorld(
      centroid,
      viewport,
      frame.frameSize,
      mirror,
    );
    target.set(cx, cy, cz);
    // Snap on first appearance, otherwise ease toward the detection
    if (!wasVisible || smoothing >= 1) {
      group.position.copy(target);
    } else {
      group.position.lerp(target, smoothing);
    }

    if (debug && instanced) {
      const gp = group.position;
      const count = Math.min(detection.landmarks.length, MAX_LANDMARKS);
      for (let i = 0; i < count; i++) {
        const [x, y, z] = landmarkToWorld(
          detection.landmarks[i],
          viewport,
          frame.frameSize,
          mirror,
        );
        // Relative to the group's (smoothed) position so markers stay on the
        // true landmarks even while the group eases into place
        dummy.position.set(x - gp.x, y - gp.y, z - gp.z);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      }
      instanced.count = count;
      instanced.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
      {debug && (
        <instancedMesh
          ref={instancedRef}
          args={[undefined, undefined, MAX_LANDMARKS]}
        >
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial color="#00ff88" />
        </instancedMesh>
      )}
    </group>
  );
};

export default VisionAnchor;
