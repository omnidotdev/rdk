import { VisionAnchor, VisionOverlay } from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { cameraConstraints, MEDIAPIPE_OPTIONS } from "@/lib/modes";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { Mesh } from "three";
import type { ModeProps } from "@/lib/modes";

const TASKS: VisionTask[] = ["poses"];

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

const PoseMode = ({ debug, facing, onProgress, onError }: ModeProps) => (
  <VisionOverlay
    tasks={TASKS}
    options={MEDIAPIPE_OPTIONS}
    showStatus={false}
    cameraConstraints={cameraConstraints(facing)}
    mirrored={facing === "user"}
    onProgress={onProgress}
    onError={onError}
  >
    <ambientLight intensity={0.8} />
    <directionalLight position={[2, 3, 5]} intensity={1.5} />
    <VisionAnchor task="poses" debug={debug} mirror={facing === "user"}>
      <PulsatingOctahedron />
    </VisionAnchor>
  </VisionOverlay>
);

export default PoseMode;
