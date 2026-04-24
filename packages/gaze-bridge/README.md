# @afsr/gaze-bridge

Generic gaze-to-click adapter injected into bundled apps so keyboard-
and mouse-bound interfaces become pilotable with the eyes. Consumes
`@afsr/gaze-client`; no framework dependency.

## Behaviour

- **Auto-start** when `localStorage.afsr_calibrated_at` is set and
  `localStorage.afsr_gaze_enabled !== 'false'`.
- **Floating toggle** (top-right, high z-index) lets the user flip the
  state on/off without going back to the portal.
- **Dwell click**: fix the gaze on any clickable element for
  `DWELL_MS` (default 1000 ms). A ring around the cursor fills
  progressively, then the bridge dispatches a synthesised
  `mousedown` → `mouseup` → `click` sequence at the gaze coordinates.
- **Smoothing**: 0.35 exponential moving average on gaze coordinates
  to stop jitter from breaking the dwell every frame.
- **Accessibility fallback**: if the user enables the bridge without
  a calibration on record, a confirm dialog offers to redirect to
  `/calibration/`.

## What counts as "clickable"

```
button, a[href], input, select, textarea,
[role="button"], [role="link"], [role="checkbox"],
[role="menuitem"], [role="tab"], [role="switch"],
[onclick], [tabindex]:not([tabindex="-1"])
```

The bridge walks up from `document.elementFromPoint(x, y)` with
`closest()` until it hits one of the above or runs out of tree. If
nothing matches, no dwell progress accumulates.

## Where it runs

Served at `/gaze-client/gaze-bridge.js` by `scripts/build.sh`.

Each bundled app wires it up at build time: the AugCom workflow, for
instance, injects two `<script>` tags into `apps/augcom/dist/index.html`
after the Angular build:

```html
<script src="/gaze-client/afsr-gaze.umd.js"></script>
<script src="/gaze-client/gaze-bridge.js"></script>
```

The same wiring works for any static app served under `/<app>/`.

## Disabling manually

- Click the "Regard : ON" pill (top-right). State persists across
  reloads via `localStorage.afsr_gaze_enabled`.
- Or clear `localStorage.afsr_calibrated_at` from DevTools to force a
  re-calibration flow.

## Tuning

- `DWELL_MS` — raise to 1500 ms for beginners, lower to 500 ms for
  experienced users.
- `SMOOTHING` — 0..1; higher is more sluggish but more stable.
- `CLICKABLE_SELECTOR` — extend to cover app-specific widgets
  (canvas-based grids would need their own bridge, not this one).

## Not in scope

- No scroll, drag, long-press, or right-click. The bridge only
  synthesises a single click.
- No page-specific knowledge. Apps that rely on `mouseover` state
  (tooltips, custom highlights) will need a thin per-app adapter.
- No calibration UI — owned by `portal/calibration/`.
