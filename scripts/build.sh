#!/usr/bin/env bash
# Assemble the Vercel static output from portal/ and any prebuilt app dists.
# The portal ships at /, each app at /<name>/.
#
# Apps that have not been built yet (no apps/<name>/dist/) are silently
# skipped. The portal's "Intégration en cours" badge stays in place until
# their build PR is merged.

set -euo pipefail

OUT=dist

rm -rf "$OUT"
mkdir -p "$OUT"

# Portal at the root.
cp -r portal/. "$OUT/"

# One subdirectory per app with a populated dist/.
for app_dist in apps/*/dist; do
  [ -d "$app_dist" ] || continue
  app=$(basename "$(dirname "$app_dist")")
  echo "Mounting $app at /$app/"
  mkdir -p "$OUT/$app"
  cp -r "$app_dist"/. "$OUT/$app/"
done

# Shared gaze-tracking client (companion + WebGazer fallback).
# Served at /gaze-client/; apps and the portal pull it from there.
if [ -d packages/gaze-client/dist ] && [ -d packages/gaze-client/vendor ]; then
  echo "Mounting gaze-client at /gaze-client/"
  mkdir -p "$OUT/gaze-client/vendor"
  cp -r packages/gaze-client/dist/. "$OUT/gaze-client/"
  cp -r packages/gaze-client/vendor/. "$OUT/gaze-client/vendor/"
fi

echo "Build output:"
du -sh "$OUT"
find "$OUT" -maxdepth 2 -type d | sort
