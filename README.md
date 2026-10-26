# Cloudlord Management

A lightweight static website hosted on GitHub Pages.

## Edit estate and About descriptions

**Edit `content/pages.json`**, rather than the copies of `data-text` in HTML files.

The `estates` and `about` objects are keyed by page slug. Descriptions retain the site's existing format: Markdown links such as `[Tiny Awards](https://tinyawards.net/)`, plus HTML `<br>` and `<u>` tags. Avoid double quotes inside descriptions because they are embedded in HTML attributes.

Changes to `content/pages.json` on `main` trigger a GitHub Actions workflow that regenerates and commits synchronized HTML pages. GitHub Pages then publishes them. You can also run the workflow manually.

To generate locally:

```sh
python3 scripts/build_pages.py
python3 scripts/build_pages.py --check
node --check estate-router.js
node --check script.js
```

The generator synchronizes navigation descriptions across all pages and pre-rendered descriptions on direct estate/About URLs. It validates that every navigation entry has matching content and preserves existing page layout, metadata, router, fruitfly, and Are.na messages.

Adding or removing an estate still requires updating the navigation markup, page directory, and sitemap. This first stage centralizes editorial descriptions; it does not yet consolidate the HTML page shell into a template.

## Files

- `content/pages.json` — canonical editorial copy
- `scripts/build_pages.py` — generator and consistency checker
- `.github/workflows/sync-pages.yml` — automatic synchronization on `main`
- `index.html`, `estates/*/index.html`, and About directories — static pages
- `estate-router.js` — instant navigation and history
- `script.js` — existing visual interactions and Are.na messages
- `styles.css` — styling
