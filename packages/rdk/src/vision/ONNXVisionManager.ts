// ONNX Vision Manager - supports ONNX models like RF-DETR and YOLO
// Worker will be imported dynamically

export interface ONNXModelConfig {
  name: string;
  url: string;
  type: "detection" | "segmentation" | "custom";
  // [batch, channels, height, width]
  inputShape: [number, number, number, number];
  labels?: string[];
  preprocessor?: "yolo" | "none";
  postprocessor?: "yolo" | "none";
  threshold?: number;
  nmsThreshold?: number;
}

export interface ONNXDetection {
  // [x, y, width, height]
  bbox: [number, number, number, number];
  class: number;
  confidence: number;
  label?: string;
}

export interface ONNXResult {
  detections: ONNXDetection[];
  frameSize: { width: number; height: number };
  timestamp: number;
  processingTime?: number;
}

interface ONNXVisionManagerOptions {
  models: ONNXModelConfig[];
  minConfidence?: number;
  maxResults?: number;
  throttle?: number;
}

export class ONNXVisionManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private loadedModels = new Map<string, ONNXModelConfig>();

  private options: ONNXVisionManagerOptions = {
    models: [],
    minConfidence: 0.5,
    maxResults: 100,
    // ~10fps for heavy models
    throttle: 100,
  };

  private lastProcessTime = 0;
  private callbacks: Array<(result: ONNXResult) => void> = [];

  constructor(options: Partial<ONNXVisionManagerOptions> = {}) {
    this.options = { ...this.options, ...options };
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = 640;
    this.canvas.height = 640;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.context = ctx;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: "environment",
        },
      });

      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;

      await new Promise<void>((resolve) => {
        this.videoElement!.onloadeddata = () => resolve();
      });

      // Initialize worker
      this.worker = new Worker(
        new URL("./worker/onnxWorker.ts", import.meta.url),
        { type: "module" },
      );

      this.worker.onmessage = (event) => {
        const { type, result, error } = event.data;

        if (type === "initialized") {
          this.isInitialized = true;
        } else if (type === "result") {
          this.handleDetectionResult(result);
        } else if (type === "error") {
          console.error("ONNX worker error:", error);
        }
      };

      // Initialize models
      for (const model of this.options.models) {
        await this.loadModel(model);
      }

      // Wait for initialization
      await new Promise<void>((resolve, reject) => {
        // 30s timeout for model loading
        const timeout = setTimeout(() => {
          reject(new Error("ONNX worker initialization timeout"));
        }, 30000);

        const checkInit = () => {
          if (this.isInitialized) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    } catch (error) {
      console.error("Failed to initialize ONNX vision manager:", error);
      throw error;
    }
  }

  async loadModel(model: ONNXModelConfig): Promise<void> {
    if (!this.worker) throw new Error("Worker not initialized");

    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const { type, modelName, error } = event.data;

        if (type === "modelLoaded" && modelName === model.name) {
          this.loadedModels.set(model.name, model);
          this.worker?.removeEventListener("message", handleMessage);
          resolve();
        } else if (type === "modelError" && modelName === model.name) {
          this.worker?.removeEventListener("message", handleMessage);
          reject(new Error(error));
        }
      };

      this.worker?.addEventListener("message", handleMessage);
      this.worker?.postMessage({
        type: "loadModel",
        model,
      });
    });
  }

  startDetection(): void {
    if (!this.isInitialized || !this.videoElement) {
      console.warn("ONNX manager not initialized");
      return;
    }

    const processFrame = () => {
      if (!this.videoElement || !this.isInitialized) return;

      const now = Date.now();
      if (now - this.lastProcessTime < this.options.throttle!) {
        this.animationId = requestAnimationFrame(processFrame);
        return;
      }

      if (!this.isProcessing) {
        this.processCurrentFrame();
      }

      this.animationId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  private processCurrentFrame(): void {
    if (
      !this.videoElement ||
      !this.worker ||
      !this.context ||
      this.isProcessing
    )
      return;

    this.isProcessing = true;
    this.lastProcessTime = Date.now();

    // Draw video frame to canvas
    const { videoWidth, videoHeight } = this.videoElement;
    this.canvas.width = 640;
    this.canvas.height = 640;

    this.context.drawImage(
      this.videoElement,
      0,
      0,
      videoWidth,
      videoHeight,
      0,
      0,
      640,
      640,
    );

    // Get image data
    const imageData = this.context.getImageData(0, 0, 640, 640);

    // Send to worker
    this.worker.postMessage({
      type: "process",
      imageData: imageData.data,
      width: 640,
      height: 640,
      options: {
        minConfidence: this.options.minConfidence,
        maxResults: this.options.maxResults,
      },
    });
  }

  private handleDetectionResult(result: ONNXResult): void {
    this.isProcessing = false;

    // Apply confidence filtering
    result.detections = result.detections.filter(
      (d) => d.confidence >= (this.options.minConfidence || 0.5),
    );

    // Limit results
    if (this.options.maxResults) {
      result.detections = result.detections
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.options.maxResults);
    }

    // Notify callbacks
    for (const callback of this.callbacks) {
      callback(result);
    }
  }

  onDetection(callback: (result: ONNXResult) => void): void {
    this.callbacks.push(callback);
  }

  offDetection(callback: (result: ONNXResult) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  stopDetection(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isProcessing = false;
  }

  dispose(): void {
    this.stopDetection();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.videoElement?.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      for (const track of stream.getTracks()) {
        track.stop();
      }
      this.videoElement.srcObject = null;
    }

    this.callbacks.length = 0;
    this.loadedModels.clear();
    this.isInitialized = false;
  }

  getLoadedModels(): ONNXModelConfig[] {
    return Array.from(this.loadedModels.values());
  }

  isModelLoaded(modelName: string): boolean {
    return this.loadedModels.has(modelName);
  }
}

export default ONNXVisionManager;
