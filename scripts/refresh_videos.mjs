import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CHANNEL_ID = 'UC-BAdkBGjOIlccGLZ3jbLiA';
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
export const CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;

const careerPattern = /career|promotion|promot|manager|leadership|executive|decision|influence|stakeholder|senior|professional|work|job|amazon|ai/i;

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'");
}

function readTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`));
  return match ? decodeEntities(match[1].trim()) : '';
}

export function parseYouTubeFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const block = match[1];
    const id = readTag(block, 'yt:videoId');
    const title = readTag(block, 'title');
    const published = readTag(block, 'published');
    return {
      id,
      title,
      published,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }).filter((entry) => entry.id && entry.title && entry.published);
}

function topicFor(title) {
  if (/manager|managing up|stakeholder|promotion/i.test(title)) return ['managing-up', 'Managing up'];
  if (/decision|decisive|judgment|influence|presence|communication/i.test(title)) return ['human-dynamics', 'Human dynamics'];
  if (/execution|deliver|ship|ai/i.test(title)) return ['execution', 'Execution'];
  return ['career-moves', 'Career moves'];
}

function accentFor(id) {
  return ['lime', 'coral', 'blue', 'violet', 'amber', 'green', 'rose', 'teal', 'orange', 'plum'][
    [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 10
  ];
}

export function selectCareerVideos(entries, { existingUrls = new Set(), limit = 8 } = {}) {
  return entries
    .filter((entry) => careerPattern.test(entry.title) && !existingUrls.has(entry.watchUrl))
    .slice(0, limit)
    .map((entry) => {
      const [topic, topicLabel] = topicFor(entry.title);
      return {
        id: `fresh-${entry.id}`,
        title: entry.title,
        deck: 'A new public video from Ethan Evans.',
        topic,
        topicLabel,
        sourceLabel: 'Fresh source',
        sourceNote: 'Auto-discovered from Ethan’s official YouTube feed; review before publishing.',
        sourceUrl: CHANNEL_URL,
        watchUrl: entry.watchUrl,
        duration: 'Watch on YouTube',
        accent: accentFor(entry.id),
        published: entry.published,
      };
    });
}

export function renderRecentVideosModule(items) {
  return `export const recentVideos = ${JSON.stringify(items, null, 2)};\n`;
}

async function refresh() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const response = await fetch(FEED_URL);
  if (!response.ok) throw new Error(`YouTube feed request failed: ${response.status}`);
  const entries = parseYouTubeFeed(await response.text());
  const recentPath = path.join(root, 'dist', 'recent-videos.js');
  const catalogModule = await import(pathToFileURL(path.join(root, 'dist', 'catalog.js')).href + `?refresh=${Date.now()}`);
  const recentModule = await import(pathToFileURL(recentPath).href + `?refresh=${Date.now()}`);
  const existingUrls = new Set([...catalogModule.catalog, ...recentModule.recentVideos].map((item) => item.watchUrl));
  const nextItems = selectCareerVideos(entries, { existingUrls });
  const merged = [...nextItems, ...recentModule.recentVideos]
    .sort((a, b) => new Date(b.published ?? 0) - new Date(a.published ?? 0))
    .slice(0, 12);
  fs.writeFileSync(recentPath, renderRecentVideosModule(merged));
  console.log(`YouTube feed: ${entries.length} entries, ${nextItems.length} new career videos, ${merged.length} recent videos kept.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  refresh().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
