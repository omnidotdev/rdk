import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarkerAnchor } from "../src/engine";

vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn(),
	useThree: () => ({
		scene: { add: vi.fn(), remove: vi.fn() },
		camera: {},
		gl: { domElement: document.createElement("canvas") },
	}),
}));

vi.mock("../src/engine/XRSessionProvider", () => ({
	useXRSessionProvider: () => ({
		arToolkitContext: {
			_arMarkersControls: [],
		},
	}),
}));

vi.mock("@ar-js-org/ar.js/three.js/build/ar-threex", () => ({
	ArMarkerControls: vi.fn().mockImplementation(() => ({})),
}));

beforeEach(() => {
	global.THREE = {
		Group: vi.fn(),
	};
});

describe("MarkerAnchor", () => {
	it("renders without crashing", () => {
		const { container } = render(
			<MarkerAnchor type="pattern" patternUrl="test.patt">
				<mesh />
			</MarkerAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts pattern type and URL", () => {
		const props = {
			type: "pattern" as const,
			patternUrl: "test-pattern.patt",
			onMarkerFound: vi.fn(),
		};

		const { container } = render(
			<MarkerAnchor {...props}>
				<mesh />
			</MarkerAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts barcode type and value", () => {
		const props = {
			type: "barcode" as const,
			barcodeValue: 123,
			onMarkerLost: vi.fn(),
		};

		const { container } = render(
			<MarkerAnchor {...props}>
				<mesh />
			</MarkerAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts unknown type", () => {
		const props = {
			type: "unknown" as const,
		};

		const { container } = render(
			<MarkerAnchor {...props}>
				<mesh />
			</MarkerAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("renders children", () => {
		const { getByTestId } = render(
			<MarkerAnchor type="pattern" patternUrl="test.patt">
				<mesh data-testid="test-child" />
			</MarkerAnchor>,
		);

		expect(getByTestId("test-child")).toBeTruthy();
	});

	it("accepts additional parameters", () => {
		const props = {
			type: "pattern" as const,
			patternUrl: "test.patt",
			params: { smooth: true, size: 1 },
		};

		const { container } = render(
			<MarkerAnchor {...props}>
				<mesh />
			</MarkerAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});
});
