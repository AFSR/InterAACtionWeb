# Building InterAACtionScene

Angular 9.1 (Node 14). No upstream dependency is broken — simpler
pipeline than AugCom, no source patches needed.

## How to trigger a build

GitHub → Actions → **Build Scene** → *Run workflow*.

Input:

- `sha` — commit to build from
  [AFSR/InterAACtionScene-AFSR](https://github.com/AFSR/InterAACtionScene-AFSR).
  Default is the SHA pinned in the workflow file.

The workflow:

1. Checks out this repo.
2. Installs Node 14.
3. Clones `AFSR/InterAACtionScene-AFSR` at the requested SHA.
4. Disables the Angular service worker.
5. Runs `npm ci --legacy-peer-deps`.
6. Builds with `ng build --prod --base-href /scene/`.
7. Strips leftover ngsw artefacts.
8. Replaces `apps/scene/dist/` with the fresh build, writes a
   `BUILD_INFO.txt`.
9. Injects the gaze bridge into `index.html` via
   `scripts/patches/inject_gaze_bridge.py`.
10. Opens a PR `bot/scene-<sha>`.

## After the PR merges

Vercel redeploys, `/scene/` becomes accessible. Update
`portal/index.html` to swap the "Intégration en cours" badge on the
Scene card for a real
`<a class="card-cta" href="/scene/">Lancer InterAACtionScene</a>`.

## Microphone and audio

Scene lets users record sound snippets tied to scene regions. The
microphone permission prompt is driven by the browser on first use.
Nothing to configure at deploy time.
