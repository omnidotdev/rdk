import { match } from "ts-pattern";

import type { ImmersiveMode } from "lib/types";

/**
 * Maps official WebXR session modes to simplified immersive modes.
 */
const fromWebXRSessionMode = (mode: XRSessionMode): ImmersiveMode =>
  match<XRSessionMode, ImmersiveMode>(mode)
    .with("immersive-ar", () => "ar")
    .with("immersive-vr", () => "vr")
    .with("inline", () => "inline")
    .exhaustive();

export default fromWebXRSessionMode;
