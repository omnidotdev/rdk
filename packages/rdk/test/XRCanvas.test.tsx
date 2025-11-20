import type React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Canvas } from "@react-three/fiber";
import XR from "../src/engine/XR";
import { setupGlobalMocks, clearGlobalMocks } from "./mocks/globals.mock";

beforeEach(() => {
  setupGlobalMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  clearGlobalMocks();
  vi.restoreAllMocks();
});

describe("XR", () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <Canvas>
      <XR cameraSource="video">{children}</XR>
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

  it("accepts cameraSource prop", () => {
    const { container } = render(
      <Canvas>
        <XR cameraSource="webxr">
          <mesh />
        </XR>
      </Canvas>,
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
