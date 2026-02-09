import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import useVisionDetection from "./useVisionDetection";

import type React from "react";

export interface VisionAnchorProps {
  task: "hands" | "faces" | "poses";
  index?: number;
  minConfidence?: number;
  scale?: number;
  offset?: [number, number, number];
  smooth?: boolean;
  smoothing?: number;
  debug?: boolean;
  children?: React.ReactNode;
  onTrackingFound?: () => void;
  onTrackingLost?: () => void;
}

/**
 * Position 3D content at detected landmarks.
 * Works off-main-thread with lightweight detection results.
 */
const VisionAnchor: React.FC<VisionAnchorProps> = ({
  task,
  index = 0,
  minConfidence = 0.7,
  scale = 1,
  offset = [0, 0, 0],
  smooth = true,
  smoothing = 0.1,
  debug = false,
  children,
  onTrackingFound,
  onTrackingLost,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const wasTracking = useRef(false);

  const { detection, isTracking, get3DLandmarks } = useVisionDetection({
    task,
    index,
    minConfidence,
    throttle: 16,
  });

  // Calculate anchor position from detection
  useEffect(() => {
    if (!detection || !isTracking) return;

    const landmarks3D = get3DLandmarks();
    if (landmarks3D.length === 0) return;

    // Use first landmark as anchor point (wrist for hands, nose for faces, etc)
    const anchor = landmarks3D[0];

    targetPosition.current.set(
      anchor.x * scale + offset[0],
      anchor.y * scale + offset[1],
      anchor.z * scale + offset[2],
    );
  }, [detection, isTracking, get3DLandmarks, scale, offset]);

  // Handle tracking state changes
  useEffect(() => {
    if (isTracking && !wasTracking.current) {
      onTrackingFound?.();
    } else if (!isTracking && wasTracking.current) {
      onTrackingLost?.();
    }
    wasTracking.current = isTracking;
  }, [isTracking, onTrackingFound, onTrackingLost]);

  // Animate position
  useFrame(() => {
    if (!groupRef.current) return;

    if (isTracking) {
      if (smooth) {
        currentPosition.current.lerp(targetPosition.current, smoothing);
        groupRef.current.position.copy(currentPosition.current);
      } else {
        groupRef.current.position.copy(targetPosition.current);
      }
    }
  });

  return (
    <group ref={groupRef} visible={isTracking}>
      {debug && (
        <mesh>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial
            color={isTracking ? "#00ff00" : "#ff0000"}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
      {children}
    </group>
  );
};

export default VisionAnchor;
