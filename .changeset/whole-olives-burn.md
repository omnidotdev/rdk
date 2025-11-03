---
"@omnidotdev/rdk": minor
---

**BREAKING:** Removed `XRCanvas` and its explicit `mode` prop in favor of a composable `XR` context component. An explicit R3F `Canvas` ancestor is now required. Now, usage works like this:

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
