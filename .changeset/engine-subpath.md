---
"@omnidotdev/rdk": minor
---

feat(engine): add `@omnidotdev/rdk/engine` subpath export

Adds a dedicated `./engine` subpath so `XR` (and the XR store helpers) can be imported without the top-level barrel, which re-exports every module including `fiducial` and its optional `@ar-js-org/ar.js` peer dependency. Import `XR` from `@omnidotdev/rdk/engine` to use a single module (e.g. geolocation) without installing ar.js. Also sets `"sideEffects": false` so the barrel tree-shakes cleanly.
