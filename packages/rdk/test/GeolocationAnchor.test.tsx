import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeolocationAnchor } from "../src/geolocation";
import { clearGlobalMocks } from "./mocks/globals.mock";

const GOING_TO_THE_SUN_MONTAIN_COORDINATES = {
		latitude: 48.68951980519457,
		longitude: -113.6363247804274,
	} as const,
	MACHU_PICCHU_COORDINATES = {
		latitude: -13.163068158989277,
		longitude: -72.5451171875,
	} as const;

beforeEach(() => {
	clearGlobalMocks();
});

describe("GeolocationAnchor", () => {
	it("renders without crashing", () => {
		const { container } = render(
			<GeolocationAnchor
				latitude={GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude}
				longitude={GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude}
			>
				<mesh />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});

	it("accepts required latitude and longitude props", () => {
		const props = {
			latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
			longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
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
			latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
			longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
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
			latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
			longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
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
			latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
			longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
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

	it("handles negative coordinates", () => {
		const props = {
			latitude: MACHU_PICCHU_COORDINATES.latitude,
			longitude: MACHU_PICCHU_COORDINATES.longitude,
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
			latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
			longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
			altitude: 50,
			isBillboard: true,
			onAttached: mockOnAttached,
			onGpsUpdate: mockOnGpsUpdate,
		};

		const { container } = render(
			<GeolocationAnchor {...props}>
				<mesh data-testid="full-test" />
			</GeolocationAnchor>,
		);

		expect(container.firstChild).toBeTruthy();
	});
});
