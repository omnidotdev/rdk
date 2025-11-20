import { useEffect, useRef } from "react";

import { useXR } from "engine/XRSessionProvider";
import { createGeolocationBackend } from "geolocation";

import type { PropsWithChildren } from "react";
import type { GeolocationSessionOptions } from "geolocation";
import type { XRBackend } from "lib/types/xr";

export interface GeolocationSessionProps extends PropsWithChildren {
  /** Geolocation session options. */
  options?: GeolocationSessionOptions;
}

/**
 * Manage the GPS-based AR backend.
 * Registers with the XR session provider and provides LocAR.js geolocation capabilities.
 */
const GeolocationSession = ({ options, children }: GeolocationSessionProps) => {
  const { registerBackend, unregisterBackend } = useXR();

  const backendRef = useRef<XRBackend | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        // create geolocation backend - disable video if fiducial session is present
        const backend = createGeolocationBackend({
          ...options,
        });

        if (cancelled) return;

        registerBackend(backend, "GeolocationSession");

        if (!cancelled) {
          backendRef.current = backend;
        }
      } catch (err) {
        console.error("[GeolocationSession] Failed to initialize:", err);
      }
    };

    initSession();

    return () => {
      cancelled = true;

      if (backendRef.current) {
        unregisterBackend(backendRef.current, "GeolocationSession");

        backendRef.current = null;
      }
    };
  }, [registerBackend, unregisterBackend, options]);

  return <>{children}</>;
};

// static property to identify session type for compatibility checking
GeolocationSession.sessionType = "GeolocationSession";

export default GeolocationSession;
