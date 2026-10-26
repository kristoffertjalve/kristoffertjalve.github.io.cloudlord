# Cloudlord Management

A lightweight static site hosted on GitHub Pages, with no framework or build dependencies beyond Python's standard library.

## Edit estate and About descriptions

Edit **`content/pages.json`**, not the generated HTML pages. Descriptions use Markdown links (`[label](https://example.com)`) and existing HTML formatting (`<br>`, `<u>`). Avoid double quotes inside descriptions because they are embedded in HTML attributes.

## Edit the shared layout

Edit **`templates/page.html`** to change the common page structure, sidebars, navigation, scripts, or styling references. The template includes placeholders for the page title, description, canonical URL, body state, main content, and each navigation description.

**Do not edit generated HTML directly.** All 15 HTML pages (homepage, 10 estates, 4 About pages) are produced by `scripts/build_pages.py`. Titles and page slugs are defined in the generator's page manifest. SEO descriptions are derived from the content.

When you push edits to `content/pages.json`, `templates/page.html`, or `scripts/build_pages.py` on `main`, GitHub Actions regenerates and commits the pages, then GitHub Pages publishes them. The workflow also supports manual runs.

To generate and check locally:

```sh
python3 scripts/build_pages.py
python3 scripts/build_pages.py --check
node --check estate-router.js
node --check script.js
```

## Architecture

- `content/pages.json` — editorial descriptions
- `templates/page.html` — shared HTML layout and navigation
- `scripts/build_pages.py` — static generator and consistency checker
- `.github/workflows/sync-pages.yml` — automatic generation on `main`
- `index.html`, `estates/*/index.html`, and About pages — generated static output
- `estate-router.js` — instant navigation and browser history
- `script.js` — existing animations and Are.na messages
- `styles.css` — styling

Adding or removing an estate requires updating the page manifest, template navigation, and sitemap. Existing URLs and client-side navigation are preserved.
