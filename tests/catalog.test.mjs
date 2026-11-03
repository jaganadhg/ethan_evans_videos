import test from 'node:test';
import assert from 'node:assert/strict';

import {
  catalog,
  filterCatalog,
  getTopicCounts,
  readSavedIds,
  writeSavedIds,
} from '../dist/catalog.js';

test('search is case-insensitive across titles and source notes', () => {
  const results = filterCatalog(catalog, { query: 'STAKEHOLDERS' });

  assert.ok(results.some((item) => item.id === 'decisive'));
});

test('topic and saved filters compose without mutating the catalog', () => {
  const results = filterCatalog(catalog, {
    topic: 'decision-strategy',
    savedIds: new Set(['decisive']),
  });

  assert.deepEqual(results.map((item) => item.id), ['decisive']);
  assert.equal(catalog.length > results.length, true);
});

test('every catalog item has source-backed watch metadata', () => {
  assert.ok(catalog.length >= 8);

  for (const item of catalog) {
    assert.ok(item.title);
    assert.ok(item.sourceLabel);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.match(item.watchUrl, /^https:\/\//);
    assert.ok(item.sourceNote);
  }
});

test('every catalog item opens one exact YouTube watch URL', () => {
  const urls = catalog.map((item) => item.watchUrl);

  assert.equal(new Set(urls).size, catalog.length);
  for (const url of urls) {
    assert.match(url, /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+$/);
  }
});

test('topic counts include the all count and known topics', () => {
  const counts = getTopicCounts(catalog);

  assert.equal(counts.all, catalog.length);
  assert.ok(counts['career-growth'] > 0);
  assert.ok(counts['executive-presence'] > 0);
});

test('saved ids round-trip through a storage-like object', () => {
  const values = new Map();
  const store = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.deepEqual(readSavedIds(store), []);
  writeSavedIds(store, ['decisive', 'magic-loop']);
  assert.deepEqual(readSavedIds(store), ['decisive', 'magic-loop']);
});
