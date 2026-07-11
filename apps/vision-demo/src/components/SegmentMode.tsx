import {
  CameraBackground,
  VisionSession,
  yoloSeg,
} from "@omnidotdev/rdk/vision";
import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";

import ErrorBanner from "./ErrorBanner";
import SegmentationOverlay from "./SegmentationOverlay";

import type { VisionSessionOptions } from "@omnidotdev/rdk/vision";

// YOLOv8n-seg export (detection [1,116,8400] + prototypes [1,32,160,160]);
// mask assembly + NMS run in the RDK decoder.
const MODEL_URL =
  "https://raw.githubusercontent.com/Hyuto/yolov8-seg-onnxruntime-web/master/public/model/yolov8n-seg.onnx";

/**
 * ONNX instance-segmentation mode: rear camera -> ONNX Runtime Web (YOLOv8n-seg)
 * in a worker -> per-instance masks. Exercises the segmentation decoder path.
 */
const SegmentMode = () => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");

  const handleError = useCallback((err: Error) => setError(err.message), []);
  const handleReady = useCallback((v: HTMLVideoElement) => setVideo(v), []);

  const options: VisionSessionOptions = useMemo(
    () => ({
      provider: "onnx",
      tasks: ["objects"],
      minConfidence: 0.4,
      maxResults: 10,
      // This export has a fixed 640 input; inputSize is only tunable on a
      // dynamic-shape export.
      onnx: { models: [yoloSeg(MODEL_URL)] },
      videoElement: video ?? undefined,
    }),
    [video],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CameraBackground
        constraints={{
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        }}
        mirrored={false}
        onReady={handleReady}
        onError={handleError}
      />

      {video && (
        <Canvas
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <VisionSession options={options} onError={handleError} />
        </Canvas>
      )}

      <SegmentationOverlay />

      {error && <ErrorBanner message={error} />}
    </div>
  );
};

export default SegmentMode;
