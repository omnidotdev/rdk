import { useCallback, useEffect, useState } from "react";

import { useVision } from "./VisionSession";

export interface UseVisionDetectionOptions {
  task:
    | "hands"
    | "faces"
    | "poses"
    | "handLandmarks"
    | "faceLandmarks"
    | "poseEstimation";
  minConfidence?: number;
  index?: number;
  throttle?: number;
}

export interface UseVisionDetectionReturn {
  detection: {
    landmarks: Array<{ x: number; y: number; z: number }>;
    confidence: number;
    timestamp: number;
    frameSize: { width: number; height: number };
  } | null;
  isTracking: boolean;
  error: Error | null;
  // 2D helpers
  get2DLandmarks: (
    landmarks?: Array<{ x: number; y: number; z: number }>,
  ) => Array<{ x: number; y: number }>;
  // 3D helpers
  get3DLandmarks: (
    landmarks?: Array<{ x: number; y: number; z: number }>,
  ) => Array<{ x: number; y: number; z: number }>;
}

const useVisionDetection = (
  options: UseVisionDetectionOptions,
): UseVisionDetectionReturn => {
  const { manager, isReady, error: sessionError } = useVision();
  const [detection, setDetection] =
    useState<UseVisionDetectionReturn["detection"]>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { task, minConfidence = 0.7, index = 0, throttle = 16 } = options;

  // 2D helper
  const get2DLandmarks = useCallback(
    (landmarks?: Array<{ x: number; y: number; z: number }>) => {
      const landmarksToUse = landmarks || detection?.landmarks || [];
      const frameSize = detection?.frameSize || { width: 1, height: 1 };
      return manager?.get2DLandmarks(landmarksToUse, frameSize) || [];
    },
    [manager, detection],
  );

  // 3D helper
  const get3DLandmarks = useCallback(
    (landmarks?: Array<{ x: number; y: number; z: number }>) => {
      const landmarksToUse = landmarks || detection?.landmarks || [];
      return manager?.get3DLandmarks(landmarksToUse) || [];
    },
    [manager, detection],
  );

  useEffect(() => {
    if (!manager || !isReady) {
      setDetection(null);
      setIsTracking(false);
      return;
    }

    let lastUpdate = 0;

    const unsubscribe = manager.onDetection((result) => {
      const now = performance.now();
      if (now - lastUpdate < throttle) return;
      lastUpdate = now;

      try {
        let targetDetections: Array<{
          landmarks: Array<{ x: number; y: number; z: number }>;
          confidence: number;
        }>;
        switch (task) {
          case "hands":
          case "handLandmarks":
            targetDetections = result.hands;
            break;
          case "faces":
          case "faceLandmarks":
            targetDetections = result.faces;
            break;
          case "poses":
          case "poseEstimation":
            targetDetections = result.poses;
            break;
        }

        const targetDetection = targetDetections[index];

        if (targetDetection && targetDetection.confidence >= minConfidence) {
          setDetection({
            landmarks: targetDetection.landmarks,
            confidence: targetDetection.confidence,
            timestamp: result.timestamp,
            frameSize: result.frameSize,
          });
          setIsTracking(true);
          setError(null);
        } else {
          setDetection(null);
          setIsTracking(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setDetection(null);
        setIsTracking(false);
      }
    });

    return unsubscribe;
  }, [manager, isReady, task, minConfidence, index, throttle]);

  return {
    detection,
    isTracking,
    error: error || sessionError,
    get2DLandmarks,
    get3DLandmarks,
  };
};

export default useVisionDetection;
