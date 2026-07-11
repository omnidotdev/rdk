import { letterboxToSource } from "./nms";

import type { ObjectDetection } from "../../types";
import type { DecodeContext, ONNXDecoder, TensorLike } from "./types";

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

/** Locate the boxes tensor ([1, Q, 4]) and the logits tensor ([1, Q, C]) */
const splitOutputs = (
  outputs: Record<string, TensorLike>,
): { boxes: TensorLike; logits: TensorLike } => {
  const tensors = Object.values(outputs).filter((t) => t.dims.length === 3);
  const boxes = tensors.find((t) => t.dims[2] === 4);
  const logits = tensors.find((t) => t !== boxes);

  if (!boxes || !logits) {
    throw new Error(
      "RF-DETR decoder: expected a [1, Q, 4] boxes tensor and a [1, Q, C] logits tensor",
    );
  }
  return { boxes, logits };
};

/**
 * Decoder for RF-DETR / DETR-style set-prediction heads.
 *
 * Two outputs: boxes `[1, Q, 4]` in normalized `cxcywh` (0-1 over the square
 * input) and logits `[1, Q, C]`. Scores are `sigmoid(logits)`; the best class
 * per query is thresholded and top-k selected. NMS-free by construction.
 */
export const rfDetrDecoder: ONNXDecoder = {
  name: "rfdetr",

  decode(
    outputs: Record<string, TensorLike>,
    ctx: DecodeContext,
  ): ObjectDetection[] {
    const { boxes, logits } = splitOutputs(outputs);

    const numQueries = boxes.dims[1];
    const numClasses = logits.dims[2];
    const boxData = boxes.data;
    const logitData = logits.data;

    const detections: ObjectDetection[] = [];

    for (let q = 0; q < numQueries; q++) {
      let bestScore = 0;
      let bestClass = -1;
      for (let c = 0; c < numClasses; c++) {
        const score = sigmoid(logitData[q * numClasses + c]);
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }

      if (bestClass < 0 || bestScore < ctx.minConfidence) continue;

      // Normalized cxcywh -> input-space pixels
      const base = q * 4;
      const cx = boxData[base] * ctx.inputSize;
      const cy = boxData[base + 1] * ctx.inputSize;
      const w = boxData[base + 2] * ctx.inputSize;
      const h = boxData[base + 3] * ctx.inputSize;

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

    // Set prediction: no NMS, just rank and cap
    return detections
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, ctx.maxResults);
  },
};
