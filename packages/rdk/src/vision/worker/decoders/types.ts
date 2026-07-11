import type { ObjectDetection } from "../../types";

/**
 * Minimal structural view of an onnxruntime-web tensor. Decoders depend on this
 * rather than the ort types so they stay pure and unit-testable with fixtures.
 */
export type TensorLike = {
  data: Float32Array | number[];
  dims: readonly number[];
};

/**
 * Preprocessing transform + metadata needed to map model outputs (in
 * letterboxed input space) back to source pixel coordinates.
 */
export type DecodeContext = {
  /** Square input side length fed to the model (e.g. 640) */
  inputSize: number;
  /** Original source frame dimensions */
  sourceWidth: number;
  sourceHeight: number;
  /** Uniform letterbox scale applied to the source: min(inputSize/sw, inputSize/sh) */
  scale: number;
  /** Letterbox padding (input-space pixels) added on each axis */
  padX: number;
  padY: number;
  /** Class labels indexed by class id */
  labels: string[];
  /** Minimum confidence to keep a detection */
  minConfidence: number;
  /** Maximum detections to return */
  maxResults: number;
};

/**
 * Interprets a model's raw output tensors into detections in source pixel
 * coordinates. Register concrete decoders by {@link import("../../types").ONNXDecoderName}.
 */
export type ONNXDecoder = {
  readonly name: string;
  decode(
    outputs: Record<string, TensorLike>,
    ctx: DecodeContext,
  ): ObjectDetection[];
};
