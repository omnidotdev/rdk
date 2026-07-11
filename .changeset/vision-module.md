---
"@omnidotdev/rdk": minor
---

Add the ML vision module: a `VisionProvider` abstraction with MediaPipe (hand/face/pose landmarks + built-in gesture detection) and ONNX Runtime Web backends, wired into the engine as a first-class `Backend` alongside fiducial/geolocation/magic.

The ONNX backend runs real inference in a Web Worker with a pluggable `ONNXDecoder` interface and two reference decoders, YOLO (v8/v11, NMS) and RF-DETR (DETR set-prediction, NMS-free), plus `yolo()`/`rfDetr()` model presets and `COCO_LABELS`. Bring your own weights; nothing heavy is bundled (`@mediapipe/tasks-vision` and `onnxruntime-web` are optional peer dependencies).

Also adds declarative components `VisionOverlay`, `VisionSession`, `HandTracker`, and `VisionAnchor`, plus the `useVisionFrame` hook and `landmarkToWorld` mapping helper.
