import { describe, expect, it } from "vitest";

import { computeLetterbox, isPaddingIntact, rgbaToNchw } from "./preprocess";

describe("computeLetterbox", () => {
  it("pads the shorter axis for a landscape frame", () => {
    // 1280x720 into 640: scale 0.5, drawn 640x360, vertical pad 140
    expect(computeLetterbox(1280, 720, 640)).toEqual({
      scale: 0.5,
      drawWidth: 640,
      drawHeight: 360,
      padX: 0,
      padY: 140,
    });
  });

  it("has zero padding for a square frame", () => {
    const lb = computeLetterbox(640, 640, 640);
    expect(lb.padX).toBe(0);
    expect(lb.padY).toBe(0);
    expect(lb.scale).toBe(1);
  });
});

describe("rgbaToNchw", () => {
  it("splits interleaved RGBA into normalized planar channels", () => {
    // 2x2: red, green, blue, white
    const rgba = new Uint8ClampedArray([
      255,
      0,
      0,
      255, // red
      0,
      255,
      0,
      255, // green
      0,
      0,
      255,
      255, // blue
      255,
      255,
      255,
      255, // white
    ]);

    const out = rgbaToNchw(rgba, 2);

    // R plane, then G plane, then B plane
    expect(Array.from(out)).toEqual([
      1,
      0,
      0,
      1, // R
      0,
      1,
      0,
      1, // G
      0,
      0,
      1,
      1, // B
    ]);
  });
});

describe("isPaddingIntact", () => {
  const gray = (v: number) =>
    new Uint8ClampedArray([v, v, v, 255, 0, 0, 0, 255]);
  const landscape = computeLetterbox(1280, 720, 640);

  it("accepts padding that reads back as the fill gray", () => {
    expect(isPaddingIntact(gray(114), landscape, 114)).toBe(true);
  });

  it("tolerates small readback noise", () => {
    expect(isPaddingIntact(gray(116), landscape, 114)).toBe(true);
  });

  it("rejects padding that reads back blank (blocked canvas readback)", () => {
    expect(isPaddingIntact(gray(255), landscape, 114)).toBe(false);
  });

  it("cannot judge a square frame with no padding", () => {
    expect(
      isPaddingIntact(gray(255), computeLetterbox(640, 640, 640), 114),
    ).toBe(true);
  });
});
