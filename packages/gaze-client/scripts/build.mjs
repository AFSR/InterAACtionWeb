// Bundle the TypeScript façade to both UMD and ESM, plus the .d.ts.
// Vendor assets (webgazer.js, mediapipe/) are served as-is — not bundled.

import { execSync } from "node:child_process";
import { build } from "esbuild";
import { mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const entry = resolve(root, "src/index.ts");
const shared = {
  entryPoints: [entry],
  bundle: true,
  target: ["es2018"],
  platform: "browser",
  sourcemap: false,
  legalComments: "linked",
  logLevel: "info",
};

await build({
  ...shared,
  format: "esm",
  outfile: resolve(dist, "afsr-gaze.esm.js"),
});

await build({
  ...shared,
  format: "iife",
  globalName: "AFSRGaze",
  outfile: resolve(dist, "afsr-gaze.umd.js"),
  footer: {
    js: "if (typeof module !== 'undefined' && module.exports) module.exports = AFSRGaze;",
  },
});

// Emit .d.ts alongside the JS bundles via tsc.
execSync("npx tsc -p .", { cwd: root, stdio: "inherit" });

console.log("✔ gaze-client built to packages/gaze-client/dist/");
