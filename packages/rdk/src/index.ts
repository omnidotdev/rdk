export * from "./engine";

// pull in `@react-three/fiber` types to make Three.js JSX elements available downstream; this resolves issues like `<ambientLight />` throwing type error: "Property 'ambientLight' does not exist on type 'JSX.IntrinsicElements'. (ts 2339)"
import "@react-three/fiber";
