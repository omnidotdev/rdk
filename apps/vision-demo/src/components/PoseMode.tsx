import { VisionAnchor, VisionOverlay } from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";

import ErrorBanner from "./ErrorBanner";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { Mesh } from "three";

type PoseModeProps = {
  tasks: VisionTask[];
};

const PulsatingOctahedron = () => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.7;
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.25]} />
      <meshStandardMaterial
        color="#45b7d1"
        emissive="#1e90ff"
        emissiveIntensity={0.2}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
};

const PoseMode = ({ tasks }: PoseModeProps) => {
  const [error, setError] = useState("");

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  return (
    <>
      <VisionOverlay tasks={tasks} showDebug onError={handleError}>
        <VisionAnchor task="poses" debug>
          <PulsatingOctahedron />
        </VisionAnchor>
      </VisionOverlay>

      {error && <ErrorBanner message={error} />}
    </>
  );
};

export default PoseMode;
