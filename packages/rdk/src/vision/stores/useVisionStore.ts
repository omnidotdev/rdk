import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type {
  VisionBackendType,
  VisionDetectionEvent,
  VisionSessionOptions,
  VisionTask,
} from "../types";

export interface VisionStoreState {
  /** Active vision sessions */
  sessions: Map<string, VisionSessionOptions>;
  /** Latest detection results per task */
  detections: Map<VisionTask, VisionDetectionEvent>;
  /** Active backend types */
  activeBackends: Set<VisionBackendType>;
  /** Global vision state */
  isInitialized: boolean;
  isRunning: boolean;
  error: Error | null;
}

export interface VisionStoreActions {
  /** Register a vision session */
  registerSession: (sessionId: string, options: VisionSessionOptions) => void;
  /** Unregister a vision session */
  unregisterSession: (sessionId: string) => void;
  /** Update detection result */
  updateDetection: (task: VisionTask, event: VisionDetectionEvent) => void;
  /** Set global vision state */
  setInitialized: (initialized: boolean) => void;
  setRunning: (running: boolean) => void;
  setError: (error: Error | null) => void;
  /** Clear all detections */
  clearDetections: () => void;
  /** Get latest detection for a task */
  getDetection: (task: VisionTask) => VisionDetectionEvent | undefined;
}

export type VisionStore = VisionStoreState & VisionStoreActions;

const useVisionStore = create<VisionStore>()(
  subscribeWithSelector((set, get) => ({
    // initial state
    sessions: new Map(),
    detections: new Map(),
    activeBackends: new Set(),
    isInitialized: false,
    isRunning: false,
    error: null,

    // actions
    registerSession: (sessionId: string, options: VisionSessionOptions) => {
      set((state) => {
        const newSessions = new Map(state.sessions);
        const newActiveBackends = new Set(state.activeBackends);

        newSessions.set(sessionId, options);
        newActiveBackends.add(options.type);

        return {
          sessions: newSessions,
          activeBackends: newActiveBackends,
        };
      });
    },

    unregisterSession: (sessionId: string) => {
      set((state) => {
        const newSessions = new Map(state.sessions);
        const session = newSessions.get(sessionId);

        if (!session) return state;

        newSessions.delete(sessionId);

        // Check if backend is still used by other sessions
        const newActiveBackends = new Set(state.activeBackends);
        const hasOtherSessionsWithSameBackend = Array.from(
          newSessions.values(),
        ).some((s) => s.type === session.type);

        if (!hasOtherSessionsWithSameBackend) {
          newActiveBackends.delete(session.type);
        }

        return {
          sessions: newSessions,
          activeBackends: newActiveBackends,
        };
      });
    },

    updateDetection: (task: VisionTask, event: VisionDetectionEvent) => {
      set((state) => {
        const newDetections = new Map(state.detections);
        newDetections.set(task, event);

        return {
          detections: newDetections,
          // Clear error on successful detection
          error: null,
        };
      });
    },

    setInitialized: (initialized: boolean) => {
      set({ isInitialized: initialized });
    },

    setRunning: (running: boolean) => {
      set({ isRunning: running });
    },

    setError: (error: Error | null) => {
      set({ error });
    },

    clearDetections: () => {
      set({ detections: new Map() });
    },

    getDetection: (task: VisionTask) => {
      const state = get();
      return state.detections.get(task);
    },
  })),
);

// non-React access to the store
export const getVisionStore = () => useVisionStore.getState();
export const subscribeToVisionStore = useVisionStore.subscribe;

export default useVisionStore;
