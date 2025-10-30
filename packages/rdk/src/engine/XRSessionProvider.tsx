import { useFrame, useThree } from "@react-three/fiber";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { match } from "ts-pattern";

import createFiducialBackend from "fiducial/fiducialBackend";

import type { PropsWithChildren } from "react";
import { XRBackend, XRContextValue, XRMode } from "lib/types/xr";

const XRContext = createContext<XRContextValue | null>(null);

/**
 * Use `XRSessionProvider` context.
 */
export const useXR = (): XRContextValue => {
	const ctx = useContext(XRContext);

	if (!ctx)
		throw new Error("`useXR` must be used inside `<XRSessionProvider />`");

	return ctx;
};

interface XRSessionProviderProps extends PropsWithChildren {
	/** Mode of extended reality. */
	mode: XRMode;
	/** Session options, forwarded to the corresponding backend. */
	// TODO generic narrowing
	options?: unknown;
}

/**
 * Core RDK engine. This owns the "XR session state" (e.g. running, paused, tracking quality), owns the camera feed/pose source, handles ticks per frame, applies transforms, and provides a React context for children to consume.
 */
const XRSessionProvider = ({
	mode,
	options,
	children,
}: XRSessionProviderProps) => {
	const [ready, setReady] = useState(false);

	const { camera, gl, scene } = useThree();

	const backendRef = useRef<XRBackend>(null);

	// pick backend by mode
	const backend = useMemo<XRBackend>(
		() =>
			match(mode)
				.with("fiducial", () => createFiducialBackend(options))
				// TODO
				// .with("geolocation", () => createGeoBackend(options as GeoOptions))
				// .with("webxr", () => createWebXRBackend(options as WebXROptions))
				.otherwise(() => createFiducialBackend(options)),
		[mode, options],
	);

	// init once
	useEffect(() => {
		let cancelled = false;

		(async () => {
			await backend.init({ scene, camera, renderer: gl });
			if (!cancelled) {
				backendRef.current = backend;
				setReady(true);
			}
		})();

		return () => {
			cancelled = true;
			backend.dispose?.();
			backendRef.current = null;
			setReady(false);
		};
	}, [backend, scene, camera, gl]);

	// update backend per frame
	useFrame((_state, dt) => {
		backendRef.current?.update?.(dt);
	});

	// memoize value so consumers don't rerender unnecessarily
	const value: XRContextValue = useMemo(
		() => ({
			mode,
			ready,
			backend: backendRef.current,
		}),
		[mode, ready],
	);

	return <XRContext.Provider value={value}>{children}</XRContext.Provider>;
};

export default XRSessionProvider;
