// packages/rdk/src/marker/MarkerAnchor.tsx
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { Group } from "three";
import { ArMarkerControls } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { useXR } from "engine/XRSessionProvider";

// TODO JSDoc

export interface MarkerAnchorProps {
	patternUrl?: string;
	barcodeValue?: number;
	params?: Record<string, unknown>;
	onMarkerFound?: () => void;
	onMarkerLost?: () => void;
	children?: ReactNode;
}

/**
 * MarkerAnchor attaches its child group to a real-world marker.
 *
 * Must be used inside `<XRSessionProvider mode="marker" />` or `<XRCanvas mode="marker" />`.
 */
const MarkerAnchor = ({
	patternUrl,
	barcodeValue,
	params,
	onMarkerFound,
	onMarkerLost,
	children,
}: MarkerAnchorProps) => {
	const groupRef = useRef<Group>(null);
	const { backend } = useXR();
	const visibleRef = useRef(false);

	useEffect(() => {
		if (!backend) return;

		const internal = backend.getInternal?.() as any;
		const arContext = internal?.arContext;
		const group = groupRef.current;
		if (!arContext || !group) return;

		const controls = new ArMarkerControls(arContext, group, {
			type: patternUrl ? "pattern" : barcodeValue ? "barcode" : "unknown",
			patternUrl,
			barcodeValue,
			...params,
		});

		return () => {
			/**
			 * @note AR.js's `ArMarkerControls` has no official TypeScript types and does not formally declare a `.dispose()` method. Some community builds or future versions may implement one, but it’s not guaranteed.
			 *
			 * Cast to `any` here as a safe check for a runtime `dispose()` function without TypeScript errors. This ensures that if AR.js ever provides an explicit cleanup method, it will still be called
			 */
			const anyControls = controls as any;

			if (typeof anyControls.dispose === "function") anyControls.dispose();
		};
	}, [backend, patternUrl, barcodeValue, params]);

	// watch visibility
	useFrame(() => {
		const group = groupRef.current;

		if (!group) return;

		const isVisible = group.visible;

		if (isVisible && !visibleRef.current) {
			visibleRef.current = true;
			onMarkerFound?.();
		} else if (!isVisible && visibleRef.current) {
			visibleRef.current = false;
			onMarkerLost?.();
		}
	});

	return <group ref={groupRef}>{children}</group>;
};

export default MarkerAnchor;
