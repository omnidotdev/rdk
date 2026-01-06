import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeolocationAnchor } from "../src/geolocation";
import { clearGlobalMocks } from "./mocks/globals.mock";

vi.mock("../src/geolocation/useGeolocationBackend", () => ({
  default: vi.fn(() => ({
    isPending: true,
    isSuccess: false,
    locar: null,
    webcam: null,
    deviceOrientation: null,
    scene: null,
    camera: null,
    lastPosition: null,
    registerAnchor: vi.fn(),
    unregisterAnchor: vi.fn(),
    getAnchor: vi.fn(),
  })),
}));

const GOING_TO_THE_SUN_MONTAIN_COORDINATES = {
    latitude: 48.68951980519457,
    longitude: -113.6363247804274,
  } as const,
  MACHU_PICCHU_COORDINATES = {
    latitude: -13.16306815898927,
    longitude: -72.5451171875,
  } as const;

beforeEach(() => {
  clearGlobalMocks();
});

describe("GeolocationAnchor", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Canvas>
        <GeolocationAnchor
          latitude={GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude}
          longitude={GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude}
        >
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts required latitude and longitude props", () => {
    const props = {
      latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
      longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
    };

    const { container } = render(
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
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
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
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
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts GPS event callbacks", () => {
    const mockOnAttach = vi.fn();
    const mockOnGpsUpdate = vi.fn();
    const props = {
      latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
      longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
      onAttach: mockOnAttach,
      onGpsUpdate: mockOnGpsUpdate,
    };

    const { container } = render(
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("renders children", () => {
    const { getByTestId } = render(
      <Canvas>
        <GeolocationAnchor latitude={0} longitude={0}>
          <mesh data-testid="test-child" />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(getByTestId("test-child")).toBeTruthy();
  });

  it("handles negative coordinates", () => {
    const props = {
      latitude: MACHU_PICCHU_COORDINATES.latitude,
      longitude: MACHU_PICCHU_COORDINATES.longitude,
    };

    const { container } = render(
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts all optional props together", () => {
    const mockOnAttach = vi.fn();
    const mockOnGpsUpdate = vi.fn();
    const props = {
      latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
      longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
      altitude: 50,
      isBillboard: true,
      onAttach: mockOnAttach,
      onGpsUpdate: mockOnGpsUpdate,
    };

    const { container } = render(
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh data-testid="full-test" />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
