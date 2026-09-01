---
"@omnidotdev/rdk": patch
---

feat(geolocation): add pointer event handlers to `GeoLine` and `GeoPolygon`

Adds optional `onClick`, `onPointerOver`, and `onPointerOut` props to `GeoLine` and `GeoPolygon`, forwarded to the underlying R3F scene object. Handlers receive a `ThreeEvent<MouseEvent>` (click) or `ThreeEvent<PointerEvent>` (pointer over/out). When a handler is omitted the element stays non-interactive and is not registered for pointer raycasting, so existing scenes keep their current behavior and cost.
