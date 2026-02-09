// Worker message and result types for off-main-thread vision processing

export interface VisionWorkerMessage {
  type: "init" | "process" | "dispose";
  payload?: {
    imageData?: ImageData;
    timestamp?: number;
    // biome-ignore lint/suspicious/noExplicitAny: worker payload is dynamic
    options?: any;
  };
}

export interface VisionWorkerResponse {
  type: "initialized" | "result" | "error";
  result?: VisionResult;
  error?: string;
}

export interface VisionResult {
  hands: Array<{
    landmarks: Array<{ x: number; y: number; z: number }>;
    confidence: number;
  }>;
  faces: Array<{
    landmarks: Array<{ x: number; y: number; z: number }>;
    confidence: number;
  }>;
  poses: Array<{
    landmarks: Array<{ x: number; y: number; z: number }>;
    confidence: number;
  }>;
  timestamp: number;
  frameSize: { width: number; height: number };
}

export interface VisionDetection extends VisionResult {
  // Same as VisionResult for now, can extend later
}
