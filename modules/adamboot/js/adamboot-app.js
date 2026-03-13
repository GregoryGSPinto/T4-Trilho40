/* ============================================
   ADAMBOOT — Controlador Principal
   Inicialização, autenticação e fluxo de mensagens
   ============================================ */

const AdamBootApp = (function () {
  let isInitialized = false;
  let isProcessing = false;
  let optionsMenuOpen = false;

  /* Sugestões iniciais para a tela de boas-vindas */
  const INITIAL_SUGGESTIONS = [
    'Qual a VMA para trem carregado?',
    'O que é BOLL?',
    'Procedimento para sinal vermelho',
    'Quais são os EPIs obrigatórios?',
    'Como funciona o freio dinâmico?',
    'O que fazer em caso de avistamento?'
  ];

  /* Inicializa o módulo */
  async function init() {
    if (isInitialized) return;

    /* Inicializa o T4 */
    T4.init('adamboot');

    /* Verifica autenticação */
    if (!T4.auth.requireAuth()) {
      T4.auth.renderLoginScreen(document.getElementById('ab-app'));
      return;
    }

    /* Referências dos elementos */
    const elements = {
      messagesEl: document.getElementById('ab-messages'),
      inputEl: document.getElementById('ab-input'),
      sendBtn: document.getElementById('ab-send-btn'),
      suggestionsEl: document.getElementById('ab-suggestions')
    };

    /* Inicializa subsistemas */
    AdamBootChat.init(elements);
    await AdamBootKnowledge.load();
    await AdamBootPersonality.loadPrompts();

    /* Inicializa voz */
    AdamBootVoice.init({
      voiceBtn: document.getElementById('ab-voice-btn'),
      transcriptionEl: document.getElementById('ab-voice-transcription'),
      onResult: handleVoiceResult,
      onInterim: handleVoiceInterim,
      onEnd: handleVoiceEnd
    });

    /* Configura eventos */
    setupEventListeners();

    /* Carrega histórico */
    await AdamBootChat.loadHistory();

    /* Se não há mensagens, mostra boas-vindas */
    if (AdamBootChat.getMessageCount() === 0) {
      await showWelcomeMessage();
    } else {
      /* Mostra sugestões genéricas */
      AdamBootChat.showSuggestions(getRandomSuggestions(3));
    }

    /* Atualiza info do header */
    updateHeader();

    isInitialized = true;
    console.log('[AdamBoot] Inicializado com sucesso');
  }

  /* Configura todos os event listeners */
  function setupEventListeners() {
    /* Evento de envio de mensagem (do chat e das sugestões) */
    T4.events.on('adamboot:sendMessage', handleSendMessage);

    /* Botão voltar */
    const backBtn = document.getElementById('ab-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        T4.router.goHome();
      });
    }

    /* Menu de opções */
    const optionsBtn = document.getElementById('ab-options-btn');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', toggleOptionsMenu);
    }

    /* Itens do menu de opções */
    const clearBtn = document.getElementById('ab-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', handleClearConversation);
    }

    const ttsBtn = document.getElementById('ab-tts-btn');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', handleToggleTTS);
    }

    const voiceModeBtn = document.getElementById('ab-voice-mode-btn');
    if (voiceModeBtn) {
      voiceModeBtn.addEventListener('click', handleToggleVoiceMode);
    }

    /* Fecha menu ao clicar fora */
    document.addEventListener('click', function (e) {
      if (optionsMenuOpen && !e.target.closest('.ab-header-actions')) {
        closeOptionsMenu();
      }
    });

    /* Atualiza contexto quando mudar */
    T4.events.on('context:update', updateHeader);
  }

  /* Mostra mensagem de boas-vindas */
  async function showWelcomeMessage() {
    const userName = AdamBootContext.getUserName();
    const greeting = await AdamBootPersonality.getGreeting(userName);

    const prompts = await AdamBootPersonality.loadPrompts();
    const template = prompts.responseTemplates.greeting;
    const welcomeText = template.replace('{greeting}', greeting);

    await AdamBootChat.addBotMessage(welcomeText, getRandomSuggestions(4));
  }

  /* Processa envio de mensagem */
  async function handleSendMessage(text) {
    if (!text || text.trim().length === 0 || isProcessing) return;

    isProcessing = true;

    /* Adiciona mensagem do usuário */
    await AdamBootChat.addUserMessage(text.trim());

    /* Mostra indicador de digitação */
    AdamBootChat.showTyping();

    /* Simula tempo de processamento (1-2 segundos para parecer natural) */
    const delay = 800 + Math.random() * 1200;
    await T4.utils.sleep(delay);

    /* Processa a pergunta */
    try {
      const result = await AdamBootKnowledge.processQuestion(text.trim());

      /* Esconde indicador */
      AdamBootChat.hideTyping();

      /* Adiciona resposta do bot */
      await AdamBootChat.addBotMessage(result.answer, result.suggestions);

    } catch (err) {
      console.error('[AdamBoot] Erro ao processar pergunta:', err);
      AdamBootChat.hideTyping();

      await AdamBootChat.addBotMessage(
        'Desculpe, maquinista. Tive um problema ao processar sua pergunta. Tente novamente ou reformule a dúvida.',
        getRandomSuggestions(3)
      );
    }

    isProcessing = false;
  }

  /* Resultado final do reconhecimento de voz */
  function handleVoiceResult(text) {
    if (text && text.trim().length > 0) {
      /* Coloca o texto no input e envia */
      const inputEl = document.getElementById('ab-input');
      if (inputEl) {
        inputEl.value = text;
      }
      handleSendMessage(text);
    }
  }

  /* Resultado intermediário do reconhecimento de voz */
  function handleVoiceInterim(text) {
    const inputEl = document.getElementById('ab-input');
    if (inputEl) {
      inputEl.value = text;
    }
  }

  /* Fim do reconhecimento de voz */
  function handleVoiceEnd() {
    /* Nada a fazer — o resultado já foi processado */
  }

  /* Atualiza informações do header */
  function updateHeader() {
    const ctx = AdamBootContext.getContext();
    const statusEl = document.getElementById('ab-header-status');

    if (statusEl) {
      const parts = ['Online'];
      if (ctx.patio) parts.push(ctx.patio);
      if (ctx.turno) parts.push('Turno ' + ctx.turno);
      statusEl.textContent = parts.join(' · ');
    }
  }

  /* Toggle do menu de opções */
  function toggleOptionsMenu() {
    const menu = document.getElementById('ab-options-menu');
    if (!menu) return;

    optionsMenuOpen = !optionsMenuOpen;
    menu.classList.toggle('active', optionsMenuOpen);

    /* Atualiza labels dos toggles */
    updateOptionsLabels();
  }

  function closeOptionsMenu() {
    const menu = document.getElementById('ab-options-menu');
    if (menu) {
      menu.classList.remove('active');
    }
    optionsMenuOpen = false;
  }

  /* Atualiza labels do menu de opções */
  function updateOptionsLabels() {
    const ttsLabel = document.getElementById('ab-tts-label');
    if (ttsLabel) {
      ttsLabel.textContent = AdamBootChat.getTTS() ? 'Desativar voz nas respostas' : 'Ativar voz nas respostas';
    }

    const voiceModeLabel = document.getElementById('ab-voice-mode-label');
    if (voiceModeLabel) {
      voiceModeLabel.textContent = AdamBootVoice.getMode() === 'hold'
        ? 'Modo: segurar para falar'
        : 'Modo: toque para falar';
    }
  }

  /* Limpa conversa com confirmação */
  async function handleClearConversation() {
    closeOptionsMenu();
    const confirmed = await T4.notifications.confirm(
      'Deseja limpar toda a conversa? Esta ação não pode ser desfeita.',
      {
        title: 'Limpar conversa',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    );

    if (confirmed) {
      await AdamBootChat.clearConversation();
      await showWelcomeMessage();
    }
  }

  /* Toggle TTS */
  function handleToggleTTS() {
    const newState = !AdamBootChat.getTTS();
    AdamBootChat.setTTS(newState);

    if (!newState) {
      AdamBootVoice.stopSpeaking();
    }

    T4.notifications.success(newState ? 'Voz nas respostas ativada' : 'Voz nas respostas desativada');
    updateOptionsLabels();
    closeOptionsMenu();
  }

  /* Toggle modo de voz */
  function handleToggleVoiceMode() {
    const newMode = AdamBootVoice.getMode() === 'hold' ? 'toggle' : 'hold';
    AdamBootVoice.setMode(newMode);

    T4.notifications.success(
      newMode === 'hold' ? 'Modo: segurar para falar' : 'Modo: toque para falar/parar'
    );
    updateOptionsLabels();
    closeOptionsMenu();
  }

  /* Retorna sugestões aleatórias */
  function getRandomSuggestions(count) {
    const shuffled = INITIAL_SUGGESTIONS.slice().sort(function () {
      return 0.5 - Math.random();
    });
    return shuffled.slice(0, count);
  }

  /* Inicializa quando o DOM estiver pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    handleSendMessage
  };
})();
