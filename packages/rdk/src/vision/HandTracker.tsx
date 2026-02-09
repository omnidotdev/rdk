import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import useVisionDetection from "./useVisionDetection";

import type React from "react";

export interface HandTrackerProps {
  /** Minimum confidence threshold for hand detection */
  minConfidence?: number;
  /** Callback when hand position changes */
  onHandMove?: (position: THREE.Vector3, handIndex: number) => void;
  /** Callback when gesture is detected */
  onGesture?: (gesture: string, confidence: number, handIndex: number) => void;
  /** Enable automatic coordinate smoothing */
  smoothing?: boolean;
  /** Coordinate space multipliers */
  coordinateScale?: {
    x: number;
    y: number;
    z: number;
  };
  /** Children components that will receive hand position */
  children?: React.ReactNode;
}

/**
 * High-level component for hand tracking with automatic coordinate mapping.
 *
 * Handle MediaPipe hand detection, map normalized coordinates to 3D space,
 * provide smooth position updates, detect basic gestures, and manage multiple hands.
 */
const HandTracker: React.FC<HandTrackerProps> = ({
  minConfidence = 0.7,
  onHandMove,
  onGesture,
  smoothing = true,
  coordinateScale = { x: 8, y: 6, z: 4 },
  children,
}) => {
  const handPositions = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const targetPositions = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const lastGestures = useRef<string[]>(["", ""]);

  // Hand detection hook
  const { detection, error } = useVisionDetection({
    task: "handLandmarks",
    minConfidence,
    // ~60fps
    throttle: 16,
  });

  // Simple gesture detection
  const detectGesture = (
    // biome-ignore lint/suspicious/noExplicitAny: landmark types from MediaPipe
    landmarks: any[],
  ): { gesture: string; confidence: number } => {
    if (landmarks.length < 21) return { gesture: "none", confidence: 0 };

    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    const indexTip = landmarks[8];
    const indexMcp = landmarks[6];
    const middleTip = landmarks[12];
    const middleMcp = landmarks[10];
    const ringTip = landmarks[16];
    const ringMcp = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyMcp = landmarks[18];

    // Helper to check if finger is extended
    // biome-ignore lint/suspicious/noExplicitAny: landmark type
    const isExtended = (tip: any, mcp: any) => tip.y < mcp.y;

    // Count extended fingers
    const fingersUp = [
      // Thumb (horizontal check)
      thumbTip.x > thumbMcp.x,
      isExtended(indexTip, indexMcp),
      isExtended(middleTip, middleMcp),
      isExtended(ringTip, ringMcp),
      isExtended(pinkyTip, pinkyMcp),
    ];

    const fingerCount = fingersUp.filter(Boolean).length;

    // Gesture patterns
    if (
      fingersUp[0] &&
      !fingersUp[1] &&
      !fingersUp[2] &&
      !fingersUp[3] &&
      !fingersUp[4]
    ) {
      return { gesture: "thumbs_up", confidence: 0.9 };
    }

    if (
      !fingersUp[0] &&
      fingersUp[1] &&
      fingersUp[2] &&
      !fingersUp[3] &&
      !fingersUp[4]
    ) {
      return { gesture: "peace", confidence: 0.8 };
    }

    // Pinch detection (thumb and index close)
    const pinchDistance = Math.sqrt(
      (thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2,
    );

    if (pinchDistance < 0.05 && fingersUp[2] && fingersUp[3] && fingersUp[4]) {
      return { gesture: "ok", confidence: 0.8 };
    }

    if (fingerCount === 5) {
      return { gesture: "open_hand", confidence: 0.7 };
    }

    if (fingerCount <= 1) {
      return { gesture: "fist", confidence: 0.7 };
    }

    return { gesture: "none", confidence: 0.5 };
  };

  // Update hand positions and detect gestures
  useEffect(() => {
    if (!detection) return;

    const result = detection.landmarks;

    // Process detected hand - result is already an array of landmarks
    if (Array.isArray(result) && result.length > 0) {
      const handLandmarks = result;
      if (handLandmarks.length === 0) return;

      // Get wrist position (landmark 0) for hand tracking
      const wrist = handLandmarks[0];

      // Map normalized coordinates to 3D space
      const x = (wrist.x - 0.5) * coordinateScale.x;
      // Invert Y
      const y = -(wrist.y - 0.5) * coordinateScale.y;
      const z = wrist.z * coordinateScale.z;

      // Update target position for hand index 0
      targetPositions.current[0].set(x, y, z);

      // Gesture detection
      const gestureResult = detectGesture(handLandmarks);

      // Only trigger callback if gesture changed
      if (
        gestureResult.gesture !== lastGestures.current[0] &&
        gestureResult.confidence > 0.6
      ) {
        lastGestures.current[0] = gestureResult.gesture;
        onGesture?.(gestureResult.gesture, gestureResult.confidence, 0);
      }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: detectGesture is stable
  }, [detection, coordinateScale, onGesture, detectGesture]);

  // Smooth position updates using useFrame
  useFrame((_state, delta) => {
    if (!detection) return;

    const result = detection.landmarks;

    // Handle the landmarks array directly
    if (Array.isArray(result) && result.length > 0) {
      const handIndex = 0;
      const current = handPositions.current[handIndex];
      const target = targetPositions.current[handIndex];

      if (smoothing) {
        // Smooth interpolation
        const lerpFactor = Math.min(1, delta * 10);
        current.lerp(target, lerpFactor);
      } else {
        // Direct assignment
        current.copy(target);
      }

      // Trigger position callback
      onHandMove?.(current.clone(), handIndex);
    }
  });

  // Log errors
  useEffect(() => {
    if (error) {
      console.error("[HandTracker] Detection error:", error);
    }
  }, [error]);

  // Expose hand positions to children via React context or render props
  return <>{children}</>;
};

export default HandTracker;
