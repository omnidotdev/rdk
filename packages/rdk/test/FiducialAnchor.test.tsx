import { beforeEach, describe, expect, it, mock } from "bun:test";

import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";

import { clearGlobalMocks } from "./mocks/globals.mock";

mock.module("@ar-js-org/ar.js/three.js/build/ar-threex", () => ({
  ArToolkitSource: class {},
  ArToolkitContext: class {},
  ArMarkerControls: class {},
}));

mock.module("../src/fiducial/useFiducialBackend", () => ({
  default: mock(() => ({
    isPending: true,
    isSuccess: false,
    arSource: null,
    arContext: null,
  })),
}));

import { FiducialAnchor } from "../src/fiducial";

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
    const mockCallback = mock();
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
    const mockCallback = mock();
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
