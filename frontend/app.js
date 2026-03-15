/**
 * linksforme - 프론트엔드 앱
 */

// ========== 상태 ==========
let allLinks = [];
let categories = [];
let activeCategory = 'all';
let activeTags = [];
let searchQuery = '';
let currentTags = []; // 모달 내 태그 입력

// ========== DOM ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const elGrid = $('#link-grid');
const elEmpty = $('#empty-state');
const elCategoryBar = $('#category-bar');
const elActiveTags = $('#active-tags');
const elSearchBar = $('#search-bar');
const elSearchInput = $('#search-input');
const elToast = $('#toast');

// ========== API ==========
async function api(params) {
  const query = new URLSearchParams(params).toString();
  const url = API_URL + '?' + query;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '요청 실패');
  return data.data;
}

// ========== 초기화 ==========
async function init() {
  try {
    const data = await api({ type: 'all' });
    allLinks = data.links || [];
    categories = data.categories || [];
    renderCategories();
    renderLinks();
  } catch (e) {
    console.error('초기 로드 실패:', e);
    showToast('데이터 로드 실패 😢');
  }
}

// ========== 렌더링: 링크 ==========
function renderLinks() {
  const filtered = filterLinks();

  // 스켈레톤 제거
  elGrid.innerHTML = '';

  if (filtered.length === 0) {
    elGrid.style.display = 'none';
    elEmpty.style.display = 'block';
    return;
  }

  elGrid.style.display = '';
  elEmpty.style.display = 'none';

  filtered.forEach((link, i) => {
    const card = document.createElement('article');
    card.className = 'link-card glass';
    card.style.animationDelay = `${i * 0.04}s`;

    const tags = link.tags ? link.tags.split(',').filter(Boolean) : [];
    const tagsHtml = tags.map(t =>
      `<span class="tag" data-tag="${escHtml(t)}">#${escHtml(t)}</span>`
    ).join('');

    const thumbHtml = link.thumbnail
      ? `<img src="${escHtml(link.thumbnail)}" alt="" onerror="this.parentElement.innerHTML='<div class=\\'no-thumb\\'>🔗</div>'">`
      : (link.favicon
        ? `<img src="${escHtml(link.favicon)}" class="favicon-fallback" alt="" onerror="this.parentElement.innerHTML='<div class=\\'no-thumb\\'>🔗</div>'">`
        : `<div class="no-thumb">🔗</div>`);

    card.innerHTML = `
      <div class="card-thumb">${thumbHtml}</div>
      <div class="card-body">
        <div class="card-domain">
          <img src="${escHtml(link.favicon || '')}" alt="" onerror="this.style.display='none'">
          ${escHtml(link.domain || '')}
        </div>
        <h3 class="card-title">${escHtml(link.title || link.url)}</h3>
        <div class="card-tags">${tagsHtml}</div>
        <div class="card-meta">
          <span>${escHtml(link.category || '')} · ${relativeTime(link.createdAt)}</span>
          <span class="card-delete" data-id="${escHtml(link.id)}">삭제</span>
        </div>
      </div>
    `;

    // 카드 클릭 → 링크 열기
    card.addEventListener('click', (e) => {
      if (e.target.closest('.tag') || e.target.closest('.card-delete')) return;
      window.open(link.url, '_blank');
    });

    elGrid.appendChild(card);
  });

  // 태그 클릭 이벤트
  elGrid.querySelectorAll('.tag').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTagFilter(el.dataset.tag);
    });
  });

  // 삭제 클릭
  elGrid.querySelectorAll('.card-delete').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDelete(el.dataset.id);
    });
  });
}

// ========== 렌더링: 카테고리 ==========
function renderCategories() {
  elCategoryBar.innerHTML = `
    <button class="cat-chip ${activeCategory === 'all' ? 'active' : ''}" data-category="all">전체</button>
    ${categories.map(c => `
      <button class="cat-chip ${activeCategory === c.name ? 'active' : ''}" data-category="${escHtml(c.name)}">
        ${c.emoji || '📌'} ${escHtml(c.name)}
      </button>
    `).join('')}
    <button class="cat-chip manage" id="btn-manage-cat">⚙️</button>
  `;

  // 카테고리 클릭
  elCategoryBar.querySelectorAll('.cat-chip:not(.manage)').forEach(el => {
    el.addEventListener('click', () => {
      activeCategory = el.dataset.category;
      renderCategories();
      renderLinks();
    });
  });

  // 카테고리 관리
  $('#btn-manage-cat').addEventListener('click', openCategoryModal);

  // 셀렉트 업데이트
  updateCategorySelect();
}

function updateCategorySelect() {
  const sel = $('#select-category');
  if (!sel) return;
  sel.innerHTML = categories.map(c =>
    `<option value="${escHtml(c.name)}">${c.emoji || ''} ${escHtml(c.name)}</option>`
  ).join('');
}

// ========== 렌더링: 활성 태그 ==========
function renderActiveTags() {
  elActiveTags.innerHTML = activeTags.map(t =>
    `<span class="active-tag" data-tag="${escHtml(t)}">#${escHtml(t)} <span class="remove">&times;</span></span>`
  ).join('');

  elActiveTags.querySelectorAll('.active-tag').forEach(el => {
    el.addEventListener('click', () => toggleTagFilter(el.dataset.tag));
  });
}

// ========== 필터 ==========
function filterLinks() {
  return allLinks.filter(link => {
    // 카테고리
    if (activeCategory !== 'all' && link.category !== activeCategory) return false;

    // 태그
    if (activeTags.length > 0) {
      const linkTags = link.tags ? link.tags.split(',') : [];
      if (!activeTags.every(t => linkTags.includes(t))) return false;
    }

    // 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [link.title, link.tags, link.memo, link.domain].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

function toggleTagFilter(tag) {
  const idx = activeTags.indexOf(tag);
  if (idx === -1) activeTags.push(tag);
  else activeTags.splice(idx, 1);
  renderActiveTags();
  renderLinks();
}

// ========== 검색 ==========
$('#btn-search').addEventListener('click', () => {
  elSearchBar.classList.toggle('open');
  if (elSearchBar.classList.contains('open')) {
    elSearchInput.focus();
  } else {
    elSearchInput.value = '';
    searchQuery = '';
    renderLinks();
  }
});

let searchTimer;
elSearchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = elSearchInput.value.trim();
    renderLinks();
  }, 300);
});

// ========== 링크 추가 모달 ==========
$('#btn-add').addEventListener('click', openAddModal);
$('#btn-close-add').addEventListener('click', closeAddModal);
$('#modal-add').addEventListener('click', (e) => {
  if (e.target === $('#modal-add')) closeAddModal();
});

function openAddModal() {
  currentTags = [];
  $('#input-url').value = '';
  $('#input-title').value = '';
  $('#input-memo').value = '';
  $('#og-preview').style.display = 'none';
  renderModalTags();
  updateCategorySelect();
  $('#modal-add').style.display = 'flex';
  $('#input-url').focus();
}

function closeAddModal() {
  $('#modal-add').style.display = 'none';
}

// URL 붙여넣기 → OG 데이터 fetch
let urlTimer;
$('#input-url').addEventListener('input', () => {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(handleUrlInput, 600);
});

// 붙여넣기 시 즉시 처리
$('#input-url').addEventListener('paste', () => {
  setTimeout(handleUrlInput, 100);
});

async function handleUrlInput() {
  const url = $('#input-url').value.trim();
  if (!url || !url.match(/^https?:\/\//)) return;

  $('#url-loading').style.display = 'flex';
  $('#og-preview').style.display = 'none';

  try {
    const data = await api({ action: 'suggest_tags', url: url });

    // OG 미리보기
    if (data.ogImage) {
      $('#og-image').src = data.ogImage;
      $('#og-domain').textContent = data.domain;
      $('#og-preview').style.display = 'block';
    }

    // 제목 자동완성 (비어있을 때만)
    if (!$('#input-title').value && data.ogTitle) {
      $('#input-title').value = data.ogTitle;
    }

    // 자동 태그
    if (data.suggestedTags) {
      data.suggestedTags.forEach(t => {
        if (!currentTags.includes(t)) currentTags.push(t);
      });
      renderModalTags();
    }

  } catch (e) {
    console.error('OG fetch 실패:', e);
  }

  $('#url-loading').style.display = 'none';
}

// 태그 입력
$('#input-tag').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const tag = $('#input-tag').value.trim();
    if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      renderModalTags();
    }
    $('#input-tag').value = '';
  }
});

function renderModalTags() {
  $('#tag-chips').innerHTML = currentTags.map(t =>
    `<span class="tag-chip">${escHtml(t)} <span class="remove" data-tag="${escHtml(t)}">&times;</span></span>`
  ).join('');

  $('#tag-chips').querySelectorAll('.remove').forEach(el => {
    el.addEventListener('click', () => {
      currentTags = currentTags.filter(t => t !== el.dataset.tag);
      renderModalTags();
    });
  });
}

// 저장
$('#btn-submit').addEventListener('click', handleSubmit);

async function handleSubmit() {
  const url = $('#input-url').value.trim();
  const title = $('#input-title').value.trim();
  const category = $('#select-category').value;
  const memo = $('#input-memo').value.trim();

  if (!url) {
    showToast('URL을 입력해주세요');
    return;
  }

  $('#btn-submit').disabled = true;
  $('#btn-submit').textContent = '저장 중...';

  try {
    const link = await api({
      action: 'add_link',
      url: url,
      title: title,
      category: category,
      tags: currentTags.join(','),
      memo: memo
    });

    allLinks.unshift(link);
    renderLinks();
    closeAddModal();
    showToast('링크가 저장되었습니다');
  } catch (e) {
    showToast('저장 실패: ' + e.message);
  }

  $('#btn-submit').disabled = false;
  $('#btn-submit').textContent = '저장';
}

// ========== 삭제 ==========
async function handleDelete(id) {
  if (!confirm('이 링크를 삭제할까요?')) return;

  try {
    await api({ action: 'delete_link', id: id });
    allLinks = allLinks.filter(l => l.id !== id);
    renderLinks();
    showToast('삭제되었습니다');
  } catch (e) {
    showToast('삭제 실패');
  }
}

// ========== 카테고리 관리 모달 ==========
$('#btn-close-cat').addEventListener('click', closeCategoryModal);
$('#modal-category').addEventListener('click', (e) => {
  if (e.target === $('#modal-category')) closeCategoryModal();
});

function openCategoryModal() {
  renderCatList();
  $('#modal-category').style.display = 'flex';
}

function closeCategoryModal() {
  $('#modal-category').style.display = 'none';
}

function renderCatList() {
  $('#cat-list').innerHTML = categories.map(c =>
    `<div class="cat-item">
      <span class="cat-item-name">${c.emoji || '📌'} ${escHtml(c.name)}</span>
      <span class="cat-item-delete" data-name="${escHtml(c.name)}">삭제</span>
    </div>`
  ).join('');

  $('#cat-list').querySelectorAll('.cat-item-delete').forEach(el => {
    el.addEventListener('click', async () => {
      if (!confirm(`"${el.dataset.name}" 카테고리를 삭제할까요?`)) return;
      try {
        await api({ action: 'delete_category', name: el.dataset.name });
        categories = categories.filter(c => c.name !== el.dataset.name);
        renderCategories();
        renderCatList();
        showToast('카테고리 삭제됨');
      } catch (e) {
        showToast('삭제 실패');
      }
    });
  });
}

$('#btn-add-cat').addEventListener('click', async () => {
  const name = $('#input-cat-name').value.trim();
  const emoji = $('#input-cat-emoji').value.trim() || '📌';

  if (!name) return;

  try {
    await api({ action: 'add_category', name: name, emoji: emoji });
    categories.push({ name: name, emoji: emoji, order: categories.length + 1 });
    renderCategories();
    renderCatList();
    $('#input-cat-name').value = '';
    $('#input-cat-emoji').value = '';
    showToast('카테고리 추가됨');
  } catch (e) {
    showToast('추가 실패');
  }
});

// ========== 유틸 ==========
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '방금';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 2592000) return Math.floor(diff / 86400) + '일 전';
  if (diff < 31536000) return Math.floor(diff / 2592000) + '개월 전';
  return Math.floor(diff / 31536000) + '년 전';
}

function showToast(msg) {
  elToast.textContent = msg;
  elToast.classList.add('show');
  setTimeout(() => elToast.classList.remove('show'), 2500);
}

// ========== 시작 ==========
init();
