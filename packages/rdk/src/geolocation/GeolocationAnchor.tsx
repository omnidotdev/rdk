import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Group } from "three";

import useGeolocationBackend from "./useGeolocationBackend";

import type { PropsWithChildren } from "react";
import type { GeolocationSessionOptions } from "./geolocationBackend";

export interface GeolocationAnchorProps
  extends Pick<GeolocationSessionOptions, "onGpsUpdate">,
    PropsWithChildren {
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
  onAttach?: () => void;
}

/**
 * Geolocation anchor.
 */
const GeolocationAnchor = ({
  latitude,
  longitude,
  altitude = 0,
  isBillboard = true,
  onAttach: _onAttach,
  onGpsUpdate: _onGpsUpdate,
  children,
}: GeolocationAnchorProps) => {
  const geo = useGeolocationBackend();
  const { camera } = useThree();

  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);

  const onAttach = useCallback(() => {
    _onAttach?.();
  }, [_onAttach]);

  const onGpsUpdate = useCallback(
    (pos: GeolocationPosition, distMoved: number) => {
      _onGpsUpdate?.(pos, distMoved);
    },
    [_onGpsUpdate],
  );

  useEffect(() => {
    if (!geo.isSuccess) return;

    // register anchor with the backend
    geo.registerAnchor(anchorId, {
      anchor,
      isAttached: false,
      latitude,
      longitude,
      altitude,
      onAttach,
      onGpsUpdate,
    });

    return () => {
      geo.unregisterAnchor(anchorId);
    };
  }, [
    geo.isSuccess,
    geo.registerAnchor,
    geo.unregisterAnchor,
    anchor,
    anchorId,
    latitude,
    longitude,
    altitude,
    onAttach,
    onGpsUpdate,
  ]);

  // billboard after LocAR owns the object
  useFrame(() => {
    if (!isBillboard || !camera || !geo.isSuccess) return;

    const entry = geo.getAnchor(anchorId);
    if (!entry?.isAttached) return;

    anchor.lookAt(camera.position);
  });

  // render content into the LocAR-owned anchor
  return createPortal(<group>{children}</group>, anchor);
};

export default GeolocationAnchor;
