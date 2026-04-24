# GazePlay (web reimplementation)

A ground-up Vite + TypeScript rewrite of the Java desktop
[GazePlay](https://gazeplay.github.io/GazePlay/). The upstream is
JavaFX + Spring Boot and does not compile to a browser target, so
there is nothing to fork-and-build: the source lives in this repo
under `src/` and we own it end-to-end.

Design goals:
- **Hub + game tiles**. Each game is a self-contained module that
  registers itself in `src/core/registry.ts`. The hub (`core/hub.ts`)
  hit-tests tiles through the shared `DwellEngine` and routes between
  the grid and the running game.
- **One dwell engine**. `src/core/dwell.ts` owns smoothing, jump
  filtering, hit-testing and progress visualisation. It consumes
  `@afsr/gaze-client` when available and falls back to pointer events
  so the app is still playable with a mouse during development.
- **No framework**. Vite + TypeScript + plain DOM. Total shipped bundle
  target: a few tens of kB. No Angular, no React.

## Running locally

```bash
cd apps/gazeplay
npm install
npm run dev         # vite dev server on :4203
```

For a realistic gaze-tracking test you need the `/gaze-client/` bundle
at `/`. Either proxy `npm run preview` behind the portal, or run the
portal's `scripts/build.sh` first and serve `dist/` with any static
server.

## Building for production

```bash
cd apps/gazeplay
npm install
npm run build       # writes apps/gazeplay/dist/
```

`scripts/build.sh` at the repo root already mounts every `apps/*/dist/`
under `/<app>/` on Vercel, so as soon as `apps/gazeplay/dist/` is
committed (directly or via the `Build GazePlay` workflow PR), the live
domain serves `/gazeplay/`.

## Automated build

GitHub → Actions → **Build GazePlay** → *Run workflow*. The workflow
installs Node 20, runs `npm ci && npm run build`, overwrites
`apps/gazeplay/dist/` in the repo and opens a bot PR.

Unlike AugCom/Player/Scene, the workflow has no upstream SHA input:
the source is right here.

## Adding a new game

1. Create `src/games/<id>/index.ts` that default-exports a `GameModule`
   (see `creampie/` or `bubbles/`). Implement `mount(root, engine,
   onExit)` and `unmount()`.
2. Register hit regions with `engine.register({ id, hit, onHit })` and
   unregister them in `unmount()` — leaks will wedge the next game's
   dwell.
3. Import and call `registerGame(myGame)` in `src/main.ts`.
4. Add styles in `src/style.css` (scoped with a per-game prefix to
   avoid bleed).
5. `npm run build` locally to sanity-check, then run the workflow.

The first two POC games (Cream Pies and Colored Bubbles) are the
reference implementations; every GazePlay game from the upstream list
can be rebuilt against this same module contract.

## Remaining from upstream

Upstream GazePlay ships 38+ games. Two are implemented so far (Cream
Pies, Colored Bubbles). Next priorities, in roughly increasing
complexity:

1. **Ninja** — moving target, dwell explodes it.
2. **Whac-a-mole** — multiple holes, moles pop up, dwell.
3. **Magic Cards** — reveal-on-gaze memory game.
4. **Scratchcard** — reveal an image by dwelling over regions.
5. **Order** — remember and reproduce a sequence.
6. **Labyrinth** — guide an avatar through a maze.

Anything that relied on Tobii-specific calibration data in the
desktop app is replaced by the `/calibration/` flow in `portal/`.
