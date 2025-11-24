---
"@omnidotdev/rdk": minor
---

Migrated the RDK state manager from React Context to Zustand for better performance, flexibility, and access outside of React contexts.

**Breaking Changes:**

- Replaced `XRContext` and `useXR` hook with Zustand store (`useXRStore`)
- Renamed types
  - `XRBackend` → `Backend`
  - `XRContextValue` → `ContextValue`

**New Library Exports:**

- `useXRStore`: Main Zustand store hook for full state access
- `getXRStore`: Non-React access to store state
- `subscribeToXRStore`: Non-React subscription to store changes
- `XRStore`, `XRStoreState`, `XRStoreActions`: TypeScript types

**Migration Guide:**

Replace `useXR()` with direct store selectors:

- `useXR().camera` → `useXRStore((state) => state.camera)`
- `useXR().backends` → `useXRStore((state) => state.backends)`
- Full store access: `useXRStore()` or `useXRStore(selector)`

Replace types:

- `XRBackend` → `Backend`
- `XRContextValue` → `ContextValue`
