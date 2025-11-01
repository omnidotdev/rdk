import type { XRBackend, XRBackendInitArgs } from "lib/types/xr";
import * as LocAR from "locar";
import * as THREE from "three";

/**
 * Options for the geolocation backend.
 */
export interface GeolocationSessionOptions {
	/** Mock latitude. Set if you want to start in fake GPS mode right away. */
	fakeLat?: number;
	/** Mock longitude. Set if you want to start in fake GPS mode right away. */
	fakeLon?: number;
	/** Custom webcam constraints. */
	webcamConstraints?: MediaStreamConstraints;
}

/**
 * Create a location-based AR backend.
 */
const createGeolocationBackend = (options: unknown): XRBackend => {
	const opts = (options || {}) as GeolocationSessionOptions;

	let locar: any;
	let webcam: any;
	let deviceOrientation: any;
	let resizeHandler: (() => void) | undefined;

	// exposed so the React anchor can billboard to camera
	let cameraRef: THREE.Camera | null = null;
	let rendererRef: THREE.WebGLRenderer | null = null;

	return {
		async init(args: XRBackendInitArgs & { scene?: THREE.Scene }) {
			const { camera, renderer, scene } = args;

			if (!scene)
				throw new Error(
					"[geolocationBackend] A THREE.Scene is required for location-based AR",
				);

			cameraRef = camera;
			rendererRef = renderer as any;

			// location-based handler
			locar = new LocAR.LocationBased(scene, camera);

			// video background
			webcam = new LocAR.Webcam(
				opts.webcamConstraints ?? {
					video: { facingMode: "environment" },
				},
				null,
			);

			webcam.on("webcamstarted", (ev: any) => {
				scene.background = ev.texture;
			});

			webcam.on("webcamerror", (error: any) => {
				console.error("[geolocationBackend] webcam error:", error);
			});

			// device orientation using LocAR.js built-in permission handling
			deviceOrientation = new LocAR.DeviceOrientationControls(camera);

			deviceOrientation.on("deviceorientationgranted", (ev: any) => {
				ev.target?.connect?.();
			});

			deviceOrientation.on("deviceorientationerror", (err: any) => {
				console.error("[geolocationBackend] Device orientation error:", err);
			});

			// Use LocAR.js built-in permission methods
			try {
				if (deviceOrientation.requestOrientationPermissions) {
					await deviceOrientation.requestOrientationPermissions();
				} else if (deviceOrientation.createObtainPermissionGestureDialog) {
					deviceOrientation.createObtainPermissionGestureDialog();
				}
			} catch (err) {
				console.warn("[geolocationBackend] Could not request orientation permissions:", err);
			}

			deviceOrientation.init?.();

			// GPS events; just log here, components can listen via `getInternal()`
			locar.on("gpserror", (err: any) => {
				console.error("[geolocationBackend] gps error:", err);
			});

			// start GPS
			locar.startGps();

			// optional boot in fake mode
			if (typeof opts.fakeLat === "number" && typeof opts.fakeLon === "number")
				locar.fakeGps(opts.fakeLon, opts.fakeLat);

			// handle resize
			const doResize = () => {
				if (!rendererRef || !cameraRef) return;

				const w = window.innerWidth;
				const h = window.innerHeight;

				rendererRef.setSize(w, h, false);

				// camera can be perspective or other
				(cameraRef as any).aspect = w / h;
				(cameraRef as any).updateProjectionMatrix?.();
			};

			doResize();

			window.addEventListener("resize", doResize);

			resizeHandler = doResize;

			// expose for React side
			(this as any)._locar = locar;
			(this as any)._webcam = webcam;
			(this as any)._deviceOrientation = deviceOrientation;
			(this as any)._scene = scene;
			(this as any)._camera = camera;
		},

		update() {
			const dev = (this as any)._deviceOrientation;
			dev?.update?.();
		},

		dispose() {
			const locarAny = (this as any)._locar;
			const webcamAny = (this as any)._webcam;
			const dev = (this as any)._deviceOrientation;

			if (locarAny?.stopGps) locarAny.stopGps();

			if (webcamAny?.stop) webcamAny.stop();

			if (dev?.dispose) dev.dispose();

			if (resizeHandler) {
				window.removeEventListener("resize", resizeHandler);
				resizeHandler = undefined;
			}

			(this as any)._locar = null;
			(this as any)._webcam = null;
			(this as any)._deviceOrientation = null;
			(this as any)._scene = null;
			(this as any)._camera = null;
		},

		getInternal() {
			return {
				locar: (this as any)._locar,
				webcam: (this as any)._webcam,
				deviceOrientation: (this as any)._deviceOrientation,
				scene: (this as any)._scene,
				camera: (this as any)._camera,
			};
		},
	};
};

export default createGeolocationBackend;
