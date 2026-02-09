import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import useVisionDetection from "./useVisionDetection";
import VisionFrameHandler from "./VisionFrameHandler";
import VisionSession from "./VisionSession";

import type React from "react";
import type { VisionSessionOptions, VisionTask } from "./types";

export interface VisionCameraProps {
  /** Vision tasks to enable */
  tasks: VisionTask[];
  /** Vision configuration options */
  options?: Partial<VisionSessionOptions>;
  /** Children components to render in 3D scene */
  children?: React.ReactNode;
  /** Show debug overlay */
  showDebug?: boolean;
  /** Camera constraints */
  cameraConstraints?: MediaStreamConstraints["video"];
  /** Canvas style overrides */
  canvasStyle?: React.CSSProperties;
  /** Callback when vision system is ready */
  onReady?: () => void;
  /** Callback for vision errors */
  onError?: (error: Error) => void;
}

/**
 * Camera Background Component.
 * Handle camera stream setup and display.
 */
const CameraBackground: React.FC<{
  constraints?: MediaStreamConstraints["video"];
  onReady?: (video: HTMLVideoElement) => void;
  onError?: (error: Error) => void;
}> = ({ constraints, onReady, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isInitializing) return;

    const startCamera = async () => {
      try {
        setIsInitializing(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints || {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        if (videoRef.current && !isReady) {
          videoRef.current.srcObject = stream;

          // Wait for video to be loaded before playing
          await new Promise<void>((resolve, reject) => {
            const video = videoRef.current!;

            const handleCanPlay = () => {
              video.removeEventListener("canplay", handleCanPlay);
              video.removeEventListener("error", handleError);
              resolve();
            };

            const handleError = () => {
              video.removeEventListener("canplay", handleCanPlay);
              video.removeEventListener("error", handleError);
              reject(new Error("Video failed to load"));
            };

            video.addEventListener("canplay", handleCanPlay, { once: true });
            video.addEventListener("error", handleError, { once: true });
          });

          await videoRef.current.play();
          setIsReady(true);
          onReady?.(videoRef.current);
        }
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to access camera");
        console.error("Camera error:", err);
        onError?.(err);
      } finally {
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [constraints, isInitializing, isReady, onError, onReady]);

  return (
    <video
      ref={videoRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: -1,
        opacity: isReady ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
      autoPlay
      playsInline
      muted
    />
  );
};

/**
 * Vision Status Overlay
 */
const VisionStatus: React.FC<{
  tasks: VisionTask[];
  showDebug: boolean;
  onToggleDebug: () => void;
}> = ({ tasks, showDebug, onToggleDebug }) => {
  // Get detection status for all tasks
  const handDetection = useVisionDetection({
    task: "handLandmarks",
    minConfidence: 0.5,
  });

  const faceDetection = useVisionDetection({
    task: "faceLandmarks",
    minConfidence: 0.5,
  });

  const poseDetection = useVisionDetection({
    task: "poseEstimation",
    minConfidence: 0.5,
  });

  const getTaskStatus = (task: VisionTask) => {
    switch (task) {
      case "handLandmarks":
        return handDetection;
      case "faceLandmarks":
        return faceDetection;
      case "poseEstimation":
        return poseDetection;
      default:
        return { detection: null, isTracking: false, error: null };
    }
  };

  const hasError = tasks.some((task) => getTaskStatus(task).error);
  const isRunning = tasks.some((task) => getTaskStatus(task).isTracking);

  return (
    <>
      {/* Status indicator */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.9rem",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: hasError
                ? "#ff4444"
                : isRunning
                  ? "#00ff88"
                  : "#ffaa00",
            }}
          />
          <span>
            {hasError ? "Error" : isRunning ? "Active" : "Starting..."}
          </span>
        </div>

        {tasks.map((task) => {
          const status = getTaskStatus(task);
          return (
            <div
              key={task}
              style={{
                fontSize: "0.8rem",
                opacity: 0.8,
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span>{task}</span>
              <span>{status.detection ? "active" : "idle"}</span>
            </div>
          );
        })}
      </div>

      {/* Debug toggle */}
      <button
        onClick={onToggleDebug}
        type="button"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          border: "1px solid #333",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.8rem",
          zIndex: 1000,
        }}
      >
        {showDebug ? "Hide" : "Show"} Debug
      </button>

      {/* Error display */}
      {hasError && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 0, 0, 0.9)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.9rem",
            zIndex: 1000,
          }}
        >
          Vision Error - Check console for details
        </div>
      )}
    </>
  );
};

/**
 * High-level component that combines camera, vision tracking, and 3D rendering.
 *
 * Handle:
 * - Camera stream setup and display
 * - Vision session initialization
 * - 3D scene with proper overlay
 * - Status indicators and error handling
 * - Debug visualization
 */
const VisionCamera: React.FC<VisionCameraProps> = ({
  tasks,
  options = {},
  children,
  showDebug: initialShowDebug = false,
  cameraConstraints,
  canvasStyle = {},
  onReady,
  onError,
}) => {
  const [showDebug, setShowDebug] = useState(initialShowDebug);
  const [cameraReady, setCameraReady] = useState(false);

  const handleCameraReady = (_video: HTMLVideoElement) => {
    setCameraReady(true);
    onReady?.();
  };

  const handleVisionError = (error: Error) => {
    console.error("[VisionCamera] Vision error:", error);
    onError?.(error);
  };

  const defaultOptions: VisionSessionOptions = {
    type: "mediapipe",
    tasks,
    minConfidence: 0.6,
    maxResults: 2,
    useGpu: true,
    autoStart: true,
    ...options,
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Camera background */}
      <CameraBackground
        constraints={cameraConstraints}
        onReady={handleCameraReady}
        onError={handleVisionError}
      />

      {/* Vision system - MediaPipe will handle its own video */}
      <VisionSession options={defaultOptions}>
        {/* 3D Canvas overlay */}
        <Canvas
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            ...canvasStyle,
          }}
          camera={{
            position: [0, 0, 5],
            fov: 75,
          }}
          gl={{
            alpha: true,
            premultipliedAlpha: false,
          }}
        >
          <VisionFrameHandler>
            {/* Default lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={0.8} />

            {/* User's 3D content */}
            {children}
          </VisionFrameHandler>
        </Canvas>

        {/* UI Overlays */}
        <VisionStatus
          tasks={tasks}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug(!showDebug)}
        />

        {/* Debug visualization */}
        {showDebug && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              border: "1px solid #333",
              borderRadius: "6px",
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            {/* Debug overlay will be rendered here */}
          </div>
        )}
      </VisionSession>

      {/* Loading indicator */}
      {!cameraReady && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            fontFamily: "system-ui, sans-serif",
            zIndex: 2000,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255, 255, 255, 0.3)",
                borderTop: "3px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            Initializing Camera...
          </div>
        </div>
      )}

      {/* Global styles */}
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: inline keyframes for spinner
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
};

export default VisionCamera;
