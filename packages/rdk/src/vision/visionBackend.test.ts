import { describe, expect, it, mock } from "bun:test";

import { BACKEND_TYPES } from "lib/types/engine";

import createVisionBackend from "./visionBackend";

// Mock the providers module so we don't actually create workers
mock.module("./providers", () => ({
  createVisionProvider: mock(() => ({
    type: "mediapipe",
    initialize: mock(() => Promise.resolve(undefined)),
    startDetection: mock(),
    stopDetection: mock(),
    onDetection: mock(() => mock()),
    dispose: mock(),
  })),
}));

// Mock getUserMedia
const mockGetUserMedia = mock(() =>
  Promise.resolve({
    getTracks: () => [{ stop: mock() }],
  }),
);

Object.defineProperty(globalThis.navigator, "mediaDevices", {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

describe("createVisionBackend", () => {
  it("should create a backend with the correct type", () => {
    const backend = createVisionBackend({});

    expect(backend.type).toBe(BACKEND_TYPES.VISION);
  });

  it("should implement the Backend interface", () => {
    const backend = createVisionBackend({});

    expect(typeof backend.init).toBe("function");
    expect(typeof backend.update).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");
  });

  it("should return internal state from getInternal", () => {
    const backend = createVisionBackend({});
    const internal = backend.getInternal();

    expect(internal).toHaveProperty("provider");
    expect(internal).toHaveProperty("videoElement");
    expect(internal).toHaveProperty("onDetection");
    expect(typeof internal.onDetection).toBe("function");
  });

  it("should start with null provider and videoElement", () => {
    const backend = createVisionBackend({});
    const internal = backend.getInternal();

    expect(internal.provider).toBeNull();
    expect(internal.videoElement).toBeNull();
  });

  it("should support onDetection subscribe/unsubscribe before init", () => {
    const backend = createVisionBackend({});
    const internal = backend.getInternal();

    const callback = mock();
    const unsubscribe = internal.onDetection(callback);

    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  it("should accept various session options", () => {
    // Verify factory doesn't throw with different configs
    expect(() => createVisionBackend({ provider: "mediapipe" })).not.toThrow();
    expect(() => createVisionBackend({ provider: "onnx" })).not.toThrow();
    expect(() =>
      createVisionBackend({
        tasks: ["hands", "faces"],
        minConfidence: 0.5,
        maxResults: 4,
        throttle: 32,
        useGpu: false,
      }),
    ).not.toThrow();
  });

  it("should clean up on dispose without init", () => {
    const backend = createVisionBackend({});
    // Dispose without init should not throw
    expect(() => backend.dispose?.()).not.toThrow();
  });
});
