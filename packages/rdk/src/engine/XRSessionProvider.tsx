import { useFrame, useThree } from "@react-three/fiber";
import createFiducialBackend from "fiducial/fiducialBackend";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { match } from "ts-pattern";

import type {
  XRBackend,
  XRContextValue,
  XRMode,
  XRSessionOptions,
} from "lib/types/xr";
import type { PropsWithChildren } from "react";

const XRContext = createContext<XRContextValue | null>(null);

/**
 * Use `XRSessionProvider` context.
 */
export const useXR = (): XRContextValue => {
  const ctx = useContext(XRContext);

  if (!ctx)
    throw new Error("`useXR` must be used inside `<XRSessionProvider />`");

  return ctx;
};

interface XRSessionProviderProps<TMode extends XRMode = XRMode>
  extends PropsWithChildren {
  /** Mode of extended reality. */
  mode: TMode;
  /** Session options, forwarded to the corresponding backend. */
  options?: XRSessionOptions<TMode>;
}

/**
 * Core RDK engine. This owns the "XR session state" (e.g. running, paused, tracking quality), owns the camera feed/pose source, handles ticks per frame, applies transforms, and provides a React context for children to consume.
 */
const XRSessionProvider = <TMode extends XRMode = XRMode>({
  mode,
  options,
  children,
}: XRSessionProviderProps<TMode>) => {
  const [ready, setReady] = useState(false);

  const { camera, gl, scene } = useThree();

  const backendRef = useRef<XRBackend>(null);

  // pick backend by mode
  const backend = useMemo<XRBackend>(
    () =>
      match(mode as XRMode)
        .with("fiducial", () => createFiducialBackend(options))
        // TODO as more modes are implemented
        // .with("geolocation", () => createGeoBackend(options as GeoOptions))
        // .with("webxr", () => createWebXRBackend(options as WebXROptions))
        .otherwise(() => createFiducialBackend(options)),
    [mode, options],
  );

  // init once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await backend.init({ scene, camera, renderer: gl });
      if (!cancelled) {
        backendRef.current = backend;
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      backend.dispose?.();
      backendRef.current = null;
      setReady(false);
    };
  }, [backend, scene, camera, gl]);

  // update backend per frame
  useFrame((_state, dt) => {
    backendRef.current?.update?.(dt);
  });

  // memoize value so consumers don't rerender unnecessarily
  const value: XRContextValue = useMemo(
    () => ({
      mode,
      ready,
      backend: backendRef.current,
    }),
    [mode, ready],
  );

  return <XRContext.Provider value={value}>{children}</XRContext.Provider>;
};

export default XRSessionProvider;
