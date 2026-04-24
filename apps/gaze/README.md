# InterAACtionGaze

Eye-tracking calibration tool that compensates the offset between where the
user looks and where they intend to look.

## Upstream

<https://github.com/AFSR/InterAACtionGaze>

## Status

Not yet integrated. Plan:

1. Fork `AFSR/InterAACtionGaze` under AFSR.
2. Evaluate how much of the calibration pipeline runs in the browser
   versus the [companion app](../../companion/). The upstream talks
   directly to a Tobii device via native drivers; on the web we need
   either:
   - a WebSocket bridge from the companion app (high-precision path), or
   - WebGazer.js with a per-user recalibration flow (webcam fallback).
3. Build in CI and publish to `/apps/gaze/` on `interaactionweb.afsr.fr`.

## Notes for the web build

- Tobii does not ship an official Web SDK. The high-precision path
  therefore requires the companion app.
- Do not ship the current upstream "CORS Unblock" extension workaround.
  A single-origin deploy removes the need for it.
