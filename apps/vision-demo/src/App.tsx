import {
  AlertDescription,
  AlertRoot,
  AlertTitle,
} from "@omnidotdev/thornberry/alert";
import { Badge } from "@omnidotdev/thornberry/badge";
import { Button } from "@omnidotdev/thornberry/button";
import { Gauge, SwitchCamera } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DebugPanel,
  FaceMode,
  HandMode,
  ModeSwitcher,
  ObjectMode,
  PoseMode,
  SegmentMode,
  StatusBadge,
} from "@/components";
import { START_DEBUG, START_WEBGPU } from "@/lib/flags";
import { MODES } from "@/lib/modes";

import type { VisionProgress } from "@omnidotdev/rdk/vision";
import type { ComponentType } from "react";
import type { Facing, Mode, ModeProps } from "@/lib/modes";

const VIEWS: Record<Mode, ComponentType<ModeProps>> = {
  hands: HandMode,
  faces: FaceMode,
  poses: PoseMode,
  objects: ObjectMode,
  segment: SegmentMode,
};

const ONNX_MODES = new Set<Mode>(["objects", "segment"]);

const GESTURE_LABELS: Record<string, string> = {
  thumbs_up: "Thumbs up",
  peace: "Peace",
  ok: "OK",
  open_hand: "Open hand",
  fist: "Fist",
};

/** Whether the device has more than one camera to switch between */
const useHasCameraChoice = () => {
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    const devices = navigator.mediaDevices;
    if (!devices?.enumerateDevices) return;

    // device labels and the full list only appear once camera access is
    // granted, so check again whenever the device list changes
    const check = () =>
      devices
        .enumerateDevices()
        .then((list) =>
          setHasChoice(
            list.filter((device) => device.kind === "videoinput").length > 1,
          ),
        )
        .catch(() => setHasChoice(false));

    check();
    devices.addEventListener("devicechange", check);
    return () => devices.removeEventListener("devicechange", check);
  }, []);

  return hasChoice;
};

/**
 * Vision tracking demo: the camera fills the screen and the controls float
 * over it in three bands (header, a free middle for messages and debug, and
 * the mode switcher), so nothing ever stacks on top of anything else
 */
const App = () => {
  const [mode, setMode] = useState<Mode>("hands");
  const [debug, setDebug] = useState(START_DEBUG);
  const [webgpu, setWebgpu] = useState(START_WEBGPU);
  const [progress, setProgress] = useState<VisionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gesture, setGesture] = useState("");
  const [facing, setFacing] = useState<Facing>(MODES.hands.facing);
  const hasCameraChoice = useHasCameraChoice();

  const changeMode = useCallback((next: Mode) => {
    setMode(next);
    setFacing(MODES[next].facing);
    setProgress(null);
    setError(null);
    setGesture("");
  }, []);

  const changeWebgpu = useCallback((next: boolean) => {
    setWebgpu(next);
    setProgress(null);
    setError(null);
  }, []);

  const flipCamera = useCallback(() => {
    setFacing((prev) => (prev === "user" ? "environment" : "user"));
    setProgress(null);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => setError(err.message), []);
  const handleGesture = useCallback(
    (name: string) => setGesture(GESTURE_LABELS[name] ?? name),
    [],
  );

  const View = VIEWS[mode];
  const isOnnx = ONNX_MODES.has(mode);

  return (
    <div className="bg-background text-foreground relative h-full w-full">
      <div className="absolute inset-0">
        <View
          // a fresh session per mode, camera, and inference backend
          key={`${mode}-${facing}-${isOnnx && webgpu}`}
          debug={debug}
          facing={facing}
          webgpu={webgpu}
          onProgress={setProgress}
          onError={handleError}
          onGesture={handleGesture}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 grid grid-rows-[auto_1fr_auto]">
        <header className="pt-safe from-background/80 pointer-events-auto flex items-center gap-3 bg-gradient-to-b to-transparent px-4 pb-8">
          <div className="flex items-baseline gap-1.5 font-semibold tracking-tight">
            <span className="text-primary" aria-hidden>
              ⊗
            </span>
            RDK
            <span className="text-muted-foreground font-normal">Vision</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <StatusBadge mode={mode} progress={progress} failed={!!error} />
            {hasCameraChoice && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  facing === "user"
                    ? "Switch to the rear camera"
                    : "Switch to the front camera"
                }
                onClick={flipCamera}
                className="text-muted-foreground"
              >
                <SwitchCamera />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={debug ? "Hide debug panel" : "Show debug panel"}
              aria-pressed={debug}
              onClick={() => setDebug((prev) => !prev)}
              className={debug ? "text-primary" : "text-muted-foreground"}
            >
              <Gauge />
            </Button>
          </div>
        </header>

        <main className="flex min-h-0 flex-col items-start justify-between gap-3 overflow-hidden px-4">
          <div className="flex w-full flex-col items-start gap-2">
            {error && (
              <AlertRoot
                variant="error"
                className="bg-card pointer-events-auto max-w-sm backdrop-blur-md"
              >
                <AlertTitle>Tracking stopped</AlertTitle>
                <AlertDescription className="break-words">
                  {error}
                </AlertDescription>
              </AlertRoot>
            )}

            {debug && (
              <DebugPanel
                onnx={isOnnx}
                webgpu={webgpu}
                onWebgpuChange={changeWebgpu}
              />
            )}
          </div>

          {mode === "hands" && gesture && (
            <Badge
              variant="outline"
              className="bg-card self-center px-3 py-1 text-sm backdrop-blur-md"
            >
              {gesture}
            </Badge>
          )}
        </main>

        <footer className="pb-safe from-background/80 pointer-events-auto flex flex-col items-center gap-3 bg-gradient-to-t to-transparent px-3 pt-8">
          <p className="text-muted-foreground text-center text-sm">
            {MODES[mode].hint}
          </p>
          <ModeSwitcher mode={mode} onModeChange={changeMode} />
        </footer>
      </div>
    </div>
  );
};

export default App;
