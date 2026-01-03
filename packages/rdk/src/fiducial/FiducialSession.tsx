import { useThree } from "@react-three/fiber";
import useXRStore from "engine/useXRStore";
import { createFiducialBackend } from "fiducial";
import { useEffect, useRef } from "react";

import type { Backend } from "lib/types/engine";
import type { PropsWithChildren } from "react";
// NB: relative type import path resolves downstream type issues
import type { FiducialSessionOptions } from "./fiducialBackend";

export interface FiducialSessionProps extends PropsWithChildren {
  /** Fiducial session options. */
  options?: FiducialSessionOptions;
}

/**
 * Manage the fiducial marker detection backend.
 * Registers with the XR session provider and provides AR.js marker tracking capabilities.
 */
const FiducialSession = ({ options = {}, children }: FiducialSessionProps) => {
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
        // create fiducial backend, which creates its own video for AR.js
        const backend = createFiducialBackend(optionsRef.current);

        if (cancelled) return;

        await registerBackend(backend, { scene, camera, renderer: gl });

        backendRef.current = backend;
      } catch (err) {
        console.error("[FiducialSession] Failed to initialize:", err);
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

export default FiducialSession;
