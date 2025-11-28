import { ImmersiveSession, useXRStore, XR } from "@omnidotdev/rdk";
import { Box, Center, Sphere, Text, Torus } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

import type * as THREE from "three";

const BUTTON_STYLES = {
  padding: "12px 24px",
  fontSize: "16px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

const RotatingTorus = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Torus ref={meshRef} position={[-1.5, 1, -4]} args={[0.4, 0.2, 16, 32]}>
      <meshStandardMaterial
        color="#ff6b6b"
        roughness={0.2}
        metalness={0.8}
        emissive="#ff2222"
        emissiveIntensity={0.1}
      />
    </Torus>
  );
};

const FloatingSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime) * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.8;
    }
  });

  return (
    <Sphere ref={meshRef} position={[1.5, 1.5, -7]} args={[0.5, 32, 32]}>
      <meshStandardMaterial
        color="#4ecdc4"
        roughness={0.1}
        metalness={0.9}
        emissive="#2aa198"
        emissiveIntensity={0.15}
      />
    </Sphere>
  );
};

const PulsatingBox = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.7;
    }
  });

  return (
    <Box ref={meshRef} position={[0, 0.5, -4]} args={[0.6, 0.6, 0.6]}>
      <meshStandardMaterial
        color="#45b7d1"
        roughness={0.3}
        metalness={0.7}
        emissive="#1e90ff"
        emissiveIntensity={0.1}
      />
    </Box>
  );
};

const XRControls = () => {
  const { immersive } = useXRStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        width: "100%",
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        onClick={() => immersive?.enterAR()}
        style={{
          ...BUTTON_STYLES,
          backgroundColor: "#14b85eaa",
          border: "2px solid #14b85e",
        }}
      >
        Enter AR
      </button>

      <button
        type="button"
        onClick={() => immersive?.enterVR()}
        style={{
          ...BUTTON_STYLES,
          backgroundColor: "#b814b5aa",
          border: "2px solid #b814b5",
        }}
      >
        Enter VR
      </button>
    </div>
  );
};

const App = () => (
  <>
    <XRControls />

    <Canvas>
      <color attach="background" args={[0.1, 0.1, 0.2]} />

      {/* lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#ff6b6b" />
      <pointLight position={[5, -5, 5]} intensity={0.6} color="#4ecdc4" />

      <XR>
        <ImmersiveSession>
          <Center position={[0, 3, -5]}>
            <Text
              fontSize={0.4}
              maxWidth={200}
              lineHeight={1}
              letterSpacing={0.02}
              textAlign="center"
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              anchorX="center"
              anchorY="middle"
            >
              RDK WebXR Demo
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.4}
                metalness={0.6}
                emissive="#6633cc"
                emissiveIntensity={0.2}
              />
            </Text>
          </Center>

          {/* shapes */}
          <PulsatingBox />
          <RotatingTorus />
          <FloatingSphere />
        </ImmersiveSession>
      </XR>
    </Canvas>
  </>
);

export default App;
