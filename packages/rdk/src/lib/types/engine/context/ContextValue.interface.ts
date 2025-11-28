import type { Backend } from "../backend";

/**
 * Context value provided by session providers.
 * Supports session-based architecture with shared camera/video resources.
 */
export interface ContextValue {
  /** Shared video element. */
  video?: HTMLVideoElement | null;
  /** Active backends registered by sessions. */
  backends: Backend[];
  /** Register a backend (called by sessions). */
  registerBackend: (backend: Backend, sessionType?: string) => void;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: Backend, sessionType?: string) => void;
}
