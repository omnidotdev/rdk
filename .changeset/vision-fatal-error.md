---
"@omnidotdev/rdk": patch
---

Stop MediaPipe vision tracking and report the failure through `onError` when the browser blocks a feature it needs, instead of retrying every frame

Under strict fingerprinting protection (such as Firefox's `privacy.resistFingerprinting`), MediaPipe crashes on its first frame. Vision sessions previously stayed on "Starting..." while retrying every frame, which could freeze the tab. They now stop once and pass a clear error to `onError`. Custom vision providers can opt in through a new optional `onError` method on `VisionProvider`
