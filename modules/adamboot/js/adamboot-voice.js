/* ============================================
   ADAMBOOT — Entrada/Saída de Voz
   Web Speech API para reconhecimento e síntese
   ============================================ */

const AdamBootVoice = (function () {
  let recognition = null;
  let synthesis = null;
  let isRecording = false;
  let isAvailable = false;
  let holdMode = true; /* true = segurar para falar, false = toggle */
  let onResult = null;
  let onInterim = null;
  let onEnd = null;
  let voiceBtn = null;
  let transcriptionEl = null;

  /* Verifica suporte à API */
  function checkSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSynthesis = 'speechSynthesis' in window;
    isAvailable = !!SpeechRecognition;
    synthesis = hasSynthesis ? window.speechSynthesis : null;
    return { recognition: isAvailable, synthesis: hasSynthesis };
  }

  /* Inicializa o sistema de voz */
  function init(options) {
    const support = checkSupport();

    onResult = options.onResult || function () {};
    onInterim = options.onInterim || function () {};
    onEnd = options.onEnd || function () {};
    voiceBtn = options.voiceBtn || null;
    transcriptionEl = options.transcriptionEl || null;

    if (!support.recognition) {
      if (T4.log) { T4.log.warn('[AdamBoot Voice] Speech Recognition nao suportado neste navegador'); }
      if (voiceBtn) {
        voiceBtn.classList.add('ab-voice-unavailable');
        voiceBtn.title = 'Reconhecimento de voz não suportado neste navegador';
      }
      return false;
    }

    /* Configura o reconhecimento */
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    /* Eventos do reconhecimento */
    recognition.onstart = handleStart;
    recognition.onresult = handleResult;
    recognition.onend = handleEnd;
    recognition.onerror = handleError;

    /* Configura botão de voz */
    if (voiceBtn) {
      setupVoiceButton();
    }

    /* Carrega preferência de modo */
    const savedMode = T4.storage.local.get('adamboot_voice_mode');
    if (savedMode !== null) {
      holdMode = savedMode === 'hold';
    }

    return true;
  }

  /* Configura os eventos do botão de voz */
  function setupVoiceButton() {
    if (!voiceBtn) return;

    /* Eventos de toque (hold-to-talk) */
    voiceBtn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (holdMode) {
        startRecording();
      } else {
        toggleRecording();
      }
    }, { passive: false });

    voiceBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (holdMode && isRecording) {
        stopRecording();
      }
    }, { passive: false });

    voiceBtn.addEventListener('touchcancel', function (e) {
      if (holdMode && isRecording) {
        stopRecording();
      }
    });

    /* Eventos de mouse (fallback desktop) */
    voiceBtn.addEventListener('mousedown', function (e) {
      if (holdMode) {
        startRecording();
      } else {
        toggleRecording();
      }
    });

    voiceBtn.addEventListener('mouseup', function (e) {
      if (holdMode && isRecording) {
        stopRecording();
      }
    });

    voiceBtn.addEventListener('mouseleave', function (e) {
      if (holdMode && isRecording) {
        stopRecording();
      }
    });
  }

  /* Inicia a gravação */
  function startRecording() {
    if (!recognition || isRecording) return;

    try {
      recognition.start();
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        recognition.stop();
        setTimeout(function () {
          try { recognition.start(); } catch (e) { /* silencia */ }
        }, 100);
      }
    }
  }

  /* Para a gravação */
  function stopRecording() {
    if (!recognition || !isRecording) return;
    try {
      recognition.stop();
    } catch (err) {
      /* Silencia erro de estado inválido */
    }
  }

  /* Alterna gravação (modo toggle) */
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  /* Callback: início da gravação */
  function handleStart() {
    isRecording = true;
    T4.utils.vibrate(30);

    if (voiceBtn) {
      voiceBtn.classList.add('ab-voice-recording');
      voiceBtn.setAttribute('aria-label', 'Gravando... Solte para enviar');
    }

    if (transcriptionEl) {
      transcriptionEl.textContent = 'Ouvindo...';
      transcriptionEl.classList.add('active');
    }
  }

  /* Callback: resultado do reconhecimento */
  function handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    /* Exibe transcrição em tempo real */
    if (transcriptionEl) {
      if (interimTranscript) {
        transcriptionEl.textContent = interimTranscript;
      }
      if (finalTranscript) {
        transcriptionEl.textContent = finalTranscript;
      }
    }

    /* Callback de resultado intermediário */
    if (interimTranscript) {
      onInterim(interimTranscript);
    }

    /* Callback de resultado final */
    if (finalTranscript) {
      onResult(finalTranscript.trim());
    }
  }

  /* Callback: fim da gravação */
  function handleEnd() {
    isRecording = false;

    if (voiceBtn) {
      voiceBtn.classList.remove('ab-voice-recording');
      voiceBtn.setAttribute('aria-label', holdMode ? 'Segurar para falar' : 'Toque para falar');
    }

    if (transcriptionEl) {
      setTimeout(function () {
        transcriptionEl.classList.remove('active');
        transcriptionEl.textContent = '';
      }, 500);
    }

    onEnd();
  }

  /* Callback: erro na gravação */
  function handleError(event) {
    isRecording = false;

    if (voiceBtn) {
      voiceBtn.classList.remove('ab-voice-recording');
    }

    if (transcriptionEl) {
      transcriptionEl.classList.remove('active');
    }

    switch (event.error) {
      case 'no-speech':
        /* Silencioso — o usuário simplesmente não falou */
        break;
      case 'not-allowed':
        T4.notifications.warning('Permissão de microfone negada. Habilite nas configurações do navegador.');
        if (voiceBtn) {
          voiceBtn.classList.add('ab-voice-unavailable');
        }
        break;
      case 'network':
        T4.notifications.warning('Erro de rede no reconhecimento de voz. Verifique sua conexão.');
        break;
      default:
        if (T4.log) { T4.log.warn('[AdamBoot Voice] Erro:', event.error); }
    }

    onEnd();
  }

  /* Fala uma resposta usando Text-to-Speech */
  function speak(text) {
    if (!synthesis) return;

    /* Cancela fala anterior */
    synthesis.cancel();

    /* Remove formatação markdown do texto */
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[•\-]\s/g, '')
      .replace(/\d+\.\s/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    /* Tenta usar voz brasileira se disponível */
    const voices = synthesis.getVoices();
    const ptBRVoice = voices.find(function (v) {
      return v.lang === 'pt-BR' || v.lang.startsWith('pt');
    });
    if (ptBRVoice) {
      utterance.voice = ptBRVoice;
    }

    synthesis.speak(utterance);
  }

  /* Para a fala atual */
  function stopSpeaking() {
    if (synthesis) {
      synthesis.cancel();
    }
  }

  /* Alterna entre modo hold e toggle */
  function setMode(mode) {
    holdMode = mode === 'hold';
    T4.storage.local.set('adamboot_voice_mode', holdMode ? 'hold' : 'toggle');

    if (voiceBtn) {
      voiceBtn.setAttribute('aria-label', holdMode ? 'Segurar para falar' : 'Toque para falar');
    }
  }

  /* Retorna o modo atual */
  function getMode() {
    return holdMode ? 'hold' : 'toggle';
  }

  /* Retorna se está gravando */
  function getIsRecording() {
    return isRecording;
  }

  /* Retorna se voz está disponível */
  function getIsAvailable() {
    return isAvailable;
  }

  return {
    init,
    startRecording,
    stopRecording,
    toggleRecording,
    speak,
    stopSpeaking,
    setMode,
    getMode,
    getIsRecording,
    getIsAvailable,
    checkSupport
  };
})();
