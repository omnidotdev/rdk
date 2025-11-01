import { useFrame, createPortal, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Group } from "three";

import { useXR } from "engine/XRSessionProvider";

import type { PropsWithChildren } from "react";

export interface GeolocationAnchorProps extends PropsWithChildren {
	/** Physical target latitude (where you want the AR object placed in the real world). */
	latitude: number;
	/** Physical target longitude (where you want the AR object placed in the real world). */
	longitude: number;
	/**
	 * Physical altitude.
	 * @default 0
	 */
	altitude?: number;
	/**
	 * Whether to face the camera every frame (for labels/sprites).
	 * @default true
	 */
	isBillboard?: boolean;
	/** Called once actually attached to LocAR (after first `gpsupdate`). */
	onAttached?: () => void;
	/** Forward raw GPS updates. */
	onGpsUpdate?: (pos: any) => void;
}

/**
 * Geolocation anchor.
 */
const GeolocationAnchor = ({
	latitude,
	longitude,
	altitude = 0,
	isBillboard = true,
	onAttached,
	onGpsUpdate,
	children,
}: GeolocationAnchorProps) => {
	const { backend } = useXR();

	const { camera } = useThree();

	const [anchor] = useState(() => new Group());

	const hasAttachedRef = useRef(false);

	useEffect(() => {
		if (!backend) return;

		const internal = backend.getInternal?.() as any;

		const locar = internal?.locar;

		if (!locar) return;

		const handleGps = (ev: any) => {
			const pos = ev.position ?? ev;
			onGpsUpdate?.(pos);

			// attach anchor once after receiving a GPS update at target coords (what you passed in props)
			if (!hasAttachedRef.current) {
				locar.add(anchor, longitude, latitude, altitude);
				hasAttachedRef.current = true;
				onAttached?.();
			}
		};

		locar.on?.("gpsupdate", handleGps);

		return () => {
			locar.off?.("gpsupdate", handleGps);

			// cleanup
			if (typeof locar.remove === "function") {
				locar.remove(anchor);
			} else if (hasAttachedRef.current) {
				// fallback: try to remove from scene directly
				anchor.removeFromParent();
			}
		};
	}, [backend, anchor, longitude, latitude, altitude, onAttached, onGpsUpdate]);

	// billboard after LocAR owns the object
	useFrame(() => {
		if (!isBillboard) return;

		if (!camera) return;

		// don't `lookAt` before object is placed
		if (!hasAttachedRef.current) return;

		anchor.lookAt(camera.position);
	});

	// render content into the LocAR-owned anchor
	return createPortal(<group>{children}</group>, anchor);
};

export default GeolocationAnchor;
