import {
  HandTracker,
  VisionAnchor,
  VisionOverlay,
} from "@omnidotdev/rdk/vision";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef } from "react";
import * as THREE from "three";

import { cameraConstraints, MEDIAPIPE_OPTIONS } from "@/lib/modes";

import type { VisionTask } from "@omnidotdev/rdk/vision";
import type { ModeProps } from "@/lib/modes";

const TASKS: VisionTask[] = ["hands"];

/**
 * Hand tracking: a sphere follows the hand, and recognized gestures are
 * reported to the app shell
 */
const HandMode = ({
  debug,
  facing,
  onProgress,
  onError,
  onGesture,
}: ModeProps) => (
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
    <HandCursor onGesture={onGesture} mirror={facing === "user"} />
    {debug && <VisionAnchor task="hands" debug mirror={facing === "user"} />}
  </VisionOverlay>
);

const HandCursor = ({
  onGesture,
  mirror,
}: Pick<ModeProps, "onGesture"> & { mirror: boolean }) => {
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
    <HandTracker
      onHandMove={handleHandMove}
      onGesture={onGesture}
      mirror={mirror}
    >
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
