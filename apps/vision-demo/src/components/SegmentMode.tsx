import {
  CameraBackground,
  VisionSession,
  yoloSeg,
} from "@omnidotdev/rdk/vision";
import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";

import { cameraConstraints } from "@/lib/modes";
import SegmentationOverlay from "./SegmentationOverlay";

import type { VisionSessionOptions } from "@omnidotdev/rdk/vision";
import type { ModeProps } from "@/lib/modes";

// YOLOv8n-seg export (detection [1,116,8400] + prototypes [1,32,160,160]);
// mask assembly + NMS run in the RDK decoder.
const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/Hyuto/yolov8-seg-onnxruntime-web@2f404048359f26bc7d00f80e9a6f10e3b19b8ced/public/model/yolov8n-seg.onnx";

/**
 * ONNX instance-segmentation mode: rear camera -> ONNX Runtime Web (YOLOv8n-seg)
 * in a worker -> per-instance masks. Exercises the segmentation decoder path.
 */
const SegmentMode = ({ webgpu, facing, onProgress, onError }: ModeProps) => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const handleReady = useCallback((v: HTMLVideoElement) => setVideo(v), []);

  const options: VisionSessionOptions = useMemo(
    () => ({
      provider: "onnx",
      tasks: ["objects"],
      minConfidence: 0.4,
      maxResults: 10,
      // This export has a fixed 640 input; inputSize is only tunable on a
      // dynamic-shape export.
      onnx: { models: [yoloSeg(MODEL_URL)], webgpu },
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

      <SegmentationOverlay mirror={facing === "user"} />
    </div>
  );
};

export default SegmentMode;
