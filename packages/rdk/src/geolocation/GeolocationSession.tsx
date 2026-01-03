import { useThree } from "@react-three/fiber";
import useXRStore from "engine/useXRStore";
import { createGeolocationBackend } from "geolocation";
import { useEffect, useRef } from "react";

import type { Backend } from "lib/types/engine";
import type { PropsWithChildren } from "react";
// NB: relative type import path resolves downstream type issues
import type { GeolocationSessionOptions } from "./geolocationBackend";

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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // already initialized for this component instance
    if (backendRef.current) return;

    let cancelled = false;

    const initSession = async () => {
      try {
        // create geolocation backend, which creates its own video for LocAR.js
        const backend = createGeolocationBackend(optionsRef.current);

        if (cancelled) return;

        await registerBackend(backend, { scene, camera, renderer: gl });

        backendRef.current = backend;
      } catch (err) {
        console.error("[GeolocationSession] Failed to initialize:", err);
      }
    };

    initSession();

    return () => {
      cancelled = true;

      if (backendRef.current) {
        unregisterBackend(backendRef.current);

        backendRef.current = null;
      }
    };
  }, [scene, camera, gl, registerBackend, unregisterBackend]);

  return children;
};

export default GeolocationSession;
