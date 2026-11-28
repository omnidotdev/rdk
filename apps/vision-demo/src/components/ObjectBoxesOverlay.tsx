import { useVisionBackend } from "@omnidotdev/rdk/vision";
import { useEffect, useRef } from "react";

import type { ObjectDetection, VisionFrame } from "@omnidotdev/rdk/vision";

const COLORS = [
  "#4ecdc4",
  "#ff6b6b",
  "#45b7d1",
  "#ffd93d",
  "#a06cd5",
  "#ff9f43",
];

/** How quickly a box closes the gap to its latest detection, per second */
const FOLLOW_RATE = 14;
/** How long a box takes to fade in or out, in seconds */
const FADE_SECONDS = 0.2;
/** Smallest overlap that counts as the same object between detections */
const MIN_MATCH_IOU = 0.2;
const MAX_DPR = 2;
/** Gap to the target, in normalized units, below which a box counts as settled */
const SETTLED = 0.0005;

type Rect = { x: number; y: number; width: number; height: number };

type TrackedBox = {
  label: string;
  confidence: number;
  /** Drawn rectangle, in normalized frame coordinates */
  rect: Rect;
  /** Latest detected rectangle the drawn one eases toward */
  target: Rect;
  opacity: number;
  /** Whether the latest detection still contains this box */
  alive: boolean;
};

/** A label's color stays the same between frames and sessions */
const colorFor = (label: string) => {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
};

const iou = (a: Rect, b: Rect) => {
  const x = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  const y = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
  const overlap = x * y;
  const union = a.width * a.height + b.width * b.height - overlap;
  return union > 0 ? overlap / union : 0;
};

const normalize = (obj: ObjectDetection, frame: VisionFrame): Rect => ({
  x: obj.bbox.x / frame.frameSize.width,
  y: obj.bbox.y / frame.frameSize.height,
  width: obj.bbox.width / frame.frameSize.width,
  height: obj.bbox.height / frame.frameSize.height,
});

/** Carry each tracked box over to its best match in a new detection */
const reconcile = (boxes: TrackedBox[], frame: VisionFrame): TrackedBox[] => {
  const unmatched = new Set(boxes);
  const next: TrackedBox[] = [];

  for (const obj of frame.objects) {
    const target = normalize(obj, frame);
    let best: TrackedBox | undefined;
    let bestScore = MIN_MATCH_IOU;
    for (const box of unmatched) {
      if (box.label !== obj.label) continue;
      const score = iou(box.target, target);
      if (score > bestScore) {
        best = box;
        bestScore = score;
      }
    }

    if (best) {
      unmatched.delete(best);
      next.push({ ...best, target, confidence: obj.confidence, alive: true });
    } else {
      next.push({
        label: obj.label,
        confidence: obj.confidence,
        rect: target,
        target,
        opacity: 0,
        alive: true,
      });
    }
  }

  // boxes that went missing fade out where they were
  for (const box of unmatched) next.push({ ...box, alive: false });
  return next;
};

type ObjectBoxesOverlayProps = {
  /** Mirror boxes horizontally to match a mirrored (selfie) preview */
  mirror?: boolean;
};

/**
 * Draws detected object boxes and labels over the camera feed, undoing the
 * `object-fit: cover` crop so boxes line up with the video. Detections arrive
 * a few times a second, so boxes ease toward each new result at the display
 * refresh rate instead of jumping
 */
const ObjectBoxesOverlay = ({ mirror = false }: ObjectBoxesOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isSuccess, onDetection } = useVisionBackend();
  const boxes = useRef<TrackedBox[]>([]);
  const frameAspect = useRef(16 / 9);
  /** Whether the canvas is out of date even if no box is moving */
  const dirty = useRef(true);

  useEffect(() => {
    if (!isSuccess) return;

    return onDetection((frame: VisionFrame) => {
      const { width, height } = frame.frameSize;
      if (!width || !height) return;
      frameAspect.current = width / height;
      boxes.current = reconcile(boxes.current, frame);
      dirty.current = true;
    });
  }, [isSuccess, onDetection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cw = 0;
    let ch = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      cw = canvas.clientWidth;
      ch = canvas.clientHeight;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // resizing clears the canvas, so draw the boxes again
      dirty.current = true;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let drewLast = false;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const follow = 1 - Math.exp(-FOLLOW_RATE * dt);
      const fade = dt / FADE_SECONDS;
      let moving = false;
      boxes.current = boxes.current.filter((box) => {
        const opacity = Math.min(
          1,
          Math.max(0, box.opacity + (box.alive ? fade : -fade)),
        );
        if (opacity !== box.opacity) moving = true;
        box.opacity = opacity;
        for (const key of ["x", "y", "width", "height"] as const) {
          const gap = box.target[key] - box.rect[key];
          if (Math.abs(gap) > SETTLED) {
            box.rect[key] += gap * follow;
            moving = true;
          } else {
            box.rect[key] = box.target[key];
          }
        }
        return box.alive || box.opacity > 0;
      });

      // redraw only while something moves: each redraw waits on a GPU the
      // model keeps busy, so a still overlay keeps the page at full rate
      if (!moving && !dirty.current) return;
      dirty.current = moving;

      // skip clearing an already empty canvas so an idle overlay costs nothing
      if (boxes.current.length === 0 && !drewLast) return;
      ctx.clearRect(0, 0, cw, ch);
      drewLast = boxes.current.length > 0;

      // undo object-fit: cover on the axis whose aspect overflows the canvas
      const containerAspect = cw / ch;
      const rx =
        frameAspect.current > containerAspect
          ? frameAspect.current / containerAspect
          : 1;
      const ry =
        frameAspect.current > containerAspect
          ? 1
          : containerAspect / frameAspect.current;

      ctx.lineWidth = 2.5;
      ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = "middle";

      for (const box of boxes.current) {
        const color = colorFor(box.label);
        const nw = box.rect.width * rx;
        const nh = box.rect.height * ry;
        let u = 0.5 + (box.rect.x - 0.5) * rx;
        const v = 0.5 + (box.rect.y - 0.5) * ry;
        if (mirror) u = 1 - u - nw;

        const left = u * cw;
        const top = v * ch;
        const w = nw * cw;
        const h = nh * ch;

        ctx.globalAlpha = box.opacity;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.roundRect(left, top, w, h, 10);
        ctx.stroke();

        const label = `${box.label} ${Math.round(box.confidence * 100)}%`;
        const pillWidth = ctx.measureText(label).width + 16;
        const pillTop = Math.max(4, top - 28);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(left, pillTop, pillWidth, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#0b1114";
        ctx.fillText(label, left + 8, pillTop + 11);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [mirror]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
};

export default ObjectBoxesOverlay;
