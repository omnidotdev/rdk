// ONNX provider - supports ONNX models like RF-DETR and YOLO

import type {
  ObjectDetection,
  ONNXModelConfig,
  VisionFrame,
  VisionProvider,
  VisionSessionOptions,
} from "../types";

/** Timeout before force-resetting isProcessing if worker stalls */
const PROCESSING_STALL_TIMEOUT = 5000;

class ONNXProvider implements VisionProvider {
  readonly type = "onnx" as const;

  private worker: Worker | null = null;
  private isInitialized = false;
  private isDisposed = false;
  private isProcessing = false;
  private videoElement: HTMLVideoElement | null = null;
  private animationId: number | null = null;
  private loadedModels = new Map<string, ONNXModelConfig>();
  private lastProcessTime = 0;
  private processingStartTime = 0;
  private callbacks: Array<(frame: VisionFrame) => void> = [];
  private options: VisionSessionOptions;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private pendingModelCallbacks = new Map<
    string,
    { resolve: () => void; reject: (err: Error) => void }
  >();

  constructor(options: VisionSessionOptions) {
    this.options = options;
  }

  async initialize(video: HTMLVideoElement): Promise<void> {
    this.videoElement = video;

    // Initialize worker
    this.worker = new Worker(
      new URL("../worker/onnxWorker.ts", import.meta.url),
      { type: "module" },
    );

    // Single persistent message handler for all worker messages
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("ONNX worker initialization timeout"));
      }, 10000);

      this.messageHandler = (event: MessageEvent) => {
        const { type, result, error, modelName } = event.data;

        if (type === "initialized") {
          clearTimeout(timeout);
          this.isInitialized = true;
          resolve();
        } else if (type === "result") {
          this.isProcessing = false;
          this.handleResult(result);
        } else if (type === "modelLoaded") {
          const pending = this.pendingModelCallbacks.get(modelName);
          if (pending) {
            this.pendingModelCallbacks.delete(modelName);
            pending.resolve();
          }
        } else if (type === "modelError") {
          const pending = this.pendingModelCallbacks.get(modelName);
          if (pending) {
            this.pendingModelCallbacks.delete(modelName);
            pending.reject(new Error(error));
          }
        } else if (type === "error") {
          this.isProcessing = false;
          if (!this.isInitialized) {
            clearTimeout(timeout);
            reject(new Error(error));
          } else {
            console.error("ONNX worker error:", error);
          }
        }
      };

      this.worker?.addEventListener("message", this.messageHandler);
      this.worker?.postMessage({ type: "init" });
    });

    // Load configured models
    const models = this.options.onnx?.models ?? [];
    for (const model of models) {
      await this.loadModel(model);
    }
  }

  startDetection(): void {
    if (!this.isInitialized || !this.videoElement) {
      console.warn("ONNX provider not initialized");
      return;
    }

    const processFrame = () => {
      if (!this.videoElement || !this.isInitialized) return;

      const now = Date.now();
      const throttle = this.options.throttle ?? 100;
      if (now - this.lastProcessTime < throttle) {
        this.animationId = requestAnimationFrame(processFrame);
        return;
      }

      // Stall recovery: force-reset if worker hasn't responded
      if (
        this.isProcessing &&
        this.processingStartTime > 0 &&
        now - this.processingStartTime > PROCESSING_STALL_TIMEOUT
      ) {
        console.warn("ONNX processing stall detected, resetting");
        this.isProcessing = false;
      }

      if (!this.isProcessing) {
        this.processCurrentFrame();
      }

      this.animationId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  stopDetection(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isProcessing = false;
  }

  onDetection(callback: (frame: VisionFrame) => void): () => void {
    this.callbacks.push(callback);

    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  dispose(): void {
    this.isDisposed = true;
    this.stopDetection();

    if (this.worker) {
      if (this.messageHandler) {
        this.worker.removeEventListener("message", this.messageHandler);
        this.messageHandler = null;
      }
      this.worker.postMessage({ type: "dispose" });
      this.worker.terminate();
      this.worker = null;
    }

    this.videoElement = null;
    this.callbacks.length = 0;
    this.loadedModels.clear();
    this.pendingModelCallbacks.clear();
    this.isInitialized = false;
  }

  private async loadModel(model: ONNXModelConfig): Promise<void> {
    if (!this.worker) throw new Error("Worker not initialized");

    const promise = new Promise<void>((resolve, reject) => {
      this.pendingModelCallbacks.set(model.name, { resolve, reject });
    });

    this.worker.postMessage({ type: "loadModel", model });

    await promise;
    this.loadedModels.set(model.name, model);
  }

  private processCurrentFrame(): void {
    if (!this.videoElement || !this.worker || this.isProcessing) return;

    const now = Date.now();
    this.isProcessing = true;
    this.lastProcessTime = now;
    this.processingStartTime = now;

    const { videoWidth, videoHeight } = this.videoElement;

    createImageBitmap(this.videoElement, {
      resizeWidth: 640,
      resizeHeight: 640,
    }).then(
      (bitmap) => {
        if (this.isDisposed) {
          bitmap.close();
          return;
        }

        this.worker?.postMessage(
          {
            type: "process",
            imageBitmap: bitmap,
            width: 640,
            height: 640,
            sourceWidth: videoWidth,
            sourceHeight: videoHeight,
            options: {
              minConfidence: this.options.minConfidence ?? 0.5,
              maxResults: this.options.maxResults ?? 100,
            },
          },
          [bitmap],
        );
      },
      (error) => {
        this.isProcessing = false;
        console.error("Error creating ImageBitmap:", error);
      },
    );
  }

  private handleResult(result: {
    detections: ObjectDetection[];
    frameSize: { width: number; height: number };
    timestamp: number;
    processingTime?: number;
  }): void {
    const minConfidence = this.options.minConfidence ?? 0.5;
    const maxResults = this.options.maxResults ?? 100;

    // Filter and limit
    const objects = result.detections
      .filter((d) => d.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);

    const frame: VisionFrame = {
      hands: [],
      faces: [],
      poses: [],
      objects,
      timestamp: result.timestamp,
      frameSize: result.frameSize,
      processingTime: result.processingTime,
    };

    for (const callback of this.callbacks) {
      try {
        callback(frame);
      } catch (error) {
        console.error("Error in ONNX detection callback:", error);
      }
    }
  }
}

export default ONNXProvider;
