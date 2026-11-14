import { Canvas } from "@react-three/fiber";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeoPolygon } from "../src/geolocation";
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

// Sample triangle polygon (Montana, USA area)
const SAMPLE_TRIANGLE_COORDINATES: Array<[number, number, number?]> = [
  [-113.6363, 48.6895, 0],
  [-113.6373, 48.6905, 10],
  [-113.6353, 48.6905, 5],
];

// Sample square polygon
const SAMPLE_SQUARE_COORDINATES: Array<[number, number]> = [
  [-113.6363, 48.6895],
  [-113.6373, 48.6895],
  [-113.6373, 48.6905],
  [-113.6363, 48.6905],
];

// Sample polygon with a hole
const SAMPLE_OUTER_RING: Array<[number, number]> = [
  [-113.64, 48.69],
  [-113.63, 48.69],
  [-113.63, 48.7],
  [-113.64, 48.7],
];

const SAMPLE_HOLE: Array<[number, number]> = [
  [-113.638, 48.693],
  [-113.632, 48.693],
  [-113.632, 48.697],
  [-113.638, 48.697],
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
 * Attach every anchor registered since the last call, as the backend does on
 * the first GPS fix
 */
const attachPending = (registerAnchor: ReturnType<typeof vi.fn>) => {
  act(() => {
    for (const [, entry] of registerAnchor.mock.calls) {
      if (!entry.isAttached) {
        entry.isAttached = true;
        entry.onAttach(FAKE_LOCAR);
      }
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

describe("GeoPolygon", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts coordinates prop with elevation", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts coordinates prop without elevation", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_SQUARE_COORDINATES} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts holes prop", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_OUTER_RING} holes={[SAMPLE_HOLE]} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts color prop", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} color="#00ff00" />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts opacity prop", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} opacity={0.5} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts isWireframe prop", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon
          coordinates={SAMPLE_TRIANGLE_COORDINATES}
          isWireframe={true}
        />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts side prop", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} side="front" />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles empty coordinates array", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={[]} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles insufficient coordinates (less than 3 points)", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon
          coordinates={[
            [-113.6363, 48.6895],
            [-113.6373, 48.6905],
          ]}
        />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("handles negative coordinates (Southern/Western hemispheres)", () => {
    // Machu Picchu area coordinates
    const negativeCoordinates: Array<[number, number]> = [
      [-72.5451, -13.163],
      [-72.5461, -13.163],
      [-72.5461, -13.164],
      [-72.5451, -13.164],
    ];

    const { container } = render(
      <Canvas>
        <GeoPolygon coordinates={negativeCoordinates} />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts all optional props together", () => {
    const { container } = render(
      <Canvas>
        <GeoPolygon
          coordinates={SAMPLE_OUTER_RING}
          holes={[SAMPLE_HOLE]}
          color="#ff00ff"
          opacity={0.7}
          isWireframe={false}
          side="double"
        />
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("forwards R3F event handlers to the polygon mesh", () => {
    const registerAnchor = vi.fn();

    vi.mocked(useGeolocationBackend).mockReturnValue({
      isPending: false,
      isSuccess: true,
      registerAnchor,
      unregisterAnchor: vi.fn(),
    } as unknown as ReturnType<typeof useGeolocationBackend>);

    const onClick = vi.fn();
    const onPointerDown = vi.fn();

    const { container } = render(
      <Canvas>
        <GeoPolygon
          coordinates={SAMPLE_TRIANGLE_COORDINATES}
          onClick={onClick}
          onPointerDown={onPointerDown}
        />
      </Canvas>,
    );

    // the mesh only mounts once the backend attaches the anchor
    const { onAttach } = registerAnchor.mock.calls[0][1];

    act(() => {
      onAttach({
        lonLatToWorldCoords: (lon: number, lat: number) => [lon, lat],
      });
    });

    const mesh = container.querySelector("mesh");

    expect(mesh).toBeTruthy();

    fireEvent.pointerDown(mesh as Element);
    fireEvent.click(mesh as Element);

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disposes its material on unmount", () => {
    const registerAnchor = mockReadyBackend();

    const { unmount } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} />
      </Canvas>,
    );
    attachPending(registerAnchor);

    const [{ material }] = cachedMaterials();
    const dispose = vi.spyOn(material, "dispose");

    unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(cachedMaterials()).toHaveLength(0);
  });

  it("releases the old material when its style changes", () => {
    const registerAnchor = mockReadyBackend();

    const { rerender } = render(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} color="red" />
      </Canvas>,
    );
    attachPending(registerAnchor);

    rerender(
      <Canvas>
        <GeoPolygon coordinates={SAMPLE_TRIANGLE_COORDINATES} color="blue" />
      </Canvas>,
    );
    attachPending(registerAnchor);

    const cached = cachedMaterials();

    expect(cached).toHaveLength(1);
    expect(cached[0].refCount).toBe(1);
  });
});
