import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FiducialAnchor } from "../src/fiducial";
import { clearGlobalMocks } from "./mocks/globals.mock";

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

beforeEach(() => {
  clearGlobalMocks();
});

describe("FiducialAnchor", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Canvas>
        <FiducialAnchor patternUrl="test.patt">
          <mesh />
        </FiducialAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts pattern type and URL", () => {
    const mockCallback = vi.fn();
    const props = {
      type: "pattern" as const,
      patternUrl: "test-pattern.patt",
      onMarkerFound: mockCallback,
    };

    const { container } = render(
      <Canvas>
        <FiducialAnchor {...props}>
          <mesh />
        </FiducialAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts barcode type and value", () => {
    const mockCallback = vi.fn();
    const props = {
      type: "barcode" as const,
      barcodeValue: 123,
      onMarkerLost: mockCallback,
    };

    const { container } = render(
      <Canvas>
        <FiducialAnchor {...props}>
          <mesh />
        </FiducialAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("accepts unknown type", () => {
    const props = {
      type: "unknown" as const,
    };

    const { container } = render(
      <Canvas>
        <FiducialAnchor {...props}>
          <mesh />
        </FiducialAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("renders children", () => {
    const { getByTestId } = render(
      <Canvas>
        <FiducialAnchor patternUrl="test.patt">
          <mesh data-testid="test-child" />
        </FiducialAnchor>
      </Canvas>,
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
      <Canvas>
        <FiducialAnchor {...props}>
          <mesh />
        </FiducialAnchor>
      </Canvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
