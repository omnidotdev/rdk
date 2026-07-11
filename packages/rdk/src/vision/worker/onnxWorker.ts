// ONNX inference web worker
// Loads onnxruntime-web models and runs inference off the main thread.

import { getDecoder } from "./decoders";
import { computeLetterbox, rgbaToNchw } from "./preprocess";

import type { InferenceSession } from "onnxruntime-web";
import type {
  ObjectDetection,
  ONNXModelConfig,
  SegmentationMask,
} from "../types";
import type { DecodeContext, DecodeResult, TensorLike } from "./decoders";
import type {
  ONNXProcessOptions,
  ONNXWorkerRequest,
  ONNXWorkerResponse,
} from "./types";

type OrtModule = typeof import("onnxruntime-web");

type LoadedModel = { config: ONNXModelConfig; session: InferenceSession };

/** YOLO-style neutral gray used for letterbox padding */
const LETTERBOX_PAD = "rgb(114, 114, 114)";
const DEFAULT_INPUT_SIZE = 640;

let ortPromise: Promise<OrtModule> | null = null;
const models = new Map<string, LoadedModel>();

/** Lazily import onnxruntime-web (optional peer dep) and point wasm at a CDN */
const loadOrt = (): Promise<OrtModule> => {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web").then((ort) => {
      ort.env.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
      return ort;
    });
  }
  return ortPromise;
};

const post = (message: ONNXWorkerResponse, transfer?: Transferable[]): void => {
  if (transfer && transfer.length > 0) {
    self.postMessage(message, { transfer });
  } else {
    self.postMessage(message);
  }
};

/** Preprocess, run one model, and decode its outputs to source-space boxes */
const runModel = async (
  ort: OrtModule,
  loaded: LoadedModel,
  bitmap: ImageBitmap,
  sourceWidth: number,
  sourceHeight: number,
  options: ONNXProcessOptions,
): Promise<DecodeResult> => {
  const size = loaded.config.inputSize ?? DEFAULT_INPUT_SIZE;
  const { scale, padX, padY, drawWidth, drawHeight } = computeLetterbox(
    sourceWidth,
    sourceHeight,
    size,
  );

  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to acquire OffscreenCanvas 2D context");

  ctx.fillStyle = LETTERBOX_PAD;
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, padX, padY, drawWidth, drawHeight);
  const { data: rgba } = ctx.getImageData(0, 0, size, size);

  const input = new ort.Tensor("float32", rgbaToNchw(rgba, size), [
    1,
    3,
    size,
    size,
  ]);
  const feeds = { [loaded.session.inputNames[0]]: input };
  const results = await loaded.session.run(feeds);

  const outputs: Record<string, TensorLike> = {};
  for (const [name, tensor] of Object.entries(results)) {
    outputs[name] = {
      data: tensor.data as Float32Array,
      dims: tensor.dims,
    };
  }

  const decodeCtx: DecodeContext = {
    inputSize: size,
    sourceWidth,
    sourceHeight,
    scale,
    padX,
    padY,
    labels: loaded.config.labels ?? [],
    minConfidence: options.minConfidence,
    maxResults: options.maxResults,
  };

  return getDecoder(loaded.config.decoder).decode(outputs, decodeCtx);
};

const handleMessage = async (event: MessageEvent): Promise<void> => {
  const message = event.data as ONNXWorkerRequest;

  switch (message.type) {
    case "init": {
      post({ type: "initialized" });
      break;
    }

    case "loadModel": {
      const { model } = message;
      try {
        const ort = await loadOrt();
        const session = await ort.InferenceSession.create(model.path, {
          executionProviders: ["webgpu", "wasm"],
        });
        models.set(model.name, { config: model, session });
        post({ type: "modelLoaded", modelName: model.name });
      } catch (error) {
        post({
          type: "modelError",
          modelName: model.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }

    case "process": {
      const { imageBitmap, sourceWidth, sourceHeight, options } = message;
      try {
        const ort = await loadOrt();
        const started = performance.now();

        const detections: ObjectDetection[] = [];
        const masks: SegmentationMask[] = [];
        for (const loaded of models.values()) {
          const result = await runModel(
            ort,
            loaded,
            imageBitmap,
            sourceWidth,
            sourceHeight,
            options,
          );
          if (result.objects) detections.push(...result.objects);
          if (result.masks) masks.push(...result.masks);
        }

        // Transfer mask buffers (zero-copy) instead of structured-cloning them
        const transfer = masks.map((m) => m.mask.buffer);

        post(
          {
            type: "result",
            result: {
              detections,
              masks,
              frameSize: { width: sourceWidth, height: sourceHeight },
              timestamp: Date.now(),
              processingTime: performance.now() - started,
            },
          },
          transfer,
        );
      } catch (error) {
        post({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        imageBitmap.close();
      }
      break;
    }

    case "dispose": {
      for (const { session } of models.values()) {
        void session.release();
      }
      models.clear();
      break;
    }
  }
};

self.addEventListener("message", handleMessage);
