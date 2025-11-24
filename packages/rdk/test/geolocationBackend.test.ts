import { describe, expect, it } from "vitest";

import createGeolocationBackend from "../src/geolocation/geolocationBackend";

import type { GeolocationSessionOptions } from "../src/geolocation/geolocationBackend";

describe("geolocationBackend", () => {
  it("exports createGeolocationBackend function", () => {
    expect(createGeolocationBackend).toBeDefined();
    expect(typeof createGeolocationBackend).toBe("function");
  });

  it("creates a backend instance", () => {
    const backend = createGeolocationBackend({});
    expect(backend).toBeTruthy();
    expect(typeof backend.init).toBe("function");
    expect(typeof backend.update).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");
  });

  it("accepts session options", () => {
    const options: GeolocationSessionOptions = {
      fakeLat: 40.7128,
      fakeLon: -74.006,
      webcamConstraints: { video: { facingMode: "user" } },
    };

    const backend = createGeolocationBackend(options);
    expect(backend).toBeTruthy();
  });

  it("handles empty options", () => {
    const backend = createGeolocationBackend(undefined);
    expect(backend).toBeTruthy();
  });

  it("handles null options", () => {
    const backend = createGeolocationBackend(null);
    expect(backend).toBeTruthy();
  });

  it("has correct method signatures", () => {
    const backend = createGeolocationBackend({});

    expect(typeof backend.init).toBe("function");
    expect(typeof backend.update).toBe("function");
    expect(typeof backend.dispose).toBe("function");
    expect(typeof backend.getInternal).toBe("function");

    // check method arity
    expect(backend.init.length).toBe(1);
    expect(backend.update.length).toBe(0);
    expect(backend.dispose.length).toBe(0);
    expect(backend.getInternal.length).toBe(0);
  });

  it("validates session options interface", () => {
    // test valid options don't throw during creation
    const validOptions: GeolocationSessionOptions = {
      fakeLat: 40.7128,
      fakeLon: -74.006,
    };

    expect(() => createGeolocationBackend(validOptions)).not.toThrow();

    const validOptionsWithWebcam: GeolocationSessionOptions = {
      webcamConstraints: { video: { facingMode: "environment" } },
    };

    expect(() =>
      createGeolocationBackend(validOptionsWithWebcam),
    ).not.toThrow();

    const emptyOptions: GeolocationSessionOptions = {};
    expect(() => createGeolocationBackend(emptyOptions)).not.toThrow();
  });
});
