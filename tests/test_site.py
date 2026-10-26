"""Regression checks for the generated site and semantic navigation."""
import sys
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
        pages = list(build_pages.build())
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
                self.assertEqual(len(parsed.nav_links), 14)
                self.assertEqual(len({link["href"] for link in parsed.nav_links}), 14)
                self.assertTrue(all("href" in link for link in parsed.nav_links))
                self.assertEqual(parsed.back_links, 0 if path == ROOT / "index.html" else 1)
                self.assertNotIn("{{", output)
                self.assertEqual(path.read_text(encoding="utf-8"), output)

    def test_router_uses_native_anchor_navigation(self):
        router = (ROOT / "estate-router.js").read_text(encoding="utf-8")
        self.assertIn("anchor.addEventListener('click'", router)
        self.assertIn("event.metaKey", router)
        self.assertIn("history.pushState", router)
        self.assertIn("popstate", router)
        self.assertIn("main.scrollIntoView", router)
        self.assertNotIn("stopImmediatePropagation", router)
        self.assertNotIn("addEventListener('keydown'", router)


if __name__ == "__main__":
    unittest.main()
