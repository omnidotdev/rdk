import type { ObjectDetection, ONNXModelConfig } from "../types";

export type { VisionProgress } from "../types";

/** Options forwarded to the worker for a single processed frame */
export type ONNXProcessOptions = {
  minConfidence: number;
  maxResults: number;
};

/** Result payload the ONNX worker produces for a processed frame */
export type ONNXWorkerResult = {
  detections: ObjectDetection[];
  frameSize: { width: number; height: number };
  timestamp: number;
  processingTime?: number;
};

/** Messages sent from the main thread to the ONNX worker */
export type ONNXWorkerRequest =
  | { type: "init" }
  | { type: "loadModel"; model: ONNXModelConfig }
  | {
      type: "process";
      imageBitmap: ImageBitmap;
      sourceWidth: number;
      sourceHeight: number;
      options: ONNXProcessOptions;
    }
  | { type: "dispose" };

/** Messages sent from the ONNX worker back to the main thread */
export type ONNXWorkerResponse =
  | { type: "initialized" }
  | { type: "modelLoaded"; modelName: string }
  | { type: "modelError"; modelName: string; error: string }
  | { type: "result"; result: ONNXWorkerResult }
  | { type: "error"; error: string };
