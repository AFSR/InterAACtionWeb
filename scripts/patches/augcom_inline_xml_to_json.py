#!/usr/bin/env python3
"""
Patch the AugCom upstream checkout to stop importing `ngx-xml-to-json`
and inline a local xmlToJson helper instead.

The npm package `ngx-xml-to-json@1.0.1` was unpublished by its author;
only 1.0.5 (Angular 14 / Ivy) is still reachable, and its module shape
is unreadable by Angular 9's compiler. AugCom only uses the service at
one call site, so swapping it for a 40-line helper is cheaper than
maintaining a parallel shim package.

Usage:
    python3 scripts/patches/augcom_inline_xml_to_json.py <upstream_dir>
"""
from __future__ import annotations
import sys
from pathlib import Path

TARGET = "src/app/components/life-companion2aug/life-companion2aug.component.ts"

IMPORT_LINE = "import {NgxXmlToJsonService} from 'ngx-xml-to-json';"
CTOR_FRAGMENT = "private ngxXmlToJsonService: NgxXmlToJsonService,"
CALL_PREFIX = "this.ngxXmlToJsonService.xmlToJson("

HELPER = '''
// Inlined shim for ngx-xml-to-json@1.0.1 (unpublished; 1.0.5 is Ivy-only
// and incompatible with Angular 9). Mirrors the textKey/attrKey/cdataKey
// option surface the caller relies on.
function xmlToJson(xml: any, options?: any): any {
  const opts = options || {};
  const attrKey: string = opts.attrKey || '@';
  const textKey: string = opts.textKey || '#text';
  const cdataKey: string = opts.cdataKey || '#cdata';
  let node: any = xml;
  if (typeof xml === 'string') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    node = doc.documentElement;
  }
  function walk(n: any): any {
    if (!n) return null;
    const out: any = {};
    if (n.attributes && n.attributes.length > 0) {
      const attrs: any = {};
      for (let i = 0; i < n.attributes.length; i++) {
        const a = n.attributes[i];
        attrs[a.name] = a.value;
      }
      out[attrKey] = attrs;
    }
    if (n.childNodes && n.childNodes.length > 0) {
      for (let i = 0; i < n.childNodes.length; i++) {
        const c: any = n.childNodes[i];
        if (c.nodeType === 3) {
          const t = c.nodeValue;
          if (t && t.trim()) out[textKey] = (out[textKey] || '') + t;
        } else if (c.nodeType === 4) {
          out[cdataKey] = (out[cdataKey] || '') + c.nodeValue;
        } else if (c.nodeType === 1) {
          const name = c.nodeName;
          const val = walk(c);
          if (out[name] !== undefined) {
            if (!Array.isArray(out[name])) out[name] = [out[name]];
            (out[name] as any[]).push(val);
          } else {
            out[name] = val;
          }
        }
      }
    }
    return out;
  }
  return walk(node);
}
'''


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    upstream = Path(sys.argv[1])
    path = upstream / TARGET
    if not path.is_file():
        print(f"error: {path} not found", file=sys.stderr)
        return 1

    source = path.read_text()

    if IMPORT_LINE not in source:
        print(f"error: import line not found in {path}", file=sys.stderr)
        return 1
    if CTOR_FRAGMENT not in source:
        print(f"error: constructor fragment not found in {path}", file=sys.stderr)
        return 1
    if CALL_PREFIX not in source:
        print(f"error: call site not found in {path}", file=sys.stderr)
        return 1

    patched = source

    # 1. Drop the import; leave a marker line so we know the patch ran.
    patched = patched.replace(
        IMPORT_LINE,
        "// Removed: ngx-xml-to-json import (inlined helper below).",
    )

    # 2. Drop the constructor parameter.
    patched = patched.replace(CTOR_FRAGMENT, "")

    # 3. Rewrite call sites: this.ngxXmlToJsonService.xmlToJson( → xmlToJson(
    patched = patched.replace(CALL_PREFIX, "xmlToJson(")

    # 4. Inject the helper right after the last top-level import.
    lines = patched.splitlines()
    last_import = -1
    in_multiline = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("import{"):
            if stripped.endswith(";"):
                last_import = i
            else:
                in_multiline = True
                last_import = i
        elif in_multiline:
            last_import = i
            if stripped.endswith(";"):
                in_multiline = False
    if last_import < 0:
        print(f"error: no import block found in {path}", file=sys.stderr)
        return 1

    new_lines = lines[: last_import + 1] + HELPER.splitlines() + lines[last_import + 1 :]
    path.write_text("\n".join(new_lines) + "\n")
    print(f"patched {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
