/** Letterbox transform mapping a source frame into a square model input */
export type Letterbox = {
  /** Uniform scale applied to the source */
  scale: number;
  /** Padding added on each axis (input-space pixels) */
  padX: number;
  padY: number;
  /** Scaled source dimensions drawn onto the square canvas */
  drawWidth: number;
  drawHeight: number;
};

/**
 * Compute the aspect-preserving letterbox that fits a source frame into a
 * `size x size` square, centered with equal padding.
 */
export const computeLetterbox = (
  sourceWidth: number,
  sourceHeight: number,
  size: number,
): Letterbox => {
  const scale = Math.min(size / sourceWidth, size / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return {
    scale,
    drawWidth,
    drawHeight,
    padX: (size - drawWidth) / 2,
    padY: (size - drawHeight) / 2,
  };
};

/**
 * Convert interleaved RGBA pixels into a planar NCHW float tensor
 * (`[1, 3, size, size]`), normalizing each channel to 0-1. Alpha is dropped.
 */
export const rgbaToNchw = (
  rgba: Uint8ClampedArray | Uint8Array,
  size: number,
): Float32Array => {
  const plane = size * size;
  const out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    out[i] = rgba[i * 4] / 255;
    out[plane + i] = rgba[i * 4 + 1] / 255;
    out[2 * plane + i] = rgba[i * 4 + 2] / 255;
  }
  return out;
};
