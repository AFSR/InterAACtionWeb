# InterAACtionScene

Visual-scene communication app. Users import images, attach recorded
sounds, and play back scenes for AAC support.

## Upstream

<https://github.com/AFSR/InterAACtionScene>

## Status

Not yet integrated. Plan:

1. Fork `AFSR/InterAACtionScene` under AFSR.
2. Build in CI and publish to `/apps/scene/` on `interaactionweb.afsr.fr`.
3. Link from `portal/`.

## Notes for the web build

- User-recorded audio needs microphone permission. Make sure the permission
  prompt is reachable via the gaze/keyboard flow and is persisted once
  granted so the user is not re-prompted every scene.
