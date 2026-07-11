import { iou, letterboxToSource } from "./nms";

import type { SegmentationMask } from "../../types";
import type {
  DecodeContext,
  DecodeResult,
  ONNXDecoder,
  TensorLike,
} from "./types";

/** IoU threshold for YOLO-seg non-maximum suppression */
const SEG_IOU_THRESHOLD = 0.45;
/** Mask coefficient cutoff after sigmoid */
const MASK_THRESHOLD = 0.5;

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

type Candidate = {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  /** Box in input-space (letterboxed) pixels, for cropping the prototype masks */
  inputBox: [number, number, number, number];
  coeffs: number[];
};

/**
 * Decoder for YOLOv8/v11-**seg** instance-segmentation heads.
 *
 * Two outputs: detection `[1, 4 + numClasses + M, numAnchors]` (box + class
 * scores + M mask coefficients) and prototypes `[1, M, protoH, protoW]`. Each
 * kept detection's mask is `sigmoid(coeffs . prototypes)`, thresholded and
 * cropped to its box (prototypes live in the same letterboxed input space).
 */
export const yoloSegDecoder: ONNXDecoder = {
  name: "yoloseg",

  decode(
    outputs: Record<string, TensorLike>,
    ctx: DecodeContext,
  ): DecodeResult {
    const tensors = Object.values(outputs);
    const proto = tensors.find((t) => t.dims.length === 4);
    const det = tensors.find((t) => t.dims.length === 3);
    if (!proto || !det) {
      throw new Error(
        "YOLO-seg decoder: expected a [1, C, A] detection tensor and a [1, M, H, W] prototype tensor",
      );
    }

    const numCoeffs = proto.dims[1];
    const protoH = proto.dims[2];
    const protoW = proto.dims[3];
    const channels = det.dims[1];
    const anchors = det.dims[2];
    const numClasses = channels - 4 - numCoeffs;
    if (numClasses <= 0) {
      throw new Error(`YOLO-seg decoder: bad channel count (${channels})`);
    }

    const data = det.data;
    const candidates: Candidate[] = [];

    for (let a = 0; a < anchors; a++) {
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
      const x1 = cx - w / 2;
      const y1 = cy - h / 2;
      const x2 = cx + w / 2;
      const y2 = cy + h / 2;

      const bbox = letterboxToSource(x1, y1, x2, y2, ctx);
      if (!bbox) continue;

      const coeffs: number[] = [];
      for (let k = 0; k < numCoeffs; k++) {
        coeffs.push(data[(4 + numClasses + k) * anchors + a]);
      }

      candidates.push({
        label: ctx.labels[bestClass] ?? String(bestClass),
        confidence: bestScore,
        bbox,
        inputBox: [x1, y1, x2, y2],
        coeffs,
      });
    }

    // Greedy NMS, then cap
    candidates.sort((a, b) => b.confidence - a.confidence);
    const kept: Candidate[] = [];
    for (const cand of candidates) {
      const overlaps = kept.some(
        (k) =>
          k.label === cand.label && iou(k.bbox, cand.bbox) > SEG_IOU_THRESHOLD,
      );
      if (!overlaps) kept.push(cand);
      if (kept.length >= ctx.maxResults) break;
    }

    const protoData = proto.data;
    const plane = protoH * protoW;
    const sx = protoW / ctx.inputSize;
    const sy = protoH / ctx.inputSize;

    const masks: SegmentationMask[] = kept.map((cand) => {
      const [ix1, iy1, ix2, iy2] = cand.inputBox;
      const px0 = Math.max(0, Math.floor(ix1 * sx));
      const py0 = Math.max(0, Math.floor(iy1 * sy));
      const px1 = Math.min(protoW, Math.ceil(ix2 * sx));
      const py1 = Math.min(protoH, Math.ceil(iy2 * sy));
      const cw = Math.max(1, px1 - px0);
      const ch = Math.max(1, py1 - py0);
      const mask = new Uint8Array(cw * ch);

      for (let py = py0; py < py1; py++) {
        for (let px = px0; px < px1; px++) {
          let sum = 0;
          for (let k = 0; k < numCoeffs; k++) {
            sum += cand.coeffs[k] * protoData[k * plane + py * protoW + px];
          }
          if (sigmoid(sum) > MASK_THRESHOLD) {
            mask[(py - py0) * cw + (px - px0)] = 255;
          }
        }
      }

      return {
        label: cand.label,
        confidence: cand.confidence,
        bbox: cand.bbox,
        mask,
        maskWidth: cw,
        maskHeight: ch,
      };
    });

    const objects = kept.map((c) => ({
      label: c.label,
      confidence: c.confidence,
      bbox: c.bbox,
    }));

    return { objects, masks };
  },
};
