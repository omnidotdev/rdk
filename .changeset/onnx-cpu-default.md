---
"@omnidotdev/rdk": minor
---

Run ONNX vision models (object detection and segmentation) on the CPU by default, with a new `onnx.webgpu` option to opt into WebGPU

Some GPU and driver setups hang on WebGPU inference, which froze the whole page as soon as object detection started. ONNX models now run on the CPU unless `onnx: { webgpu: true }` is set. With WebGPU enabled, a stalled frame restarts the model on the CPU, and frames that arrive while a model is still running are dropped instead of failing with "Session already started"
