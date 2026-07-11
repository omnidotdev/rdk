import { describe, expect, it } from "vitest";

import detectGesture from "./detectGesture";

import type { VisionLandmark } from "../types";
import type { GestureDetector } from "./types";

/**
 * Build a 21-point hand. Defaults to a neutral fist (all tips level with
 * joints, so no finger reads as extended); pass overrides to raise fingers.
 */
const hand = (
  overrides: Record<number, Partial<VisionLandmark>> = {},
): VisionLandmark[] => {
  const base: VisionLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));
  for (const [idx, values] of Object.entries(overrides)) {
    base[Number(idx)] = { ...base[Number(idx)], ...values };
  }
  return base;
};

// Raise a finger: tip.y above its joint. [tip, joint] pairs from builtinGestures
const raiseIndex = { 8: { y: 0.1 } };
const raiseMiddle = { 12: { y: 0.1 } };
const raiseRing = { 16: { y: 0.1 } };
const raisePinky = { 20: { y: 0.1 } };
// Thumb out: tip (4) farther from middle MCP (9) on x than IP joint (3)
const raiseThumb = { 4: { x: 0.9 } };

describe("detectGesture", () => {
  it("returns 'none' for insufficient landmarks", () => {
    expect(detectGesture([{ x: 0, y: 0, z: 0 }])).toEqual({
      gesture: "none",
      confidence: 0,
    });
  });

  it("detects a fist when no fingers are extended", () => {
    expect(detectGesture(hand()).gesture).toBe("fist");
  });

  it("detects thumbs up", () => {
    expect(detectGesture(hand(raiseThumb)).gesture).toBe("thumbs_up");
  });

  it("detects peace (index + middle up)", () => {
    expect(detectGesture(hand({ ...raiseIndex, ...raiseMiddle })).gesture).toBe(
      "peace",
    );
  });

  it("detects an open hand (all fingers up)", () => {
    const open = hand({
      ...raiseThumb,
      ...raiseIndex,
      ...raiseMiddle,
      ...raiseRing,
      ...raisePinky,
    });
    expect(detectGesture(open).gesture).toBe("open_hand");
  });

  it("returns the highest-confidence match across detectors", () => {
    const always: GestureDetector[] = [
      () => ({ gesture: "low", confidence: 0.3 }),
      () => ({ gesture: "high", confidence: 0.95 }),
      () => null,
    ];
    expect(detectGesture(hand(), always)).toEqual({
      gesture: "high",
      confidence: 0.95,
    });
  });
});
