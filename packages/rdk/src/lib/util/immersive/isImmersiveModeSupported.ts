import toWebXRSessionMode from "./toWebXRSessionMode";

/**
 * Check if a specific immersive mode is supported.
 * Uses real WebXR API calls for accurate detection.
 */
async function isImmersiveModeSupported(
  mode: "ar" | "vr" | "inline",
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.xr) return false;

  const webxrMode = toWebXRSessionMode(mode);

  try {
    return navigator.xr.isSessionSupported(webxrMode);
  } catch (error) {
    console.warn(`WebXR support check failed for ${mode}:`, error);

    return false;
  }
}

export default isImmersiveModeSupported;
