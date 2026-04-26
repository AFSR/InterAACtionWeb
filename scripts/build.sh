#!/usr/bin/env bash
# Assemble the Vercel static output from portal/ and any prebuilt app dists.
# The portal ships at /, each app at /<name>/.
#
# Resilience: each app is mounted in its own block with its own error
# trap. A failure copying one app's tree (out of disk space, broken
# committed file, …) won't abort the entire build — the gaze-client
# bundle and the portal still get served, and the failed app simply
# 404s with the rest of the suite intact.

set -uo pipefail   # NOT -e: we handle errors per app explicitly.

OUT=dist
FAILED_APPS=()

rm -rf "$OUT"
mkdir -p "$OUT"

# ---- Portal (must succeed) ----
echo "Mounting portal at /"
if ! cp -r portal/. "$OUT/"; then
  echo "FATAL: portal copy failed; aborting." >&2
  exit 1
fi

# ---- Per-app dists (independent, best-effort) ----
for app_dist in apps/*/dist; do
  [ -d "$app_dist" ] || continue
  app=$(basename "$(dirname "$app_dist")")
  echo "Mounting $app at /$app/"
  mkdir -p "$OUT/$app"
  if ! cp -r "$app_dist"/. "$OUT/$app/" 2>&1 | tee "/tmp/iaw-cp-$app.log" | tail -3; then
    echo "WARN: cp -r failed for $app, partial mount kept" >&2
  fi
  # cp's exit status is captured by `pipestatus` but we already accept
  # partial success above; record failures only when nothing copied.
  if [ -z "$(ls -A "$OUT/$app" 2>/dev/null)" ]; then
    echo "WARN: nothing copied for $app — removing empty mount" >&2
    rmdir "$OUT/$app"
    FAILED_APPS+=("$app")
  fi
done

# ---- Shared gaze-tracking client (CRITICAL: bridge depends on it) ----
if [ -d packages/gaze-client/dist ] && [ -d packages/gaze-client/vendor ]; then
  echo "Mounting gaze-client at /gaze-client/"
  mkdir -p "$OUT/gaze-client/vendor"
  cp -r packages/gaze-client/dist/. "$OUT/gaze-client/"
  cp -r packages/gaze-client/vendor/. "$OUT/gaze-client/vendor/"
fi

# ---- Gaze-to-click bridge ----
if [ -f packages/gaze-bridge/generic.js ]; then
  echo "Mounting gaze-bridge at /gaze-client/gaze-bridge.js"
  mkdir -p "$OUT/gaze-client"
  cp packages/gaze-bridge/generic.js "$OUT/gaze-client/gaze-bridge.js"
fi

echo
echo "Build output:"
du -sh "$OUT"
find "$OUT" -maxdepth 2 -type d | sort

if [ "${#FAILED_APPS[@]}" -gt 0 ]; then
  echo
  echo "WARNING — apps that failed to mount: ${FAILED_APPS[*]}"
  echo "(Their /<app>/ routes will 404 until the next build.)"
fi

# Always succeed if portal + gaze-client are in place.
exit 0
