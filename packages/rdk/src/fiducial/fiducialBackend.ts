import {
  ArToolkitContext,
  ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";

import type { ArToolkitContextParameters } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import type { Backend, BackendInitArgs } from "lib/types/engine";
import type { Camera } from "three";

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
 * Internal backend extension that includes private fields.
 */
interface InternalBackend extends Backend {
  _arSource?: ArToolkitSource;
  _arContext?: ArToolkitContext;
  _camera?: Camera;
}

/**
 * Create a fiducial marker-based AR backend.
 */
const createFiducialBackend = (options: FiducialSessionOptions): Backend => {
  let arSource: ArToolkitSource;
  let arContext: ArToolkitContext;
  let resizeHandler: (() => void) | undefined;

  const backend: InternalBackend = {
    async init({ camera, renderer }: BackendInitArgs) {
      // AR.js needs its own video source for proper marker detection
      arSource = new ArToolkitSource({
        sourceType: options.sourceType ?? "webcam",
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
          options.cameraParametersUrl ??
          // default to internal camera parameters
          new URL("../../assets/camera_params.dat", import.meta.url).toString(),
        detectionMode: options.detectionMode ?? "mono",
        patternRatio: options.patternRatio ?? 0.5,
        matrixCodeType: options.matrixCodeType ?? "3x3",
      };

      arContext = new ArToolkitContext(arConfig);

      const doResize = () => {
        // let AR.js figure out its internal element size first
        arSource.onResizeElement();

        // use viewport dimensions to match the fullscreen video background
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // set THREE renderer to match viewport (same as video background)
        renderer.setSize(vw, vh, false);

        // sync AR.js' canvas and the renderer dom element
        arSource.copyElementSizeTo(renderer.domElement);

        if (arContext?.arController) {
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
          } catch (err) {
            reject(err);
          }
        });
      });

      // expose for the anchor component
      this._arSource = arSource;
      this._arContext = arContext;
      this._camera = camera;

      window.addEventListener("resize", doResize);
      resizeHandler = doResize;
    },

    update() {
      const source = this._arSource;
      const context = this._arContext;
      const camera = this._camera;

      if (!source || !context) return;

      // only update if source is ready and has a valid `domElement`
      if (source.ready !== false && source.domElement) {
        try {
          context.update(source.domElement);

          // update camera projection matrix each frame to fix positioning
          if (camera && context.getProjectionMatrix)
            camera.projectionMatrix.copy(context.getProjectionMatrix());
        } catch (err) {
          console.warn("AR.js update error:", err);
        }
      }
    },

    dispose() {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = undefined;
      }

      // clean up AR.js resources
      const source = this._arSource;
      const context = this._arContext;

      // @ts-expect-error TODO: figure out type errors here
      if (context && typeof context.dispose === "function") {
        // @ts-expect-error TODO: figure out type errors here
        context.dispose();
      }

      if (source?.domElement) {
        const parent = source.domElement.parentNode;
        if (parent) {
          parent.removeChild(source.domElement);
        }
      }

      this._arSource = undefined;
      this._arContext = undefined;
    },

    getInternal() {
      return {
        arSource: this._arSource,
        arContext: this._arContext,
      };
    },
  };

  return backend;
};

export default createFiducialBackend;
