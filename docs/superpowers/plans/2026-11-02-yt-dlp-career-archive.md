# Ethan Evans yt-dlp Career Archive Implementation Plan

> Superseded by `2026-11-02-youtube-data-api-career-archive.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the limited RSS refresh with a delayed, cached `yt-dlp` crawl that publishes all matching public Ethan Evans channel videos from the rolling five-year window.

**Architecture:** The refresh script invokes `yt-dlp` in metadata-only mode against Ethan's public channel videos page, normalizes the returned playlist JSON, and atomically merges it into a tracked archive. A pure classifier converts the cached archive into the browser's generated `dist/recent-videos.js`; the existing curated catalog remains separate.

**Tech Stack:** Node.js built-ins, `yt-dlp`, GitHub Actions, Quarto, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-02-yt-dlp-career-archive-design.md`

## Global Constraints

- No YouTube API key or video/audio downloads.
- Use a request delay of at least two seconds in the automated workflow.
- Retain raw discovered metadata in `data/ethan-channel-videos.json`.
- Filter generated entries to the rolling five-year window and career/leadership relevance.
- Preserve exact YouTube watch URLs and deduplicate by video ID.
- Keep failed refreshes from overwriting the previous cache or generated module.
- Keep the existing `[skip ci]` refresh commit behavior.

## Review Focus

- Missing or malformed `upload_date`/timestamp: ignore from the generated site but preserve valid records.
- Duplicate IDs across repeated crawls: newest normalized record wins without duplicate output.
- Descriptions containing HTML or quotes: generated JavaScript remains valid through JSON serialization.
- `yt-dlp` failure or empty output: command exits non-zero and existing files remain unchanged.
- More than 12 matching videos: all matching videos remain available; no arbitrary recent-item cap.

### Task 1: Define archive normalization and filtering behavior

**Files:**
- Modify: `tests/refresh_videos.test.mjs`
- Modify: `scripts/refresh_videos.mjs`

**Interfaces:**
- Produces `parseYtDlpOutput(text)`, `mergeVideoArchive(existing, discovered)`, `selectCareerVideos(entries, options)`, and `buildYtDlpArgs(options)`.

- [ ] **Step 1: Write failing tests** for playlist JSON parsing, five-year cutoff, description keyword matching, ID deduplication, unlimited matching output, and delayed command arguments.
- [ ] **Step 2: Run `node --test tests/refresh_videos.test.mjs`** and verify the new tests fail because the yt-dlp interfaces do not exist.
- [ ] **Step 3: Implement the pure normalization, merge, cutoff, classifier, and argument-builder functions.** Keep old RSS helpers only if needed for backwards compatibility; the production refresh path must use the archive functions.
- [ ] **Step 4: Run the focused test file** and verify all tests pass.

### Task 2: Add the metadata-only yt-dlp refresh and persistent cache

**Files:**
- Create: `data/ethan-channel-videos.json`
- Modify: `scripts/refresh_videos.mjs`
- Modify: `tests/refresh_videos.test.mjs`

**Interfaces:**
- Consumes `buildYtDlpArgs` and normalized archive helpers from Task 1.
- Produces an executable refresh path using `YT_DLP_BIN`, `YT_DLP_SLEEP_SECONDS`, and `YT_DLP_RETRIES` environment overrides.

- [ ] **Step 1: Add a fake-executable command test** that returns playlist JSON and proves the refresh path can run without network access.
- [ ] **Step 2: Run the focused test and verify it fails** before the subprocess/cache implementation exists.
- [ ] **Step 3: Implement `yt-dlp --dump-single-json --skip-download --no-flat-playlist --sleep-requests` invocation with bounded retries, JSON parsing, atomic archive writing, and generated-module writing only after discovery succeeds.
- [ ] **Step 4: Verify the fake-executable test passes** and that a simulated command failure leaves prior files unchanged.

### Task 3: Install yt-dlp in GitHub Actions and commit the archive

**Files:**
- Modify: `.github/workflows/quarto-publish.yml`
- Modify: `README.md`

- [ ] **Step 1: Add `actions/setup-python@v7` with Python 3.13 and install pinned `yt-dlp==2026.10.26`.
- [ ] **Step 2: Replace the RSS refresh step with the archive refresh and set `YT_DLP_SLEEP_SECONDS: 3`.
- [ ] **Step 3: Commit both `data/ethan-channel-videos.json` and `dist/recent-videos.js` when either changes, retaining `[skip ci]`.
- [ ] **Step 4: Document local installation, the metadata-only refresh command, and the expected rate-limit behavior.

### Task 4: Verify the complete site

**Files:**
- Verify: `tests/`, `dist/`, `_site/`

- [ ] **Step 1: Run `node --test`.
- [ ] **Step 2: Run JavaScript syntax checks for app, catalog, generated archive, and refresh script.
- [ ] **Step 3: Run `XDG_CACHE_HOME=/tmp/quarto-cache quarto render`.
- [ ] **Step 4: Inspect the generated module count and confirm no video/audio files were created.
