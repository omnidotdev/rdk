import { useThree } from "@react-three/fiber";
import useXRStore from "engine/useXRStore";
import { BACKEND_TYPES } from "lib/types/engine";
import React, { useEffect, useRef, useState } from "react";

import VisionManager from "./VisionManager";

import type { Backend } from "lib/types/engine";
import type { PropsWithChildren } from "react";

export interface VisionSessionOptions {
  enableHands?: boolean;
  enableFaces?: boolean;
  enablePoses?: boolean;
  minConfidence?: number;
  maxResults?: number;
  throttle?: number;
}

export interface VisionSessionProps extends PropsWithChildren {
  /** Vision session options */
  options?: VisionSessionOptions;
}

// Backend wrapper for VisionManager
const createVisionBackend = (manager: VisionManager): Backend => ({
  type: BACKEND_TYPES.VISION,

  async init(): Promise<void> {
    // VisionManager handles its own initialization
  },

  update(): void {
    // Vision processing happens off-main-thread
  },

  dispose(): void {
    manager.dispose();
  },

  getInternal() {
    return manager;
  },
});

// Context for accessing vision manager
const VisionContext = React.createContext<{
  manager: VisionManager | null;
  isReady: boolean;
  error: Error | null;
}>({
  manager: null,
  isReady: false,
  error: null,
});

export const useVision = () => React.useContext(VisionContext);

/**
 * Manage the vision ML processing backend.
 * Registers with the XR session provider and provides off-main-thread vision capabilities.
 */
const VisionSession = ({
  options = {
    enableHands: true,
    enableFaces: false,
    enablePoses: false,
    minConfidence: 0.7,
    maxResults: 2,
    throttle: 16,
  },
  children,
}: VisionSessionProps) => {
  const { scene, camera, gl } = useThree();

  const { registerBackend, unregisterBackend } = useXRStore();

  const managerRef = useRef<VisionManager | null>(null);
  const backendRef = useRef<Backend | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        // Create vision manager
        const manager = new VisionManager(options);
        managerRef.current = manager;

        // Initialize
        await manager.initialize();

        if (cancelled) return;

        // Create backend wrapper
        const backend = createVisionBackend(manager);
        backendRef.current = backend;

        // Register with RDK
        await registerBackend(backend, { scene, camera, renderer: gl });

        // Start detection
        manager.startDetection();

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error("[VisionSession] Failed to initialize:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initSession();

    return () => {
      cancelled = true;

      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }

      if (backendRef.current) {
        unregisterBackend(backendRef.current);
        backendRef.current = null;
      }

      setIsReady(false);
    };
  }, [scene, camera, gl, registerBackend, unregisterBackend, options]);

  return (
    <VisionContext.Provider
      value={{ manager: managerRef.current, isReady, error }}
    >
      {children}
    </VisionContext.Provider>
  );
};

export default VisionSession;
