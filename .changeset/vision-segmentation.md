---
"@omnidotdev/rdk": minor
---

Add ONNX instance segmentation to the vision module. A new `yoloseg` decoder assembles per-instance masks from a YOLOv8/v11-seg model (detection `[1, 4+C+M, A]` + prototype `[1, M, H, W]` outputs) as `sigmoid(coeffs · prototypes)`, thresholded and cropped to each box. Results arrive on `VisionFrame.masks` as `SegmentationMask[]` (label, confidence, source-space bbox, and a cropped alpha mask), with mask buffers transferred zero-copy from the worker.

The decoder interface now returns `{ objects?, masks? }`, and a `yoloSeg()` model preset + `SegmentationMask` type are exported. The demo gains a "Segment" mode.
