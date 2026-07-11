import type { VisionLandmark } from "./types";

/** World-space dimensions of the camera focal plane (from R3F `useThree().viewport`) */
export type Viewport = { width: number; height: number };

/** Pixel dimensions of the source video frame (from `VisionFrame.frameSize`) */
export type FrameSize = { width: number; height: number };

/**
 * Map a normalized MediaPipe landmark (x, y in [0, 1] with y top-down) into R3F
 * world coordinates on the camera focal plane (z = 0), accounting for the
 * `object-fit: cover` center-crop used to display the camera feed. `mirror`
 * flips x to match a mirrored (selfie) preview.
 *
 * The camera feed is displayed with `cover`, so the axis whose aspect overflows
 * the canvas is cropped; landmarks are normalized to the full frame, so that
 * crop must be undone or overlays drift toward the edges (badly on portrait).
 */
export const landmarkToWorld = (
  landmark: VisionLandmark,
  viewport: Viewport,
  frameSize: FrameSize,
  mirror = true,
): [number, number, number] => {
  const containerAspect = viewport.width / viewport.height;
  const frameAspect = frameSize.width / frameSize.height;

  // object-fit: cover crops the overflowing axis; scale that axis' deviation
  const rx = frameAspect > containerAspect ? frameAspect / containerAspect : 1;
  const ry = frameAspect > containerAspect ? 1 : containerAspect / frameAspect;

  // Normalized landmark -> canvas-normalized [0, 1] (may exceed range if cropped)
  const u = 0.5 + (landmark.x - 0.5) * rx;
  const v = 0.5 + (landmark.y - 0.5) * ry;

  const x = (mirror ? 0.5 - u : u - 0.5) * viewport.width;
  const y = (0.5 - v) * viewport.height;
  return [x, y, 0];
};

/** Average a set of landmarks into a single centroid landmark */
export const landmarksCentroid = (
  landmarks: VisionLandmark[],
): VisionLandmark => {
  const count = landmarks.length || 1;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const lm of landmarks) {
    x += lm.x;
    y += lm.y;
    z += lm.z ?? 0;
  }
  return { x: x / count, y: y / count, z: z / count };
};
