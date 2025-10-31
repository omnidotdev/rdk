import {
  ArToolkitContext,
  ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";

import type { ArToolkitContextParameters } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import type { XRBackend, XRBackendInitArgs } from "lib/types/xr";

export interface FiducialSessionOptions {
  /** Input source type. */
  sourceType?: "webcam" | "image" | "video";
  /** Camera parameters URL. */
  cameraParametersUrl?: string;
  /** Detection mode. */
  detectionMode?: "color" | "color_and_matrix" | "mono" | "mono_and_matrix";
  /** Pattern ratio. */
  patternRatio?: number;
  /** Matrix code type. */
  matrixCodeType?:
    | "3x3"
    | "3x3_HAMMING63"
    | "3x3_PARITY65"
    | "4x4"
    | "4x4_BCH_13_9_3"
    | "4x4_BCH_13_5_5";
}

/**
 * Create a fiducial marker-based XR backend.
 */
const createFiducialBackend = (options: unknown): XRBackend => {
  const opts = (options || {}) as FiducialSessionOptions;

  let arSource: ArToolkitSource;
  let arContext: ArToolkitContext;
  let resizeHandler: (() => void) | undefined;

  return {
    async init({ camera, renderer }: XRBackendInitArgs) {
      arSource = new ArToolkitSource({
        sourceType: opts.sourceType ?? "webcam",
      });

      // init source
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("AR source initialization timeout"));
        }, 10000);

        arSource.init(() => {
          clearTimeout(timeoutId);
          const el = arSource.domElement as HTMLElement;
          if (el) {
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
          }
          resolve();
        });
      });

      // AR.js context
      const arConfig: ArToolkitContextParameters = {
        cameraParametersUrl:
          opts.cameraParametersUrl ??
          // default to internal camera parameters
          new URL("../../assets/camera_params.dat", import.meta.url).toString(),
        detectionMode: opts.detectionMode ?? "mono",
        patternRatio: opts.patternRatio ?? 0.5,
        matrixCodeType: opts.matrixCodeType ?? "3x3",
      };

      arContext = new ArToolkitContext(arConfig);

      const doResize = () => {
        // let AR.js figure out its internal element size first
        arSource.onResizeElement();

        // try to use the actual video size first
        const video = arSource.domElement as
          | HTMLVideoElement
          | HTMLImageElement;

        // sometimes on first call videoWidth/videoHeight are 0
        const vw =
          (video && ("videoWidth" in video ? video.videoWidth : video.width)) ||
          window.innerWidth;
        const vh =
          (video &&
            ("videoHeight" in video ? video.videoHeight : video.height)) ||
          window.innerHeight;

        // set THREE renderer to match the source
        renderer.setSize(vw, vh, false);

        // sync AR.js' canvas and the renderer dom element
        arSource.copyElementSizeTo(renderer.domElement);

        if (arContext && arContext.arController) {
          arSource.copyElementSizeTo(arContext.arController.canvas);
        }
      };

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("AR context initialization timeout"));
        }, 10000);

        arContext.init(() => {
          clearTimeout(timeoutId);
          try {
            camera.projectionMatrix.copy(arContext.getProjectionMatrix());
            doResize();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // expose for the anchor component
      (this as any)._arSource = arSource;
      (this as any)._arContext = arContext;

      window.addEventListener("resize", doResize);
      resizeHandler = doResize;
    },

    update() {
      const source = (this as any)._arSource;
      const context = (this as any)._arContext;

      if (!source || !context) return;

      // only update if source is ready and has a valid `domElement`
      if (source.ready !== false && source.domElement) {
        try {
          context.update(source.domElement);
        } catch (error) {
          console.warn("AR.js update error:", error);
        }
      }
    },

    dispose() {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = undefined;
      }

      // clean up AR.js resources
      const source = (this as any)._arSource;
      const context = (this as any)._arContext;

      if (context && typeof context.dispose === "function") {
        context.dispose();
      }

      if (source && source.domElement) {
        // re the video element from DOM
        const parent = source.domElement.parentNode;
        if (parent) {
          parent.removeChild(source.domElement);
        }
      }

      (this as any)._arSource = null;
      (this as any)._arContext = null;
    },

    getInternal() {
      return {
        arSource: (this as any)._arSource,
        arContext: (this as any)._arContext,
      };
    },
  };
};

export default createFiducialBackend;
