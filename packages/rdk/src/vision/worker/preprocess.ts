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
 * Whether the letterbox padding read back as the gray it was filled with.
 * Browsers that block canvas readback (e.g. strict fingerprinting protection)
 * hand back a blank image instead of throwing, so a padding pixel that lost its
 * fill color means the frame pixels are not real. A frame with no padding
 * cannot be judged and is assumed intact.
 */
export const isPaddingIntact = (
  rgba: Uint8ClampedArray | Uint8Array,
  { padX, padY }: Letterbox,
  padGray: number,
  tolerance = 3,
): boolean => {
  if (Math.floor(padX) < 1 && Math.floor(padY) < 1) return true;

  // the top-left pixel is always padding when either axis is padded
  for (let channel = 0; channel < 3; channel++) {
    if (Math.abs(rgba[channel] - padGray) > tolerance) return false;
  }

  return true;
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
