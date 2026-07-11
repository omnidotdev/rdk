import { CameraBackground, VisionSession, yolo } from "@omnidotdev/rdk/vision";
import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";

import ErrorBanner from "./ErrorBanner";
import ObjectBoxesOverlay from "./ObjectBoxesOverlay";

import type { VisionSessionOptions } from "@omnidotdev/rdk/vision";

// Plain YOLOv8n export (output [1, 84, 8400]); NMS runs in the RDK decoder.
const MODEL_URL =
  "https://raw.githubusercontent.com/Hyuto/yolov8-onnxruntime-web/master/public/model/yolov8n.onnx";

/**
 * ONNX object-detection mode: rear camera -> ONNX Runtime Web (YOLOv8n) in a
 * worker -> bounding boxes. Exercises the full ONNX provider + decoder path.
 */
const ObjectMode = () => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");

  const handleError = useCallback((err: Error) => setError(err.message), []);
  const handleReady = useCallback((v: HTMLVideoElement) => setVideo(v), []);

  const options: VisionSessionOptions = useMemo(
    () => ({
      provider: "onnx",
      tasks: ["objects"],
      minConfidence: 0.35,
      maxResults: 20,
      onnx: { models: [yolo(MODEL_URL)] },
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

      <ObjectBoxesOverlay />

      {error && <ErrorBanner message={error} />}
    </div>
  );
};

export default ObjectMode;
