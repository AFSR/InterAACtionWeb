# @afsr/gaze-client

Unified gaze-tracking façade for the InterAACtion web suite. Exposes a
single `startGazeTracking()` entry point that hides the two possible
backends:

1. **Tobii eye-tracker** via the Tauri companion (when installed) —
   precision-grade tracking that needs dedicated hardware and the
   companion's loopback WebSocket bridge.
2. **WebGazer.js** — webcam-based fallback that works on any browser
   with no install. Precision is around 4° (~70 px at 60 cm), so
   calibration is mandatory.

The client probes the companion for ~1.2 s; if it does not answer, it
falls back to WebGazer. Callers never need to branch.

## Served locations

At deploy time, `scripts/build.sh` mounts this package under
`/gaze-client/` on the portal:

```
/gaze-client/afsr-gaze.umd.js        UMD build for <script>
/gaze-client/afsr-gaze.esm.js        ES module
/gaze-client/index.d.ts              TypeScript types
/gaze-client/vendor/webgazer.js      WebGazer.js runtime (1.9 MB)
/gaze-client/vendor/mediapipe/...    MediaPipe face-mesh assets (17 MB)
```

The vendor bundle is the output of `npm run build` in the
[AFSR/WebGazer](https://github.com/AFSR/WebGazer) fork. To refresh it,
rebuild the fork and copy `dist/webgazer.js` + `dist/mediapipe/` back
into `packages/gaze-client/vendor/` (a CI workflow will automate this
once we need it).

## Usage from an app

```html
<script src="/gaze-client/afsr-gaze.umd.js"></script>
<script>
  AFSRGaze.startGazeTracking({
    onGaze: (p) => {
      // p.x, p.y in CSS pixels, p.source === 'tobii' | 'webgazer'
      window.dispatchEvent(new CustomEvent('afsr-gaze', { detail: p }));
    },
    onStatus: (s) => console.log('gaze status:', s),
  });
</script>
```

Apps that already have their own gaze plumbing (GazePlay-web with
GazeCloudAPI, for instance) should skip this and keep their native
path; nothing forces dual wiring.

## Calibration

Driven by the portal, not this package. The calibration UI shows a
target, waits for the user to dwell on it, and calls
`session.teachPoint(x, y)` for each landed point. Tobii sessions
accept `teachPoint` as a no-op and stay uncalibrated (the Tobii device
is calibrated out-of-band via its own desktop tool).

## Local build

```bash
cd packages/gaze-client
npm install
npm run build
```

Produces `dist/afsr-gaze.umd.js`, `dist/afsr-gaze.esm.js`, and
`dist/index.d.ts`. Both JS bundles are ~5 KB each — the bulk of the
runtime weight is in the vendored WebGazer + MediaPipe assets.

## License

GPL-3.0-or-later, aligned with both this repo and upstream WebGazer.
