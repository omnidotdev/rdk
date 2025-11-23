import { useFrame, useThree } from "@react-three/fiber";
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
 */
const XRSessionProvider = ({
  cameraSource,
  children,
}: XRSessionProviderProps) => {
  const { scene, camera: threeCamera, gl } = useThree();
  const { setCameraSource, setThreeRefs, updateBackends } = useXRStore();

  // initialize store with Three.js references and camera source
  useEffect(() => {
    setThreeRefs({
      scene,
      camera: threeCamera,
      renderer: gl,
    });

    setCameraSource(cameraSource);
  }, [scene, threeCamera, gl, cameraSource, setThreeRefs, setCameraSource]);

  // update all registered backends per frame
  useFrame(() => {
    updateBackends();
  });

  return <>{children}</>;
};

export default XRSessionProvider;
