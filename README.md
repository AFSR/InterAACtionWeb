# InterAACtion Web

**Web reinterpretation of [AFSR/InterAACtionBox](https://github.com/AFSR/InterAACtionBox).**

The original InterAACtionBox is an integrated Ubuntu-based device for
Alternative and Augmented Communication (AAC). This repository carries the
same mission to the web: running the same set of AAC apps (AugCom,
InterAACtionPlayer, InterAACtionScene, InterAACtionGaze, GazePlay) in a
browser, without requiring a dedicated OS install or an eye-tracker for
basic use.

Target deployment: <https://interaactionweb.afsr.fr>.

## Why

- Most of the apps bundled in the original box are already browser apps
  served locally on the device. Making them reachable via a PWA removes the
  ISO build cost entirely.
- Eye-tracking quality was the only hardware-bound feature. A companion app
  is planned for users with Tobii hardware (see `companion/`), with
  webcam-based tracking via WebGazer.js as a fallback.
- Ubuntu 20.04 goes out of extended support in April 2026. Moving the user
  experience to the web frees the project from that constraint.

## Status

Early bootstrap. The repository history is preserved from
[AFSR/InterAACtionBox](https://github.com/AFSR/InterAACtionBox) via a mirror
clone; ISO-specific files are being removed incrementally.

## Layout (target)

```
portal/       Static landing page and product tutorial (PWA)
apps/         Per-app integration points (one README per app for now)
  augcom/     AugCom web app
  player/     InterAACtionPlayer
  scene/      InterAACtionScene
  gaze/       InterAACtionGaze
  gazeplay/   GazePlay-web
companion/    Optional native bridge for Tobii eye-trackers
```

## Credits

This project is a derivative of
[AFSR/InterAACtionBox](https://github.com/AFSR/InterAACtionBox), initiated
and maintained by the Association Française du Syndrome de Rett (AFSR).
The full commit history from the upstream project is preserved here. See
[NOTICE](./NOTICE) for details.

## License

GPL-3.0, inherited from upstream. See [LICENSE](./LICENSE).
