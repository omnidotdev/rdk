import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CompassProps {
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
 * 3D compass for navigation in geolocation AR.
 */
const Compass = ({
	isAnimated = true,
	color = "#c0392b",
	scale = 1,
}: CompassProps) => {
	const groupRef = useRef<THREE.Group>(null),
		needleRef = useRef<THREE.Group>(null);

	// gentle floating and needle rotation animation
	useFrame((state) => {
		if (!groupRef.current) return;

		const time = state.clock.getElapsedTime();

		if (isAnimated) {
			// gentle bobbing motion
			groupRef.current.position.y = Math.sin(time * 1.5) * 0.1;

			// needle points to magnetic north (slowly rotating)
			if (needleRef.current) needleRef.current.rotation.y = time * 0.2;
		}
	});

	return (
		<group ref={groupRef} scale={scale}>
			{/* compass base/body */}
			<mesh position={[0, 0, 0]}>
				<cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
				<meshStandardMaterial color="#2c3e50" />
			</mesh>

			{/* compass rim */}
			<mesh position={[0, 0.06, 0]}>
				<torusGeometry args={[0.4, 0.05, 8, 32]} />
				<meshStandardMaterial color="#34495e" />
			</mesh>

			{/* compass face */}
			<mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.35, 32]} />
				<meshStandardMaterial color="#ecf0f1" />
			</mesh>

			{/* direction markings: N, S, E, W */}
			<group position={[0, 0.07, 0]}>
				{/* north marker */}
				<mesh position={[0, 0, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.03, 8]} />
					<meshStandardMaterial color={color} />
				</mesh>

				{/* south marker */}
				<mesh position={[0, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.03, 8]} />
					<meshStandardMaterial color="#34495e" />
				</mesh>

				{/* east marker */}
				<mesh position={[0.3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.02, 8]} />
					<meshStandardMaterial color="#7f8c8d" />
				</mesh>

				{/* west marker */}
				<mesh position={[-0.3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.02, 8]} />
					<meshStandardMaterial color="#7f8c8d" />
				</mesh>
			</group>

			{/* compass needle */}
			<group ref={needleRef} position={[0, 0.08, 0]}>
				{/* north-pointing part (red) */}
				<mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
					<coneGeometry args={[0.03, 0.3, 6]} />
					<meshStandardMaterial
						color={color}
						emissive={color}
						emissiveIntensity={0.2}
					/>
				</mesh>

				{/* south-pointing part (white/gray) */}
				<mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
					<coneGeometry args={[0.03, 0.3, 6]} />
					<meshStandardMaterial color="#bdc3c7" />
				</mesh>

				{/* center pivot */}
				<mesh position={[0, 0, 0]}>
					<sphereGeometry args={[0.04, 12, 12]} />
					<meshStandardMaterial color="#f39c12" />
				</mesh>
			</group>

			{/* glass cover effect */}
			<mesh position={[0, 0.1, 0]}>
				<cylinderGeometry args={[0.38, 0.38, 0.02, 32]} />
				<meshStandardMaterial
					transparent
					color="#ecf0f1"
					opacity={0.3}
					roughness={0.1}
					metalness={0.1}
				/>
			</mesh>
		</group>
	);
};

export default Compass;
