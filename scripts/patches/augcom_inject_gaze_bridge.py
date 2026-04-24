#!/usr/bin/env python3
"""
Inject the gaze client + generic gaze bridge into AugCom's built
index.html so the app becomes pilotable at the eye level without
touching its Angular source.

The two scripts are inserted at the very end of <head>, so they load
early but do not block the Angular bootstrap. Both are served under
/gaze-client/ by the Vercel build step (see scripts/build.sh).

Usage:
    python3 scripts/patches/augcom_inject_gaze_bridge.py <augcom_dist_dir>
"""
from __future__ import annotations
import sys
from pathlib import Path

INDEX_RELATIVE = "index.html"

MARKER = "<!-- afsr-gaze-bridge -->"
SNIPPET = (
    f"  {MARKER}\n"
    '  <script defer src="/gaze-client/afsr-gaze.umd.js"></script>\n'
    '  <script defer src="/gaze-client/gaze-bridge.js"></script>\n'
)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    dist = Path(sys.argv[1])
    index = dist / INDEX_RELATIVE
    if not index.is_file():
        print(f"error: {index} not found", file=sys.stderr)
        return 1

    html = index.read_text()
    if MARKER in html:
        print(f"note: gaze-bridge already injected in {index}; skipping")
        return 0

    needle = "</head>"
    idx = html.find(needle)
    if idx < 0:
        print(f"error: no </head> in {index}", file=sys.stderr)
        return 1

    patched = html[:idx] + SNIPPET + html[idx:]
    index.write_text(patched)
    print(f"injected gaze-bridge into {index}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
