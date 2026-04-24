# Building AugCom

AugCom is Angular 9.1, which locks us on Node 14. Vercel only runs Node 18+,
so we build in GitHub Actions instead and commit the `dist/` artefact into
this repo. Vercel then serves the static result through `vercel.json`
rewrites — no build step on deploy.

## How to trigger a build

GitHub → Actions → **Build AugCom** → *Run workflow*.

Input:

- `sha` — commit to build from [AFSR/AugCom-AFSR](https://github.com/AFSR/AugCom-AFSR).
  Defaults to the SHA pinned in the workflow file; override when upstream
  has new commits you want to ship.

The workflow:

1. Checks out this repo.
2. Installs Node 14 (required by Angular 9).
3. Clones `AFSR/AugCom-AFSR` at the requested SHA.
4. Patches `angular.json` to disable the Angular service worker — the
   portal already ships a SW scoped to `/` and two SWs on the same origin
   would fight each other.
5. Runs `npm ci --legacy-peer-deps` (upstream has broken peer deps).
6. Builds with `ng build --prod --base-href /augcom/`.
7. Strips `ngsw-worker.js`, `ngsw.json`, `safety-worker.js`, and
   `worker-basic.min.js` from the output defensively.
8. Replaces `apps/augcom/dist/` with the fresh build and writes a
   `BUILD_INFO.txt` naming the upstream SHA and the workflow run.
9. Opens a PR on branch `bot/augcom-<sha>`. Review, merge, Vercel redeploys.

## Why commit the build?

- Vercel deploys this repo as a static site; no build step needed.
- One PR per upstream release keeps the history auditable: you can always
  see which SHA produced which bundle.
- If the `apps/*/dist/` footprint becomes a problem across multiple apps,
  we switch to [Git LFS](https://git-lfs.com/) for `apps/**/dist/**`
  without changing the workflow.

## Porting the recipe to other apps

The same pattern fits the other Angular-based apps (InterAACtionPlayer,
InterAACtionScene, InterAACtionGaze). For each one:

1. Copy `.github/workflows/build-augcom.yml` to `build-<app>.yml`.
2. Swap the upstream URL and the default SHA.
3. Check the Node version the app requires and pin `setup-node`
   accordingly.
4. Check the build command and `--base-href /<app>/`.
5. Add the rewrites to `vercel.json`:
   ```
   { "source": "/<app>",             "destination": "/apps/<app>/dist/index.html" },
   { "source": "/<app>/",            "destination": "/apps/<app>/dist/index.html" },
   { "source": "/<app>/:path*",      "destination": "/apps/<app>/dist/:path*" }
   ```
6. Swap the "Intégration en cours" span on the app's card in
   `portal/index.html` for a `<a class="card-cta" href="/<app>/">…</a>`.

GazePlay-web is not Angular — check its own build instructions before
porting.

## Developing against a local AugCom

To check routing locally without going through the workflow, drop a built
`dist/` into `apps/augcom/dist/` and serve the repo root:

```bash
npx http-server . -p 8000 -c-1
# http://127.0.0.1:8000/augcom/
```

The local server does not honour `vercel.json` rewrites, so paths like
`/` and `/augcom/` will not work without passing through Vercel or
writing a local equivalent. Use `portal/` directly for portal-only dev.
