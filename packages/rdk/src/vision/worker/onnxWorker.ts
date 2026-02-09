// ONNX Worker - handles ONNX model inference off-main-thread
// ONNX Runtime will be loaded dynamically
// biome-ignore lint/suspicious/noExplicitAny: ONNX Runtime loaded at runtime
declare const ort: any;

interface ONNXModelConfig {
  name: string;
  url: string;
  type: "detection" | "segmentation" | "custom";
  inputShape: [number, number, number, number];
  labels?: string[];
  preprocessor?: "yolo" | "none";
  postprocessor?: "yolo" | "none";
  threshold?: number;
  nmsThreshold?: number;
}

interface ONNXDetection {
  bbox: [number, number, number, number];
  class: number;
  confidence: number;
  label?: string;
}

class ONNXWorker {
  // biome-ignore lint/suspicious/noExplicitAny: ONNX Runtime sessions loaded at runtime
  private models = new Map<string, any>();
  private modelConfigs = new Map<string, ONNXModelConfig>();

  async initialize(): Promise<void> {
    try {
      // ONNX Runtime should be loaded by the main thread
      if (typeof ort === "undefined") {
        throw new Error("ONNX Runtime not loaded");
      }

      self.postMessage({ type: "initialized" });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }

  async loadModel(config: ONNXModelConfig): Promise<void> {
    try {
      const session = await ort.InferenceSession.create(config.url, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });

      this.models.set(config.name, session);
      this.modelConfigs.set(config.name, config);

      self.postMessage({
        type: "modelLoaded",
        modelName: config.name,
      });
    } catch (error) {
      self.postMessage({
        type: "modelError",
        modelName: config.name,
        error: String(error),
      });
    }
  }

  async processFrame(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    options: { minConfidence?: number; maxResults?: number },
  ): Promise<void> {
    try {
      const results: ONNXDetection[] = [];

      // Process with each loaded model
      for (const [modelName, session] of this.models) {
        const config = this.modelConfigs.get(modelName);
        if (!config) continue;

        const detections = await this.runInference(
          session,
          config,
          imageData,
          width,
          height,
        );
        results.push(...detections);
      }

      // Apply NMS and filtering
      const filteredResults = this.applyNMS(
        results,
        options.minConfidence || 0.5,
      );

      self.postMessage({
        type: "result",
        result: {
          detections: filteredResults,
          frameSize: { width, height },
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }

  private async runInference(
    // biome-ignore lint/suspicious/noExplicitAny: ONNX Runtime session
    session: any,
    config: ONNXModelConfig,
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
  ): Promise<ONNXDetection[]> {
    // Preprocess image
    const preprocessed = this.preprocessImage(imageData, width, height, config);

    // Create input tensor
    const inputTensor = new ort.Tensor(
      "float32",
      preprocessed,
      config.inputShape,
    );

    // biome-ignore lint/suspicious/noExplicitAny: ONNX Runtime tensor
    const feeds: Record<string, any> = {};
    const inputName = session.inputNames[0];
    feeds[inputName] = inputTensor;

    const results = await session.run(feeds);

    // Postprocess results
    return this.postprocessResults(results, config, width, height);
  }

  private preprocessImage(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    config: ONNXModelConfig,
  ): Float32Array {
    const [, channels, modelHeight, modelWidth] = config.inputShape;
    const preprocessed = new Float32Array(channels * modelHeight * modelWidth);

    if (config.preprocessor === "yolo") {
      // YOLO preprocessing: normalize to [0,1] and HWC to CHW
      for (let y = 0; y < modelHeight; y++) {
        for (let x = 0; x < modelWidth; x++) {
          // Scale coordinates
          const srcX = Math.floor((x / modelWidth) * width);
          const srcY = Math.floor((y / modelHeight) * height);
          const srcIdx = (srcY * width + srcX) * 4;

          // Extract RGB and normalize
          const r = imageData[srcIdx] / 255.0;
          const g = imageData[srcIdx + 1] / 255.0;
          const b = imageData[srcIdx + 2] / 255.0;

          // CHW format
          const dstIdx = y * modelWidth + x;
          preprocessed[dstIdx] = r;
          preprocessed[modelHeight * modelWidth + dstIdx] = g;
          preprocessed[2 * modelHeight * modelWidth + dstIdx] = b;
        }
      }
    } else {
      // Default preprocessing: just normalize
      for (let i = 0; i < imageData.length; i += 4) {
        const pixelIdx = Math.floor(i / 4);
        if (pixelIdx < preprocessed.length) {
          // Use red channel
          preprocessed[pixelIdx] = imageData[i] / 255.0;
        }
      }
    }

    return preprocessed;
  }

  private postprocessResults(
    // biome-ignore lint/suspicious/noExplicitAny: ONNX Runtime output map
    results: any,
    config: ONNXModelConfig,
    imageWidth: number,
    imageHeight: number,
  ): ONNXDetection[] {
    const detections: ONNXDetection[] = [];

    if (config.postprocessor === "yolo" || config.type === "detection") {
      // Handle YOLO-style outputs
      // biome-ignore lint/suspicious/noExplicitAny: ONNX tensor output
      const outputTensor = Object.values(results)[0] as any;
      if (!outputTensor?.data) return detections;

      const data = outputTensor.data as Float32Array;
      const outputShape = outputTensor.dims as number[];

      // Typical YOLO output: [1, num_detections, 6] where 6 = [x, y, w, h, confidence, class]
      if (outputShape.length === 3) {
        const numDetections = outputShape[1];
        const numValues = outputShape[2];

        for (let i = 0; i < numDetections; i++) {
          const baseIdx = i * numValues;

          if (numValues >= 6) {
            const x = data[baseIdx];
            const y = data[baseIdx + 1];
            const w = data[baseIdx + 2];
            const h = data[baseIdx + 3];
            const confidence = data[baseIdx + 4];
            const classId = Math.round(data[baseIdx + 5]);

            if (confidence >= (config.threshold || 0.5)) {
              // Convert from model coordinates to image coordinates
              const bbox: [number, number, number, number] = [
                x * imageWidth,
                y * imageHeight,
                w * imageWidth,
                h * imageHeight,
              ];

              detections.push({
                bbox,
                class: classId,
                confidence,
                label: config.labels?.[classId] || `Class ${classId}`,
              });
            }
          }
        }
      }
    }

    return detections;
  }

  private applyNMS(
    detections: ONNXDetection[],
    minConfidence: number,
  ): ONNXDetection[] {
    // Filter by confidence
    const filtered = detections.filter((d) => d.confidence >= minConfidence);

    // Sort by confidence (descending)
    filtered.sort((a, b) => b.confidence - a.confidence);

    // Simple NMS
    const result: ONNXDetection[] = [];

    for (const detection of filtered) {
      let shouldKeep = true;

      for (const kept of result) {
        if (this.calculateIoU(detection.bbox, kept.bbox) > 0.5) {
          shouldKeep = false;
          break;
        }
      }

      if (shouldKeep) {
        result.push(detection);
      }
    }

    return result;
  }

  private calculateIoU(
    box1: [number, number, number, number],
    box2: [number, number, number, number],
  ): number {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const left = Math.max(x1, x2);
    const top = Math.max(y1, y2);
    const right = Math.min(x1 + w1, x2 + w2);
    const bottom = Math.min(y1 + h1, y2 + h2);

    if (right <= left || bottom <= top) return 0;

    const intersection = (right - left) * (bottom - top);
    const area1 = w1 * h1;
    const area2 = w2 * h2;
    const union = area1 + area2 - intersection;

    return intersection / union;
  }
}

// Initialize worker
const worker = new ONNXWorker();

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, model, imageData, width, height, options } = event.data;

  switch (type) {
    case "init":
      await worker.initialize();
      break;

    case "loadModel":
      await worker.loadModel(model);
      break;

    case "process":
      await worker.processFrame(imageData, width, height, options);
      break;

    default:
      console.warn("Unknown message type:", type);
  }
};

export { ONNXWorker };
