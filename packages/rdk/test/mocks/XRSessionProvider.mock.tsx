import { vi } from "vitest";
import { createElement, ReactNode } from "react";

/**
 * Mock implementation of `XRSessionProvider`.
 */
export const mockXRContext = {
	arToolkitContext: {
		_arMarkersControls: [],
		init: vi.fn().mockResolvedValue(undefined),
		update: vi.fn(),
		parameters: {},
		arController: null,
		dispose: vi.fn(),
	},
	arToolkitSource: {
		init: vi.fn().mockResolvedValue(undefined),
		onReady: vi.fn(),
		domElement:
			typeof document !== "undefined" ? document.createElement("video") : {},
		parameters: {},
		ready: false,
		dispose: vi.fn(),
	},
	isSessionActive: false,
	isTrackingActive: false,
	startSession: vi.fn(),
	endSession: vi.fn(),
	error: null,
};

export const useXR = vi.fn(() => mockXRContext);

export default vi.fn(({ children }: { children: ReactNode }) =>
	createElement("div", { "data-testid": "xr-session-provider" }, children),
);

export const XRSessionProvider = vi.fn(
	({ children }: { children: ReactNode }) => (
		<div data-testid="xr-session-provider">{children}</div>
	),
);

/**
 * Reset the XR context mock to default state.
 */
export function resetXRContext(): void {
	mockXRContext.isSessionActive = false;
	mockXRContext.isTrackingActive = false;
	mockXRContext.error = null;
	mockXRContext.arToolkitContext._arMarkersControls = [];
	vi.clearAllMocks();
}

/**
 * Set XR context to active session state.
 */
export function setXRSessionActive(): void {
	mockXRContext.isSessionActive = true;
	mockXRContext.isTrackingActive = true;
}

/**
 * Set XR context to error state.
 */
export function setXRSessionError(error: string): void {
	// @ts-ignore
	mockXRContext.error = error;
	mockXRContext.isSessionActive = false;
	mockXRContext.isTrackingActive = false;
}
