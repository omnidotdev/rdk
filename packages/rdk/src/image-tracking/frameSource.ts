/**
 * A pluggable source of camera frames for image tracking.
 *
 * The default implementation streams the device camera via `getUserMedia`, but
 * the interface is deliberately minimal so the frame source can later be
 * swapped for WebXR Raw Camera Access or a custom pipeline without touching the
 * backend.
 */
export interface FrameSource {
  /** The underlying video element once started, otherwise `null`. */
  readonly video: HTMLVideoElement | null;
  /** Acquire the stream and resolve once the video has known dimensions. */
  start(): Promise<HTMLVideoElement>;
  /** Release the stream and remove any DOM the source created. */
  stop(): void;
}

/**
 * Options for the default webcam frame source.
 */
export interface WebcamFrameSourceOptions {
  /** Preferred camera. Defaults to the rear ("environment") camera. */
  facingMode?: "environment" | "user";
  /** Ideal capture width. */
  width?: number;
  /** Ideal capture height. */
  height?: number;
}

/**
 * Create the default frame source, streaming the device camera through a
 * fullscreen video element positioned behind the R3F canvas.
 */
export const createWebcamFrameSource = (
  options: WebcamFrameSourceOptions = {},
): FrameSource => {
  const { facingMode = "environment", width = 1280, height = 720 } = options;

  let video: HTMLVideoElement | null = null;
  let stream: MediaStream | null = null;

  return {
    get video() {
      return video;
    },

    async start() {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
      });

      const el = document.createElement("video");
      el.setAttribute("playsinline", "");
      el.muted = true;
      el.srcObject = stream;

      // fullscreen background behind the R3F canvas
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100vw";
      el.style.height = "100vh";
      el.style.objectFit = "cover";
      el.style.zIndex = "-1";
      el.style.pointerEvents = "none";

      document.body.appendChild(el);

      await el.play();

      // wait for real dimensions so the controller can size itself
      if (!el.videoWidth) {
        await new Promise<void>((resolve) => {
          el.addEventListener("loadedmetadata", () => resolve(), {
            once: true,
          });
        });
      }

      video = el;

      return el;
    },

    stop() {
      for (const track of stream?.getTracks() ?? []) track.stop();
      stream = null;

      if (video?.parentNode) video.parentNode.removeChild(video);

      video = null;
    },
  };
};
