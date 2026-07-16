import { useThree } from "@react-three/fiber";
import useXRStore from "engine/useXRStore";
import { createImageTrackingBackend } from "image-tracking";
import { useEffect, useRef } from "react";

import type { Backend } from "lib/types/engine";
import type { PropsWithChildren } from "react";
// NB: relative type import path resolves downstream type issues
import type { ImageTrackingSessionOptions } from "./imageTrackingBackend";

export interface ImageTrackingSessionProps extends PropsWithChildren {
  /** Image tracking session options. */
  options: ImageTrackingSessionOptions;
}

/**
 * Manage the natural-feature image tracking backend.
 * Registers with the XR session provider and provides MindAR image tracking.
 */
const ImageTrackingSession = ({
  options,
  children,
}: ImageTrackingSessionProps) => {
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
        const backend = createImageTrackingBackend(optionsRef.current);

        if (cancelled) return;

        await registerBackend(backend, { scene, camera, renderer: gl });

        backendRef.current = backend;
      } catch (err) {
        console.error("[ImageTrackingSession] Failed to initialize:", err);
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

export default ImageTrackingSession;
