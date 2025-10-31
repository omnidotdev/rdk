/**
 * @file Shared mock utilities for global objects used across tests.
 */

import { vi } from "vitest";

/**
 * Mock implementation of AR.js THREEx global object.
 */
export const mockTHREEx = {
  ArToolkitSource: vi.fn().mockImplementation(function ArToolkitSource() {
    return {
      init: vi.fn().mockResolvedValue(undefined),
      onReady: vi.fn(),
      domElement:
        typeof document !== "undefined" ? document.createElement("video") : {},
      parameters: {},
      ready: false,
      dispose: vi.fn(),
    };
  }),
  ArToolkitContext: vi.fn().mockImplementation(function ArToolkitContext() {
    return {
      init: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      _arMarkersControls: [],
      parameters: {},
      arController: null,
      dispose: vi.fn(),
    };
  }),
  ArMarkerControls: vi.fn().mockImplementation(function ArMarkerControls() {
    return {
      object3d: {
        visible: false,
      },
      context: null,
      parameters: {},
      setPatternUrl: vi.fn(),
      setBarcodeValue: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispose: vi.fn(),
    };
  }),
};

/**
 * Mock implementation of Three.js THREE global object.
 */
export const mockTHREE = {
  Group: vi.fn().mockImplementation(function Group() {
    return {
      add: vi.fn(),
      remove: vi.fn(),
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      children: [],
    };
  }),
  Object3D: vi.fn().mockImplementation(function Object3D() {
    return {
      add: vi.fn(),
      remove: vi.fn(),
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      children: [],
    };
  }),
  Scene: vi.fn().mockImplementation(function Scene() {
    return {
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
    };
  }),
  Camera: vi.fn().mockImplementation(function Camera() {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
  }),
};

/**
 * Setup global mocks for AR.js and Three.js.
 * Call this in test setup files or individual tests.
 */
export function setupGlobalMocks(): void {
  // @ts-expect-error
  global.THREEx = mockTHREEx;
  // @ts-expect-error
  global.THREE = mockTHREE;

  // Suppress console warnings in tests
  global.console.warn = vi.fn();
}

/**
 * Clear all global mocks
 * Useful for cleanup between tests
 */
export function clearGlobalMocks(): void {
  vi.clearAllMocks();
}

/**
 * Reset global mocks to their initial state
 * More thorough than clearAllMocks, recreates the mock objects
 */
export function resetGlobalMocks(): void {
  vi.clearAllMocks();
  setupGlobalMocks();
}
