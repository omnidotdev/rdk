import { describe, expect, it } from "vitest";

import { iou, letterboxToSource, nms } from "./nms";
import { rfDetrDecoder } from "./rfDetr";
import { yoloDecoder } from "./yolo";

import type { ObjectDetection } from "../../types";
import type { DecodeContext } from "./types";

/** Identity letterbox context: input space === source space */
const identityCtx = (
  overrides: Partial<DecodeContext> = {},
): DecodeContext => ({
  inputSize: 640,
  sourceWidth: 640,
  sourceHeight: 640,
  scale: 1,
  padX: 0,
  padY: 0,
  labels: ["a", "b", "c"],
  minConfidence: 0.5,
  maxResults: 10,
  ...overrides,
});

const det = (
  label: string,
  confidence: number,
  box: [number, number, number, number],
): ObjectDetection => ({
  label,
  confidence,
  bbox: { x: box[0], y: box[1], width: box[2], height: box[3] },
});

describe("iou", () => {
  it("is 1 for identical boxes", () => {
    const box = { x: 0, y: 0, width: 10, height: 10 };
    expect(iou(box, box)).toBe(1);
  });

  it("is 0 for disjoint boxes", () => {
    expect(
      iou(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 100, y: 100, width: 10, height: 10 },
      ),
    ).toBe(0);
  });

  it("computes partial overlap", () => {
    // Two 10x10 boxes overlapping in a 5x5 corner: inter 25, union 175
    const value = iou(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 },
    );
    expect(value).toBeCloseTo(25 / 175, 6);
  });
});

describe("nms", () => {
  it("suppresses lower-confidence overlapping boxes of the same label", () => {
    const kept = nms(
      [det("a", 0.9, [0, 0, 10, 10]), det("a", 0.8, [1, 1, 10, 10])],
      0.45,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0].confidence).toBe(0.9);
  });

  it("keeps overlapping boxes of different labels", () => {
    const kept = nms(
      [det("a", 0.9, [0, 0, 10, 10]), det("b", 0.8, [0, 0, 10, 10])],
      0.45,
    );
    expect(kept).toHaveLength(2);
  });
});

describe("letterboxToSource", () => {
  it("undoes scale + padding to source pixels", () => {
    // source 1280x720, inputSize 640: scale 0.5, padY 140, padX 0
    const ctx = identityCtx({
      sourceWidth: 1280,
      sourceHeight: 720,
      scale: 0.5,
      padX: 0,
      padY: 140,
    });
    // input-space box (0,140)-(640,500) maps to full source frame
    const box = letterboxToSource(0, 140, 640, 500, ctx);
    expect(box).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
  });

  it("returns null for a degenerate box", () => {
    expect(letterboxToSource(10, 10, 10, 10, identityCtx())).toBeNull();
  });
});

describe("yoloDecoder", () => {
  it("decodes best-class anchors and applies NMS", () => {
    // dims [1, 6, 3] -> 2 classes, 3 anchors; data[c * anchors + a]
    // a0: center (100,100) 50x50, class0=0.9  -> kept
    // a1: low scores                          -> dropped
    // a2: same box as a0, class0=0.8          -> NMS-suppressed by a0
    const data = [
      100,
      200,
      100, // cx
      100,
      200,
      100, // cy
      50,
      40,
      50, // w
      50,
      40,
      50, // h
      0.9,
      0.3,
      0.8, // class 0
      0.1,
      0.2,
      0.1, // class 1
    ];

    const out = yoloDecoder.decode(
      { output0: { data, dims: [1, 6, 3] } },
      identityCtx({ labels: ["a", "b"] }),
    );

    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("a");
    expect(out[0].confidence).toBeCloseTo(0.9, 6);
    expect(out[0].bbox).toEqual({ x: 75, y: 75, width: 50, height: 50 });
  });

  it("respects maxResults", () => {
    // Three non-overlapping high-confidence detections, capped to 2
    const data = [
      50,
      200,
      400, // cx
      50,
      200,
      400, // cy
      20,
      20,
      20, // w
      20,
      20,
      20, // h
      0.9,
      0.8,
      0.7, // class 0
      0.0,
      0.0,
      0.0, // class 1
    ];
    const out = yoloDecoder.decode(
      { output0: { data, dims: [1, 6, 3] } },
      identityCtx({ labels: ["a", "b"], maxResults: 2 }),
    );
    expect(out).toHaveLength(2);
    expect(out.map((d) => d.confidence)).toEqual([0.9, 0.8]);
  });
});

describe("rfDetrDecoder", () => {
  it("decodes sigmoid scores from normalized boxes without NMS", () => {
    // 2 queries, 3 classes. boxes [1,2,4] cxcywh normalized; logits [1,2,3]
    // q0: center (0.5,0.5) 0.1x0.1, class1 logit 2 -> sigmoid ~0.881, kept
    // q1: all logits -5 -> sigmoid ~0.0067, dropped
    const boxes = [0.5, 0.5, 0.1, 0.1, 0.5, 0.5, 0.2, 0.2];
    const logits = [-5, 2, -5, -5, -5, -5];

    const out = rfDetrDecoder.decode(
      {
        boxes: { data: boxes, dims: [1, 2, 4] },
        logits: { data: logits, dims: [1, 2, 3] },
      },
      identityCtx(),
    );

    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("b");
    expect(out[0].confidence).toBeCloseTo(0.8808, 3);
    // 0.5*640=320 center, 0.1*640=64 size -> x=288,y=288
    expect(out[0].bbox).toEqual({ x: 288, y: 288, width: 64, height: 64 });
  });

  it("identifies boxes/logits tensors regardless of key order", () => {
    const boxes = [0.5, 0.5, 0.1, 0.1];
    const logits = [-5, 3, -5];
    const out = rfDetrDecoder.decode(
      {
        // logits first, boxes second: split must key off dims, not order
        pred_logits: { data: logits, dims: [1, 1, 3] },
        pred_boxes: { data: boxes, dims: [1, 1, 4] },
      },
      identityCtx(),
    );
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("b");
  });
});
