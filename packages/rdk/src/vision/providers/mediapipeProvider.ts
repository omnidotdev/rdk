// MediaPipe provider - handles hand/face/pose detection on the main thread
//
// Runs inference inline rather than in a Web Worker. MediaPipe's
// `detectForVideo` accepts the HTMLVideoElement directly, avoiding
// ImageBitmap serialisation issues that silently break detection on
// mobile browsers.

import type {
  LandmarkDetection,
  VisionFrame,
  VisionProvider,
  VisionSessionOptions,
} from "../types";

type Models = {
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe model instances
  handLandmarker?: any;
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe model instances
  faceLandmarker?: any;
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe model instances
  poseLandmarker?: any;
};

class MediaPipeProvider implements VisionProvider {
  readonly type = "mediapipe" as const;

  private models: Models = {};
  private isInitialized = false;
  private isProcessing = false;
  private isDisposed = false;
  private videoElement: HTMLVideoElement | null = null;
  private animationId: number | null = null;
  private lastProcessTime = 0;
  private callbacks: Array<(frame: VisionFrame) => void> = [];
  private options: VisionSessionOptions;

  constructor(options: VisionSessionOptions) {
    this.options = options;
  }

  async initialize(video: HTMLVideoElement): Promise<void> {
    this.videoElement = video;

    const { FilesetResolver, HandLandmarker, FaceLandmarker, PoseLandmarker } =
      await import("@mediapipe/tasks-vision");

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10/wasm",
    );

    const delegate = (this.options.useGpu ?? true) ? "GPU" : "CPU";

    const createWithFallback = async <T>(
      create: (d: "GPU" | "CPU") => Promise<T>,
    ): Promise<T> => {
      if (delegate === "CPU") return create("CPU");
      try {
        return await create("GPU");
      } catch {
        console.warn("MediaPipe GPU delegate failed, falling back to CPU");
        return create("CPU");
      }
    };

    this.options.onProgress?.({ step: 1, total: 3, label: "hand landmarker" });
    this.models.handLandmarker = await createWithFallback((d) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: d,
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
    );

    this.options.onProgress?.({ step: 2, total: 3, label: "face landmarker" });
    this.models.faceLandmarker = await createWithFallback((d) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: d,
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.7,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      }),
    );

    this.options.onProgress?.({ step: 3, total: 3, label: "pose landmarker" });
    this.models.poseLandmarker = await createWithFallback((d) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: d,
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.7,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: true,
      }),
    );

    this.isInitialized = true;
    this.options.onProgress?.(null);
  }

  startDetection(): void {
    if (!this.isInitialized || !this.videoElement || this.isProcessing) return;

    this.isProcessing = true;
    this.processFrame();
  }

  stopDetection(): void {
    this.isProcessing = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
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

    if (this.models.handLandmarker) this.models.handLandmarker.close();
    if (this.models.faceLandmarker) this.models.faceLandmarker.close();
    if (this.models.poseLandmarker) this.models.poseLandmarker.close();
    this.models = {};

    this.videoElement = null;
    this.callbacks = [];
    this.isInitialized = false;
    this.isProcessing = false;
  }

  private processFrame = () => {
    if (!this.isProcessing || !this.videoElement || this.isDisposed) return;

    const now = performance.now();
    const throttle = this.options.throttle ?? 16;
    if (now - this.lastProcessTime < throttle) {
      this.animationId = requestAnimationFrame(this.processFrame);
      return;
    }

    const { videoWidth, videoHeight } = this.videoElement;
    if (videoWidth === 0 || videoHeight === 0) {
      this.animationId = requestAnimationFrame(this.processFrame);
      return;
    }

    this.lastProcessTime = now;
    const timestamp = now;

    try {
      const result: VisionFrame = {
        hands: [],
        faces: [],
        poses: [],
        objects: [],
        timestamp,
        frameSize: { width: videoWidth, height: videoHeight },
      };

      if (this.models.handLandmarker) {
        const raw = this.models.handLandmarker.detectForVideo(
          this.videoElement,
          timestamp,
        );
        result.hands = raw.landmarks.map(
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          (landmarks: any[], index: number) => ({
            // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
            landmarks: landmarks.map((l: any) => ({
              x: l.x,
              y: l.y,
              z: l.z || 0,
            })),
            confidence: raw.handednesses?.[index]?.[0]?.score || 0.5,
          }),
        );
      }

      if (this.models.faceLandmarker) {
        const raw = this.models.faceLandmarker.detectForVideo(
          this.videoElement,
          timestamp,
        );
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
        result.faces = raw.faceLandmarks.map((landmarks: any[]) => {
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          const xs = landmarks.map((l: any) => l.x as number);
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          const ys = landmarks.map((l: any) => l.y as number);
          const bboxWidth = Math.max(...xs) - Math.min(...xs);
          const bboxHeight = Math.max(...ys) - Math.min(...ys);
          const bboxArea = bboxWidth * bboxHeight;
          const confidence = Math.min(0.95, Math.max(0.6, bboxArea * 4));

          return {
            // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
            landmarks: landmarks.map((l: any) => ({
              x: l.x,
              y: l.y,
              z: l.z || 0,
            })),
            confidence,
          } satisfies LandmarkDetection;
        });
      }

      if (this.models.poseLandmarker) {
        const raw = this.models.poseLandmarker.detectForVideo(
          this.videoElement,
          timestamp,
        );
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
        result.poses = raw.landmarks.map((landmarks: any[]) => {
          let visibilitySum = 0;
          let visibilityCount = 0;
          for (const landmark of landmarks) {
            if (typeof landmark.visibility === "number") {
              visibilitySum += landmark.visibility;
              visibilityCount++;
            }
          }
          const confidence =
            visibilityCount > 0 ? visibilitySum / visibilityCount : 0.5;

          return {
            // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
            landmarks: landmarks.map((l: any) => ({
              x: l.x,
              y: l.y,
              z: l.z || 0,
            })),
            confidence,
          } satisfies LandmarkDetection;
        });

        // Extract segmentation mask from pose result
        const segMask = raw.segmentationMasks?.[0];
        if (segMask) {
          const canvas = new OffscreenCanvas(segMask.width, segMask.height);
          // biome-ignore lint/style/noNonNullAssertion: guaranteed by OffscreenCanvas support
          const ctx = canvas.getContext("2d")!;
          const maskData = segMask.getAsFloat32Array();
          const imageData = ctx.createImageData(segMask.width, segMask.height);
          for (let i = 0; i < maskData.length; i++) {
            const v = maskData[i] * 255;
            imageData.data[i * 4] = v;
            imageData.data[i * 4 + 1] = v;
            imageData.data[i * 4 + 2] = v;
            imageData.data[i * 4 + 3] = 255;
          }
          result.segmentationMask = imageData;
        }
      }

      this.handleResult(result);
    } catch (error) {
      console.error("Vision processing error:", error);
    }

    this.animationId = requestAnimationFrame(this.processFrame);
  };

  private handleResult(result: VisionFrame): void {
    const minConfidence = this.options.minConfidence ?? 0.7;
    const maxResults = this.options.maxResults ?? 2;

    const filtered: VisionFrame = {
      ...result,
      hands: result.hands
        .filter((h) => h.confidence >= minConfidence)
        .slice(0, maxResults),
      faces: result.faces
        .filter((f) => f.confidence >= minConfidence)
        .slice(0, maxResults),
      poses: result.poses
        .filter((p) => p.confidence >= minConfidence)
        .slice(0, maxResults),
      objects: [],
    };

    for (const callback of this.callbacks) {
      try {
        callback(filtered);
      } catch (error) {
        console.error("Error in vision callback:", error);
      }
    }
  }
}

export default MediaPipeProvider;
