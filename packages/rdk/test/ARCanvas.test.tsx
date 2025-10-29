import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { XRCanvas } from "../src/engine";

// mock `@react-three/fiber`
vi.mock("@react-three/fiber", () => ({
	Canvas: ({ children, ...props }: any) => (
		<div data-testid="xr-canvas" {...props}>
			{children}
		</div>
	),
}));

// mock `XRSessionProvider`
vi.mock("../src/engine/XRSessionProvider", () => ({
	default: ({ children }: any) => <div>{children}</div>,
}));

// mock AR.js globals
beforeEach(() => {
	vi.clearAllMocks();
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
	};
});

describe("XRCanvas", () => {
	it("renders without crashing", () => {
		const { container } = render(
			<XRCanvas>
				<mesh />
			</XRCanvas>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("passes props to underlying Canvas", () => {
		const mockProps = {
			gl: { antialias: false },
		};

		const { getByTestId } = render(
			<XRCanvas {...mockProps}>
				<mesh />
			</XRCanvas>,
		);

		const canvas = getByTestId("xr-canvas");
		expect(canvas).toBeTruthy();
	});

	it("renders children", () => {
		const { getByTestId } = render(
			<XRCanvas>
				<mesh data-testid="test-mesh" />
			</XRCanvas>,
		);

		expect(getByTestId("test-mesh")).toBeTruthy();
	});

	it("accepts AR-specific props", () => {
		const props = {
			isArEnabled: true,
			isTrackingEnabled: false,
			patternRatio: 0.8,
		};

		const { container } = render(
			<XRCanvas {...props}>
				<mesh />
			</XRCanvas>,
		);

		expect(container.firstChild).toBeTruthy();
	});
});
