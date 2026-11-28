# rdk-vision-demo

## 0.1.0

### Minor Changes

- [#165](https://github.com/omnidotdev/rdk/pull/165) [`50cc847`](https://github.com/omnidotdev/rdk/commit/50cc847c24f1607793e306481a31f1b9fd173c32) Thanks [@coopbri](https://github.com/coopbri)! - Redesign the vision demo for phones
  
  The demo has a new interface with the camera filling the screen, a mode switcher at the bottom, and a status badge that says what it is looking for. A button flips between the front and rear cameras, and the debug panel shows detection rate, model time, page frame rate, and recent warnings. Objects and Segment run on the GPU by default on phones and start on the rear camera, and the camera asks for 60 fps so dim rooms no longer drop the preview to 15 fps

### Patch Changes

- Updated dependencies [[`21fbec7`](https://github.com/omnidotdev/rdk/commit/21fbec7d2302572027fee5666b79ca7452c9276b), [`21fbec7`](https://github.com/omnidotdev/rdk/commit/21fbec7d2302572027fee5666b79ca7452c9276b), [`ecd6767`](https://github.com/omnidotdev/rdk/commit/ecd6767e1cb2936d40763f34fd8cf70865840cee), [`21fbec7`](https://github.com/omnidotdev/rdk/commit/21fbec7d2302572027fee5666b79ca7452c9276b)]:
  - @omnidotdev/rdk@0.17.0

## 0.0.3

### Patch Changes

- Updated dependencies [[`8b870a5`](https://github.com/omnidotdev/rdk/commit/8b870a5ce26d32d141299083bf6274111ed6f1ab)]:
  - @omnidotdev/rdk@0.12.1

## 0.0.2

### Patch Changes

- Updated dependencies [[`62280ca`](https://github.com/omnidotdev/rdk/commit/62280cae627bc2ebbb43473722de6cc1c396cde9)]:
  - @omnidotdev/rdk@0.12.0

## 0.0.1

### Patch Changes

- Updated dependencies [[`016b31e`](https://github.com/omnidotdev/rdk/commit/016b31e49d3e15060882d3df5d6f4dbe083562ed)]:
  - @omnidotdev/rdk@0.11.0
