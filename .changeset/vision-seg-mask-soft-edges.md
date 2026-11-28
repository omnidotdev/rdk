---
"@omnidotdev/rdk": patch
---

Segmentation masks now fade out over their edges instead of stepping, so they stay smooth when scaled up to the camera view

Mask cells were either fully on or fully off, which drew a mask as visible stair steps on a phone screen. Values near the edge are now partial alpha. To keep a hard cutout, treat `>= 128` as inside, which matches the previous cutoff
