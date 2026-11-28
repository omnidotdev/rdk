import { useVisionBackend } from "@omnidotdev/rdk/vision";
import { CardContent, CardRoot } from "@omnidotdev/thornberry/card";
import {
  SwitchControl,
  SwitchHiddenInput,
  SwitchLabel,
  SwitchRoot,
  SwitchThumb,
} from "@omnidotdev/thornberry/switch";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { VisionFrame } from "@omnidotdev/rdk/vision";

// long enough to average models that return less than once a second
const WINDOW_MS = 3000;
const MAX_WARNINGS = 3;

/**
 * Upstream warnings the demo cannot act on. @react-three/fiber 9 still
 * creates a `THREE.Clock`, which three.js deprecated in r183; fiber 10
 * replaces it
 */
const KNOWN_UPSTREAM = ["Clock: This module has been deprecated"];

// a phone has no devtools at hand, so keep recent warnings and errors on screen
let warnings: string[] = [];
const listeners = new Set<() => void>();

// MediaPipe forwards its native logs (`W1128 02:34:11.32 ... file.cc:81] ...`
// and TensorFlow Lite's `INFO: ...`) to the console; they are diagnostics, not
// problems
const NATIVE_LOG = /^([IWE]\d{4} \d{2}:\d{2}|INFO: )/;

const record = (message: string) => {
  if (NATIVE_LOG.test(message)) return;
  if (KNOWN_UPSTREAM.some((known) => message.includes(known))) return;
  warnings = [message.slice(0, 160), ...warnings].slice(0, MAX_WARNINGS);
  for (const listener of listeners) listener();
};

for (const level of ["warn", "error"] as const) {
  // biome-ignore lint/suspicious/noConsole: wraps the console to surface its output on screen
  const original = console[level];
  console[level] = (...args: unknown[]) => {
    record(args.map(String).join(" "));
    original(...args);
  };
}
addEventListener("error", (event) => record(event.message));
addEventListener("unhandledrejection", (event) => record(String(event.reason)));

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

type Stats = {
  detectionsPerSecond: number;
  inferenceMs: number;
  fps: number;
  frameSize: string;
};

/** Measure detection rate, model time, and page frame rate */
const useStats = (): Stats => {
  const { isSuccess, onDetection } = useVisionBackend();
  const detections = useRef<{ at: number; ms: number }[]>([]);
  const frameSize = useRef("-");
  const [stats, setStats] = useState<Stats>({
    detectionsPerSecond: 0,
    inferenceMs: 0,
    fps: 0,
    frameSize: "-",
  });

  useEffect(() => {
    // a new mode starts a new session, so drop the last one's numbers
    detections.current = [];
    frameSize.current = "-";
    if (!isSuccess) return;

    return onDetection((frame: VisionFrame) => {
      detections.current.push({
        at: performance.now(),
        ms: frame.processingTime ?? 0,
      });
      frameSize.current = `${frame.frameSize.width}x${frame.frameSize.height}`;
    });
  }, [isSuccess, onDetection]);

  useEffect(() => {
    let frames: number[] = [];
    let raf = 0;
    const tick = (now: number) => {
      frames.push(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const interval = setInterval(() => {
      const cutoff = performance.now() - WINDOW_MS;
      frames = frames.filter((t) => t >= cutoff);
      detections.current = detections.current.filter((d) => d.at >= cutoff);
      const recent = detections.current;
      const seconds = WINDOW_MS / 1000;

      setStats({
        detectionsPerSecond: recent.length / seconds,
        inferenceMs: recent.length
          ? recent.reduce((sum, d) => sum + d.ms, 0) / recent.length
          : 0,
        fps: Math.round(frames.length / seconds),
        frameSize: frameSize.current,
      });
    }, 500);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  return stats;
};

type DebugPanelProps = {
  /** Whether the current mode runs ONNX models, which can use WebGPU */
  onnx: boolean;
  webgpu: boolean;
  onWebgpuChange: (webgpu: boolean) => void;
};

/** Live speed and environment readout, for tuning on real devices */
const DebugPanel = ({ onnx, webgpu, onWebgpuChange }: DebugPanelProps) => {
  const { provider } = useVisionBackend();
  const stats = useStats();
  const recent = useSyncExternalStore(subscribe, () => warnings);
  const hasWebgpu = "gpu" in navigator;

  const rows: [string, string][] = [
    ["Detections", `${stats.detectionsPerSecond.toFixed(1)}/s`],
    ["Model time", `${stats.inferenceMs.toFixed(0)} ms`],
    ["Page", `${stats.fps} fps`],
    ["Engine", provider?.type ?? "-"],
    ["Camera", stats.frameSize],
    ["Multithreading", globalThis.crossOriginIsolated ? "on" : "off"],
  ];

  return (
    <CardRoot className="border-border bg-card pointer-events-auto w-full max-w-xs gap-3 py-3 shadow-lg backdrop-blur-md">
      <CardContent className="flex flex-col gap-3 p-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {onnx && (
          <SwitchRoot
            checked={webgpu}
            disabled={!hasWebgpu}
            onCheckedChange={({ checked }) => onWebgpuChange(checked)}
            className="justify-between"
          >
            <SwitchLabel className="text-xs">
              {hasWebgpu ? "Run models on the GPU" : "WebGPU unavailable"}
            </SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchHiddenInput />
          </SwitchRoot>
        )}

        {recent.length > 0 && (
          <ul className="border-border text-muted-foreground flex flex-col gap-1 border-t pt-2 text-xs">
            {recent.map((message) => (
              <li key={message} className="break-words">
                {message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </CardRoot>
  );
};

export default DebugPanel;
