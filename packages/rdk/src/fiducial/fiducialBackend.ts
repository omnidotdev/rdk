import {
  ArToolkitContext,
  ArToolkitSource,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { BACKEND_TYPES } from "lib/types/engine";

import type { ArToolkitContextParameters } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import type { Backend, BackendInitArgs } from "lib/types/engine";
import type { Camera } from "three";

/**
 * Internal state exposed by the fiducial backend.
 */
export interface FiducialInternal {
  arSource: ArToolkitSource | null;
  arContext: ArToolkitContext | null;
}

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
 * Create a fiducial marker-based AR backend.
 */
const createFiducialBackend = (
  options?: FiducialSessionOptions,
): Backend<FiducialInternal> => {
  let arSource: ArToolkitSource | null = null;
  let arContext: ArToolkitContext | null = null;
  let cameraRef: Camera | null = null;
  let resizeHandler: (() => void) | undefined;

  return {
    type: BACKEND_TYPES.FIDUCIAL,

    async init({ camera, renderer }: BackendInitArgs) {
      // AR.js needs its own video source for proper marker detection
      arSource = new ArToolkitSource({
        sourceType: options?.sourceType ?? "webcam",
      });

      // init source
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("AR source initialization timeout"));
        }, 10000);

        arSource!.init(() => {
          clearTimeout(timeoutId);
          const el = arSource!.domElement as HTMLElement;
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
          options?.cameraParametersUrl ??
          // default to internal camera parameters
          new URL("../../assets/camera_params.dat", import.meta.url).toString(),
        detectionMode: options?.detectionMode ?? "mono",
        patternRatio: options?.patternRatio ?? 0.5,
        matrixCodeType: options?.matrixCodeType ?? "3x3",
      };

      arContext = new ArToolkitContext(arConfig);
      cameraRef = camera;

      const doResize = () => {
        // let AR.js figure out its internal element size first
        arSource!.onResizeElement();

        // match fullscreen video background
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        renderer.setSize(vw, vh, false);

        arSource!.copyElementSizeTo(renderer.domElement);

        if (arContext?.arController) {
          arSource!.copyElementSizeTo(arContext.arController.canvas);
        }
      };

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("AR context initialization timeout"));
        }, 10000);

        arContext!.init(() => {
          clearTimeout(timeoutId);
          try {
            camera.projectionMatrix.copy(arContext!.getProjectionMatrix());
            doResize();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      window.addEventListener("resize", doResize);
      resizeHandler = doResize;
    },

    update() {
      if (!arSource || !arContext) return;

      if (!arSource.ready || !arSource.domElement) return;

      try {
        arContext.update(arSource.domElement);

        // update camera projection matrix each frame to fix positioning
        if (cameraRef && arContext.getProjectionMatrix) {
          cameraRef.projectionMatrix.copy(arContext.getProjectionMatrix());
        }
      } catch (err) {
        console.warn("AR.js update error:", err);
      }
    },

    dispose() {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = undefined;
      }

      // clean up AR.js resources
      if (arContext && typeof (arContext as any).dispose === "function")
        (arContext as any).dispose();

      if (arSource?.domElement) {
        const parent = arSource.domElement.parentNode;

        if (parent) parent.removeChild(arSource.domElement);
      }

      arSource = null;
      arContext = null;
      cameraRef = null;
    },

    getInternal: (): FiducialInternal => ({
      arSource,
      arContext,
    }),
  };
};

export default createFiducialBackend;
