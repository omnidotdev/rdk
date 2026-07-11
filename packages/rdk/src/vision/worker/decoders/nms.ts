import type { ObjectDetection } from "../../types";
import type { DecodeContext } from "./types";

/** Axis-aligned box in [x, y, width, height] form */
export type Box = { x: number; y: number; width: number; height: number };

/** Intersection-over-union of two axis-aligned boxes */
export const iou = (a: Box, b: Box): number => {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const interX1 = Math.max(a.x, b.x);
  const interY1 = Math.max(a.y, b.y);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;
  if (interArea === 0) return 0;

  const union = a.width * a.height + b.width * b.height - interArea;
  return union <= 0 ? 0 : interArea / union;
};

/**
 * Greedy non-maximum suppression. Detections are sorted by confidence, then
 * lower-scoring boxes overlapping a kept box (of the same class) beyond
 * `iouThreshold` are discarded.
 */
export const nms = (
  detections: ObjectDetection[],
  iouThreshold: number,
): ObjectDetection[] => {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: ObjectDetection[] = [];

  for (const candidate of sorted) {
    const overlaps = kept.some(
      (k) =>
        k.label === candidate.label &&
        iou(k.bbox, candidate.bbox) > iouThreshold,
    );
    if (!overlaps) kept.push(candidate);
  }

  return kept;
};

/**
 * Map a box from letterboxed input space (xyxy) back to source pixels,
 * clamped to the frame, returning null if degenerate.
 */
export const letterboxToSource = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ctx: DecodeContext,
): Box | null => {
  const sx1 = (x1 - ctx.padX) / ctx.scale;
  const sy1 = (y1 - ctx.padY) / ctx.scale;
  const sx2 = (x2 - ctx.padX) / ctx.scale;
  const sy2 = (y2 - ctx.padY) / ctx.scale;

  const cx1 = Math.max(0, Math.min(sx1, ctx.sourceWidth));
  const cy1 = Math.max(0, Math.min(sy1, ctx.sourceHeight));
  const cx2 = Math.max(0, Math.min(sx2, ctx.sourceWidth));
  const cy2 = Math.max(0, Math.min(sy2, ctx.sourceHeight));

  const width = cx2 - cx1;
  const height = cy2 - cy1;
  if (width <= 0 || height <= 0) return null;

  return { x: cx1, y: cy1, width, height };
};
