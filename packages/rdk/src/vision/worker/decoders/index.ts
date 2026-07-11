import { rfDetrDecoder } from "./rfDetr";
import { yoloDecoder } from "./yolo";

import type { ONNXDecoderName } from "../../types";
import type { ONNXDecoder } from "./types";

/** Registry of built-in ONNX output decoders, keyed by name */
const DECODERS: Record<ONNXDecoderName, ONNXDecoder> = {
  yolo: yoloDecoder,
  rfdetr: rfDetrDecoder,
};

/** Resolve a decoder by name, defaulting to YOLO */
export const getDecoder = (name: ONNXDecoderName = "yolo"): ONNXDecoder =>
  DECODERS[name] ?? yoloDecoder;

export type { DecodeContext, ONNXDecoder, TensorLike } from "./types";
