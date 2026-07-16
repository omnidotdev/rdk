declare module "mind-ar/dist/mindar-image.prod.js" {
  /**
   * Options accepted by MindAR's headless image-target controller.
   */
  export interface ImageTargetControllerOptions {
    /** Width of the input frames in pixels. */
    inputWidth: number;
    /** Height of the input frames in pixels. */
    inputHeight: number;
    /** Maximum number of targets tracked simultaneously. */
    maxTrack?: number;
    /** Cutoff frequency; decrease to reduce jitter. */
    filterMinCF?: number | null;
    /** Speed coefficient; increase to reduce lag. */
    filterBeta?: number | null;
    /** Frames a target may be missing before it is considered lost. */
    missTolerance?: number | null;
    /** Frames required before a newly found target is reported. */
    warmupTolerance?: number | null;
    /** Enable MindAR's internal debug logging. */
    debugMode?: boolean;
  }

  /**
   * Data delivered to `onUpdate` on each processed frame.
   * `worldMatrix` is a column-major 4x4 matrix, or `null` when the target is lost.
   */
  export interface ImageTargetUpdate {
    type: "updateMatrix";
    targetIndex: number;
    worldMatrix: number[] | null;
  }

  /**
   * Result of registering image targets.
   * `dimensions` holds `[width, height]` per target, in target-image units.
   */
  export interface AddImageTargetsResult {
    dimensions: [number, number][];
  }

  /**
   * MindAR headless image-target tracking controller (MIT).
   * Drives natural-feature detection over a video frame source and reports
   * per-target world matrices via `onUpdate`.
   */
  export class Controller {
    constructor(options: ImageTargetControllerOptions);
    /** Assigned by the consumer; invoked on every processed frame. */
    onUpdate: ((data: ImageTargetUpdate) => void) | null;
    /** Whether the controller is currently processing a video source. */
    processingVideo: boolean;
    /** Column-major projection matrix derived from the input dimensions. */
    getProjectionMatrix(): number[];
    /** Load compiled `.mind` targets from a URL. */
    addImageTargets(url: string): Promise<AddImageTargetsResult>;
    /** Warm up the tracking pipeline against a sample frame. */
    dummyRun(video: HTMLVideoElement): Promise<void>;
    /** Begin processing frames from the given video source. */
    processVideo(video: HTMLVideoElement): void;
    /** Stop processing frames. */
    stopProcessVideo(): void;
  }
}
