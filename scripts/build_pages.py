#!/usr/bin/env python3
"""Synchronize Cloudlord's static HTML from content/pages.json.

Uses only Python's standard library. Does not change the site's router,
visual design, metadata, scripts, or page layout.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "pages.json"
LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
NAV = re.compile(r'(<li\s+data-(estate|about)="([^"]+)"[^>]*?data-text=")([\s\S]*?)("(?=[^>]*>))')
MAIN = re.compile(r'(<main><article class="main-text estate-page"><h1>[^<]*</h1><div>)([\s\S]*?)(</div></article></main>)')

def render_links(text):
    def replace(match):
        label, url = match.groups()
        if not re.match(r"^(https?://|mailto:|/)", url, re.I):
            url = "https://" + url
        return '<a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener noreferrer">' + html.escape(label) + '</a>'
    return LINK.sub(replace, text)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if generated HTML differs from committed files")
    args = parser.parse_args()
    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    if set(data) != {"estates", "about"}:
        raise ValueError("Expected estates and about keys")
    for group in data.values():
        if not isinstance(group, dict) or not group or any(not isinstance(v, str) or not v.strip() or '"' in v for v in group.values()):
            raise ValueError("Descriptions must be nonempty strings without double quotes (HTML attribute constraint)")

    paths = [ROOT / "index.html"]
    paths += [ROOT / "estates" / slug / "index.html" for slug in data["estates"]]
    paths += [ROOT / slug / "index.html" for slug in data["about"]]
    changed = []
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(path)
        source = path.read_text(encoding="utf-8")
        seen = set()
        def replace_nav(match):
            prefix, kind, slug, old, suffix = match.groups()
            key = "estates" if kind == "estate" else "about"
            if slug not in data[key]:
                raise ValueError(f"Unknown {kind} {slug} in {path}")
            seen.add((key, slug))
            return prefix + data[key][slug] + suffix
        output = NAV.sub(replace_nav, source)
        expected = {(key, slug) for key, group in data.items() for slug in group}
        if seen != expected:
            raise ValueError(f"Navigation mismatch in {path}: missing {expected-seen}; unexpected {seen-expected}")
        relative = path.relative_to(ROOT).parts
        if len(relative) == 3 and relative[0] == "estates":
            group, slug = "estates", relative[1]
        elif len(relative) == 2 and relative[0] in data["about"]:
            group, slug = "about", relative[0]
        else:
            group = slug = None
        if group:
            if len(MAIN.findall(output)) != 1:
                raise ValueError(f"Expected exactly one static article in {path}")
            output = MAIN.sub(lambda m: m[1] + render_links(data[group][slug]) + m[3], output, count=1)
        if output != source:
            changed.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.write_text(output, encoding="utf-8")
    if changed:
        print(("Out of sync: " if args.check else "Updated: ") + ", ".join(changed))
    else:
        print("All pages are synchronized.")
    return 1 if args.check and changed else 0

if __name__ == "__main__":
    sys.exit(main())
