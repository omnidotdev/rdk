---
"@omnidotdev/rdk": minor
---

Added native WebXR support, powered by [`@react-three/xr`](https://github.com/pmndrs/xr).

**BREAKING:** Removed `cameraSource` prop from XR component. Sessions now auto-configure themselves:

```tsx
// before
<XR cameraSource="video">
  <FiducialSession />
</XR>

// after
<XR>
  {/* auto-configures video mode */}
  <FiducialSession />
</XR>
```

**New Features:**

- `ImmersiveSession` component for WebXR AR/VR
- Nested `@react-three/xr`'s store nested under `useXRStore`'s `immersive` property
- Added `ImmersiveMode` type export, which maps to and from [official WebXR modes](https://www.w3.org/TR/webxr/#xrsessionmode-enum) (`immersive-ar` ↔ `ar`, `immersive-vr` ↔ `vr`, `inline` ↔ `inline`)
