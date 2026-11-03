import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CHANNEL_ID = 'UC-BAdkBGjOIlccGLZ3jbLiA';
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
export const CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;
export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const careerPattern = /career|promotion|promot|manager|leadership|executive|decision|influence|stakeholder|senior|professional|workplace|work|job|amazon|ai/i;

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

function parsePublishedDate(value) {
  if (typeof value === 'string' && /^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }

  return null;
}

function normalizeArchiveRecord(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const id = String(entry.id ?? '').trim();
  const title = String(entry.title ?? '').trim();
  const publishedDate = parsePublishedDate(
    entry.published ?? entry.release_timestamp ?? entry.timestamp ?? entry.upload_date,
  );
  if (!id || !title || !publishedDate) return null;

  return {
    id,
    title,
    description: String(entry.description ?? '').trim(),
    published: publishedDate.toISOString(),
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
  };
}

export function buildYouTubeApiUrl(resource, params, apiKey, apiBaseUrl = YOUTUBE_API_BASE_URL) {
  const url = new URL(`${apiBaseUrl.replace(/\/$/, '')}/${resource}`);
  for (const [name, value] of Object.entries({ ...params, key: apiKey })) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, String(value));
    }
  }
  return url.href;
}

export function parseYouTubeApiChannel(payload) {
  const uploads = payload?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (typeof uploads !== 'string' || !uploads.trim()) {
    throw new Error('YouTube API returned no uploads playlist for the channel');
  }
  return uploads.trim();
}

export function parseYouTubeApiItems(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((item) => normalizeArchiveRecord({
    id: item?.contentDetails?.videoId ?? item?.snippet?.resourceId?.videoId,
    title: item?.snippet?.title,
    description: item?.snippet?.description,
    published: item?.contentDetails?.videoPublishedAt ?? item?.snippet?.publishedAt,
  })).filter(Boolean);
}

export function mergeVideoArchive(existing, discovered) {
  const records = new Map();
  for (const entry of [...existing, ...discovered]) {
    const normalized = normalizeArchiveRecord(entry);
    if (normalized) records.set(normalized.id, normalized);
  }

  return [...records.values()].sort((left, right) => (
    new Date(right.published).valueOf() - new Date(left.published).valueOf()
  ));
}

function readArchive(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writeAtomically(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function numericEnv(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

async function fetchYouTubeApiJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`YouTube API returned invalid JSON (HTTP ${response.status ?? 'unknown'})`);
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status ?? 'unknown'}`;
    throw new Error(`YouTube API request failed: ${message}`);
  }

  return payload;
}

export async function runYouTubeApi({
  apiKey = process.env.YOUTUBE_API_KEY,
  channelId = CHANNEL_ID,
  apiBaseUrl = YOUTUBE_API_BASE_URL,
  fetchImpl = globalThis.fetch,
  pageSize = 50,
} = {}) {
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is required');
  if (typeof fetchImpl !== 'function') throw new Error('global fetch is unavailable');

  const channelPayload = await fetchYouTubeApiJson(
    buildYouTubeApiUrl('channels', { part: 'contentDetails', id: channelId }, apiKey, apiBaseUrl),
    fetchImpl,
  );
  const uploadsPlaylistId = parseYouTubeApiChannel(channelPayload);
  const records = new Map();
  let pageToken;

  do {
    const playlistPayload = await fetchYouTubeApiJson(
      buildYouTubeApiUrl('playlistItems', {
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(50, Math.max(1, Math.floor(pageSize))),
        pageToken,
      }, apiKey, apiBaseUrl),
      fetchImpl,
    );
    for (const record of parseYouTubeApiItems(playlistPayload)) records.set(record.id, record);
    pageToken = playlistPayload.nextPageToken;
  } while (pageToken);

  const discovered = [...records.values()];
  if (!discovered.length) throw new Error('YouTube API returned no public videos');
  return discovered;
}

async function discoverWithRetries(options) {
  const attempts = Math.max(1, Math.floor(options.retries));
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await runYouTubeApi(options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts && options.retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs));
      }
    }
  }

  throw new Error(`YouTube API failed after ${attempts} attempts: ${lastError.message}`);
}

export async function refreshArchive({
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  archivePath,
  recentPath,
  apiKey = process.env.YOUTUBE_API_KEY,
  channelId = CHANNEL_ID,
  apiBaseUrl = YOUTUBE_API_BASE_URL,
  fetchImpl = globalThis.fetch,
  pageSize = 50,
  retries = Math.max(1, Math.floor(numericEnv('YOUTUBE_API_RETRIES', 3))),
  retryDelayMs = Math.max(0, numericEnv('YOUTUBE_API_RETRY_DELAY_MS', 2000)),
  existingUrls = new Set(),
  now = new Date(),
} = {}) {
  const resolvedArchivePath = archivePath ?? path.join(root, 'data', 'ethan-channel-videos.json');
  const resolvedRecentPath = recentPath ?? path.join(root, 'dist', 'recent-videos.js');
  const discovered = await discoverWithRetries({
    apiKey,
    channelId,
    apiBaseUrl,
    fetchImpl,
    pageSize,
    retries,
    retryDelayMs,
  });
  const merged = mergeVideoArchive(readArchive(resolvedArchivePath), discovered);
  const recent = selectCareerVideos(merged, { existingUrls, now });

  writeAtomically(resolvedArchivePath, `${JSON.stringify(merged, null, 2)}\n`);
  writeAtomically(resolvedRecentPath, renderRecentVideosModule(recent));
  return { discoveredCount: discovered.length, archiveCount: merged.length, recentCount: recent.length };
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

export function selectCareerVideos(entries, {
  existingUrls = new Set(),
  limit = Infinity,
  now = new Date(),
  years = 5,
} = {}) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  const upperBound = new Date(now);

  return entries
    .map(normalizeArchiveRecord)
    .filter(Boolean)
    .filter((entry) => {
      const published = new Date(entry.published);
      return published >= cutoff && published <= upperBound;
    })
    .filter((entry) => careerPattern.test(`${entry.title} ${entry.description}`))
    .filter((entry) => !existingUrls.has(entry.watchUrl))
    .sort((left, right) => new Date(right.published).valueOf() - new Date(left.published).valueOf())
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
        sourceNote: 'Auto-discovered from Ethan’s public YouTube channel with YouTube Data API; review before publishing.',
        sourceUrl: CHANNEL_URL,
        watchUrl: entry.watchUrl,
        duration: 'Watch on YouTube',
        accent: accentFor(entry.id),
        description: entry.description,
        published: entry.published,
      };
    });
}

export function renderRecentVideosModule(items) {
  return `export const recentVideos = ${JSON.stringify(items, null, 2)};\n`;
}

async function refresh() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const catalogModule = await import(pathToFileURL(path.join(root, 'dist', 'catalog.js')).href + `?refresh=${Date.now()}`);
  const curatedUrls = new Set(
    catalogModule.catalog
      .filter((item) => !item.id.startsWith('fresh-'))
      .map((item) => item.watchUrl),
  );
  const result = await refreshArchive({ root, existingUrls: curatedUrls });
  console.log(`YouTube Data API: ${result.discoveredCount} videos discovered, ${result.archiveCount} cached, ${result.recentCount} relevant videos generated.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  refresh().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
