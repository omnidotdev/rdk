// ONNX inference web worker
// Runs ONNX model inference off the main thread

// biome-ignore lint/suspicious/noExplicitAny: worker message types
type WorkerMessage = { type: string; [key: string]: any };

const handleMessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  switch (type) {
    case "init": {
      self.postMessage({ type: "initialized" });
      break;
    }
    case "loadModel": {
      const { model } = event.data;
      try {
        // TODO: load ONNX model via onnxruntime-web
        self.postMessage({ type: "modelLoaded", modelName: model.name });
      } catch (error) {
        self.postMessage({
          type: "modelError",
          modelName: model.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }
    case "process": {
      try {
        // TODO: run inference on the image bitmap
        const { imageBitmap, sourceWidth, sourceHeight } = event.data;
        imageBitmap?.close?.();
        self.postMessage({
          type: "result",
          result: {
            detections: [],
            frameSize: { width: sourceWidth, height: sourceHeight },
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        self.postMessage({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      break;
    }
    case "dispose": {
      break;
    }
  }
};

self.addEventListener("message", handleMessage);
