import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MediaPipeProvider from "./mediapipeProvider";

vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: vi.fn() },
  HandLandmarker: { createFromOptions: vi.fn() },
  FaceLandmarker: { createFromOptions: vi.fn() },
  PoseLandmarker: { createFromOptions: vi.fn() },
}));

const video = {} as HTMLVideoElement;

beforeEach(() => {
  // mockReset clears implementations between tests, so re-establish them
  vi.mocked(FilesetResolver.forVisionTasks).mockResolvedValue(
    {} as Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  );
  const model = { close: vi.fn() };
  vi.mocked(HandLandmarker.createFromOptions).mockResolvedValue(
    model as unknown as HandLandmarker,
  );
  vi.mocked(FaceLandmarker.createFromOptions).mockResolvedValue(
    model as unknown as FaceLandmarker,
  );
  vi.mocked(PoseLandmarker.createFromOptions).mockResolvedValue(
    model as unknown as PoseLandmarker,
  );
});

describe("MediaPipeProvider task gating", () => {
  it("loads only the hand landmarker when tasks=['hands']", async () => {
    const provider = new MediaPipeProvider({ tasks: ["hands"], useGpu: false });
    await provider.initialize(video);

    expect(HandLandmarker.createFromOptions).toHaveBeenCalledOnce();
    expect(FaceLandmarker.createFromOptions).not.toHaveBeenCalled();
    expect(PoseLandmarker.createFromOptions).not.toHaveBeenCalled();
  });

  it("loads only the requested subset when tasks=['faces','poses']", async () => {
    const provider = new MediaPipeProvider({
      tasks: ["faces", "poses"],
      useGpu: false,
    });
    await provider.initialize(video);

    expect(HandLandmarker.createFromOptions).not.toHaveBeenCalled();
    expect(FaceLandmarker.createFromOptions).toHaveBeenCalledOnce();
    expect(PoseLandmarker.createFromOptions).toHaveBeenCalledOnce();
  });

  it("loads all three when tasks is unspecified", async () => {
    const provider = new MediaPipeProvider({ useGpu: false });
    await provider.initialize(video);

    expect(HandLandmarker.createFromOptions).toHaveBeenCalledOnce();
    expect(FaceLandmarker.createFromOptions).toHaveBeenCalledOnce();
    expect(PoseLandmarker.createFromOptions).toHaveBeenCalledOnce();
  });

  it("disables the pose segmentation mask by default", async () => {
    const provider = new MediaPipeProvider({ tasks: ["poses"], useGpu: false });
    await provider.initialize(video);

    const opts = vi.mocked(PoseLandmarker.createFromOptions).mock.calls[0][1];
    expect(opts.outputSegmentationMasks).toBe(false);
  });
});
