import { mock } from "bun:test";

import { createElement } from "react";

import type { ReactNode } from "react";
import type { XRStore } from "../../src/engine/useXRStore";
import type { Backend, BackendType } from "../../src/lib/types/engine";

export const mockXRContext: Partial<XRStore> = {
  video: null,
  backends: new Map<BackendType, Backend>(),

  registerBackend: mock(() => Promise.resolve(undefined)),
  unregisterBackend: mock(),
  setVideo: mock(),
  updateBackends: mock(),
};

export const useXR = mock(() => ({
  ...mockXRContext,
  isImmersive: false,
  webxr: null,
}));

export default mock(({ children }: { children: ReactNode }) =>
  createElement("div", { "data-testid": "xr-session-provider" }, children),
);

export const XR = mock(({ children }: { children: ReactNode }) => (
  <div data-testid="xr">{children}</div>
));

/**
 * Reset the XR context mock to default state
 */
export function resetXRContext(): void {
  mockXRContext.backends = new Map();
}
