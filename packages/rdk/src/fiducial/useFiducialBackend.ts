import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type { FiducialBackendState, FiducialInternal } from "./fiducialBackend";

/**
 * Default state returned when fiducial backend is not yet initialized.
 */
const FIDUCIAL_PENDING_STATE: FiducialBackendState = {
  isPending: true,
  isSuccess: false,
  arSource: null,
  arContext: null,
};

/**
 * Access the fiducial backend internals.
 * @returns fiducial backend state. `isSuccess` can be checked to verify readiness.
 *
 * @example
 * ```tsx
 * const { arContext, isSuccess } = useFiducialBackend();
 *
 * if (isSuccess && arContext) {
 *   // use `arContext`
 * }
 * ```
 */
const useFiducialBackend = (): FiducialBackendState => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.FIDUCIAL);

  if (!backend) {
    return FIDUCIAL_PENDING_STATE;
  }

  return {
    ...(backend.getInternal() as FiducialInternal),
    isPending: false,
    isSuccess: true,
  };
};

export default useFiducialBackend;
