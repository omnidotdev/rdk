import {
  ImageTrackingAnchor,
  ImageTrackingSession,
  useImageTrackingBackend,
  XR,
} from "@omnidotdev/rdk";
import { Canvas } from "@react-three/fiber";
import { Supertorus } from "components";
import { useEffect, useRef, useState } from "react";

/**
 * On-screen diagnostic HUD. Reports each stage of the tracking pipeline so the
 * failure point is visible on the device itself (no console needed).
 */
const StatusOverlay = ({ found }: { found: boolean }) => {
  const { isPending, isSuccess, dimensions, targetMatrices, stats } =
    useImageTrackingBackend();
  const [hasCameraApi] = useState(
    () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia,
  );
  const [video, setVideo] = useState("(none)");
  const [loop, setLoop] = useState("frames 0");

  // keep live references to the mutated-in-place internals for polling
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const matricesRef = useRef(targetMatrices);
  matricesRef.current = targetMatrices;

  useEffect(() => {
    let last = -1;

    const id = setInterval(() => {
      const el = document.querySelector("video");
      setVideo(
        el
          ? `${el.videoWidth}x${el.videoHeight} playing=${!el.paused}`
          : "(none)",
      );

      const frames = statsRef.current.frames;
      const matched = matricesRef.current.get(0) != null;
      const alive = frames !== last;
      last = frames;

      setLoop(
        `frames ${frames} ${
          frames === 0
            ? "(loop not running)"
            : alive
              ? matched
                ? "MATCHING ✓"
                : "running, searching"
              : "STALLED"
        }`,
      );
    }, 500);

    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: "rgba(0,0,0,0.65)",
        color: "#39ff14",
        font: "13px/1.5 monospace",
        padding: "10px 12px",
        pointerEvents: "none",
        whiteSpace: "pre",
      }}
    >
      {`camera API : ${hasCameraApi ? "yes" : "NO (insecure context?)"}
backend    : ${isSuccess ? "READY" : isPending ? "initializing…" : "?"}
video      : ${video}
targets    : ${dimensions.length}
loop       : ${loop}
target 0   : ${found ? "FOUND ✓" : "searching…"}`}
    </div>
  );
};

/**
 * Natural-feature image tracking demo application.
 *
 * Point the rear camera at the target image in `public/card.png` (shown on a
 * second screen or printed). The supertorus anchors to the tracked card.
 */
const App = () => {
  const [found, setFound] = useState(false);

  return (
    <>
      <StatusOverlay found={found} />

      <Canvas>
        {/* lighting */}
        <hemisphereLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <XR>
          <ImageTrackingSession options={{ imageTargetSrc: "/card.mind" }}>
            <ImageTrackingAnchor
              target={0}
              onTargetFound={() => setFound(true)}
              onTargetLost={() => setFound(false)}
            >
              <Supertorus
                R={4}
                n={10}
                t={1.5}
                position={[0, 0, 0.15]}
                scale={0.06}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </ImageTrackingAnchor>
          </ImageTrackingSession>
        </XR>
      </Canvas>
    </>
  );
};

export default App;
