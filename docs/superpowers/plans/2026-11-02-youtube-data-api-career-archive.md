# YouTube Data API Career Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the failing unauthenticated yt-dlp metadata crawl with a public YouTube Data API v3 crawl.

**Architecture:** Resolve the channel uploads playlist with `channels.list`, paginate `playlistItems.list`, normalize the API records into the existing archive shape, and reuse the existing archive merge/classification/output pipeline. Use Node's built-in `fetch` and require `YOUTUBE_API_KEY` only at runtime.

**Tech Stack:** Node.js 22 built-ins, YouTube Data API v3, GitHub Actions, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-02-youtube-data-api-career-archive-design.md`

## Global Constraints

- Public metadata only; no video or audio downloads.
- Preserve exact YouTube watch URLs and archive record shape.
- Do not write API keys into tracked files or generated browser modules.
- Use the existing atomic archive and generated-module writes.

## Review Focus

- Missing API key: fail before any output file changes.
- API error response: include the API error and preserve prior files.
- Pagination: collect every page without duplicate records.
- Missing `videoPublishedAt`: use the playlist item's publication timestamp.
- Malformed or empty API payload: fail without replacing the archive.

### Task 1: Add API client and normalization tests

**Files:**
- Modify: `tests/refresh_videos.test.mjs`
- Modify: `scripts/refresh_videos.mjs`

- [ ] Write failing tests for API URL construction, channel uploads-playlist response, paginated item normalization, API errors, and missing key.
- [ ] Run `node --test tests/refresh_videos.test.mjs` and verify the new tests fail because the API interfaces do not exist.
- [ ] Implement `buildYouTubeApiUrl`, `parseYouTubeApiChannel`, `parseYouTubeApiItems`, `fetchYouTubeApi`, and `runYouTubeApi` using built-in `fetch`.
- [ ] Run the focused test file and then the full suite.

### Task 2: Replace workflow and documentation configuration

**Files:**
- Modify: `.github/workflows/quarto-publish.yml`
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] Remove Python/yt-dlp installation and cookie preparation from the workflow.
- [ ] Pass `YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}` only to the refresh step.
- [ ] Document API enablement, secret setup, local execution, and public-metadata limitations.
- [ ] Run the full test suite and YAML/syntax checks.

### Task 3: Verify the migration

- [ ] Confirm no production path references yt-dlp or cookie variables.
- [ ] Confirm the API key is not present in tracked/generated files.
- [ ] Run `node --test tests/*.test.mjs` and `node --check scripts/refresh_videos.mjs`.
