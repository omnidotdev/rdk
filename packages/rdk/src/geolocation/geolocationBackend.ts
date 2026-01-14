import { BACKEND_TYPES } from "lib/types/engine";
import {
  DeviceOrientationControls,
  LocationBased as LocAR,
  Webcam,
} from "locar";

import type { Backend, BackendInitArgs } from "lib/types/engine";
import type { Camera, Group, Scene, WebGLRenderer } from "three";

/**
 * GPS update event structure emitted by LocAR.
 */
// TODO grab type from LocAR.js once it's exported in TS
export interface GpsUpdateEvent {
  position: GeolocationPosition;
  distMoved: number;
}

/**
 * Anchor registration for tracking in the geolocation backend.
 */
export interface AnchorEntry {
  anchor: Group;
  isAttached: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  /** Called once attached to LocAR scene. Receives locar instance for coordinate conversion. */
  onAttach?: (locar: LocAR) => void;
  onGpsUpdate?: (position: GeolocationPosition, distMoved: number) => void;
}

/**
 * Internal state exposed by the geolocation backend.
 */
export interface GeolocationInternal {
  locar: LocAR | null;
  webcam: Webcam | null;
  deviceOrientation: DeviceOrientationControls | null;
  scene: Scene | null;
  camera: Camera | null;
  /** Last known GPS position. */
  lastPosition: GeolocationPosition | null;
  /** Register an anchor with the backend. */
  registerAnchor: (id: string, entry: AnchorEntry) => void;
  /** Unregister an anchor from the backend. */
  unregisterAnchor: (id: string) => void;
  /** Get an anchor entry by ID. */
  getAnchor: (id: string) => AnchorEntry | undefined;
}

/**
 * State returned by geolocation backend hook.
 */
export interface GeolocationBackendState extends GeolocationInternal {
  /** Whether the backend is still initializing (not yet ready). */
  isPending: boolean;
  /** Whether the backend is initialized and ready to use. */
  isSuccess: boolean;
}

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
  onGpsUpdate?: (position: GeolocationPosition, distanceMoved: number) => void;
}

/**
 * Create a location-based AR backend.
 */
const createGeolocationBackend = (
  options?: GeolocationSessionOptions,
): Backend<GeolocationInternal> => {
  let locar: LocAR | null = null;
  let webcam: Webcam | null = null;
  let deviceOrientation: DeviceOrientationControls | null = null;
  let resizeHandler: (() => void) | undefined;

  let gpsUpdateHandler: ((data: GpsUpdateEvent) => void) | null = null;

  // exposed so the React anchor can billboard to camera
  let cameraRef: Camera | null = null;
  let rendererRef: WebGLRenderer | null = null;
  let sceneRef: Scene | null = null;

  // anchor registry - moved from module-level globals in GeolocationAnchor
  const anchorRegistry = new Map<string, AnchorEntry>();
  let lastPosition: GeolocationPosition | null = null;

  /**
   * Add an anchor to the LocAR scene.
   */
  const attachAnchor = (entry: AnchorEntry) => {
    if (!locar || entry.isAttached) return;

    try {
      locar.add(entry.anchor, entry.longitude, entry.latitude, entry.altitude);
      entry.isAttached = true;
      entry.onAttach?.(locar);
    } catch (err) {
      console.error("❌ Failed to attach anchor:", err);
    }
  };

  return {
    type: BACKEND_TYPES.GEOLOCATION,

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
        (options?.webcamConstraints ?? {
          video: { facingMode: "environment" },
          // TODO remove `as any` once fixed upstream (LocAR.js)
        }) as any,
      );

      gpsUpdateHandler = (data: GpsUpdateEvent) => {
        // store the last known position for new anchors
        lastPosition = data.position;

        // process all registered anchors
        for (const entry of anchorRegistry.values()) {
          if (!entry.isAttached) attachAnchor(entry);
          entry.onGpsUpdate?.(data.position, data.distMoved);
        }

        // call session-level callback
        options?.onGpsUpdate?.(data.position, data.distMoved);
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
        typeof options?.fakeLat === "number" &&
        typeof options?.fakeLon === "number"
      )
        locar.fakeGps(options.fakeLon, options.fakeLat);

      // check for existing GPS position from LocAR
      const lastLocation = locar.getLastKnownLocation();
      if (lastLocation !== null) {
        lastPosition = {
          coords: {
            longitude: lastLocation.longitude,
            latitude: lastLocation.latitude,
            accuracy: 0,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => lastLocation,
          },
          timestamp: Date.now(),
          toJSON: () => lastLocation,
        };
      }

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

      // clean up all anchors
      for (const entry of anchorRegistry.values()) {
        if (entry.isAttached) {
          try {
            entry.anchor.removeFromParent();
          } catch (err) {
            console.error("⚠️ Error removing anchor:", err);
          }
        }
      }
      anchorRegistry.clear();

      locar = null;
      webcam = null;
      deviceOrientation = null;
      cameraRef = null;
      rendererRef = null;
      sceneRef = null;
      gpsUpdateHandler = null;
      lastPosition = null;
    },

    getInternal: (): GeolocationInternal => ({
      locar,
      webcam,
      deviceOrientation,
      scene: sceneRef,
      camera: cameraRef,
      lastPosition,
      registerAnchor: (id: string, entry: AnchorEntry) => {
        anchorRegistry.set(id, entry);

        // if already a GPS position, attach immediately
        if (lastPosition !== null && !entry.isAttached) {
          attachAnchor(entry);
          entry.onGpsUpdate?.(lastPosition, 0);
        }
      },
      unregisterAnchor: (id: string) => {
        const entry = anchorRegistry.get(id);
        if (entry?.isAttached) {
          try {
            entry.anchor.removeFromParent();
          } catch (err) {
            console.error(`⚠️ Error removing anchor ${id}:`, err);
          }
        }
        anchorRegistry.delete(id);
      },
      getAnchor: (id: string) => anchorRegistry.get(id),
    }),
  };
};

export default createGeolocationBackend;
