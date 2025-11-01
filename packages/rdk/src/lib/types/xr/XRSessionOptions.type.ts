import type { FiducialSessionOptions } from "fiducial";
import type { GeolocationSessionOptions } from "geolocation";

/**
 * Session options mapping for different XR modes.
 * This provides type-safe options based on the selected XR mode.
 */
export interface XRSessionOptionsMap {
	fiducial: FiducialSessionOptions;
	geolocation: GeolocationSessionOptions;
}

/**
 * Get session options type for a specific XR mode.
 * This enables generic narrowing for type-safe session options.
 */
export type XRSessionOptions<T extends keyof XRSessionOptionsMap> =
	XRSessionOptionsMap[T];
