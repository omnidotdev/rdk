import { createElement } from "react";
import { vi } from "vitest";

import type { ReactNode } from "react";
import type { XRStore } from "../../src/engine/useXRStore";

/**
 * Mock implementation of `XR`.
 */
export const mockXRContext: Partial<XRStore> = {
  video: null,
  backends: [],
  sessionTypes: new Set(),

  registerBackend: vi.fn().mockResolvedValue(undefined),
  unregisterBackend: vi.fn(),
  setVideo: vi.fn(),
  updateBackends: vi.fn(),
};

export const useXR = vi.fn(() => ({
  ...mockXRContext,
  isImmersive: false,
  webxr: null,
}));

export default vi.fn(({ children }: { children: ReactNode }) =>
  createElement("div", { "data-testid": "xr-session-provider" }, children),
);

export const XR = vi.fn(({ children }: { children: ReactNode }) => (
  <div data-testid="xr">{children}</div>
));

/**
 * Reset the XR context mock to default state.
 */
export function resetXRContext(): void {
  mockXRContext.sessionTypes = new Set();
  mockXRContext.backends = [];
  vi.clearAllMocks();
}

/**
 * Set XR context to active session state.
 */
export function setXRSessionActive(sessionType: string): void {
  mockXRContext.sessionTypes?.add(sessionType as any);
}

/**
 * Set XR context to error state.
 */
export function setXRSessionError(err: string): void {
  console.error(`Mock XR error: ${err}`);
  mockXRContext.sessionTypes = new Set();
}
