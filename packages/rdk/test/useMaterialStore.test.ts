import { MeshBasicMaterial } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMaterialStore } from "../src/geolocation/useMaterialStore";

const { acquireMaterial, releaseMaterial } = useMaterialStore.getState();

beforeEach(() => {
  useMaterialStore.setState({ materialStore: new Map() });
});

describe("useMaterialStore", () => {
  it("creates a material once and reuses it for the same key", () => {
    const create = vi.fn(() => new MeshBasicMaterial());

    const first = acquireMaterial("red", create);
    const second = acquireMaterial("red", create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("creates separate materials for different keys", () => {
    const red = acquireMaterial("red", () => new MeshBasicMaterial());
    const blue = acquireMaterial("blue", () => new MeshBasicMaterial());

    expect(blue).not.toBe(red);
  });

  it("keeps a shared material alive until its last user releases it", () => {
    const material = acquireMaterial("red", () => new MeshBasicMaterial());
    acquireMaterial("red", () => new MeshBasicMaterial());
    const dispose = vi.spyOn(material, "dispose");

    releaseMaterial("red");

    expect(dispose).not.toHaveBeenCalled();
    expect(useMaterialStore.getState().materialStore.has("red")).toBe(true);

    releaseMaterial("red");

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(useMaterialStore.getState().materialStore.has("red")).toBe(false);
  });

  it("creates a fresh material after the previous one was disposed", () => {
    const first = acquireMaterial("red", () => new MeshBasicMaterial());
    releaseMaterial("red");

    const second = acquireMaterial("red", () => new MeshBasicMaterial());

    expect(second).not.toBe(first);
  });

  it("ignores releasing an unknown key", () => {
    expect(() => releaseMaterial("missing")).not.toThrow();
  });
});
