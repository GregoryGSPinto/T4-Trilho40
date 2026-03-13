/* ============================================
   ROF QUIZ — Quiz de conhecimento do ROF
   Modo estudo e modo prova, ranking, revisao
   ============================================ */

const ROFQuiz = (function () {
  const SCORES_KEY = 'rof_quiz_scores';
  const WRONG_KEY = 'rof_quiz_wrong_articles';

  let mode = null; /* 'study' ou 'test' */
  let questions = [];
  let currentIndex = 0;
  let answers = [];
  let timerInterval = null;
  let timeRemaining = 0;
  let scores = [];
  let wrongArticleCounts = {};

  /* === INICIALIZACAO === */
  function init() {
    scores = T4.storage.local.get(SCORES_KEY, []);
    wrongArticleCounts = T4.storage.local.get(WRONG_KEY, {});
  }

  /* === GERAR PERGUNTAS === */
  function generateQuestions(count) {
    count = count || 10;
    const articles = ROFSearch.getAllArticles();
    const generated = [];

    /* Priorizar artigos que o usuario mais erra */
    const sortedArticles = [...articles].sort((a, b) => {
      const wrongA = wrongArticleCounts[a.id] || 0;
      const wrongB = wrongArticleCounts[b.id] || 0;
      return wrongB - wrongA;
    });

    /* Pegar artigos priorizados + aleatorios */
    const priorityCount = Math.min(Math.floor(count * 0.4), Object.keys(wrongArticleCounts).length);
    const selectedArticles = [];

    /* Artigos com mais erros primeiro */
    for (let i = 0; i < priorityCount && i < sortedArticles.length; i++) {
      if (wrongArticleCounts[sortedArticles[i].id] > 0) {
        selectedArticles.push(sortedArticles[i]);
      }
    }

    /* Completar com aleatorios */
    const remaining = shuffleArray(articles.filter(a => !selectedArticles.includes(a)));
    for (let i = 0; selectedArticles.length < count && i < remaining.length; i++) {
      selectedArticles.push(remaining[i]);
    }

    /* Gerar perguntas para cada artigo */
    shuffleArray(selectedArticles).slice(0, count).forEach(article => {
      const question = createQuestion(article, articles);
      if (question) {
        generated.push(question);
      }
    });

    return generated;
  }

  /* === CRIAR PERGUNTA === */
  function createQuestion(article, allArticles) {
    const questionTemplates = getQuestionTemplates(article);
    if (questionTemplates.length === 0) return null;

    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

    /* Gerar opcoes erradas */
    const wrongOptions = generateWrongOptions(template.correct, article, allArticles, 3);
    if (wrongOptions.length < 3) return null;

    /* Montar opcoes em ordem aleatoria */
    const options = shuffleArray([
      { text: template.correct, isCorrect: true },
      ...wrongOptions.map(w => ({ text: w, isCorrect: false }))
    ]);

    return {
      articleId: article.id,
      articleNumber: article.number,
      question: template.question,
      options: options,
      explanation: template.explanation || article.notes || article.text.substring(0, 200) + '...',
      correctIndex: options.findIndex(o => o.isCorrect)
    };
  }

  /* === TEMPLATES DE PERGUNTAS === */
  function getQuestionTemplates(article) {
    const templates = [];
    const cat = article.category;

    /* Pergunta generica sobre o artigo */
    templates.push({
      question: 'Segundo o ' + article.number + ', sobre "' + article.title + '", qual afirmacao esta correta?',
      correct: extractKeyFact(article.text),
      explanation: article.notes || article.text.substring(0, 200)
    });

    /* Perguntas especificas por categoria */
    if (cat === 'sinalizacao') {
      if (article.text.includes('vermelho')) {
        templates.push({
          question: 'O que o maquinista deve fazer ao encontrar sinal vermelho?',
          correct: 'Parar obrigatoriamente e comunicar-se com o CCO antes de prosseguir',
          explanation: article.notes
        });
      }
      if (article.text.includes('amarelo') && !article.text.includes('intermitente')) {
        templates.push({
          question: 'Ao passar por sinal amarelo, qual a velocidade maxima para trem carregado?',
          correct: '30 km/h',
          explanation: article.notes
        });
      }
      if (article.text.includes('apagado')) {
        templates.push({
          question: 'Como deve ser tratado um sinal apagado (sem aspecto)?',
          correct: 'Como sinal vermelho — aspecto mais restritivo',
          explanation: article.notes
        });
      }
    }

    if (cat === 'velocidade') {
      if (article.text.includes('patio')) {
        templates.push({
          question: 'Qual a velocidade maxima dentro dos limites de patio?',
          correct: '20 km/h para qualquer composicao',
          explanation: article.notes
        });
      }
      if (article.text.includes('curva')) {
        templates.push({
          question: 'Para curvas com raio inferior a 300 metros, qual o limite para trem carregado?',
          correct: '30 km/h',
          explanation: article.notes
        });
      }
      if (article.text.includes('ponte') || article.text.includes('tunel')) {
        templates.push({
          question: 'Qual a velocidade maxima em tuneis?',
          correct: '50 km/h para qualquer composicao',
          explanation: article.notes
        });
      }
    }

    if (cat === 'comunicacao') {
      if (article.text.includes('falha')) {
        templates.push({
          question: 'Em caso de falha total do radio, apos 30 minutos sem contato, o que fazer?',
          correct: 'Prosseguir em marcha de atencao (20 km/h) ate o proximo ponto de comunicacao',
          explanation: article.notes
        });
      }
    }

    if (cat === 'emergencia') {
      if (article.text.includes('descarrilamento')) {
        templates.push({
          question: 'A que distancia devem ser colocados sinais de parada em caso de descarrilamento?',
          correct: '800 metros em ambas as direcoes',
          explanation: article.notes
        });
      }
      if (article.text.includes('incendio')) {
        templates.push({
          question: 'Em caso de incendio com produto perigoso, qual a distancia minima de afastamento?',
          correct: '300 metros na direcao contraria ao vento',
          explanation: article.notes
        });
      }
    }

    if (cat === 'passagem_nivel') {
      templates.push({
        question: 'A quantos metros da passagem de nivel o maquinista deve iniciar o toque de buzina?',
        correct: '500 metros',
        explanation: article.notes
      });
      templates.push({
        question: 'Qual o padrao do toque de buzina para passagem de nivel?',
        correct: 'Longo-longo-curto-longo',
        explanation: article.notes
      });
    }

    if (cat === 'perigosos') {
      if (article.text.includes('velocidade')) {
        templates.push({
          question: 'Qual a velocidade maxima na linha principal com produtos perigosos?',
          correct: '50 km/h',
          explanation: article.notes
        });
      }
    }

    if (cat === 'circulacao') {
      if (article.text.includes('teste de freio')) {
        templates.push({
          question: 'Qual a pressao minima do sistema de freios para teste de partida?',
          correct: '90 psi na linha principal',
          explanation: article.notes
        });
      }
      if (article.text.includes('noturno')) {
        templates.push({
          question: 'Em periodo noturno, em quanto deve ser reduzida a velocidade?',
          correct: '10% em relacao aos limites diurnos',
          explanation: article.notes
        });
      }
      if (article.text.includes('licenciamento')) {
        templates.push({
          question: 'Sobre o licenciamento de trens, qual afirmacao esta correta?',
          correct: 'Nenhum trem pode circular sem licenciamento emitido pelo CCO',
          explanation: article.notes
        });
      }
    }

    return templates;
  }

  /* Extrair fato principal do texto */
  function extractKeyFact(text) {
    const sentences = text.split(/\.\s+/);
    if (sentences.length === 0) return text.substring(0, 100);

    /* Pegar uma frase significativa (nao a primeira, que geralmente e definicao) */
    const idx = Math.min(1, sentences.length - 1);
    let fact = sentences[idx].trim();
    if (fact.length > 120) {
      fact = fact.substring(0, 117) + '...';
    }
    return fact;
  }

  /* === GERAR OPCOES ERRADAS === */
  function generateWrongOptions(correctAnswer, article, allArticles, count) {
    const options = [];
    const used = new Set([correctAnswer.toLowerCase()]);

    /* Opcoes erradas baseadas em artigos similares da mesma categoria */
    const sameCategory = allArticles.filter(a =>
      a.id !== article.id && a.category === article.category
    );

    sameCategory.forEach(a => {
      if (options.length >= count) return;
      const fact = extractKeyFact(a.text);
      if (!used.has(fact.toLowerCase())) {
        used.add(fact.toLowerCase());
        options.push(fact);
      }
    });

    /* Opcoes erradas genericas se necessario */
    const genericWrong = [
      'Nao ha restricao especifica para esta situacao',
      'O maquinista pode decidir por conta propria sem comunicar o CCO',
      'A velocidade pode ser mantida no limite maximo do trecho',
      'O procedimento e opcional e depende da experiencia do maquinista',
      'Somente o CCO pode tomar essa decisao, o maquinista deve aguardar indefinidamente',
      'A comunicacao deve ser feita somente ao chegar no proximo patio',
      'A velocidade nao precisa ser reduzida nessa situacao',
      'O trem pode prosseguir normalmente sem restricoes adicionais',
      'A reducao de velocidade e de 50% em todas as situacoes',
      'O procedimento so se aplica em horario comercial'
    ];

    shuffleArray(genericWrong).forEach(opt => {
      if (options.length >= count) return;
      if (!used.has(opt.toLowerCase())) {
        used.add(opt.toLowerCase());
        options.push(opt);
      }
    });

    return options.slice(0, count);
  }

  /* === INICIAR QUIZ === */
  function startQuiz(selectedMode) {
    mode = selectedMode;
    questions = generateQuestions(10);
    currentIndex = 0;
    answers = [];

    if (mode === 'test') {
      timeRemaining = 300; /* 5 minutos */
      startTimer();
    }

    renderQuestion();
  }

  /* === RENDERIZAR SELECAO DE MODO === */
  function renderModeSelection() {
    const content = document.getElementById('rof-quiz-content');
    const timerContainer = document.getElementById('rof-quiz-timer-container');
    timerContainer.innerHTML = '';

    /* Estatisticas */
    const totalQuizzes = scores.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / totalQuizzes)
      : 0;

    let html = '';

    /* Estatisticas resumidas */
    if (totalQuizzes > 0) {
      html += '<div class="t4-card" style="margin-bottom: var(--t4-space-lg); text-align: center; padding: var(--t4-space-md);">';
      html += '<div style="font-size:0.75rem; color: var(--t4-text-muted); margin-bottom: 4px;">Sua media</div>';
      html += '<div style="font-size:2rem; font-weight:800; font-family: var(--t4-font-display); color: var(--rof-accent);">' + avgScore + '%</div>';
      html += '<div style="font-size:0.6875rem; color: var(--t4-text-muted);">' + totalQuizzes + ' quiz' + (totalQuizzes > 1 ? 'zes' : '') + ' realizados</div>';
      html += '</div>';
    }

    /* Selecao de modo */
    html += '<div class="rof-section-title">Escolha o modo</div>';

    html += '<div class="rof-quiz-modes">';

    html += '<div class="rof-quiz-mode-card" onclick="ROFQuiz.startQuiz(\'study\')">';
    html += '<div class="rof-quiz-mode-icon study">📚</div>';
    html += '<div class="rof-quiz-mode-content">';
    html += '<div class="rof-quiz-mode-title">Modo Estudo</div>';
    html += '<div class="rof-quiz-mode-desc">Veja a explicacao apos cada resposta. Sem tempo limite.</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="rof-quiz-mode-card" onclick="ROFQuiz.startQuiz(\'test\')">';
    html += '<div class="rof-quiz-mode-icon test">⏱️</div>';
    html += '<div class="rof-quiz-mode-content">';
    html += '<div class="rof-quiz-mode-title">Modo Prova</div>';
    html += '<div class="rof-quiz-mode-desc">5 minutos, sem ajuda. Teste seu conhecimento real.</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    /* Ranking historico */
    if (scores.length > 0) {
      html += '<div class="rof-section-title" style="margin-top: var(--t4-space-lg);">Ultimos resultados</div>';
      const recentScores = scores.slice(-5).reverse();
      recentScores.forEach(s => {
        const modeLabel = s.mode === 'study' ? '📚 Estudo' : '⏱️ Prova';
        const color = s.percentage >= 70 ? 'var(--t4-status-ok)' : s.percentage >= 50 ? 'var(--rof-accent)' : 'var(--t4-status-danger)';
        html += '<div class="rof-recent-item" style="cursor:default;">';
        html += '<span style="font-size:0.8125rem;">' + modeLabel + '</span>';
        html += '<span style="flex:1; font-size:0.8125rem; color: var(--t4-text-secondary);">' + T4.utils.formatDate(s.date, 'short') + '</span>';
        html += '<span style="font-size:1rem; font-weight:700; font-family: var(--t4-font-display); color:' + color + ';">' + s.percentage + '%</span>';
        html += '</div>';
      });
    }

    content.innerHTML = html;
  }

  /* === RENDERIZAR PERGUNTA === */
  function renderQuestion() {
    if (currentIndex >= questions.length) {
      finishQuiz();
      return;
    }

    const q = questions[currentIndex];
    const content = document.getElementById('rof-quiz-content');
    const letters = ['A', 'B', 'C', 'D'];

    /* Progress bar */
    const progress = ((currentIndex) / questions.length) * 100;

    let html = '';

    /* Progress */
    html += '<div class="rof-quiz-header">';
    html += '<span class="rof-quiz-progress">Pergunta ' + (currentIndex + 1) + ' de ' + questions.length + '</span>';
    html += '</div>';

    html += '<div class="t4-progress" style="margin-bottom: var(--t4-space-lg);">';
    html += '<div class="t4-progress-bar" style="width:' + progress + '%;"></div>';
    html += '</div>';

    /* Referencia do artigo */
    html += '<div class="rof-quiz-question">';
    html += '<div class="rof-quiz-question-ref">Referencia: ' + T4.utils.escapeHTML(q.articleNumber) + '</div>';
    html += '<div class="rof-quiz-question-text">' + T4.utils.escapeHTML(q.question) + '</div>';
    html += '</div>';

    /* Opcoes */
    html += '<div class="rof-quiz-options" id="rof-quiz-options">';
    q.options.forEach((opt, idx) => {
      html += '<div class="rof-quiz-option" data-index="' + idx + '" onclick="ROFQuiz.selectAnswer(' + idx + ')">';
      html += '<span class="rof-quiz-option-letter">' + letters[idx] + '</span>';
      html += '<span class="rof-quiz-option-text">' + T4.utils.escapeHTML(opt.text) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    /* Container para explicacao (modo estudo) */
    html += '<div id="rof-quiz-explanation-container"></div>';

    /* Botao proximo (aparece apos responder) */
    html += '<div id="rof-quiz-next-container" style="display:none;">';
    html += '<button class="t4-btn t4-btn-primary t4-btn-block t4-btn-lg" onclick="ROFQuiz.nextQuestion()">';
    html += currentIndex < questions.length - 1 ? 'Proxima Pergunta' : 'Ver Resultado';
    html += '</button>';
    html += '</div>';

    content.innerHTML = html;
  }

  /* === SELECIONAR RESPOSTA === */
  function selectAnswer(index) {
    const q = questions[currentIndex];
    const options = document.querySelectorAll('.rof-quiz-option');

    /* Verificar se ja respondeu */
    if (options[0].classList.contains('disabled')) return;

    const isCorrect = index === q.correctIndex;

    /* Registrar resposta */
    answers.push({
      questionIndex: currentIndex,
      selectedIndex: index,
      correctIndex: q.correctIndex,
      isCorrect: isCorrect,
      articleId: q.articleId
    });

    /* Registrar artigo errado para priorizacao futura */
    if (!isCorrect) {
      wrongArticleCounts[q.articleId] = (wrongArticleCounts[q.articleId] || 0) + 1;
      T4.storage.local.set(WRONG_KEY, wrongArticleCounts);
    }

    /* Visual feedback */
    options.forEach((opt, idx) => {
      opt.classList.add('disabled');

      if (idx === q.correctIndex) {
        opt.classList.add('correct');
      }
      if (idx === index && !isCorrect) {
        opt.classList.add('wrong');
      }
      if (idx === index && isCorrect) {
        opt.classList.add('correct');
      }
    });

    /* Vibrar */
    T4.utils.vibrate(isCorrect ? 10 : [30, 20, 30]);

    /* Mostrar explicacao (modo estudo) */
    if (mode === 'study') {
      const expContainer = document.getElementById('rof-quiz-explanation-container');
      expContainer.innerHTML =
        '<div class="rof-quiz-explanation">' +
        '<div class="rof-quiz-explanation-title">' + (isCorrect ? '✓ Correto!' : '✕ Incorreto') + '</div>' +
        '<div class="rof-quiz-explanation-text">' + T4.utils.escapeHTML(q.explanation) + '</div>' +
        '</div>';
    }

    /* Mostrar botao proximo */
    document.getElementById('rof-quiz-next-container').style.display = 'block';

    /* No modo prova, auto-avanca apos 1.5s */
    if (mode === 'test') {
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  }

  /* === PROXIMA PERGUNTA === */
  function nextQuestion() {
    currentIndex++;
    renderQuestion();
    window.scrollTo(0, 0);
  }

  /* === TIMER === */
  function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        stopTimer();
        finishQuiz();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const container = document.getElementById('rof-quiz-timer-container');
    if (!container) return;

    if (mode !== 'test') {
      container.innerHTML = '';
      return;
    }

    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    const timerClass = timeRemaining <= 60 ? 'rof-quiz-timer warning' : 'rof-quiz-timer';

    container.innerHTML = '<span class="' + timerClass + '">' +
      String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') +
      '</span>';
  }

  /* === FINALIZAR QUIZ === */
  function finishQuiz() {
    stopTimer();

    const correct = answers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const answered = answers.length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    /* Salvar resultado */
    const result = {
      mode: mode,
      correct: correct,
      total: total,
      answered: answered,
      percentage: percentage,
      date: Date.now()
    };

    scores.push(result);
    if (scores.length > 50) {
      scores = scores.slice(-50);
    }
    T4.storage.local.set(SCORES_KEY, scores);

    /* Salvar no IndexedDB */
    T4.storage.put('efvm360_scores', {
      id: 'rof_quiz_' + T4.utils.uid(),
      module: 'rof',
      ...result,
      type: 'quiz_result'
    }).catch(() => {});

    /* Renderizar resultado */
    renderResult(result);
  }

  /* === RENDERIZAR RESULTADO === */
  function renderResult(result) {
    const content = document.getElementById('rof-quiz-content');
    const timerContainer = document.getElementById('rof-quiz-timer-container');
    timerContainer.innerHTML = '';

    /* Determinar mensagem */
    let message;
    if (result.percentage >= 90) message = 'Excelente! Dominio completo!';
    else if (result.percentage >= 70) message = 'Muito bom! Continue assim!';
    else if (result.percentage >= 50) message = 'Bom, mas pode melhorar.';
    else message = 'Precisa revisar os artigos.';

    let html = '';

    html += '<div class="rof-quiz-result">';

    html += '<div class="rof-quiz-result-score">' + result.percentage + '%</div>';
    html += '<div class="rof-quiz-result-label">' + message + '</div>';

    html += '<div class="rof-quiz-result-stats">';

    html += '<div class="rof-quiz-result-stat">';
    html += '<div class="rof-quiz-result-stat-value correct-val">' + result.correct + '</div>';
    html += '<div class="rof-quiz-result-stat-label">Corretas</div>';
    html += '</div>';

    html += '<div class="rof-quiz-result-stat">';
    html += '<div class="rof-quiz-result-stat-value wrong-val">' + (result.answered - result.correct) + '</div>';
    html += '<div class="rof-quiz-result-stat-label">Erradas</div>';
    html += '</div>';

    html += '<div class="rof-quiz-result-stat">';
    html += '<div class="rof-quiz-result-stat-value">' + result.answered + '</div>';
    html += '<div class="rof-quiz-result-stat-label">Respondidas</div>';
    html += '</div>';

    html += '</div>';

    /* Botoes */
    html += '<div style="display:flex; gap: var(--t4-space-sm); margin-bottom: var(--t4-space-xl);">';
    html += '<button class="t4-btn t4-btn-secondary" style="flex:1;" onclick="ROFQuiz.renderModeSelection()">Novo Quiz</button>';
    html += '<button class="t4-btn t4-btn-primary" style="flex:1;" onclick="ROFApp.showScreen(\'home\')">Inicio</button>';
    html += '</div>';

    html += '</div>';

    /* Revisao dos erros */
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    if (wrongAnswers.length > 0) {
      html += '<div class="rof-quiz-review">';
      html += '<div class="rof-quiz-review-title">Revisao dos Erros</div>';

      wrongAnswers.forEach(wa => {
        const q = questions[wa.questionIndex];
        const article = ROFSearch.getArticleById(q.articleId);

        html += '<div class="rof-quiz-review-item" onclick="ROFViewer.showArticle(\'' + q.articleId + '\', \'quiz\')" style="cursor:pointer;">';
        html += '<div class="rof-quiz-review-item-q">' + T4.utils.escapeHTML(q.question) + '</div>';
        html += '<div class="rof-quiz-review-item-a">Resposta: ' + T4.utils.escapeHTML(q.options[q.correctIndex].text) + '</div>';
        if (article) {
          html += '<div style="font-size:0.6875rem; color: var(--t4-text-muted); margin-top:4px;">Toque para ver o ' + article.number + '</div>';
        }
        html += '</div>';
      });

      html += '</div>';
    }

    content.innerHTML = html;
    window.scrollTo(0, 0);
  }

  /* === SAIR DO QUIZ === */
  function exitQuiz() {
    if (questions.length > 0 && currentIndex < questions.length && answers.length > 0) {
      T4.notifications.confirm('Sair do quiz? Seu progresso sera perdido.', {
        title: 'Sair do Quiz',
        confirmText: 'Sair',
        cancelText: 'Continuar'
      }).then(confirmed => {
        if (confirmed) {
          stopTimer();
          questions = [];
          currentIndex = 0;
          answers = [];
          ROFApp.showScreen('home');
        }
      });
    } else {
      stopTimer();
      questions = [];
      currentIndex = 0;
      answers = [];
      ROFApp.showScreen('home');
    }
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
    startQuiz,
    selectAnswer,
    nextQuestion,
    exitQuiz,
    renderModeSelection
  };
})();
