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
PLACEHOLDER = re.compile(r"\{\{CONTENT:(estate|about):([^}]+)\}\}")
HEADINGS = {
    "naive-yearly": "Naiveyearly.com",
    "diagram-website": "Diagram.website",
    "naive-weekly": "Naiveweekly.com",
    "tiny-awards": "Tinyawards.net",
    "my-girlfriend-is-an-artist": "Mygirlfriendisanartist.com",
    "wilderness-land": "Wilderness.land",
    "internet-phone-book": "Internetphonebook.net",
    "url-poetry-club": "Urlpoetry.club",
    "postcard-place": "Postcard.place",
    "apossible": "Apossible.com",
}
ABOUT = {"owner": "Owner", "partners": "Partners", "press": "Press", "contact": "Contact"}
BASE = "https://cloudlord.management"
HOME_DESCRIPTION = "An internet surreal estate holding company."

def render_links(value):
    def replace(m):
        label, url = m.groups()
        if not re.match(r"^(https?://|mailto:|/)", url, re.I):
            url = "https://" + url
        return '<a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener noreferrer">' + html.escape(label) + "</a>"
    return LINK.sub(replace, value)

def plain_description(value):
    text = LINK.sub(lambda m: m.group(1), value)
    text = re.sub(r"<[^>]*>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()[:155]

def build():
    data = json.loads((ROOT / "content/pages.json").read_text(encoding="utf-8"))
    if set(data) != {"estates", "about"} or set(data["estates"]) != set(HEADINGS) or set(data["about"]) != set(ABOUT):
        raise ValueError("Content slugs do not match the page manifest")
    for group in data.values():
        if any(not isinstance(value, str) or not value.strip() or '"' in value for value in group.values()):
            raise ValueError("Descriptions must be nonempty and cannot contain double quotes in data-text attributes")
    template = (ROOT / "templates/page.html").read_text(encoding="utf-8")
    expected = {("estate", slug) for slug in HEADINGS} | {("about", slug) for slug in ABOUT}
    found = set(PLACEHOLDER.findall(template))
    if found != expected or len(PLACEHOLDER.findall(template)) != len(expected):
        raise ValueError("Template navigation does not match content slugs")
    pages = [("index.html", None, None)]
    pages += [(f"estates/{slug}/index.html", "estate", slug) for slug in HEADINGS]
    pages += [(f"{slug}/index.html", "about", slug) for slug in ABOUT]
    for path, kind, slug in pages:
        heading = (HEADINGS if kind == "estate" else ABOUT).get(slug, "") if kind else ""
        title = heading + " — Cloudlord.management" if kind else "Cloudlord.management"
        canonical = BASE + (f"/estates/{slug}/" if kind == "estate" else f"/{slug}/" if kind else "/")
        description = plain_description(data["estates" if kind == "estate" else "about"][slug]) if kind else HOME_DESCRIPTION
        if kind:
            value = data["estates" if kind == "estate" else "about"][slug]
            main = '<main><article class="main-text estate-page"><a class="mobile-back-link" href="#domains">↑ Back to domains</a><h1>' + html.escape(heading) + '</h1><div>' + render_links(value) + '</div></article></main>'
            body_attr = f' data-{"estate" if kind == "estate" else "about"}-page="{slug}"'
        else:
            main = '<main>\n             <p align="left"><iframe id="ChiaHouse" src="https://las-pinas.com/h.html?i=kristoffer" onload="javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+&quot;px&quot;;}(this));" style="width:50vw; min-height: 600px;border:none;overflow:scroll;" houseid="kristoffer"></iframe></p>\n        </main>'
            body_attr = ""
        output = template
        for key, value in {
            "{{TITLE}}": html.escape(title, quote=True),
            "{{DESCRIPTION}}": html.escape(description, quote=True),
            "{{CANONICAL}}": canonical,
            "{{BODY_ATTR}}": body_attr,
            "{{MAIN}}": main,
        }.items():
            output = output.replace(key, value)
        output = PLACEHOLDER.sub(lambda m: data["estates" if m.group(1) == "estate" else "about"][m.group(2)], output)
        if "{{" in output:
            raise ValueError(f"Unresolved template placeholder in {path}")
        yield ROOT / path, output

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
