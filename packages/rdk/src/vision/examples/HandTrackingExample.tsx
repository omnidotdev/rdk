import { Canvas } from "@react-three/fiber";
import React, { useRef } from "react";

import { useVisionDetection, VisionDebug, VisionSession } from "../index";

import type { Mesh } from "three";
import type { HandLandmarksResult } from "../types";

/**
 * Hand-controlled 3D object that follows hand position
 */
const HandControlledBox: React.FC = () => {
  const meshRef = useRef<Mesh>(null);

  const { detection } = useVisionDetection({
    task: "handLandmarks",
    minConfidence: 0.7,
  });

  // Update mesh position based on detection
  React.useEffect(() => {
    if (!meshRef.current || !detection) return;

    const result = detection as unknown as { result: HandLandmarksResult };

    if (result.result?.landmarks?.length > 0) {
      // Use first hand's wrist position (landmark index 0)
      const wrist = result.result.landmarks[0][0];

      // Map normalized coordinates to 3D space
      const x = (wrist.x - 0.5) * 10;
      const y = -(wrist.y - 0.5) * 10;
      const z = wrist.z * 5;

      meshRef.current.position.set(x, y, z);

      // Rotate based on hand orientation
      if (result.result.worldLandmarks?.length > 0) {
        const worldWrist = result.result.worldLandmarks[0][0];
        meshRef.current.rotation.y = worldWrist.x * 2;
        meshRef.current.rotation.x = worldWrist.y * 2;
      }
    }
  }, [detection]);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={detection ? "#00ff00" : "#ff0000"}
        wireframe={!detection}
      />
    </mesh>
  );
};

/**
 * Multiple hand tracking with different colored objects
 */
const MultiHandTracking: React.FC = () => {
  const leftHandRef = useRef<Mesh>(null);
  const rightHandRef = useRef<Mesh>(null);

  const { detection } = useVisionDetection({
    task: "handLandmarks",
    minConfidence: 0.6,
  });

  React.useEffect(() => {
    if (!detection) return;

    const result = detection as unknown as { result: HandLandmarksResult };
    if (!result.result?.landmarks) return;

    result.result.landmarks.forEach((handLandmarks, handIndex) => {
      const handedness = result.result.handedness[handIndex];
      const isLeft = handedness.categoryName === "Left";
      const meshRef = isLeft ? leftHandRef : rightHandRef;

      if (meshRef.current && handLandmarks.length > 0) {
        const wrist = handLandmarks[0];
        const x = (wrist.x - 0.5) * 10;
        const y = -(wrist.y - 0.5) * 10;
        const z = wrist.z * 5;

        meshRef.current.position.set(x, y, z);

        // Scale based on confidence
        const scale = handedness.score;
        meshRef.current.scale.setScalar(scale);
      }
    });
  }, [detection]);

  return (
    <>
      {/* Left hand sphere */}
      <mesh ref={leftHandRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#0099ff" />
      </mesh>

      {/* Right hand sphere */}
      <mesh ref={rightHandRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>
    </>
  );
};

/**
 * Hand gesture recognition component
 */
const HandGestureDetection: React.FC = () => {
  const [gesture, setGesture] = React.useState<string>("none");
  const [confidence, setConfidence] = React.useState<number>(0);

  const detectGesture = (
    // biome-ignore lint/suspicious/noExplicitAny: landmark types from MediaPipe
    landmarks: any[],
  ): { gesture: string; confidence: number } => {
    if (landmarks.length < 21) return { gesture: "none", confidence: 0 };

    // Simple thumbs up detection
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Check if thumb is up and other fingers are down
    const thumbUp = thumbTip.y < thumbMcp.y;
    const othersDown =
      indexTip.y > landmarks[6].y &&
      middleTip.y > landmarks[10].y &&
      ringTip.y > landmarks[14].y &&
      pinkyTip.y > landmarks[18].y;

    if (thumbUp && othersDown) {
      return { gesture: "thumbs_up", confidence: 0.8 };
    }

    // Simple peace sign detection
    const indexUp = indexTip.y < landmarks[6].y;
    const middleUp = middleTip.y < landmarks[10].y;
    const ringDown = ringTip.y > landmarks[14].y;
    const pinkyDown = pinkyTip.y > landmarks[18].y;

    if (indexUp && middleUp && ringDown && pinkyDown && !thumbUp) {
      return { gesture: "peace", confidence: 0.7 };
    }

    return { gesture: "none", confidence: 0 };
  };

  const { detection } = useVisionDetection({
    task: "handLandmarks",
    minConfidence: 0.6,
    // Update gestures every 100ms
    throttle: 100,
  });

  React.useEffect(() => {
    if (!detection) return;

    const result = detection as unknown as { result: HandLandmarksResult };
    if (result.result?.landmarks?.length > 0) {
      const detectedGesture = detectGesture(result.result.landmarks[0]);
      setGesture(detectedGesture.gesture);
      setConfidence(detectedGesture.confidence);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: detectGesture is stable
  }, [detection, detectGesture]);

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "Arial, sans-serif",
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0" }}>Hand Gesture Detection</h3>
      <div>
        <strong>Gesture:</strong> {gesture}
      </div>
      <div>
        <strong>Confidence:</strong> {(confidence * 100).toFixed(1)}%
      </div>
      <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.7 }}>
        Try: Thumbs up or Peace sign
      </div>
    </div>
  );
};

/**
 * Complete hand tracking example with multiple features
 */
const HandTrackingExample: React.FC = () => {
  const [mode, setMode] = React.useState<"single" | "multi" | "gesture">(
    "single",
  );
  const [showDebug, setShowDebug] = React.useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255, 255, 255, 0.9)",
          padding: "16px",
          borderRadius: "8px",
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0" }}>Hand Tracking Demo</h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            Mode:
            <select
              value={mode}
              // biome-ignore lint/suspicious/noExplicitAny: select event value
              onChange={(e) => setMode(e.target.value as any)}
              style={{ width: "100%", padding: "4px" }}
            >
              <option value="single">Single Hand Control</option>
              <option value="multi">Multi-Hand Tracking</option>
              <option value="gesture">Gesture Recognition</option>
            </select>
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          Show Debug Overlay
        </label>
      </div>

      {/* Vision Session */}
      <VisionSession
        options={{
          minConfidence: 0.5,
          maxResults: 2,
        }}
      >
        {/* 3D Scene */}
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {mode === "single" && <HandControlledBox />}
          {mode === "multi" && <MultiHandTracking />}

          {/* Background grid */}
          <gridHelper args={[20, 20, "#444444", "#444444"]} />
        </Canvas>

        {/* Debug Overlay */}
        {showDebug && (
          <VisionDebug
            tasks={["handLandmarks"]}
            width={320}
            height={240}
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
            }}
          />
        )}

        {/* Gesture Detection UI */}
        {mode === "gesture" && <HandGestureDetection />}
      </VisionSession>
    </div>
  );
};

export default HandTrackingExample;
