import { describe, expect, it } from "vitest";

import { landmarksCentroid, landmarkToWorld } from "./landmarkMapping";

// Matched aspect: 16:9 viewport, 1280x720 frame -> no crop (rx = ry = 1)
const viewport = { width: 16, height: 9 };
const frame = { width: 1280, height: 720 };

describe("landmarkToWorld", () => {
  it("maps the centered landmark to the origin on the focal plane", () => {
    expect(
      landmarkToWorld({ x: 0.5, y: 0.5, z: 0.4 }, viewport, frame),
    ).toEqual([0, 0, 0]);
  });

  it("always anchors to z = 0 (no parallax offset)", () => {
    const [, , z] = landmarkToWorld(
      { x: 0.2, y: 0.8, z: 0.9 },
      viewport,
      frame,
    );
    expect(z).toBe(0);
  });

  it("flips y (top-down) into world up", () => {
    const [, y] = landmarkToWorld({ x: 0.5, y: 0, z: 0 }, viewport, frame);
    expect(y).toBe(4.5);
  });

  it("mirrors x by default for a selfie camera", () => {
    const [x] = landmarkToWorld({ x: 0, y: 0.5, z: 0 }, viewport, frame);
    expect(x).toBe(8);
  });

  it("does not mirror x when disabled", () => {
    const [x] = landmarkToWorld({ x: 0, y: 0.5, z: 0 }, viewport, frame, false);
    expect(x).toBe(-8);
  });

  it("undoes horizontal cover-crop for a portrait canvas", () => {
    // Portrait 9:16 canvas, landscape 1280x720 frame -> width is cropped.
    // containerAspect = 9/16 = 0.5625, frameAspect = 1.7778, rx = 3.1605
    const portrait = { width: 9, height: 16 };
    // A landmark at the right edge of the *visible* strip (u = 1) sits at -w/2
    // (mirrored). Visible right edge in frame coords: x = 0.5 + 0.5/rx.
    const rx = 1.7778 / 0.5625;
    const edge = 0.5 + 0.5 / rx;
    const [x] = landmarkToWorld({ x: edge, y: 0.5, z: 0 }, portrait, frame);
    expect(x).toBeCloseTo(-4.5, 3);
  });

  it("does not crop when frame and canvas aspects match", () => {
    // 4:3 frame into 4:3 viewport -> rx = ry = 1, deviation preserved
    const [x] = landmarkToWorld(
      { x: 0.25, y: 0.5, z: 0 },
      { width: 4, height: 3 },
      { width: 640, height: 480 },
      false,
    );
    // (0.25 - 0.5) * 4 = -1
    expect(x).toBeCloseTo(-1, 6);
  });
});

describe("landmarksCentroid", () => {
  it("averages landmark coordinates", () => {
    expect(
      landmarksCentroid([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 2 },
      ]),
    ).toEqual({ x: 0.5, y: 0.5, z: 1 });
  });
});
