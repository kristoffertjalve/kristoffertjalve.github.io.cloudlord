# Cloudlord Management

A lightweight GitHub Pages website generated with Python's standard library. No JavaScript framework or build dependencies are required.

## Edit descriptions

Edit the Markdown files in `content/estates/*.md` or `content/about/*.md`. Write normal paragraphs separated by blank lines, Markdown links (`[label](https://example.com)`), and underlined subheadings using `__Heading__`. Single line breaks remain line breaks on the site. Quotation marks are supported. The current descriptions have been migrated without rewriting their wording.

## Add or reorder pages

Edit `content/manifest.json`. Each item has a `slug` and `title`, and optionally a `badge`. Its position in the manifest determines the navigation order. Add a matching Markdown file in the appropriate folder. Navigation, page URLs, and generated page metadata come from the same manifest.

## Edit the layout

Edit `templates/page.html` for shared page structure or `styles.css` for appearance. `estate-router.js` handles client-side navigation; `script.js` handles dark mode, fruitfly animation, and Are.na messages.

Do not edit the generated `index.html`, `estates/*/index.html`, or About page HTML files directly. GitHub Actions regenerates them after edits to the content, manifest, generator, or template are pushed to `main`.

## Run checks locally

```sh
python3 scripts/build_pages.py
python3 scripts/build_pages.py --check
python3 -m unittest discover -s tests -v
node --check estate-router.js
node --check script.js
```

The GitHub Actions test workflow also runs Chromium navigation tests.

## Structure

- `content/manifest.json` — navigation order, titles, slugs
- `content/estates/*.md`, `content/about/*.md` — descriptions
- `templates/page.html` — shared layout
- `scripts/build_pages.py` — static generator
- `estate-router.js` — instant navigation and browser history
- `script.js` — interactive effects and messages
- `styles.css` — styling
- `.github/workflows/sync-pages.yml` — regenerate generated HTML on main
- `.github/workflows/test-site.yml` — regression tests
