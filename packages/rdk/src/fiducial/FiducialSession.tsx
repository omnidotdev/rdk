import { useEffect, useRef } from "react";

import { useXR } from "engine/XRSessionProvider";
import { createFiducialBackend } from "fiducial";

import type { PropsWithChildren } from "react";
import type { FiducialSessionOptions } from "fiducial";
import type { XRBackend } from "lib/types/xr";

export interface FiducialSessionProps extends PropsWithChildren {
  /** Fiducial session options. */
  options?: FiducialSessionOptions;
}

/**
 * Manage the fiducial marker detection backend.
 * Registers with the XR session provider and provides AR.js marker tracking capabilities.
 */
const FiducialSession = ({ options, children }: FiducialSessionProps) => {
  const { registerBackend, unregisterBackend } = useXR();

  const backendRef = useRef<XRBackend | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        // create fiducial backend, which creates its own video for AR.js
        const backend = createFiducialBackend({
          ...options,
        });

        if (cancelled) return;

        registerBackend(backend, "FiducialSession");

        if (!cancelled) {
          backendRef.current = backend;
        }
      } catch (err) {
        console.error("[FiducialSession] Failed to initialize:", err);
      }
    };

    initSession();

    return () => {
      cancelled = true;
      if (backendRef.current) {
        unregisterBackend(backendRef.current, "FiducialSession");

        backendRef.current = null;
      }
    };
  }, [registerBackend, unregisterBackend, options]);

  return <>{children}</>;
};

// static property to identify session type for compatibility checking
FiducialSession.sessionType = "FiducialSession";

export default FiducialSession;
