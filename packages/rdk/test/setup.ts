import "@testing-library/jest-dom";

import { afterEach, mock } from "bun:test";

import { cleanup } from "@testing-library/react";
import { createElement } from "react";

import { setupGlobalMocks } from "./mocks/globals.mock";

// auto-cleanup after each test (bun:test doesn't do this automatically)
afterEach(() => {
  cleanup();
});

// set up all global mocks
setupGlobalMocks();

// mock module dependencies
mock.module("@react-three/fiber", () => {
  return {
    useFrame: mock(),
    useThree: mock(() => ({
      camera: {
        position: { x: 0, y: 0, z: 0 },
        lookAt: mock(),
      },
      scene: {
        add: mock(),
        remove: mock(),
      },
    })),
    createPortal: mock((children: unknown) => children),
    Canvas: mock(
      ({ children, ...props }: { children: unknown; [key: string]: unknown }) =>
        createElement(
          "div",
          { "data-testid": "xr-canvas", ...props },
          children as string,
        ),
    ),
    extend: mock(),
  };
});

mock.module("locar", () => ({
  LocationBased: mock(() => ({
    scene: null,
    camera: null,
    add: mock(),
    remove: mock(),
    startGps: mock(() => true),
    stopGps: mock(() => true),
    fakeGps: mock(),
    on: mock(),
    off: mock(),
    emit: mock(),
  })),
  Webcam: mock(() => ({
    texture: null,
    on: mock(),
    dispose: mock(),
  })),
  DeviceOrientationControls: mock(() => ({
    enabled: true,
    on: mock(),
    init: mock(),
    connect: mock(),
    disconnect: mock(),
    update: mock(),
    dispose: mock(),
  })),
}));

mock.module("../src/engine/XR", () => import("./mocks/XR.mock"));

// suppress React warnings about unknown DOM properties in tests
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];

  // suppress Three.js related warnings
  if (
    typeof message === "string" &&
    (message.includes("unrecognized in this browser") ||
      message.includes("non-boolean attribute") ||
      message.includes("visible"))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
