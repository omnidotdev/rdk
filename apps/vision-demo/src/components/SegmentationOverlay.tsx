import { useVisionFrame } from "@omnidotdev/rdk/vision";
import { useEffect, useRef } from "react";

// Per-instance colors as [r, g, b]
const COLORS: [number, number, number][] = [
  [78, 205, 196],
  [255, 107, 107],
  [69, 183, 209],
  [255, 217, 61],
  [160, 108, 213],
  [255, 159, 67],
];

const MASK_ALPHA = 140;
const MAX_DPR = 2;

/** A label's color stays the same between frames */
const colorFor = (label: string) => {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
};

type SegmentationOverlayProps = {
  /** Mirror masks horizontally to match a mirrored (selfie) preview */
  mirror?: boolean;
};

/**
 * Draws per-instance segmentation masks (colored, translucent) + labels on a 2D
 * canvas over the camera feed, undoing the `object-fit: cover` crop so masks
 * line up with the video.
 */
const SegmentationOverlay = ({ mirror = false }: SegmentationOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Reused across masks/frames to avoid per-instance canvas allocation
  const scratchRef = useRef<OffscreenCanvas | null>(null);
  const frame = useVisionFrame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!scratchRef.current) scratchRef.current = new OffscreenCanvas(1, 1);
    const scratch = scratchRef.current;
    const scratchCtx = scratch.getContext("2d");
    if (!scratchCtx) return;

    // reallocating the backing store is costly at phone pixel ratios, so only
    // do it when the canvas size actually changes
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const width = Math.round(cw * dpr);
    const height = Math.round(ch * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const masks = frame?.masks;
    if (!frame || !masks || masks.length === 0) return;
    const { width: fw, height: fh } = frame.frameSize;
    if (!fw || !fh) return;

    const containerAspect = cw / ch;
    const frameAspect = fw / fh;
    const rx =
      frameAspect > containerAspect ? frameAspect / containerAspect : 1;
    const ry =
      frameAspect > containerAspect ? 1 : containerAspect / frameAspect;

    ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.imageSmoothingEnabled = true;

    for (const m of masks) {
      const [r, g, b] = colorFor(m.label);

      // Paint the mask into the reused scratch canvas, then scale into the box
      scratch.width = m.maskWidth;
      scratch.height = m.maskHeight;
      const img = scratchCtx.createImageData(m.maskWidth, m.maskHeight);
      // mask values are alpha, soft at the edges, so scaling stays smooth
      for (let p = 0; p < m.mask.length; p++) {
        img.data[p * 4] = r;
        img.data[p * 4 + 1] = g;
        img.data[p * 4 + 2] = b;
        img.data[p * 4 + 3] = (m.mask[p] * MASK_ALPHA) / 255;
      }
      scratchCtx.putImageData(img, 0, 0);

      const nw = (m.bbox.width / fw) * rx;
      const nh = (m.bbox.height / fh) * ry;
      let u = 0.5 + (m.bbox.x / fw - 0.5) * rx;
      const v = 0.5 + (m.bbox.y / fh - 0.5) * ry;
      if (mirror) u = 1 - u - nw;

      const left = u * cw;
      const top = v * ch;
      ctx.drawImage(scratch, left, top, nw * cw, nh * ch);

      const label = `${m.label} ${Math.round(m.confidence * 100)}%`;
      const pillTop = Math.max(4, top - 28);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.roundRect(left, pillTop, ctx.measureText(label).width + 16, 22, 11);
      ctx.fill();
      ctx.fillStyle = "#0b1114";
      ctx.fillText(label, left + 8, pillTop + 11);
    }
  }, [frame, mirror]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
};

export default SegmentationOverlay;
