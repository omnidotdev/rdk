import type { VisionLandmark } from "../types";
import type { GestureDetector, GestureResult } from "./types";

/** Check if a finger is extended (tip is above MCP joint) */
const isExtended = (tip: VisionLandmark, mcp: VisionLandmark): boolean =>
  tip.y < mcp.y;

/** Get the array of which fingers are up [thumb, index, middle, ring, pinky] */
const getFingerStates = (landmarks: VisionLandmark[]): boolean[] => [
  // Thumb: tip (4) farther from middle MCP (9) than IP joint (3) — works for both hands
  Math.abs(landmarks[4].x - landmarks[9].x) >
    Math.abs(landmarks[3].x - landmarks[9].x),
  isExtended(landmarks[8], landmarks[6]),
  isExtended(landmarks[12], landmarks[10]),
  isExtended(landmarks[16], landmarks[14]),
  isExtended(landmarks[20], landmarks[18]),
];

const thumbsUp: GestureDetector = (landmarks): GestureResult | null => {
  if (landmarks.length < 21) return null;
  const fingers = getFingerStates(landmarks);

  if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
    return { gesture: "thumbs_up", confidence: 0.9 };
  }

  return null;
};

const peace: GestureDetector = (landmarks): GestureResult | null => {
  if (landmarks.length < 21) return null;
  const fingers = getFingerStates(landmarks);

  if (!fingers[0] && fingers[1] && fingers[2] && !fingers[3] && !fingers[4]) {
    return { gesture: "peace", confidence: 0.8 };
  }

  return null;
};

const ok: GestureDetector = (landmarks): GestureResult | null => {
  if (landmarks.length < 21) return null;
  const fingers = getFingerStates(landmarks);

  // Pinch detection (thumb and index close together)
  const pinchDistance = Math.sqrt(
    (landmarks[4].x - landmarks[8].x) ** 2 +
      (landmarks[4].y - landmarks[8].y) ** 2,
  );

  if (pinchDistance < 0.05 && fingers[2] && fingers[3] && fingers[4]) {
    return { gesture: "ok", confidence: 0.8 };
  }

  return null;
};

const openHand: GestureDetector = (landmarks): GestureResult | null => {
  if (landmarks.length < 21) return null;
  const fingers = getFingerStates(landmarks);
  const fingerCount = fingers.filter(Boolean).length;

  if (fingerCount === 5) {
    return { gesture: "open_hand", confidence: 0.7 };
  }

  return null;
};

const fist: GestureDetector = (landmarks): GestureResult | null => {
  if (landmarks.length < 21) return null;
  const fingers = getFingerStates(landmarks);
  const fingerCount = fingers.filter(Boolean).length;

  if (fingerCount <= 1) {
    return { gesture: "fist", confidence: 0.7 };
  }

  return null;
};

const DEFAULT_GESTURES: GestureDetector[] = [
  thumbsUp,
  peace,
  ok,
  openHand,
  fist,
];

export { DEFAULT_GESTURES, fist, ok, openHand, peace, thumbsUp };
