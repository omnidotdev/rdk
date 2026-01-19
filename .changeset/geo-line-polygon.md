---
"@omnidotdev/rdk": minor
---

Add `GeoLine` and `GeoPolygon` components for rendering paths and areas in AR space using lon/lat coordinates. These components complete the core GeoJSON geometry support:

- `GeoLine`: Renders lines (example use cases are roads, paths, routes) using Three.js `Line`s
- `GeoPolygon`: Renders filled polygons (zones, areas, boundaries) with optional holes

Both components accept GeoJSON-style coordinate arrays `[lon, lat, elevation?]` for direct compatibility with mapping APIs and the `locar-tiler` library.
