import { App } from "locar";

import { BACKEND_TYPES } from "@/lib/types/engine";

import type { DeviceOrientationControls, LocAR, Webcam } from "locar";
import type {
  Camera,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { Backend, BackendInitArgs } from "@/lib/types/engine";

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
  // LocAR's App orchestrates the LocAR core, webcam feed and device orientation
  // against our existing (react-three-fiber owned) camera, renderer and scene
  let app: App | null = null;
  let locar: LocAR | null = null;
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

  // stable function refs (defined once per backend, not per `getInternal()` call)
  const registerAnchor = (id: string, entry: AnchorEntry) => {
    anchorRegistry.set(id, entry);

    // if already a GPS position, attach immediately
    if (lastPosition !== null && !entry.isAttached) {
      attachAnchor(entry);
      entry.onGpsUpdate?.(lastPosition, 0);
    }
  };

  const unregisterAnchor = (id: string) => {
    const entry = anchorRegistry.get(id);
    if (entry?.isAttached) {
      try {
        entry.anchor.removeFromParent();
      } catch (err) {
        console.error(`⚠️ Error removing anchor ${id}:`, err);
      }
    }
    anchorRegistry.delete(id);
  };

  const getAnchor = (id: string) => anchorRegistry.get(id);

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

      // App wires the LocAR core, webcam and device orientation against our
      // existing three.js objects (LocAR >= 0.2.6 `threeObjects` option)
      app = new App({
        threeObjects: {
          // TODO location-based AR assumes a perspective camera; narrow
          // `BackendInitArgs.camera` to PerspectiveCamera or validate here
          camera: camera as PerspectiveCamera,
          renderer,
          scene,
        },
        videoConstraints: (options?.webcamConstraints ?? {
          video: { facingMode: "environment" },
          // TODO narrow `webcamConstraints` to LocAR's `{ video: { facingMode } }` shape
        }) as { video: { facingMode: string } },
        deviceOrientationOptions: { enabled: true },
      });

      // App renders the camera feed as a DOM <video> (object-fit: cover) behind
      // the canvas, rather than a stretched `scene.background` texture. Clear the
      // WebGL canvas to transparent so the feed shows through
      renderer.setClearAlpha?.(0);

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

      // start() initializes the webcam + device orientation and resolves with the
      // LocAR instance (which extends EventEmitter for gps events)
      locar = await app.start();

      // LocAR's DeviceOrientationControls binds to the `deviceorientationabsolute`
      // event by default. iOS Safari never fires that event, and some devices
      // deliver it as a stuck zero reading, so no usable orientation arrives and the
      // control holds its neutral "device flat" pose, pitching the camera straight
      // down. Every anchor sits at the horizon, so the AR scene renders empty in
      // every direction. Rebinding to the plain `deviceorientation` event (fired on
      // all platforms, and carrying webkitCompassHeading for absolute heading on
      // iOS) makes the camera track the device everywhere. Verified on-device
      const orientationControls = app.deviceOrientationControls;
      if (
        orientationControls &&
        orientationControls.orientationChangeEventName !== "deviceorientation"
      ) {
        try {
          orientationControls.disconnect();
          orientationControls.orientationChangeEventName = "deviceorientation";
          orientationControls.connect();
        } catch (err) {
          console.error(
            "[geolocationBackend] failed to rebind device orientation event:",
            err,
          );
        }
      }

      locar.on("gpsupdate", gpsUpdateHandler);

      app.webcam?.on?.("webcamerror", (err) => {
        console.error("[geolocationBackend] webcam error:", err);
      });

      app.deviceOrientationControls?.on?.("deviceorientationerror", (err) => {
        console.error("[geolocationBackend] Device orientation error:", err);
      });

      // GPS events; just log here, components can listen via `getInternal()`
      locar.on("gpserror", (err) => {
        console.error("[geolocationBackend] gps error:", err);
      });

      // start GPS (0.2.x returns a Promise; errors surface via the gpserror event)
      void locar.startGps();

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
    },

    update() {
      app?.deviceOrientationControls?.update?.();
    },

    dispose() {
      if (locar && gpsUpdateHandler) {
        locar.off("gpsupdate", gpsUpdateHandler);
      }

      locar?.stopGps?.();

      // App's Webcam owns the <video> element and media stream; dispose() stops
      // the tracks and removes the element (LocAR >= 0.2.5), then restore canvas
      // opacity
      app?.webcam?.dispose?.();
      rendererRef?.setClearAlpha?.(1);

      app?.deviceOrientationControls?.dispose?.();

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

      app = null;
      locar = null;
      cameraRef = null;
      rendererRef = null;
      sceneRef = null;
      gpsUpdateHandler = null;
      lastPosition = null;
    },

    getInternal: (): GeolocationInternal => ({
      locar,
      webcam: app?.webcam ?? null,
      deviceOrientation: app?.deviceOrientationControls ?? null,
      scene: sceneRef,
      camera: cameraRef,
      lastPosition,
      registerAnchor,
      unregisterAnchor,
      getAnchor,
    }),
  };
};

export default createGeolocationBackend;
