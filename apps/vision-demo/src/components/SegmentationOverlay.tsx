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
  const frame = useVisionFrame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
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

    ctx.font = "600 14px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.imageSmoothingEnabled = true;

    masks.forEach((m, i) => {
      const [r, g, b] = COLORS[i % COLORS.length];

      // Paint the mask into a small offscreen canvas, then scale into the box
      const maskCanvas = new OffscreenCanvas(m.maskWidth, m.maskHeight);
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) return;
      const img = maskCtx.createImageData(m.maskWidth, m.maskHeight);
      for (let p = 0; p < m.mask.length; p++) {
        if (m.mask[p]) {
          img.data[p * 4] = r;
          img.data[p * 4 + 1] = g;
          img.data[p * 4 + 2] = b;
          img.data[p * 4 + 3] = MASK_ALPHA;
        }
      }
      maskCtx.putImageData(img, 0, 0);

      const nw = (m.bbox.width / fw) * rx;
      const nh = (m.bbox.height / fh) * ry;
      let u = 0.5 + (m.bbox.x / fw - 0.5) * rx;
      const v = 0.5 + (m.bbox.y / fh - 0.5) * ry;
      if (mirror) u = 1 - u - nw;

      const left = u * cw;
      const top = v * ch;
      ctx.drawImage(maskCanvas, left, top, nw * cw, nh * ch);

      const label = `${m.label} ${Math.round(m.confidence * 100)}%`;
      const labelTop = Math.max(0, top - 18);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(left, labelTop, ctx.measureText(label).width + 8, 18);
      ctx.fillStyle = "#000";
      ctx.fillText(label, left + 4, labelTop + 2);
    });
  }, [frame, mirror]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};

export default SegmentationOverlay;
