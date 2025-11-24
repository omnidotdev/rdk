---
"@omnidotdev/rdk": minor
---

**Breaking Change:** Renamed and moved XR-specific types to general spatial computing types as RDK evolves into a comprehensive spatial SDK:

**Type Renames:**

- `XRBackend` → `Backend`
- `XRContextValue` → `ContextValue`
- `XRBackendInitArgs` → `BackendInitArgs`

**Migration Guide:**

Replace XR-specific imports:

```diff
- import type { XRBackend, XRContextValue } from "@omnidotdev/rdk";
+ import type { Backend, ContextValue } from "@omnidotdev/rdk";
```

**Rationale:**
These types represent general spatial computing concepts, not XR-specific functionality. The rename aligns with RDK's evolution into a broader spatial SDK supporting future spatial computing capabilities beyond traditional XR.
