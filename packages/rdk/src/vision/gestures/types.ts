import type { VisionLandmark } from "../types";

export type GestureResult = { gesture: string; confidence: number };

export type GestureDetector = (
  landmarks: VisionLandmark[],
) => GestureResult | null;
