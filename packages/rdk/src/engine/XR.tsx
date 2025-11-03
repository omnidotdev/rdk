import XRSessionProvider from "./XRSessionProvider";
import type { PropsWithChildren } from "react";

export interface XRProps extends PropsWithChildren {
	/**
	 * Camera source type; video uses `getUserMedia`, webxr reserved for future `@react-three/xr`.
	 * @default "video"
	 */
	cameraSource?: "video" | "webxr";
}

/**
 * XR context for nested architecture inside R3F Canvas.
 * Provides session management for XR sessions.
 */
const XR = ({ cameraSource = "video", children }: XRProps) => (
	<XRSessionProvider cameraSource={cameraSource}>{children}</XRSessionProvider>
);

export default XR;
