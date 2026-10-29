"""Regression checks for the generated site and semantic navigation."""
import sys
import json
import xml.etree.ElementTree as ET
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import build_pages


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.canonicals = []
        self.descriptions = []
        self.titles = 0
        self.mains = 0
        self.current_link = False
        self.nav_links = []
        self.back_links = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.titles += 1
        if tag == "main":
            self.mains += 1
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name") == "description":
            self.descriptions.append(attrs.get("content"))
        if tag == "a":
            self.links.append(attrs.get("href"))
            if attrs.get("href") == "#domains":
                self.back_links += 1
            if attrs.get("href", "").startswith("/estates/") or attrs.get("href") in ("/owner/", "/partners/", "/press/", "/contact/"):
                self.nav_links.append(attrs)


class SiteTests(unittest.TestCase):
    def test_generated_pages_and_metadata(self):
        generated = list(build_pages.build())
        pages = [(path, output) for path, output in generated if path.suffix == '.html']
        self.assertEqual(len(generated), len(pages) + 2)
        sitemap = dict(generated)[ROOT / 'sitemap.xml']
        urls = [node.text for node in ET.fromstring(sitemap).findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        self.assertEqual(len(urls), len(pages))
        self.assertEqual(len(set(urls)), len(urls))
        self.assertIn('Sitemap: https://cloudlord.management/sitemap.xml', dict(generated)[ROOT / 'robots.txt'])
        manifest = list(build_pages.manifest_entries())
        self.assertEqual(len(pages), len(manifest) + 1)
        self.assertEqual(len(pages), 15)
        for path, output in pages:
            with self.subTest(page=str(path.relative_to(ROOT))):
                parsed = PageParser()
                parsed.feed(output)
                self.assertEqual(parsed.titles, 1)
                self.assertEqual(parsed.mains, 1)
                self.assertEqual(len(parsed.canonicals), 1)
                self.assertEqual(len(parsed.descriptions), 1)
                self.assertTrue(parsed.descriptions[0])
                self.assertEqual(len(parsed.nav_links), len(manifest))
                self.assertEqual(len({link["href"] for link in parsed.nav_links}), 14)
                self.assertTrue(all("href" in link for link in parsed.nav_links))
                self.assertEqual(parsed.back_links, 0 if path == ROOT / "index.html" else 1)
                self.assertIn('application/ld+json', output)
                self.assertIn('name="twitter:card"', output)
                self.assertNotIn("{{", output)
                self.assertEqual(path.read_text(encoding="utf-8"), output)

    def test_markdown_and_manifest_rendering(self):
        rendered = build_pages.render_markdown('A "quoted" [link](https://example.com)\n\n__Heading__')
        self.assertIn('A "quoted"', rendered)
        self.assertIn('<a href="https://example.com"', rendered)
        self.assertIn('<br><br><u>Heading</u>', rendered)
        manifest = list(build_pages.manifest_entries())
        self.assertEqual(len({(kind, entry["slug"]) for kind, entry, _ in manifest}), len(manifest))
        self.assertTrue(all(markdown.strip() for _, _, markdown in manifest))

    def test_calendar_renders_all_entries_including_old_events(self):
        calendar = (ROOT / "content/calendar.md").read_text(encoding="utf-8")
        rendered = build_pages.render_calendar(calendar)
        self.assertEqual(rendered.count('class="calendar-entry"'), 3)
        self.assertNotIn(r"\n", rendered)
        self.assertIn("\n<div", rendered)
        self.assertIn("Transmediale", rendered)
        self.assertIn("Parameter", rendered)
        self.assertIn("Naive Yearly", rendered)
        self.assertLess(rendered.index("Transmediale"), rendered.index("Parameter"))
        self.assertLess(rendered.index("Parameter"), rendered.index("Naive Yearly"))
        with self.assertRaises(ValueError):
            build_pages.render_calendar("Incomplete entry")

    def test_performance_loading_guards(self):
        template = (ROOT / "templates/page.html").read_text(encoding="utf-8")
        script = (ROOT / "script.js").read_text(encoding="utf-8")
        self.assertIn('<script defer src="https://cdn.jsdelivr.net/npm/marked/marked.min.js">', template)
        self.assertIn('loading="lazy" src="https://internetphonebook.net/badges/', template)
        self.assertIn('<script defer src="https://melonking.net/scripts/flood.js">', template)
        self.assertIn("messagesStarted", script)
        self.assertIn("flyFrame === null", script)

    def test_router_uses_native_anchor_navigation(self):
        router = (ROOT / "estate-router.js").read_text(encoding="utf-8")
        self.assertIn("anchor.addEventListener('click'", router)
        self.assertIn("event.metaKey", router)
        self.assertIn("history.pushState", router)
        self.assertIn("popstate", router)
        self.assertIn("main.scrollIntoView", router)
        self.assertNotIn("stopImmediatePropagation", router)
        self.assertIn("addEventListener('keydown'", router)
        self.assertIn("e.key === 'Escape'", router)
        self.assertIn("setMenu(false)", router)


if __name__ == "__main__":
    unittest.main()
