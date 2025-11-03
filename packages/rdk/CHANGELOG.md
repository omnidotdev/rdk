# @omnidotdev/rdk

## 0.2.0

### Minor Changes

- [#8](https://github.com/omnidotdev/rdk/pull/8) [`57d2439`](https://github.com/omnidotdev/rdk/commit/57d243984bcdc2d659e69a75cbc9ebbb1db7c08a) Thanks [@coopbri](https://github.com/coopbri)! - Added experimental geolocation augmented reality support

- [#13](https://github.com/omnidotdev/rdk/pull/13) [`d58ef41`](https://github.com/omnidotdev/rdk/commit/d58ef4154f00492d31173ee2553df1aa396ea2a3) Thanks [@coopbri](https://github.com/coopbri)! - **BREAKING:** Removed `XRCanvas` and its explicit `mode` prop in favor of a composable `XR` context component. An explicit R3F `Canvas` ancestor is now required. Now, usage works like this:

  ```tsx
  import { Canvas } from "@react-three/fiber";
  import {
    FiducialAnchor,
    FiducialSession,
    GeolocationAnchor,
    GeolocationSession,
    XR,
  } from "@omnidotdev/rdk";

  <Canvas>
    <XR>
      <GeolocationSession>
        <GeolocationAnchor>{/* ... */}</GeolocationAnchor>
      </GeolocationSession>
    </XR>
  </Canvas>

  // ...

  <Canvas>
    <XR>
      <FiducialSession>
        <FiducialAnchor>{/* ... */}</FiducialAnchor>
      </FiducialSession>
    </XR>
  </Canvas>
  ```

  This results in a more composable architecture.

  Importantly, `GeolocationSession` and `FiducialSession` cannot be used in the same XR context. This is because their underlying libraries (LocAR.js and AR.js, respectively) both try to access the same camera/video, thus fight over it. A console error will be thrown if both are detected.

## 0.1.0

### Minor Changes

- [#1](https://github.com/omnidotdev/rdk/pull/1) [`2ead4ed`](https://github.com/omnidotdev/rdk/commit/2ead4edf2487667d5667ec9dc6e5182b798c0165) Thanks [@coopbri](https://github.com/coopbri)! - Initial release with experimental fiducial marker-based augmented reality support
