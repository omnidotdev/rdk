import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ONNXProvider from "./onnxProvider";

import type { ONNXWorkerResponse } from "../worker/types";

/**
 * Minimal stand-in for the ONNX worker that answers `init` and lets tests push
 * responses.
 */
class FakeWorker {
  static last: FakeWorker | null = null;
  static all: FakeWorker[] = [];

  private listeners: Array<(event: MessageEvent) => void> = [];
  posted: Array<{ type: string; [key: string]: unknown }> = [];
  isTerminated = false;

  constructor() {
    FakeWorker.last = this;
    FakeWorker.all.push(this);
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }

  removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  postMessage(message: { type: string; model?: { name: string } }) {
    this.posted.push(message);

    if (message.type === "init") {
      queueMicrotask(() => this.emit({ type: "initialized" }));
    }

    if (message.type === "loadModel" && message.model) {
      const modelName = message.model.name;
      queueMicrotask(() => this.emit({ type: "modelLoaded", modelName }));
    }
  }

  terminate() {
    this.isTerminated = true;
  }

  emit(data: ONNXWorkerResponse) {
    for (const listener of this.listeners) {
      listener({ data } as MessageEvent);
    }
  }
}

const video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;

let frameCallback: FrameRequestCallback | null = null;

/** Let queued microtasks and resolved promises settle */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  FakeWorker.all = [];
  frameCallback = null;
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ close: vi.fn() })),
  );
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    frameCallback = cb;
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ONNXProvider fatal errors", () => {
  it("stops and reports once when the worker reports a fatal error", async () => {
    const provider = new ONNXProvider({ provider: "onnx" });
    const onError = vi.fn();
    provider.onError?.(onError);
    await provider.initialize(video);

    FakeWorker.last?.emit({ type: "error", error: "blocked", fatal: true });
    FakeWorker.last?.emit({ type: "error", error: "blocked", fatal: true });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toMatch(/blocked/i);
  });

  it("keeps going after a recoverable worker error", async () => {
    const provider = new ONNXProvider({ provider: "onnx" });
    const onError = vi.fn();
    provider.onError?.(onError);
    await provider.initialize(video);

    FakeWorker.last?.emit({ type: "error", error: "transient" });

    expect(onError).not.toHaveBeenCalled();
  });
});

describe("ONNXProvider execution backend", () => {
  const model = { name: "yolo", path: "yolo.onnx" };

  it("runs on the CPU by default", async () => {
    const provider = new ONNXProvider({ onnx: { models: [model] } });
    await provider.initialize(video);

    expect(FakeWorker.last?.posted).toContainEqual({
      type: "loadModel",
      model,
      cpuOnly: true,
    });
  });

  it("allows WebGPU when `onnx.webgpu` is set", async () => {
    const provider = new ONNXProvider({
      onnx: { models: [model], webgpu: true },
    });
    await provider.initialize(video);

    expect(FakeWorker.last?.posted).toContainEqual({
      type: "loadModel",
      model,
      cpuOnly: false,
    });
  });
});

describe("ONNXProvider WebGPU stall fallback", () => {
  const model = { name: "yolo", path: "yolo.onnx" };

  /** Start detection, send one frame, then let it stall past the timeout */
  const stallFirstFrame = async (provider: ONNXProvider) => {
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    provider.startDetection();
    await flush();

    now.mockReturnValue(16_000);
    frameCallback?.(0);
    await flush();
    await flush();
  };

  it("restarts the worker on the CPU when a WebGPU frame stalls", async () => {
    const provider = new ONNXProvider({
      onnx: { models: [model], webgpu: true },
    });
    await provider.initialize(video);
    const [gpuWorker] = FakeWorker.all;

    await stallFirstFrame(provider);

    expect(FakeWorker.all).toHaveLength(2);
    expect(gpuWorker.isTerminated).toBe(true);
    expect(gpuWorker.posted).toContainEqual({
      type: "loadModel",
      model,
      cpuOnly: false,
    });
    expect(FakeWorker.all[1].posted).toContainEqual({
      type: "loadModel",
      model,
      cpuOnly: true,
    });
  });

  it("only resets a stalled frame once already on the CPU", async () => {
    const provider = new ONNXProvider({
      onnx: { models: [model], webgpu: true },
    });
    await provider.initialize(video);

    await stallFirstFrame(provider);
    await stallFirstFrame(provider);

    expect(FakeWorker.all).toHaveLength(2);
  });

  it("sends the next frame after the worker skips one", async () => {
    const provider = new ONNXProvider({ onnx: { models: [model] } });
    await provider.initialize(video);
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    provider.startDetection();
    await flush();

    FakeWorker.last?.emit({ type: "skipped" });
    now.mockReturnValue(10_500);
    frameCallback?.(0);
    await flush();

    const frames = FakeWorker.last?.posted.filter((m) => m.type === "process");
    expect(frames).toHaveLength(2);
  });
});

describe("ONNXProvider CPU stalls", () => {
  it("never restarts the worker when already on the CPU", async () => {
    const provider = new ONNXProvider({
      onnx: { models: [{ name: "yolo", path: "yolo.onnx" }] },
    });
    await provider.initialize(video);
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    provider.startDetection();
    await flush();

    now.mockReturnValue(16_000);
    frameCallback?.(0);
    await flush();

    expect(FakeWorker.all).toHaveLength(1);
  });
});
