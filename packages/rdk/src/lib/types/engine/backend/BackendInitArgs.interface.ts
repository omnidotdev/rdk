import type * as THREE from "three";

/**
 * Initialization arguments for backends.
 * Contains the Three.js objects required to initialize any backend.
 */
export interface BackendInitArgs {
  /** The Three.js scene to render content into. */
  scene: THREE.Scene;
  /** The Three.js camera used for rendering. */
  camera: THREE.Camera;
  /** The WebGL renderer instance. */
  renderer: THREE.WebGLRenderer;
}
