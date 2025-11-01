import type * as THREE from "three";

/**
 * Initialization arguments for XR backends.
 * Contains the Three.js objects required to initialize any XR backend.
 */
export interface XRBackendInitArgs {
  /** The Three.js scene to render XR content into. */
  scene: THREE.Scene;
  /** The Three.js camera used for rendering. */
  camera: THREE.Camera;
  /** The WebGL renderer instance. */
  renderer: THREE.WebGLRenderer;
}
