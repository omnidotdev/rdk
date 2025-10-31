import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { XRCanvas } from "../src/engine";
import { clearGlobalMocks } from "./mocks/globals.mock";

beforeEach(() => {
  clearGlobalMocks();
});

describe("XRCanvas", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <XRCanvas>
        <mesh />
      </XRCanvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("passes props to underlying Canvas", () => {
    const mockProps = {
      gl: { antialias: false },
    };

    const { getByTestId } = render(
      <XRCanvas {...mockProps}>
        <mesh />
      </XRCanvas>,
    );

    const canvas = getByTestId("xr-canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders children", () => {
    const { getByTestId } = render(
      <XRCanvas>
        <mesh data-testid="test-mesh" />
      </XRCanvas>,
    );

    expect(getByTestId("test-mesh")).toBeTruthy();
  });

  it("accepts AR-specific props", () => {
    const props = {
      isArEnabled: true,
      isTrackingEnabled: false,
      patternRatio: 0.8,
    };

    const { container } = render(
      <XRCanvas {...props}>
        <mesh />
      </XRCanvas>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
