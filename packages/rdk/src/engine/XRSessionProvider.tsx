import {
	ArToolkitContext,
	ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { useFrame, useThree } from "@react-three/fiber";
import {
	type PropsWithChildren,
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import type { Camera } from "three";
import { match } from "ts-pattern";

interface XRSessionContextValue {
	arToolkitContext: ArToolkitContext;
}

interface XRSessionProviderProps extends PropsWithChildren {
	tracking?: boolean;
	sourceType: string;
	patternRatio: number;
	matrixCodeType: string;
	detectionMode: string;
	cameraParametersUrl: string;
	onCameraStreamReady?: () => void;
	onCameraStreamError?: (error: Error) => void;
}

const XRSessionContext = createContext<XRSessionContextValue>(
	{} as XRSessionContextValue,
);
const videoDomElemSelector = "#arjs-video";

// TODO refactor and genericize, this is currently highly coupled to marker-based AR and should be a clean, capability-agnostic XR engine

/**
 * Core RDK engine. This owns the "XR session state" (e.g. running, paused, tracking quality), owns the camera feed/pose source, handles ticks per frame, applies transforms, and provides a React context for children to consume.
 * Currently, this is highly coupled to marker-based AR but will be refactored (see TODO above).
 */
const XRSessionProvider = memo<XRSessionProviderProps>(function AR({
	tracking = true,
	children,
	sourceType,
	patternRatio,
	matrixCodeType,
	detectionMode,
	cameraParametersUrl,
	onCameraStreamReady,
	onCameraStreamError,
}) {
	const { gl, camera } = useThree();

	const arToolkitSourceRef = useRef<ArToolkitSource>(
		new ArToolkitSource({ sourceType }),
	);
	const arToolkitContextRef = useRef<ArToolkitContext>(
		new ArToolkitContext({
			cameraParametersUrl,
			detectionMode,
			patternRatio,
			matrixCodeType,
		}),
	);

	const arToolkitSource = arToolkitSourceRef.current;
	const arToolkitContext = arToolkitContextRef.current;

	const onResize = useCallback(() => {
		arToolkitSource.onResizeElement();
		arToolkitSource.copyElementSizeTo(gl.domElement);
		if (arToolkitContext.arController) {
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
			(camera as Camera).projectionMatrix.copy(
				arToolkitContext.getProjectionMatrix(),
			);
		}
	}, [gl, camera, arToolkitSource, arToolkitContext]);

	const onUnmount = useCallback(() => {
		window.removeEventListener("resize", onResize);

		if (arToolkitContext.arController) {
			arToolkitContext.arController.dispose();
			arToolkitContext.arController.cameraParam?.dispose();
		}

		const video = document.querySelector(
			videoDomElemSelector,
		) as HTMLVideoElement | null;

		if (video?.srcObject instanceof MediaStream)
			for (const track of video.srcObject.getTracks()) track.stop();

		video?.remove();
	}, [onResize, arToolkitContext]);

	useEffect(() => {
		arToolkitSource.init(() => {
			const video = document.querySelector(
				videoDomElemSelector,
			) as HTMLVideoElement | null;

			if (video) {
				video.style.position = "fixed";

				video.onloadedmetadata = () => {
					console.log(
						"actual source dimensions",
						video.videoWidth,
						video.videoHeight,
					);

					match({
						width: video.videoWidth,
						height: video.videoHeight,
					})
						.when(
							({ width, height }) => width > height,
							() => {
								if (arToolkitContext.arController) {
									arToolkitContext.arController.orientation = "landscape";
									arToolkitContext.arController.options.orientation =
										"landscape";
								}
							},
						)
						.otherwise(() => {
							if (arToolkitContext.arController) {
								arToolkitContext.arController.orientation = "portrait";
								arToolkitContext.arController.options.orientation = "portrait";
							}
						});

					onCameraStreamReady?.();
					onResize();
				};
			}
		}, onCameraStreamError);

		arToolkitContext.init(() =>
			(camera as Camera).projectionMatrix.copy(
				arToolkitContext.getProjectionMatrix(),
			),
		);

		window.addEventListener("resize", onResize);

		return onUnmount;
	}, [
		camera,
		onCameraStreamReady,
		onCameraStreamError,
		onResize,
		onUnmount,
		arToolkitContext,
		arToolkitSource,
	]);

	// update the ARToolkit Three.js camera each render tick
	useFrame(() => {
		match({
			tracking,
			sourceReady: arToolkitSource.ready,
		})
			.with({ tracking: true, sourceReady: true }, () => {
				arToolkitContext.update(arToolkitSource.domElement);
			})
			.otherwise(() => {});
	});

	const value = useMemo(() => ({ arToolkitContext }), [arToolkitContext]);

	return (
		<XRSessionContext.Provider value={value}>
			{children}
		</XRSessionContext.Provider>
	);
});

// TODO extract to file
/**
 * Use `XRSessionProvider` context.
 */
export const useXRSessionProvider = (): XRSessionContextValue => {
	const arValue = useContext(XRSessionContext);
	return useMemo(() => ({ ...arValue }), [arValue]);
};

export default XRSessionProvider;
