import type { ONNXModelConfig } from "./types";

/**
 * COCO 80-class labels in canonical index order. Default label set for the
 * built-in detection presets.
 */
export const COCO_LABELS = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
] as const;

/** Overridable fields when constructing a preset model config */
export type PresetOverrides = Partial<
  Omit<ONNXModelConfig, "path" | "decoder">
>;

/**
 * Build a config for a YOLOv8/v11-style detector. Expects a single
 * `[1, 4 + numClasses, numAnchors]` output (decoded with NMS).
 *
 * @param path URL or same-origin path to the exported `.onnx` weights
 *   (e.g. from `yolo export format=onnx`). Weights are not bundled.
 */
export const yolo = (
  path: string,
  overrides: PresetOverrides = {},
): ONNXModelConfig => ({
  name: "yolo",
  inputSize: 640,
  labels: [...COCO_LABELS],
  ...overrides,
  path,
  decoder: "yolo",
});

/**
 * Build a config for an RF-DETR / DETR-style detector. Expects a `[1, Q, 4]`
 * boxes output and a `[1, Q, C]` logits output (NMS-free set prediction).
 *
 * @param path URL or same-origin path to the exported `.onnx` weights.
 *   Weights are not bundled.
 */
export const rfDetr = (
  path: string,
  overrides: PresetOverrides = {},
): ONNXModelConfig => ({
  name: "rf-detr",
  inputSize: 560,
  labels: [...COCO_LABELS],
  ...overrides,
  path,
  decoder: "rfdetr",
});
