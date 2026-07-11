import { DEFAULT_GESTURES } from "./builtinGestures";

import type { VisionLandmark } from "../types";
import type { GestureDetector, GestureResult } from "./types";

const NO_GESTURE: GestureResult = { gesture: "none", confidence: 0 };

/**
 * Detect gestures from hand landmarks using the provided detectors.
 * Returns the highest-confidence match, or `{ gesture: "none", confidence: 0 }`.
 */
const detectGesture = (
  landmarks: VisionLandmark[],
  detectors: GestureDetector[] = DEFAULT_GESTURES,
): GestureResult => {
  let best: GestureResult = NO_GESTURE;

  for (const detector of detectors) {
    const result = detector(landmarks);
    if (result && result.confidence > best.confidence) {
      best = result;
    }
  }

  return best;
};

export default detectGesture;
