---
"@omnidotdev/rdk": patch
---

MediaPipe tracking now runs once per new camera frame instead of once per screen refresh, and fills in each frame's `processingTime`

On a 60 Hz screen with a 30 fps camera, the old loop ran the models on the same camera frame twice. Browsers without `requestVideoFrameCallback` keep the previous behavior
