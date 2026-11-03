import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildYouTubeApiUrl,
  classifyVideo,
  mergeVideoArchive,
  parseYouTubeApiChannel,
  parseYouTubeApiItems,
  parseYouTubeFeed,
  refreshArchive,
  renderRecentVideosModule,
  runYouTubeApi,
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
  assert.equal(selected[0].sourceLabel, 'Auto-discovered');
  assert.match(selected[0].sourceNote, /YouTube Data API/);
  assert.equal(selected[0].topic, 'career-growth');
});

test('classifies representative videos into precise primary topics and secondary tags', () => {
  const cases = [
    ['Get Promoted into Senior Leadership Roles', 'career-growth', 'Career Growth & Promotion'],
    ['New Rules of Executive Visibility: Be Seen, Remembered, & Invited', 'executive-presence', 'Executive Presence & Visibility'],
    ['Make Your Career Goals Clear to Your Manager', 'managing-up', 'Managing Up & Influence'],
    ['60% of new managers fail within 18 months', 'leadership-management', 'Leadership & People Management'],
    ['Write for Clarity & Marinate on Ideas', 'communication', 'Communication & Difficult Conversations'],
    ['Vibe-coding the Agent Owner Spec: for AI-native PMs', 'ai-product-leadership', 'AI-Era Work & Product Leadership'],
    ['Breaking Rules, Making Exceptions, Good Judgement', 'decision-strategy', 'Decision-Making & Strategy'],
    ['Fighting Imposter Syndrome', 'personal-effectiveness', 'Personal Effectiveness & Resilience'],
    ['Networking Rule of 3', 'career-growth', 'Career Growth & Promotion'],
    ['Constraints Fuel Innovation', 'decision-strategy', 'Decision-Making & Strategy'],
  ];

  for (const [title, topic, topicLabel] of cases) {
    const result = classifyVideo(title);
    assert.equal(result.topic, topic, title);
    assert.equal(result.topicLabel, topicLabel, title);
  }

  assert.ok(classifyVideo('Hardball Negotiations #salary').tags.includes('Compensation & negotiation'));
  assert.equal(classifyVideo('Vibe-coding the Agent Owner Spec (live demo)').format, 'Live demo');
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

test('builds encoded YouTube Data API URLs with the API key', () => {
  const url = buildYouTubeApiUrl('channels', {
    part: 'contentDetails',
    id: 'UC example',
  }, 'test-key');

  assert.equal(
    url,
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=UC+example&key=test-key',
  );
});

test('parses the channel uploads playlist id from the Data API', () => {
  assert.equal(parseYouTubeApiChannel({
    items: [{ contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }],
  }), 'uploads-1');
});

test('normalizes YouTube Data API playlist items into exact watch records', () => {
  const entries = parseYouTubeApiItems({
    items: [{
      snippet: {
        title: 'Leadership in Practice',
        description: 'A useful conversation about leading teams.',
        publishedAt: '2025-10-10T00:00:00.000Z',
        resourceId: { videoId: 'youtube-api-1' },
      },
      contentDetails: { videoPublishedAt: '2025-10-09T00:00:00.000Z' },
    }, null],
  });

  assert.deepEqual(entries, [
    {
      id: 'youtube-api-1',
      title: 'Leadership in Practice',
      description: 'A useful conversation about leading teams.',
      published: '2025-10-09T00:00:00.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=youtube-api-1',
    },
  ]);
});

test('fetches all YouTube Data API pages for a channel', async () => {
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/channels')) {
      return {
        ok: true,
        json: async () => ({
          items: [{ contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }],
        }),
      };
    }

    const pageToken = parsed.searchParams.get('pageToken');
    return {
      ok: true,
      json: async () => ({
        items: [{
          snippet: {
            title: pageToken ? 'Second leadership lesson' : 'First leadership lesson',
            description: 'How to lead teams.',
            publishedAt: '2025-10-10T00:00:00.000Z',
            resourceId: { videoId: pageToken ? 'video-2' : 'video-1' },
          },
        }],
        ...(pageToken ? {} : { nextPageToken: 'page-2' }),
      }),
    };
  };

  const entries = await runYouTubeApi({ apiKey: 'test-key', fetchImpl });

  assert.deepEqual(entries.map((entry) => entry.id), ['video-1', 'video-2']);
  assert.equal(requestedUrls.length, 3);
  assert.match(requestedUrls[2], /pageToken=page-2/);
});

test('requires an API key before making YouTube requests', async () => {
  await assert.rejects(
    runYouTubeApi({ apiKey: '', fetchImpl: async () => { throw new Error('unexpected request'); } }),
    /YOUTUBE_API_KEY is required/,
  );
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

test('refreshes the archive through a fake YouTube Data API without downloading media', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ethan-videos-'));
  const archivePath = path.join(root, 'ethan-channel-videos.json');
  const recentPath = path.join(root, 'recent-videos.js');
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/channels')) {
      return { ok: true, json: async () => ({
        items: [{ contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }],
      }) };
    }
    return { ok: true, json: async () => ({
      items: [{
        snippet: {
          title: 'Executive Presence for Career Growth',
          description: 'How to earn promotion opportunities.',
          publishedAt: '2025-10-10T00:00:00.000Z',
          resourceId: { videoId: 'fake-video' },
        },
      }],
    }) };
  };

  await refreshArchive({
    archivePath,
    recentPath,
    apiKey: 'test-key',
    fetchImpl,
    retryDelayMs: 0,
    now: '2026-11-02T00:00:00.000Z',
  });

  assert.deepEqual(JSON.parse(fs.readFileSync(archivePath, 'utf8')).map((item) => item.id), ['fake-video']);
  assert.match(fs.readFileSync(recentPath, 'utf8'), /fake-video/);
});

test('does not replace the prior archive when the YouTube API fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ethan-videos-failure-'));
  const archivePath = path.join(root, 'ethan-channel-videos.json');
  const recentPath = path.join(root, 'recent-videos.js');
  const previousArchive = '[{"id":"previous","title":"Previous","published":"2025-01-01T00:00:00.000Z","watchUrl":"https://www.youtube.com/watch?v=previous"}]';
  const previousRecent = 'export const recentVideos = [];\n';

  fs.writeFileSync(archivePath, previousArchive);
  fs.writeFileSync(recentPath, previousRecent);

  await assert.rejects(
    refreshArchive({
      archivePath,
      recentPath,
      apiKey: 'test-key',
      fetchImpl: async () => { throw new Error('API unavailable'); },
      retries: 2,
      retryDelayMs: 0,
    }),
    /YouTube API failed after 2 attempts/,
  );

  assert.equal(fs.readFileSync(archivePath, 'utf8'), previousArchive);
  assert.equal(fs.readFileSync(recentPath, 'utf8'), previousRecent);
});
