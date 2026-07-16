---
"@omnidotdev/rdk": minor
---

feat(image-tracking): natural-feature image tracking via MindAR

Adds an `image-tracking` module for tracking arbitrary reference images (logos, posters) using compiled `.mind` targets, backed by MindAR's headless controller. R3F owns rendering; the backend feeds frames to MindAR and publishes per-target world matrices to anchors. Exposes `ImageTrackingSession`, `ImageTrackingAnchor`, `useImageTrackingBackend`, `createImageTrackingBackend`, and a pluggable `FrameSource` (default: rear webcam) so the frame source can migrate to WebXR Raw Camera Access later. MindAR (and its TensorFlow.js dependency) is an optional peer dependency, lazy-loaded so it stays out of the core bundle.
