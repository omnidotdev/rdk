import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LandmarkProps {
	/**
	 * Whether the compass is animated.
	 * @default false
	 */
	isAnimated?: boolean;
	/** Type. */
	type?: "tower" | "building" | "monument";
	/** Color. */
	color?: string;
	/** Scale. */
	scale?: number;
}

/**
 * Representation of various landmark types for geolocation AR.
 */
const Landmark = ({
	isAnimated = false,
	type = "tower",
	color = "#4a90e2",
	scale = 1,
}: LandmarkProps) => {
	const groupRef = useRef<THREE.Group>(null);

	// subtle rotation animation
	useFrame((state) => {
		if (!isAnimated || !groupRef.current) return;

		const time = state.clock.getElapsedTime();

		groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
	});

	const renderTower = () => (
		<group>
			{/* base */}
			<mesh position={[0, 0, 0]}>
				<cylinderGeometry args={[0.4, 0.4, 0.3, 8]} />
				<meshStandardMaterial color={color} />
			</mesh>

			{/* body */}
			<mesh position={[0, 1, 0]}>
				<cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
				<meshStandardMaterial color={color} />
			</mesh>

			{/* top antenna */}
			<mesh position={[0, 2.2, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
				<meshStandardMaterial color="#888" />
			</mesh>

			{/* blinking light */}
			<mesh position={[0, 2.7, 0]}>
				<sphereGeometry args={[0.08, 8, 8]} />
				<meshStandardMaterial
					color="red"
					emissive="red"
					emissiveIntensity={isAnimated ? 0.8 : 0.3}
				/>
			</mesh>
		</group>
	);

	const renderBuilding = () => (
		<group>
			{/* main building */}
			<mesh position={[0, 0.8, 0]}>
				<boxGeometry args={[0.8, 1.6, 0.6]} />
				<meshStandardMaterial color={color} />
			</mesh>

			{/* windows */}
			{[...Array(3)].map((_, i) => (
				<mesh key={i} position={[-0.25, 0.3 + i * 0.4, 0.31]}>
					<planeGeometry args={[0.15, 0.15]} />
					<meshStandardMaterial color="#87ceeb" />
				</mesh>
			))}

			{[...Array(3)].map((_, i) => (
				<mesh key={i + 3} position={[0.25, 0.3 + i * 0.4, 0.31]}>
					<planeGeometry args={[0.15, 0.15]} />
					<meshStandardMaterial color="#87ceeb" />
				</mesh>
			))}

			{/* roof */}
			<mesh position={[0, 1.8, 0]} rotation={[0, Math.PI / 4, 0]}>
				<coneGeometry args={[0.6, 0.4, 4]} />
				<meshStandardMaterial color="#8b4513" />
			</mesh>
		</group>
	);

	const renderMonument = () => (
		<group>
			{/* base */}
			<mesh position={[0, 0.2, 0]}>
				<cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
				<meshStandardMaterial color="#d3d3d3" />
			</mesh>

			{/* column */}
			<mesh position={[0, 1.2, 0]}>
				<cylinderGeometry args={[0.25, 0.25, 2, 12]} />
				<meshStandardMaterial color={color} />
			</mesh>

			{/* capital */}
			<mesh position={[0, 2.4, 0]}>
				<cylinderGeometry args={[0.35, 0.25, 0.3, 12]} />
				<meshStandardMaterial color="#d3d3d3" />
			</mesh>

			{/* top ornament */}
			<mesh position={[0, 2.8, 0]}>
				<sphereGeometry args={[0.15, 12, 12]} />
				<meshStandardMaterial color="#ffd700" />
			</mesh>
		</group>
	);

	const renderLandmark = () => {
		switch (type) {
			case "tower":
				return renderTower();
			case "building":
				return renderBuilding();
			case "monument":
				return renderMonument();
			default:
				return renderTower();
		}
	};

	return (
		<group ref={groupRef} scale={scale}>
			{renderLandmark()}
		</group>
	);
};

export default Landmark;
