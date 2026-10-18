---
"@omnidotdev/rdk": patch
---

fix(geolocation): only rebind device orientation to `deviceorientation` on iOS

The geolocation backend rebound LocAR's `DeviceOrientationControls` from the `deviceorientationabsolute` event to the plain `deviceorientation` event on every platform. That rebind is only needed on iOS Safari (which never fires `deviceorientationabsolute` and carries absolute heading via `webkitCompassHeading` on the plain event). On Android/Chrome `deviceorientationabsolute` already provides the correct absolute heading, so rebinding swapped it for the plain event's relative values and rotated the whole scene, leaving AR content off by roughly 90 degrees (#140). The rebind is now gated behind an `isIOS` platform check, so Android/Chrome keeps LocAR's default absolute-heading behavior.
