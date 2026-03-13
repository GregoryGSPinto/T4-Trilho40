/* ============================================
   ROF APP — Controlador principal do modulo
   Gerencia telas, carrega dados, coordena modulos
   ============================================ */

const ROFApp = (function () {
  let articles = [];
  let keywordsMap = {};
  let categories = [];
  let currentScreen = 'home';
  let isInitialized = false;

  /* === INICIALIZACAO === */
  async function init() {
    /* Inicializar T4 Core */
    T4.init('rof-digital');

    /* Verificar autenticacao */
    if (!T4.auth.isAuthenticated()) {
      T4.auth.renderLoginScreen(document.getElementById('rof-app'));
      document.getElementById('rof-bottom-nav').style.display = 'none';
      return;
    }

    /* Carregar dados */
    await loadData();

    /* Inicializar submodulos */
    ROFSearch.init(articles, keywordsMap);
    ROFViewer.init();
    ROFBookmarks.init();
    ROFQuiz.init();

    /* Configurar busca */
    setupSearch();

    /* Configurar filtros */
    setupFilters();

    /* Renderizar categorias */
    renderCategories();

    /* Renderizar widgets da home */
    ROFBookmarks.renderHomeWidgets();

    /* Verificar parametros da URL */
    checkUrlParams();

    isInitialized = true;
  }

  /* === CARREGAR DADOS === */
  async function loadData() {
    const basePath = getBasePath();

    try {
      const [articlesRes, keywordsRes, categoriesRes] = await Promise.all([
        fetch(basePath + 'data/rof-articles.json'),
        fetch(basePath + 'data/rof-keywords.json'),
        fetch(basePath + 'data/rof-categories.json')
      ]);

      articles = await articlesRes.json();
      keywordsMap = await keywordsRes.json();
      categories = await categoriesRes.json();

      /* Salvar no IndexedDB para acesso offline */
      cacheDataOffline();
    } catch (err) {
      console.warn('[ROF] Erro ao carregar dados do servidor, tentando cache:', err);
      await loadFromCache();
    }
  }

  /* Salvar cache para offline */
  async function cacheDataOffline() {
    try {
      await T4.storage.put('rof_articles', {
        id: 'rof_articles_cache',
        data: articles,
        type: 'cache'
      });
      await T4.storage.put('rof_articles', {
        id: 'rof_keywords_cache',
        data: keywordsMap,
        type: 'cache'
      });
      await T4.storage.put('rof_articles', {
        id: 'rof_categories_cache',
        data: categories,
        type: 'cache'
      });
    } catch (e) {
      /* Cache offline opcional */
    }
  }

  /* Carregar do cache IndexedDB */
  async function loadFromCache() {
    try {
      const cachedArticles = await T4.storage.get('rof_articles', 'rof_articles_cache');
      const cachedKeywords = await T4.storage.get('rof_articles', 'rof_keywords_cache');
      const cachedCategories = await T4.storage.get('rof_articles', 'rof_categories_cache');

      if (cachedArticles && cachedArticles.data) articles = cachedArticles.data;
      if (cachedKeywords && cachedKeywords.data) keywordsMap = cachedKeywords.data;
      if (cachedCategories && cachedCategories.data) categories = cachedCategories.data;

      if (articles.length > 0) {
        T4.notifications.info('Carregado do cache offline');
      } else {
        T4.notifications.error('Nao foi possivel carregar os artigos');
      }
    } catch (e) {
      T4.notifications.error('Erro ao carregar dados');
    }
  }

  /* Detectar base path */
  function getBasePath() {
    const scripts = document.querySelectorAll('script[src*="rof-app"]');
    if (scripts.length > 0) {
      const src = scripts[0].getAttribute('src');
      return src.replace('js/rof-app.js', '');
    }
    return './';
  }

  /* === GERENCIAR TELAS === */
  function showScreen(screenId) {
    /* Esconder todas as telas */
    document.querySelectorAll('.rof-screen').forEach(s => {
      s.classList.remove('active');
    });

    /* Mostrar tela selecionada */
    const screen = document.getElementById('screen-' + screenId);
    if (screen) {
      screen.classList.add('active');
      currentScreen = screenId;
    }

    /* Atualizar navegacao inferior */
    document.querySelectorAll('.rof-nav-item').forEach(nav => {
      nav.classList.toggle('active', nav.dataset.screen === screenId);
    });

    /* Mostrar/esconder bottom nav */
    const bottomNav = document.getElementById('rof-bottom-nav');
    if (screenId === 'article') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }

    /* Acoes ao entrar na tela */
    if (screenId === 'home') {
      ROFBookmarks.renderHomeWidgets();
    } else if (screenId === 'bookmarks') {
      ROFBookmarks.render();
    } else if (screenId === 'quiz') {
      ROFQuiz.renderModeSelection();
    } else if (screenId === 'ai') {
      ROFAssistant.init();
    }

    /* Scroll ao topo */
    window.scrollTo(0, 0);
  }

  /* === SETUP DA BUSCA === */
  function setupSearch() {
    const input = document.getElementById('rof-search-input');
    const clearBtn = document.getElementById('rof-search-clear');
    const autocomplete = document.getElementById('rof-autocomplete');

    if (!input) return;

    /* Input com debounce */
    const debouncedSearch = T4.utils.debounce(function (value) {
      if (value.length >= 2) {
        showAutocomplete(value);
      } else {
        hideAutocomplete();
      }
    }, 200);

    input.addEventListener('input', function () {
      const value = this.value.trim();
      clearBtn.classList.toggle('visible', value.length > 0);
      debouncedSearch(value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = this.value.trim();
        if (value.length >= 2) {
          performSearch(value);
          hideAutocomplete();
        }
      }
    });

    /* Limpar */
    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.classList.remove('visible');
      hideAutocomplete();
      input.focus();
    });

    /* Fechar autocomplete ao clicar fora */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.rof-search-bar')) {
        hideAutocomplete();
      }
    });
  }

  /* === AUTOCOMPLETE === */
  function showAutocomplete(query) {
    const autocomplete = document.getElementById('rof-autocomplete');
    const suggestions = ROFSearch.getSuggestions(query);

    if (suggestions.length === 0) {
      hideAutocomplete();
      return;
    }

    const icons = {
      keyword: '🔑',
      article: '📋',
      history: '🕐'
    };

    autocomplete.innerHTML = suggestions.map(s => {
      const highlighted = highlightSuggestion(s.text, query);
      const extra = s.type === 'keyword' && s.count ? ' <span style="color:var(--t4-text-muted);font-size:0.75rem;">(' + s.count + ' artigos)</span>' : '';

      if (s.type === 'article') {
        return '<div class="rof-autocomplete-item" onclick="ROFViewer.showArticle(\'' + s.articleId + '\', \'home\', \'\')">' +
          '<span class="rof-autocomplete-item-icon">' + icons[s.type] + '</span>' +
          '<span>' + highlighted + extra + '</span></div>';
      }

      return '<div class="rof-autocomplete-item" onclick="ROFApp.performSearch(\'' +
        s.text.replace(/'/g, "\\'") + '\')">' +
        '<span class="rof-autocomplete-item-icon">' + icons[s.type] + '</span>' +
        '<span>' + highlighted + extra + '</span></div>';
    }).join('');

    autocomplete.classList.add('visible');
  }

  function hideAutocomplete() {
    const autocomplete = document.getElementById('rof-autocomplete');
    if (autocomplete) {
      autocomplete.classList.remove('visible');
    }
  }

  function highlightSuggestion(text, query) {
    const escaped = T4.utils.escapeHTML(text);
    const terms = query.split(/\s+/).filter(t => t.length >= 2);
    let result = escaped;

    terms.forEach(term => {
      const regex = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
  }

  /* === EXECUTAR BUSCA === */
  function performSearch(query) {
    if (!query || query.trim().length < 2) return;

    ROFSearch.addToHistory(query);
    hideAutocomplete();

    const results = ROFSearch.search(query);
    renderResults(results, query);
    showScreen('results');
  }

  /* === RENDERIZAR RESULTADOS === */
  function renderResults(results, query) {
    const header = document.getElementById('rof-results-header');
    const list = document.getElementById('rof-results-list');
    const empty = document.getElementById('rof-results-empty');
    const filtersContainer = document.getElementById('rof-results-filters');

    /* Header */
    header.innerHTML = '<span class="rof-results-count"><strong>' + results.length + '</strong> artigo' +
      (results.length !== 1 ? 's' : '') + ' encontrado' + (results.length !== 1 ? 's' : '') + '</span>';

    /* Filtros de categoria nos resultados */
    const usedCategories = [...new Set(results.map(r => r.article.category))];
    const currentFilters = ROFSearch.getFilters();

    filtersContainer.innerHTML = '<button class="rof-filter-chip ' + (!currentFilters.category ? 'active' : '') + '" onclick="ROFApp.filterResults(null, \'' + query.replace(/'/g, "\\'") + '\')">Todos</button>' +
      usedCategories.map(catId => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return '';
        return '<button class="rof-filter-chip ' + (currentFilters.category === catId ? 'active' : '') + '" onclick="ROFApp.filterResults(\'' + catId + '\', \'' + query.replace(/'/g, "\\'") + '\')">' +
          cat.icon + ' ' + cat.name + '</button>';
      }).join('');

    if (results.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    /* Renderizar cards */
    list.innerHTML = results.map((r, idx) => {
      const article = r.article;
      const cat = categories.find(c => c.id === article.category);
      const isBookmarked = ROFBookmarks.isBookmarked(article.id);
      const relevance = Math.min(r.score, 100);

      /* Excerpt com highlight */
      const excerpt = ROFSearch.highlightText(
        T4.utils.truncate(article.text, 150),
        query
      );

      return '<div class="rof-result-card t4-fadeUp t4-fadeUp-' + Math.min(idx + 1, 8) + '" onclick="ROFViewer.showArticle(\'' + article.id + '\', \'results\', \'' + query.replace(/'/g, "\\'") + '\')">' +
        '<div class="rof-result-card-header">' +
        '<span class="rof-result-card-number">' + T4.utils.escapeHTML(article.number) + '</span>' +
        '<button class="rof-result-card-bookmark ' + (isBookmarked ? 'active' : '') + '" onclick="event.stopPropagation(); ROFApp.toggleResultBookmark(\'' + article.id + '\', this)">' +
        (isBookmarked ? '★' : '☆') + '</button>' +
        '</div>' +
        '<div class="rof-result-card-title">' + T4.utils.escapeHTML(article.title) + '</div>' +
        '<div class="rof-result-card-excerpt">' + excerpt + '</div>' +
        '<div class="rof-result-card-meta">' +
        (cat ? '<span class="rof-result-card-tag">' + cat.icon + ' ' + cat.name + '</span>' : '') +
        article.applicability.map(a =>
          '<span class="rof-result-card-tag">' + formatApplicability(a) + '</span>'
        ).join('') +
        '<span class="rof-result-card-relevance">' + relevance + '% rel.</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function filterResults(categoryId, query) {
    ROFSearch.setFilter('category', categoryId || null);
    const results = ROFSearch.search(query);
    renderResults(results, query);
  }

  function toggleResultBookmark(articleId, btn) {
    const isBookmarked = ROFBookmarks.isBookmarked(articleId);
    if (isBookmarked) {
      ROFBookmarks.removeBookmark(articleId);
      btn.classList.remove('active');
      btn.textContent = '☆';
      T4.notifications.info('Removido dos favoritos');
    } else {
      ROFBookmarks.addBookmark(articleId);
      btn.classList.add('active');
      btn.textContent = '★';
      T4.notifications.success('Salvo nos favoritos');
    }
    T4.utils.vibrate(15);
  }

  /* === SETUP DOS FILTROS === */
  function setupFilters() {
    const filtersContainer = document.getElementById('rof-filters');
    if (!filtersContainer) return;

    filtersContainer.addEventListener('click', function (e) {
      const chip = e.target.closest('.rof-filter-chip');
      if (!chip) return;

      /* Desativar todos */
      filtersContainer.querySelectorAll('.rof-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (chip.dataset.filter === 'all') {
        ROFSearch.setFilter('applicability', null);
      } else if (chip.dataset.applicability) {
        ROFSearch.setFilter('applicability', chip.dataset.applicability);
      }

      /* Se ha busca ativa, refazer */
      const input = document.getElementById('rof-search-input');
      if (input && input.value.trim().length >= 2) {
        performSearch(input.value.trim());
      }
    });
  }

  /* === RENDERIZAR CATEGORIAS === */
  function renderCategories() {
    const grid = document.getElementById('rof-categories-grid');
    if (!grid) return;

    grid.innerHTML = categories.map((cat, idx) =>
      '<div class="rof-category-card t4-fadeUp t4-fadeUp-' + Math.min(idx + 1, 8) + '" ' +
      'style="--cat-color: ' + cat.color + ';" ' +
      'onclick="ROFApp.openCategory(\'' + cat.id + '\')">' +
      '<div>' +
      '<div class="rof-category-card-icon">' + cat.icon + '</div>' +
      '<div class="rof-category-card-name">' + T4.utils.escapeHTML(cat.name) + '</div>' +
      '</div>' +
      '<div class="rof-category-card-count">' + cat.article_count + ' artigos</div>' +
      '</div>'
    ).join('');
  }

  function openCategory(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    ROFSearch.resetFilters();
    ROFSearch.setFilter('category', categoryId);

    const categoryArticles = ROFSearch.getArticlesByCategory(categoryId);
    const results = categoryArticles.map(a => ({
      article: a,
      score: 50,
      matchType: 'category'
    }));

    renderResults(results, '');
    showScreen('results');

    /* Atualizar titulo */
    const headerTitle = document.querySelector('#screen-results .rof-header-title');
    if (headerTitle) {
      headerTitle.textContent = cat.icon + ' ' + cat.name;
    }
  }

  /* === VERIFICAR URL PARAMS === */
  function checkUrlParams() {
    const params = T4.router.getParams();
    if (params.article) {
      ROFViewer.showArticle(params.article, 'home');
    } else if (params.search) {
      const input = document.getElementById('rof-search-input');
      if (input) input.value = params.search;
      performSearch(params.search);
    }
  }

  /* === UTILITARIOS === */
  function formatApplicability(type) {
    const labels = {
      carregado: 'Carregado',
      vazio: 'Vazio',
      passageiros: 'Passageiros',
      todos: 'Todos'
    };
    return labels[type] || type;
  }

  function getCategories() {
    return [...categories];
  }

  function getCurrentScreen() {
    return currentScreen;
  }

  /* === INICIAR === */
  document.addEventListener('DOMContentLoaded', init);

  return {
    init,
    showScreen,
    performSearch,
    filterResults,
    toggleResultBookmark,
    openCategory,
    getCategories,
    getCurrentScreen
  };
})();
