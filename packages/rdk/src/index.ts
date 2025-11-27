export * from "./engine";
export * from "./fiducial";
export * from "./geolocation";
export * from "./immersive";

export type {
  XRStore,
  XRStoreActions,
  XRStoreState,
} from "./engine/useXRStore";
export type {
  Backend,
  ContextValue,
} from "./lib/types/engine";
export type { ImmersiveMode } from "./lib/types/immersive";

// pull in `@react-three/fiber` types to make Three.js JSX elements available downstream; this resolves issues like `<ambientLight />` throwing type error: "Property 'ambientLight' does not exist on type 'JSX.IntrinsicElements'. (ts 2339)"
import "@react-three/fiber";
