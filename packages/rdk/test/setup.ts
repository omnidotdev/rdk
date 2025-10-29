import "@testing-library/jest-dom";
import { vi } from "vitest";

// mock AR.js globals
global.THREEx = {
	ArToolkitSource: vi.fn().mockImplementation(function ArToolkitSource() {
		return {
			init: vi.fn().mockResolvedValue(undefined),
			onReady: vi.fn(),
		};
	}),
	ArToolkitContext: vi.fn().mockImplementation(function ArToolkitContext() {
		return {
			init: vi.fn().mockResolvedValue(undefined),
			update: vi.fn(),
			_arMarkersControls: [],
		};
	}),
	ArMarkerControls: vi.fn().mockImplementation(function ArMarkerControls() {
		return {};
	}),
};

// mock Three.js globals
global.THREE = {
	Group: vi.fn().mockImplementation(function Group() {
		return {
			add: vi.fn(),
			remove: vi.fn(),
			visible: true,
		};
	}),
	Object3D: vi.fn().mockImplementation(function Object3D() {
		return {
			add: vi.fn(),
			remove: vi.fn(),
		};
	}),
};

// suppress console warnings in tests
global.console.warn = vi.fn();
