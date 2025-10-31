export {
  clearGlobalMocks,
  mockTHREE,
  mockTHREEx,
  resetGlobalMocks,
  setupGlobalMocks,
} from "./globals.mock";
export {
  default as XRSessionProvider,
  mockXRContext,
  resetXRContext,
  setXRSessionActive,
  setXRSessionError,
  useXR,
  XRSessionProvider as XRSessionProviderNamed,
} from "./XRSessionProvider.mock";

export interface MockXRContext {
  arToolkitContext: {
    _arMarkersControls: any[];
    init: ReturnType<typeof import("vitest").vi.fn>;
    update: ReturnType<typeof import("vitest").vi.fn>;
    parameters: Record<string, any>;
    arController: any;
    dispose: ReturnType<typeof import("vitest").vi.fn>;
  };
  arToolkitSource: {
    init: ReturnType<typeof import("vitest").vi.fn>;
    onReady: ReturnType<typeof import("vitest").vi.fn>;
    domElement: HTMLVideoElement;
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
