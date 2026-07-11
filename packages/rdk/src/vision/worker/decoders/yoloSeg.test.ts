import { describe, expect, it } from "vitest";

import { yoloSegDecoder } from "./yoloSeg";

import type { DecodeContext } from "./types";

// Identity letterbox with a tiny 8px input and 4x4 prototypes (protoScale 0.5)
const ctx = (overrides: Partial<DecodeContext> = {}): DecodeContext => ({
  inputSize: 8,
  sourceWidth: 8,
  sourceHeight: 8,
  scale: 1,
  padX: 0,
  padY: 0,
  labels: ["obj"],
  minConfidence: 0.5,
  maxResults: 10,
  ...overrides,
});

describe("yoloSegDecoder", () => {
  it("assembles a thresholded mask from coeffs . prototypes", () => {
    // det [1, 7, 1]: 4 box + 1 class + 2 mask coeffs, 1 anchor
    // box (cx=4,cy=4,w=8,h=8) covers the full 8px input -> full 4x4 proto crop
    // class score 0.9; coeffs = [1, 0] so mask = sigmoid(proto0)
    const det = [4, 4, 8, 8, 0.9, 1, 0];

    // proto [1, 2, 4, 4]; proto0 positive only in the top-left 2x2, proto1 zeros
    const proto0 = [
      10,
      10,
      -10,
      -10, //
      10,
      10,
      -10,
      -10, //
      -10,
      -10,
      -10,
      -10, //
      -10,
      -10,
      -10,
      -10,
    ];
    const proto1 = new Array(16).fill(0);
    const proto = [...proto0, ...proto1];

    const { masks, objects } = yoloSegDecoder.decode(
      {
        output0: { data: det, dims: [1, 7, 1] },
        output1: { data: proto, dims: [1, 2, 4, 4] },
      },
      ctx(),
    );

    expect(masks).toHaveLength(1);
    const m = masks?.[0];
    expect(m?.label).toBe("obj");
    expect(m?.confidence).toBeCloseTo(0.9, 6);
    expect(m?.bbox).toEqual({ x: 0, y: 0, width: 8, height: 8 });
    expect(m?.maskWidth).toBe(4);
    expect(m?.maskHeight).toBe(4);
    expect(Array.from(m?.mask ?? [])).toEqual([
      255,
      255,
      0,
      0, //
      255,
      255,
      0,
      0, //
      0,
      0,
      0,
      0, //
      0,
      0,
      0,
      0,
    ]);

    // objects mirror the detections (box + label) for convenience
    expect(objects).toHaveLength(1);
    expect(objects?.[0].bbox).toEqual({ x: 0, y: 0, width: 8, height: 8 });
  });

  it("drops detections below the confidence threshold", () => {
    const det = [4, 4, 8, 8, 0.3, 1, 0];
    const proto = new Array(32).fill(0);
    const { masks } = yoloSegDecoder.decode(
      {
        output0: { data: det, dims: [1, 7, 1] },
        output1: { data: proto, dims: [1, 2, 4, 4] },
      },
      ctx({ minConfidence: 0.5 }),
    );
    expect(masks).toHaveLength(0);
  });

  it("crops the mask to the detection's box", () => {
    // box covers only the left half of the input (x 0..4) -> proto x 0..2
    const det = [2, 4, 4, 8, 0.9, 1, 0];
    const proto0 = new Array(16).fill(10); // all foreground
    const proto = [...proto0, ...new Array(16).fill(0)];
    const { masks } = yoloSegDecoder.decode(
      {
        output0: { data: det, dims: [1, 7, 1] },
        output1: { data: proto, dims: [1, 2, 4, 4] },
      },
      ctx(),
    );
    expect(masks?.[0].maskWidth).toBe(2);
    expect(masks?.[0].maskHeight).toBe(4);
    expect(masks?.[0].bbox).toEqual({ x: 0, y: 0, width: 4, height: 8 });
  });
});
