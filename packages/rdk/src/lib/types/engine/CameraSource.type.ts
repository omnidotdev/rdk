/**
 * Camera source types for the spatial SDK engine.
 * - `video`: Uses shared `getUserMedia` for camera access
 * - `webxr`: Reserved for future `@react-three/xr` integration
 */
export type CameraSource = "video" | "webxr";
