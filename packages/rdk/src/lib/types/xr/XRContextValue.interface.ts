/**
 * Context value provided by XRSessionProvider.
 * Supports session-based architecture with shared camera/video resources.
 */
export interface XRContextValue {
  /** Whether the XR system is ready. */
  isReady: boolean;
  /** Camera source type; video uses shared `getUserMedia`, `webxr` reserved for future `@react-three/xr` */
  camera: "video" | "webxr";
  /** Shared video element when using video camera source. */
  video?: HTMLVideoElement | null;
  /** Active XR backends registered by sessions. */
  backends: XRBackend[];
  /** Register a backend (called by sessions). */
  registerBackend: (backend: XRBackend, sessionType?: string) => void;
  /** Unregister a backend (called by sessions). */
  unregisterBackend: (backend: XRBackend, sessionType?: string) => void;
}

import { XRBackend } from "./XRBackend.interface";
