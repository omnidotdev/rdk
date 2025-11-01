import { describe, it, expect } from "vitest";
import { GeolocationAnchor } from "../src/geolocation";

describe("GeolocationAnchor", () => {
	it("exports GeolocationAnchor component", () => {
		expect(GeolocationAnchor).toBeDefined();
		expect(typeof GeolocationAnchor).toBe("function");
	});

	it("has correct component name", () => {
		expect(GeolocationAnchor.name).toBe("GeolocationAnchor");
	});

	it("has correct function signature", () => {
		expect(GeolocationAnchor.length).toBe(1);
	});

	it("is a valid React component function", () => {
		// basic smoke test: component exists and is callable
		expect(typeof GeolocationAnchor).toBe("function");
		expect(GeolocationAnchor.prototype).toBeUndefined();
	});
});
