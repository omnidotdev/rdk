# RDK Natural-Feature Image Tracking Demo

Tracks an arbitrary reference image (a poster/card, not a fiducial marker) using
the RDK `image-tracking` module (MindAR under the hood) and anchors a 3D
supertorus to it.

## Run

```bash
bun install            # from the repo root
cd apps/image-tracking-demo
bun run dev
```

Open the printed URL (HTTPS via mkcert, required for camera access). Camera
access needs a secure context, so use `https://localhost:3000` on desktop or the
LAN `https://<your-ip>:3000` URL on a phone.

## Point the camera at a target

The target is `public/card.png`. Either:

- open `public/card.png` on a second screen and point your rear camera at it, or
- print it.

When the card is detected, the supertorus appears anchored to it and tracks as
you move the card or camera.

## Swap the target

Replace `public/card.mind` with your own compiled target and update
`imageTargetSrc` in `src/App.tsx`. Compile `.mind` files from any image with the
[MindAR image compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile).
`target={n}` on `ImageTrackingAnchor` selects which image in a multi-target
`.mind` file to anchor to.
