import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CHANNEL_ID = 'UC-BAdkBGjOIlccGLZ3jbLiA';
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
export const CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;
export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const careerPattern = /\b(career|manager|leadership|executive|decision|influence|stakeholder|senior|professional|workplace|work|job|amazon|ai|network\w*|product\w*|design|innovation|meaning)\b|\bpromot\w*\b|\btpm\b|constraints fuel innovation|assume best intentions|curb cut effect|9-enders/i;

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

const topicRules = [
  ['ai-product-leadership', 'AI-Era Work & Product Leadership', /\bai\b|ai[- ]native|agent|vibe[- ]cod|claude|automation|machine age|product (?:manager|management|skills|insights|director)|\btpm\b|spec engineering|\bevals?\b/i],
  ['executive-presence', 'Executive Presence & Visibility', /executive presence|visibility|\bvisible\b|be heard|remembered|own the room|public speak|all[- ]hands|executive sponsorship/i],
  ['managing-up', 'Managing Up & Influence', /managing up|stakeholder|skip[- ]level|\b1:1\b|one[- ]on[- ]one|buy[- ]in|sponsorship|\binfluence\b|career goals?[^.]{0,50}\bmanager\b|decode your manager/i],
  ['career-transitions', 'Career Transitions & Independent Work', /leaving.*corporate|corporate.*job|entrepreneur|startup|founder|business idea|retirement|independent|consult|freelanc|venture capital/i],
  ['career-growth', 'Career Growth & Promotion', /career|\bpromot\w*\b|senior|move up|stand out|early career|professional|resume|interview|scope|performance review/i],
  ['leadership-management', 'Leadership & People Management', /new managers?|people manager|leadership|\bleader\b|\bteam\b|delegat|coach|mentor|high[- ]perform|culture of|manager/i],
  ['communication', 'Communication & Difficult Conversations', /communicat|clarity|rambl|writing|\bwrite\b|difficult message|hard.*delicate|peer conflict|\bconflict\b|public speak|talk to executives|say you stink|emotional people|assume best intentions|\bfeedback\b/i],
  ['decision-strategy', 'Decision-Making & Strategy', /decision|judg|strateg|priorit|trade[- ]off|operating principles|ownership|working backwards|rules, making exceptions|exec 1-pager|roadmap|metrics|hard deadline|constraints fuel innovation|curb cut effect/i],
  ['personal-effectiveness', 'Personal Effectiveness & Resilience', /habit|productiv|focus|energy|imposter|confidence|mindset|boundar|resilien|motivat|unstuck|goals|peak performance|intensity|meaning of life|9-enders/i],
];

const tagRules = [
  ['Promotion & advancement', /\bpromot\w*\b|senior leadership|move up|career growth|stand out/i],
  ['Executive presence & visibility', /executive presence|visibility|\bvisible\b|be heard|remembered|own the room|public speak|all[- ]hands/i],
  ['Managing up & stakeholders', /managing up|stakeholder|skip[- ]level|\b1:1\b|one[- ]on[- ]one|buy[- ]in|sponsorship|influence|manager/i],
  ['AI & automation', /\bai\b|ai[- ]native|agent|vibe[- ]cod|claude|automation|machine age/i],
  ['Product management', /product (?:manager|management|skills|insights)|ai[- ]native pm|spec engineering|agent owner|\bevals?\b/i],
  ['Communication', /communicat|clarity|rambl|writing|\bwrite\b|public speak|talk to executives|difficult message/i],
  ['Leadership & management', /leadership|\bleader\b|\bteam\b|manager|delegat|coach|mentor|high[- ]perform|culture/i],
  ['Decision-making', /decision|judg|strateg|priorit|trade[- ]off|operating principles|ownership|working backwards|roadmap|metrics/i],
  ['Design & innovation', /design|innovation|curb cut|creativ/i],
  ['Compensation & negotiation', /salary|negotiat|paid more|counter offer|high paying/i],
  ['Performance & feedback', /performance review|feedback|peer review|high standards/i],
  ['Networking & sponsorship', /network|sponsor|mentor|relationship|connector/i],
  ['Career transitions', /leaving.*corporate|corporate.*job|entrepreneur|startup|founder|business idea|retirement|independent|consult/i],
];

function classificationText(title, description = '') {
  const leadDescription = String(description).split(/\n\s*-{3,}\s*/)[0];
  return `${String(title)}\n${leadDescription}`;
}

export function classifyVideo(title, description = '') {
  const titleText = String(title);
  const text = classificationText(title, description);
  const [topic, topicLabel] = topicRules.find(([, , pattern]) => pattern.test(titleText))
    ?? topicRules.find(([, , pattern]) => pattern.test(text))
    ?? ['career-growth', 'Career Growth & Promotion'];
  const titleTags = tagRules
    .filter(([, pattern]) => pattern.test(titleText))
    .map(([label]) => label);
  const tags = titleTags;
  let format = 'Lesson';
  if (/live demo|built live|real demo/i.test(text)) format = 'Live demo';
  else if (/masterclass|workshop/i.test(text)) format = 'Masterclass';
  else if (/trailer|\bclip\b/i.test(text)) format = 'Clip / trailer';
  else if (/conversation|discussion|interview|\bama\b| with [A-Z]/i.test(text)) format = 'Conversation';

  return { topic, topicLabel, tags, format };
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
    .filter((entry) => careerPattern.test(classificationText(entry.title, entry.description)))
    .filter((entry) => !existingUrls.has(entry.watchUrl))
    .sort((left, right) => new Date(right.published).valueOf() - new Date(left.published).valueOf())
    .slice(0, limit)
    .map((entry) => {
      const classification = classifyVideo(entry.title, entry.description);
      return {
        id: `fresh-${entry.id}`,
        title: entry.title,
        deck: 'A new public video from Ethan Evans.',
        topic: classification.topic,
        topicLabel: classification.topicLabel,
        tags: classification.tags,
        format: classification.format,
        sourceLabel: 'Auto-discovered',
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
