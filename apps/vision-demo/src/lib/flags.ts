const params = new URLSearchParams(location.search);

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** `?debug` opens the debug panel on load */
export const START_DEBUG = params.has("debug");

/**
 * Run the ONNX modes on WebGPU. On by default on phones and tablets, where it
 * ran object detection about 5x faster than the CPU in testing; off on
 * desktop, where some GPU and driver setups hang on WebGPU inference.
 * `?webgpu` or `?cpu` overrides the default
 */
export const START_WEBGPU = params.has("webgpu")
  ? true
  : params.has("cpu")
    ? false
    : isMobile;
