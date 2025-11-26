import { act, renderHook } from "@testing-library/react";
import { PerspectiveCamera, Scene } from "three";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";

import useXRStore, {
  getXRStore,
  SESSION_TYPES,
  subscribeToXRStore,
} from "./useXRStore";

import type { Camera, WebGLRenderer } from "three";
import type { Backend, CameraSource } from "../lib/types/engine";
import type { XRSessionType } from "./useXRStore";

// mock Three.js objects
const createMockThreeRefs = () => ({
  scene: new Scene(),
  camera: new PerspectiveCamera(),
  renderer: {
    domElement: document.createElement("canvas"),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  } as unknown as WebGLRenderer,
});

// mock XR Backend
const createMockBackend = (): Backend => ({
  init: vi.fn().mockResolvedValue(undefined),
  update: vi.fn(),
  dispose: vi.fn(),
});

describe("XR Store API Surface", () => {
  beforeEach(() => {
    // reset store state before each test
    const store = getXRStore();
    act(() => {
      store.setCameraSource("video");
      store.setVideo(null);

      // clear backends
      store.backends.forEach((backend) => {
        store.unregisterBackend(backend);
      });
    });
  });

  describe("Store State Interface", () => {
    it("exposes correct initial state shape", () => {
      const store = getXRStore();

      expect(store).toMatchObject({
        camera: expect.stringMatching(/^(video|webxr)$/),
        backends: expect.any(Array),
        sessionTypes: expect.any(Set),
      });

      // these can be null/undefined initially
      expect(
        store.video === null || store.video instanceof HTMLVideoElement,
      ).toBe(true);
    });

    it("exposes correct action methods", () => {
      const store = getXRStore();

      expect(store.registerBackend).toBeInstanceOf(Function);
      expect(store.unregisterBackend).toBeInstanceOf(Function);

      expect(store.setCameraSource).toBeInstanceOf(Function);
      expect(store.setVideo).toBeInstanceOf(Function);

      expect(store.updateBackends).toBeInstanceOf(Function);
    });

    it("maintains type safety for XRStore interface", () => {
      const {
        backends,
        camera,
        registerBackend,
        sessionTypes,
        setCameraSource,
        setVideo,
        unregisterBackend,
        updateBackends,
        video,
      } = getXRStore();

      // Validate state property types
      expectTypeOf({ camera }).toEqualTypeOf<{ camera: CameraSource }>();
      expectTypeOf({ backends }).toEqualTypeOf<{ backends: Backend[] }>();
      expectTypeOf({ sessionTypes }).toEqualTypeOf<{
        sessionTypes: Set<XRSessionType>;
      }>();
      expectTypeOf({ video }).toEqualTypeOf<{
        video: HTMLVideoElement | null | undefined;
      }>();

      // Validate action method types and signatures
      expectTypeOf(registerBackend).toBeFunction();
      expectTypeOf(registerBackend).parameter(0).toEqualTypeOf<Backend>();
      expectTypeOf(registerBackend).parameter(1).toEqualTypeOf<{
        scene: Scene;
        camera: Camera;
        renderer: WebGLRenderer;
      }>();
      expectTypeOf(registerBackend)
        .parameter(2)
        .toEqualTypeOf<XRSessionType | undefined>();
      expectTypeOf(registerBackend).returns.toEqualTypeOf<Promise<void>>();

      expectTypeOf(unregisterBackend).toBeFunction();
      expectTypeOf(unregisterBackend).parameter(0).toEqualTypeOf<Backend>();
      expectTypeOf(unregisterBackend)
        .parameter(1)
        .toEqualTypeOf<XRSessionType | undefined>();
      expectTypeOf(unregisterBackend).returns.toEqualTypeOf<void>();

      expectTypeOf(setCameraSource).toBeFunction();
      expectTypeOf(setCameraSource).parameter(0).toEqualTypeOf<CameraSource>();
      expectTypeOf(setCameraSource).returns.toEqualTypeOf<void>();

      expectTypeOf(setVideo).toBeFunction();
      expectTypeOf(setVideo)
        .parameter(0)
        .toEqualTypeOf<HTMLVideoElement | null>();
      expectTypeOf(setVideo).returns.toEqualTypeOf<void>();

      expectTypeOf(updateBackends).toBeFunction();
      expectTypeOf(updateBackends).returns.toEqualTypeOf<void>();
    });
  });

  describe("React Hooks API", () => {
    it("returns full store", () => {
      const { result } = renderHook(() => useXRStore());

      expect(result.current).toMatchObject({
        camera: expect.stringMatching(/^(video|webxr)$/),
        backends: expect.any(Array),
        registerBackend: expect.any(Function),
        unregisterBackend: expect.any(Function),
      });
    });

    it("works correctly with selector", () => {
      const { result } = renderHook(() => {
        // use a stable selector to avoid infinite loops
        return useXRStore((state) => state.camera);
      });

      expect(typeof result.current).toBe("string");
    });

    it("returns correct types", () => {
      const { result: cameraResult } = renderHook(() =>
        useXRStore((state) => state.camera),
      );
      const { result: videoResult } = renderHook(() =>
        useXRStore((state) => state.video),
      );
      const { result: backendsResult } = renderHook(() =>
        useXRStore((state) => state.backends),
      );

      expect(["video", "webxr"]).toContain(cameraResult.current);

      // initially null
      expect(videoResult.current).toBe(null);

      expect(Array.isArray(backendsResult.current)).toBe(true);
    });

    it("updates when state changes", async () => {
      const { result: cameraResult } = renderHook(() =>
        useXRStore((state) => state.camera),
      );

      expect(cameraResult.current).toBe("video");

      act(() => {
        const store = getXRStore();
        store.setCameraSource("webxr");
      });

      expect(cameraResult.current).toBe("webxr");
    });
  });

  describe("Non-React API", () => {
    it("returns current state", () => {
      const store = getXRStore();

      expect(store.camera).toBe("video");
      expect(store.backends).toEqual([]);
    });

    it("subscribes to state changes", () => {
      const callback = vi.fn();

      const unsubscribe = subscribeToXRStore((state) => state.camera, callback);

      act(() => {
        getXRStore().setCameraSource("webxr");
      });

      expect(callback).toHaveBeenCalledWith("webxr", "video");

      unsubscribe();
    });

    it("subscription can be cancelled", () => {
      const callback = vi.fn();

      const unsubscribe = subscribeToXRStore((state) => state.camera, callback);

      unsubscribe();

      act(() => {
        getXRStore().setCameraSource("webxr");
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Backend Management", () => {
    it("adds backends to store", async () => {
      const mockRefs = createMockThreeRefs();
      const mockBackend = createMockBackend();

      await act(async () => {
        await getXRStore().registerBackend(
          mockBackend,
          mockRefs,
          "FiducialSession",
        );
      });

      const store = getXRStore();
      expect(store.backends).toContain(mockBackend);
      expect(store.sessionTypes.has("FiducialSession")).toBe(true);
      expect(mockBackend.init).toHaveBeenCalledWith(mockRefs);
    });

    it("removes backends from store", async () => {
      const mockRefs = createMockThreeRefs();
      const mockBackend = createMockBackend();

      await act(async () => {
        await getXRStore().registerBackend(
          mockBackend,
          mockRefs,
          "FiducialSession",
        );
      });

      act(() => {
        getXRStore().unregisterBackend(mockBackend, "FiducialSession");
      });

      const store = getXRStore();
      expect(store.backends).not.toContain(mockBackend);
      expect(store.sessionTypes.has("FiducialSession")).toBe(false);
      expect(mockBackend.dispose).toHaveBeenCalled();
    });

    it("prevents incompatible session types", async () => {
      const mockRefs = createMockThreeRefs();
      const fiducialBackend = createMockBackend();
      const geoBackend = createMockBackend();

      await act(async () => {
        await getXRStore().registerBackend(
          fiducialBackend,
          mockRefs,
          SESSION_TYPES.FIDUCIAL,
        );
      });

      await expect(
        act(async () => {
          await getXRStore().registerBackend(
            geoBackend,
            mockRefs,
            SESSION_TYPES.GEOLOCATION,
          );
        }),
      ).rejects.toThrow(/INCOMPATIBLE SESSIONS/);
    });

    it("calls update on all registered backends", async () => {
      const mockRefs = createMockThreeRefs();
      const backend1 = createMockBackend();
      const backend2 = createMockBackend();

      await act(async () => {
        await getXRStore().registerBackend(backend1, mockRefs);
        await getXRStore().registerBackend(backend2, mockRefs);
      });

      act(() => {
        getXRStore().updateBackends();
      });

      expect(backend1.update).toHaveBeenCalled();
      expect(backend2.update).toHaveBeenCalled();
    });
  });

  describe("Three.js Integration", () => {
    it("initializes backends with provided Three.js refs", async () => {
      const mockBackend = createMockBackend();
      const mockRefs = createMockThreeRefs();

      await act(async () => {
        await getXRStore().registerBackend(mockBackend, mockRefs);
      });

      expect(mockBackend.init).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockRefs.scene,
          camera: mockRefs.camera,
          renderer: mockRefs.renderer,
        }),
      );
    });
  });

  describe("Camera and Video Management", () => {
    it("updates video element", () => {
      const mockVideo = document.createElement("video") as HTMLVideoElement;

      act(() => {
        getXRStore().setVideo(mockVideo);
      });

      expect(getXRStore().video).toBe(mockVideo);

      act(() => {
        getXRStore().setVideo(null);
      });

      expect(getXRStore().video).toBeNull();
    });

    it("derives readiness from backends", () => {
      const mockRefs = createMockThreeRefs();
      const mockBackend = createMockBackend();

      // Initially no backends - not ready
      expect(getXRStore().backends.length).toBe(0);

      return act(async () => {
        await getXRStore().registerBackend(mockBackend, mockRefs);

        // With backend - ready (length > 0)
        expect(getXRStore().backends.length).toBe(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles backend initialization errors gracefully", async () => {
      const mockRefs = createMockThreeRefs();
      const failingBackend: Backend = {
        init: vi.fn().mockRejectedValue(new Error("Init failed")),
        update: vi.fn(),
        dispose: vi.fn(),
      };

      const errorBackend = createMockBackend();
      errorBackend.init = vi.fn().mockRejectedValue(new Error("Init failed"));

      await expect(
        act(async () => {
          return getXRStore().registerBackend(errorBackend, mockRefs);
        }),
      ).rejects.toThrow("Init failed");

      // backend should not be added to store
      expect(getXRStore().backends).not.toContain(failingBackend);
    });

    describe("Error Handling", () => {
      it("handles backend update errors without crashing", async () => {
        const mockRefs = createMockThreeRefs();
        const flakyBackend: Backend = {
          init: vi.fn().mockResolvedValue(undefined),
          update: vi.fn().mockImplementation(() => {
            throw new Error("Update failed");
          }),
          dispose: vi.fn(),
        };

        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        await act(async () => {
          await getXRStore().registerBackend(flakyBackend, mockRefs);
        });

        // should not throw
        act(() => {
          getXRStore().updateBackends();
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          "[XRStore] Backend update error:",
          expect.any(Error),
        );

        consoleSpy.mockRestore();
      });
    });

    it("handles backend disposal errors gracefully", async () => {
      const mockRefs = createMockThreeRefs();
      const flakyBackend: Backend = {
        init: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        dispose: vi.fn().mockImplementation(() => {
          throw new Error("Dispose failed");
        }),
      };

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await act(async () => {
        await getXRStore().registerBackend(flakyBackend, mockRefs);
      });

      // should not throw
      act(() => {
        getXRStore().unregisterBackend(flakyBackend);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[XRStore] Error disposing backend:",
        expect.any(Error),
      );

      expect(getXRStore().backends).not.toContain(flakyBackend);

      consoleSpy.mockRestore();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
