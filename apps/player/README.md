# InterAACtionPlayer

Multimedia player bridging YouTube, Spotify and Deezer playlists, with
gaze-friendly controls.

## Upstream

<https://github.com/AFSR/InterAACtionPlayer>

## Status

Not yet integrated. Plan:

1. Fork `AFSR/InterAACtionPlayer` under AFSR.
2. Build in CI and publish to `/apps/player/` on `interaactionweb.afsr.fr`.
3. Link from `portal/`.

## Notes for the web build

- The streaming provider SDKs (YouTube IFrame API, Spotify Web Playback,
  Deezer JS SDK) require valid API keys and, for Spotify/Deezer, an
  authenticated user session. Decide per-provider whether we ship a key
  or require the user to authenticate once.
