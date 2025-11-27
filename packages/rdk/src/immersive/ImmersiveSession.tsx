import { createXRStore, XR as ReactThreeXR } from "@react-three/xr";
import { useEffect, useMemo } from "react";

import { getXRStore, SESSION_TYPES } from "../engine/useXRStore";

import type { PropsWithChildren } from "react";

/**
 * Immersive session component for WebXR AR/VR experiences, powered by `@react-three/xr`.
 */
const ImmersiveSession = ({ children }: PropsWithChildren) => {
  const xrStore = useMemo(() => createXRStore(), []);

  useEffect(() => {
    const rdkStore = getXRStore();

    // add immersive session type to RDK store
    rdkStore.sessionTypes.add(SESSION_TYPES.IMMERSIVE);

    // connect XR store to RDK store
    rdkStore.setImmersiveStore(xrStore);

    return () => {
      // clean up on unmount
      rdkStore.sessionTypes.delete(SESSION_TYPES.IMMERSIVE);

      rdkStore.setImmersiveStore(null);
    };
  }, [xrStore]);

  return <ReactThreeXR store={xrStore}>{children}</ReactThreeXR>;
};

export default ImmersiveSession;
