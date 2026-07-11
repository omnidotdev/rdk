import { letterboxToSource, nms } from "./nms";

import type { ObjectDetection } from "../../types";
import type {
  DecodeContext,
  DecodeResult,
  ONNXDecoder,
  TensorLike,
} from "./types";

/** IoU threshold for YOLO non-maximum suppression */
const YOLO_IOU_THRESHOLD = 0.45;

/** Pick the single output tensor regardless of its key */
const firstTensor = (outputs: Record<string, TensorLike>): TensorLike => {
  const values = Object.values(outputs);
  if (values.length === 0) throw new Error("YOLO decoder: no output tensors");
  return values[0];
};

/**
 * Decoder for YOLOv8/v11-style detection heads.
 *
 * Output tensor shape `[1, 4 + numClasses, numAnchors]` (transposed head):
 * value(channel, anchor) = data[channel * numAnchors + anchor]. Channels 0-3
 * are `cx, cy, w, h` in input-space pixels; the rest are per-class scores.
 * Requires NMS since anchors are dense and unfiltered.
 */
export const yoloDecoder: ONNXDecoder = {
  name: "yolo",

  decode(
    outputs: Record<string, TensorLike>,
    ctx: DecodeContext,
  ): DecodeResult {
    const tensor = firstTensor(outputs);
    const { dims, data } = tensor;

    if (dims.length !== 3 || dims[0] !== 1) {
      throw new Error(
        `YOLO decoder: expected [1, C, A] output, got [${dims.join(", ")}]`,
      );
    }

    const channels = dims[1];
    const anchors = dims[2];
    const numClasses = channels - 4;
    if (numClasses <= 0) {
      throw new Error(`YOLO decoder: too few channels (${channels})`);
    }

    const detections: ObjectDetection[] = [];

    for (let a = 0; a < anchors; a++) {
      // Best class for this anchor
      let bestScore = 0;
      let bestClass = -1;
      for (let c = 0; c < numClasses; c++) {
        const score = data[(4 + c) * anchors + a];
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }

      if (bestClass < 0 || bestScore < ctx.minConfidence) continue;

      const cx = data[a];
      const cy = data[anchors + a];
      const w = data[2 * anchors + a];
      const h = data[3 * anchors + a];

      const bbox = letterboxToSource(
        cx - w / 2,
        cy - h / 2,
        cx + w / 2,
        cy + h / 2,
        ctx,
      );
      if (!bbox) continue;

      detections.push({
        label: ctx.labels[bestClass] ?? String(bestClass),
        confidence: bestScore,
        bbox,
      });
    }

    const objects = nms(detections, YOLO_IOU_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, ctx.maxResults);

    return { objects };
  },
};
