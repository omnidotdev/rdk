import { createXRStore, XR as ReactThreeXR } from "@react-three/xr";
import { useMemo } from "react";

import type { PropsWithChildren } from "react";

// TODO implement iOS fallback; iOS does not currently support WebXR, but graceful degradation from WebXR → a magic window mode with environment passthrough can serve as a stopgap solution

/**
 * Immersive session component for WebXR AR/VR experiences, powered by `@react-three/xr`.
 */
const ImmersiveSession = ({ children }: PropsWithChildren) => {
  const xrStore = useMemo(() => createXRStore(), []);

  return <ReactThreeXR store={xrStore}>{children}</ReactThreeXR>;
};

export default ImmersiveSession;
