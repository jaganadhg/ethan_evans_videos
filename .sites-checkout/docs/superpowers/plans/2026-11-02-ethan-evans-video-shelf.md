# Ethan Evans Video Shelf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, evidence-aware static video shelf for videos connected to Ethan Evans' recurring public recommendations.

**Architecture:** A buildless static page in `dist/` separates editorial data/filter helpers from browser rendering. Pure catalog helpers are covered by Node's built-in test runner; browser behavior is verified with semantic markup checks, syntax checks, and a local HTTP smoke test.

**Tech Stack:** HTML, CSS, browser JavaScript modules, Node.js built-in `node:test`, Python `http.server` for local preview.

**Spec:** `docs/superpowers/specs/2026-11-02-ethan-evans-video-shelf-design.md`

## Global Constraints

- Use only public, source-backed recommendation themes; do not invent recommendation counts, views, testimonials, or affiliations.
- The page must remain useful without embedding a full YouTube player.
- Use a dark editorial research-shelf visual direction with warm paper type and citrus-lime accent.
- Keep the page buildless and dependency-free.
- Preserve keyboard access, visible focus, reduced-motion behavior, and responsive layout.

## Review Focus

- Search and topic filters must compose correctly and return an honest empty state — test pure filtering with mixed case and no-match input.
- Saved items must survive a reload through namespaced localStorage — test storage helpers with a memory-backed store.
- Source metadata must remain present on every card — test catalog shape and page markup for source fields.
- Modal close behavior must be keyboard and backdrop accessible — verify dialog markup and event paths in the browser smoke checklist.
- Narrow screens must not overflow horizontally — verify responsive CSS rules and use a 390px viewport in manual preview.

### Task 1: Editorial catalog and pure behaviors

**Files:**
- Create: `dist/catalog.js`
- Test: `tests/catalog.test.mjs`

**Interfaces:**
- Produces `catalog`, `filterCatalog(items, { query, topic, savedIds })`, `getTopicCounts(items)`, `readSavedIds(store)`, and `writeSavedIds(store, ids)`.

- [ ] Write failing tests for mixed-case search, topic filtering, source metadata, and saved-id storage.
- [ ] Run `node --test tests/catalog.test.mjs` and confirm failure because the module is missing.
- [ ] Implement the catalog objects and pure helper functions in `dist/catalog.js`, using source labels and URLs from the approved spec.
- [ ] Run the targeted test and full `node --test` suite; confirm all pass.

### Task 2: Page shell and visual system

**Files:**
- Create: `dist/index.html`
- Create: `dist/styles.css`
- Test: `tests/page.test.mjs`

**Interfaces:**
- Consumes catalog field names from Task 1.
- Produces semantic landmarks, card containers, filter controls, modal shell, provenance links, and responsive styling for Task 3.

- [ ] Write failing structural tests for required landmarks, filter controls, dialog, and provenance links.
- [ ] Run `node --test tests/page.test.mjs` and confirm failure because the page is missing.
- [ ] Implement the complete HTML shell and CSS visual system, including mobile breakpoints, focus styles, and reduced motion.
- [ ] Run structural tests and `node --check dist/app.js` after the app entry exists; confirm the page contract passes.

### Task 3: Browser rendering and interactions

**Files:**
- Create: `dist/app.js`
- Modify: `dist/index.html`
- Test: `tests/page.test.mjs`

**Interfaces:**
- Consumes Task 1 helpers and Task 2 DOM hooks.
- Produces rendered featured/catalog cards, composed filters, saved count, modal details, escape/backdrop close behavior, and external source links.

- [ ] Extend structural tests to assert the module entry and source links.
- [ ] Run the tests before implementation and confirm the new assertions fail.
- [ ] Implement rendering, filtering, localStorage persistence, modal focus return, and empty state messaging in `dist/app.js`.
- [ ] Run `node --test`, `node --check dist/app.js`, and a local HTTP smoke test that returns `200` for `/` and the main assets.

### Task 4: Verification and handoff

**Files:**
- Modify: `dist/index.html` or `dist/styles.css` only if verification finds a defect.

- [ ] Start the local static server using the Sites local-preview guidance.
- [ ] Verify the representative page, assets, and key interactions at desktop and 390px widths.
- [ ] Run the complete test and syntax suite after any fixes.
- [ ] Report the local path and verification evidence; note that the repo has no valid git metadata, so no commit or hosted deployment is possible from this workspace.
