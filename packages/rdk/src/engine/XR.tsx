import { useFrame } from "@react-three/fiber";

import useXRStore from "./useXRStore";

import type { PropsWithChildren } from "react";

/**
 * Extended reality context provider for nested architecture inside R3F Canvas.
 *
 * Manages shared resources and backend registry. Sessions register their backends and automatically configure the system based on their requirements.
 *
 * For performance, passes Three.js refs per frame instead of storing them.
 */
const XR = ({ children }: PropsWithChildren) => {
  const { updateBackends } = useXRStore();

  // update all registered backends per frame with fresh Three.js refs
  useFrame((_state, delta) => {
    updateBackends(delta);
  });

  return children;
};

export default XR;
