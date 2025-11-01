import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeolocationAnchor } from "../src/geolocation";
import { clearGlobalMocks } from "./mocks/globals.mock";

beforeEach(() => {
	clearGlobalMocks();
});

describe("GeolocationAnchor", () => {
	it("renders without crashing", () => {
		const { container } = render(
			<GeolocationAnchor latitude={40.7128} longitude={-74.006}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts required latitude and longitude props", () => {
		const props = {
			latitude: 44.97543728276179,
			longitude: -124.01307000561442,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts optional altitude prop", () => {
		const props = {
			latitude: 40.7128,
			longitude: -74.006,
			altitude: 100,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts billboard configuration", () => {
		const props = {
			latitude: 40.7128,
			longitude: -74.006,
			isBillboard: false,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts GPS event callbacks", () => {
		const mockOnAttached = vi.fn();
		const mockOnGpsUpdate = vi.fn();
		const props = {
			latitude: 40.7128,
			longitude: -74.006,
			onAttached: mockOnAttached,
			onGpsUpdate: mockOnGpsUpdate,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("renders children", () => {
		const { getByTestId } = render(
			<GeolocationAnchor latitude={0} longitude={0}>
				<mesh data-testid="test-child" />
			</GeolocationAnchor>,
		);

		expect(getByTestId("test-child")).toBeTruthy();
	});

	it("accepts debug mesh configuration", () => {
		const props = {
			latitude: 40.7128,
			longitude: -74.006,
			showDebugMesh: true,
			debugOffsetMeters: 10,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("handles negative coordinates", () => {
		const props = {
			// Sydney coordinates
			latitude: -33.8688,
			longitude: 151.2093,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts all optional props together", () => {
		const mockOnAttached = vi.fn();
		const mockOnGpsUpdate = vi.fn();
		const props = {
			// London coordinates
			latitude: 51.5074,
			longitude: -0.1278,
			altitude: 50,
			isBillboard: true,
			onAttached: mockOnAttached,
			onGpsUpdate: mockOnGpsUpdate,
			showDebugMesh: true,
			debugOffsetMeters: 5,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh data-testid="full-test" />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});
});
