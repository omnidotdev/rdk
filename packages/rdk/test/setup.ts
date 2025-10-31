import "@testing-library/jest-dom";
import { vi } from "vitest";
import { setupGlobalMocks } from "./mocks/globals.mock";

// set up all global mocks
setupGlobalMocks();

// mock module dependencies
vi.mock("@react-three/fiber");
vi.mock("@ar-js-org/ar.js/three.js/build/ar-threex");
vi.mock(
	"../src/engine/XRSessionProvider",
	() => import("./mocks/XRSessionProvider.mock"),
);
