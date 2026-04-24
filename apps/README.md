# Applications

This directory holds one subdirectory per AAC app. Each one contains a
`BUILD.md` describing how that app's build workflow runs and, once a
build has been committed, a `dist/` with the static artefacts served
under `/<app>/` on Vercel.

| App                | Path                        | Upstream                                                                       |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------ |
| AugCom             | [`augcom/`](./augcom/)      | [AFSR/AugCom-AFSR](https://github.com/AFSR/AugCom-AFSR)                        |
| InterAACtionPlayer | [`player/`](./player/)      | [AFSR/InterAACtionPlayer-AFSR](https://github.com/AFSR/InterAACtionPlayer-AFSR) |
| InterAACtionScene  | [`scene/`](./scene/)        | [AFSR/InterAACtionScene-AFSR](https://github.com/AFSR/InterAACtionScene-AFSR)  |
| GazePlay (web)     | [`gazeplay/`](./gazeplay/)  | New Angular reimplementation in this repo (see `gazeplay/BUILD.md`)            |

InterAACtionGaze is intentionally not in this list: its web counterpart
is the `/calibration/` flow in `portal/calibration/`, which drives
WebGazer on top of `@afsr/gaze-client`.

## Hosting policy

Every app is built by a GitHub Actions workflow (`.github/workflows/
build-<name>.yml`), dispatched manually with a pinned upstream SHA. The
workflow opens a PR on `bot/<name>-<sha>` with `apps/<name>/dist/`
populated and the gaze bridge injected into `index.html`. Merging the
PR redeploys Vercel, and the portal's "Lancer" CTA points at
`/<name>/`.

Nothing is hosted from a third-party CDN — the suite must work on
patchy connections once cached by the service worker.
