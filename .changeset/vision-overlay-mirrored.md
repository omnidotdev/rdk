---
"@omnidotdev/rdk": minor
---

Add a `mirrored` prop to `VisionOverlay` so the camera preview can be shown unmirrored

`VisionOverlay` always mirrored its camera preview like a selfie camera, which flipped rear-facing or world-facing feeds. Set `mirrored={false}` for those, and pass `mirror={false}` to any `VisionAnchor` inside so anchored content lines up. The default stays `true`, so existing apps are unchanged
