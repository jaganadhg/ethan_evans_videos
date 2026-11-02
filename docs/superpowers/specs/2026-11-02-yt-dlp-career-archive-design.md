# Ethan Evans Career Video Archive Design

## Intent

Expand the weekly refresh from the channel's small RSS window into a persistent archive of public Ethan Evans channel videos from the last five years, while showing only videos related to career, leadership, promotion, and workplace topics.

## Goals

- Discover public channel videos without a YouTube API key.
- Avoid downloading video or audio content.
- Use conservative delays and retries so the weekly GitHub Action makes a small number of requests.
- Preserve previously discovered metadata in the repository so older matching videos do not disappear when the channel listing changes.
- Filter by publication date and career/leadership relevance before adding entries to the site.
- Keep exact YouTube watch URLs and deduplicate by video ID.

## Non-goals

- Claiming that title/description keyword matching proves Ethan repeatedly recommended a video.
- Indexing videos from other channels or external appearances in this automated archive.
- Downloading, mirroring, or embedding video files.
- Guaranteeing visibility for deleted, private, age-restricted, or unavailable videos.

## Approaches considered

1. **`yt-dlp` public channel crawl — selected.** It can enumerate public channel uploads without an API key. A persistent JSON cache, bounded delay, and retries provide a practical weekly refresh while keeping the site static.
2. **RSS plus manual backfill.** Lower implementation cost, but the RSS feed does not provide a dependable five-year history.
3. **Browser/search scraping.** More brittle than crawling the channel listing and less suitable for a repeatable GitHub Action.

## Architecture

The refresh script will invoke an installed `yt-dlp` executable in metadata-only mode against Ethan's channel videos URL. It will write normalized discovery records to `data/ethan-channel-videos.json`, merging them with the previous cache by YouTube video ID. A configurable delay will be applied between discovery requests, and transient command failures will retry with backoff.

The generated `dist/recent-videos.js` module will be built from cached records published within the rolling five-year window whose title or description matches the career/leadership classifier. The existing curated catalog remains separate and continues to be included in the final catalog.

## Filtering policy

- Date cutoff: current UTC date minus five calendar years.
- Include terms: career, promotion, manager, leadership, executive, decision, influence, stakeholder, senior, professional, workplace, work, job, Amazon, and AI.
- Exclude nothing solely from a keyword miss without preserving it in the raw cache; future classifier improvements can reprocess the cache.
- Mark automated entries as `Fresh source` and retain a review note in the UI.

## Operational constraints

- Pin or install a known `yt-dlp` version in GitHub Actions.
- Use a delay of at least two seconds between requests, with a configurable environment override for local testing.
- Fail the refresh if discovery fails and leave the previous generated archive untouched.
- Keep the workflow's existing write permission and `[skip ci]` refresh commit behavior.

## Verification

- Unit tests cover date filtering, relevance matching, ID deduplication, cache merging, and stable output rendering.
- A command-level test uses a fake `yt-dlp` executable so tests do not make network requests.
- Existing catalog, page, JavaScript syntax, and Quarto render checks continue to pass.
