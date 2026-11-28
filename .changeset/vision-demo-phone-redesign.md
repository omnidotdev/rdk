---
"rdk-vision-demo": minor
---

Redesign the vision demo for phones

The demo has a new interface with the camera filling the screen, a mode switcher at the bottom, and a status badge that says what it is looking for. A button flips between the front and rear cameras, and the debug panel shows detection rate, model time, page frame rate, and recent warnings. Objects and Segment run on the GPU by default on phones and start on the rear camera, and the camera asks for 60 fps so dim rooms no longer drop the preview to 15 fps
