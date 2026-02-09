// Vision Worker - Handles ML processing off the main thread
// Supports 2D and 3D use cases with lightweight results

interface VisionWorkerMessage {
  type: "init" | "process" | "dispose";
  // biome-ignore lint/suspicious/noExplicitAny: worker payload is dynamic
  payload?: any;
}

interface VisionResult {
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

class VisionWorker {
  private isInitialized = false;
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe model instances
  private models: any = {};

  async initialize() {
    try {
      // Import MediaPipe in worker context
      const {
        FilesetResolver,
        HandLandmarker,
        FaceLandmarker,
        PoseLandmarker,
      } = await import("@mediapipe/tasks-vision");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      // Initialize models
      this.models.handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.7,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        },
      );

      this.models.faceLandmarker = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.7,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        },
      );

      this.models.poseLandmarker = await PoseLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/1/pose_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.7,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        },
      );

      this.isInitialized = true;
      self.postMessage({ type: "initialized" });
    } catch (error) {
      self.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async processFrame(imageData: ImageData, timestamp: number) {
    if (!this.isInitialized) return;

    try {
      const result: VisionResult = {
        hands: [],
        faces: [],
        poses: [],
        timestamp,
        frameSize: { width: imageData.width, height: imageData.height },
      };

      // Process hands
      if (this.models.handLandmarker) {
        const handResults = this.models.handLandmarker.detectForVideo(
          imageData,
          timestamp,
        );
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
        result.hands = handResults.landmarks.map(
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          (landmarks: any[], index: number) => ({
            // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
            landmarks: landmarks.map((landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z || 0,
            })),
            confidence: handResults.handednesses?.[index]?.[0]?.score || 0.5,
          }),
        );
      }

      // Process faces
      if (this.models.faceLandmarker) {
        const faceResults = this.models.faceLandmarker.detectForVideo(
          imageData,
          timestamp,
        );
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
        result.faces = faceResults.faceLandmarks.map((landmarks: any[]) => ({
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          landmarks: landmarks.map((landmark: any) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z || 0,
          })),
          // MediaPipe doesn't provide face confidence directly
          confidence: 0.8,
        }));
      }

      // Process poses
      if (this.models.poseLandmarker) {
        const poseResults = this.models.poseLandmarker.detectForVideo(
          imageData,
          timestamp,
        );
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
        result.poses = poseResults.landmarks.map((landmarks: any[]) => ({
          // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark type
          landmarks: landmarks.map((landmark: any) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z || 0,
          })),
          // Approximate confidence based on visibility
          confidence: 0.7,
        }));
      }

      // Send lightweight result back to main thread
      self.postMessage({ type: "result", result });
    } catch (error) {
      self.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  dispose() {
    try {
      if (this.models.handLandmarker) {
        this.models.handLandmarker.close();
      }
      if (this.models.faceLandmarker) {
        this.models.faceLandmarker.close();
      }
      if (this.models.poseLandmarker) {
        this.models.poseLandmarker.close();
      }
      this.models = {};
      this.isInitialized = false;
    } catch (error) {
      console.error("Error disposing vision worker:", error);
    }
  }
}

const worker = new VisionWorker();

self.onmessage = async (event: MessageEvent<VisionWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case "init":
      await worker.initialize();
      break;
    case "process":
      await worker.processFrame(payload.imageData, payload.timestamp);
      break;
    case "dispose":
      worker.dispose();
      break;
  }
};
