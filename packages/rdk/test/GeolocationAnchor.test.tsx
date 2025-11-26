import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeolocationAnchor } from "../src/geolocation";
import { clearGlobalMocks } from "./mocks/globals.mock";

// Mock useXRStore specifically for component tests
vi.mock("engine/useXRStore", () => ({
  default: vi.fn((selector) => {
    const mockState = {
      video: null,
      backends: [],
      sessionTypes: new Set(),
      registerBackend: vi.fn().mockResolvedValue(undefined),
      unregisterBackend: vi.fn(),
      setVideo: vi.fn(),
      updateBackends: vi.fn(),
      isImmersive: false,
    };

    if (typeof selector === "function") {
      return selector(mockState);
    }
    return mockState;
  }),
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
    const mockOnAttached = vi.fn();
    const mockOnGpsUpdate = vi.fn();
    const props = {
      latitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.latitude,
      longitude: GOING_TO_THE_SUN_MONTAIN_COORDINATES.longitude,
      onAttached: mockOnAttached,
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
      <Canvas>
        <GeolocationAnchor {...props}>
          <mesh data-testid="full-test" />
        </GeolocationAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
