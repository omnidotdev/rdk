import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";

import type { GeolocationInternal } from "./geolocationBackend";

/**
 * Access the geolocation backend internals.
 * @returns geolocation backend or null if no geolocation session is active.
 *
 * @example
 * ```tsx
 * const geo = useGeolocationBackend();
 * const worldCoords = geo?.locar?.lonLatToWorldCoords(lon, lat);
 * ```
 */
const useGeolocationBackend = (): GeolocationInternal | null => {
  const backends = useXRStore((state) => state.backends);

  const backend = backends.get(BACKEND_TYPES.GEOLOCATION);

  return (backend?.getInternal() as GeolocationInternal) ?? null;
};

export default useGeolocationBackend;
