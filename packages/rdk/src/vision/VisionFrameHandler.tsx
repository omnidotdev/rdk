import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import useVisionStore from "./stores/useVisionStore";

import type React from "react";

export interface VisionFrameHandlerProps {
  children?: React.ReactNode;
}

/**
 * Handle frame updates for vision backends within Canvas context
 */
const VisionFrameHandler: React.FC<VisionFrameHandlerProps> = ({
  children,
}) => {
  const lastUpdateTime = useRef<number>(0);

  useFrame(() => {
    const visionStore = useVisionStore.getState();

    // Only update if vision system is running
    if (!visionStore.isRunning) return;

    // Throttle updates to avoid overwhelming the system
    const now = performance.now();
    // ~60fps
    if (now - lastUpdateTime.current < 16) return;

    lastUpdateTime.current = now;

    // Vision backends handle their own update loops via requestAnimationFrame
    // This component mainly ensures we're in the right context for any future frame-based updates
  });

  return <>{children}</>;
};

export default VisionFrameHandler;
