/* ============================================
   ROF BOOKMARKS — Sistema de favoritos
   Salvar artigos, rastrear acessos, categorias
   ============================================ */

const ROFBookmarks = (function () {
  const BOOKMARKS_KEY = 'rof_bookmarks';
  const ACCESS_KEY = 'rof_access_log';
  const BOOKMARK_CATS_KEY = 'rof_bookmark_categories';

  let bookmarks = [];
  let accessLog = [];
  let bookmarkCategories = [];
  let currentTab = 'saved';

  /* === INICIALIZACAO === */
  function init() {
    bookmarks = T4.storage.local.get(BOOKMARKS_KEY, []);
    accessLog = T4.storage.local.get(ACCESS_KEY, []);
    bookmarkCategories = T4.storage.local.get(BOOKMARK_CATS_KEY, [
      { id: 'geral', name: 'Geral', color: '#ffc72b' },
      { id: 'importante', name: 'Importante', color: '#ef4444' },
      { id: 'estudo', name: 'Para Estudo', color: '#3b82f6' }
    ]);

    /* Persistir categorias padrao */
    T4.storage.local.set(BOOKMARK_CATS_KEY, bookmarkCategories);

    /* Tambem salvar no IndexedDB para acesso offline */
    syncToIndexedDB();
  }

  /* === SYNC COM INDEXEDDB === */
  async function syncToIndexedDB() {
    try {
      for (const bm of bookmarks) {
        await T4.storage.put('rof_bookmarks', {
          id: bm.articleId,
          articleId: bm.articleId,
          category: bm.category || 'geral',
          savedAt: bm.savedAt,
          type: 'bookmark'
        });
      }
    } catch (e) {
      /* IndexedDB pode nao estar disponivel - localStorage e suficiente */
    }
  }

  /* === FAVORITOS === */
  function addBookmark(articleId, category) {
    if (isBookmarked(articleId)) return;

    const bookmark = {
      articleId: articleId,
      category: category || 'geral',
      savedAt: Date.now()
    };

    bookmarks.push(bookmark);
    save();

    T4.storage.put('rof_bookmarks', {
      id: articleId,
      ...bookmark,
      type: 'bookmark'
    }).catch(() => {});
  }

  function removeBookmark(articleId) {
    bookmarks = bookmarks.filter(b => b.articleId !== articleId);
    save();

    T4.storage.remove('rof_bookmarks', articleId).catch(() => {});
  }

  function isBookmarked(articleId) {
    return bookmarks.some(b => b.articleId === articleId);
  }

  function getBookmarks() {
    return [...bookmarks].sort((a, b) => b.savedAt - a.savedAt);
  }

  function getBookmarksByCategory(categoryId) {
    return bookmarks
      .filter(b => b.category === categoryId)
      .sort((a, b) => b.savedAt - a.savedAt);
  }

  function setBookmarkCategory(articleId, categoryId) {
    const bm = bookmarks.find(b => b.articleId === articleId);
    if (bm) {
      bm.category = categoryId;
      save();
    }
  }

  /* === RASTREAMENTO DE ACESSO === */
  function trackAccess(articleId) {
    const entry = {
      articleId: articleId,
      timestamp: Date.now()
    };

    accessLog.push(entry);

    /* Limitar a 200 registros */
    if (accessLog.length > 200) {
      accessLog = accessLog.slice(-200);
    }

    T4.storage.local.set(ACCESS_KEY, accessLog);

    T4.storage.put('rof_history', {
      id: T4.utils.uid(),
      ...entry,
      type: 'access'
    }).catch(() => {});
  }

  function getRecentArticles(limit) {
    limit = limit || 10;
    const seen = new Set();
    const recent = [];

    /* Percorrer do mais recente para o mais antigo */
    for (let i = accessLog.length - 1; i >= 0; i--) {
      const entry = accessLog[i];
      if (!seen.has(entry.articleId)) {
        seen.add(entry.articleId);
        const article = ROFSearch.getArticleById(entry.articleId);
        if (article) {
          recent.push({
            article: article,
            lastAccess: entry.timestamp
          });
        }
      }
      if (recent.length >= limit) break;
    }

    return recent;
  }

  function getMostConsulted(limit) {
    limit = limit || 10;
    const counts = {};

    accessLog.forEach(entry => {
      counts[entry.articleId] = (counts[entry.articleId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([articleId, count]) => {
        const article = ROFSearch.getArticleById(articleId);
        return article ? { article, count } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /* === RENDERIZAR TELA === */
  function render() {
    switchTab(currentTab);
  }

  function switchTab(tab) {
    currentTab = tab;

    /* Atualizar tabs */
    document.querySelectorAll('.rof-bookmarks-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    const content = document.getElementById('rof-bookmarks-content');
    const empty = document.getElementById('rof-bookmarks-empty');

    if (tab === 'saved') {
      renderSavedTab(content, empty);
    } else if (tab === 'recent') {
      renderRecentTab(content, empty);
    } else if (tab === 'most') {
      renderMostTab(content, empty);
    }
  }

  function renderSavedTab(content, empty) {
    const items = getBookmarks();

    if (items.length === 0) {
      content.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    /* Agrupar por categoria */
    const grouped = {};
    bookmarkCategories.forEach(cat => {
      grouped[cat.id] = { category: cat, items: [] };
    });

    items.forEach(bm => {
      const article = ROFSearch.getArticleById(bm.articleId);
      if (!article) return;
      const catId = bm.category || 'geral';
      if (!grouped[catId]) {
        grouped[catId] = { category: { id: catId, name: catId, color: '#888' }, items: [] };
      }
      grouped[catId].items.push({ article, bookmark: bm });
    });

    let html = '';

    Object.values(grouped).forEach(group => {
      if (group.items.length === 0) return;

      html += '<div class="rof-section-subtitle" style="margin-top: var(--t4-space-md);">';
      html += '<span style="color: ' + group.category.color + ';">●</span> ';
      html += T4.utils.escapeHTML(group.category.name);
      html += ' (' + group.items.length + ')';
      html += '</div>';

      html += '<div class="rof-recent-list">';
      group.items.forEach(item => {
        html += renderArticleItem(item.article, formatDate(item.bookmark.savedAt));
      });
      html += '</div>';
    });

    content.innerHTML = html;
  }

  function renderRecentTab(content, empty) {
    const recent = getRecentArticles(20);

    if (recent.length === 0) {
      content.innerHTML = '';
      empty.querySelector('.t4-empty-title').textContent = 'Nenhum artigo acessado';
      empty.querySelector('.t4-empty-desc').textContent = 'Os artigos que voce consultar aparecerao aqui';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    let html = '<div class="rof-recent-list">';
    recent.forEach(item => {
      html += renderArticleItem(item.article, formatDate(item.lastAccess));
    });
    html += '</div>';

    content.innerHTML = html;
  }

  function renderMostTab(content, empty) {
    const most = getMostConsulted(20);

    if (most.length === 0) {
      content.innerHTML = '';
      empty.querySelector('.t4-empty-title').textContent = 'Sem dados ainda';
      empty.querySelector('.t4-empty-desc').textContent = 'Acesse artigos para gerar o ranking';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    let html = '<div class="rof-recent-list">';
    most.forEach((item, idx) => {
      html += '<div class="rof-recent-item" onclick="ROFViewer.showArticle(\'' + item.article.id + '\', \'bookmarks\')">';
      html += '<span style="font-size:0.75rem; font-weight:700; color: var(--t4-text-muted); min-width:24px; text-align:center;">' + (idx + 1) + '</span>';
      html += '<span class="rof-recent-item-number">' + T4.utils.escapeHTML(item.article.number) + '</span>';
      html += '<span class="rof-recent-item-title" style="flex:1;">' + T4.utils.escapeHTML(item.article.title) + '</span>';
      html += '<span style="font-size:0.6875rem; color: var(--rof-accent); font-family: var(--t4-font-display); font-weight:700;">' + item.count + 'x</span>';
      html += '</div>';
    });
    html += '</div>';

    content.innerHTML = html;
  }

  function renderArticleItem(article, subtitle) {
    let html = '<div class="rof-recent-item" onclick="ROFViewer.showArticle(\'' + article.id + '\', \'bookmarks\')">';
    html += '<span class="rof-recent-item-number">' + T4.utils.escapeHTML(article.number) + '</span>';
    html += '<div style="flex:1; min-width:0;">';
    html += '<div class="rof-recent-item-title">' + T4.utils.escapeHTML(article.title) + '</div>';
    if (subtitle) {
      html += '<div style="font-size:0.6875rem; color: var(--t4-text-muted); margin-top:2px;">' + subtitle + '</div>';
    }
    html += '</div>';

    if (isBookmarked(article.id)) {
      html += '<span style="color: var(--rof-accent); font-size:0.875rem;">★</span>';
    }

    html += '</div>';
    return html;
  }

  /* === RENDERIZAR HOME === */
  function renderHomeWidgets() {
    /* Mais consultados */
    const most = getMostConsulted(5);
    const mostSection = document.getElementById('rof-most-consulted');
    const mostList = document.getElementById('rof-most-consulted-list');

    if (most.length > 0 && mostSection && mostList) {
      mostSection.style.display = 'block';
      mostList.innerHTML = most.map(item =>
        '<div class="rof-recent-item" onclick="ROFViewer.showArticle(\'' + item.article.id + '\', \'home\')">' +
        '<span class="rof-recent-item-number">' + T4.utils.escapeHTML(item.article.number) + '</span>' +
        '<span class="rof-recent-item-title">' + T4.utils.escapeHTML(item.article.title) + '</span>' +
        '</div>'
      ).join('');
    }

    /* Recentes */
    const recent = getRecentArticles(5);
    const recentSection = document.getElementById('rof-recent-section');
    const recentList = document.getElementById('rof-recent-list');

    if (recent.length > 0 && recentSection && recentList) {
      recentSection.style.display = 'block';
      recentList.innerHTML = recent.map(item =>
        '<div class="rof-recent-item" onclick="ROFViewer.showArticle(\'' + item.article.id + '\', \'home\')">' +
        '<span class="rof-recent-item-number">' + T4.utils.escapeHTML(item.article.number) + '</span>' +
        '<span class="rof-recent-item-title">' + T4.utils.escapeHTML(item.article.title) + '</span>' +
        '</div>'
      ).join('');
    }
  }

  /* === PERSISTENCIA === */
  function save() {
    T4.storage.local.set(BOOKMARKS_KEY, bookmarks);
  }

  function formatDate(timestamp) {
    return T4.utils.formatDate(timestamp, 'full');
  }

  return {
    init,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarks,
    getBookmarksByCategory,
    setBookmarkCategory,
    trackAccess,
    getRecentArticles,
    getMostConsulted,
    render,
    switchTab,
    renderHomeWidgets
  };
})();
