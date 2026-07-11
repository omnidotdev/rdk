import { VisionAnchor, VisionOverlay } from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";

import ErrorBanner from "./ErrorBanner";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { Mesh } from "three";

type FaceModeProps = {
  tasks: VisionTask[];
};

const RotatingRing = () => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.3, 0.08, 16, 32]} />
      <meshStandardMaterial
        color="#ff6b6b"
        emissive="#ff2222"
        emissiveIntensity={0.2}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

const FaceMode = ({ tasks }: FaceModeProps) => {
  const [error, setError] = useState("");

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  return (
    <>
      <VisionOverlay tasks={tasks} showDebug onError={handleError}>
        <VisionAnchor task="faces" debug>
          <RotatingRing />
        </VisionAnchor>
      </VisionOverlay>

      {error && <ErrorBanner message={error} />}
    </>
  );
};

export default FaceMode;
