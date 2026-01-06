import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type {
  GeolocationBackendState,
  GeolocationInternal,
} from "./geolocationBackend";

/**
 * Default state returned when geolocation backend is not yet initialized.
 */
const GEOLOCATION_PENDING_STATE: GeolocationBackendState = {
  isPending: true,
  isSuccess: false,
  locar: null,
  webcam: null,
  deviceOrientation: null,
  scene: null,
  camera: null,
  lastPosition: null,
  registerAnchor: () => {},
  unregisterAnchor: () => {},
  getAnchor: () => undefined,
};

/**
 * Access the geolocation backend internals.
 * @returns geolocation backend state. `isSuccess` can be checked to verify readiness.
 *
 * @example
 * ```tsx
 * const { locar, isSuccess } = useGeolocationBackend();
 *
 * if (isSuccess && locar) {
 *   const worldCoords = locar.lonLatToWorldCoords(lon, lat);
 * }
 * ```
 */
const useGeolocationBackend = (): GeolocationBackendState => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.GEOLOCATION);

  if (!backend) {
    return GEOLOCATION_PENDING_STATE;
  }

  return {
    ...(backend.getInternal() as GeolocationInternal),
    isPending: false,
    isSuccess: true,
  };
};

export default useGeolocationBackend;
