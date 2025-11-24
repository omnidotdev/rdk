import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { XRBackend } from "lib/types/xr";
import type { Camera, Scene, WebGLRenderer } from "three";

export const SESSION_TYPES = {
  FIDUCIAL: "FiducialSession",
  GEOLOCATION: "GeolocationSession",
} as const;

export type XRSessionType = (typeof SESSION_TYPES)[keyof typeof SESSION_TYPES];

export interface XRStoreState {
  /** Whether the XR system is ready. */
  isReady: boolean;
  /** Camera source type; video uses shared `getUserMedia`, `webxr` reserved for future `@react-three/xr` */
  camera: "video" | "webxr";
  /** Shared video element when using video camera source. */
  video?: HTMLVideoElement | null;
  /** Active XR backends registered by sessions. */
  backends: XRBackend[];
  /** Active session types for compatibility checking. */
  sessionTypes: Set<XRSessionType>;
  /** Three.js scene reference. */
  scene?: Scene;
  /** Three.js camera reference. */
  threeCamera?: Camera;
  /** Three.js renderer reference. */
  renderer?: WebGLRenderer;
}

export interface XRStoreActions {
  /** Register a backend (called by sessions). */
  registerBackend: (
    backend: XRBackend,
    sessionType?: XRSessionType,
  ) => Promise<void>;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: XRBackend, sessionType?: XRSessionType) => void;
  /** Set Three.js references for backend initialization. */
  setThreeRefs: (refs: {
    scene: Scene;
    camera: Camera;
    renderer: WebGLRenderer;
  }) => void;
  /** Set camera source. */
  setCameraSource: (camera: "video" | "webxr") => void;
  /** Set ready state. */
  setReady: (ready: boolean) => void;
  /** Set shared video element. */
  setVideo: (video: HTMLVideoElement | null) => void;
  /** Update all registered backends (called per frame). */
  updateBackends: () => void;
}

export type XRStore = XRStoreState & XRStoreActions;

const useXRStore = create<XRStore>()(
  subscribeWithSelector((set, get) => ({
    // initial state
    isReady: true,
    camera: "video",
    video: null,
    backends: [],
    sessionTypes: new Set(),
    scene: undefined,
    threeCamera: undefined,
    renderer: undefined,
    // actions
    registerBackend: async (
      backend: XRBackend,
      sessionType?: XRSessionType,
    ) => {
      const state = get();

      try {
        // check for session compatibility before registering
        if (sessionType) {
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

        let currentState = get();

        // wait for Three.js refs to be available before initializing backend
        if (
          !currentState.scene ||
          !currentState.threeCamera ||
          !currentState.renderer
        ) {
          // wait for refs with timeout
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Timeout waiting for Three.js refs"));
            }, 5000);

            const checkRefs = () => {
              const state = get();

              if (state.scene && state.threeCamera && state.renderer) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkRefs, 50);
              }
            };

            checkRefs();
          });

          currentState = get();
        }

        // initialize backend with Three.js refs
        if (
          !currentState.scene ||
          !currentState.threeCamera ||
          !currentState.renderer
        ) {
          throw new Error(
            "Three.js refs not available for backend initialization",
          );
        }

        await backend.init({
          scene: currentState.scene,
          camera: currentState.threeCamera,
          renderer: currentState.renderer,
        });

        set((state) => ({
          backends: [...state.backends, backend],
        }));
      } catch (err) {
        console.error("[XRStore] Failed to register backend:", err);
        throw err;
      }
    },
    unregisterBackend: (backend: XRBackend, sessionType?: XRSessionType) => {
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
    setThreeRefs: (refs) => {
      set({
        scene: refs.scene,
        threeCamera: refs.camera,
        renderer: refs.renderer,
      });
    },
    setCameraSource: (camera) => {
      set({ camera });
    },
    setReady: (ready) => {
      set({ isReady: ready });
    },
    setVideo: (video) => {
      set({ video });
    },
    updateBackends: () => {
      const { backends } = get();

      backends.forEach((backend) => {
        try {
          backend.update?.();
        } catch (err) {
          console.error("[XRStore] Backend update error:", err);
        }
      });
    },
  })),
);

// selector hooks for common use cases
export const useXRReady = () => useXRStore((state) => state.isReady);
export const useXRCamera = () => useXRStore((state) => state.camera);
export const useXRVideo = () => useXRStore((state) => state.video);
export const useXRBackends = () => useXRStore((state) => state.backends);

// non-React access to the store
export const getXRStore = () => useXRStore.getState();
export const subscribeToXRStore = useXRStore.subscribe;

export default useXRStore;
