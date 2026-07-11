import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type { VisionBackendState, VisionInternal } from "./visionBackend";

/** Default state when vision backend is not yet initialized */
const VISION_PENDING_STATE: VisionBackendState = {
  isPending: true,
  isSuccess: false,
  provider: null,
  videoElement: null,
  onDetection: () => () => {},
};

/**
 * Access the vision backend internals.
 * @returns vision backend state with `isSuccess` to verify readiness
 */
const useVisionBackend = (): VisionBackendState => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.VISION);

  if (!backend) {
    return VISION_PENDING_STATE;
  }

  // Note: onDetection is a stable reference (hoisted in visionBackend.ts).
  // Consumers should destructure individual values rather than depending
  // on the object identity of this return value.
  return {
    ...(backend.getInternal() as VisionInternal),
    isPending: false,
    isSuccess: true,
  };
};

export default useVisionBackend;
