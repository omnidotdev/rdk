import { match } from "ts-pattern";

import type { ImmersiveMode } from "lib/types";

/**
 * Map simplified immersive modes to official WebXR session modes.
 */
const toWebXRSessionMode = (mode: ImmersiveMode): XRSessionMode =>
  match<ImmersiveMode, XRSessionMode>(mode)
    .with("ar", () => "immersive-ar")
    .with("vr", () => "immersive-vr")
    .with("inline", () => "inline")
    .exhaustive();

export default toWebXRSessionMode;
