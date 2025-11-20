export {
  mockTHREEx,
  mockTHREE,
  setupGlobalMocks,
  clearGlobalMocks,
  resetGlobalMocks,
} from "./globals.mock";

export {
  default as XRSessionProvider,
  XRSessionProvider as XRSessionProviderNamed,
  useXR,
  mockXRContext,
  resetXRContext,
  setXRSessionActive,
  setXRSessionError,
} from "./XRSessionProvider.mock";

export interface MockXRContext {
  arToolkitContext: {
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    _arMarkersControls: any[];
    init: ReturnType<typeof import("vitest").vi.fn>;
    update: ReturnType<typeof import("vitest").vi.fn>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    parameters: Record<string, any>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    arController: any;
    dispose: ReturnType<typeof import("vitest").vi.fn>;
  };
  arToolkitSource: {
    init: ReturnType<typeof import("vitest").vi.fn>;
    onReady: ReturnType<typeof import("vitest").vi.fn>;
    domElement: HTMLVideoElement;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    parameters: Record<string, any>;
    ready: boolean;
    dispose: ReturnType<typeof import("vitest").vi.fn>;
  };
  isSessionActive: boolean;
  isTrackingActive: boolean;
  startSession: ReturnType<typeof import("vitest").vi.fn>;
  endSession: ReturnType<typeof import("vitest").vi.fn>;
  error: string | null;
}
