import type { Camera, Scene, WebGLRenderer } from "three";

/**
 * Initialization arguments for backends.
 * Contains the Three.js objects required to initialize any backend.
 */
export interface BackendInitArgs {
  /** The Three.js scene to render content into. */
  scene: Scene;
  /** The Three.js camera used for rendering. */
  camera: Camera;
  /** The WebGL renderer instance. */
  renderer: WebGLRenderer;
}
