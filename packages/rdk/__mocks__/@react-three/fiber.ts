/**
 * @file Mock implementation of `@react-three/fiber`.
 */

import { createElement } from "react";
import { vi } from "vitest";

export const useFrame = vi.fn();

export const useThree = vi.fn(() => ({
  scene: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  camera: {},
  gl: {
    domElement:
      typeof document !== "undefined" ? document.createElement("canvas") : {},
  },
}));

export const Canvas = vi.fn(({ children, ...props }: any) =>
  createElement("div", { "data-testid": "xr-canvas", ...props }, children),
);

export const useLoader = vi.fn();
export const extend = vi.fn();
export const createRoot = vi.fn();
