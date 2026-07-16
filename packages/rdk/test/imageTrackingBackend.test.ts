import { describe, expect, it } from "vitest";

import { createWebcamFrameSource } from "../src/image-tracking/frameSource";
import createImageTrackingBackend from "../src/image-tracking/imageTrackingBackend";
import { BACKEND_TYPES } from "../src/lib/types/engine";

import type { ImageTrackingSessionOptions } from "../src/image-tracking/imageTrackingBackend";

const baseOptions: ImageTrackingSessionOptions = {
  imageTargetSrc: "/targets.mind",
};

describe("imageTrackingBackend", () => {
  it("exports createImageTrackingBackend function", () => {
    expect(createImageTrackingBackend).toBeDefined();
    expect(typeof createImageTrackingBackend).toBe("function");
  });

  it("creates a backend instance with the expected method surface", () => {
    const backend = createImageTrackingBackend(baseOptions);

    expect(backend).toBeTruthy();
    expect(typeof backend.init).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");
  });

  it("reports the image-tracking backend type", () => {
    const backend = createImageTrackingBackend(baseOptions);

    expect(backend.type).toBe(BACKEND_TYPES.IMAGE_TRACKING);
    expect(backend.type).toBe("image-tracking");
  });

  it("exposes empty initial internal state before init", () => {
    const backend = createImageTrackingBackend(baseOptions);
    const internal = backend.getInternal();

    expect(internal.controller).toBeNull();
    expect(internal.targetMatrices).toBeInstanceOf(Map);
    expect(internal.targetMatrices.size).toBe(0);
    expect(internal.dimensions).toEqual([]);
  });

  it("accepts full session options", () => {
    const options: ImageTrackingSessionOptions = {
      imageTargetSrc: "/custom/targets.mind",
      maxTrack: 3,
      filterMinCF: 0.001,
      filterBeta: 1000,
      missTolerance: 5,
      warmupTolerance: 5,
      frameSource: createWebcamFrameSource({ facingMode: "user" }),
    };

    expect(() => createImageTrackingBackend(options)).not.toThrow();
  });

  it("is safe to dispose before init", () => {
    const backend = createImageTrackingBackend(baseOptions);

    expect(() => backend.dispose?.()).not.toThrow();
  });

  it("has correct method arity", () => {
    const backend = createImageTrackingBackend(baseOptions);

    expect(backend.init.length).toBe(1);
    expect(backend.dispose?.length).toBe(0);
    expect(backend.getInternal?.length).toBe(0);
  });
});

describe("createWebcamFrameSource", () => {
  it("returns a frame source with no video until started", () => {
    const source = createWebcamFrameSource();

    expect(source.video).toBeNull();
    expect(typeof source.start).toBe("function");
    expect(typeof source.stop).toBe("function");
  });

  it("is safe to stop before start", () => {
    const source = createWebcamFrameSource();

    expect(() => source.stop()).not.toThrow();
    expect(source.video).toBeNull();
  });
});
