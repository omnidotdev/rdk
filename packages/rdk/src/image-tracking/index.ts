export { createWebcamFrameSource } from "./frameSource";
export { default as ImageTrackingAnchor } from "./ImageTrackingAnchor";
export { default as ImageTrackingSession } from "./ImageTrackingSession";
export { default as createImageTrackingBackend } from "./imageTrackingBackend";
export { default as useImageTrackingBackend } from "./useImageTrackingBackend";

export type { FrameSource, WebcamFrameSourceOptions } from "./frameSource";
export type { ImageTrackingAnchorProps } from "./ImageTrackingAnchor";
export type { ImageTrackingSessionProps } from "./ImageTrackingSession";
export type {
  ImageTrackingBackendState,
  ImageTrackingInternal,
  ImageTrackingSessionOptions,
} from "./imageTrackingBackend";
