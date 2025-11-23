export * from "./engine";
export * from "./fiducial";
export * from "./geolocation";

// core types
export type {
  XRBackend,
  XRContextValue,
} from "./lib/types/xr";

// store
export {
  getXRStore,
  subscribeToXRStore,
} from "./engine/useXRStore";

// store types
export type {
  XRStore,
  XRStoreState,
  XRStoreActions,
} from "./engine/useXRStore";

// pull in `@react-three/fiber` types to make Three.js JSX elements available downstream; this resolves issues like `<ambientLight />` throwing type error: "Property 'ambientLight' does not exist on type 'JSX.IntrinsicElements'. (ts 2339)"
import "@react-three/fiber";
