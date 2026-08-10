---
"@omnidotdev/rdk": patch
---

refactor(geolocation): re-platform onto the LocAR.js `App` API (0.2.7)

Bumps `locar` from `^0.2.3` to `^0.2.7` and rebuilds the geolocation backend on LocAR's `App` orchestrator via its `threeObjects` option, so LocAR wires the core, webcam feed and device orientation against RDK's existing react-three-fiber camera, renderer and scene instead of RDK instantiating `LocAR`, `Webcam` and `DeviceOrientationControls` by hand. Webcam teardown now uses `Webcam.dispose()` (added upstream in 0.2.5), replacing the manual `<video>` element hunt-and-remove workaround. The public API (`GeolocationSession`, `GeolocationAnchor`, `GeoLine`, `GeoPolygon`, `useGeolocationBackend`) is unchanged.
