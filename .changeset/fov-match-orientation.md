---
"@omnidotdev/rdk": minor
---

Keep AR content at a consistent scale in both landscape and portrait. The Three camera's horizontal field of view is now matched to the webcam feed's visible area (which CSS `object-fit: cover` crops differently per orientation) via LocAR's FOV APIs, and re-synced on canvas resize/rotation. Adds an optional `hFov` geolocation session option (defaults to 80) and threads the canvas `size` through backend initialization.
