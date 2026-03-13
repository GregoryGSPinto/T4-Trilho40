/* ============================================
   ADAMBOOT — Base de Conhecimento
   Busca em FAQ, glossário e ROF com relevância
   ============================================ */

const AdamBootKnowledge = (function () {
  let faqData = null;
  let glossaryData = null;
  let rofData = null;
  let isLoaded = false;

  /* Carrega todas as bases de dados */
  async function load() {
    if (isLoaded) return;

    const results = await Promise.allSettled([
      loadFAQ(),
      loadGlossary(),
      loadROF()
    ]);

    isLoaded = true;
    console.log('[AdamBoot Knowledge] Base carregada —',
      (faqData ? faqData.length : 0), 'FAQs,',
      (glossaryData ? glossaryData.length : 0), 'termos,',
      (rofData ? rofData.length : 0), 'artigos ROF'
    );
  }

  /* Carrega FAQ */
  async function loadFAQ() {
    try {
      const response = await fetch('./data/adamboot-faq.json');
      const data = await response.json();
      faqData = data.faqs || [];
    } catch (err) {
      console.warn('[AdamBoot Knowledge] FAQ não disponível:', err);
      faqData = [];
    }
  }

  /* Carrega glossário */
  async function loadGlossary() {
    try {
      const response = await fetch('./data/adamboot-glossary.json');
      const data = await response.json();
      glossaryData = data.glossary || [];
    } catch (err) {
      console.warn('[AdamBoot Knowledge] Glossário não disponível:', err);
      glossaryData = [];
    }
  }

  /* Tenta carregar dados do ROF Digital */
  async function loadROF() {
    try {
      const response = await fetch('../../modules/rof-digital/data/rof-articles.json');
      if (!response.ok) throw new Error('ROF não encontrado');
      const data = await response.json();
      rofData = data.articles || data || [];
    } catch (err) {
      console.warn('[AdamBoot Knowledge] ROF Digital não disponível, usando base interna');
      rofData = [];
    }
  }

  /* Normaliza texto para busca */
  function normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Extrai palavras-chave de uma pergunta */
  function extractKeywords(question) {
    const stopWords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
      'por', 'para', 'com', 'sem', 'sobre', 'entre',
      'que', 'qual', 'quais', 'como', 'onde', 'quando', 'porque',
      'e', 'ou', 'mas', 'se', 'ao', 'pelo', 'pela',
      'eu', 'me', 'meu', 'minha', 'ele', 'ela', 'isso', 'isto',
      'ser', 'estar', 'ter', 'fazer', 'poder',
      'eh', 'sao', 'esta', 'tem', 'pode',
      'explica', 'explicar', 'diz', 'dizer', 'fala', 'falar',
      'preciso', 'quero', 'gostaria', 'poderia', 'voce'
    ];

    const words = normalize(question).split(/\s+/);
    return words.filter(w => w.length > 2 && !stopWords.includes(w));
  }

  /* Calcula score de relevância entre pergunta e um item */
  function calculateRelevance(keywords, targetKeywords, targetText) {
    let score = 0;
    const normalizedTarget = normalize(targetText);

    for (const keyword of keywords) {
      /* Match exato em keywords cadastradas */
      for (const tk of targetKeywords) {
        const normalizedTK = normalize(tk);
        if (normalizedTK === keyword) {
          score += 10;
        } else if (normalizedTK.includes(keyword) || keyword.includes(normalizedTK)) {
          score += 5;
        }
      }

      /* Match no texto completo */
      if (normalizedTarget.includes(keyword)) {
        score += 3;
      }

      /* Match parcial (começo da palavra) */
      const words = normalizedTarget.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(keyword) || keyword.startsWith(word)) {
          score += 2;
        }
      }
    }

    /* Bonus por quantidade de keywords encontradas */
    const matchedCount = keywords.filter(k =>
      targetKeywords.some(tk => normalize(tk).includes(k)) ||
      normalizedTarget.includes(k)
    ).length;

    if (matchedCount > 0) {
      score += (matchedCount / keywords.length) * 15;
    }

    return score;
  }

  /* Busca na FAQ */
  function searchFAQ(question) {
    if (!faqData || faqData.length === 0) return [];

    const keywords = extractKeywords(question);
    if (keywords.length === 0) return [];

    const results = faqData.map(faq => {
      const targetKeywords = faq.keywords || [];
      const targetText = (faq.question || '') + ' ' + (faq.answer || '');
      const score = calculateRelevance(keywords, targetKeywords, targetText);

      /* Bonus para match direto na pergunta */
      const normalizedQ = normalize(question);
      const normalizedFaqQ = normalize(faq.question);
      if (normalizedQ.includes(normalizedFaqQ) || normalizedFaqQ.includes(normalizedQ)) {
        return { ...faq, score: score + 20, source: 'faq' };
      }

      return { ...faq, score, source: 'faq' };
    });

    return results
      .filter(r => r.score > 5)
      .sort((a, b) => b.score - a.score);
  }

  /* Busca no glossário */
  function searchGlossary(question) {
    if (!glossaryData || glossaryData.length === 0) return [];

    const keywords = extractKeywords(question);
    const normalizedQ = normalize(question);

    /* Detecta padrões de pergunta sobre glossário */
    const isGlossaryQuestion =
      normalizedQ.includes('o que e') ||
      normalizedQ.includes('o que significa') ||
      normalizedQ.includes('significado de') ||
      normalizedQ.includes('define') ||
      normalizedQ.includes('definicao');

    const results = glossaryData.map(term => {
      const normalizedTerm = normalize(term.term);
      let score = 0;

      /* Match direto no nome do termo */
      if (normalizedQ.includes(normalizedTerm)) {
        score += 25;
      }

      /* Match em keywords */
      for (const kw of keywords) {
        if (normalizedTerm === kw) {
          score += 15;
        } else if (normalizedTerm.includes(kw) || kw.includes(normalizedTerm)) {
          score += 8;
        }
        if (normalize(term.definition).includes(kw)) {
          score += 2;
        }
      }

      /* Bonus para perguntas explícitas sobre glossário */
      if (isGlossaryQuestion && score > 0) {
        score += 10;
      }

      return { ...term, score, source: 'glossary' };
    });

    return results
      .filter(r => r.score > 5)
      .sort((a, b) => b.score - a.score);
  }

  /* Busca no ROF (se disponível) */
  function searchROF(question) {
    if (!rofData || rofData.length === 0) return [];

    const keywords = extractKeywords(question);
    const normalizedQ = normalize(question);

    /* Detecta referência direta a artigo */
    const artMatch = normalizedQ.match(/art(?:igo)?\s*(\d+)/);

    const results = rofData.map(article => {
      let score = 0;
      const articleNum = String(article.numero || article.number || '');
      const articleText = (article.titulo || article.title || '') + ' ' +
                         (article.conteudo || article.content || '') + ' ' +
                         (article.resumo || article.summary || '');

      /* Match direto por número do artigo */
      if (artMatch && articleNum === artMatch[1]) {
        score += 50;
      }

      /* Match por keywords */
      const articleKeywords = article.keywords || article.tags || [];
      score += calculateRelevance(keywords, articleKeywords, articleText);

      return {
        answer: article.conteudo || article.content || article.resumo || article.summary || '',
        title: 'Artigo ' + articleNum + ' — ' + (article.titulo || article.title || ''),
        score,
        source: 'rof',
        articleNumber: articleNum
      };
    });

    return results
      .filter(r => r.score > 5)
      .sort((a, b) => b.score - a.score);
  }

  /* Processa a pergunta e retorna a melhor resposta */
  async function processQuestion(question) {
    await load();

    /* Verifica se é uma pergunta de contexto */
    if (AdamBootContext.isContextQuestion(question)) {
      const ctxAnswer = AdamBootContext.answerContextQuestion(question);
      if (ctxAnswer) {
        return {
          answer: ctxAnswer.answer,
          category: ctxAnswer.category,
          confidence: 'high',
          source: 'context',
          suggestions: AdamBootPersonality.getRelatedSuggestions(ctxAnswer.category, question)
        };
      }
    }

    /* Busca em todas as fontes */
    const faqResults = searchFAQ(question);
    const glossaryResults = searchGlossary(question);
    const rofResults = searchROF(question);

    /* Consolida todos os resultados */
    const allResults = [
      ...faqResults.map(r => ({
        answer: r.answer,
        category: r.category || 'operacao',
        score: r.score,
        source: 'faq',
        question: r.question
      })),
      ...glossaryResults.slice(0, 3).map(r => ({
        answer: null,
        term: r.term,
        definition: r.definition,
        relatedTerms: r.relatedTerms,
        category: 'glossario',
        score: r.score,
        source: 'glossary'
      })),
      ...rofResults.slice(0, 2).map(r => ({
        answer: r.answer,
        title: r.title,
        category: 'rof',
        score: r.score,
        source: 'rof'
      }))
    ];

    /* Ordena por score e pega o melhor */
    allResults.sort((a, b) => b.score - a.score);

    if (allResults.length === 0 || allResults[0].score < 5) {
      /* Nenhuma resposta encontrada */
      const unknownResponse = await AdamBootPersonality.formatResponse(null, 'unknown');
      return {
        answer: unknownResponse,
        category: 'unknown',
        confidence: 'none',
        source: 'none',
        suggestions: [
          'O que é BOLL?',
          'Qual a VMA para trem carregado?',
          'Quais são os EPIs obrigatórios?'
        ]
      };
    }

    const best = allResults[0];
    let formattedAnswer;

    if (best.source === 'glossary') {
      /* Resposta de glossário */
      const relatedText = best.relatedTerms && best.relatedTerms.length > 0
        ? 'Termos relacionados: ' + best.relatedTerms.join(', ')
        : '';
      formattedAnswer = await AdamBootPersonality.formatResponse(
        null, 'glossary',
        { term: best.term, definition: best.definition, related: relatedText }
      );
    } else if (best.source === 'rof') {
      /* Resposta do ROF */
      const rofAnswer = (best.title ? '**' + best.title + '**\n\n' : '') + best.answer;
      formattedAnswer = await AdamBootPersonality.formatResponse(rofAnswer, 'rof');
    } else {
      /* Resposta de FAQ ou procedimento */
      const templateCategory = best.category === 'seguranca' ? 'safety' :
                               best.category === 'procedimento' ? 'procedure' :
                               best.category === 'rof' ? 'rof' : 'procedure';
      formattedAnswer = await AdamBootPersonality.formatResponse(best.answer, templateCategory);
    }

    /* Enriquece com contexto operacional */
    formattedAnswer = AdamBootContext.enrichResponse(formattedAnswer, best.category);

    /* Adiciona toque de personalidade */
    formattedAnswer = AdamBootPersonality.addPersonalityTouch(formattedAnswer, best.category);

    /* Gera sugestões relacionadas */
    const suggestions = AdamBootPersonality.getRelatedSuggestions(best.category, question);

    return {
      answer: formattedAnswer,
      category: best.category,
      confidence: best.score > 20 ? 'high' : best.score > 10 ? 'medium' : 'low',
      source: best.source,
      suggestions
    };
  }

  return {
    load,
    processQuestion,
    searchFAQ,
    searchGlossary,
    searchROF,
    extractKeywords
  };
})();
