import useVisionFrame from "./useVisionFrame";

import type React from "react";
import type { VisionTask } from "./types";

export type VisionDebugProps = {
  /** Which tasks to show debug info for */
  tasks: VisionTask[];
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Style overrides */
  style?: React.CSSProperties;
};

/**
 * Debug overlay showing raw detection data (landmark counts, FPS, etc.)
 */
const VisionDebug: React.FC<VisionDebugProps> = ({
  tasks,
  width = 320,
  height = 240,
  style,
}) => {
  const frame = useVisionFrame({ throttle: 50 });

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.8)",
        color: "#00ff88",
        padding: "8px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        width,
        height,
        overflow: "auto",
        ...style,
      }}
    >
      <div>Frame: {frame ? "active" : "none"}</div>
      {frame && (
        <>
          <div>
            Size: {frame.frameSize.width}x{frame.frameSize.height}
          </div>
          {tasks.includes("hands") && <div>Hands: {frame.hands.length}</div>}
          {tasks.includes("faces") && <div>Faces: {frame.faces.length}</div>}
          {tasks.includes("poses") && <div>Poses: {frame.poses.length}</div>}
          {tasks.includes("objects") && (
            <div>Objects: {frame.objects.length}</div>
          )}
        </>
      )}
    </div>
  );
};

export default VisionDebug;
