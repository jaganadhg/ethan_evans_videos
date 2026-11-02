# The Evans Index

An independent, source-aware video shelf for Ethan Evans career and leadership videos.

## Local preview

```bash
python3 -m http.server 4173 --directory dist
```

Open <http://127.0.0.1:4173>.

## Quarto / GitHub Pages

This repository is configured as a Quarto website. The Quarto entry point redirects to the polished static app in `dist/`, preserving the exact YouTube links and browser interactions.

```bash
quarto render
quarto publish gh-pages --no-browser
```

The GitHub Action in `.github/workflows/quarto-publish.yml` can also be run manually or runs every Monday. It reads Ethan's official YouTube RSS feed, adds new career/leadership videos after deduplicating exact watch URLs, commits the generated `dist/recent-videos.js`, and republishes the site.

The refresh step is intentionally conservative: new entries are marked `Fresh source` and include a review note in the UI.
