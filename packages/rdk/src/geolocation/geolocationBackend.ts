import type { XRBackend, XRBackendInitArgs } from "lib/types/xr";
import * as LocAR from "locar";
import type * as THREE from "three";

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

  // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
  let locar: any;
  // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
  let webcam: any;
  // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
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
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
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

      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      webcam.on("webcamstarted", (evt: any) => {
        scene.background = evt.texture;
      });

      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      webcam.on("webcamerror", (err: any) => {
        console.error("[geolocationBackend] webcam error:", err);
      });

      // device orientation using LocAR.js built-in permission handling
      deviceOrientation = new LocAR.DeviceOrientationControls(camera);

      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      deviceOrientation.on("deviceorientationgranted", (evt: any) => {
        evt.target?.connect?.();
      });

      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      deviceOrientation.on("deviceorientationerror", (err: any) => {
        console.error("[geolocationBackend] Device orientation error:", err);
      });

      // Initialize permission handling
      deviceOrientation.init?.();

      // GPS events; just log here, components can listen via `getInternal()`
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
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
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        (cameraRef as any).aspect = w / h;
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        (cameraRef as any).updateProjectionMatrix?.();
      };

      doResize();

      window.addEventListener("resize", doResize);

      resizeHandler = doResize;

      // expose for React side
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._locar = locar;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._webcam = webcam;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._deviceOrientation = deviceOrientation;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._scene = scene;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._camera = camera;
    },

    update() {
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      const dev = (this as any)._deviceOrientation;
      dev?.update?.();
    },

    dispose() {
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      const locarAny = (this as any)._locar;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      const webcamAny = (this as any)._webcam;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      const dev = (this as any)._deviceOrientation;

      if (locarAny?.stopGps) locarAny.stopGps();

      if (webcamAny?.stop) webcamAny.stop();

      if (dev?.dispose) dev.dispose();

      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = undefined;
      }

      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._locar = null;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._webcam = null;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._deviceOrientation = null;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._scene = null;
      // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
      (this as any)._camera = null;
    },

    getInternal() {
      return {
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        locar: (this as any)._locar,
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        webcam: (this as any)._webcam,
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        deviceOrientation: (this as any)._deviceOrientation,
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        scene: (this as any)._scene,
        // biome-ignore lint/suspicious/noExplicitAny: TODO solve once LocAR.js converted to TS (https://github.com/AR-js-org/locar.js/pull/27#issuecomment-3487422995)
        camera: (this as any)._camera,
      };
    },
  };
};

export default createGeolocationBackend;
