---
"@omnidotdev/rdk": patch
---

Load ONNX Runtime's wasm files for the installed `onnxruntime-web` version instead of always the latest release from the CDN, so a new ONNX Runtime release can no longer break object detection and segmentation with a JS and wasm mismatch
