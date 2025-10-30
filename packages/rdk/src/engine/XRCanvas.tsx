import { Canvas } from "@react-three/fiber";

import XRSessionProvider from "./XRSessionProvider";

import type { CanvasProps } from "@react-three/fiber";
import type { XRMode } from "lib/types/xr";

export interface XRCanvasProps extends CanvasProps {
	/** Mode of extended reality. */
	mode?: XRMode;
	/** Session options, forwarded to the corresponding backend. */
	// TODO generic narrowing
	sessionOptions?: unknown;
}

/**
 * Main extended reality canvas that initializes the context. This behaves as a scene root for end users.
 */
const XRCanvas = ({
	mode = "marker",
	sessionOptions,
	children,
	...rest
}: XRCanvasProps) => (
	<Canvas {...rest}>
		<XRSessionProvider mode={mode} options={sessionOptions}>
			{children}
		</XRSessionProvider>
	</Canvas>
);

export default XRCanvas;
