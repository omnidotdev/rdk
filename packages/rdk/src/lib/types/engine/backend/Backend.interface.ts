import type { BackendInitArgs } from "./BackendInitArgs.interface";

/**
 * Backend interface.
 * Defines the contract for backend implementations (fiducial, geolocation, WebXR, etc.).
 */
export interface Backend {
  /**
   * Initialize the backend with the provided arguments.
   * @param args initialization arguments containing scene, camera, and renderer
   * @returns promise that resolves when initialization is complete, or void for synchronous init
   */
  init(args: BackendInitArgs): Promise<void> | void;

  /**
   * Update the backend on each frame.
   * @param dt delta time since last frame in seconds
   */
  update?(dt?: number): void;

  /**
   * Clean up resources when the backend is no longer needed.
   */
  dispose?(): void;

  /**
   * Get internal SDK objects for advanced use cases.
   * @returns internal objects specific to the backend implementation
   */
  getInternal?(): unknown;
}
