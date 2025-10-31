// track https://github.com/AR-js-org/locar.js/issues/14
declare module "locar" {
  import * as THREE from "three";

  /**
   * Generic, small event emitter that only stores a single handler per event name.
   */
  export class EventEmitter {
    protected eventHandlers: Record<string, (...args: any[]) => void>;
    on(eventName: string, handler: (...args: any[]) => void): void;
    emit(eventName: string, ...params: any[]): void;
  }

  /**
   * Spherical Mercator (EPSG:3857) projection used by `LocationBased`.
   */
  export class SphMercProjection {
    constructor();
    /**
     * @returns [easting, northing]
     */
    project(lon: number, lat: number): [number, number];
    /**
     * @returns [lon, lat]
     */
    unproject(projected: [number, number]): [number, number];
    getID(): "epsg:3857";
  }

  /**
   * Options for GPS in `LocationBased`.
   * Mirrored from `setGpsOptions(...)`
   */
  export interface GpsOptions {
    /**
     * Meters the device must move to accept the next GPS reading.
     */
    gpsMinDistance?: number;
    /**
     * Minimum accuracy in meters to accept a GPS reading.
     */
    gpsMinAccuracy?: number;
  }

  /**
   * Optional logger object passed to `LocationBased` for debug.
   */
  export interface ServerLogger {
    /**
     * Should send data to server. Implementation-specific in userland.
     */
    sendData(endpoint: string, data: any): Promise<Response> | Response;
  }

  /**
   * Main location AR class.
   */
  export class LocationBased extends EventEmitter {
    readonly scene: THREE.Scene;
    readonly camera: THREE.Camera;

    constructor(
      scene: THREE.Scene,
      camera: THREE.Camera,
      options?: GpsOptions,
      serverLogger?: ServerLogger | null,
    );

    /**
     * Set the projection (must have `project(lon,lat): [x,y]`).
     */
    setProjection(proj: {
      project(lon: number, lat: number): [number, number];
    }): void;

    /**
     * Update GPS options at runtime.
     */
    setGpsOptions(options?: GpsOptions): void;

    /**
     * Start real GPS (`navigator.geolocation.watchPosition`).
     */
    startGps(): Promise<boolean> | boolean;

    /**
     * Stop real GPS.
     */
    stopGps(): boolean;

    /**
     * Send a fake GPS position.
     */
    fakeGps(lon: number, lat: number, elev?: number | null, acc?: number): void;

    /**
     * Convert lon/lat to world coordinates (needs initial position).
     */
    lonLatToWorldCoords(lon: number, lat: number): [number, number];

    /**
     * Add a THREE object at lon/lat/(elev) and put in the scene.
     */
    add(
      object: THREE.Object3D,
      lon: number,
      lat: number,
      elev?: number,
      properties?: Record<string, any>,
    ): void;

    /**
     * Set camera elevation (y).
     */
    setElevation(elev: number): void;

    /**
     * Events:
     * - "gpsupdate": `{ position: GeolocationPosition, distMoved: number }``
     * - "gpserror": `GeolocationPositionError`
     */
    on(
      eventName: "gpsupdate",
      handler: (data: {
        position: GeolocationPosition;
        distMoved: number;
      }) => void,
    ): void;
    on(
      eventName: "gpserror",
      handler: (error: GeolocationPositionError) => void,
    ): void;
    on(eventName: string, handler: (...args: any[]) => void): void;
  }

  /**
   * Small webcam wrapper that creates a hidden `<video>` and a `THREE.VideoTexture`.
   */
  export interface WebcamStartedEvent {
    texture: THREE.VideoTexture;
  }
  export interface WebcamErrorEvent {
    code: string;
    message: string;
  }

  export class Webcam extends EventEmitter {
    /**
     * @param constraints `MediaDevices.getUserMedia` constraints
     * @param videoElementSelector selector for an existing `<video>`; if falsy, it creates one
     */
    constructor(
      constraints?: MediaStreamConstraints,
      videoElementSelector?: string | null,
    );

    /**
     * Texture that streams the camera feed.
     */
    readonly texture: THREE.VideoTexture;

    /**
     * Free GPU resources.
     */
    dispose(): void;

    // events
    on(
      eventName: "webcamstarted",
      handler: (e: WebcamStartedEvent) => void,
    ): void;
    on(eventName: "webcamerror", handler: (e: WebcamErrorEvent) => void): void;
    on(eventName: string, handler: (...args: any[]) => void): void;
  }

  /**
   * Click handler/raycaster wrapper.
   */
  export class ClickHandler {
    constructor(renderer: THREE.WebGLRenderer);

    /**
     * Cast a ray and return intersects with scene children.
     */
    raycast(camera: THREE.Camera, scene: THREE.Scene): THREE.Intersection[];
  }

  export interface DeviceOrientationControlsOptions {
    /**
     * 0 < k <= 1. Lower = more smoothing.
     */
    smoothingFactor?: number;
    /**
     * Show iOS permission dialog.
     */
    enablePermissionDialog?: boolean;
    /**
     * Apply inline styles on the created dialog.
     */
    enableStyling?: boolean;
    /**
     * Use `window.confirm(...)` instead of building DOM.
     */
    preferConfirmDialog?: boolean;
  }

  export interface DeviceOrientationGrantedEvent {
    target: DeviceOrientationControls;
  }

  export interface DeviceOrientationErrorEvent {
    code: string;
    message: string;
    error?: string;
  }

  export class DeviceOrientationControls extends THREE.EventDispatcher {
    /**
     * @param object usually a `THREE.Camera`
     */
    constructor(
      object: THREE.Object3D,
      options?: DeviceOrientationControlsOptions,
    );

    /**
     * Begin listening to orientation + screenorientation (must be called after permission is granted on iOS).
     */
    connect(): void;

    /**
     * Stop listening.
     */
    disconnect(): void;

    /**
     * iOS: must be called in a user gesture to ask for perms.
     */
    requestOrientationPermissions(): void;

    /**
     * Create the DOM dialog (iOS-style) and wire it to requestOrientationPermissions.
     */
    createObtainPermissionGestureDialog(): void;

    /**
     * Choose `confirm()` vs DOM dialog.
     */
    obtainPermissionGesture(): void;

    /**
     * Call each frame.
     */
    update(args?: { theta?: number }): void;

    /**
     * iOS heading correction.
     */
    getCorrectedHeading(): number;

    /**
     * Provided in AR.js fix — forces re-evaluation of alpha offset.
     */
    updateAlphaOffset(): void;

    /**
     * Getters (radians).
     */
    getAlpha(): number;
    getBeta(): number;
    getGamma(): number;

    dispose(): void;

    on(
      eventName: "deviceorientationgranted",
      handler: (ev: DeviceOrientationGrantedEvent) => void,
    ): void;
    on(
      eventName: "deviceorientationerror",
      handler: (ev: DeviceOrientationErrorEvent) => void,
    ): void;
    on(eventName: string, handler: (...args: any[]) => void): void;

    enabled: boolean;
  }

  /**
   * Version string.
   */
  export const version: string;

  /**
   * Default export from build (UMD/ES) is the namespace with all the above.
   * Modeled so that:
   *   `import * as LocAR from "locar"`
   * and
   *   `import LocAR from "locar"``
   * both typecheck.
   */
  const LocAR: {
    EventEmitter: typeof EventEmitter;
    SphMercProjection: typeof SphMercProjection;
    LocationBased: typeof LocationBased;
    Webcam: typeof Webcam;
    ClickHandler: typeof ClickHandler;
    DeviceOrientationControls: typeof DeviceOrientationControls;
    version: string;
  };

  export default LocAR;
}
