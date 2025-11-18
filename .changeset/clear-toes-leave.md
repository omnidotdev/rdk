---
"@omnidotdev/rdk": patch
---

Fix anchor initialization by using `getLastKnownLocation()` (LocAR 0.1.4) to seed GPS data immediately instead of waiting for a new update. This ensures anchors are added to the scene reliably even when GPS arrives before anchor creation.
