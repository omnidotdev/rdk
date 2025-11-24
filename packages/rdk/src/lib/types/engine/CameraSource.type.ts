/**
 * Device camera source.
 * - `video`: Uses shared `getUserMedia` for camera access
 * - `webxr`: Reserved for future `@react-three/xr` integration
 */
export type CameraSource = "video" | "webxr";
