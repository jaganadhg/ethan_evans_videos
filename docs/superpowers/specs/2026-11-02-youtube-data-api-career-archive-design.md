# YouTube Data API Career Archive Design

## Intent

Refresh the public Ethan Evans video archive through YouTube Data API v3 instead
of scraping YouTube with `yt-dlp`. The API key is appropriate because this site
only needs public channel metadata and does not download media.

## Goals

- Read the channel uploads playlist and paginate through public uploads.
- Preserve the existing normalized archive and generated `recent-videos.js`.
- Keep the refresh metadata-only and dependency-free using Node's built-in `fetch`.
- Fail clearly when `YOUTUBE_API_KEY` is missing or the API returns an error.

## Non-goals

- Access private, age-restricted, or members-only videos.
- Download or embed media.
- Do not keep a `yt-dlp` fallback in the scheduled workflow.

## Approach

The refresh resolves the channel's uploads playlist with `channels.list`, then
uses paginated `playlistItems.list` calls with `snippet,contentDetails`. It uses
`contentDetails.videoPublishedAt` when available and falls back to the playlist
item's `snippet.publishedAt`. Existing archive merge, classification, and atomic
writes remain unchanged.

The workflow passes the `YOUTUBE_API_KEY` repository secret only to the refresh
step. The key is never written to the archive or browser bundle.
