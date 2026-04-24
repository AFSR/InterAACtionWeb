# InterAACtion Companion

Optional native app that relays gaze coordinates from a local Tobii
eye-tracker to the browser via a local WebSocket, so the web portal can
reach high-precision eye-tracking without a Web SDK (Tobii does not ship
one).

Without the companion, the portal falls back to webcam-based tracking
through WebGazer.js. The companion is therefore strictly opt-in: users
who don't have a Tobii device don't need it.

## Why a native companion?

- The Tobii Stream Engine is a C/C++ API shipped as a platform binary.
  Browsers cannot talk to it directly.
- A local WebSocket server on `127.0.0.1` is the only shared channel
  that works across all major browsers without custom extensions or
  kernel-level components.
- Keeping the companion minimal and read-only (gaze data out, nothing
  else) limits the blast radius of bundling a native component.

## Architecture (planned)

```
 ┌──────────────────────────┐      WebSocket      ┌──────────────────────┐
 │   Tobii hardware         │                     │   Browser (portal)   │
 │   └─ Stream Engine (C++) │                     │   └─ gaze consumer   │
 │         └─ Tauri/Rust    │ ◀──── 127.0.0.1 ──▶ │         (TS)         │
 │                          │                     │                      │
 └──────────────────────────┘                     └──────────────────────┘
```

- Implementation: [Tauri](https://tauri.app/) (Rust core + minimal WebView
  for status UI).
- Protocol: WebSocket on a fixed localhost port, JSON frames
  `{"t": <ms>, "x": <px>, "y": <px>, "state": "valid"|"lost"}`.
- Authentication: a short-lived token exchanged at install time and
  required in the WS upgrade header. We do not expose the port on the
  network.
- Packaging: signed installers for Windows and macOS; .deb + .rpm for
  Linux. No auto-update in v1 — users download a new build.

## Scope of v1

- Connect to one Tobii device (first found).
- Emit gaze frames at the native cadence.
- Surface "device not found" and "driver not installed" states to the
  browser via the same WS.
- Nothing else. No calibration UI (InterAACtionGaze handles that in the
  browser via gaze data from the bridge), no configuration file, no
  telemetry.

## Not in this repo yet

Only this README. The Cargo workspace and Tauri scaffold will land as a
follow-up once v1 of the portal is live and the WS contract is pinned
down with the InterAACtionGaze team.
