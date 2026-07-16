import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type {
  ImageTrackingBackendState,
  ImageTrackingInternal,
} from "./imageTrackingBackend";

/**
 * Default state returned when the image tracking backend is not yet initialized.
 */
const IMAGE_TRACKING_PENDING_STATE: ImageTrackingBackendState = {
  isPending: true,
  isSuccess: false,
  controller: null,
  targetMatrices: new Map(),
  dimensions: [],
  stats: { frames: 0 },
};

/**
 * Access the image tracking backend internals.
 * @returns image tracking backend state. `isSuccess` can be checked to verify readiness.
 *
 * @example
 * ```tsx
 * const { targetMatrices, isSuccess } = useImageTrackingBackend();
 *
 * if (isSuccess) {
 *   const matrix = targetMatrices.get(0);
 * }
 * ```
 */
const useImageTrackingBackend = (): ImageTrackingBackendState => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.IMAGE_TRACKING);

  if (!backend) {
    return IMAGE_TRACKING_PENDING_STATE;
  }

  return {
    ...(backend.getInternal() as ImageTrackingInternal),
    isPending: false,
    isSuccess: true,
  };
};

export default useImageTrackingBackend;
