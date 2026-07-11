import { useThree } from "@react-three/fiber";
import useXRStore from "engine/useXRStore";
import { useEffect, useRef } from "react";

import createVisionBackend from "./visionBackend";

import type { Backend } from "lib/types/engine";
import type React from "react";
import type { VisionSessionOptions } from "./types";

export type VisionSessionProps = {
  /** Vision session configuration */
  options: VisionSessionOptions;
  /** Children to render inside the session */
  children?: React.ReactNode;
  /** Error callback */
  onError?: (error: Error) => void;
};

/**
 * Vision session component that creates and registers the vision backend
 * with the XR store, providing detection context to child components.
 * Must render inside a `@react-three/fiber` Canvas (uses `useThree`).
 */
const VisionSession: React.FC<VisionSessionProps> = ({
  options,
  children,
  onError,
}) => {
  const { scene, camera, gl } = useThree();

  const { registerBackend, unregisterBackend } = useXRStore();

  const backendRef = useRef<Backend | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    // already initialized for this component instance
    if (backendRef.current) return;

    let cancelled = false;

    const initSession = async () => {
      try {
        const backend = createVisionBackend(optionsRef.current);

        if (cancelled) return;

        await registerBackend(backend, { scene, camera, renderer: gl });

        // Cleanup may have run during the await; don't leak the registration
        if (cancelled) {
          unregisterBackend(backend);
          return;
        }

        backendRef.current = backend;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[VisionSession] Failed to initialize:", error);
        onErrorRef.current?.(error);
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

  return <>{children}</>;
};

export default VisionSession;
