import { Canvas } from "@react-three/fiber";

import XRSessionProvider from "./XRSessionProvider";

import type { CanvasProps } from "@react-three/fiber";
import type { PropsWithChildren } from "react";

export interface ARCanvasProps extends PropsWithChildren, CanvasProps {
	/**
	 * Whether augmented reality is enabled.
	 * @default true
	 */
	isArEnabled?: boolean;
	/**
	 * Whether tracking is enabled.
	 * @default true
	 */
	isTrackingEnabled?: boolean;
	/**
	 * Pattern ratio.
	 * @default 0.5
	 */
	patternRatio?: number;
	/**
	 * Detection mode.
	 * @default "mono_and_matrix"
	 */
	detectionMode?: string;
	/**
	 * Camera parameters URL, used for AR tracking fidelity. The default is the calibration file provided by AR.js.
	 * @default "data/camera_params.dat"
	 */
	cameraParametersUrl?: string;
	/**
	 * Matrix code type.
	 * @default "3x3"
	 */
	matrixCodeType?: string;
	/**
	 * Source type.
	 * @default "webcam"
	 */
	sourceType?: string;
	/**
	 * Callback triggered when the camera stream is ready.
	 */
	onCameraStreamReady?: () => void;
	/**
	 * Callback triggered when the camera stream encounters an error.
	 */
	onCameraStreamError?: (error: Error) => void;
}

// TODO refactor and genericize, this is currently highly coupled to marker-based AR and should be a clean, capability-agnostic XR canvas. Currently hardcodes marker vs. camera feed, but should leverage e.g. a `mode` prop + `sessionOptions`

/**
 * Main extended reality canvas that initializes the context. This behaves as a scene root for end users.
 */
const XRCanvas = ({
	isArEnabled = true,
	isTrackingEnabled = true,
	children,
	patternRatio = 0.5,
	detectionMode = "mono_and_matrix",
	cameraParametersUrl = "data/camera_params.dat",
	matrixCodeType = "3x3",
	sourceType = "webcam",
	onCameraStreamReady,
	onCameraStreamError,
	...rest
}: ARCanvasProps) => (
	<Canvas camera={isArEnabled ? { position: [0, 0, 0] } : undefined} {...rest}>
		{isArEnabled ? (
			<XRSessionProvider
				tracking={isTrackingEnabled}
				patternRatio={patternRatio}
				matrixCodeType={matrixCodeType}
				detectionMode={detectionMode}
				sourceType={sourceType}
				cameraParametersUrl={cameraParametersUrl}
				onCameraStreamReady={onCameraStreamReady}
				onCameraStreamError={onCameraStreamError}
			>
				{children}
			</XRSessionProvider>
		) : (
			children
		)}
	</Canvas>
);

export default XRCanvas;
