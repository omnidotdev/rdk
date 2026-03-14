import { describe, expect, it } from "bun:test";

import type {
  LandmarkDetection,
  ObjectDetection,
  VisionFrame,
  VisionLandmark,
  VisionProviderType,
  VisionSessionOptions,
  VisionTask,
} from "./types";

describe("Vision Types", () => {
  it("should allow valid VisionTask values", () => {
    const tasks: VisionTask[] = ["hands", "faces", "poses", "objects"];
    expect(tasks).toHaveLength(4);
    for (const task of tasks) {
      expect(typeof task).toBe("string");
    }
  });

  it("should allow valid VisionProviderType values", () => {
    const providers: VisionProviderType[] = ["mediapipe", "onnx"];
    expect(providers).toHaveLength(2);
  });

  it("should construct a valid VisionFrame", () => {
    const landmark: VisionLandmark = { x: 0.5, y: 0.3, z: 0.1 };
    const detection: LandmarkDetection = {
      landmarks: [landmark],
      confidence: 0.9,
    };
    const object: ObjectDetection = {
      bbox: [10, 20, 100, 100],
      class: 0,
      confidence: 0.85,
      label: "person",
    };

    const frame: VisionFrame = {
      hands: [detection],
      faces: [],
      poses: [],
      objects: [object],
      timestamp: Date.now(),
      frameSize: { width: 1280, height: 720 },
      processingTime: 16,
    };

    expect(frame.hands).toHaveLength(1);
    expect(frame.hands[0].landmarks[0]).toEqual(landmark);
    expect(frame.objects[0].label).toBe("person");
    expect(frame.processingTime).toBe(16);
  });

  it("should construct valid VisionSessionOptions", () => {
    const options: VisionSessionOptions = {
      provider: "mediapipe",
      tasks: ["hands", "faces"],
      minConfidence: 0.7,
      maxResults: 2,
      throttle: 16,
      useGpu: true,
    };

    expect(options.provider).toBe("mediapipe");
    expect(options.tasks).toEqual(["hands", "faces"]);
  });

  it("should construct ONNX options", () => {
    const options: VisionSessionOptions = {
      provider: "onnx",
      tasks: ["objects"],
      onnx: {
        models: [
          {
            name: "yolo",
            url: "https://example.com/yolo.onnx",
            type: "detection",
            inputShape: [1, 3, 640, 640],
            labels: ["person", "car"],
            preprocessor: "yolo",
            postprocessor: "yolo",
          },
        ],
      },
    };

    expect(options.onnx?.models).toHaveLength(1);
    expect(options.onnx?.models[0].name).toBe("yolo");
  });
});
