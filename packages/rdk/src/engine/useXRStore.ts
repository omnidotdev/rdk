import { BACKEND_TYPES } from "lib/types/engine";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import type { XRStore as ReactThreeXRStore } from "@react-three/xr";
import type { Backend, BackendType } from "lib/types/engine";
import type { Camera, Scene, WebGLRenderer } from "three";

interface BaseXRStoreState {
  /** Shared video element. */
  video?: HTMLVideoElement | null;
  /** Active backends registered by sessions. */
  backends: Map<BackendType, Backend>;
  /** Store instance for immersive sessions. */
  immersiveStore?: ReactThreeXRStore | null;
}

interface BaseXRStoreActions {
  /** Register a backend (called by sessions). */
  registerBackend: (
    backend: Backend,
    threeRefs: { scene: Scene; camera: Camera; renderer: WebGLRenderer },
  ) => Promise<void>;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: Backend) => void;
  /** Set shared video element. */
  setVideo: (video: HTMLVideoElement | null) => void;
  /** Update all registered backends (called per frame). */
  updateBackends: (dt?: number) => void;
  /** Set immersive store instance. */
  setImmersiveStore: (store: ReactThreeXRStore | null) => void;
}

type BaseXRStore = BaseXRStoreState & BaseXRStoreActions;

export type XRStore = BaseXRStore & {
  isImmersive: boolean;
  immersive: ReactThreeXRStore | null;
};

const useXRStoreBase = create<BaseXRStore>()(
  subscribeWithSelector((set, get) => ({
    // initial state
    video: null,
    backends: new Map(),
    immersiveStore: null,
    // actions
    registerBackend: async (
      backend: Backend,
      threeRefs: { scene: Scene; camera: Camera; renderer: WebGLRenderer },
    ) => {
      try {
        // check for session compatibility before registering
        const state = get();
        const existingTypes = new Set(state.backends.keys());

        const hasFiducial =
            existingTypes.has(BACKEND_TYPES.FIDUCIAL) ||
            backend.type === BACKEND_TYPES.FIDUCIAL,
          hasGeolocation =
            existingTypes.has(BACKEND_TYPES.GEOLOCATION) ||
            backend.type === BACKEND_TYPES.GEOLOCATION;

        if (hasFiducial && hasGeolocation) {
          const errorMessage = `❌ [RDK] INCOMPATIBLE SESSIONS: Fiducial and Geolocation backends cannot be used together due to camera/video conflicts between AR.js and LocAR.js libraries. Use only one session type per app.`;

          console.error(errorMessage);

          throw new Error(errorMessage);
        }

        // initialize backend with provided Three.js refs
        await backend.init({
          scene: threeRefs.scene,
          camera: threeRefs.camera,
          renderer: threeRefs.renderer,
        });

        set((state) => {
          const newBackends = new Map(state.backends);

          newBackends.set(backend.type, backend);

          return { backends: newBackends };
        });
      } catch (err) {
        console.error("[XRStore] Failed to register backend:", err);

        throw err;
      }
    },
    unregisterBackend: (backend: Backend) => {
      set((state) => {
        const newBackends = new Map(state.backends);

        newBackends.delete(backend.type);

        // yeet the backend
        try {
          backend.dispose?.();
        } catch (err) {
          console.error("[XRStore] Error disposing backend:", err);
        }

        return { backends: newBackends };
      });
    },
    setVideo: (video) => {
      set({ video });
    },
    updateBackends: (dt?: number) => {
      const { backends } = get();

      for (const backend of backends.values()) {
        try {
          backend.update?.(dt);
        } catch (err) {
          console.error("[XRStore] Backend update error:", err);
        }
      }
    },
    setImmersiveStore: (store) => {
      set({ immersiveStore: store });
    },
  })),
);

// non-React access to the store
export const getXRStore = () => useXRStoreBase.getState();
export const subscribeToXRStore = useXRStoreBase.subscribe;

/**
 * Unified XR hook that provides orchestrated RDK session state.
 */
const useXRStore = <S = XRStore>(selector?: (state: XRStore) => S) => {
  const rdkStore = useXRStoreBase(
    useShallow((state) => {
      const unifiedState = {
        ...state,
        isImmersive: state.backends.has(BACKEND_TYPES.IMMERSIVE),
        immersive: state.immersiveStore || null,
      };

      // support both selector pattern used by components (e.g. `useXRStore(state => state.backends))` and direct usage by consumers that need the full unified state (e.g. `const { immersive } = useXRStore()`)
      return selector ? selector(unifiedState) : unifiedState;
    }),
  );

  return rdkStore as S;
};

export default useXRStore;
