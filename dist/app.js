import {
  catalog,
  filterCatalog,
  getTopicCounts,
  readSavedIds,
  writeSavedIds,
} from './catalog.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  featuredGrid: $('#featured-grid'),
  catalogGrid: $('#catalog-grid'),
  emptyState: $('#empty-state'),
  searchInput: $('#search-input'),
  topicFilters: $('#topic-filters'),
  resultCount: $('#result-count'),
  savedCount: $('#saved-count'),
  savedLink: $('#saved-link'),
  heroSavedButton: $('#hero-saved-button'),
  resetFilters: $('#reset-filters'),
  dialog: $('#detail-dialog'),
  dialogClose: $('#dialog-close'),
  dialogArt: $('#dialog-art'),
  dialogTopic: $('#dialog-topic'),
  dialogDuration: $('#dialog-duration'),
  dialogSource: $('#dialog-source'),
  dialogTitle: $('#dialog-title'),
  dialogDeck: $('#dialog-deck'),
  dialogNote: $('#dialog-note'),
  dialogWatch: $('#dialog-watch'),
  dialogSave: $('#dialog-save'),
  dialogSourceLink: $('#dialog-source-link'),
};

const topicCounts = getTopicCounts(catalog);
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

const state = {
  query: '',
  topic: 'all',
  showSaved: false,
  savedIds: new Set(readSavedIds(storage)),
  activeDialogId: null,
  returnFocus: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cardMarkup(item, { featured = false } = {}) {
  const isSaved = state.savedIds.has(item.id);
  const accent = `thumb-${item.accent}`;
  const source = item.sourceLabel === 'Repeated signal' ? '↗ Repeated signal' : item.sourceLabel;

  return `
    <article class="video-card" data-open-id="${escapeHtml(item.id)}" tabindex="0" role="group" aria-label="Open details for ${escapeHtml(item.title)}">
      <div class="thumbnail ${accent}">
        <div class="thumbnail-art" aria-hidden="true"></div>
        <div class="thumb-top"><span class="source-tag">${escapeHtml(source)}</span><span>${escapeHtml(item.duration)}</span></div>
        <button class="save-button${isSaved ? ' is-saved' : ''}" type="button" data-save-id="${escapeHtml(item.id)}" aria-label="${isSaved ? 'Remove' : 'Save'} ${escapeHtml(item.title)}" aria-pressed="${isSaved}">${isSaved ? '★' : '☆'}</button>
        <span class="thumb-play" aria-hidden="true">↗</span>
        <div class="thumb-bottom">${escapeHtml(item.title)}</div>
      </div>
      <div class="card-body">
        <div class="card-meta"><span class="topic">${escapeHtml(item.topicLabel)}</span><span>${featured ? 'Start here' : 'Open note'} ↗</span></div>
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <p class="card-deck">${escapeHtml(item.deck)}</p>
      </div>
    </article>
  `;
}

function renderFeatured() {
  elements.featuredGrid.innerHTML = catalog
    .filter((item) => item.featured)
    .map((item) => cardMarkup(item, { featured: true }))
    .join('');
}

function renderTopics() {
  $$('.chip').forEach((chip) => {
    const topic = chip.dataset.topic;
    const count = topicCounts[topic] ?? 0;
    const countElement = chip.querySelector('span');
    if (countElement) countElement.textContent = count;
    chip.classList.toggle('is-active', !state.showSaved && state.topic === topic);
  });
}

function renderCatalog() {
  const filtered = filterCatalog(catalog, {
    query: state.query,
    topic: state.topic,
    savedIds: state.showSaved ? state.savedIds : undefined,
  });

  elements.catalogGrid.innerHTML = filtered.map((item) => cardMarkup(item)).join('');
  elements.catalogGrid.hidden = filtered.length === 0;
  elements.emptyState.hidden = filtered.length !== 0;
  elements.resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'video' : 'videos'}${state.showSaved ? ' saved' : ''}`;
  elements.savedCount.textContent = state.savedIds.size;
  elements.savedLink.querySelector('span:first-child').textContent = state.showSaved ? 'All videos' : 'Saved shelf';
  renderTopics();
}

function render() {
  renderFeatured();
  renderCatalog();
}

function persistSavedIds() {
  writeSavedIds(storage, [...state.savedIds]);
}

function toggleSaved(id) {
  if (state.savedIds.has(id)) state.savedIds.delete(id);
  else state.savedIds.add(id);
  persistSavedIds();
  renderFeatured();
  renderCatalog();
  if (state.activeDialogId === id) updateDialogSave();
}

function updateDialogSave() {
  const isSaved = state.savedIds.has(state.activeDialogId);
  elements.dialogSave.textContent = isSaved ? 'Remove from shelf' : 'Save to shelf';
  elements.dialogSave.setAttribute('aria-pressed', String(isSaved));
}

function openDialog(id, trigger) {
  const item = catalog.find((entry) => entry.id === id);
  if (!item) return;

  state.activeDialogId = id;
  state.returnFocus = trigger;
  elements.dialogArt.className = `dialog-art thumb-${item.accent}`;
  elements.dialogTopic.textContent = item.topicLabel;
  elements.dialogDuration.textContent = item.duration;
  elements.dialogSource.textContent = item.sourceLabel;
  elements.dialogTitle.textContent = item.title;
  elements.dialogDeck.textContent = item.deck;
  elements.dialogNote.textContent = item.sourceNote;
  elements.dialogWatch.href = item.watchUrl;
  elements.dialogSourceLink.href = item.sourceUrl;
  updateDialogSave();
  elements.dialog.showModal();
  elements.dialogClose.focus();
}

function closeDialog() {
  if (!elements.dialog.open) return;
  elements.dialog.close();
  state.activeDialogId = null;
  state.returnFocus?.focus();
  state.returnFocus = null;
}

function activateSavedShelf(event) {
  event.preventDefault();
  state.showSaved = !state.showSaved;
  state.query = '';
  state.topic = 'all';
  elements.searchInput.value = '';
  renderCatalog();
  document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

elements.topicFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-topic]');
  if (!button) return;
  state.showSaved = false;
  state.topic = button.dataset.topic;
  renderCatalog();
});

elements.searchInput.addEventListener('input', (event) => {
  state.showSaved = false;
  state.query = event.target.value;
  renderCatalog();
});

elements.savedLink.addEventListener('click', activateSavedShelf);
elements.heroSavedButton.addEventListener('click', () => {
  state.showSaved = true;
  state.query = '';
  state.topic = 'all';
  elements.searchInput.value = '';
  renderCatalog();
  document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
elements.resetFilters.addEventListener('click', () => {
  state.showSaved = false;
  state.query = '';
  state.topic = 'all';
  elements.searchInput.value = '';
  renderCatalog();
});

document.addEventListener('click', (event) => {
  const saveButton = event.target.closest('[data-save-id]');
  if (saveButton) {
    event.stopPropagation();
    toggleSaved(saveButton.dataset.saveId);
    return;
  }

  const card = event.target.closest('[data-open-id]');
  if (card && !event.target.closest('a, button')) openDialog(card.dataset.openId, card);
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== elements.searchInput && !elements.dialog.open) {
    event.preventDefault();
    elements.searchInput.focus();
  }

  const card = event.target.closest?.('[data-open-id]');
  if (card && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openDialog(card.dataset.openId, card);
  }
});

elements.dialogClose.addEventListener('click', closeDialog);
elements.dialogSave.addEventListener('click', () => toggleSaved(state.activeDialogId));
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeDialog();
});
elements.dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog();
});

render();
