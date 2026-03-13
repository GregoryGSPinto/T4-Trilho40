/* ============================================
   ROF VIEWER — Visualizador de artigos
   Exibicao formatada, notas, artigos relacionados
   ============================================ */

const ROFViewer = (function () {
  let currentArticle = null;
  let currentFontSize = 'md';
  let previousScreen = 'home';
  let searchQuery = '';

  /* === EXIBIR ARTIGO === */
  function showArticle(articleId, fromScreen, query) {
    const article = ROFSearch.getArticleById(articleId);
    if (!article) {
      T4.notifications.error('Artigo nao encontrado');
      return;
    }

    currentArticle = article;
    previousScreen = fromScreen || 'home';
    searchQuery = query || '';

    /* Registrar acesso */
    ROFBookmarks.trackAccess(articleId);

    /* Configurar botao de voltar */
    const backBtn = document.getElementById('rof-article-back');
    backBtn.onclick = function () {
      ROFApp.showScreen(previousScreen);
    };

    /* Header */
    document.getElementById('rof-article-header-title').textContent = article.number;

    /* Renderizar conteudo */
    renderArticleContent(article);

    /* Atualizar botao de favorito */
    updateBookmarkButton();

    /* Mostrar tela */
    ROFApp.showScreen('article');

    /* Scroll ao topo */
    window.scrollTo(0, 0);
  }

  /* === RENDERIZAR CONTEUDO === */
  function renderArticleContent(article) {
    const container = document.getElementById('rof-article-content');
    const categories = ROFApp.getCategories();
    const category = categories.find(c => c.id === article.category);

    /* Texto do artigo com highlight se veio de busca */
    let articleText = article.text;
    if (searchQuery) {
      articleText = ROFSearch.highlightText(article.text, searchQuery);
    } else {
      articleText = T4.utils.escapeHTML(article.text);
    }

    /* Artigos relacionados */
    const relatedArticles = findRelatedArticles(article);

    /* Aplicabilidade formatada */
    const applicabilityLabels = {
      carregado: 'Trem Carregado',
      vazio: 'Trem Vazio',
      passageiros: 'Trem de Passageiros',
      todos: 'Todos os Trens'
    };

    let html = '';

    /* Numero e titulo */
    html += '<div class="rof-article-number">' + T4.utils.escapeHTML(article.number) + '</div>';
    html += '<h1 class="rof-article-title">' + T4.utils.escapeHTML(article.title) + '</h1>';

    /* Texto do artigo */
    html += '<div class="rof-article-body font-' + currentFontSize + '" id="rof-article-body">';
    html += articleText;
    html += '</div>';

    /* Notas explicativas */
    if (article.notes) {
      html += '<div class="rof-article-notes">';
      html += '<div class="rof-article-notes-header">';
      html += '<span class="rof-article-notes-icon">💡</span>';
      html += '<span class="rof-article-notes-title">Nota Pratica</span>';
      html += '</div>';
      html += '<p class="rof-article-notes-text">' + T4.utils.escapeHTML(article.notes) + '</p>';
      html += '</div>';
    }

    /* Informacoes do artigo */
    html += '<div class="rof-article-info">';

    html += '<div class="rof-article-info-item">';
    html += '<span class="rof-article-info-label">Categoria</span>';
    html += '<span class="rof-article-info-value">' +
      (category ? category.icon + ' ' + category.name : article.category) + '</span>';
    html += '</div>';

    html += '<div class="rof-article-info-item">';
    html += '<span class="rof-article-info-label">Aplicavel a</span>';
    html += '<span class="rof-article-info-value">' +
      article.applicability.map(a => applicabilityLabels[a] || a).join(', ') + '</span>';
    html += '</div>';

    if (article.relevant_sections && article.relevant_sections.length > 0) {
      html += '<div class="rof-article-info-item">';
      html += '<span class="rof-article-info-label">Trechos</span>';
      html += '<span class="rof-article-info-value">' +
        article.relevant_sections.join(', ') + '</span>';
      html += '</div>';
    }

    html += '<div class="rof-article-info-item">';
    html += '<span class="rof-article-info-label">Referencia</span>';
    html += '<span class="rof-article-info-value">ROF — Regulamento de Operacao Ferroviaria</span>';
    html += '</div>';

    html += '</div>';

    /* Artigos relacionados */
    if (relatedArticles.length > 0) {
      html += '<div class="rof-related">';
      html += '<h3 class="rof-related-title">Artigos Relacionados</h3>';
      relatedArticles.forEach(rel => {
        html += '<div class="rof-related-item" onclick="ROFViewer.showArticle(\'' + rel.id + '\', \'article\')">';
        html += '<span class="rof-related-item-number">' + T4.utils.escapeHTML(rel.number) + '</span>';
        html += '<span class="rof-related-item-title">' + T4.utils.escapeHTML(rel.title) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /* === ENCONTRAR ARTIGOS RELACIONADOS === */
  function findRelatedArticles(article) {
    const all = ROFSearch.getAllArticles();
    const scored = [];

    all.forEach(other => {
      if (other.id === article.id) return;

      let score = 0;

      /* Mesma categoria */
      if (other.category === article.category) {
        score += 10;
      }

      /* Keywords em comum */
      const commonKeywords = article.keywords.filter(k =>
        other.keywords.some(ok => ok.toLowerCase() === k.toLowerCase())
      );
      score += commonKeywords.length * 5;

      /* Mesma aplicabilidade */
      const commonApplicability = article.applicability.filter(a =>
        other.applicability.includes(a)
      );
      score += commonApplicability.length * 3;

      /* Mesmas secoes */
      const commonSections = article.relevant_sections.filter(s =>
        other.relevant_sections.includes(s)
      );
      score += commonSections.length * 2;

      if (score > 5) {
        scored.push({ ...other, relevanceScore: score });
      }
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, 5);
  }

  /* === TAMANHO DA FONTE === */
  function setFontSize(size) {
    currentFontSize = size;
    const body = document.getElementById('rof-article-body');
    if (body) {
      body.className = 'rof-article-body font-' + size;
    }

    /* Atualizar botoes */
    document.querySelectorAll('.rof-font-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const sizes = ['sm', 'md', 'lg'];
    const idx = sizes.indexOf(size);
    if (idx >= 0) {
      document.querySelectorAll('.rof-font-btn')[idx].classList.add('active');
    }

    T4.storage.local.set('rof_font_size', size);
  }

  /* === FAVORITAR === */
  function toggleBookmark() {
    if (!currentArticle) return;

    const isBookmarked = ROFBookmarks.isBookmarked(currentArticle.id);
    if (isBookmarked) {
      ROFBookmarks.removeBookmark(currentArticle.id);
      T4.notifications.info('Artigo removido dos favoritos');
    } else {
      ROFBookmarks.addBookmark(currentArticle.id);
      T4.notifications.success('Artigo salvo nos favoritos');
    }

    updateBookmarkButton();
    T4.utils.vibrate(15);
  }

  function updateBookmarkButton() {
    const btn = document.getElementById('rof-article-bookmark-btn');
    if (!btn || !currentArticle) return;

    const isBookmarked = ROFBookmarks.isBookmarked(currentArticle.id);
    if (isBookmarked) {
      btn.classList.add('bookmarked');
      btn.querySelector('.icon').textContent = '★';
      btn.querySelector('span:last-child').textContent = 'Salvo';
    } else {
      btn.classList.remove('bookmarked');
      btn.querySelector('.icon').textContent = '☆';
      btn.querySelector('span:last-child').textContent = 'Salvar';
    }
  }

  /* === COMPARTILHAR === */
  async function shareArticle() {
    if (!currentArticle) return;

    const shareData = {
      title: currentArticle.number + ' — ' + currentArticle.title,
      text: currentArticle.number + ': ' + currentArticle.title + '\n\n' +
        currentArticle.text.substring(0, 200) + '...\n\nROF Digital — Trilho 4.0'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        T4.notifications.success('Artigo compartilhado');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyArticle();
        }
      }
    } else {
      copyArticle();
    }
  }

  /* === COPIAR ARTIGO === */
  function copyArticle() {
    if (!currentArticle) return;

    const text = currentArticle.number + ' — ' + currentArticle.title + '\n\n' +
      currentArticle.text + '\n\nFonte: ROF — Regulamento de Operacao Ferroviaria';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        T4.notifications.success('Artigo copiado');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      T4.notifications.success('Artigo copiado');
    } catch (e) {
      T4.notifications.error('Nao foi possivel copiar');
    }
    document.body.removeChild(textarea);
  }

  /* === GETTER === */
  function getCurrentArticle() {
    return currentArticle;
  }

  /* === INIT === */
  function init() {
    const savedSize = T4.storage.local.get('rof_font_size', 'md');
    currentFontSize = savedSize;
  }

  return {
    init,
    showArticle,
    setFontSize,
    toggleBookmark,
    shareArticle,
    copyArticle,
    getCurrentArticle
  };
})();
