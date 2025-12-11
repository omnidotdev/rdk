import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import type { Group } from "three";

interface GPSPinProps {
  /**
   * Whether the animation is enabled.
   * @default true
   */
  isAnimated?: boolean;
  /** Color. */
  color?: string;
  /** Scale. */
  scale?: number;
}

/**
 * Stylized location marker for geolocation AR.
 */
const GPSPin = ({
  isAnimated = true,
  color = "#ff4444",
  scale = 1,
}: GPSPinProps) => {
  const groupRef = useRef<Group>(null);

  // gentle floating animation
  useFrame((state) => {
    if (!isAnimated || !groupRef.current) return;

    const time = state.clock.getElapsedTime();

    groupRef.current.position.y = Math.sin(time * 2) * 0.2;

    groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* main pin body: teardrop shape */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* pin tip */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* inner highlight dot */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="white"
          emissive="white"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* pulsing ring animation */}
      {isAnimated && (
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

export default GPSPin;
