import { describe, expect, it } from "vitest";

import { isIOS } from "../src/geolocation/isIOS";

/**
 * Override the jsdom navigator for a single assertion. The properties are
 * defined as configurable so `restoreMocks` and the next test can replace them.
 */
const setNavigator = (userAgent: string, maxTouchPoints = 0) => {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
    value: maxTouchPoints,
    configurable: true,
  });
};

describe("isIOS", () => {
  it("detects an iPhone", () => {
    setNavigator(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    expect(isIOS()).toBe(true);
  });

  it("detects a classic iPad", () => {
    setNavigator(
      "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
    );
    expect(isIOS()).toBe(true);
  });

  it("detects an iPadOS 13+ device that reports a desktop Safari user agent", () => {
    setNavigator(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      5,
    );
    expect(isIOS()).toBe(true);
  });

  it("does not flag a desktop Mac without a touchscreen", () => {
    setNavigator(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      0,
    );
    expect(isIOS()).toBe(false);
  });

  it("does not flag an Android Chrome device", () => {
    setNavigator(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      5,
    );
    expect(isIOS()).toBe(false);
  });
});
