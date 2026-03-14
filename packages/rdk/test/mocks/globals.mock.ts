/**
 * @file Shared mock utilities for global objects used across tests
 */

import { mock } from "bun:test";

/**
 * Mock implementation of AR.js THREEx global object
 */
export const mockTHREEx: Record<string, unknown> = {
  ArToolkitSource: mock(function ArToolkitSource() {
    return {
      init: mock(() => Promise.resolve(undefined)),
      onReady: mock(),
      domElement:
        typeof document !== "undefined" ? document.createElement("video") : {},
      parameters: {},
      ready: false,
      dispose: mock(),
    };
  }),
  ArToolkitContext: mock(function ArToolkitContext() {
    return {
      init: mock(() => Promise.resolve(undefined)),
      update: mock(),
      _arMarkersControls: [],
      parameters: {},
      arController: null,
      dispose: mock(),
    };
  }),
  ArMarkerControls: mock(function ArMarkerControls() {
    return {
      object3d: {
        visible: false,
      },
      context: null,
      parameters: {},
      setPatternUrl: mock(),
      setBarcodeValue: mock(),
      addEventListener: mock(),
      removeEventListener: mock(),
      dispose: mock(),
    };
  }),
};

/**
 * Mock implementation of LocAR.js global object
 */
export const mockLocAR: Record<string, unknown> = {
  LocationBased: mock(function LocationBased() {
    return {
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
      setElevation: mock(),
    };
  }),
  Webcam: mock(function Webcam() {
    return {
      texture: null,
      on: mock(),
      dispose: mock(),
    };
  }),
  DeviceOrientationControls: mock(function DeviceOrientationControls() {
    return {
      enabled: true,
      on: mock(),
      init: mock(),
      connect: mock(),
      disconnect: mock(),
      update: mock(),
      dispose: mock(),
    };
  }),
};

/**
 * Mock implementation of Three.js THREE global object
 */
export const mockTHREE: Record<string, unknown> = {
  Group: mock(function Group() {
    return {
      add: mock(),
      remove: mock(),
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      children: [],
    };
  }),
  Object3D: mock(function Object3D() {
    return {
      add: mock(),
      remove: mock(),
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      children: [],
    };
  }),
  Scene: mock(function Scene() {
    return {
      add: mock(),
      remove: mock(),
      children: [],
    };
  }),
  Camera: mock(function Camera() {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
  }),
};

/**
 * Setup global mocks for AR.js and Three.js.
 * Call this in test setup files or individual tests
 */
export function setupGlobalMocks(): void {
  // @ts-expect-error
  global.THREEx = mockTHREEx;
  // @ts-expect-error
  global.THREE = mockTHREE;
  // @ts-expect-error
  global.LocAR = mockLocAR;

  // suppress console warnings in tests
  global.console.warn = mock();
}

/**
 * Clear all global mocks.
 * Useful for cleanup between tests
 */
export function clearGlobalMocks(): void {
  // re-setup fresh mocks
  setupGlobalMocks();
}

/**
 * Reset global mocks to their initial state.
 * More thorough than clear, recreates the mock objects
 */
export function resetGlobalMocks(): void {
  setupGlobalMocks();
}
