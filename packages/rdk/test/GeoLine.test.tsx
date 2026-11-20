import { Canvas } from "@react-three/fiber";
import { act, fireEvent, render } from "@testing-library/react";
import { Color } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeoLine } from "../src/geolocation";
import useGeolocationBackend from "../src/geolocation/useGeolocationBackend";
import { useMaterialStore } from "../src/geolocation/useMaterialStore";
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

const FAKE_LOCAR = {
  lonLatToWorldCoords: (lon: number, lat: number) => [lon, lat],
};

/**
 * Mock a ready geolocation backend and return its `registerAnchor` spy.
 */
const mockReadyBackend = () => {
  const registerAnchor = vi.fn();

  vi.mocked(useGeolocationBackend).mockReturnValue({
    isPending: false,
    isSuccess: true,
    registerAnchor,
    unregisterAnchor: vi.fn(),
  } as unknown as ReturnType<typeof useGeolocationBackend>);

  return registerAnchor;
};

/**
 * Attach every registered anchor, as the backend does on the first GPS fix.
 */
const attachAll = (registerAnchor: ReturnType<typeof vi.fn>) => {
  act(() => {
    for (const [, entry] of registerAnchor.mock.calls) {
      entry.onAttach(FAKE_LOCAR);
    }
  });
};

const cachedMaterials = () => [
  ...useMaterialStore.getState().materialStore.values(),
];

beforeEach(() => {
  clearGlobalMocks();
  useMaterialStore.setState({ materialStore: new Map() });
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

  it("forwards R3F event handlers to the line group", () => {
    const onClick = vi.fn();
    const onPointerDown = vi.fn();

    const { container } = render(
      <Canvas>
        <GeoLine
          coordinates={SAMPLE_ROUTE_COORDINATES}
          onClick={onClick}
          onPointerDown={onPointerDown}
        />
      </Canvas>,
    );

    const group = container.querySelector("group");

    expect(group).toBeTruthy();

    fireEvent.pointerDown(group as Element);
    fireEvent.click(group as Element);

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shares one material between lines with the same style", () => {
    const registerAnchor = mockReadyBackend();

    render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} color="#00ff00" />
        <GeoLine coordinates={SIMPLE_LINE_COORDINATES} color="#00ff00" />
      </Canvas>,
    );
    attachAll(registerAnchor);

    const cached = cachedMaterials();

    expect(cached).toHaveLength(1);
    expect(cached[0].refCount).toBe(2);
  });

  it("keeps a shared material alive when one of its lines unmounts", () => {
    const registerAnchor = mockReadyBackend();

    const { rerender } = render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} />
        <GeoLine coordinates={SIMPLE_LINE_COORDINATES} />
      </Canvas>,
    );
    attachAll(registerAnchor);

    const [{ material }] = cachedMaterials();
    const dispose = vi.spyOn(material, "dispose");

    rerender(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} />
      </Canvas>,
    );

    expect(dispose).not.toHaveBeenCalled();
    expect(cachedMaterials()).toHaveLength(1);
  });

  it("disposes a material once its last line unmounts", () => {
    const registerAnchor = mockReadyBackend();

    const { unmount } = render(
      <Canvas>
        <GeoLine coordinates={SAMPLE_ROUTE_COORDINATES} isDashed={true} />
      </Canvas>,
    );
    attachAll(registerAnchor);

    const [{ material }] = cachedMaterials();
    const dispose = vi.spyOn(material, "dispose");

    unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(cachedMaterials()).toHaveLength(0);
  });

  it("does not share materials between different `Color` instances", () => {
    const registerAnchor = mockReadyBackend();

    render(
      <Canvas>
        <GeoLine
          coordinates={SAMPLE_ROUTE_COORDINATES}
          color={new Color("red")}
        />
        <GeoLine
          coordinates={SIMPLE_LINE_COORDINATES}
          color={new Color("blue")}
        />
      </Canvas>,
    );
    attachAll(registerAnchor);

    expect(cachedMaterials()).toHaveLength(2);
  });
});
