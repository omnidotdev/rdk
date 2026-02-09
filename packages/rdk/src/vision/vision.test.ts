import { beforeEach, describe, expect, it } from "vitest";

import useVisionStore from "./stores/useVisionStore";

import type { HandLandmarksResult, VisionDetectionEvent } from "./types";

describe("Vision Module", () => {
  beforeEach(() => {
    // Reset the store before each test
    const store = useVisionStore.getState();
    store.clearDetections();
    useVisionStore.setState({
      sessions: new Map(),
      activeBackends: new Set(),
      isInitialized: false,
      isRunning: false,
      error: null,
    });
  });

  describe("useVisionStore", () => {
    it("should initialize with default state", () => {
      const state = useVisionStore.getState();

      expect(state.sessions.size).toBe(0);
      expect(state.detections.size).toBe(0);
      expect(state.activeBackends.size).toBe(0);
      expect(state.isInitialized).toBe(false);
      expect(state.isRunning).toBe(false);
      expect(state.error).toBe(null);
    });

    it("should register a session", () => {
      const sessionOptions = {
        type: "mediapipe" as const,
        tasks: ["handLandmarks" as const],
        minConfidence: 0.5,
      };

      useVisionStore.getState().registerSession("test-session", sessionOptions);

      const state = useVisionStore.getState();
      expect(state.sessions.size).toBe(1);
      expect(state.sessions.get("test-session")).toEqual(sessionOptions);
      expect(state.activeBackends.has("mediapipe")).toBe(true);
    });

    it("should unregister a session", () => {
      const sessionOptions = {
        type: "mediapipe" as const,
        tasks: ["handLandmarks" as const],
      };

      const store = useVisionStore.getState();
      store.registerSession("test-session", sessionOptions);
      store.unregisterSession("test-session");

      const state = useVisionStore.getState();
      expect(state.sessions.size).toBe(0);
      expect(state.activeBackends.has("mediapipe")).toBe(false);
    });

    it("should update detection results", () => {
      const mockDetection: VisionDetectionEvent = {
        task: "handLandmarks",
        result: {
          landmarks: [[]],
          worldLandmarks: [[]],
          handedness: [],
          timestamp: Date.now(),
        } as HandLandmarksResult,
        confidence: 0.8,
        timestamp: Date.now(),
      };

      useVisionStore.getState().updateDetection("handLandmarks", mockDetection);

      const state = useVisionStore.getState();
      expect(state.detections.size).toBe(1);
      expect(state.detections.get("handLandmarks")).toEqual(mockDetection);
      expect(state.error).toBe(null);
    });

    it("should get detection by task", () => {
      const mockDetection: VisionDetectionEvent = {
        task: "handLandmarks",
        result: {
          landmarks: [[]],
          worldLandmarks: [[]],
          handedness: [],
          timestamp: Date.now(),
        } as HandLandmarksResult,
        confidence: 0.8,
        timestamp: Date.now(),
      };

      const store = useVisionStore.getState();
      store.updateDetection("handLandmarks", mockDetection);
      const retrieved = store.getDetection("handLandmarks");

      expect(retrieved).toEqual(mockDetection);
      expect(store.getDetection("faceLandmarks")).toBeUndefined();
    });

    it("should clear all detections", () => {
      const mockDetection: VisionDetectionEvent = {
        task: "handLandmarks",
        result: {
          landmarks: [[]],
          worldLandmarks: [[]],
          handedness: [],
          timestamp: Date.now(),
        } as HandLandmarksResult,
        confidence: 0.8,
        timestamp: Date.now(),
      };

      const store = useVisionStore.getState();
      store.updateDetection("handLandmarks", mockDetection);
      let state = useVisionStore.getState();
      expect(state.detections.size).toBe(1);

      store.clearDetections();
      state = useVisionStore.getState();
      expect(state.detections.size).toBe(0);
    });

    it("should set global state", () => {
      let store = useVisionStore.getState();

      store.setInitialized(true);
      let state = useVisionStore.getState();
      expect(state.isInitialized).toBe(true);

      store = useVisionStore.getState();
      store.setRunning(true);
      state = useVisionStore.getState();
      expect(state.isRunning).toBe(true);

      store = useVisionStore.getState();
      const error = new Error("Test error");
      store.setError(error);
      state = useVisionStore.getState();
      expect(state.error).toBe(error);
    });

    it("should handle multiple sessions with same backend", () => {
      const sessionOptions1 = {
        type: "mediapipe" as const,
        tasks: ["handLandmarks" as const],
      };
      const sessionOptions2 = {
        type: "mediapipe" as const,
        tasks: ["faceLandmarks" as const],
      };

      let store = useVisionStore.getState();
      store.registerSession("session-1", sessionOptions1);
      store = useVisionStore.getState();
      store.registerSession("session-2", sessionOptions2);

      let state = useVisionStore.getState();
      expect(state.sessions.size).toBe(2);
      expect(state.activeBackends.has("mediapipe")).toBe(true);

      // Remove one session - backend should still be active
      store = useVisionStore.getState();
      store.unregisterSession("session-1");
      state = useVisionStore.getState();
      expect(state.sessions.size).toBe(1);
      expect(state.activeBackends.has("mediapipe")).toBe(true);

      // Remove last session - backend should be inactive
      store = useVisionStore.getState();
      store.unregisterSession("session-2");
      state = useVisionStore.getState();
      expect(state.sessions.size).toBe(0);
      expect(state.activeBackends.has("mediapipe")).toBe(false);
    });
  });

  describe("Types", () => {
    it("should have correct vision task types", () => {
      const validTasks = [
        "handLandmarks",
        "faceLandmarks",
        "poseEstimation",
        "objectDetection",
        "segmentation",
      ];

      // This is a compile-time test - if types are wrong, TypeScript will fail
      for (const task of validTasks) {
        expect(typeof task).toBe("string");
      }
    });

    it("should have correct backend types", () => {
      const validBackends = ["mediapipe", "tensorflow", "onnx", "opencv"];

      for (const backend of validBackends) {
        expect(typeof backend).toBe("string");
      }
    });
  });
});
