import { Canvas } from "@react-three/fiber";

import XRSessionProvider from "./XRSessionProvider";

import type { CanvasProps } from "@react-three/fiber";
import type { XRMode, XRSessionOptions } from "lib/types/xr";

export interface XRCanvasProps<TMode extends XRMode = "fiducial">
  extends CanvasProps {
  /** Mode of extended reality. */
  mode?: TMode;
  /** Session options, forwarded to the corresponding backend. */
  sessionOptions?: XRSessionOptions<TMode>;
}

/**
 * Main extended reality canvas that initializes the context. This behaves as a scene root for end users.
 */
const XRCanvas = <TMode extends XRMode = "fiducial">({
  mode = "fiducial" as TMode,
  sessionOptions,
  children,
  ...rest
}: XRCanvasProps<TMode>) => (
  <Canvas {...rest}>
    <XRSessionProvider mode={mode} options={sessionOptions}>
      {children}
    </XRSessionProvider>
  </Canvas>
);

export default XRCanvas;
