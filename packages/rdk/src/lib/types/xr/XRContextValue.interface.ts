import { XRBackend } from "./XRBackend.interface";
import { XRMode } from "./XRMode.type";

/**
 * Context value provided by XRSessionProvider.
 * Contains the current XR session state and backend instance.
 */
export interface XRContextValue {
	/** Current XR mode. */
	mode: XRMode;
	/** Whether the XR backend is fully initialized and ready. */
	ready: boolean;
	/** The active XR backend instance, null if not initialized. */
	backend: XRBackend | null;
}
