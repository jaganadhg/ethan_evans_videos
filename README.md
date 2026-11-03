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

Enable YouTube Data API v3 in Google Cloud and create an API key for a local
archive refresh:

```bash
YOUTUBE_API_KEY=your-key-here node scripts/refresh_videos.mjs
```

The GitHub Action reads the `YOUTUBE_API_KEY` repository secret. Configure it
with:

```bash
gh secret set YOUTUBE_API_KEY --repo jaganadhg/ethan_evans_videos
```

The refresh reads public channel metadata through the channel uploads playlist;
it does not access private, age-restricted, or members-only videos.

Auto-discovered videos receive one primary topic—Career Growth & Promotion,
Executive Presence & Visibility, Managing Up & Influence, Leadership & People
Management, Communication & Difficult Conversations, AI-Era Work & Product
Leadership, Decision-Making & Strategy, Personal Effectiveness & Resilience, or
Career Transitions & Independent Work—plus optional tags and a format label.
Classification uses the title first so repeated promotional biographies do not
override the video's actual subject.

The refresh is metadata-only: it crawls Ethan's public channel listing without downloading video or audio, stores normalized discoveries in `data/ethan-channel-videos.json`, and generates matching last-five-year career/leadership entries in `dist/recent-videos.js`. It keeps the raw cache so older discoveries remain available for future classifier changes.

The GitHub Action in `.github/workflows/quarto-publish.yml` uses the API key,
retries transient failures, runs every Monday or manually, commits both archive
outputs, and republishes the site.

The refresh step is intentionally conservative: new entries are marked `Auto-discovered` and include a review note in the UI.
