import { rfDetrDecoder } from "./rfDetr";
import { yoloDecoder } from "./yolo";
import { yoloSegDecoder } from "./yoloSeg";

import type { ONNXDecoderName } from "../../types";
import type { ONNXDecoder } from "./types";

/** Registry of built-in ONNX output decoders, keyed by name */
const DECODERS: Record<ONNXDecoderName, ONNXDecoder> = {
  yolo: yoloDecoder,
  rfdetr: rfDetrDecoder,
  yoloseg: yoloSegDecoder,
};

/** Resolve a decoder by name, defaulting to YOLO */
export const getDecoder = (name: ONNXDecoderName = "yolo"): ONNXDecoder =>
  DECODERS[name] ?? yoloDecoder;

export type {
  DecodeContext,
  DecodeResult,
  ONNXDecoder,
  TensorLike,
} from "./types";
