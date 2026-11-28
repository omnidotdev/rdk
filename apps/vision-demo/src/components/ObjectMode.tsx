import { CameraBackground, VisionSession, yolo } from "@omnidotdev/rdk/vision";
import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";

import { cameraConstraints } from "@/lib/modes";
import ObjectBoxesOverlay from "./ObjectBoxesOverlay";

import type { VisionSessionOptions } from "@omnidotdev/rdk/vision";
import type { ModeProps } from "@/lib/modes";

// Plain YOLOv8n export (output [1, 84, 8400]); NMS runs in the RDK decoder.
const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/Hyuto/yolov8-onnxruntime-web@fc4a52c466d15ad4519873a0cef22fbc935b93b6/public/model/yolov8n.onnx";

/**
 * ONNX object-detection mode: rear camera -> ONNX Runtime Web (YOLOv8n) in a
 * worker -> bounding boxes. Exercises the full ONNX provider + decoder path.
 */
const ObjectMode = ({ webgpu, facing, onProgress, onError }: ModeProps) => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const handleReady = useCallback((v: HTMLVideoElement) => setVideo(v), []);

  const options: VisionSessionOptions = useMemo(
    () => ({
      provider: "onnx",
      tasks: ["objects"],
      minConfidence: 0.35,
      maxResults: 20,
      onnx: { models: [yolo(MODEL_URL)], webgpu },
      onProgress,
      videoElement: video ?? undefined,
    }),
    [video, webgpu, onProgress],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CameraBackground
        constraints={cameraConstraints(facing)}
        mirrored={facing === "user"}
        onReady={handleReady}
        onError={onError}
      />

      {video && (
        // nothing 3D draws here (the overlay below is plain DOM), so the canvas
        // only renders on demand and leaves the GPU to the model
        <Canvas
          frameloop="demand"
          dpr={1}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <VisionSession options={options} onError={onError} />
        </Canvas>
      )}

      <ObjectBoxesOverlay mirror={facing === "user"} />
    </div>
  );
};

export default ObjectMode;
