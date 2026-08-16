---
"@omnidotdev/rdk": patch
---

feat(geolocation): add `opacity` prop to `GeoLine`

Adds an `opacity` prop (default `1`) to `GeoLine`, applied to both the default triangle-strip mesh and the dashed `Line2` fallback. The material is only marked `transparent` when `opacity < 1`, so fully opaque lines keep their existing render path.
