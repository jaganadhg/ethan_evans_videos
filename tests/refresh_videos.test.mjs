import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseYouTubeFeed,
  renderRecentVideosModule,
  selectCareerVideos,
} from '../scripts/refresh_videos.mjs';

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <yt:videoId>abc123_XY</yt:videoId>
    <title>How to Lead Through a Promotion</title>
    <published>2026-11-01T12:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123_XY"/>
  </entry>
  <entry>
    <yt:videoId>off-topic-1</yt:videoId>
    <title>Weekend vlog</title>
    <published>2026-10-30T12:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=off-topic-1"/>
  </entry>
</feed>`;

test('parses exact video ids, titles, dates, and watch URLs from RSS', () => {
  const entries = parseYouTubeFeed(feed);

  assert.deepEqual(entries, [
    {
      id: 'abc123_XY',
      title: 'How to Lead Through a Promotion',
      published: '2026-11-01T12:00:00+00:00',
      watchUrl: 'https://www.youtube.com/watch?v=abc123_XY',
    },
    {
      id: 'off-topic-1',
      title: 'Weekend vlog',
      published: '2026-10-30T12:00:00+00:00',
      watchUrl: 'https://www.youtube.com/watch?v=off-topic-1',
    },
  ]);
});

test('selects career and leadership videos while skipping duplicates and unrelated uploads', () => {
  const selected = selectCareerVideos(parseYouTubeFeed(feed), {
    existingUrls: new Set(['https://www.youtube.com/watch?v=already-there']),
  });

  assert.deepEqual(selected.map((item) => item.id), ['fresh-abc123_XY']);
  assert.equal(selected[0].sourceLabel, 'Fresh source');
  assert.equal(selected[0].topic, 'managing-up');
});

test('renders a safe JavaScript module for the browser catalog', () => {
  const moduleText = renderRecentVideosModule([
    {
      id: 'abc123_XY',
      title: 'A <safe> title',
      deck: 'A new public video from Ethan Evans.',
      topic: 'career-moves',
      topicLabel: 'Career moves',
      sourceLabel: 'Fresh source',
      sourceNote: 'Auto-discovered from Ethan’s official YouTube feed.',
      sourceUrl: 'https://www.youtube.com/channel/UC-BAdkBGjOIlccGLZ3jbLiA',
      watchUrl: 'https://www.youtube.com/watch?v=abc123_XY',
      duration: 'Watch on YouTube',
      accent: 'blue',
    },
  ]);

  assert.match(moduleText, /export const recentVideos = \[/);
  assert.match(moduleText, /A <safe> title/);
  assert.match(moduleText, /abc123_XY/);
});
