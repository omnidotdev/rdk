import type { CameraSource } from "..";
import type { Backend } from "../backend";

/**
 * Context value provided by spatial session providers.
 * Supports session-based architecture with shared camera/video resources.
 */
export interface ContextValue {
  /** Whether the spatial system is ready. */
  isReady: boolean;
  /** Camera source type; video uses shared `getUserMedia`, `webxr` reserved for future `@react-three/xr` */
  camera: CameraSource;
  /** Shared video element when using video camera source. */
  video?: HTMLVideoElement | null;
  /** Active spatial backends registered by sessions. */
  backends: Backend[];
  /** Register a backend (called by sessions). */
  registerBackend: (backend: Backend, sessionType?: string) => void;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: Backend, sessionType?: string) => void;
}
