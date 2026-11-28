---
"@omnidotdev/rdk": minor
---

Add `showStatus`, `dpr`, and `onProgress` props to `VisionOverlay` for apps that draw their own interface

Set `showStatus={false}` to hide the built-in status and debug panels, then read model loading progress from `onProgress` and detections from `useVisionFrame`. `dpr` sets the 3D canvas pixel ratio and now defaults to `[1, 2]`, so phones that report a 3x screen no longer draw three times the pixels every frame
