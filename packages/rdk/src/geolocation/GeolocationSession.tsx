import { useThree } from "@react-three/fiber";
import useXRStore, { SESSION_TYPES } from "engine/useXRStore";
import { createGeolocationBackend } from "geolocation";
import { useEffect, useRef } from "react";

import type { GeolocationSessionOptions } from "geolocation";
import type { Backend } from "lib/types/engine";
import type { PropsWithChildren } from "react";

export interface GeolocationSessionProps extends PropsWithChildren {
  /** Geolocation session options. */
  options?: GeolocationSessionOptions;
}

/**
 * Manage the GPS-based AR backend.
 * Registers with the XR session provider and provides LocAR.js geolocation capabilities.
 */
const GeolocationSession = ({
  options = {},
  children,
}: GeolocationSessionProps) => {
  const { scene, camera, gl } = useThree();
  const { registerBackend, unregisterBackend } = useXRStore();

  const backendRef = useRef<Backend | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        // create geolocation backend, which creates its own video for LocAR.js
        const backend = createGeolocationBackend(options);

        if (cancelled) return;

        await registerBackend(
          backend,
          { scene, camera, renderer: gl },
          SESSION_TYPES.GEOLOCATION,
        );

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
        unregisterBackend(backendRef.current, SESSION_TYPES.GEOLOCATION);
      }
    };
  }, [scene, camera, gl, registerBackend, unregisterBackend, options]);

  return children;
};

// static property to identify session type for compatibility checking
GeolocationSession.sessionType = "GeolocationSession";

export default GeolocationSession;
