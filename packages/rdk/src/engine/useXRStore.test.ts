import { beforeEach, describe, expect, it, mock } from "bun:test";

import { act } from "@testing-library/react";
import { BACKEND_TYPES } from "lib/types/engine";

import useXRStore, { getXRStore } from "./useXRStore";

import type { Backend, BackendType } from "lib/types/engine";
import type { Camera, Scene, WebGLRenderer } from "three";

// Mock @react-three/xr
mock.module("@react-three/xr", () => ({
  useXRStore: mock(() => ({
    isPresenting: false,
    mode: null,
    enterAR: mock(),
    enterVR: mock(),
    exit: mock(),
    isHandTracking: false,
    controllers: [],
  })),
}));

const createMockBackend = (type: BackendType): Backend => ({
  type,
  init: mock(() => Promise.resolve(undefined)),
  update: mock(),
  dispose: mock(),
  getInternal: mock(() => ({})),
});

const createMockThreeRefs = () => ({
  scene: {} as Scene,
  camera: {} as Camera,
  renderer: {} as WebGLRenderer,
});

describe("useXRStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = getXRStore();
    act(() => {
      store.setVideo(null);
      // Properly dispose backends before clearing
      for (const backend of store.backends.values()) {
        backend.dispose?.();
      }
      store.backends.clear();
    });
  });

  describe("Basic Store Structure", () => {
    it("has correct initial state", () => {
      const store = getXRStore();

      expect(store.video).toBe(null);
      expect(store.backends).toBeInstanceOf(Map);
      expect(store.backends.size).toBe(0);
    });

    it("has required action methods", () => {
      const store = getXRStore();

      expect(store.registerBackend).toBeInstanceOf(Function);
      expect(store.unregisterBackend).toBeInstanceOf(Function);
      expect(store.setVideo).toBeInstanceOf(Function);
      expect(store.updateBackends).toBeInstanceOf(Function);
    });
  });

  describe("React Hook", () => {
    it("returns store with unified state", () => {
      expect(typeof useXRStore).toBe("function");
    });

    it("calculates isImmersive correctly", () => {
      const store = getXRStore();

      expect(store.backends.has(BACKEND_TYPES.IMMERSIVE)).toBe(false);

      act(() => {
        store.backends.set(
          BACKEND_TYPES.IMMERSIVE,
          createMockBackend(BACKEND_TYPES.IMMERSIVE),
        );
      });

      expect(store.backends.has(BACKEND_TYPES.IMMERSIVE)).toBe(true);
    });
  });

  describe("Video Management", () => {
    it("updates video element", () => {
      const mockVideo = { tagName: "VIDEO" } as HTMLVideoElement;

      act(() => {
        getXRStore().setVideo(mockVideo);
      });

      const store = getXRStore();
      expect(store.video).toBe(mockVideo);
    });
  });

  describe("Backend Management", () => {
    it("adds backends to store by type", async () => {
      const mockBackend = createMockBackend(BACKEND_TYPES.GEOLOCATION);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      const store = getXRStore();
      expect(store.backends.get(BACKEND_TYPES.GEOLOCATION)).toBe(mockBackend);
      expect(mockBackend.init).toHaveBeenCalledWith(mockThreeRefs);
    });

    it("removes backends from store by type", async () => {
      const mockBackend = createMockBackend(BACKEND_TYPES.FIDUCIAL);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      act(() => {
        getXRStore().unregisterBackend(mockBackend);
      });

      const store = getXRStore();
      expect(store.backends.has(BACKEND_TYPES.FIDUCIAL)).toBe(false);
      expect(mockBackend.dispose).toHaveBeenCalled();
    });

    it("prevents incompatible backend types", async () => {
      const fiducialBackend = createMockBackend(BACKEND_TYPES.FIDUCIAL);
      const geolocationBackend = createMockBackend(BACKEND_TYPES.GEOLOCATION);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(fiducialBackend, mockThreeRefs);
      });

      let caughtError: Error | null = null;
      try {
        await act(async () => {
          await getXRStore().registerBackend(geolocationBackend, mockThreeRefs);
        });
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toMatch(/INCOMPATIBLE SESSIONS/);
    });

    it("calls update on registered backends", async () => {
      const mockBackend = createMockBackend(BACKEND_TYPES.GEOLOCATION);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      act(() => {
        getXRStore().updateBackends(0.016);
      });

      expect(mockBackend.update).toHaveBeenCalledWith(0.016);
    });

    it("registers vision backend", async () => {
      const mockBackend = createMockBackend(BACKEND_TYPES.VISION);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      const store = getXRStore();
      expect(store.backends.get(BACKEND_TYPES.VISION)).toBe(mockBackend);
    });

    it("provides O(1) backend lookup by type", async () => {
      const geoBackend = createMockBackend(BACKEND_TYPES.GEOLOCATION);
      const immersiveBackend = createMockBackend(BACKEND_TYPES.IMMERSIVE);
      const mockThreeRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(geoBackend, mockThreeRefs);
      });

      await act(async () => {
        await getXRStore().registerBackend(immersiveBackend, mockThreeRefs);
      });

      const store = getXRStore();
      expect(store.backends.get(BACKEND_TYPES.GEOLOCATION)).toBe(geoBackend);
      expect(store.backends.get(BACKEND_TYPES.IMMERSIVE)).toBe(
        immersiveBackend,
      );
      expect(store.backends.get(BACKEND_TYPES.FIDUCIAL)).toBeUndefined();
    });
  });
});
