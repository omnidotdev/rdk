import { HandTracker, VisionOverlay } from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";

import ErrorBanner from "./ErrorBanner";
import GestureHUD from "./GestureHUD";

import type { VisionTask } from "@omnidotdev/rdk/vision";

type HandModeProps = {
  tasks: VisionTask[];
};

const HandMode = ({ tasks }: HandModeProps) => {
  const [gesture, setGesture] = useState({ name: "", confidence: 0 });
  const [error, setError] = useState("");

  const handleGesture = useCallback((name: string, confidence: number) => {
    setGesture({ name, confidence });
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  return (
    <>
      <VisionOverlay tasks={tasks} showDebug onError={handleError}>
        <HandCursorWithGesture onGesture={handleGesture} />
      </VisionOverlay>

      <GestureHUD gesture={gesture.name} confidence={gesture.confidence} />
      {error && <ErrorBanner message={error} />}
    </>
  );
};

// Separate component so HandTracker's onGesture can lift state to HandMode
const HandCursorWithGesture = ({
  onGesture,
}: {
  onGesture: (gesture: string, confidence: number) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3());

  const handleHandMove = useCallback((position: THREE.Vector3) => {
    targetPosition.current.copy(position);
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(
      targetPosition.current,
      Math.min(1, delta * 12),
    );
  });

  return (
    <HandTracker onHandMove={handleHandMove} onGesture={onGesture}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#4ecdc4"
          emissive="#2aa198"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </HandTracker>
  );
};

export default HandMode;
