---
"@omnistrate/rdk": minor
---

Add status flags to backend hooks for safe destructuring.

`useGeolocationBackend()` and `useFiducialBackend()` now return an object with `isPending` and `isSuccess` boolean flags instead of returning `null` on first render. This enables safe destructuring without null checks:

```tsx
// before (crashed on first render)
const geo = useGeolocationBackend();
const locar = geo?.locar;

// after (safe destructuring)
const { locar, isPending, isSuccess } = useGeolocationBackend();

if (isSuccess && locar) {
  const worldCoords = locar.lonLatToWorldCoords(lon, lat);
}
```

New exported types: `GeolocationBackendState`, `FiducialBackendState`
