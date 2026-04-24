# Building InterAACtionPlayer

Angular 11 (Node 16). Lighter pipeline than AugCom: no broken upstream
deps, no source patches required, just `npm ci` + `ng build`.

## How to trigger a build

GitHub → Actions → **Build Player** → *Run workflow*.

Input:

- `sha` — commit to build from
  [AFSR/InterAACtionPlayer](https://github.com/AFSR/InterAACtionPlayer).
  Default is the SHA pinned in the workflow file.

The workflow:

1. Checks out this repo.
2. Installs Node 16.
3. Clones `AFSR/InterAACtionPlayer` at the requested SHA.
4. Disables the Angular service worker (portal owns SW scope `/`).
5. Runs `npm ci --legacy-peer-deps`.
6. Builds with `ng build --prod --base-href /player/`.
7. Strips leftover ngsw artefacts.
8. Replaces `apps/player/dist/` with the fresh build, writes a
   `BUILD_INFO.txt`.
9. Injects the gaze bridge into `index.html` via
   `scripts/patches/inject_gaze_bridge.py`.
10. Opens a PR `bot/player-<sha>`.

## After the PR merges

Vercel redeploys, `/player/` becomes accessible. Update
`portal/index.html` to swap the "Intégration en cours" badge on the
Player card for a real `<a class="card-cta" href="/player/">Lancer
InterAACtionPlayer</a>`.

## Streaming SDKs

Player wires YouTube IFrame, Spotify Web Playback and Deezer JS SDK
at runtime. The SDKs are loaded from their respective CDNs by the
upstream code; no extra config is needed at deploy time. Spotify and
Deezer require the user to log in via OAuth on first use.
