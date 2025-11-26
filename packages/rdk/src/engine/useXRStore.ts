import { useXRStore as useReactThreeXRStore } from "@react-three/xr";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { Backend } from "lib/types/engine";
import type { Camera, Scene, WebGLRenderer } from "three";

export const SESSION_TYPES = {
  FIDUCIAL: "FiducialSession",
  GEOLOCATION: "GeolocationSession",
  IMMERSIVE: "ImmersiveSession",
} as const;

export type XRSessionType = (typeof SESSION_TYPES)[keyof typeof SESSION_TYPES];

export interface XRStoreState {
  /** Shared video element. */
  video?: HTMLVideoElement | null;
  /** Active backends registered by sessions. */
  backends: Backend[];
  /** Active session types for compatibility checking. */
  sessionTypes: Set<XRSessionType>;
}

export interface XRStoreActions {
  /** Register a backend (called by sessions). */
  registerBackend: (
    backend: Backend,
    threeRefs: { scene: Scene; camera: Camera; renderer: WebGLRenderer },
    sessionType?: XRSessionType,
  ) => Promise<void>;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: Backend, sessionType?: XRSessionType) => void;
  /** Set shared video element. */
  setVideo: (video: HTMLVideoElement | null) => void;
  /** Update all registered backends (called per frame). */
  updateBackends: (dt?: number) => void;
}

export type XRStore = XRStoreState & XRStoreActions;

const useXRStoreBase = create<XRStore>()(
  subscribeWithSelector((set, get) => ({
    // initial state
    video: null,
    backends: [],
    sessionTypes: new Set(),
    // actions
    registerBackend: async (
      backend: Backend,
      threeRefs: { scene: Scene; camera: Camera; renderer: WebGLRenderer },
      sessionType?: XRSessionType,
    ) => {
      try {
        // check for session compatibility before registering
        if (sessionType) {
          const state = get();

          const newSessionTypes = new Set([...state.sessionTypes, sessionType]);

          const hasFiducial = newSessionTypes.has(SESSION_TYPES.FIDUCIAL);
          const hasGeolocation = newSessionTypes.has(SESSION_TYPES.GEOLOCATION);

          if (hasFiducial && hasGeolocation) {
            const errorMessage = `❌ [RDK] INCOMPATIBLE SESSIONS: ${SESSION_TYPES.FIDUCIAL} and ${SESSION_TYPES.GEOLOCATION} cannot be used together due to camera/video conflicts between AR.js and LocAR.js libraries. Use only one session type per app.`;

            console.error(errorMessage);
            throw new Error(errorMessage);
          }

          set(() => ({
            sessionTypes: newSessionTypes,
          }));
        }

        // initialize backend with provided Three.js refs
        await backend.init({
          scene: threeRefs.scene,
          camera: threeRefs.camera,
          renderer: threeRefs.renderer,
        });

        set((state) => ({
          backends: [...state.backends, backend],
        }));
      } catch (err) {
        console.error("[XRStore] Failed to register backend:", err);

        throw err;
      }
    },
    unregisterBackend: (backend: Backend, sessionType?: XRSessionType) => {
      set((state) => {
        const newSessionTypes = new Set(state.sessionTypes);

        if (sessionType) newSessionTypes.delete(sessionType);

        const newBackends = state.backends.filter((b) => b !== backend);

        // yeet the backend
        try {
          backend.dispose?.();
        } catch (err) {
          console.error("[XRStore] Error disposing backend:", err);
        }

        return {
          backends: newBackends,
          sessionTypes: newSessionTypes,
        };
      });
    },

    setVideo: (video) => {
      set({ video });
    },
    updateBackends: (dt?: number) => {
      const { backends } = get();

      backends.forEach((backend) => {
        try {
          backend.update?.(dt);
        } catch (err) {
          console.error("[XRStore] Backend update error:", err);
        }
      });
    },
  })),
);

// non-React access to the store
export const getXRStore = () => useXRStoreBase.getState();
export const subscribeToXRStore = useXRStoreBase.subscribe;

/**
 * Unified XR hook that provides orchestrated RDK session state.
 */
const useXRStore = () => {
  const rdkStore = useXRStoreBase();
  const reactThreeXrStore = useReactThreeXRStore();

  const isImmersive = rdkStore.sessionTypes.has(SESSION_TYPES.IMMERSIVE);

  const immersive = isImmersive ? reactThreeXrStore : null;

  return {
    ...rdkStore,
    isImmersive,
    immersive,
  };
};

export default useXRStore;
