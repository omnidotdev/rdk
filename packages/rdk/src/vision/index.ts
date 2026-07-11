export { default as CameraBackground } from "./CameraBackground";
export {
  DEFAULT_GESTURES,
  detectGesture,
  fist,
  ok,
  openHand,
  peace,
  thumbsUp,
} from "./gestures";
export { default as HandTracker } from "./HandTracker";
export { landmarksCentroid, landmarkToWorld } from "./landmarkMapping";
export { COCO_LABELS, rfDetr, yolo } from "./presets";
export { default as useVisionBackend } from "./useVisionBackend";
export { default as useVisionFrame } from "./useVisionFrame";
export { default as VisionAnchor } from "./VisionAnchor";
export { default as VisionDebug } from "./VisionDebug";
export { default as VisionOverlay } from "./VisionOverlay";
export { default as VisionSession } from "./VisionSession";
export { default as VisionStatus } from "./VisionStatus";
export { default as createVisionBackend } from "./visionBackend";

export type { CameraBackgroundProps } from "./CameraBackground";
export type { GestureDetector, GestureResult } from "./gestures";
export type { HandTrackerProps } from "./HandTracker";
export type { FrameSize, Viewport } from "./landmarkMapping";
export type { PresetOverrides } from "./presets";
export type {
  LandmarkDetection,
  ObjectDetection,
  ONNXDecoderName,
  ONNXModelConfig,
  VisionFrame,
  VisionLandmark,
  VisionProgress,
  VisionProvider,
  VisionSessionOptions,
  VisionTask,
} from "./types";
export type { UseVisionFrameOptions } from "./useVisionFrame";
export type { VisionAnchorProps } from "./VisionAnchor";
export type { VisionDebugProps } from "./VisionDebug";
export type { VisionOverlayProps } from "./VisionOverlay";
export type { VisionSessionProps } from "./VisionSession";
export type { VisionStatusProps } from "./VisionStatus";
export type {
  VisionBackendState,
  VisionInternal,
} from "./visionBackend";
