import { createElement } from "react";
import { vi } from "vitest";

import type { ReactNode } from "react";
import type { XRStore } from "../../src/engine/useXRStore";
import type { Backend, BackendType } from "../../src/lib/types/engine";

export const mockXRContext: Partial<XRStore> = {
  video: null,
  backends: new Map<BackendType, Backend>(),

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
  mockXRContext.backends = new Map();
  vi.clearAllMocks();
}
