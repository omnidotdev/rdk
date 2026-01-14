import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeoLine } from "../src/geolocation";
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

// Sample route: Going-to-the-Sun Road segment (Montana, USA)
const SAMPLE_ROUTE_COORDINATES: Array<[number, number, number?]> = [
  [-113.6363, 48.6895, 0],
  [-113.6373, 48.6905, 10],
  [-113.6383, 48.6915, 20],
];

// Simple two-point line
const SIMPLE_LINE_COORDINATES: Array<[number, number]> = [
  [-113.6363, 48.6895],
  [-113.6373, 48.6905],
];

beforeEach(() => {
  clearGlobalMocks();
});

describe("GeoLine", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts coordinates prop with elevation", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts coordinates prop without elevation", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={SIMPLE_LINE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts color prop", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} color="#00ff00" />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts dashed line props", () => {
    const { container } = render(
      <Canvas>
        <GeoLine
          coordinates={SAMPLE_ROUTE_COORDINATES}
          isDashed={true}
          dashSize={3}
          gapSize={1}
        />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles empty coordinates array", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={[]} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles single coordinate (less than 2 points)", () => {
    const { container } = render(
      <Canvas>
        <GeoLine coordinates={[[-113.6363, 48.6895]]} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles negative coordinates (Southern/Western hemispheres)", () => {
    // Machu Picchu area coordinates
    const negativeCoordinates: Array<[number, number]> = [
      [-72.5451, -13.163],
      [-72.5461, -13.164],
    ];

    const { container } = render(
      <Canvas>
        <GeoLine coordinates={negativeCoordinates} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts all optional props together", () => {
    const { container } = render(
      <Canvas>
        <GeoLine
          coordinates={SAMPLE_ROUTE_COORDINATES}
          color="#ff00ff"
          isDashed={true}
          dashSize={2}
          gapSize={0.5}
        />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
