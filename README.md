# Reality Development Kit (RDK)

<div align="center">
  <img src="/assets/rdk-logo.png" width="350" />

[Website (Coming Soon)](https://rdk.omni.dev) | [Docs (Coming Soon)](https://docs.omni.dev/rdk/overview) | [Provide feedback on Omni Backfeed](https://backfeed.omni.dev/organizations/omni/projects/rdk) | [Join Omni community on Discord](https://discord.gg/omnidotdev)

</div>

**Omni Reality Development Kit (RDK)** is a React-first framework for building web-based XR experiences, from AR to VR, through one unified API powered by Three.js and `react-three-fiber`.

> [!IMPORTANT]
> **Project Status:** 🚧 This project is **brand new**.
> Currently, fiducial marker-based AR via [AR.js](https://github.com/ar-js-org/ar.js) is working (see [`apps/fiducial-demo`](./apps/fiducial-demo)).
> Location-based AR using [LocAR.js](https://github.com/ar-js-org/locar.js) and native WebXR integration via `@react-three/xr` are coming next.

## Overview

RDK unifies multiple XR technologies, such as AR.js for marker-based AR, LocAR.js for geolocation-based AR (coming soon), and WebXR (coming soon) for device-native support under one React-first abstraction powered by Three.js.

| Capability/Use Case                  | Status          | Backend (Current or Proposed)                                                                        | Android | iOS | Notes                                                                                     |
| ------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- | ------- | --- | ----------------------------------------------------------------------------------------- |
| **Fiducial (Pattern/Barcode)**       | ⚗️ Experimental | [AR.js (ARToolKit)](https://github.com/ar-js-org/ar.js)                                              | ✅      | ✅  | Uses `.patt` or barcode markers. Reliable for printed markers. No WebXR dependency.       |
| **Image Tracking (Natural Feature)** | 🧭 Planned      | [AR.js (ARToolKit)](https://github.com/ar-js-org/ar.js)                                              | N/A     | N/A | May use `.mind` or `XRTrackedImage`. Ideal for logos or posters. Requires image database. |
| **Geolocation / World Anchors**      | 🧭 Planned      | [LocAR.js](https://github.com/ar-js-org/locar.js)/WebXR Geo Anchors                                  | N/A     | N/A | Uses GPS + compass; can integrate Mapbox or Cesium.                                       |
| **WebXR Native AR/VR Session**       | 🧭 Planned      | [`@react-three/xr`](https://github.com/pmndrs/xr)                                                    | N/A     | N/A | Entry point for true AR/VR sessions. Ties into `XRSessionProvider`.                       |
| **Face Tracking**                    | 🧭 Planned      | -                                                                                                    | N/A     | N/A | Uses webcam + ML model; lightweight and fast.                                             |
| **Body/Pose Tracking**               | 🧭 Planned      | [WebXR Body Tracking](https://github.com/immersive-web/body-tracking)                                | N/A     | N/A | Real-time skeletal tracking. GPU/WebGL acceleration required.                             |
| **Hand Tracking**                    | 🧭 Planned      | -                                                                                                    | N/A     | N/A | Supported on Chrome + Meta; ML fallback possible.                                         |
| **Plane/Surface Detection**          | 🧭 Planned      | [WebXR Hit Test API](https://immersive-web.github.io/hit-test)/ar.js (limited)                       | N/A     | N/A | Enables AR object placement on flat surfaces.                                             |
| **Depth Sensing/Environment Mesh**   | 🧭 Planned      | [WebXR Depth Sensing API](https://immersive-web.github.io/depth-sensing)                             | N/A     | N/A | Provides per-pixel depth; early spec.                                                     |
| **SLAM/Visual Positioning (VPS)**    | 🧭 Planned      | Custom                                                                                               | N/A     | N/A | Requires world map data; long-term goal.                                                  |
| **Voice/Gesture Interaction**        | 🧭 Planned      | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)/MediaPipe Gestures | N/A     | N/A | Enables multimodal input: voice, hand, gaze.                                              |
| **Mixed Reality Compositing**        | 🧭 Planned      | WebXR Layers/CanvasCaptureStream                                                                     | N/A     | N/A | Transparent overlays/live compositing.                                                    |

## Getting Started

### Local Development

Use [Tilt](https://tilt.dev) for a unified development experience:

```bash
tilt up
```

or manually:

```bash
bun run dev      # start development servers
bun run build    # build all packages
bun run test     # run tests
```

### Downstream Installation

Install RDK and required peer dependencies:

```bash
bun add @omnidotdev/rdk @ar-js-org/ar.js @react-three/fiber react react-dom three
```

See [`apps/fiducial-demo`](./apps/fiducial-demo) for an example of usage. More demos will be added as more use cases beyond fiducial marker-based AR are implemented.

## Goals: the "Why"

Web-based XR today is deeply fragmented: split between native SDKs (ARCore, ARKit) and the web, and further divided by platform politics.

Apple’s refusal to support WebXR on iOS despite supporting it on their Vision Pro headset leaves developers maintaining separate code paths for identical use cases.

RDK aims to unify these worlds under a single, web-native React API so that you can target browsers, Android, iOS, and XR headsets alike with minimal friction.

## Vision

Our long-term focus areas include:

- **Rust + WebAssembly** for on-device SLAM and visual positioning with near-native performance
- **WebGPU + Web Workers** for parallelized rendering and physics acceleration
- **Interoperable modules** designed to plug into any renderer or sensor source over time

## What about Babylon.js?

Babylon.js support may be added in the future, but RDK is currently focused on the Three.js ecosystem. For React + Babylon.js (including XR support), take a look at:

- [Reactylon](https://www.reactylon.com)
- [react-babylonjs](https://github.com/brianzinn/react-babylonjs)

## License

The code in this repository is licensed under MIT, &copy; Omni LLC. See [LICENSE.md](LICENSE.md) for more information.
