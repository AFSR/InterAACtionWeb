# Applications

This directory collects one integration point per bundled AAC app. For now
each subdirectory is just a README that points at the upstream project; the
actual build integration (submodule, npm workspace, CI-built artifact, or
forked self-hosted copy) will be decided app-by-app as we wire them into
`portal/`.

| App                  | Path                    | Upstream                                                                          |
| -------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| AugCom               | [`augcom/`](./augcom/)     | [AFSR/AugCom-AFSR](https://github.com/AFSR/AugCom-AFSR)                           |
| InterAACtionPlayer   | [`player/`](./player/)     | [AFSR/InterAACtionPlayer](https://github.com/AFSR/InterAACtionPlayer)             |
| InterAACtionScene    | [`scene/`](./scene/)       | [AFSR/InterAACtionScene](https://github.com/AFSR/InterAACtionScene)               |
| InterAACtionGaze     | [`gaze/`](./gaze/)         | [AFSR/InterAACtionGaze](https://github.com/AFSR/InterAACtionGaze)                 |
| GazePlay (web build) | [`gazeplay/`](./gazeplay/) | [GazePlay/GazePlay-web](https://github.com/GazePlay/GazePlay-web)                 |

## Hosting policy

All five apps will be forked under the AFSR organization and their release
artifacts hosted on `interaactionweb.afsr.fr` alongside the portal, so the
suite works without third-party availability assumptions.
