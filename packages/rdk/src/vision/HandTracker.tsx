import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

import { detectGesture } from "./gestures";
import { landmarkToWorld } from "./landmarkMapping";
import useVisionBackend from "./useVisionBackend";

import type { ReactNode } from "react";
import type { VisionFrame } from "./types";

export type HandTrackerProps = {
  /** Called each frame with the tracked hand anchor in R3F world space */
  onHandMove?: (position: Vector3) => void;
  /** Called when the detected gesture changes */
  onGesture?: (gesture: string, confidence: number) => void;
  /** Hand landmark index used as the anchor (default 9, palm base) */
  landmarkIndex?: number;
  /** Mirror x to match a mirrored (selfie) preview (default true) */
  mirror?: boolean;
  /** Content rendered inside the tracker's group */
  children?: ReactNode;
};

/**
 * Tracks the first detected hand from the active vision session, reporting its
 * world-space position and detected gesture. Reads detections imperatively in
 * the render loop (no per-frame React state). Renders inside an R3F Canvas
 * (e.g. as a child of `VisionOverlay`).
 */
const HandTracker = ({
  onHandMove,
  onGesture,
  landmarkIndex = 9,
  mirror = true,
  children,
}: HandTrackerProps) => {
  const { onDetection, isSuccess } = useVisionBackend();
  const { viewport } = useThree();

  const frameRef = useRef<VisionFrame | null>(null);
  const positionRef = useRef(new Vector3());
  const lastGesture = useRef("");

  useEffect(() => {
    if (!isSuccess) return;
    return onDetection((frame) => {
      frameRef.current = frame;
    });
  }, [isSuccess, onDetection]);

  useFrame(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const hand = frame.hands[0];
    if (!hand || hand.landmarks.length === 0) return;

    const anchor = hand.landmarks[landmarkIndex] ?? hand.landmarks[0];
    const [x, y, z] = landmarkToWorld(
      anchor,
      viewport,
      frame.frameSize,
      mirror,
    );
    positionRef.current.set(x, y, z);
    onHandMove?.(positionRef.current);

    const gesture = detectGesture(hand.landmarks);
    if (gesture.gesture !== lastGesture.current) {
      lastGesture.current = gesture.gesture;
      onGesture?.(gesture.gesture, gesture.confidence);
    }
  });

  return <group>{children}</group>;
};

export default HandTracker;
