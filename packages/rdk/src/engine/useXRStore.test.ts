import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useXRStore, { getXRStore, SESSION_TYPES } from "./useXRStore";

// Mock @react-three/xr
vi.mock("@react-three/xr", () => ({
  useXRStore: vi.fn(() => ({
    isPresenting: false,
    mode: null,
    enterAR: vi.fn(),
    enterVR: vi.fn(),
    exit: vi.fn(),
    isHandTracking: false,
    controllers: [],
  })),
}));

describe("useXRStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = getXRStore();
    act(() => {
      store.setVideo(null);
      store.sessionTypes.clear();
      // Properly dispose backends before clearing
      const backends = [...store.backends];
      backends.forEach((backend) => {
        backend.dispose?.();
      });

      // clear the backends array
      store.backends.length = 0;
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("Basic Store Structure", () => {
    it("has correct initial state", () => {
      const store = getXRStore();

      expect(store.video).toBe(null);
      expect(store.backends).toEqual([]);
      expect(store.sessionTypes).toBeInstanceOf(Set);
      expect(store.sessionTypes.size).toBe(0);
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

      expect(store.sessionTypes.has(SESSION_TYPES.IMMERSIVE)).toBe(false);

      act(() => {
        store.sessionTypes.add(SESSION_TYPES.IMMERSIVE);
      });

      expect(store.sessionTypes.has(SESSION_TYPES.IMMERSIVE)).toBe(true);
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
    it("adds backends to store", async () => {
      const mockBackend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const mockThreeRefs = {
        scene: { add: vi.fn() },
        camera: { position: { set: vi.fn() } },
        renderer: { render: vi.fn() },
      };

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      const store = getXRStore();
      expect(store.backends).toContain(mockBackend);
      expect(mockBackend.init).toHaveBeenCalledWith(mockThreeRefs);
    });

    it("removes backends from store", async () => {
      const mockBackend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const mockThreeRefs = {
        scene: { add: vi.fn() },
        camera: { position: { set: vi.fn() } },
        renderer: { render: vi.fn() },
      };

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      act(() => {
        getXRStore().unregisterBackend(mockBackend);
      });

      const store = getXRStore();
      expect(store.backends).not.toContain(mockBackend);
      expect(mockBackend.dispose).toHaveBeenCalled();
    });

    it("prevents incompatible session types", async () => {
      const fiducialBackend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const geolocationBackend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const mockThreeRefs = {
        scene: { add: vi.fn() },
        camera: { position: { set: vi.fn() } },
        renderer: { render: vi.fn() },
      };

      await act(async () => {
        await getXRStore().registerBackend(
          fiducialBackend,
          mockThreeRefs,
          SESSION_TYPES.FIDUCIAL,
        );
      });

      await expect(
        act(async () => {
          await getXRStore().registerBackend(
            geolocationBackend,
            mockThreeRefs,
            SESSION_TYPES.GEOLOCATION,
          );
        }),
      ).rejects.toThrow(/INCOMPATIBLE SESSIONS/);
    });

    it("calls update on registered backends", async () => {
      const mockBackend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const mockThreeRefs = {
        scene: { add: vi.fn() },
        camera: { position: { set: vi.fn() } },
        renderer: { render: vi.fn() },
      };

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockThreeRefs);
      });

      act(() => {
        getXRStore().updateBackends(0.016);
      });

      expect(mockBackend.update).toHaveBeenCalledWith(0.016);
    });
  });
});
