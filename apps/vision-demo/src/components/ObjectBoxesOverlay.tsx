import { useVisionFrame } from "@omnidotdev/rdk/vision";
import { useEffect, useRef } from "react";

const COLORS = [
  "#4ecdc4",
  "#ff6b6b",
  "#45b7d1",
  "#ffd93d",
  "#a06cd5",
  "#ff9f43",
];

type ObjectBoxesOverlayProps = {
  /** Mirror boxes horizontally to match a mirrored (selfie) preview */
  mirror?: boolean;
};

/**
 * Draws detected object bounding boxes + labels on a 2D canvas over the camera
 * feed, undoing the `object-fit: cover` crop so boxes line up with the video.
 */
const ObjectBoxesOverlay = ({ mirror = false }: ObjectBoxesOverlayProps) => {
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

    if (!frame || frame.objects.length === 0) return;
    const { width: fw, height: fh } = frame.frameSize;
    if (!fw || !fh) return;

    // Undo object-fit: cover on the axis whose aspect overflows the canvas
    const containerAspect = cw / ch;
    const frameAspect = fw / fh;
    const rx =
      frameAspect > containerAspect ? frameAspect / containerAspect : 1;
    const ry =
      frameAspect > containerAspect ? 1 : containerAspect / frameAspect;

    ctx.lineWidth = 2;
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.textBaseline = "top";

    frame.objects.forEach((obj, i) => {
      const color = COLORS[i % COLORS.length];

      const nw = (obj.bbox.width / fw) * rx;
      const nh = (obj.bbox.height / fh) * ry;
      let u = 0.5 + (obj.bbox.x / fw - 0.5) * rx;
      const v = 0.5 + (obj.bbox.y / fh - 0.5) * ry;
      if (mirror) u = 1 - u - nw;

      const left = u * cw;
      const top = v * ch;
      const w = nw * cw;
      const h = nh * ch;

      ctx.strokeStyle = color;
      ctx.strokeRect(left, top, w, h);

      const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
      const labelTop = Math.max(0, top - 18);
      ctx.fillStyle = color;
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

export default ObjectBoxesOverlay;
