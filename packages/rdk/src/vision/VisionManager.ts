// Vision Manager - handles ML processing with Web Workers

interface VisionManagerOptions {
  enableHands?: boolean;
  enableFaces?: boolean;
  enablePoses?: boolean;
  minConfidence?: number;
  maxResults?: number;
  throttle?: number;
}

interface VisionDetection {
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

export class VisionManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;

  private options: VisionManagerOptions = {
    enableHands: true,
    enableFaces: false,
    enablePoses: false,
    minConfidence: 0.7,
    maxResults: 2,
    // ~60fps
    throttle: 16,
  };

  private lastProcessTime = 0;
  private callbacks: Array<(detection: VisionDetection) => void> = [];

  constructor(options: Partial<VisionManagerOptions> = {}) {
    this.options = { ...this.options, ...options };
    this.setupCanvas();
  }

  private setupCanvas() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }
  }

  async initialize(videoElement?: HTMLVideoElement) {
    try {
      // Setup video
      if (videoElement) {
        this.videoElement = videoElement;
      } else {
        this.videoElement = await this.setupVideoCapture();
      }

      // Create worker
      this.worker = new Worker(
        new URL("./worker/visionWorker.ts", import.meta.url),
        { type: "module" },
      );

      // Setup worker message handling
      this.worker.onmessage = (event) => {
        const { type, result, error } = event.data;

        if (type === "initialized") {
          this.isInitialized = true;
        } else if (type === "result") {
          this.handleDetectionResult(result);
        } else if (type === "error") {
          console.error("Vision worker error:", error);
        }
      };

      // Initialize worker
      this.worker.postMessage({ type: "init" });

      // Wait for initialization
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Vision worker initialization timeout"));
        }, 10000);

        const checkInitialized = () => {
          if (this.isInitialized) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkInitialized, 100);
          }
        };
        checkInitialized();
      });
    } catch (error) {
      console.error("Failed to initialize vision manager:", error);
      throw error;
    }
  }

  private async setupVideoCapture(): Promise<HTMLVideoElement> {
    const video = document.createElement("video");
    video.style.display = "none";
    document.body.appendChild(video);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user",
          frameRate: { ideal: 30, min: 15 },
        },
      });

      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
      });

      return video;
    } catch (error) {
      document.body.removeChild(video);
      throw error;
    }
  }

  startDetection() {
    if (!this.isInitialized || !this.videoElement || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processFrame();
  }

  stopDetection() {
    this.isProcessing = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private processFrame = () => {
    if (
      !this.isProcessing ||
      !this.videoElement ||
      !this.canvas ||
      !this.context ||
      !this.worker
    ) {
      return;
    }

    const now = performance.now();
    if (now - this.lastProcessTime < this.options.throttle!) {
      this.animationId = requestAnimationFrame(this.processFrame);
      return;
    }

    try {
      // Capture frame to canvas
      const { videoWidth, videoHeight } = this.videoElement;
      if (videoWidth === 0 || videoHeight === 0) {
        this.animationId = requestAnimationFrame(this.processFrame);
        return;
      }

      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      this.context.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

      // Get image data
      const imageData = this.context.getImageData(
        0,
        0,
        videoWidth,
        videoHeight,
      );

      // Send to worker
      this.worker.postMessage({
        type: "process",
        payload: { imageData, timestamp: Date.now() },
      });

      this.lastProcessTime = now;
    } catch (error) {
      console.error("Error processing frame:", error);
    }

    this.animationId = requestAnimationFrame(this.processFrame);
  };

  private handleDetectionResult(result: VisionDetection) {
    // Filter by confidence
    const filteredResult: VisionDetection = {
      ...result,
      hands: result.hands.filter(
        (hand) => hand.confidence >= this.options.minConfidence!,
      ),
      faces: result.faces.filter(
        (face) => face.confidence >= this.options.minConfidence!,
      ),
      poses: result.poses.filter(
        (pose) => pose.confidence >= this.options.minConfidence!,
      ),
    };

    // Apply max results
    if (this.options.maxResults) {
      filteredResult.hands = filteredResult.hands.slice(
        0,
        this.options.maxResults,
      );
      filteredResult.faces = filteredResult.faces.slice(
        0,
        this.options.maxResults,
      );
      filteredResult.poses = filteredResult.poses.slice(
        0,
        this.options.maxResults,
      );
    }

    // Notify callbacks
    for (const callback of this.callbacks) {
      try {
        callback(filteredResult);
      } catch (error) {
        console.error("Error in vision callback:", error);
      }
    }
  }

  onDetection(callback: (detection: VisionDetection) => void) {
    this.callbacks.push(callback);

    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // 2D helper methods
  get2DLandmarks(
    landmarks: Array<{ x: number; y: number; z: number }>,
    frameSize: { width: number; height: number },
  ) {
    return landmarks.map((landmark) => ({
      x: landmark.x * frameSize.width,
      y: landmark.y * frameSize.height,
    }));
  }

  // 3D helper methods
  get3DLandmarks(landmarks: Array<{ x: number; y: number; z: number }>) {
    return landmarks.map((landmark) => ({
      // Convert to [-1, 1]
      x: (landmark.x - 0.5) * 2,
      // Flip Y and convert to [-1, 1]
      y: -(landmark.y - 0.5) * 2,
      // Convert depth
      z: -landmark.z * 2,
    }));
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  dispose() {
    this.stopDetection();

    if (this.worker) {
      this.worker.postMessage({ type: "dispose" });
      this.worker.terminate();
      this.worker = null;
    }

    if (this.videoElement) {
      const stream = this.videoElement.srcObject as MediaStream;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }

    if (this.canvas?.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.callbacks = [];
    this.isInitialized = false;
    this.isProcessing = false;
  }
}

export default VisionManager;
