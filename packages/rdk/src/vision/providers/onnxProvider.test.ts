import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ONNXProvider from "./onnxProvider";

import type { ONNXWorkerResponse } from "../worker/types";

/**
 * Minimal stand-in for the ONNX worker that answers `init` and lets tests push
 * responses.
 */
class FakeWorker {
  static last: FakeWorker | null = null;

  private listeners: Array<(event: MessageEvent) => void> = [];

  constructor() {
    FakeWorker.last = this;
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }

  removeEventListener() {}

  postMessage(message: { type: string }) {
    if (message.type === "init") {
      queueMicrotask(() => this.emit({ type: "initialized" }));
    }
  }

  terminate() {}

  emit(data: ONNXWorkerResponse) {
    for (const listener of this.listeners) {
      listener({ data } as MessageEvent);
    }
  }
}

const video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;

beforeEach(() => {
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
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
