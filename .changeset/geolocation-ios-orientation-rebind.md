---
"@omnidotdev/rdk": patch
---

fix(geolocation): stop rebinding device orientation to `deviceorientation`

The geolocation backend rebound LocAR's `DeviceOrientationControls` from the `deviceorientationabsolute` event to the plain `deviceorientation` event. On Android/Chrome `deviceorientationabsolute` already provides the correct absolute heading, so the rebind swapped it for the plain event's relative values and rotated the whole scene, leaving AR content off by roughly 90 degrees (#140). The rebind was originally added for iOS, but iOS tracks heading correctly on the default event too (verified on-device), so it is removed entirely and every platform now uses LocAR's default `deviceorientationabsolute` binding.
