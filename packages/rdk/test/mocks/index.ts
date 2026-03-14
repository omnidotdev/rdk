export {
  clearGlobalMocks,
  mockTHREE,
  mockTHREEx,
  resetGlobalMocks,
  setupGlobalMocks,
} from "./globals.mock";

export interface MockXRContext {
  arToolkitContext: {
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    _arMarkersControls: any[];
    init: ReturnType<typeof import("bun:test").mock>;
    update: ReturnType<typeof import("bun:test").mock>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    parameters: Record<string, any>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    arController: any;
    dispose: ReturnType<typeof import("bun:test").mock>;
  };
  arToolkitSource: {
    init: ReturnType<typeof import("bun:test").mock>;
    onReady: ReturnType<typeof import("bun:test").mock>;
    domElement: HTMLVideoElement;
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    parameters: Record<string, any>;
    ready: boolean;
    dispose: ReturnType<typeof import("bun:test").mock>;
  };
  isSessionActive: boolean;
  isTrackingActive: boolean;
  startSession: ReturnType<typeof import("bun:test").mock>;
  endSession: ReturnType<typeof import("bun:test").mock>;
  error: string | null;
}
