import { BACKEND_TYPES } from "lib/types/engine";
import { Matrix4, Quaternion, Vector3 } from "three";

import { createWebcamFrameSource } from "./frameSource";

import type { Backend, BackendInitArgs } from "lib/types/engine";
import type { Controller } from "mind-ar/dist/mindar-image.prod.js";
import type { Camera } from "three";
import type { FrameSource } from "./frameSource";

/**
 * Internal state exposed by the image tracking backend.
 */
export interface ImageTrackingInternal {
  controller: Controller | null;
  /** Latest composed world matrix per target index, or `null` when lost. */
  targetMatrices: Map<number, number[] | null>;
  /** `[width, height]` per registered target, in target-image units. */
  dimensions: [number, number][];
  /**
   * Number of frames MindAR has processed since init. Increments every frame
   * the tracking loop runs, whether or not a target is matched. Useful to
   * confirm the loop is alive (a stalled loop stays at its last value).
   */
  stats: { frames: number };
}

/**
 * State returned by the image tracking backend hook.
 */
export interface ImageTrackingBackendState extends ImageTrackingInternal {
  /** Whether the backend is still initializing (not yet ready). */
  isPending: boolean;
  /** Whether the backend is initialized and ready to use. */
  isSuccess: boolean;
}

export interface ImageTrackingSessionOptions {
  /** URL of the compiled `.mind` target file. */
  imageTargetSrc: string;
  /** Maximum number of targets tracked simultaneously. */
  maxTrack?: number;
  /** Cutoff frequency; decrease to reduce jitter. */
  filterMinCF?: number;
  /** Speed coefficient; increase to reduce lag. */
  filterBeta?: number;
  /** Frames a target may be missing before it is considered lost. */
  missTolerance?: number;
  /** Frames required before a newly found target is reported. */
  warmupTolerance?: number;
  /**
   * Frame source feeding the tracker. Defaults to the rear device camera.
   * Swap this to migrate off `getUserMedia` (e.g. WebXR Raw Camera Access).
   */
  frameSource?: FrameSource;
}

/**
 * Apply MindAR's projection matrix to a Three.js camera by deriving fov/near/far.
 * No-op for cameras without perspective intrinsics.
 */
const applyProjection = (camera: Camera, projection: number[]) => {
  const perspective = camera as Camera & {
    fov?: number;
    near?: number;
    far?: number;
    updateProjectionMatrix?: () => void;
  };

  if (typeof perspective.fov !== "number") return;

  perspective.fov = (2 * Math.atan(1 / projection[5]) * 180) / Math.PI;
  perspective.near = projection[14] / (projection[10] - 1);
  perspective.far = projection[14] / (projection[10] + 1);
  perspective.updateProjectionMatrix?.();
};

/**
 * Create a natural-feature image tracking backend backed by MindAR's headless
 * controller. R3F owns rendering; this backend only feeds frames to MindAR and
 * publishes per-target world matrices for anchors to consume.
 */
const createImageTrackingBackend = (
  options: ImageTrackingSessionOptions,
): Backend<ImageTrackingInternal> => {
  let controller: Controller | null = null;
  let frameSource: FrameSource | null = null;
  const targetMatrices = new Map<number, number[] | null>();
  let dimensions: [number, number][] = [];
  const stats = { frames: 0 };

  return {
    type: BACKEND_TYPES.IMAGE_TRACKING,

    async init({ camera }: BackendInitArgs) {
      // lazy-load MindAR (and its TensorFlow.js dependency) so it only enters
      // the bundle when an image tracking session actually mounts. Use the
      // prebuilt browser bundle (workers inlined, tfjs/CJS resolved) rather than
      // the raw `src/` entry, which relies on webpack-style resolution
      const { Controller } = await import("mind-ar/dist/mindar-image.prod.js");

      frameSource = options.frameSource ?? createWebcamFrameSource();

      const video = await frameSource.start();

      controller = new Controller({
        inputWidth: video.videoWidth,
        inputHeight: video.videoHeight,
        maxTrack: options.maxTrack ?? 1,
        filterMinCF: options.filterMinCF ?? null,
        filterBeta: options.filterBeta ?? null,
        missTolerance: options.missTolerance ?? null,
        warmupTolerance: options.warmupTolerance ?? null,
      });

      // derive camera intrinsics from MindAR's projection matrix
      applyProjection(camera, controller.getProjectionMatrix());

      const result = await controller.addImageTargets(options.imageTargetSrc);
      dimensions = result.dimensions;

      // per-target correction so the anchor origin sits at the target centre
      const postMatrices = dimensions.map(([markerWidth, markerHeight]) =>
        new Matrix4().compose(
          new Vector3(
            markerWidth / 2,
            markerWidth / 2 + (markerHeight - markerWidth) / 2,
            0,
          ),
          new Quaternion(),
          new Vector3(markerWidth, markerWidth, markerWidth),
        ),
      );

      controller.onUpdate = ({ type, targetIndex, worldMatrix }) => {
        // every emitted event (including per-frame `processDone`) means the
        // loop is alive
        stats.frames += 1;

        if (type !== "updateMatrix") return;

        targetMatrices.set(
          targetIndex,
          worldMatrix
            ? new Matrix4()
                .fromArray(worldMatrix)
                .multiply(postMatrices[targetIndex])
                .toArray()
            : null,
        );
      };

      await controller.dummyRun(video);

      controller.processVideo(video);
    },

    dispose() {
      controller?.stopProcessVideo();
      controller = null;

      frameSource?.stop();
      frameSource = null;

      targetMatrices.clear();
      dimensions = [];
      stats.frames = 0;
    },

    getInternal: (): ImageTrackingInternal => ({
      controller,
      targetMatrices,
      dimensions,
      stats,
    }),
  };
};

export default createImageTrackingBackend;
