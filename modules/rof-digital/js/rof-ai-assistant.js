/* ============================================
   ROF AI ASSISTANT — Interface de linguagem natural
   Busca artigos a partir de perguntas do usuario
   ============================================ */

const ROFAssistant = (function () {
  const HISTORY_KEY = 'rof_ai_history';

  let messages = [];
  let conversationHistory = [];
  let isProcessing = false;

  /* Sugestoes de perguntas */
  const SUGGESTIONS = [
    'Posso ultrapassar sinal amarelo com trem de minerio?',
    'Qual a velocidade maxima em patio?',
    'O que fazer se o radio falhar durante a viagem?',
    'Como proceder em caso de descarrilamento?',
    'Qual o toque de buzina para passagem de nivel?',
    'Posso parar dentro de um tunel?',
    'O que fazer ao encontrar obstaculo na via?',
    'Preciso fazer teste de freio antes de toda viagem?',
    'Qual a velocidade para trem vazio na linha principal?',
    'Como transportar produtos perigosos por ferrovia?'
  ];

  /* Mapa de intencoes e sinonimos */
  const INTENT_MAP = {
    velocidade: ['velocidade', 'limite', 'rapido', 'devagar', 'km/h', 'maxima', 'minima', 'quanto posso andar', 'velocidade permitida'],
    sinal: ['sinal', 'semaforo', 'vermelho', 'amarelo', 'verde', 'aspecto', 'fechado', 'aberto', 'apagado', 'ultrapassar sinal'],
    emergencia: ['emergencia', 'acidente', 'descarrilamento', 'incendio', 'fogo', 'obstaculo', 'socorro', 'perigo', 'urgente'],
    comunicacao: ['radio', 'comunicacao', 'CCO', 'contato', 'falar', 'chamar', 'frequencia', 'canal'],
    freio: ['freio', 'frenagem', 'parar', 'parada', 'distancia', 'teste freio', 'freio dinamico'],
    patio: ['patio', 'manobra', 'bandeirista', 'AMV', 'chave', 'engate'],
    cruzamento: ['cruzamento', 'cruzar', 'encontro', 'trem oposto'],
    passagem: ['passagem nivel', 'cancela', 'buzina', 'PN'],
    perigoso: ['perigoso', 'produto perigoso', 'inflamavel', 'toxico', 'FDSR', 'carga perigosa'],
    noturno: ['noite', 'noturno', 'escuro', 'neblina', 'farol', 'visibilidade'],
    licenciamento: ['licenciamento', 'licenca', 'autorizacao', 'circular', 'permissao'],
    ponte: ['ponte', 'tunel', 'viaduto'],
    inspecao: ['inspecao', 'checklist', 'verificacao', 'pre-partida', 'antes de sair'],
    manutencao: ['manutencao', 'equipe via', 'trabalhadores', 'obra'],
    curva: ['curva', 'raio', 'superelevacao'],
    composicao_partida: ['composicao partida', 'trem partido', 'vagao solto', 'separacao', 'rompimento']
  };

  /* === INICIALIZACAO === */
  function init() {
    conversationHistory = T4.storage.local.get(HISTORY_KEY, []);
    setupInput();
    renderInitialState();
  }

  /* === SETUP DO INPUT === */
  function setupInput() {
    const input = document.getElementById('rof-ai-input');
    const sendBtn = document.getElementById('rof-ai-send');

    if (!input) return;

    input.addEventListener('input', function () {
      sendBtn.disabled = this.value.trim().length === 0;

      /* Auto-resize */
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (this.value.trim().length > 0) {
          sendQuestion();
        }
      }
    });
  }

  /* === RENDERIZAR ESTADO INICIAL === */
  function renderInitialState() {
    const container = document.getElementById('rof-ai-container');
    if (!container) return;

    if (conversationHistory.length > 0 && messages.length === 0) {
      /* Restaurar conversa anterior */
      messages = conversationHistory.slice(-20);
      renderMessages();
      return;
    }

    if (messages.length > 0) {
      renderMessages();
      return;
    }

    /* Tela de boas-vindas */
    let html = '<div class="rof-ai-greeting">';
    html += '<div class="rof-ai-greeting-icon">📋</div>';
    html += '<h2 class="rof-ai-greeting-title">Assistente ROF</h2>';
    html += '<p class="rof-ai-greeting-text">Faca perguntas sobre o Regulamento de Operacao Ferroviaria em linguagem natural.</p>';
    html += '</div>';

    html += '<div class="rof-ai-suggestions">';
    /* Selecionar 4 sugestoes aleatorias */
    const randomSuggestions = shuffleArray(SUGGESTIONS).slice(0, 4);
    randomSuggestions.forEach(s => {
      html += '<button class="rof-ai-suggestion" onclick="ROFAssistant.askSuggestion(\'' +
        s.replace(/'/g, "\\'") + '\')">' +
        '"' + T4.utils.escapeHTML(s) + '"</button>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  /* === ENVIAR PERGUNTA === */
  function sendQuestion() {
    const input = document.getElementById('rof-ai-input');
    if (!input || isProcessing) return;

    const question = input.value.trim();
    if (!question) return;

    /* Limpar input */
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('rof-ai-send').disabled = true;

    /* Adicionar mensagem do usuario */
    messages.push({
      role: 'user',
      content: question,
      timestamp: Date.now()
    });

    renderMessages();
    scrollToBottom();

    /* Processar pergunta */
    isProcessing = true;
    showTypingIndicator();

    /* Simular tempo de processamento para UX natural */
    setTimeout(() => {
      const response = processQuestion(question);

      /* Remover indicador de digitacao */
      hideTypingIndicator();

      /* Adicionar resposta */
      messages.push({
        role: 'assistant',
        content: response.text,
        articles: response.articles,
        timestamp: Date.now()
      });

      isProcessing = false;

      /* Salvar historico */
      conversationHistory = [...messages];
      if (conversationHistory.length > 50) {
        conversationHistory = conversationHistory.slice(-50);
      }
      T4.storage.local.set(HISTORY_KEY, conversationHistory);

      renderMessages();
      scrollToBottom();
    }, 600 + Math.random() * 400);
  }

  /* === PROCESSAR PERGUNTA === */
  function processQuestion(question) {
    const qLower = question.toLowerCase();

    /* Detectar intencoes */
    const detectedIntents = [];
    for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
      for (const kw of keywords) {
        if (qLower.includes(kw)) {
          detectedIntents.push(intent);
          break;
        }
      }
    }

    /* Extrair termos-chave */
    const searchTerms = extractSearchTerms(qLower);

    /* Buscar artigos relevantes */
    const searchResults = ROFSearch.search(searchTerms.join(' '));

    /* Se nao encontrou com termos, tentar com a pergunta toda */
    let results = searchResults;
    if (results.length === 0) {
      results = ROFSearch.search(qLower);
    }

    /* Selecionar os artigos mais relevantes */
    const topArticles = results.slice(0, 3);

    if (topArticles.length === 0) {
      return {
        text: 'Nao encontrei artigos diretamente relacionados a sua pergunta. Tente reformular usando termos como "sinal vermelho", "velocidade maxima", "passagem de nivel" ou consulte as categorias na tela inicial.',
        articles: []
      };
    }

    /* Gerar resposta baseada nos artigos encontrados */
    const response = generateResponse(question, qLower, topArticles, detectedIntents);

    return response;
  }

  /* === EXTRAIR TERMOS DE BUSCA === */
  function extractSearchTerms(question) {
    /* Remover palavras comuns (stopwords) */
    const stopwords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
      'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'que', 'se', 'e',
      'ou', 'mas', 'ao', 'eu', 'posso', 'devo', 'pode', 'como', 'qual', 'quando',
      'onde', 'quem', 'quanto', 'porque', 'esta', 'esse', 'essa', 'isso', 'aqui',
      'ali', 'la', 'ser', 'ter', 'fazer', 'ir', 'vir', 'nao', 'sim', 'meu', 'seu',
      'nosso', 'muito', 'mais', 'menos', 'bem', 'mal', 'ja', 'ainda', 'tambem',
      'entao', 'apos', 'antes', 'durante', 'sobre', 'preciso', 'precisa', 'tenho'
    ];

    const words = question
      .replace(/[?!.,;:]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.includes(w));

    return words;
  }

  /* === GERAR RESPOSTA === */
  function generateResponse(question, qLower, topArticles, intents) {
    const mainArticle = topArticles[0].article;
    const articleRefs = topArticles.map(r => r.article);

    let responseText = '';

    /* Construir resposta baseada no contexto */
    if (qLower.includes('posso') || qLower.includes('permitido') || qLower.includes('pode')) {
      responseText = buildPermissionResponse(qLower, mainArticle, articleRefs);
    } else if (qLower.includes('o que fazer') || qLower.includes('como proceder') || qLower.includes('como devo')) {
      responseText = buildProcedureResponse(qLower, mainArticle, articleRefs);
    } else if (qLower.includes('qual') || qLower.includes('quanto')) {
      responseText = buildInfoResponse(qLower, mainArticle, articleRefs);
    } else {
      responseText = buildGeneralResponse(mainArticle, articleRefs);
    }

    return {
      text: responseText,
      articles: articleRefs
    };
  }

  /* Resposta sobre permissao */
  function buildPermissionResponse(q, main, refs) {
    let text = '';

    /* Verificar contexto (carregado, vazio, etc) */
    const isCarregado = q.includes('carregado') || q.includes('minerio') || q.includes('carga');
    const isVazio = q.includes('vazio');

    text += 'De acordo com o ' + main.number + ' (' + main.title + '):\n\n';
    text += main.text.substring(0, 300);
    if (main.text.length > 300) text += '...';

    if (main.notes) {
      text += '\n\n💡 ' + main.notes;
    }

    if (isCarregado && main.applicability.includes('carregado')) {
      text += '\n\nEsta regra se aplica a trens carregados.';
    } else if (isVazio && main.applicability.includes('vazio')) {
      text += '\n\nEsta regra se aplica a trens vazios.';
    }

    return text;
  }

  /* Resposta sobre procedimento */
  function buildProcedureResponse(q, main, refs) {
    let text = 'Conforme o ' + main.number + ':\n\n';
    text += main.text;

    if (main.notes) {
      text += '\n\n💡 Dica pratica: ' + main.notes;
    }

    if (refs.length > 1) {
      text += '\n\nConsulte tambem: ' + refs.slice(1).map(r => r.number).join(', ') + '.';
    }

    return text;
  }

  /* Resposta informativa */
  function buildInfoResponse(q, main, refs) {
    let text = 'Segundo o ' + main.number + ' (' + main.title + '):\n\n';
    text += main.text.substring(0, 400);
    if (main.text.length > 400) text += '...';

    if (main.notes) {
      text += '\n\n💡 ' + main.notes;
    }

    return text;
  }

  /* Resposta geral */
  function buildGeneralResponse(main, refs) {
    let text = 'Encontrei o ' + main.number + ' sobre "' + main.title + '":\n\n';
    text += main.text.substring(0, 350);
    if (main.text.length > 350) text += '...';

    if (main.notes) {
      text += '\n\n💡 Nota pratica: ' + main.notes;
    }

    if (refs.length > 1) {
      text += '\n\nArtigos relacionados: ' + refs.slice(1).map(r => r.number + ' (' + r.title + ')').join('; ') + '.';
    }

    return text;
  }

  /* === RENDERIZAR MENSAGENS === */
  function renderMessages() {
    const container = document.getElementById('rof-ai-container');
    if (!container) return;

    let html = '<div class="rof-ai-messages">';

    messages.forEach(msg => {
      if (msg.role === 'user') {
        html += '<div class="rof-ai-message user">' + T4.utils.escapeHTML(msg.content) + '</div>';
      } else {
        html += '<div class="rof-ai-message assistant">';
        html += formatAssistantMessage(msg.content);

        /* Links para artigos */
        if (msg.articles && msg.articles.length > 0) {
          msg.articles.forEach(a => {
            html += '<span class="rof-ai-article-ref" onclick="ROFViewer.showArticle(\'' + a.id + '\', \'ai\')">';
            html += '📋 ' + T4.utils.escapeHTML(a.number);
            html += '</span> ';
          });
        }

        html += '</div>';
      }
    });

    html += '</div>';

    container.innerHTML = html;
  }

  function formatAssistantMessage(content) {
    let formatted = T4.utils.escapeHTML(content);
    /* Preservar quebras de linha */
    formatted = formatted.replace(/\n/g, '<br>');
    /* Destacar emojis e dicas */
    formatted = formatted.replace(/(💡[^<]*)/g, '<strong style="color: var(--rof-accent);">$1</strong>');
    return formatted;
  }

  /* === TYPING INDICATOR === */
  function showTypingIndicator() {
    const container = document.getElementById('rof-ai-container');
    if (!container) return;

    const messages_div = container.querySelector('.rof-ai-messages');
    if (!messages_div) return;

    const typing = document.createElement('div');
    typing.className = 'rof-ai-typing';
    typing.id = 'rof-ai-typing';
    typing.innerHTML = '<div class="t4-loader-dots"><span></span><span></span><span></span></div>';
    messages_div.appendChild(typing);

    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typing = document.getElementById('rof-ai-typing');
    if (typing) typing.remove();
  }

  /* === PERGUNTAR SUGESTAO === */
  function askSuggestion(question) {
    const input = document.getElementById('rof-ai-input');
    if (input) {
      input.value = question;
      document.getElementById('rof-ai-send').disabled = false;
    }
    sendQuestion();
  }

  /* === SCROLL === */
  function scrollToBottom() {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 100);
  }

  /* === LIMPAR CONVERSA === */
  function clearConversation() {
    messages = [];
    conversationHistory = [];
    T4.storage.local.remove(HISTORY_KEY);
    renderInitialState();
  }

  /* === UTILITARIOS === */
  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return {
    init,
    sendQuestion,
    askSuggestion,
    clearConversation
  };
})();
