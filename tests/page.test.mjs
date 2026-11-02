import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../dist/index.html', import.meta.url);
const appPath = new URL('../dist/app.js', import.meta.url);

test('page shell exposes the editorial browse landmarks', () => {
  const html = fs.readFileSync(pagePath, 'utf8');

  assert.match(html, /<main\b/);
  assert.match(html, /id="featured-shelf"/);
  assert.match(html, /id="catalog-grid"/);
  assert.match(html, /id="search-input"/);
  assert.match(html, /id="topic-filters"/);
  assert.match(html, /<dialog\b[^>]*id="detail-dialog"/);
});

test('page includes provenance language and official source links', () => {
  const html = fs.readFileSync(pagePath, 'utf8');

  assert.match(html, /careful shelf/i);
  assert.match(html, /not affiliated/i);
  assert.match(html, /https:\/\/www\.ethanevans\.com\//);
  assert.match(html, /https:\/\/www\.youtube\.com\/channel\/UC-BAdkBGjOIlccGLZ3jbLiA/);
});

test('page loads the interaction module and exposes card-friendly hooks', () => {
  const html = fs.readFileSync(pagePath, 'utf8');

  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.match(html, /id="featured-grid"/);
  assert.match(html, /id="saved-count"/);
  assert.match(html, /id="detail-dialog"/);
});

test('saving an item refreshes both shelves', () => {
  const app = fs.readFileSync(appPath, 'utf8');

  assert.match(app, /persistSavedIds\(\);\s*renderFeatured\(\);\s*renderCatalog\(\);/);
});

test('cards do not contain nested button semantics', () => {
  const app = fs.readFileSync(appPath, 'utf8');

  assert.doesNotMatch(app, /class="video-card"[^>]*role="button"/);
});
