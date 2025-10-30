import { ArMarkerControls } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { useFrame } from "@react-three/fiber";
import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
	type JSX,
} from "react";

import { useXRSessionProvider } from "./XRSessionProvider";

import type { Group } from "three";

type MarkerPattern = {
	type: "pattern";
	patternUrl: string;
	barcodeValue?: never;
};

type MarkerBarcode = {
	type: "barcode";
	barcodeValue: number;
	patternUrl?: never;
};

type MarkerUnknown = {
	type: "unknown";
	patternUrl?: never;
	barcodeValue?: never;
};

type BaseMarkerProps = {
	/** Additional parameters for the marker. */
	params?: Record<string, unknown>;
	/** Callback triggered when the marker is found. */
	onMarkerFound?: () => void;
	/** Callback triggered when the marker is lost. */
	onMarkerLost?: () => void;
};

/**
 * Full props for the `MarkerAnchor` component.
 * Marker type determines which fields are required.
 */
export type MarkerAnchorProps = PropsWithChildren<
	BaseMarkerProps & (MarkerPattern | MarkerBarcode | MarkerUnknown)
>;

/**
 * Marker for objects in augmented reality.
 */
const MarkerAnchor = ({
	children,
	type,
	barcodeValue,
	patternUrl,
	params,
	onMarkerFound,
	onMarkerLost,
}: MarkerAnchorProps): JSX.Element => {
	const markerRoot = useRef<Group>(null);

	const { arToolkitContext } = useXRSessionProvider();

	// track "found" internally so fire callbacks are only fired on edges
	const [isFound, setIsFound] = useState(false);
	const lastVisibleRef = useRef(false);

	const handleMarkerFound = useCallback(() => {
		setIsFound(true);
		onMarkerFound?.();
	}, [onMarkerFound]);

	const handleMarkerLost = useCallback(() => {
		setIsFound(false);
		onMarkerLost?.();
	}, [onMarkerLost]);

	useEffect(() => {
		if (!arToolkitContext || !markerRoot.current) return;

		const markerControls = new ArMarkerControls(
			arToolkitContext,
			markerRoot.current,
			{
				type,
				barcodeValue: type === "barcode" ? (barcodeValue ?? null) : null,
				patternUrl: type === "pattern" ? (patternUrl ?? null) : null,
				...params,
			},
		);

		return () => {
			const list = arToolkitContext._arMarkersControls;

			if (!Array.isArray(list)) return;

			const idx = list.indexOf(markerControls);

			if (idx !== -1) list.splice(idx, 1);
		};
	}, [arToolkitContext, type, barcodeValue, patternUrl, params]);

	useFrame(() => {
		const visibleNow = !!markerRoot.current?.visible;
		if (visibleNow === lastVisibleRef.current) return;

		lastVisibleRef.current = visibleNow;

		if (visibleNow && !isFound) {
			handleMarkerFound();
		} else if (!visibleNow && isFound) {
			handleMarkerLost();
		}
	});

	return <group ref={markerRoot}>{children}</group>;
};

export default MarkerAnchor;
