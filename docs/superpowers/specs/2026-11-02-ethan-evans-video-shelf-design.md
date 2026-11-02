# Ethan Evans Video Shelf Design

## Intent

Build a focused, YouTube-style discovery page for people who want the career and leadership videos Ethan Evans repeatedly points toward. The experience should feel like a considered research shelf, not a generic video portal or an official Ethan Evans product.

## Goals

- Let a visitor browse a small, high-signal set of videos in under a minute.
- Make the curation boundary explicit: cards are tied to recurring recommendations and themes visible in Ethan's public material.
- Provide useful search, topic filters, save toggles, and a lightweight detail view without accounts or backend state.
- Link every card back to YouTube or the relevant public source.
- Be responsive and keyboard accessible.

## Non-goals

- Do not imply affiliation with Ethan Evans or YouTube.
- Do not claim an exact recommendation count unless a source states it.
- Do not build a full video player, comments system, authentication, or server-side catalog.
- Do not present ordinary career content as Ethan-endorsed just because it is topically similar.

## Anti-goals

- Avoid copying YouTube's exact visual identity or using misleading official-looking labels.
- Avoid invented thumbnails, view counts, testimonials, or publication dates.
- Avoid presenting unverified third-party videos as if Ethan personally recommended them.

## Content and provenance

The home page will frame the catalog as “A careful shelf of videos connected to recommendations Ethan Evans returns to,” with a provenance note in the detail modal.

The catalog uses public, verifiable anchors:

- Ethan's official site identifies his YouTube channel as a free resource for career-growth videos: https://www.ethanevans.com/
- His official book list explicitly recommends Leadership and Self-Deception and Decisive: https://www.ethanevans.com/books
- A transcript of Ethan's Lenny's Podcast appearance calls Decisive his number-one recommendation, Leadership and Self-Deception his second most recommended, and The Almanack of Naval Ravikant a recent recommendation: https://podcasts.highsignal.app/people/ethan-evans
- A 2021 profile records five books recommended by Ethan, including Decisive, Leadership and Self-Deception, I Moved Your Cheese, and Eat That Frog: https://www.winningspeechmoments.com/blog-posts/five-questions-for-ethan-evans-host-of-ethan-evans-podcast-and-former-vp-at-amazon
- A later transcript again identifies Leadership and Self-Deception as Ethan's all-time favorite recommendation: https://www.developing.dev/p/e068-ethan-evans

Because the public sources support recurring recommendation themes more strongly than an exhaustive, exact video-by-video list, each catalog item will use one of three labels: “Repeated signal,” “Direct source,” or “Related talk.” Only “Repeated signal” items may appear in the hero shelf. The data object for each card will include `sourceLabel`, `sourceUrl`, and `sourceNote` so the UI can show its basis.

## Approaches considered

1. Static browse-first shelf — selected. A single buildless HTML/JS page with a clear hero, search/filter toolbar, featured shelf, catalog grid, saved state, and detail modal. Best match for a carefully curated collection and the available public evidence.
2. Full app shell with accounts and watch history — rejected. It adds infrastructure and product surface without improving the evidence-backed curation the user asked for.
3. Embedded-player playlist — rejected. It would overstate editorial certainty, add third-party loading/privacy concerns, and make the site feel like a proxy for YouTube.

## Visual direction

Use a near-black ink background, warm paper/cream type, and a single citrus-lime accent. The visual language is “editorial research shelf”: oversized serif display type for the thesis, compact sans-serif metadata, subtle grid lines, soft paper-like cards, and colorful abstract thumbnail artwork generated with CSS rather than copied from YouTube. Use generous spacing and a restrained number of UI elements.

## Page structure

1. Slim top bar: mark, “Curated from Ethan's public recommendations,” source link, and saved count.
2. Hero: eyebrow, strong thesis headline, explanatory copy, two CTAs, and a visual “signal index” with 3 recurring themes.
3. Topic strip: All, Career moves, Managing up, Decision-making, Human dynamics.
4. Featured shelf: three “Repeated signal” cards with large visual treatments.
5. Catalog section: search input, sort button, result count, and responsive card grid.
6. Provenance footer: clear editorial disclaimer and links to Ethan's official site, book list, and YouTube channel.
7. Detail modal: title, topic, why it is here, source note, source link, save action, and close/escape behavior.

## Interaction contract

- Search filters by title, topic, and source note.
- Topic chips filter without a page reload.
- Save toggles persist in `localStorage` under a namespaced key.
- The saved tab shows only saved cards and updates its count.
- Clicking a card opens the modal; “Watch on YouTube” opens the source in a new tab.
- Escape closes the modal; clicking the backdrop closes it; focus returns to the triggering card.
- Empty states explain the current filter and provide a reset action.

## Implementation choices

- Buildless static HTML, CSS, and JavaScript in `dist/` so it can run locally and publish cleanly.
- No external framework or dependency.
- Use inline SVG/CSS thumbnail art with no unverified image metadata.
- Keep catalog data in a single JS array for easy editorial updates.
- Use semantic buttons, labels, dialog semantics, visible focus styles, and reduced-motion fallbacks.

## Success criteria

- A visitor can identify the editorial thesis and provenance within the first viewport.
- Every visible card has an honest source label and working source link.
- Search, filters, saving, modal open/close, and responsive layout work without console errors.
- The page remains useful even if YouTube is unavailable because the catalog itself is the primary experience.
