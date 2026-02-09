import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Supported vision backends
 */
export type VisionBackendType = "mediapipe" | "tensorflow" | "onnx" | "opencv";

/**
 * Vision task types
 */
export type VisionTask =
  | "handLandmarks"
  | "faceLandmarks"
  | "poseEstimation"
  | "objectDetection"
  | "segmentation";

/**
 * Hand landmarks detection result
 */
export interface HandLandmarksResult {
  landmarks: NormalizedLandmark[][];
  worldLandmarks: Landmark[][];
  handedness: Array<{
    index: number;
    score: number;
    categoryName: string;
    displayName: string;
  }>;
  timestamp: number;
}

/**
 * Face landmarks detection result
 */
export interface FaceLandmarksResult {
  faceLandmarks: NormalizedLandmark[][];
  faceBlendshapes?: Array<{
    categories: Array<{
      index: number;
      score: number;
      categoryName: string;
      displayName: string;
    }>;
  }>;
  facialTransformationMatrixes?: Float32Array[];
  timestamp: number;
}

/**
 * Pose estimation result
 */
export interface PoseEstimationResult {
  landmarks: NormalizedLandmark[];
  worldLandmarks: Landmark[];
  segmentationMask?: ImageData;
  timestamp: number;
}

/**
 * Generic vision detection result
 */
export type VisionResult =
  | HandLandmarksResult
  | FaceLandmarksResult
  | PoseEstimationResult;

/**
 * Vision backend configuration
 */
export interface VisionBackendConfig {
  /** Backend type */
  type: VisionBackendType;
  /** Vision tasks to enable */
  tasks: VisionTask[];
  /** Model configuration */
  models?: {
    /** Custom model URLs */
    [key in VisionTask]?: string;
  };
  /** Detection confidence threshold */
  minConfidence?: number;
  /** Maximum number of results */
  maxResults?: number;
  /** Enable GPU acceleration */
  useGpu?: boolean;
  /** Custom options per backend */
  backendOptions?: Record<string, unknown>;
}

/**
 * Vision session options
 */
export interface VisionSessionOptions extends VisionBackendConfig {
  /** Video source element */
  videoElement?: HTMLVideoElement;
  /** Auto-start detection */
  autoStart?: boolean;
  /** Detection interval in milliseconds */
  detectionInterval?: number;
}

/**
 * Vision detection event
 */
export interface VisionDetectionEvent {
  task: VisionTask;
  result: VisionResult;
  confidence: number;
  timestamp: number;
}

/**
 * Vision backend internal state
 */
export interface VisionBackendState {
  initialized: boolean;
  running: boolean;
  lastDetection?: VisionDetectionEvent;
  error?: Error;
}
