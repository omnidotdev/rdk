/** Single 3D landmark point */
export type VisionLandmark = {
  x: number;
  y: number;
  z: number;
};

/** Detected landmark group (hand, face, or pose) with confidence */
export type LandmarkDetection = {
  landmarks: VisionLandmark[];
  confidence: number;
};

/** Detected object with bounding box */
export type ObjectDetection = {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/** A single frame of vision detection results */
export type VisionFrame = {
  hands: LandmarkDetection[];
  faces: LandmarkDetection[];
  poses: LandmarkDetection[];
  objects: ObjectDetection[];
  timestamp: number;
  frameSize: { width: number; height: number };
  processingTime?: number;
  segmentationMask?: ImageData;
};

/** Supported vision tasks */
export type VisionTask = "hands" | "faces" | "poses" | "objects";

/** Identifier of a registered ONNX output decoder */
export type ONNXDecoderName = "yolo" | "rfdetr";

/** ONNX model configuration */
export type ONNXModelConfig = {
  name: string;
  path: string;
  /** Square input side length the model expects (default 640) */
  inputSize?: number;
  /** Class labels indexed by class id (defaults to COCO-80) */
  labels?: string[];
  /** Which registered decoder interprets this model's raw outputs (default "yolo") */
  decoder?: ONNXDecoderName;
};

/** Progress callback payload */
export type VisionProgress = {
  step: number;
  total: number;
  label: string;
};

/** Options for creating a vision session */
export type VisionSessionOptions = {
  /** Which provider to use */
  provider?: "mediapipe" | "onnx";
  /** Vision tasks to enable */
  tasks?: VisionTask[];
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Maximum results per task */
  maxResults?: number;
  /** Frame processing throttle in ms */
  throttle?: number;
  /** Use GPU acceleration */
  useGpu?: boolean;
  /** Compute a pose segmentation mask (MediaPipe pose only; costly, default off) */
  segmentation?: boolean;
  /** External video element (skip internal camera setup) */
  videoElement?: HTMLVideoElement;
  /** Progress callback for model loading */
  onProgress?: (progress: VisionProgress | null) => void;
  /** ONNX-specific options */
  onnx?: {
    models: ONNXModelConfig[];
  };
};

/** Vision provider interface */
export type VisionProvider = {
  readonly type: string;
  initialize(video: HTMLVideoElement): Promise<void>;
  startDetection(): void;
  stopDetection(): void;
  onDetection(callback: (frame: VisionFrame) => void): () => void;
  dispose(): void;
};
