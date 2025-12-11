import { describe, expect, it } from "vitest";

import createFiducialBackend from "../src/fiducial/fiducialBackend";

import type { FiducialSessionOptions } from "../src/fiducial/fiducialBackend";

describe("fiducialBackend", () => {
  it("exports createFiducialBackend function", () => {
    expect(createFiducialBackend).toBeDefined();
    expect(typeof createFiducialBackend).toBe("function");
  });

  it("creates a backend instance", () => {
    const backend = createFiducialBackend({});
    expect(backend).toBeTruthy();
    expect(typeof backend.init).toBe("function");
    expect(typeof backend.update).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");
  });

  it("accepts session options", () => {
    const options: FiducialSessionOptions = {
      sourceType: "webcam",
      cameraParametersUrl: "/camera.dat",
      detectionMode: "mono",
      patternRatio: 0.8,
      matrixCodeType: "4x4",
    };

    const backend = createFiducialBackend(options);
    expect(backend).toBeTruthy();
  });

  it("handles empty options", () => {
    const backend = createFiducialBackend();
    expect(backend).toBeTruthy();
  });

  it("has correct method signatures", () => {
    const backend = createFiducialBackend({});

    // check methods exist and are functions
    expect(typeof backend.init).toBe("function");
    expect(typeof backend.update).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");

    // check method arity
    expect(backend.init.length).toBe(1);
    expect(backend.update?.length).toBe(0);
    expect(backend.dispose?.length).toBe(0);
    expect(backend.getInternal?.length).toBe(0);
  });

  it("validates session options interface", () => {
    // test that valid options don't throw during creation
    const validOptions: FiducialSessionOptions = {
      sourceType: "image",
      detectionMode: "color_and_matrix",
    };

    expect(() => createFiducialBackend(validOptions)).not.toThrow();

    const validOptionsWithParams: FiducialSessionOptions = {
      sourceType: "video",
      cameraParametersUrl: "/custom/camera.dat",
      patternRatio: 0.6,
      matrixCodeType: "3x3_HAMMING63",
    };

    expect(() => createFiducialBackend(validOptionsWithParams)).not.toThrow();

    const emptyOptions: FiducialSessionOptions = {};
    expect(() => createFiducialBackend(emptyOptions)).not.toThrow();
  });

  it("accepts all source types", () => {
    const webcamBackend = createFiducialBackend({ sourceType: "webcam" });
    expect(webcamBackend).toBeTruthy();

    const imageBackend = createFiducialBackend({ sourceType: "image" });
    expect(imageBackend).toBeTruthy();

    const videoBackend = createFiducialBackend({ sourceType: "video" });
    expect(videoBackend).toBeTruthy();
  });

  it("accepts all detection modes", () => {
    const colorMode = createFiducialBackend({ detectionMode: "color" });
    expect(colorMode).toBeTruthy();

    const colorMatrixMode = createFiducialBackend({
      detectionMode: "color_and_matrix",
    });
    expect(colorMatrixMode).toBeTruthy();

    const monoMode = createFiducialBackend({ detectionMode: "mono" });
    expect(monoMode).toBeTruthy();

    const monoMatrixMode = createFiducialBackend({
      detectionMode: "mono_and_matrix",
    });
    expect(monoMatrixMode).toBeTruthy();
  });

  it("accepts all matrix code types", () => {
    const matrixTypes = [
      "3x3",
      "3x3_HAMMING63",
      "3x3_PARITY65",
      "4x4",
      "4x4_BCH_13_9_3",
      "4x4_BCH_13_5_5",
    ] as const;

    matrixTypes.forEach((matrixCodeType) => {
      const backend = createFiducialBackend({ matrixCodeType });
      expect(backend).toBeTruthy();
    });
  });

  it("accepts pattern ratio values", () => {
    const ratios = [0.1, 0.5, 0.8, 1.0];

    ratios.forEach((patternRatio) => {
      const backend = createFiducialBackend({ patternRatio });
      expect(backend).toBeTruthy();
    });
  });
});
