import { ArMarkerControls } from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { useFrame } from "@react-three/fiber";
import { useXR } from "engine/XRSessionProvider";
import { type PropsWithChildren, useEffect, useRef } from "react";

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
 *
 * Must be used inside `<XRCanvas mode="fiducial" />`.
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
  const { backend } = useXR();
  const visibleRef = useRef(false);
  const initializedRef = useRef(false);
  const arControlsRef = useRef<any>(null);

  useEffect(() => {
    if (!backend) return;

    const internal = backend.getInternal?.() as any;
    const arContext = internal?.arContext;
    const group = groupRef.current;

    if (!arContext || !group) return;

    // normalize so users can pass "data/rdk.patt" or "/data/rdk.patt"
    const finalPatternUrl =
      patternUrl && !patternUrl.startsWith("/") ? `/${patternUrl}` : patternUrl;

    // hide by default; AR.js will set `visible=true` when marker is found
    group.visible = false;
    initializedRef.current = false;

    // AR.js sometimes doesn't have arController immediately
    if (!arContext.arController) {
      const id = requestAnimationFrame(() => {
        if (!groupRef.current) return;
        const again = backend.getInternal?.() as any;
        const ctx2 = again?.arContext;
        if (!ctx2?.arController) return;

        const controls = new ArMarkerControls(ctx2, groupRef.current, {
          type: finalPatternUrl
            ? "pattern"
            : barcodeValue
              ? "barcode"
              : "unknown",
          patternUrl: finalPatternUrl,
          barcodeValue,
          ...params,
        });

        arControlsRef.current = controls;
        initializedRef.current = true;

        // cleanup
        return () => {
          const anyControls = controls as any;
          /**
           * @note AR.js's `ArMarkerControls` has no official TypeScript types and does not formally declare a `.dispose()` method. Some community builds or future versions may implement one, but it's not guaranteed.
           *
           * Cast to `any` here as a safe check for a runtime `dispose()` function without TypeScript errors. This ensures that if AR.js ever provides an explicit cleanup method, it will still be called
           */
          if (typeof anyControls.dispose === "function") anyControls.dispose();
          initializedRef.current = false;
        };
      });
      return () => cancelAnimationFrame(id);
    }

    const controls = new ArMarkerControls(arContext, group, {
      type: finalPatternUrl ? "pattern" : barcodeValue ? "barcode" : "unknown",
      patternUrl: finalPatternUrl,
      barcodeValue,
      ...params,
    });

    arControlsRef.current = controls;
    initializedRef.current = true;

    return () => {
      const anyControls = controls as any;
      /**
       * @note AR.js's `ArMarkerControls` has no official TypeScript types and does not formally declare a `.dispose()` method. Some community builds or future versions may implement one, but it's not guaranteed.
       *
       * Cast to `any` here as a safe check for a runtime `dispose()` function without TypeScript errors. This ensures that if AR.js ever provides an explicit cleanup method, it will still be called
       */
      if (typeof anyControls.dispose === "function") anyControls.dispose();
      initializedRef.current = false;
    };
  }, [backend, patternUrl, barcodeValue, params]);

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
      visible={false} // Start invisible by default
    >
      {children}
    </group>
  );
};

export default FiducialAnchor;
