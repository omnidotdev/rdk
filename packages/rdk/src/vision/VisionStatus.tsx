import useVisionFrame from "./useVisionFrame";

import type React from "react";
import type { VisionTask } from "./types";
import type { VisionProgress } from "./worker/types";

export type VisionStatusProps = {
  tasks: VisionTask[];
  progress?: VisionProgress | null;
  showDebug: boolean;
  onToggleDebug: () => void;
};

/**
 * Vision status overlay showing detection state for each task
 */
const VisionStatus: React.FC<VisionStatusProps> = ({
  tasks,
  progress,
  showDebug,
  onToggleDebug,
}) => {
  // Status doesn't need high-frequency updates
  const frame = useVisionFrame({ throttle: 100 });

  const getTaskActive = (task: VisionTask): boolean => {
    if (!frame) return false;
    switch (task) {
      case "hands":
        return frame.hands.length > 0;
      case "faces":
        return frame.faces.length > 0;
      case "poses":
        return frame.poses.length > 0;
      case "objects":
        return frame.objects.length > 0;
      default:
        return false;
    }
  };

  const hasDetections = tasks.some(getTaskActive);
  const isReady = frame !== null;

  const getStatusLabel = () => {
    if (hasDetections) return "Active";
    if (isReady) return "Ready";
    if (progress)
      return `Loading models (${progress.step}/${progress.total}) ${progress.label}...`;
    return "Starting...";
  };

  return (
    <>
      {/* Status indicator */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.9rem",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isReady ? "#00ff88" : "#ffaa00",
            }}
          />
          <span>{getStatusLabel()}</span>
        </div>

        {tasks.map((task) => (
          <div
            key={task}
            style={{
              fontSize: "0.8rem",
              opacity: 0.8,
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>{task}</span>
            <span>
              {getTaskActive(task) ? "active" : isReady ? "idle" : "..."}
            </span>
          </div>
        ))}
      </div>

      {/* Debug toggle */}
      <button
        onClick={onToggleDebug}
        type="button"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          border: "1px solid #333",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.8rem",
          zIndex: 1000,
        }}
      >
        {showDebug ? "Hide" : "Show"} Debug
      </button>
    </>
  );
};

export default VisionStatus;
