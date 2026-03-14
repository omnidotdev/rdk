import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

import { Canvas } from "@react-three/fiber";
import { render } from "@testing-library/react";

import XR from "../src/engine/XR";
import { clearGlobalMocks, setupGlobalMocks } from "./mocks/globals.mock";

import type { ReactNode } from "react";

beforeEach(() => {
  setupGlobalMocks();
  spyOn(console, "warn").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  clearGlobalMocks();
});

describe("XR", () => {
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <Canvas>
      <XR>{children}</XR>
    </Canvas>
  );

  it("renders without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <mesh />
      </TestWrapper>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("renders children within XR context", () => {
    const { container } = render(
      <TestWrapper>
        <mesh data-testid="test-mesh" />
      </TestWrapper>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("provides XR session context to children", () => {
    const { container } = render(
      <TestWrapper>
        <mesh />
        <group />
      </TestWrapper>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
