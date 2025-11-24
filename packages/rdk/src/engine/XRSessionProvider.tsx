import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

import useXRStore from "./useXRStore";

import type { PropsWithChildren } from "react";

interface XRSessionProviderProps extends PropsWithChildren {
  /** Camera source type. */
  cameraSource: "video" | "webxr";
}

/**
 * Session-based XR provider that manages shared resources and backend registry.
 * Sessions register their backends and get access to shared camera/video resources.
 * For performance, the provider passes Three.js refs per frame instead of storing them.
 */
const XRSessionProvider = ({
  cameraSource,
  children,
}: XRSessionProviderProps) => {
  const { setCameraSource, updateBackends } = useXRStore();

  // initialize camera source
  useEffect(() => {
    setCameraSource(cameraSource);
  }, [cameraSource, setCameraSource]);

  // update all registered backends per frame with fresh Three.js refs
  useFrame((_state, delta) => {
    updateBackends(delta);
  });

  return children;
};

export default XRSessionProvider;
