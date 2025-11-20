import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group } from "three";

import { useXR } from "engine/XRSessionProvider";

import type { LonLat } from "locar";
import type { PropsWithChildren } from "react";

interface Anchor {
  /** Anchor group. */
  anchor: Group;
  /** Whether the anchor is attached to the real world. */
  isAttached: boolean;
  /** Physical target latitude. */
  latitude: number;
  /** Physical target longitude. */
  longitude: number;
  /** Physical altitude. */
  altitude: number;
  /** Callback triggered when the anchor is attached to the real world. */
  onAttached?: () => void;
  /** Callback triggered when the anchor's GPS position is updated. */
  onGpsUpdate?: (pos: any) => void;
}

// global registry to track all anchors and prevent interference
const anchorRegistry = new Map<string, Anchor>();

let gpsInitialized = false;
let lastLocation: LonLat | null = null;

let globalGpsHandler: ((ev: any) => void) | null = null;

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
  const { backends } = useXR();
  const { camera } = useThree();

  const [anchor] = useState(() => new Group()),
    [anchorId] = useState(() => Math.random().toString(36).slice(2, 11));

  const hasAttachedRef = useRef(false);

  const stableOnAttached = useCallback(() => {
    onAttached?.();
  }, [onAttached]);

  const stableOnGpsUpdate = useCallback(
    (pos: any) => {
      onGpsUpdate?.(pos);
    },
    [onGpsUpdate],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeAnchor = async () => {
      try {
        const geolocationBackend = backends.find((backend) => {
          const internal = backend.getInternal?.() as any;

          return internal?.locar;
        });

        if (!geolocationBackend || cancelled) return;

        const internal = geolocationBackend.getInternal?.() as any;

        const locar = internal?.locar;

        if (!locar) return;

        /**
         * Add an anchor to the scene.
         * @param anchor Anchor to add
         */
        const addAnchor = (anchor: Anchor) => {
          try {
            locar.add(
              anchor.anchor,
              anchor.longitude,
              anchor.latitude,
              anchor.altitude,
            );

            anchor.isAttached = true;

            console.log(
              `🔗 Attached anchor at ${anchor.latitude}, ${anchor.longitude}, ${anchor.altitude}`,
            );

            anchor.onAttached?.();
          } catch (err) {
            console.error("❌ Failed to attach anchor:", err);
          }
        };

        const curAnchor = {
          anchor,
          isAttached: false,
          latitude,
          longitude,
          altitude: altitude || 0,
          onAttached: stableOnAttached,
          onGpsUpdate: stableOnGpsUpdate,
        };

        // register this anchor with its coordinates
        anchorRegistry.set(anchorId, curAnchor);

        // set up global GPS handler once
        if (!gpsInitialized) {
          globalGpsHandler = (ev: any) => {
            const pos = ev.position ?? ev;

            // process all registered anchors
            anchorRegistry.forEach((entry) => {
              if (!entry.isAttached) addAnchor(entry);

              // call GPS update callback for all anchors
              entry.onGpsUpdate?.(pos);
            });
          };

          lastLocation = locar.getLastKnownLocation();

          if (lastLocation !== null && !curAnchor.isAttached)
            // add anchor in case it's not already attached after receiving a GPS position
            addAnchor(curAnchor);

          locar.on?.("gpsupdate", globalGpsHandler);

          gpsInitialized = true;
        }

        if (lastLocation !== null) {
          // add anchor if not already attached
          if (!curAnchor.isAttached) addAnchor(curAnchor);

          curAnchor.onGpsUpdate?.({ position: lastLocation });
        }

        // mark this anchor as needing attachment tracking
        hasAttachedRef.current = false;
      } catch (err) {
        console.error("Failed to initialize geolocation backend:", err);
      }
    };

    initializeAnchor();

    return () => {
      cancelled = true;

      // clean up anchor
      const entry = anchorRegistry.get(anchorId);

      if (entry?.isAttached) {
        try {
          const geolocationBackend = backends.find((backend) => {
            const internal = backend.getInternal?.() as any;

            return internal?.locar;
          });

          const internal = geolocationBackend?.getInternal?.() as any;

          const locar = internal?.locar;

          if (typeof locar?.remove === "function") {
            locar.remove(anchor);
          } else {
            anchor.removeFromParent();
          }
        } catch (err) {
          console.error(`⚠️ Error removing anchor ${anchorId}:`, err);
        }
      }

      // remove anchor from registry
      anchorRegistry.delete(anchorId);

      // clean up global handler if no more anchors
      if (anchorRegistry.size === 0 && globalGpsHandler) {
        const geolocationBackend = backends.find((backend) => {
          const internal = backend.getInternal?.() as any;

          return internal?.locar;
        });

        const internal = geolocationBackend?.getInternal?.() as any;

        const locar = internal?.locar;

        locar?.off?.("gpsupdate", globalGpsHandler);

        globalGpsHandler = null;

        gpsInitialized = false;
      }
    };
  }, [
    backends,
    anchor,
    anchorId,
    latitude,
    longitude,
    altitude,
    stableOnAttached,
    stableOnGpsUpdate,
  ]);

  // billboard after LocAR owns the object
  useFrame(() => {
    if (!isBillboard) return;
    if (!camera) return;

    // check if anchor is attached in registry
    const entry = anchorRegistry.get(anchorId);
    if (!entry?.isAttached) return;

    anchor.lookAt(camera.position);
  });

  // render content into the LocAR-owned anchor
  return createPortal(<group>{children}</group>, anchor);
};

export default GeolocationAnchor;
