import type { FiducialSessionOptions } from "../../../fiducial";

/**
 * Session options mapping for different XR modes.
 * This provides type-safe options based on the selected XR mode.
 */
export interface XRSessionOptionsMap {
	fiducial: FiducialSessionOptions;
	// TODO add more modes as they are implemented
	// image: ImageTrackingSessionOptions;
	// geolocation: GeolocationSessionOptions;
	// webxr: WebXRSessionOptions;
}

/**
 * Get session options type for a specific XR mode.
 * This enables generic narrowing for type-safe session options.
 */
export type XRSessionOptions<T extends keyof XRSessionOptionsMap> =
	XRSessionOptionsMap[T];
