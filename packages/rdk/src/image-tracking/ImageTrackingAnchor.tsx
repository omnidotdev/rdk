import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import useImageTrackingBackend from "./useImageTrackingBackend";

import type { PropsWithChildren } from "react";
import type { Group } from "three";

export interface ImageTrackingAnchorProps extends PropsWithChildren {
  /** Index of the target within the compiled `.mind` file. */
  target?: number;
  /** Callback triggered when the target becomes visible. */
  onTargetFound?: () => void;
  /** Callback triggered when the target is lost. */
  onTargetLost?: () => void;
}

/**
 * Image tracking anchor that attaches its child group to a tracked reference
 * image. The group is driven directly by MindAR's world matrix each frame.
 */
const ImageTrackingAnchor = ({
  target = 0,
  onTargetFound,
  onTargetLost,
  children,
}: ImageTrackingAnchorProps) => {
  const groupRef = useRef<Group>(null);
  const visibleRef = useRef(false);
  const { targetMatrices, isSuccess } = useImageTrackingBackend();

  useFrame(() => {
    const group = groupRef.current;

    if (!group) return;

    const matrix = isSuccess ? targetMatrices.get(target) : null;

    if (matrix) {
      group.matrix.fromArray(matrix);

      if (!visibleRef.current) {
        visibleRef.current = true;
        group.visible = true;
        onTargetFound?.();
      }
    } else if (visibleRef.current) {
      visibleRef.current = false;
      group.visible = false;
      onTargetLost?.();
    }
  });

  return (
    <group
      ref={groupRef}
      // MindAR drives the matrix directly; disable auto-update so Three.js does
      // not overwrite it from position/rotation/scale each frame
      matrixAutoUpdate={false}
      // start invisible until the target is found
      visible={false}
    >
      {children}
    </group>
  );
};

export default ImageTrackingAnchor;
