import {
  DeviceOrientationControls,
  LocationBased as LocAR,
  Webcam,
} from "locar";

import type { Backend, BackendInitArgs } from "lib/types/engine";
import type { Camera, Scene, WebGLRenderer } from "three";

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
  /**
   * GPS update callback. Fires when a new GPS position is received.
   * @param position Updated GPS position.
   * @param distanceMoved Distance moved, in meters, since the last update.
   */
  // TODO automatically grab type from LocAR.js once it's exported in TS
  onGpsUpdate?: (position: GeolocationPosition, distanceMoved: number) => void;
}

/**
 * Create a location-based AR backend.
 */
const createGeolocationBackend = (
  options: GeolocationSessionOptions,
): Backend => {
  let locar: LocAR | null = null;
  let webcam: Webcam | null = null;
  let deviceOrientation: DeviceOrientationControls | null = null;
  let resizeHandler: (() => void) | undefined;

  // for cleanup of gps handler
  let gpsUpdateHandler:
    | ((data: { position: GeolocationPosition; distMoved: number }) => void)
    | null = null;

  // exposed so the React anchor can billboard to camera
  let cameraRef: Camera | null = null;
  let rendererRef: WebGLRenderer | null = null;
  let sceneRef: Scene | null = null;

  return {
    async init(args: BackendInitArgs & { scene?: Scene }) {
      const { camera, renderer, scene } = args;

      if (!scene)
        throw new Error(
          "[geolocationBackend] A THREE.Scene is required for location-based AR",
        );

      cameraRef = camera;
      rendererRef = renderer;
      sceneRef = scene;

      // location-based handler
      locar = new LocAR(scene, camera);

      // video background
      webcam = new Webcam(
        (options.webcamConstraints ?? {
          video: { facingMode: "environment" },
          // TODO remove `as any` once fixed upstream (LocAR.js)
        }) as any,
      );

      gpsUpdateHandler = (data: {
        position: GeolocationPosition;
        distMoved: number;
      }) => {
        options.onGpsUpdate?.(data.position, data.distMoved);
      };

      locar.on("gpsupdate", gpsUpdateHandler);

      webcam.on("webcamstarted", (evt) => {
        scene.background = evt.texture;
      });

      webcam.on("webcamerror", (err) => {
        console.error("[geolocationBackend] webcam error:", err);
      });

      // device orientation using LocAR.js built-in permission handling
      deviceOrientation = new DeviceOrientationControls(camera);

      deviceOrientation.on("deviceorientationgranted", (evt) => {
        evt.target?.connect?.();
      });

      deviceOrientation.on("deviceorientationerror", (err) => {
        console.error("[geolocationBackend] Device orientation error:", err);
      });

      // Initialize permission handling
      deviceOrientation.init?.();

      // GPS events; just log here, components can listen via `getInternal()`
      locar.on("gpserror", (err) => {
        console.error("[geolocationBackend] gps error:", err);
      });

      // start GPS
      locar.startGps();

      // optional boot in fake mode
      if (
        typeof options.fakeLat === "number" &&
        typeof options.fakeLon === "number"
      )
        locar.fakeGps(options.fakeLon, options.fakeLat);

      // handle resize
      const doResize = () => {
        if (!rendererRef || !cameraRef) return;

        const w = window.innerWidth;
        const h = window.innerHeight;

        rendererRef.setSize(w, h, false);

        // camera can be perspective or other
        // TODO improve this, these attributes are part of Three.js perspective cameras (https://threejs.org/docs/#PerspectiveCamera); figure whether custom cameras should be allowed here or if it should be narrowed to perspective cameras
        (cameraRef as any).aspect = w / h;
        (cameraRef as any).updateProjectionMatrix?.();
      };

      doResize();

      window.addEventListener("resize", doResize);

      resizeHandler = doResize;
    },

    update() {
      deviceOrientation?.update?.();
    },

    dispose() {
      if (locar && gpsUpdateHandler) {
        locar.off("gpsupdate", gpsUpdateHandler);
      }

      locar?.stopGps?.();
      // TODO remove `as any` once fixed upstream (LocAR.js)
      (webcam as any)?.stop?.();
      deviceOrientation?.dispose?.();

      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = undefined;
      }

      locar = null;
      webcam = null;
      deviceOrientation = null;
      cameraRef = null;
      rendererRef = null;
      sceneRef = null;
      gpsUpdateHandler = null;
    },

    getInternal() {
      return {
        locar,
        webcam,
        deviceOrientation,
        scene: sceneRef,
        camera: cameraRef,
      };
    },
  };
};

export default createGeolocationBackend;
