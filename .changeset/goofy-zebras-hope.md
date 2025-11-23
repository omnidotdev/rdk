---
"@omnidotdev/rdk": minor
---

Migrated the RDK state manager from React Context to Zustand.

**Breaking Changes:**

- Removed `XRContext` and `useXR` hook - replaced with Zustand store
- `XRSessionProvider` no longer provides context, now only handles Three.js integration
- Session types are now strictly typed using `XRSessionType` union type
- `registerBackend` and `unregisterBackend` now accept `XRSessionType` instead of generic `string`

**New Library Exports:**

- `useXRStore` - Main Zustand store hook for full state access
- `useXRReady` - Hook for XR system ready state
- `useXRCamera` - Hook for camera source type
- `useXRVideo` - Hook for shared video element
- `useXRBackends` - Hook for active backends array
- `getXRStore` - Non-React access to store state
- `subscribeToXRStore` - Non-React subscription to store changes
- `XRStore`, `XRStoreState`, `XRStoreActions` - TypeScript types

**New Features:**

- Zustand-powered state management for better performance and flexibility
- Type-safe session management with `SESSION_TYPES` constants
- Non-React access to XR state for vanilla JS integration
- Centralized state management with single source of truth
- Enhanced session compatibility validation with typed error messages

**Migration Guide:**

Replace `useXR()` with specific hooks:

- `useXR().isReady` → `useXRReady()`
- `useXR().camera` → `useXRCamera()`
- `useXR().backends` → `useXRBackends()`
- Full store access: `useXRStore()` or `useXRStore(selector)`

Use typed session constants:

- `"FiducialSession"` → `SESSION_TYPES.FIDUCIAL`
- `"GeolocationSession"` → `SESSION_TYPES.GEOLOCATION`
