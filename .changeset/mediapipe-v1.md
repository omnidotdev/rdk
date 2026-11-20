---
"@omnidotdev/rdk": minor
---

Support `@mediapipe/tasks-vision` v1 and add a `mediapipe.wasmBasePath` vision option

The MediaPipe wasm now loads from the v1 CDN build, so the `@mediapipe/tasks-vision` peer dependency is now `^1.0.0`. Apps on 0.10 must upgrade, since the JS bundle and wasm have to come from the same release. Set `mediapipe.wasmBasePath` to self-host the wasm files or pin an exact version
