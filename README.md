# Reality Development Kit (RDK)

<div align="center">
  <img src="/assets/rdk-logo.png" width="350" />

[Website](https://rdk.omni.dev) | [Provide feedback on Omni Backfeed](https://backfeed.omni.dev/organizations/omni/projects/rdk)

</div>

**Omni Reality Development Kit (RDK)** is a React-first framework for building web-based XR experiences, from AR to VR, through one unified API powered by Three.js and `react-three-fiber`.

> [!IMPORTANT]
> **Project Status:** 🚧 This project is brand new.
> There is **no published package yet**.
> Currently, fiducial marker-based AR via [AR.js](https://github.com/AR-js-org/AR.js) is working (see [`apps/fiducial-demo`](./apps/fiducial-demo)).
> Location-based AR using [LocAR.js](https://github.com/locarjs/locar) and native WebXR integration via `@react-three/xr` are coming next.

## Overview

RDK unifies multiple XR technologies, such as AR.js for marker-based AR, LocAR.js for geolocation-based AR (coming soon), and WebXR (coming soon) for device-native support under one React-first abstraction powered by Three.js.

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

Mobile XR today is deeply fragmented: split between native SDKs (ARCore, ARKit) and the web, and further divided by platform politics.

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
