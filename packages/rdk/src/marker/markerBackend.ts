import type { XRBackend, XRBackendInitArgs } from "lib/types/xr";
import {
	ArToolkitContext,
	ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";
import type { ArToolkitContextParameters } from "@ar-js-org/ar.js/three.js/build/ar-threex";

// TODO JSDoc

export interface MarkerSessionOptions {
	sourceType?: "webcam" | "image" | "video";
	cameraParametersUrl?: string;
	detectionMode?: string;
	patternRatio?: number;
	matrixCodeType?: string;
}

/**
 * Create a marker-based XR backend.
 */
export const createMarkerBackend = (options: unknown): XRBackend => {
	const opts = (options || {}) as MarkerSessionOptions;

	let arSource: any;
	let arContext: any;
	let resizeHandler: (() => void) | undefined;

	return {
		async init({ camera, renderer }: XRBackendInitArgs) {
			arSource = new ArToolkitSource({
				sourceType: opts.sourceType ?? "webcam",
			});

			// init source
			await new Promise<void>((resolve) => {
				arSource.init(() => {
					const el = arSource.domElement as HTMLElement;
					el.style.position = "fixed";
					el.style.top = "0";
					el.style.left = "0";
					el.style.width = "100vw";
					el.style.height = "100vh";
					el.style.objectFit = "cover";
					// behind R3F canvas
					el.style.zIndex = "-1";
					// don't block UI
					el.style.pointerEvents = "none";
					resolve();
				});
			});

			// AR.js context
			const arConfig: ArToolkitContextParameters = {
				cameraParametersUrl: opts.cameraParametersUrl,
				detectionMode: opts.detectionMode ?? "mono",
				patternRatio: opts.patternRatio ?? 0.5,
				matrixCodeType: opts.matrixCodeType ?? "3x3",
			};

			arContext = new ArToolkitContext(arConfig);

			await new Promise<void>((resolve) => {
				arContext.init(() => {
					camera.projectionMatrix.copy(arContext.getProjectionMatrix());
					doResize();
					resolve();
				});
			});

			// expose for `MarkerAnchor`
			(this as any)._arSource = arSource;
			(this as any)._arContext = arContext;

			const doResize = () => {
				arSource.onResizeElement();

				const w = window.innerWidth;
				const h = window.innerHeight;

				renderer.setSize(w, h, false);
				arSource.copyElementSizeTo(renderer.domElement);
				if (arContext && arContext.arController) {
					arSource.copyElementSizeTo(arContext.arController.canvas);
				}
			};

			window.addEventListener("resize", doResize);
			resizeHandler = doResize;
		},

		update() {
			const source = (this as any)._arSource;
			const context = (this as any)._arContext;

			if (!source || !context) return;

			if (source.ready !== false) {
				context.update(source.domElement);
			}
		},

		dispose() {
			if (resizeHandler) window.removeEventListener("resize", resizeHandler);
		},

		getInternal() {
			return {
				arSource: (this as any)._arSource,
				arContext: (this as any)._arContext,
			};
		},
	};
};
