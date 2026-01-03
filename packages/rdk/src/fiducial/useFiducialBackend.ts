import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type { FiducialInternal } from "./fiducialBackend";

/**
 * Access the fiducial backend internals.
 * @returns fiducial backend or null if no fiducial session is active.
 *
 * @example
 * ```tsx
 * const fiducial = useFiducialBackend();
 * const arContext = fiducial?.arContext;
 * ```
 */
const useFiducialBackend = (): FiducialInternal | null => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.FIDUCIAL);

  return (backend?.getInternal() as FiducialInternal) ?? null;
};

export default useFiducialBackend;
