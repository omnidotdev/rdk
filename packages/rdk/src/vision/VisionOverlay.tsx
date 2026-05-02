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

export type VisionOverlayProps = {
  /** Vision tasks to enable */
  tasks?: VisionTask[];
  /** Vision configuration options */
  options?: VisionSessionOptions;
  /** Children components to render in 3D scene */
  children?: React.ReactNode;
  /** Show debug overlay */
  showDebug?: boolean;
  /** Camera constraints */
  cameraConstraints?: CameraBackgroundProps["constraints"];
  /** Canvas style overrides */
  canvasStyle?: React.CSSProperties;
  /** Callback when camera is ready */
  onReady?: () => void;
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
  cameraConstraints,
  canvasStyle = DEFAULT_CANVAS_STYLE,
  onReady,
  onError,
}) => {
  const [showDebug, setShowDebug] = useState(initialShowDebug);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );
  const [progress, setProgress] = useState<VisionProgress | null>(null);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const onProgressRef = useRef(setProgress);
  onProgressRef.current = setProgress;
  const handleProgress = useCallback(
    (p: VisionProgress | null) => onProgressRef.current(p),
    [],
  );

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
          gl={{ alpha: true, premultipliedAlpha: false }}
        >
          <XRWrapper options={sessionOptions} onError={onError}>
            {children}
          </XRWrapper>
        </Canvas>
      )}

      <VisionStatus
        tasks={tasks}
        progress={progress}
        showDebug={showDebug}
        onToggleDebug={() => setShowDebug((prev) => !prev)}
      />

      {showDebug && (
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
