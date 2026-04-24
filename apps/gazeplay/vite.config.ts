import { defineConfig } from "vite";

// GazePlay is served at /gazeplay/ behind the portal. Matching base so
// absolute asset URLs stay correct whether we run `vite dev` at root
// (base='/') or ship the built artefacts to /gazeplay/ on Vercel.
export default defineConfig({
  base: "/gazeplay/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
  server: {
    port: 4203,
  },
});
