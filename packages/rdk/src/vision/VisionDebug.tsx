import { useEffect, useRef } from "react";

import useVisionDetection from "./useVisionDetection";

import type React from "react";
import type { VisionTask } from "./types";

export interface VisionDebugProps {
  /** Vision tasks to visualize */
  tasks: VisionTask[];
  /** Show debug overlay */
  showOverlay?: boolean;
  /** Canvas dimensions */
  width?: number;
  height?: number;
  /** Debug styles */
  style?: React.CSSProperties;
}

/**
 * Visualize ML vision detection results
 */
const VisionDebug: React.FC<VisionDebugProps> = ({
  tasks,
  showOverlay = true,
  width = 640,
  height = 480,
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to detection results
  const handDetection = useVisionDetection({
    task: "handLandmarks",
    minConfidence: 0.3,
  });

  const faceDetection = useVisionDetection({
    task: "faceLandmarks",
    minConfidence: 0.3,
  });

  const poseDetection = useVisionDetection({
    task: "poseEstimation",
    minConfidence: 0.3,
  });

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    // biome-ignore lint/suspicious/noExplicitAny: landmark types vary by task
    landmarks: any[],
    color: string,
    radius = 2,
  ) => {
    ctx.fillStyle = color;
    for (const landmark of landmarks) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawConnections = (
    ctx: CanvasRenderingContext2D,
    // biome-ignore lint/suspicious/noExplicitAny: landmark types vary by task
    landmarks: any[],
    connections: number[][],
    color: string,
    lineWidth = 2,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const [start, end] of connections) {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start].x * width;
        const startY = landmarks[start].y * height;
        const endX = landmarks[end].x * width;
        const endY = landmarks[end].y * height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw hand landmarks
    if (tasks.includes("handLandmarks") && handDetection.detection) {
      const result = handDetection.detection.landmarks;
      // biome-ignore lint/suspicious/noExplicitAny: MediaPipe result structure
      (result as any).landmarks?.forEach(
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark array
        (handLandmarks: any[], handIndex: number) => {
          // Green for first hand, red for second
          const color = handIndex === 0 ? "#00FF00" : "#FF0000";
          drawLandmarks(ctx, handLandmarks, color, 3);

          // Draw hand connections (simplified)
          const handConnections = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4], // Thumb
            [0, 5],
            [5, 6],
            [6, 7],
            [7, 8], // Index
            [0, 9],
            [9, 10],
            [10, 11],
            [11, 12], // Middle
            [0, 13],
            [13, 14],
            [14, 15],
            [15, 16], // Ring
            [0, 17],
            [17, 18],
            [18, 19],
            [19, 20], // Pinky
          ];
          drawConnections(ctx, handLandmarks, handConnections, color, 1);
        },
      );
    }

    // Draw face landmarks
    if (tasks.includes("faceLandmarks") && faceDetection.detection) {
      const result = faceDetection.detection.landmarks;
      // biome-ignore lint/suspicious/noExplicitAny: MediaPipe result structure
      (result as any).faceLandmarks?.forEach(
        // biome-ignore lint/suspicious/noExplicitAny: MediaPipe landmark array
        (faceLandmarks: any[]) => {
          // Draw key facial points (all face landmarks, small)
          drawLandmarks(ctx, faceLandmarks.slice(0, 468), "#0099FF", 1);

          // Highlight key points
          if (faceLandmarks.length > 0) {
            // Eyes, nose, mouth key points
            const keyPoints = [
              33,
              7,
              163,
              144,
              145,
              153,
              154,
              155,
              133,
              173,
              157,
              158,
              159,
              160,
              161,
              246, // Left eye
              362,
              398,
              384,
              385,
              386,
              387,
              388,
              466,
              263,
              249,
              390,
              373,
              374,
              380,
              381,
              382, // Right eye
              1,
              2,
              5,
              4,
              6,
              168,
              8,
              9,
              10,
              151, // Nose
              61,
              84,
              17,
              314,
              405,
              320,
              307,
              375,
              321,
              308,
              324,
              318, // Mouth
            ];

            const highlightedPoints = keyPoints
              .map((i) => faceLandmarks[i])
              .filter(Boolean);
            drawLandmarks(ctx, highlightedPoints, "#FFFF00", 2);
          }
        },
      );
    }

    // Draw pose landmarks
    if (tasks.includes("poseEstimation") && poseDetection.detection) {
      const result = poseDetection.detection.landmarks;
      // biome-ignore lint/suspicious/noExplicitAny: MediaPipe result structure
      drawLandmarks(ctx, (result as any).landmarks || [], "#FF00FF", 4);

      // Draw pose connections
      const poseConnections = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 7], // Head
        [0, 4],
        [4, 5],
        [5, 6],
        [6, 8], // Head
        [9, 10], // Mouth
        [11, 12], // Shoulders
        [11, 13],
        [13, 15],
        [15, 17],
        [15, 19],
        [15, 21], // Left arm
        [12, 14],
        [14, 16],
        [16, 18],
        [16, 20],
        [16, 22], // Right arm
        [11, 23],
        [12, 24],
        [23, 24], // Torso
        [23, 25],
        [25, 27],
        [27, 29],
        [27, 31], // Left leg
        [24, 26],
        [26, 28],
        [28, 30],
        [28, 32], // Right leg
      ];
      drawConnections(
        ctx,
        (result as any).landmarks || [],
        poseConnections,
        "#FF00FF",
        2,
      );
    }
  }, [
    handDetection.detection,
    faceDetection.detection,
    poseDetection.detection,
    tasks,
    width,
    height,
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable within the effect scope
    drawConnections,
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable within the effect scope
    drawLandmarks,
  ]);

  if (!showOverlay) {
    return null;
  }

  return (
    <div style={{ position: "relative", ...style }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1000,
          pointerEvents: "none",
          border: "1px solid #333",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* Debug info overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontFamily: "monospace",
          zIndex: 1001,
          pointerEvents: "none",
        }}
      >
        <div>Vision Debug</div>
        <div>Tasks: {tasks.join(", ")}</div>
        <div>
          Status:{" "}
          {handDetection.isTracking ||
          faceDetection.isTracking ||
          poseDetection.isTracking
            ? "active"
            : "inactive"}
        </div>

        {tasks.includes("handLandmarks") && (
          <div>
            Hands:{" "}
            {handDetection.detection
              ? `${Array.isArray(handDetection.detection.landmarks) ? handDetection.detection.landmarks.length : 0} landmarks`
              : "none"}
          </div>
        )}

        {tasks.includes("faceLandmarks") && (
          <div>
            Faces:{" "}
            {faceDetection.detection
              ? `${Array.isArray(faceDetection.detection.landmarks) ? faceDetection.detection.landmarks.length : 0} landmarks`
              : "none"}
          </div>
        )}

        {tasks.includes("poseEstimation") && (
          <div>Pose: {poseDetection.detection ? "detected" : "none"}</div>
        )}

        {(handDetection.error ||
          faceDetection.error ||
          poseDetection.error) && (
          <div style={{ color: "#ff6b6b" }}>
            Error:{" "}
            {
              (
                handDetection.error ||
                faceDetection.error ||
                poseDetection.error
              )?.message
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionDebug;
