/**
 * CDN base for ONNX Runtime's wasm files, pinned to the installed version: the
 * JS bundle and its wasm must come from the same release, and an unversioned
 * path always serves the latest one.
 */
export const getOrtWasmPaths = (version: string | undefined): string =>
  `https://cdn.jsdelivr.net/npm/onnxruntime-web${version ? `@${version}` : ""}/dist/`;
