import type * as THREE from "three";

/**
 * Initialization arguments for spatial backends.
 * Contains the Three.js objects required to initialize any spatial backend.
 */
export interface BackendInitArgs {
  /** The Three.js scene to render spatial content into. */
  scene: THREE.Scene;
  /** The Three.js camera used for rendering. */
  camera: THREE.Camera;
  /** The WebGL renderer instance. */
  renderer: THREE.WebGLRenderer;
}
