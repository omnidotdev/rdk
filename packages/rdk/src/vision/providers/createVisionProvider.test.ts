import { describe, expect, it } from "vitest";

import createVisionProvider from "./createVisionProvider";

describe("createVisionProvider", () => {
  it("creates a MediaPipe provider by default", () => {
    expect(createVisionProvider({}).type).toBe("mediapipe");
  });

  it("creates a MediaPipe provider when explicitly requested", () => {
    expect(createVisionProvider({ provider: "mediapipe" }).type).toBe(
      "mediapipe",
    );
  });

  it("creates an ONNX provider when requested", () => {
    expect(createVisionProvider({ provider: "onnx" }).type).toBe("onnx");
  });
});
