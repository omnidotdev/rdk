import { describe, expect, it } from "vitest";

import { COCO_LABELS, rfDetr, yolo, yoloSeg } from "./presets";

describe("presets", () => {
  it("yolo() wires the yolo decoder + COCO labels + path", () => {
    const config = yolo("/models/yolo11n.onnx");
    expect(config.decoder).toBe("yolo");
    expect(config.path).toBe("/models/yolo11n.onnx");
    expect(config.inputSize).toBe(640);
    expect(config.labels).toHaveLength(80);
    expect(config.labels?.[0]).toBe("person");
  });

  it("rfDetr() wires the rfdetr decoder", () => {
    const config = rfDetr("/models/rf-detr.onnx");
    expect(config.decoder).toBe("rfdetr");
    expect(config.name).toBe("rf-detr");
  });

  it("yoloSeg() wires the yoloseg decoder", () => {
    const config = yoloSeg("/models/yolo11n-seg.onnx");
    expect(config.decoder).toBe("yoloseg");
    expect(config.name).toBe("yolo-seg");
    expect(config.inputSize).toBe(640);
    expect(config.labels).toHaveLength(80);
  });

  it("allows overrides but pins path + decoder", () => {
    const config = yolo("/m.onnx", {
      name: "custom",
      inputSize: 320,
      labels: ["widget"],
    });
    expect(config.name).toBe("custom");
    expect(config.inputSize).toBe(320);
    expect(config.labels).toEqual(["widget"]);
    // path + decoder are not overridable
    expect(config.decoder).toBe("yolo");
    expect(config.path).toBe("/m.onnx");
  });

  it("exposes 80 COCO labels", () => {
    expect(COCO_LABELS).toHaveLength(80);
    expect(COCO_LABELS[COCO_LABELS.length - 1]).toBe("toothbrush");
  });
});
