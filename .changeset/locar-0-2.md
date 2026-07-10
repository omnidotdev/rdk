---
"@omnidotdev/rdk": patch
---

Upgrade LocAR.js to 0.2.x. The geolocation backend now renders the camera feed via LocAR's aspect-ratio-preserving DOM video element behind a transparent canvas (instead of a stretched `scene.background` texture), and tears down the media stream and video element on session end.
