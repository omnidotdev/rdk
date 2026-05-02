import { useEffect, useRef, useState } from "react";

import useVisionBackend from "./useVisionBackend";

import type { VisionFrame } from "./types";

export type UseVisionFrameOptions = {
  /** Minimum interval between state updates (ms) */
  throttle?: number;
};

/**
 * Subscribe to full vision frames with a single backend subscription.
 * Use this instead of multiple `useVisionDetection` calls when you need
 * data from several tasks simultaneously.
 */
const useVisionFrame = (
  options?: UseVisionFrameOptions,
): VisionFrame | null => {
  const { isSuccess, onDetection } = useVisionBackend();
  const [frame, setFrame] = useState<VisionFrame | null>(null);
  const throttle = options?.throttle ?? 16;
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isSuccess) {
      setFrame(null);
      return;
    }

    const unsubscribe = onDetection((incoming: VisionFrame) => {
      const now = performance.now();
      if (now - lastUpdateRef.current < throttle) return;
      lastUpdateRef.current = now;
      setFrame(incoming);
    });

    return unsubscribe;
  }, [isSuccess, onDetection, throttle]);

  return frame;
};

export default useVisionFrame;
