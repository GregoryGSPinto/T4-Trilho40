/* ============================================
   ADAMBOOT — Interface de Chat
   Renderização de mensagens, persistência e UI
   ============================================ */

const AdamBootChat = (function () {
  const STORE_NAME = 'adamboot_conversations';
  const CONVERSATION_ID = 'main';
  let messagesEl = null;
  let inputEl = null;
  let sendBtn = null;
  let suggestionsEl = null;
  let typingEl = null;
  let messages = [];
  let isTyping = false;
  let ttsEnabled = false;

  /* Inicializa o chat */
  function init(elements) {
    messagesEl = elements.messagesEl;
    inputEl = elements.inputEl;
    sendBtn = elements.sendBtn;
    suggestionsEl = elements.suggestionsEl;

    /* Auto-resize do textarea */
    if (inputEl) {
      inputEl.addEventListener('input', handleInputResize);
      inputEl.addEventListener('keydown', handleInputKeydown);
    }

    /* Botão enviar */
    if (sendBtn) {
      sendBtn.addEventListener('click', handleSend);
    }

    /* Carrega preferência de TTS */
    ttsEnabled = T4.storage.local.get('adamboot_tts', false);
  }

  /* Carrega histórico de conversas do IndexedDB */
  async function loadHistory() {
    try {
      const data = await T4.storage.get(STORE_NAME, CONVERSATION_ID);
      if (data && data.messages) {
        messages = data.messages;
        renderAllMessages();
        scrollToBottom();
      }
    } catch (err) {
      if (T4.log) { T4.log.warn('[AdamBoot Chat] Erro ao carregar historico:', err); }
    }
  }

  /* Salva conversa no IndexedDB */
  async function saveHistory() {
    try {
      await T4.storage.put(STORE_NAME, {
        id: CONVERSATION_ID,
        messages: messages,
        updatedAt: Date.now()
      });
    } catch (err) {
      if (T4.log) { T4.log.warn('[AdamBoot Chat] Erro ao salvar historico:', err); }
    }
  }

  /* Adiciona mensagem do usuário */
  async function addUserMessage(text) {
    const msg = {
      id: T4.utils.uid(),
      type: 'user',
      text: text,
      timestamp: Date.now()
    };

    messages.push(msg);
    renderMessage(msg);
    scrollToBottom();
    clearInput();
    hideSuggestions();
    await saveHistory();

    return msg;
  }

  /* Adiciona mensagem do bot */
  async function addBotMessage(text, suggestions) {
    const msg = {
      id: T4.utils.uid(),
      type: 'bot',
      text: text,
      timestamp: Date.now()
    };

    messages.push(msg);
    renderMessage(msg);

    if (suggestions && suggestions.length > 0) {
      showSuggestions(suggestions);
    }

    scrollToBottom();
    await saveHistory();

    /* Text-to-Speech se habilitado */
    if (ttsEnabled) {
      AdamBootVoice.speak(text);
    }

    return msg;
  }

  /* Renderiza uma mensagem na interface */
  function renderMessage(msg) {
    if (!messagesEl) return;

    /* Verifica se precisa de separador de data */
    checkDateSeparator(msg);

    const container = document.createElement('div');
    container.className = 'ab-message ab-message-' + msg.type;
    container.setAttribute('data-id', msg.id);

    /* Avatar */
    const avatar = document.createElement('div');
    avatar.className = 'ab-message-avatar';
    avatar.textContent = msg.type === 'bot' ? '🤖' : '👤';

    /* Conteúdo */
    const content = document.createElement('div');

    /* Bolha */
    const bubble = document.createElement('div');
    bubble.className = 'ab-bubble';

    if (msg.type === 'bot') {
      bubble.innerHTML = AdamBootPersonality.markdownToHTML(msg.text);
    } else {
      bubble.textContent = msg.text;
    }

    /* Timestamp */
    const time = document.createElement('div');
    time.className = 'ab-timestamp';
    time.textContent = T4.utils.formatTime(msg.timestamp);

    content.appendChild(bubble);
    content.appendChild(time);
    container.appendChild(avatar);
    container.appendChild(content);

    messagesEl.appendChild(container);
  }

  /* Verifica e insere separador de data */
  function checkDateSeparator(msg) {
    if (messages.length <= 1) return;

    const prevMsg = messages[messages.length - 2];
    if (!prevMsg) return;

    const prevDate = new Date(prevMsg.timestamp).toDateString();
    const currDate = new Date(msg.timestamp).toDateString();

    if (prevDate !== currDate) {
      const separator = document.createElement('div');
      separator.className = 'ab-date-separator';
      const dateText = isToday(msg.timestamp) ? 'Hoje' :
                       isYesterday(msg.timestamp) ? 'Ontem' :
                       T4.utils.formatDate(msg.timestamp, 'short');
      separator.innerHTML = '<span>' + dateText + '</span>';
      messagesEl.appendChild(separator);
    }
  }

  function isToday(timestamp) {
    return new Date(timestamp).toDateString() === new Date().toDateString();
  }

  function isYesterday(timestamp) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(timestamp).toDateString() === yesterday.toDateString();
  }

  /* Renderiza todas as mensagens (para carregar histórico) */
  function renderAllMessages() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';

    for (let i = 0; i < messages.length; i++) {
      /* Separador de data */
      if (i > 0) {
        const prevDate = new Date(messages[i - 1].timestamp).toDateString();
        const currDate = new Date(messages[i].timestamp).toDateString();
        if (prevDate !== currDate) {
          const separator = document.createElement('div');
          separator.className = 'ab-date-separator';
          const ts = messages[i].timestamp;
          const dateText = isToday(ts) ? 'Hoje' :
                           isYesterday(ts) ? 'Ontem' :
                           T4.utils.formatDate(ts, 'short');
          separator.innerHTML = '<span>' + dateText + '</span>';
          messagesEl.appendChild(separator);
        }
      }

      const msg = messages[i];
      const container = document.createElement('div');
      container.className = 'ab-message ab-message-' + msg.type;
      container.setAttribute('data-id', msg.id);
      container.style.animation = 'none';
      container.style.opacity = '1';

      const avatar = document.createElement('div');
      avatar.className = 'ab-message-avatar';
      avatar.textContent = msg.type === 'bot' ? '🤖' : '👤';

      const content = document.createElement('div');

      const bubble = document.createElement('div');
      bubble.className = 'ab-bubble';
      if (msg.type === 'bot') {
        bubble.innerHTML = AdamBootPersonality.markdownToHTML(msg.text);
      } else {
        bubble.textContent = msg.text;
      }

      const time = document.createElement('div');
      time.className = 'ab-timestamp';
      time.textContent = T4.utils.formatTime(msg.timestamp);

      content.appendChild(bubble);
      content.appendChild(time);
      container.appendChild(avatar);
      container.appendChild(content);

      messagesEl.appendChild(container);
    }
  }

  /* Mostra indicador de digitação */
  function showTyping() {
    if (!messagesEl || isTyping) return;
    isTyping = true;

    typingEl = document.createElement('div');
    typingEl.className = 'ab-typing';
    typingEl.id = 'ab-typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'ab-message-avatar';
    avatar.textContent = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'ab-typing-bubble';
    bubble.innerHTML =
      '<span class="ab-typing-dot"></span>' +
      '<span class="ab-typing-dot"></span>' +
      '<span class="ab-typing-dot"></span>' +
      '<span class="ab-typing-label">AdamBoot está digitando...</span>';

    typingEl.appendChild(avatar);
    typingEl.appendChild(bubble);
    messagesEl.appendChild(typingEl);
    scrollToBottom();
  }

  /* Esconde indicador de digitação */
  function hideTyping() {
    isTyping = false;
    if (typingEl && typingEl.parentNode) {
      typingEl.remove();
      typingEl = null;
    }
  }

  /* Mostra sugestões como chips */
  function showSuggestions(suggestions) {
    if (!suggestionsEl) return;

    suggestionsEl.innerHTML = '';
    suggestions.forEach(function (text) {
      const chip = document.createElement('button');
      chip.className = 'ab-suggestion-chip';
      chip.textContent = text;
      chip.addEventListener('click', function () {
        T4.events.emit('adamboot:sendMessage', text);
      });
      suggestionsEl.appendChild(chip);
    });

    suggestionsEl.style.display = 'flex';
  }

  /* Esconde sugestões */
  function hideSuggestions() {
    if (suggestionsEl) {
      suggestionsEl.style.display = 'none';
      suggestionsEl.innerHTML = '';
    }
  }

  /* Scroll para o final das mensagens */
  function scrollToBottom() {
    if (!messagesEl) return;
    requestAnimationFrame(function () {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  /* Auto-resize do textarea */
  function handleInputResize() {
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    updateSendButton();
  }

  /* Atualiza estado do botão enviar */
  function updateSendButton() {
    if (!sendBtn || !inputEl) return;
    sendBtn.disabled = inputEl.value.trim().length === 0;
  }

  /* Tecla Enter envia, Shift+Enter quebra linha */
  function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* Envia mensagem pelo botão ou enter */
  function handleSend() {
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (text.length === 0) return;
    T4.events.emit('adamboot:sendMessage', text);
  }

  /* Limpa o input */
  function clearInput() {
    if (!inputEl) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    updateSendButton();
  }

  /* Limpa toda a conversa */
  async function clearConversation() {
    messages = [];
    if (messagesEl) {
      messagesEl.innerHTML = '';
    }
    hideSuggestions();

    try {
      await T4.storage.remove(STORE_NAME, CONVERSATION_ID);
    } catch (err) {
      if (T4.log) { T4.log.warn('[AdamBoot Chat] Erro ao limpar conversa:', err); }
    }

    T4.notifications.success('Conversa limpa');
  }

  /* Conta mensagens */
  function getMessageCount() {
    return messages.length;
  }

  /* Habilita/desabilita TTS */
  function setTTS(enabled) {
    ttsEnabled = enabled;
    T4.storage.local.set('adamboot_tts', enabled);
  }

  function getTTS() {
    return ttsEnabled;
  }

  /* Foca no input */
  function focusInput() {
    if (inputEl) {
      inputEl.focus();
    }
  }

  return {
    init,
    loadHistory,
    addUserMessage,
    addBotMessage,
    showTyping,
    hideTyping,
    showSuggestions,
    hideSuggestions,
    scrollToBottom,
    clearConversation,
    clearInput,
    focusInput,
    getMessageCount,
    setTTS,
    getTTS
  };
})();
