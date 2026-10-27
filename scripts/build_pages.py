#!/usr/bin/env python3
"""Generate all Cloudlord HTML pages from one template and one content file."""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
MANIFEST = ROOT / "content/manifest.json"
BASE = "https://cloudlord.management"
HOME_DESCRIPTION = "An internet surreal estate holding company."

def render_links(value):
    def replace(m):
        label, url = m.groups()
        if not re.match(r"^(https?://|mailto:|/)", url, re.I):
            url = "https://" + url
        return '<a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener noreferrer">' + html.escape(label) + "</a>"
    return LINK.sub(replace, value)


def render_markdown(value):
    """Render the site's deliberately small Markdown vocabulary, preserving line breaks."""
    value = value.strip()
    value = html.escape(value, quote=False)
    value = re.sub(r"__(.+?)__", r"<u>\1</u>", value)
    value = render_links(value)
    return re.sub(r"\n{2,}", "<br><br>", value).replace("\n", "<br>")


def plain_description(value):
    value = LINK.sub(lambda m: m.group(1), value)
    value = re.sub(r"__(.+?)__", r"\1", value)
    return re.sub(r"\s+", " ", value).strip()[:155]


def manifest_entries():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if set(manifest) != {"estates", "about"}:
        raise ValueError("Manifest must contain estates and about")
    seen = set()
    for kind, entries in manifest.items():
        for entry in entries:
            slug = entry["slug"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or (kind, slug) in seen:
                raise ValueError("Invalid or repeated slug: " + slug)
            seen.add((kind, slug))
            yield kind, entry, (ROOT / "content" / kind / (slug + ".md")).read_text(encoding="utf-8")


def build():
    entries = list(manifest_entries())
    template = (ROOT / "templates/page.html").read_text(encoding="utf-8")
    pages = [(ROOT / "index.html", None, None, None)]
    for kind, entry, markdown in entries:
        slug = entry["slug"]
        path = ROOT / (f"estates/{slug}/index.html" if kind == "estates" else f"{slug}/index.html")
        pages.append((path, kind, entry, markdown))
    metadata = {"/": {"title": "Cloudlord.management", "description": HOME_DESCRIPTION, "canonical": BASE + "/"}}
    for kind, entry, markdown in entries:
        url = f"/estates/{entry['slug']}/" if kind == "estates" else f"/{entry['slug']}/"
        metadata[url] = {"title": entry["title"] + " — Cloudlord.management", "description": plain_description(markdown), "canonical": BASE + url}
    nav = []
    for kind in ("estates", "about"):
        nav.append('<p class="sidebar-title">' + ("Domains" if kind == "estates" else "About") + '</p><ul>')
        for entry_kind, entry, markdown in entries:
            if entry_kind != kind:
                continue
            slug = entry["slug"]
            title = entry["title"] + entry.get("badge", "")
            url = f"/estates/{slug}/" if kind == "estates" else f"/{slug}/"
            data_attr = "data-estate" if kind == "estates" else "data-about"
            nav.append('<li data-meta="' + html.escape(json.dumps(metadata[url], ensure_ascii=False), quote=True) + '" ' + data_attr + '="' + slug + '" data-html="' + html.escape(render_markdown(markdown), quote=True) + '"><a href="' + url + '">' + html.escape(title) + '</a></li>')
        nav.append("</ul>")
    nav_html = "\n".join(nav)
    for path, kind, entry, markdown in pages:
        slug = entry["slug"] if entry else None
        heading = entry["title"] if entry else ""
        title = heading + " — Cloudlord.management" if entry else "Cloudlord.management"
        canonical = BASE + (f"/estates/{slug}/" if kind == "estates" else f"/{slug}/" if kind else "/")
        description = plain_description(markdown) if entry else HOME_DESCRIPTION
        if entry:
            main = '<main><article class="main-text estate-page"><a class="mobile-back-link" href="#domains">↑ Back to domains</a><h1>' + html.escape(heading) + '</h1><div>' + render_markdown(markdown) + '</div></article></main>'
            body_attr = f' data-{"estate" if kind == "estates" else "about"}-page="{slug}"'
        else:
            main = '<main><p align="left"><iframe id="ChiaHouse" title="Chia House" src="https://las-pinas.com/h.html?i=kristoffer" style="width:50vw;min-height:600px;border:none;overflow:scroll" houseid="kristoffer"></iframe></p></main>'
            body_attr = ""
        schema = {"@context": "https://schema.org", "@type": "WebSite" if not entry else "WebPage", "name": "Cloudlord.management" if not entry else heading, "url": canonical, "description": description}
        if entry:
            schema["isPartOf"] = {"@type": "WebSite", "name": "Cloudlord.management", "url": BASE + "/"}
        schema_json = json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
        output = template
        for key, value in {
            "{{TITLE}}": html.escape(title, quote=True),
            "{{DESCRIPTION}}": html.escape(description, quote=True),
            "{{CANONICAL}}": canonical,
            "{{BODY_ATTR}}": body_attr,
            "{{MAIN}}": main,
            "{{NAVIGATION}}": nav_html,
            "{{SCHEMA}}": schema_json,
        }.items():
            output = output.replace(key, value)
        if "{{" in output:
            raise ValueError(f"Unresolved template placeholder in {path}")
        yield path, output
    urls = [BASE + "/" ] + [BASE + (f"/estates/{entry['slug']}/" if kind == "estates" else f"/{entry['slug']}/") for kind, entry, _ in entries]
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "".join("  <url><loc>" + html.escape(url) + "</loc></url>\n" for url in urls)
    yield ROOT / "sitemap.xml", sitemap + "</urlset>\n"
    yield ROOT / "robots.txt", "User-agent: *\nAllow: /\nSitemap: " + BASE + "/sitemap.xml\n"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if generated HTML is out of sync")
    args = parser.parse_args()
    changed = []
    for path, output in build():
        existing = path.read_text(encoding="utf-8") if path.exists() else ""
        if existing != output:
            changed.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(output, encoding="utf-8")
    if changed:
        print(("Out of sync: " if args.check else "Generated: ") + ", ".join(changed))
    else:
        print("All pages are synchronized.")
    return int(args.check and bool(changed))

if __name__ == "__main__":
    sys.exit(main())
