import { Box, Hand, PersonStanding, ScanFace, Scissors } from "lucide-react";

import type {
  VisionFrame,
  VisionProgress,
  VisionSessionOptions,
} from "@omnidotdev/rdk/vision";
import type { LucideIcon } from "lucide-react";

export type Mode = "hands" | "faces" | "poses" | "objects" | "segment";

/** Which camera a mode uses: the selfie camera or the rear one */
export type Facing = "user" | "environment";

const constraintsFor = (facing: Facing): MediaTrackConstraints => ({
  facingMode: facing,
  width: { ideal: 1280 },
  height: { ideal: 720 },
  // ask for 60: in dim light phones stretch exposure and halve a 30 fps
  // request to 15, while a 60 fps request keeps the preview near 24 or more
  frameRate: { ideal: 60 },
});

// one object per facing: the camera restarts whenever its constraints object
// changes, so a fresh object on every render would restart it constantly
const CONSTRAINTS: Record<Facing, MediaTrackConstraints> = {
  user: constraintsFor("user"),
  environment: constraintsFor("environment"),
};

/** Camera settings for a facing, the same for every mode */
export const cameraConstraints = (facing: Facing) => CONSTRAINTS[facing];

/**
 * MediaPipe runs on the main thread, so cap it near 30 runs a second: a 60 fps
 * camera in good light would otherwise leave no time to draw the page
 */
export const MEDIAPIPE_OPTIONS: VisionSessionOptions = { throttle: 30 };

/** Props every demo mode takes from the app shell */
export type ModeProps = {
  /** Draw per-landmark markers and other debug visuals */
  debug: boolean;
  /** Run ONNX models on WebGPU instead of the CPU */
  webgpu: boolean;
  /** Camera to use; the selfie camera's preview is mirrored */
  facing: Facing;
  onProgress: (progress: VisionProgress | null) => void;
  onError: (error: Error) => void;
  onGesture: (gesture: string, confidence: number) => void;
};

type ModeInfo = {
  label: string;
  icon: LucideIcon;
  /** Camera the mode starts on */
  facing: Facing;
  /** What to do to see the mode work */
  hint: string;
  /** What the mode finds, singular and plural, for the status badge */
  noun: [one: string, many: string];
  /** How many targets a frame holds for this mode */
  count: (frame: VisionFrame) => number;
};

export const MODES: Record<Mode, ModeInfo> = {
  hands: {
    facing: "user",
    label: "Hands",
    icon: Hand,
    hint: "Raise a hand, then try a fist, a peace sign, or a thumbs up",
    noun: ["hand", "hands"],
    count: (frame) => frame.hands.length,
  },
  faces: {
    facing: "user",
    label: "Faces",
    icon: ScanFace,
    hint: "Look at the camera and move around",
    noun: ["face", "faces"],
    count: (frame) => frame.faces.length,
  },
  poses: {
    facing: "user",
    label: "Poses",
    icon: PersonStanding,
    hint: "Step back until your whole body is in view",
    noun: ["body", "bodies"],
    count: (frame) => frame.poses.length,
  },
  objects: {
    facing: "environment",
    label: "Objects",
    icon: Box,
    hint: "Point the rear camera at people, pets, and things around you",
    noun: ["object", "objects"],
    count: (frame) => frame.objects.length,
  },
  segment: {
    facing: "environment",
    label: "Segment",
    icon: Scissors,
    hint: "Point the rear camera at a person or a pet",
    noun: ["outline", "outlines"],
    count: (frame) => frame.masks?.length ?? 0,
  },
};

export const MODE_ORDER = Object.keys(MODES) as Mode[];
