import { useFrame } from "@react-three/fiber";
import { type ComponentProps, useMemo, useRef } from "react";
import {
	BufferGeometry,
	Float32BufferAttribute,
	type Mesh,
	Vector3,
} from "three";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			SupertorusGeometry: React.ComponentProps<"bufferGeometry">;
		}
	}
}

/**
 * Build the custom supertorus geometry once per prop combo.
 */
const buildSupertorusGeometry = ({
	R = 4,
	n = 2,
	t = 0,
	uSegments = 128,
	vSegments = 64,
}: {
	R?: number;
	n?: number;
	t?: number;
	uSegments?: number;
	vSegments?: number;
}) => {
	const geometry = new BufferGeometry();

	const vertCount = (uSegments + 1) * (vSegments + 1);

	const positions = new Float32BufferAttribute(vertCount * 3, 3);
	const normals = new Float32BufferAttribute(vertCount * 3, 3);
	const uvs = new Float32BufferAttribute(vertCount * 2, 2);

	// temp vectors for normal calc
	const p = new Vector3();
	const pu = new Vector3();
	const pv = new Vector3();
	const nrm = new Vector3();

	// helper: param surface position at (iu, iv)
	const surface = (iu: number, iv: number, target: Vector3) => {
		// map grid indices -> angles
		// [0,2π]
		const u = (iu / uSegments) * Math.PI * 2;
		// [0,2π]
		const v = (iv / vSegments) * Math.PI * 2;

		// superellipse radius in the tube cross-section
		// r = (cos(v)^n + sin(v)^n)^(-1/n)
		const cosV = Math.cos(v);
		const sinV = Math.sin(v);
		const r =
			(Math.abs(cosV) ** n + Math.abs(sinV) ** n) ** (-1 / n) *
			// handle negative quadrants correctly:
			// classic superellipse uses |cos|^n and |sin|^n, but preserves sign in x/y later
			1;

		// twist
		const vt = v + t * u;
		const cosVT = Math.cos(vt);
		const sinVT = Math.sin(vt);

		const x = (R + r * cosVT) * Math.cos(u);
		const y = (R + r * cosVT) * Math.sin(u);
		const z = r * sinVT;

		target.set(x, y, z);
	};

	// fill position + uv
	let ptrP = 0;
	let ptrUV = 0;
	for (let iu = 0; iu <= uSegments; iu++) {
		for (let iv = 0; iv <= vSegments; iv++) {
			surface(iu, iv, p);

			positions.setXYZ(ptrP, p.x, p.y, p.z);
			uvs.setXY(ptrUV, iu / uSegments, iv / vSegments);

			ptrP++;
			ptrUV++;
		}
	}

	// generate indices (two triangles per quad)
	const indices: number[] = [];
	for (let iu = 0; iu < uSegments; iu++) {
		for (let iv = 0; iv < vSegments; iv++) {
			const a = iu * (vSegments + 1) + iv;
			const b = (iu + 1) * (vSegments + 1) + iv;
			const c = (iu + 1) * (vSegments + 1) + (iv + 1);
			const d = iu * (vSegments + 1) + (iv + 1);

			// quad -> two tris: a,b,d and b,c,d
			indices.push(a, b, d, b, c, d);
		}
	}
	geometry.setIndex(indices);

	// compute normals via param partial derivatives (finite diff)
	// for each vertex, sample a tiny step in u and v,
	// pu = dP/du, pv = dP/dv, normal = pu x pv
	ptrP = 0;
	for (let iu = 0; iu <= uSegments; iu++) {
		for (let iv = 0; iv <= vSegments; iv++) {
			// wrap around for edges so normals are continuous
			const iuNext = (iu + 1) % (uSegments + 1);
			const ivNext = (iv + 1) % (vSegments + 1);

			surface(iu, iv, p);
			surface(iuNext, iv, pu);
			surface(iu, ivNext, pv);

			// pu = pu - p
			pu.sub(p);
			// pv = pv - p
			pv.sub(p);

			// normal = pu x pv
			nrm.copy(pu).cross(pv).normalize();

			normals.setXYZ(ptrP, nrm.x, nrm.y, nrm.z);

			ptrP++;
		}
	}

	geometry.setAttribute("position", positions);
	geometry.setAttribute("normal", normals);
	geometry.setAttribute("uv", uvs);

	return geometry;
};

/**
 * Supertorus geometry.
 */
const Supertorus = ({
	R = 4,
	n = 2,
	t = 0,
	uSegments = 128,
	vSegments = 64,
	speed = 0.4,
	...meshProps
}: {
	R?: number;
	n?: number;
	t?: number;
	uSegments?: number;
	vSegments?: number;
	speed?: number;
} & ComponentProps<"mesh">) => {
	const ref = useRef<Mesh>(null);

	// memoize geometry so it only rebuilds when params change
	const geom = useMemo(
		() => buildSupertorusGeometry({ R, n, t, uSegments, vSegments }),
		[R, n, t, uSegments, vSegments],
	);

	useFrame((_, delta) => {
		if (!ref.current) return;
		// spin around Y and a little X for flavor
		ref.current.rotation.y += speed * delta;
		ref.current.rotation.x += speed * 0.25 * delta;
	});

	return (
		<mesh geometry={geom} {...meshProps}>
			<meshStandardMaterial metalness={0.2} roughness={0.4} color="#00a3a2" />
		</mesh>
	);
};

export default Supertorus;
