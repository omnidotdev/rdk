/**
 * Detect whether the current browser is running on iOS (iPhone, iPad, or iPod),
 * including iPadOS 13+ which reports a desktop macOS Safari user agent.
 *
 * Used by the geolocation backend to decide whether LocAR's device-orientation
 * control must be rebound from the `deviceorientationabsolute` event to the plain
 * `deviceorientation` event: only iOS Safari needs that rebind. Android/Chrome
 * delivers a correct absolute heading on `deviceorientationabsolute`, so rebinding
 * there drops absolute heading and rotates the AR scene (omnidotdev/rdk#140).
 *
 * @returns `true` when the platform is iOS, otherwise `false`.
 */
export const isIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent ?? "";

  // classic iPhone, iPad and iPod user agents
  if (/iP(hone|ad|od)/.test(userAgent)) return true;

  // iPadOS 13+ masquerades as desktop macOS Safari; a Mac user agent reporting a
  // touchscreen is an iPad rather than a Mac
  return userAgent.includes("Macintosh") && (navigator.maxTouchPoints ?? 0) > 1;
};
