import { describe, expect, it } from "vitest";

import { getOrtWasmPaths } from "./ortAssets";

describe("getOrtWasmPaths", () => {
  it("pins the CDN path to the installed ONNX Runtime version", () => {
    expect(getOrtWasmPaths("1.27.0")).toBe(
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/",
    );
  });

  it("falls back to the unversioned path when the version is unknown", () => {
    expect(getOrtWasmPaths(undefined)).toBe(
      "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/",
    );
  });
});
