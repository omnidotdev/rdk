import { describe, expect, it, mock } from "bun:test";

import { fist, openHand, peace, thumbsUp } from "./builtinGestures";
import detectGesture from "./detectGesture";

import type { VisionLandmark } from "../types";
import type { GestureDetector } from "./types";

// Helper to create a 21-point hand landmark array
// Positions set to a neutral fist by default
const createHandLandmarks = (
  overrides: Partial<Record<number, Partial<VisionLandmark>>> = {},
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

describe("detectGesture", () => {
  it("should return 'none' for insufficient landmarks", () => {
    const result = detectGesture([{ x: 0, y: 0, z: 0 }]);
    expect(result.gesture).toBe("none");
    expect(result.confidence).toBe(0);
  });

  it("should detect thumbs up", () => {
    // Thumb extended (tip farther from middle MCP than IP), all other fingers curled
    const landmarks = createHandLandmarks({
      3: { x: 0.45 }, // thumb IP (closer to middle MCP)
      4: { x: 0.7 }, // thumb tip (farther from middle MCP -> extended)
      6: { y: 0.4 }, // index MCP
      8: { y: 0.6 }, // index tip (curled, y > mcp)
      10: { y: 0.4 }, // middle MCP
      12: { y: 0.6 }, // middle tip (curled)
      14: { y: 0.4 }, // ring MCP
      16: { y: 0.6 }, // ring tip (curled)
      18: { y: 0.4 }, // pinky MCP
      20: { y: 0.6 }, // pinky tip (curled)
    });

    const result = thumbsUp(landmarks);
    expect(result).not.toBeNull();
    expect(result?.gesture).toBe("thumbs_up");
    expect(result?.confidence).toBe(0.9);
  });

  it("should detect peace sign", () => {
    // Thumb not extended, index + middle up, ring + pinky down
    const landmarks = createHandLandmarks({
      3: { x: 0.3 }, // thumb IP (farther from middle MCP than tip -> curled)
      4: { x: 0.48 }, // thumb tip (close to middle MCP -> not extended)
      6: { y: 0.6 }, // index MCP
      8: { y: 0.3 }, // index tip (extended, y < mcp)
      10: { y: 0.6 }, // middle MCP
      12: { y: 0.3 }, // middle tip (extended)
      14: { y: 0.4 }, // ring MCP
      16: { y: 0.6 }, // ring tip (curled)
      18: { y: 0.4 }, // pinky MCP
      20: { y: 0.6 }, // pinky tip (curled)
    });

    const result = peace(landmarks);
    expect(result).not.toBeNull();
    expect(result?.gesture).toBe("peace");
  });

  it("should detect open hand", () => {
    // All fingers extended
    const landmarks = createHandLandmarks({
      3: { x: 0.45 }, // thumb IP (closer to middle MCP)
      4: { x: 0.7 }, // thumb tip (farther -> extended)
      6: { y: 0.6 },
      8: { y: 0.3 }, // index up
      10: { y: 0.6 },
      12: { y: 0.3 }, // middle up
      14: { y: 0.6 },
      16: { y: 0.3 }, // ring up
      18: { y: 0.6 },
      20: { y: 0.3 }, // pinky up
    });

    const result = openHand(landmarks);
    expect(result).not.toBeNull();
    expect(result?.gesture).toBe("open_hand");
  });

  it("should detect fist", () => {
    // All fingers curled (including thumb not extended)
    const landmarks = createHandLandmarks({
      3: { x: 0.3 }, // thumb IP (farther from middle MCP -> curled)
      4: { x: 0.48 }, // thumb tip (close to middle MCP -> not extended)
      6: { y: 0.4 },
      8: { y: 0.6 }, // index curled
      10: { y: 0.4 },
      12: { y: 0.6 }, // middle curled
      14: { y: 0.4 },
      16: { y: 0.6 }, // ring curled
      18: { y: 0.4 },
      20: { y: 0.6 }, // pinky curled
    });

    const result = fist(landmarks);
    expect(result).not.toBeNull();
    expect(result?.gesture).toBe("fist");
  });

  it("should pick the highest confidence match", () => {
    // Create landmarks that could match multiple gestures
    // Open hand also has all fingers up (fist won't match)
    const landmarks = createHandLandmarks({
      3: { x: 0.45 },
      4: { x: 0.7 }, // thumb up (tip farther from MCP 9)
      6: { y: 0.6 },
      8: { y: 0.3 }, // index up
      10: { y: 0.6 },
      12: { y: 0.3 }, // middle up
      14: { y: 0.6 },
      16: { y: 0.3 }, // ring up
      18: { y: 0.6 },
      20: { y: 0.3 }, // pinky up
    });

    const result = detectGesture(landmarks);
    // thumbs_up (0.9) > open_hand (0.7) -- but since all fingers are up,
    // thumbs_up won't match (requires others down). open_hand should win
    expect(result.gesture).toBe("open_hand");
  });

  it("should accept custom detectors", () => {
    const customDetector: GestureDetector = mock(() => ({
      gesture: "custom_wave",
      confidence: 0.95,
    }));

    const landmarks = createHandLandmarks();
    const result = detectGesture(landmarks, [customDetector]);

    expect(customDetector).toHaveBeenCalledWith(landmarks);
    expect(result.gesture).toBe("custom_wave");
    expect(result.confidence).toBe(0.95);
  });

  it("should return none when no detectors match", () => {
    const neverMatch: GestureDetector = () => null;
    const landmarks = createHandLandmarks();

    const result = detectGesture(landmarks, [neverMatch]);
    expect(result.gesture).toBe("none");
    expect(result.confidence).toBe(0);
  });
});
