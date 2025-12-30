---
"@omnidotdev/rdk": minor
---

Refactor backend registry from array to Map for O(1) type-based lookup. Add `type` discriminator to Backend interface and new `useFiducialBackend`/`useGeolocationBackend` hooks for type-safe backend access. Move anchor registry into geolocation backend.
