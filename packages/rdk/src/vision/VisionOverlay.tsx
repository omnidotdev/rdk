import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";

import CameraBackground from "./CameraBackground";
import VisionDebug from "./VisionDebug";
import VisionSession from "./VisionSession";
import VisionStatus from "./VisionStatus";

import type React from "react";
import type { CameraBackgroundProps } from "./CameraBackground";
import type { VisionSessionOptions, VisionTask } from "./types";
import type { VisionProgress } from "./worker/types";

const DEFAULT_CANVAS_STYLE: React.CSSProperties = {};
const DEFAULT_DPR: [number, number] = [1, 2];

export type VisionOverlayProps = {
  /** Vision tasks to enable */
  tasks?: VisionTask[];
  /** Vision configuration options */
  options?: VisionSessionOptions;
  /** Children components to render in 3D scene */
  children?: React.ReactNode;
  /** Show debug overlay */
  showDebug?: boolean;
  /**
   * Show the built-in status and debug panels (default true). Set false to
   * draw your own interface, reading progress from `onProgress` and
   * detections from `useVisionFrame`
   */
  showStatus?: boolean;
  /**
   * Device pixel ratio range for the 3D canvas (default `[1, 2]`). Phone
   * screens often report 3x, which triples the pixels drawn every frame for
   * little visible gain on overlay content
   */
  dpr?: number | [min: number, max: number];
  /** Camera constraints */
  cameraConstraints?: CameraBackgroundProps["constraints"];
  /**
   * Mirror the camera preview horizontally, matching a user-facing (selfie)
   * camera (default true). Set false for a rear or world-facing camera, and
   * pass `mirror={false}` to any `VisionAnchor` inside so it lines up
   */
  mirrored?: boolean;
  /** Canvas style overrides */
  canvasStyle?: React.CSSProperties;
  /** Callback when camera is ready */
  onReady?: () => void;
  /** Model loading progress, `null` once loading finishes */
  onProgress?: (progress: VisionProgress | null) => void;
  /** Callback for vision errors */
  onError?: (error: Error) => void;
};

/**
 * High-level component that combines camera, vision tracking, and 3D rendering.
 * Compose camera background, vision session, and 3D canvas as an overlay.
 */
const VisionOverlay: React.FC<VisionOverlayProps> = ({
  tasks = ["hands"],
  options,
  children,
  showDebug: initialShowDebug = false,
  showStatus = true,
  dpr = DEFAULT_DPR,
  cameraConstraints,
  mirrored = true,
  canvasStyle = DEFAULT_CANVAS_STYLE,
  onReady,
  onProgress,
  onError,
}) => {
  const [showDebug, setShowDebug] = useState(initialShowDebug);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  const [progress, setProgress] = useState<VisionProgress | null>(null);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const handleProgress = useCallback((p: VisionProgress | null) => {
    setProgress(p);
    onProgressRef.current?.(p);
  }, []);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
    onReadyRef.current?.();
  }, []);

  const sessionOptions: VisionSessionOptions = useMemo(
    () => ({
      tasks,
      minConfidence: 0.6,
      maxResults: 2,
      useGpu: true,
      ...options,
      videoElement: videoElement ?? undefined,
      onProgress: handleProgress,
    }),
    [tasks, options, videoElement, handleProgress],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <CameraBackground
        constraints={cameraConstraints}
        mirrored={mirrored}
        onReady={handleVideoReady}
        onError={onError}
      />

      {videoElement && (
        <Canvas
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            ...canvasStyle,
          }}
          camera={{ position: [0, 0, 5], fov: 75 }}
          dpr={dpr}
          gl={{ alpha: true, premultipliedAlpha: false }}
        >
          <XRWrapper options={sessionOptions} onError={onError}>
            {children}
          </XRWrapper>
        </Canvas>
      )}

      {showStatus && (
        <VisionStatus
          tasks={tasks}
          progress={progress}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug((prev) => !prev)}
        />
      )}

      {showStatus && showDebug && (
        <VisionDebug
          tasks={tasks}
          width={320}
          height={240}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            maxWidth: "calc(100vw - 40px)",
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
};

/**
 * Inner wrapper that renders inside Canvas to access R3F context.
 * VisionSession requires useThree() which is only available inside Canvas.
 */
const XRWrapper: React.FC<{
  options: VisionSessionOptions;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}> = ({ options, onError, children }) => (
  <VisionSession options={options} onError={onError}>
    <ambientLight intensity={0.6} />
    <directionalLight position={[10, 10, 10]} intensity={0.8} />
    {children}
  </VisionSession>
);

export default VisionOverlay;
