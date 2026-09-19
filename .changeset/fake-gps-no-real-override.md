---
"@omnidotdev/rdk": patch
---

Do not start real GPS when a fake location is provided. Previously `startGps()` was always called even when `fakeLat`/`fakeLon` were set, so a real GPS fix would override the fake position; real GPS now starts only when no fake location is configured.
