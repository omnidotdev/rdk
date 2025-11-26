import useXRStore, { SESSION_TYPES } from "engine/useXRStore";

import type { ImmersiveMode } from "../../types/immersive";

/**
 * Access the current immersive session state.
 */
const useImmersiveSession = () => {
  const { sessionTypes } = useXRStore();
  const isImmersive = sessionTypes.has(SESSION_TYPES.IMMERSIVE);

  // report active mode when immersive session is active
  const activeMode: ImmersiveMode | null = isImmersive ? "ar" : null;

  return {
    isImmersive,
    activeMode,
  };
};

export default useImmersiveSession;
