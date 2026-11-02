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

Install `yt-dlp` for a local archive refresh:

```bash
python3 -m pip install "yt-dlp==2026.10.26"
YT_DLP_SLEEP_SECONDS=3 node scripts/refresh_videos.mjs
```

The refresh is metadata-only: it crawls Ethan's public channel listing without downloading video or audio, stores normalized discoveries in `data/ethan-channel-videos.json`, and generates matching last-five-year career/leadership entries in `dist/recent-videos.js`. It keeps the raw cache so older discoveries remain available for future classifier changes.

The GitHub Action in `.github/workflows/quarto-publish.yml` installs the pinned `yt-dlp` release, waits between requests, retries transient failures, runs every Monday or manually, commits both archive outputs, and republishes the site. GitHub-hosted requests can still be rate-limited by YouTube; if that happens, rerun later rather than increasing concurrency.

The refresh step is intentionally conservative: new entries are marked `Fresh source` and include a review note in the UI.
