import { ArMarkerControls } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import useFiducialBackend from "./useFiducialBackend";

import type { PropsWithChildren } from "react";
import type { Group } from "three";

export interface FiducialAnchorProps extends PropsWithChildren {
  /** Pattern URL. */
  patternUrl?: string;
  /** Barcode value. */
  barcodeValue?: number;
  /** Additional parameters. */
  params?: Record<string, unknown>;
  /** Callback triggered when marker is found. */
  onMarkerFound?: () => void;
  /** Callback triggered when marker is lost. */
  onMarkerLost?: () => void;
}

/**
 * Fiducial anchor that attaches its child group to a real-world fiducial marker.
 */
const FiducialAnchor = ({
  patternUrl,
  barcodeValue,
  params,
  onMarkerFound,
  onMarkerLost,
  children,
}: FiducialAnchorProps) => {
  const groupRef = useRef<Group>(null);
  const fiducial = useFiducialBackend();
  const visibleRef = useRef(false);
  const initializedRef = useRef(false);
  // biome-ignore lint/suspicious/noExplicitAny: TODO (AR.js type patch)
  const arControlsRef = useRef<any>(null);

  useEffect(() => {
    if (!fiducial) return;

    let cancelled = false;

    const initializeAnchor = () => {
      try {
        const { arContext } = fiducial;
        const group = groupRef.current;

        if (!arContext || !group || cancelled) return;

        // hide by default; AR.js will set `visible=true` when marker is found
        group.visible = false;
        initializedRef.current = false;

        // AR.js sometimes doesn't have `arController` immediately
        if (!arContext.arController) {
          requestAnimationFrame(() => {
            if (
              !groupRef.current ||
              cancelled ||
              !fiducial.arContext?.arController
            )
              return;

            const controls = new ArMarkerControls(
              fiducial.arContext,
              groupRef.current,
              {
                type: patternUrl
                  ? "pattern"
                  : barcodeValue
                    ? "barcode"
                    : "unknown",
                patternUrl,
                barcodeValue,
                ...params,
              },
            );

            arControlsRef.current = controls;
            initializedRef.current = true;
          });

          return;
        }

        const controls = new ArMarkerControls(arContext, group, {
          type: patternUrl ? "pattern" : barcodeValue ? "barcode" : "unknown",
          patternUrl,
          barcodeValue,
          ...params,
        });

        arControlsRef.current = controls;
        initializedRef.current = true;
      } catch (err) {
        console.error("Failed to initialize fiducial anchor:", err);
      }
    };

    initializeAnchor();

    return () => {
      cancelled = true;
      // biome-ignore lint/suspicious/noExplicitAny: TODO (AR.js type patch)
      const anyControls = arControlsRef.current as any;
      /**
       * @note AR.js's `ArMarkerControls` has no official TypeScript types and does not formally declare a `.dispose()` method. Some community builds or future versions may implement one, but it's not guaranteed.
       *
       * Cast to `any` here as a safe check for a runtime `dispose()` function without TypeScript errors. This ensures that if AR.js ever provides an explicit cleanup method, it will still be called
       */
      if (typeof anyControls?.dispose === "function") anyControls.dispose();
      initializedRef.current = false;
    };
  }, [fiducial, patternUrl, barcodeValue, params]);

  // watch visibility
  useFrame(() => {
    const group = groupRef.current;

    // always keep group hidden until AR.js is initialized and controls it
    if (!group || !initializedRef.current) {
      if (group) group.visible = false;

      return;
    }

    const isVisible = group.visible;

    if (isVisible && !visibleRef.current) {
      visibleRef.current = true;
      onMarkerFound?.();
    } else if (!isVisible && visibleRef.current) {
      visibleRef.current = false;
      onMarkerLost?.();
    }
  });

  return (
    <group
      ref={groupRef}
      // start invisible by default
      visible={false}
    >
      {children}
    </group>
  );
};

export default FiducialAnchor;
