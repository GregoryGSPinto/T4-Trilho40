/* ============================================
   ROF SEARCH — Motor de busca inteligente
   Busca fuzzy, por artigo, por km, autocomplete
   ============================================ */

const ROFSearch = (function () {
  let articles = [];
  let keywords = {};
  let searchHistory = [];
  let currentFilters = { category: null, applicability: null };

  const MAX_HISTORY = 15;
  const HISTORY_KEY = 'rof_search_history';

  /* === INICIALIZACAO === */
  function init(articlesData, keywordsData) {
    articles = articlesData;
    keywords = keywordsData;
    searchHistory = T4.storage.local.get(HISTORY_KEY, []);
    renderHistory();
  }

  /* === BUSCA PRINCIPAL === */
  function search(query, filters) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim().toLowerCase();
    filters = filters || currentFilters;

    /* Detectar tipo de busca */
    const artMatch = q.match(/^art\.?\s*(\d+)/i);
    const kmMatch = q.match(/km\s*(\d+)/i);

    let results;

    if (artMatch) {
      results = searchByArticleNumber(parseInt(artMatch[1]));
    } else if (kmMatch) {
      results = searchByKm(kmMatch[1]);
    } else {
      results = searchByText(q);
    }

    /* Aplicar filtros */
    if (filters.category) {
      results = results.filter(r => r.article.category === filters.category);
    }
    if (filters.applicability) {
      results = results.filter(r =>
        r.article.applicability.includes(filters.applicability) ||
        r.article.applicability.includes('todos')
      );
    }

    /* Ordenar por relevancia */
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /* === BUSCA POR NUMERO DO ARTIGO === */
  function searchByArticleNumber(num) {
    return articles
      .filter(a => {
        const artNum = parseInt(a.number.replace(/\D/g, ''));
        return artNum === num;
      })
      .map(a => ({ article: a, score: 100, matchType: 'number' }));
  }

  /* === BUSCA POR KM === */
  function searchByKm(km) {
    /* Busca artigos que mencionam km na via */
    const results = [];
    articles.forEach(a => {
      const text = (a.text + ' ' + a.notes).toLowerCase();
      if (text.includes('km') || text.includes('metro') || text.includes('distancia')) {
        const score = text.includes('km ' + km) ? 90 : 30;
        results.push({ article: a, score, matchType: 'km' });
      }
    });
    return results;
  }

  /* === BUSCA POR TEXTO (fuzzy) === */
  function searchByText(query) {
    const terms = query.split(/\s+/).filter(t => t.length >= 2);
    const scored = [];

    /* Passo 1: Busca por keywords mapeadas */
    const keywordHits = new Map();
    for (const [kw, artIds] of Object.entries(keywords)) {
      const kwLower = kw.toLowerCase();
      for (const term of terms) {
        if (kwLower.includes(term) || fuzzyMatch(term, kwLower)) {
          artIds.forEach(id => {
            const current = keywordHits.get(id) || 0;
            const exactBonus = kwLower === query ? 30 : 0;
            const includeBonus = kwLower.includes(query) ? 15 : 0;
            keywordHits.set(id, current + 10 + exactBonus + includeBonus);
          });
        }
      }
    }

    /* Passo 2: Busca direta nos artigos */
    articles.forEach(article => {
      let score = keywordHits.get(article.id) || 0;

      const titleLower = article.title.toLowerCase();
      const textLower = article.text.toLowerCase();
      const notesLower = (article.notes || '').toLowerCase();
      const numberLower = article.number.toLowerCase();

      for (const term of terms) {
        /* Titulo (peso alto) */
        if (titleLower.includes(term)) {
          score += 25;
        } else if (fuzzyMatch(term, titleLower)) {
          score += 10;
        }

        /* Texto do artigo */
        if (textLower.includes(term)) {
          score += 15;
          /* Bonus por multiplas ocorrencias */
          const occurrences = (textLower.match(new RegExp(escapeRegex(term), 'g')) || []).length;
          score += Math.min(occurrences * 2, 10);
        } else if (fuzzyMatch(term, textLower)) {
          score += 5;
        }

        /* Notas */
        if (notesLower.includes(term)) {
          score += 8;
        }

        /* Numero do artigo */
        if (numberLower.includes(term)) {
          score += 20;
        }

        /* Keywords do artigo */
        for (const kw of article.keywords) {
          if (kw.toLowerCase().includes(term)) {
            score += 12;
            break;
          }
        }
      }

      /* Bonus se a query inteira esta no titulo */
      if (titleLower.includes(query)) {
        score += 30;
      }

      if (score > 0) {
        scored.push({ article, score, matchType: 'text' });
      }
    });

    return scored;
  }

  /* === FUZZY MATCH === */
  function fuzzyMatch(needle, haystack) {
    if (needle.length < 3) return false;

    /* Distancia de Levenshtein simplificada */
    const maxDist = needle.length <= 4 ? 1 : 2;

    /* Verifica se alguma subsequencia do haystack e similar */
    const words = haystack.split(/\s+/);
    for (const word of words) {
      if (word.length < needle.length - maxDist) continue;
      if (levenshtein(needle, word.substring(0, needle.length + maxDist)) <= maxDist) {
        return true;
      }
    }
    return false;
  }

  /* Distancia de Levenshtein */
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /* === AUTOCOMPLETE === */
  function getSuggestions(query) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim().toLowerCase();
    const suggestions = [];
    const seen = new Set();

    /* Sugestoes de keywords */
    for (const kw of Object.keys(keywords)) {
      if (kw.toLowerCase().includes(q) && !seen.has(kw.toLowerCase())) {
        seen.add(kw.toLowerCase());
        suggestions.push({
          text: kw,
          type: 'keyword',
          count: keywords[kw].length
        });
      }
      if (suggestions.length >= 6) break;
    }

    /* Sugestoes de titulos de artigos */
    for (const article of articles) {
      if (suggestions.length >= 8) break;
      const titleLower = article.title.toLowerCase();
      if (titleLower.includes(q) && !seen.has(article.id)) {
        seen.add(article.id);
        suggestions.push({
          text: article.number + ' - ' + article.title,
          type: 'article',
          articleId: article.id
        });
      }
    }

    /* Sugestoes do historico */
    for (const h of searchHistory) {
      if (suggestions.length >= 10) break;
      if (h.toLowerCase().includes(q) && !seen.has('hist_' + h)) {
        seen.add('hist_' + h);
        suggestions.push({
          text: h,
          type: 'history'
        });
      }
    }

    return suggestions.slice(0, 8);
  }

  /* === HIGHLIGHT DE TEXTO === */
  function highlightText(text, query) {
    if (!query || query.trim().length < 2) return T4.utils.escapeHTML(text);

    const terms = query.trim().split(/\s+/).filter(t => t.length >= 2);
    let escaped = T4.utils.escapeHTML(text);

    for (const term of terms) {
      const regex = new RegExp('(' + escapeRegex(term) + ')', 'gi');
      escaped = escaped.replace(regex, '<mark>$1</mark>');
    }

    return escaped;
  }

  /* === HISTORICO === */
  function addToHistory(query) {
    if (!query || query.trim().length < 2) return;

    const q = query.trim();
    searchHistory = searchHistory.filter(h => h.toLowerCase() !== q.toLowerCase());
    searchHistory.unshift(q);
    if (searchHistory.length > MAX_HISTORY) {
      searchHistory = searchHistory.slice(0, MAX_HISTORY);
    }
    T4.storage.local.set(HISTORY_KEY, searchHistory);
    renderHistory();
  }

  function clearHistory() {
    searchHistory = [];
    T4.storage.local.remove(HISTORY_KEY);
    renderHistory();
    T4.notifications.success('Historico limpo');
  }

  function renderHistory() {
    const section = document.getElementById('rof-history-section');
    const list = document.getElementById('rof-history-list');
    if (!section || !list) return;

    if (searchHistory.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = searchHistory.slice(0, 5).map(h =>
      '<div class="rof-history-item" onclick="ROFSearch.executeHistorySearch(\'' +
      T4.utils.escapeHTML(h).replace(/'/g, "\\'") + '\')">' +
      '<span class="rof-history-item-icon">🕐</span>' +
      '<span>' + T4.utils.escapeHTML(h) + '</span>' +
      '</div>'
    ).join('');
  }

  function executeHistorySearch(query) {
    const input = document.getElementById('rof-search-input');
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event('input'));
    }
    ROFApp.performSearch(query);
  }

  /* === FILTROS === */
  function setFilter(type, value) {
    if (type === 'category') {
      currentFilters.category = currentFilters.category === value ? null : value;
    } else if (type === 'applicability') {
      currentFilters.applicability = currentFilters.applicability === value ? null : value;
    }
    return currentFilters;
  }

  function getFilters() {
    return { ...currentFilters };
  }

  function resetFilters() {
    currentFilters = { category: null, applicability: null };
  }

  /* === UTILITARIOS === */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getArticleById(id) {
    return articles.find(a => a.id === id) || null;
  }

  function getArticlesByCategory(category) {
    return articles.filter(a => a.category === category);
  }

  function getAllArticles() {
    return [...articles];
  }

  return {
    init,
    search,
    getSuggestions,
    highlightText,
    addToHistory,
    clearHistory,
    executeHistorySearch,
    setFilter,
    getFilters,
    resetFilters,
    getArticleById,
    getArticlesByCategory,
    getAllArticles
  };
})();
