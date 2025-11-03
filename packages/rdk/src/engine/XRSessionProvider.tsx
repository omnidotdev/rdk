import { useFrame, useThree } from "@react-three/fiber";
import {
	createContext,
	useContext,
	useState,
	useMemo,
	useCallback,
	useRef,
} from "react";

import { XRBackend, XRContextValue } from "lib/types/xr";

import type { PropsWithChildren } from "react";

export const XRContext = createContext<XRContextValue | null>(null);

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
	/** Camera source type. */
	cameraSource: "video" | "webxr";
}

/**
 * Session-based XR provider that manages shared resources and backend registry.
 * Sessions register their backends and get access to shared camera/video resources.
 */
const XRSessionProvider = ({
	cameraSource,
	children,
}: XRSessionProviderProps) => {
	const [backends, setBackends] = useState<XRBackend[]>([]);
	const [sessionTypes, setSessionTypes] = useState<Set<string>>(new Set());
	const sessionTypesRef = useRef<Set<string>>(new Set());

	const { scene, camera: threeCamera, gl } = useThree();

	// register a backend (called by sessions)
	const registerBackend = useCallback(
		async (backend: XRBackend, sessionType?: string) => {
			try {
				// check for session compatibility before registering
				if (sessionType) {
					const newSessionTypes = new Set([
						...sessionTypesRef.current,
						sessionType,
					]);

					const hasFiducial = newSessionTypes.has("FiducialSession"),
						hasGeolocation = newSessionTypes.has("GeolocationSession");

					if (hasFiducial && hasGeolocation) {
						const errorMessage =
							"❌ [RDK] INCOMPATIBLE SESSIONS: FiducialSession and GeolocationSession cannot be used together due to camera/video conflicts between AR.js and LocAR.js libraries. Use only one session type per app.";

						console.error(errorMessage);

						throw new Error(errorMessage);
					}

					sessionTypesRef.current = newSessionTypes;
					setSessionTypes(newSessionTypes);
				}

				// initialize backend with shared scene, camera, renderer
				await backend.init({
					scene,
					camera: threeCamera,
					renderer: gl,
				});

				setBackends((prev) => [...prev, backend]);
			} catch (err) {
				console.error("[XRSessionProvider] Failed to register backend:", err);
				throw err;
			}
		},
		[scene, threeCamera, gl],
	);

	// unregister a backend (called by sessions)
	const unregisterBackend = useCallback(
		(backend: XRBackend, sessionType?: string) => {
			if (sessionType) {
				sessionTypesRef.current.delete(sessionType);

				setSessionTypes((prev) => {
					const newTypes = new Set(prev);

					newTypes.delete(sessionType);

					return newTypes;
				});
			}

			setBackends((prev) => {
				const newBackends = prev.filter((b) => b !== backend);

				// yeet the backend
				try {
					backend.dispose?.();
				} catch (err) {
					console.error("[XRSessionProvider] Error disposing backend:", err);
				}

				return newBackends;
			});
		},
		[],
	);

	// update all registered backends per frame
	useFrame(() => {
		backends.forEach((backend) => {
			try {
				backend.update?.();
			} catch (err) {
				console.error("[XRSessionProvider] Backend update error:", err);
			}
		});
	});

	const value: XRContextValue = useMemo(
		() => ({
			// always ready since sessions handle initialization
			isReady: true,
			camera: cameraSource,
			// sessions manage their own video
			video: null,
			backends,
			registerBackend,
			unregisterBackend,
		}),
		[cameraSource, backends, registerBackend, unregisterBackend, sessionTypes],
	);

	return <XRContext.Provider value={value}>{children}</XRContext.Provider>;
};

export default XRSessionProvider;
