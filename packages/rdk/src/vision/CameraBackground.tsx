import { useEffect, useRef, useState } from "react";

import type React from "react";

export type CameraBackgroundProps = {
  constraints?: MediaStreamConstraints["video"];
  onReady?: (video: HTMLVideoElement) => void;
  onError?: (error: Error) => void;
};

/**
 * Camera background component.
 * Handle camera stream setup and display as a fullscreen video element.
 */
const CameraBackground: React.FC<CameraBackgroundProps> = ({
  constraints,
  onReady,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Stable refs for callbacks to avoid restarting camera on every render
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints || {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        if (cancelled || !videoRef.current) {
          // Clean up stream if component unmounted during async work
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error("Video ref lost"));
            return;
          }

          const handleCanPlay = () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("error", handleError);
            resolve();
          };

          const handleError = () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("error", handleError);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("canplay", handleCanPlay, { once: true });
          video.addEventListener("error", handleError, { once: true });
        });

        if (cancelled) return;

        await videoRef.current.play();
        setIsReady(true);
        onReadyRef.current?.(videoRef.current);
      } catch (error) {
        if (cancelled) return;
        const err =
          error instanceof Error ? error : new Error("Failed to access camera");
        console.error("Camera error:", err);
        onErrorRef.current?.(err);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [constraints]);

  return (
    <video
      ref={videoRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: -1,
        opacity: isReady ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
      autoPlay
      playsInline
      muted
    />
  );
};

export default CameraBackground;
