---
"@omnidotdev/rdk": minor
---

Migrated the RDK state manager from React Context to Zustand.

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

**New Features:**

- Zustand-powered state management for better performance and flexibility
- Type-safe session management with `SESSION_TYPES` constants
- Non-React access to XR state for vanilla JS integration
- Centralized state management with single source of truth
- Enhanced session compatibility validation with typed error messages

**Migration Guide:**

Replace `useXR()` with direct store selectors:

- `useXR().camera` → `useXRStore((state) => state.camera)`
- `useXR().backends` → `useXRStore((state) => state.backends)`
- Full store access: `useXRStore()` or `useXRStore(selector)`
