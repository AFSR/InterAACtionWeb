# GazePlay (web)

Collection of 60+ serious mini-games that teach gaze-based interaction.
The historical desktop version is a Java app; the web reimplementation
is upstream.

## Upstream

- Web reimplementation: <https://github.com/GazePlay/GazePlay-web>
- Desktop (for reference): <https://github.com/GazePlay/GazePlay>

## Status

Not yet integrated. Plan:

1. Fork `GazePlay/GazePlay-web` under AFSR.
2. Build in CI and publish to `/apps/gazeplay/` on `interaactionweb.afsr.fr`.
3. Link from `portal/`.

## Notes for the web build

- Some mini-games rely on audio autoplay. Use a gesture-gated "start"
  button on the landing so the browser's autoplay policy does not block
  the experience mid-game.
- GazePlay runs well with low-precision gaze inputs; it is the best
  first-contact app for the WebGazer.js fallback path.
