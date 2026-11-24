import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import VisionOverlay from "./VisionOverlay";

// Record the props the overlay hands its camera preview, without opening a camera
vi.mock("./CameraBackground", () => ({
  default: ({ mirrored }: { mirrored?: boolean }) => (
    <div data-testid="camera" data-mirrored={String(mirrored)} />
  ),
}));

vi.mock("./VisionStatus", () => ({ default: () => null }));

describe("VisionOverlay", () => {
  it("mirrors the camera preview by default", () => {
    const { getByTestId } = render(<VisionOverlay tasks={["faces"]} />);

    expect(getByTestId("camera").dataset.mirrored).toBe("true");
  });

  it("shows the camera preview unmirrored when mirrored is false", () => {
    const { getByTestId } = render(
      <VisionOverlay tasks={["faces"]} mirrored={false} />,
    );

    expect(getByTestId("camera").dataset.mirrored).toBe("false");
  });
});
