import { XRBackendInitArgs } from "./XRBackendInitArgs.interface";

/**
 * Extended reality backend interface.
 * Defines the contract for XR backend implementations (fiducial, geolocation, WebXR, etc.).
 */
export interface XRBackend {
	/**
	 * Initialize the XR backend with the provided arguments.
	 * @param args initialization arguments containing scene, camera, and renderer
	 * @returns promise that resolves when initialization is complete, or void for synchronous init
	 */
	init(args: XRBackendInitArgs): Promise<void> | void;

	/**
	 * Update the XR backend on each frame.
	 * @param dt delta time since last frame in seconds
	 */
	update?(dt: number): void;

	/**
	 * Clean up resources when the backend is no longer needed.
	 */
	dispose?(): void;

	/**
	 * Get internal SDK objects for advanced use cases.
	 * @returns internal objects specific to the backend implementation
	 */
	getInternal?(): unknown;
}
