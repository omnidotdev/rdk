import MediaPipeProvider from "./mediapipeProvider";
import ONNXProvider from "./onnxProvider";

import type { VisionProvider, VisionSessionOptions } from "../types";

/** Create a vision provider based on the session options */
const createVisionProvider = (
  options: VisionSessionOptions,
): VisionProvider => {
  if (options.provider === "onnx") {
    return new ONNXProvider(options);
  }

  return new MediaPipeProvider(options);
};

export default createVisionProvider;
