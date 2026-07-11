import {
  FaceMode,
  HandMode,
  ModeSelector,
  ObjectMode,
  PoseMode,
} from "components";
import { useState } from "react";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { Mode } from "components";

const MODE_TASKS: Record<"hands" | "faces" | "poses", VisionTask[]> = {
  hands: ["hands"],
  faces: ["faces"],
  poses: ["poses"],
};

const App = () => {
  const [mode, setMode] = useState<Mode>("hands");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {mode === "hands" && <HandMode tasks={MODE_TASKS.hands} />}
        {mode === "faces" && <FaceMode tasks={MODE_TASKS.faces} />}
        {mode === "poses" && <PoseMode tasks={MODE_TASKS.poses} />}
        {mode === "objects" && <ObjectMode />}
      </div>

      <ModeSelector mode={mode} onModeChange={setMode} />
    </div>
  );
};

export default App;
