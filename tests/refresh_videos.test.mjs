import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildYtDlpArgs,
  mergeVideoArchive,
  parseYouTubeFeed,
  parseYtDlpOutput,
  refreshArchive,
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
  assert.match(selected[0].sourceNote, /yt-dlp/);
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

test('normalizes yt-dlp playlist JSON into exact watch records', () => {
  const entries = parseYtDlpOutput(JSON.stringify({
    entries: [
      {
        id: 'yt-dlp-1',
        title: 'Leadership in Practice',
        description: 'A useful conversation about leading teams.',
        upload_date: '20251010',
        webpage_url: 'https://www.youtube.com/watch?v=yt-dlp-1',
      },
      null,
    ],
  }));

  assert.deepEqual(entries, [
    {
      id: 'yt-dlp-1',
      title: 'Leadership in Practice',
      description: 'A useful conversation about leading teams.',
      published: '2025-10-10T00:00:00.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=yt-dlp-1',
    },
  ]);
});

test('keeps only relevant videos published within the rolling five-year window', () => {
  const selected = selectCareerVideos([
    {
      id: 'inside-window',
      title: 'A Conversation',
      description: 'How to build executive presence.',
      published: '2021-11-02T00:00:00.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=inside-window',
    },
    {
      id: 'outside-window',
      title: 'Leadership Lessons',
      description: '',
      published: '2021-11-01T23:59:59.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=outside-window',
    },
    {
      id: 'not-relevant',
      title: 'Weekend Vlog',
      description: 'A walk around the city.',
      published: '2025-01-01T00:00:00.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=not-relevant',
    },
  ], { now: '2026-11-02T00:00:00.000Z' });

  assert.deepEqual(selected.map((item) => item.id), ['fresh-inside-window']);
});

test('merges archive records by video id and lets newly discovered metadata win', () => {
  const merged = mergeVideoArchive(
    [{ id: 'same', title: 'Old title', published: '2025-01-01T00:00:00.000Z' }],
    [
      { id: 'same', title: 'Updated title', published: '2025-01-02T00:00:00.000Z' },
      { id: 'new', title: 'New video', published: '2025-01-03T00:00:00.000Z' },
    ],
  );

  assert.deepEqual(merged.map((item) => item.id), ['new', 'same']);
  assert.equal(merged.find((item) => item.id === 'same').title, 'Updated title');
});

test('does not cap the filtered archive at twelve videos', () => {
  const entries = Array.from({ length: 13 }, (_, index) => ({
    id: `archive-${index}`,
    title: `Leadership lesson ${index}`,
    description: '',
    published: `2025-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
    watchUrl: `https://www.youtube.com/watch?v=archive-${index}`,
  }));

  assert.equal(selectCareerVideos(entries, { now: '2026-11-02T00:00:00.000Z' }).length, 13);
});

test('builds a delayed metadata-only yt-dlp command', () => {
  const args = buildYtDlpArgs({
    channelUrl: 'https://www.youtube.com/channel/example/videos',
    sleepSeconds: 3,
  });

  assert.deepEqual(args, [
    '--dump-single-json',
    '--skip-download',
    '--no-flat-playlist',
    '--no-warnings',
    '--ignore-errors',
    '--sleep-requests',
    '3',
    'https://www.youtube.com/channel/example/videos',
  ]);
});

test('refreshes the archive through a fake yt-dlp executable without downloading media', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ethan-videos-'));
  const executable = path.join(root, 'fake-yt-dlp');
  const archivePath = path.join(root, 'ethan-channel-videos.json');
  const recentPath = path.join(root, 'recent-videos.js');
  const output = JSON.stringify({
    entries: [{
      id: 'fake-video',
      title: 'Executive Presence for Career Growth',
      description: 'How to earn promotion opportunities.',
      upload_date: '20251010',
    }],
  });

  fs.writeFileSync(executable, `#!/bin/sh\nprintf '%s' '${output}'\n`);
  fs.chmodSync(executable, 0o755);

  await refreshArchive({
    archivePath,
    recentPath,
    executable,
    sleepSeconds: 2,
    retryDelayMs: 0,
    now: '2026-11-02T00:00:00.000Z',
  });

  assert.deepEqual(JSON.parse(fs.readFileSync(archivePath, 'utf8')).map((item) => item.id), ['fake-video']);
  assert.match(fs.readFileSync(recentPath, 'utf8'), /fake-video/);
});

test('does not replace the prior archive when yt-dlp fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ethan-videos-failure-'));
  const executable = path.join(root, 'failing-yt-dlp');
  const archivePath = path.join(root, 'ethan-channel-videos.json');
  const recentPath = path.join(root, 'recent-videos.js');
  const previousArchive = '[{"id":"previous","title":"Previous","published":"2025-01-01T00:00:00.000Z","watchUrl":"https://www.youtube.com/watch?v=previous"}]';
  const previousRecent = 'export const recentVideos = [];\n';

  fs.writeFileSync(executable, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(executable, 0o755);
  fs.writeFileSync(archivePath, previousArchive);
  fs.writeFileSync(recentPath, previousRecent);

  await assert.rejects(
    refreshArchive({ archivePath, recentPath, executable, retries: 2, retryDelayMs: 0 }),
    /yt-dlp failed after 2 attempts/,
  );

  assert.equal(fs.readFileSync(archivePath, 'utf8'), previousArchive);
  assert.equal(fs.readFileSync(recentPath, 'utf8'), previousRecent);
});
