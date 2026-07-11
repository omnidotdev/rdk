import { BACKEND_TYPES } from "lib/types/engine";

import { createVisionProvider } from "./providers";

import type { Backend, BackendInitArgs } from "lib/types/engine";
import type {
  VisionFrame,
  VisionProvider,
  VisionSessionOptions,
} from "./types";

/** Internal state exposed by the vision backend */
export type VisionInternal = {
  provider: VisionProvider | null;
  videoElement: HTMLVideoElement | null;
  onDetection: (cb: (frame: VisionFrame) => void) => () => void;
};

/** State returned by the vision backend hook */
export type VisionBackendState = VisionInternal & {
  isPending: boolean;
  isSuccess: boolean;
};

/** Set up a camera video element for vision capture */
const setupVideoCapture = async (
  options: VisionSessionOptions,
): Promise<HTMLVideoElement> => {
  const video = document.createElement("video");
  video.style.display = "none";
  document.body.appendChild(video);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: options.provider === "onnx" ? "environment" : "user",
        frameRate: { ideal: 30, min: 15 },
      },
    });

    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = reject;
    });

    return video;
  } catch (error) {
    document.body.removeChild(video);
    throw error;
  }
};

/** Clean up a video element and its stream */
const cleanupVideo = (video: HTMLVideoElement | null): void => {
  if (!video) return;

  const stream = video.srcObject as MediaStream;
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  if (video.parentNode) {
    video.parentNode.removeChild(video);
  }
};

/** Create a vision backend following the Backend interface contract */
const createVisionBackend = (
  options: VisionSessionOptions,
): Backend<VisionInternal> => {
  let provider: VisionProvider | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let ownsVideo = false;
  let providerUnsubscribe: (() => void) | null = null;
  const callbacks: Array<(frame: VisionFrame) => void> = [];

  // Stable reference — hoisted out of getInternal so identity never changes
  const onDetection = (cb: (frame: VisionFrame) => void): (() => void) => {
    callbacks.push(cb);
    return () => {
      const idx = callbacks.indexOf(cb);
      if (idx > -1) callbacks.splice(idx, 1);
    };
  };

  return {
    type: BACKEND_TYPES.VISION,

    async init(_args: BackendInitArgs): Promise<void> {
      if (options.videoElement) {
        videoElement = options.videoElement;
        ownsVideo = false;
      } else {
        videoElement = await setupVideoCapture(options);
        ownsVideo = true;
      }

      provider = createVisionProvider(options);
      await provider.initialize(videoElement);
      providerUnsubscribe = provider.onDetection((frame) => {
        for (const cb of callbacks) {
          try {
            cb(frame);
          } catch (error) {
            console.error("Error in vision detection callback:", error);
          }
        }
      });
      provider.startDetection();
    },

    update(_dt?: number): void {
      // Off-thread processing; reserved for future frame sync
    },

    dispose(): void {
      providerUnsubscribe?.();
      providerUnsubscribe = null;
      provider?.dispose();
      if (ownsVideo) {
        cleanupVideo(videoElement);
      }
      videoElement = null;
      provider = null;
      callbacks.length = 0;
    },

    getInternal: (): VisionInternal => ({
      provider,
      videoElement,
      onDetection,
    }),
  };
};

export default createVisionBackend;
