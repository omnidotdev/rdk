import { VisionAnchor, VisionOverlay } from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { cameraConstraints, MEDIAPIPE_OPTIONS } from "@/lib/modes";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { Mesh } from "three";
import type { ModeProps } from "@/lib/modes";

const TASKS: VisionTask[] = ["faces"];

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

const FaceMode = ({ debug, facing, onProgress, onError }: ModeProps) => (
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
    <VisionAnchor task="faces" debug={debug} mirror={facing === "user"}>
      <RotatingRing />
    </VisionAnchor>
  </VisionOverlay>
);

export default FaceMode;
