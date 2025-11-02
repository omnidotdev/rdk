import "@testing-library/jest-dom";
import { vi } from "vitest";
import { createElement } from "react";
import { setupGlobalMocks } from "./mocks/globals.mock";

// set up all global mocks
setupGlobalMocks();

// mock module dependencies
vi.mock("@react-three/fiber", () => {
	return {
		useFrame: vi.fn(),
		useThree: vi.fn(() => ({
			camera: {
				position: { x: 0, y: 0, z: 0 },
				lookAt: vi.fn(),
			},
			scene: {
				add: vi.fn(),
				remove: vi.fn(),
			},
		})),
		createPortal: vi.fn((children) => children),
		Canvas: vi.fn(({ children, ...props }) =>
			createElement("div", { "data-testid": "xr-canvas", ...props }, children),
		),
	};
});
vi.mock("@ar-js-org/ar.js/three.js/build/ar-threex");
vi.mock("locar", () => ({
	LocationBased: vi.fn().mockImplementation(() => ({
		scene: null,
		camera: null,
		add: vi.fn(),
		remove: vi.fn(),
		startGps: vi.fn().mockReturnValue(true),
		stopGps: vi.fn().mockReturnValue(true),
		fakeGps: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
	})),
	Webcam: vi.fn().mockImplementation(() => ({
		texture: null,
		on: vi.fn(),
		dispose: vi.fn(),
	})),
	DeviceOrientationControls: vi.fn().mockImplementation(() => ({
		enabled: true,
		on: vi.fn(),
		init: vi.fn(),
		connect: vi.fn(),
		disconnect: vi.fn(),
		update: vi.fn(),
		dispose: vi.fn(),
	})),
}));
vi.mock(
	"../src/engine/XRSessionProvider",
	() => import("./mocks/XRSessionProvider.mock"),
);
