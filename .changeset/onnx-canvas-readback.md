---
"@omnidotdev/rdk": patch
---

Stop ONNX vision tracking and report the failure through `onError` when the browser blocks reading camera frames, instead of running the model on blank frames

Under strict fingerprinting protection (such as Firefox's `privacy.resistFingerprinting`), the browser hands back blank pixels when the ONNX worker reads a frame, so object detection and segmentation silently saw nothing. The ONNX provider now detects this, stops once, and passes a clear error to `onError`, matching the MediaPipe provider
