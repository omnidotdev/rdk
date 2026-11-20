import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVisionProvider } from "./providers";
import createVisionBackend from "./visionBackend";

import type { BackendInitArgs } from "@/lib/types/engine";
import type { VisionFrame } from "./types";

// Shared mock provider state (hoisted above the vi.mock factory)
const mocks = vi.hoisted(() => {
  const state: {
    emit: ((frame: VisionFrame) => void) | null;
    fail: ((error: Error) => void) | null;
  } = {
    emit: null,
    fail: null,
  };
  const provider = {
    type: "mock",
    initialize: vi.fn(),
    startDetection: vi.fn(),
    stopDetection: vi.fn(),
    onDetection: vi.fn(),
    onError: vi.fn(),
    dispose: vi.fn(),
  };
  return { state, provider };
});

vi.mock("./providers", () => ({
  createVisionProvider: vi.fn(),
}));

const frame = (): VisionFrame => ({
  hands: [],
  faces: [],
  poses: [],
  objects: [],
  timestamp: 1,
  frameSize: { width: 640, height: 480 },
});

const initArgs = {} as unknown as BackendInitArgs;
const videoElement = {} as unknown as HTMLVideoElement;

beforeEach(() => {
  mocks.state.emit = null;
  mocks.state.fail = null;
  mocks.provider.onError.mockImplementation((cb: (error: Error) => void) => {
    mocks.state.fail = cb;
    return () => {
      mocks.state.fail = null;
    };
  });
  vi.mocked(createVisionProvider).mockReturnValue(mocks.provider);
  mocks.provider.initialize.mockImplementation(async () => {});
  mocks.provider.onDetection.mockImplementation(
    (cb: (frame: VisionFrame) => void) => {
      mocks.state.emit = cb;
      return () => {
        mocks.state.emit = null;
      };
    },
  );
});

describe("createVisionBackend", () => {
  it("forwards provider errors to the error callback", async () => {
    const onError = vi.fn();
    const backend = createVisionBackend({ videoElement }, onError);
    await backend.init(initArgs);

    const error = new Error("tracking stopped");
    mocks.state.fail?.(error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it("stops forwarding provider errors after dispose", async () => {
    const onError = vi.fn();
    const backend = createVisionBackend({ videoElement }, onError);
    await backend.init(initArgs);
    expect(mocks.state.fail).not.toBeNull();

    backend.dispose?.();

    expect(mocks.state.fail).toBeNull();
  });

  it("declares the vision backend type", () => {
    expect(createVisionBackend({}).type).toBe("vision");
  });

  it("exposes null internals before init", () => {
    const internal = createVisionBackend({}).getInternal();
    expect(internal.provider).toBeNull();
    expect(internal.videoElement).toBeNull();
    expect(typeof internal.onDetection).toBe("function");
  });

  it("initializes the provider with a supplied video element", async () => {
    const backend = createVisionBackend({ videoElement });
    await backend.init(initArgs);

    expect(mocks.provider.initialize).toHaveBeenCalledWith(videoElement);
    expect(mocks.provider.startDetection).toHaveBeenCalledOnce();
    expect(backend.getInternal().provider).toBe(mocks.provider);
  });

  it("fans out provider frames to subscribers", async () => {
    const backend = createVisionBackend({ videoElement });
    await backend.init(initArgs);

    const received: VisionFrame[] = [];
    backend.getInternal().onDetection((f) => received.push(f));

    const emitted = frame();
    mocks.state.emit?.(emitted);

    expect(received).toEqual([emitted]);
  });

  it("isolates a throwing subscriber from the others", async () => {
    const backend = createVisionBackend({ videoElement });
    await backend.init(initArgs);

    const good = vi.fn();
    backend.getInternal().onDetection(() => {
      throw new Error("boom");
    });
    backend.getInternal().onDetection(good);

    mocks.state.emit?.(frame());

    expect(good).toHaveBeenCalledOnce();
  });

  it("stops delivering after unsubscribe", async () => {
    const backend = createVisionBackend({ videoElement });
    await backend.init(initArgs);

    const cb = vi.fn();
    const unsubscribe = backend.getInternal().onDetection(cb);
    unsubscribe();

    mocks.state.emit?.(frame());

    expect(cb).not.toHaveBeenCalled();
  });

  it("disposes the provider and clears internals", async () => {
    const backend = createVisionBackend({ videoElement });
    await backend.init(initArgs);

    backend.dispose?.();

    expect(mocks.provider.dispose).toHaveBeenCalledOnce();
    expect(backend.getInternal().provider).toBeNull();
  });

  it("is safe to dispose before init", () => {
    expect(() => createVisionBackend({}).dispose?.()).not.toThrow();
  });
});
