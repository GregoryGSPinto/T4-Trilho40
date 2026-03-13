(function () {
  'use strict';

  /* ======= CONSTANTS ======= */
  var STORAGE_ATIVA = 't4-jornada-ativa';
  var STORAGE_HISTORICO = 't4-jornada-historico';

  var HOUR_MS = 3600000;
  var MINUTE_MS = 60000;
  var SECOND_MS = 1000;

  var MILESTONES = [
    { key: 'atencao', horas: 10, label: 'Atenção',  icon: '⚠️', msg: 'Você atingiu 10 horas de jornada. Fique atento ao tempo restante.' },
    { key: 'alerta',  horas: 11, label: 'Alerta',   icon: '🔴', msg: 'Jornada com 11 horas. Apenas 1 hora restante para o limite.' },
    { key: 'critico', horas: 11.5, label: 'Crítico', icon: '🚨', msg: 'Jornada com 11h30. Apenas 30 minutos restantes!' },
    { key: 'excedido', horas: 12, label: 'Limite',   icon: '⛔', msg: 'JORNADA EXCEDEU O LIMITE DE 12 HORAS!' }
  ];

  var VIBRATION_PATTERNS = {
    atencao: [200, 100, 200],
    alerta: [300, 100, 300, 100, 300],
    critico: [500, 200, 500, 200, 500],
    excedido: [1000, 200, 1000, 200, 1000, 200, 1000]
  };

  /* ======= STATE ======= */
  var container = document.getElementById('tj-container');
  var tickInterval = null;
  var alertQueue = [];

  /* ======= BACK BUTTON ======= */
  document.getElementById('tj-back').addEventListener('click', function () {
    window.location.href = '../../';
  });

  /* ======= UTILS ======= */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatHMS(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.floor(ms / SECOND_MS);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  function formatHM(ms) {
    if (ms < 0) ms = 0;
    var totalMin = Math.floor(ms / MINUTE_MS);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    return h + 'h' + pad(m);
  }

  function formatTimeOfDay(isoStr) {
    var d = new Date(isoStr);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDateBR(isoStr) {
    var d = new Date(isoStr);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function now() {
    return Date.now();
  }

  /* ======= STORAGE ======= */
  function getAtiva() {
    try {
      var raw = localStorage.getItem(STORAGE_ATIVA);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.ativa) return null;
      return data;
    } catch (e) { return null; }
  }

  function saveAtiva(data) {
    localStorage.setItem(STORAGE_ATIVA, JSON.stringify(data));
  }

  function clearAtiva() {
    localStorage.removeItem(STORAGE_ATIVA);
  }

  function getHistorico() {
    try {
      var raw = localStorage.getItem(STORAGE_HISTORICO);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHistorico(list) {
    localStorage.setItem(STORAGE_HISTORICO, JSON.stringify(list));
  }

  function addToHistorico(entry) {
    var list = getHistorico();
    list.unshift(entry);
    if (list.length > 30) list = list.slice(0, 30);
    saveHistorico(list);
  }

  /* ======= SEED DEMO DATA ======= */
  function seedDemoData() {
    var hist = getHistorico();
    if (hist.length > 0) return;

    var today = new Date();
    var demos = [
      {
        inicio: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 6, 0).toISOString(),
        fim: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 16, 45).toISOString(),
        duracaoMs: 10 * HOUR_MS + 45 * MINUTE_MS,
        intrajornadaMs: 1 * HOUR_MS + 15 * MINUTE_MS
      },
      {
        inicio: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 18, 0).toISOString(),
        fim: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 4, 30).toISOString(),
        duracaoMs: 10 * HOUR_MS + 30 * MINUTE_MS,
        intrajornadaMs: 45 * MINUTE_MS
      },
      {
        inicio: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5, 7, 30).toISOString(),
        fim: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5, 19, 0).toISOString(),
        duracaoMs: 11 * HOUR_MS + 30 * MINUTE_MS,
        intrajornadaMs: 30 * MINUTE_MS
      }
    ];

    saveHistorico(demos);
  }

  /* ======= ELAPSED CALCULATION ======= */
  function calcElapsed(jornada) {
    var inicio = new Date(jornada.inicio).getTime();
    var elapsed = now() - inicio;
    return Math.max(0, elapsed);
  }

  function calcIntraTotal(jornada) {
    var total = 0;
    if (!jornada.intrajornadas) return 0;
    for (var i = 0; i < jornada.intrajornadas.length; i++) {
      var intra = jornada.intrajornadas[i];
      if (intra.fim) {
        total += new Date(intra.fim).getTime() - new Date(intra.inicio).getTime();
      } else {
        total += now() - new Date(intra.inicio).getTime();
      }
    }
    return total;
  }

  function isIntraActive(jornada) {
    if (!jornada.intrajornadas || jornada.intrajornadas.length === 0) return false;
    var last = jornada.intrajornadas[jornada.intrajornadas.length - 1];
    return !last.fim;
  }

  function currentIntraElapsed(jornada) {
    if (!isIntraActive(jornada)) return 0;
    var last = jornada.intrajornadas[jornada.intrajornadas.length - 1];
    return now() - new Date(last.inicio).getTime();
  }

  /* ======= PHASE DETECTION ======= */
  function getPhase(elapsedMs) {
    var hours = elapsedMs / HOUR_MS;
    if (hours >= 12) return 'excedido';
    if (hours >= 11.5) return 'critico';
    if (hours >= 11) return 'alerta';
    if (hours >= 10) return 'atencao';
    return 'normal';
  }

  function getProgressFillClass(phase) {
    return 'tj-fill-' + phase;
  }

  /* ======= ALERT SYSTEM ======= */
  function checkAlerts(jornada, elapsedMs) {
    var hours = elapsedMs / HOUR_MS;
    if (!jornada.alertasVistos) jornada.alertasVistos = [];

    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (hours >= m.horas && jornada.alertasVistos.indexOf(m.key) === -1) {
        jornada.alertasVistos.push(m.key);
        saveAtiva(jornada);
        showAlert(m, elapsedMs);
      }
    }
  }

  function showAlert(milestone, elapsedMs) {
    // Vibrate
    if (navigator.vibrate && VIBRATION_PATTERNS[milestone.key]) {
      navigator.vibrate(VIBRATION_PATTERNS[milestone.key]);
    }

    var overlay = document.createElement('div');
    overlay.className = 'tj-alert-overlay';
    overlay.innerHTML =
      '<div class="tj-alert-backdrop"></div>' +
      '<div class="tj-alert-content tj-alert-' + milestone.key + '">' +
        '<div class="tj-alert-icon">' + milestone.icon + '</div>' +
        '<div class="tj-alert-title">' + milestone.label + '</div>' +
        '<div class="tj-alert-msg">' + milestone.msg + '</div>' +
        '<div class="tj-alert-time">' + formatHMS(elapsedMs) + '</div>' +
        '<button class="tj-alert-dismiss" id="tj-dismiss-alert">Entendi</button>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#tj-dismiss-alert').addEventListener('click', function () {
      overlay.remove();
    });
  }

  /* ======= CONFIRM DIALOG ======= */
  function showConfirm(title, bodyHtml, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'tj-confirm-overlay';
    overlay.innerHTML =
      '<div class="tj-alert-backdrop"></div>' +
      '<div class="tj-confirm-content">' +
        '<div class="tj-confirm-title">' + title + '</div>' +
        '<div class="tj-confirm-body">' + bodyHtml + '</div>' +
        '<div class="tj-confirm-btns">' +
          '<button class="tj-confirm-btn tj-confirm-btn-cancel" id="tj-confirm-cancel">Cancelar</button>' +
          '<button class="tj-confirm-btn tj-confirm-btn-ok" id="tj-confirm-ok">Encerrar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#tj-confirm-cancel').addEventListener('click', function () {
      overlay.remove();
    });

    overlay.querySelector('#tj-confirm-ok').addEventListener('click', function () {
      overlay.remove();
      onConfirm();
    });
  }

  /* ======= ACTIONS ======= */
  function iniciarJornada() {
    var data = {
      ativa: true,
      inicio: new Date().toISOString(),
      intrajornadas: [],
      alertasVistos: []
    };
    saveAtiva(data);
    startTick();
    render();
  }

  function encerrarJornada() {
    var jornada = getAtiva();
    if (!jornada) return;

    var elapsed = calcElapsed(jornada);
    var intraTotal = calcIntraTotal(jornada);

    var bodyHtml =
      'Tempo total: <strong>' + formatHM(elapsed) + '</strong><br>' +
      'Intrajornada: <strong>' + formatHM(intraTotal) + '</strong>';

    showConfirm('Encerrar Jornada?', bodyHtml, function () {
      // Close any active intrajornada
      if (isIntraActive(jornada)) {
        var last = jornada.intrajornadas[jornada.intrajornadas.length - 1];
        last.fim = new Date().toISOString();
      }

      var entry = {
        inicio: jornada.inicio,
        fim: new Date().toISOString(),
        duracaoMs: elapsed,
        intrajornadaMs: calcIntraTotal(jornada)
      };

      addToHistorico(entry);
      clearAtiva();
      stopTick();
      render();
    });
  }

  function toggleIntra() {
    var jornada = getAtiva();
    if (!jornada) return;

    if (!jornada.intrajornadas) jornada.intrajornadas = [];

    if (isIntraActive(jornada)) {
      var last = jornada.intrajornadas[jornada.intrajornadas.length - 1];
      last.fim = new Date().toISOString();
    } else {
      jornada.intrajornadas.push({
        inicio: new Date().toISOString(),
        fim: null
      });
    }

    saveAtiva(jornada);
    render();
  }

  /* ======= TICK ======= */
  function startTick() {
    stopTick();
    tickInterval = setInterval(function () {
      var jornada = getAtiva();
      if (!jornada) {
        stopTick();
        render();
        return;
      }
      var elapsed = calcElapsed(jornada);
      checkAlerts(jornada, elapsed);
      updateTimerDisplay(jornada, elapsed);
    }, SECOND_MS);
  }

  function stopTick() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  /* ======= FAST UI UPDATE (no full re-render) ======= */
  function updateTimerDisplay(jornada, elapsed) {
    var timerEl = document.getElementById('tj-timer-value');
    var progressEl = document.getElementById('tj-progress-fill');
    var progressTextEl = document.getElementById('tj-progress-text');
    var progressPercentEl = document.getElementById('tj-progress-percent');
    var sectionEl = document.getElementById('tj-timer-section');
    var intraActiveEl = document.getElementById('tj-intra-active-time');
    var intraTotalEl = document.getElementById('tj-intra-total');

    if (!timerEl) return;

    // Timer value
    timerEl.textContent = formatHMS(elapsed);

    // Phase class
    var phase = getPhase(elapsed);
    if (sectionEl) {
      sectionEl.className = 'tj-timer-section tj-phase-' + phase;
    }

    // Progress
    var percent = Math.min(100, (elapsed / (12 * HOUR_MS)) * 100);
    if (progressEl) {
      progressEl.style.width = percent.toFixed(2) + '%';
      progressEl.className = 'tj-progress-fill ' + getProgressFillClass(phase);
    }
    if (progressTextEl) {
      progressTextEl.textContent = formatHM(elapsed) + ' de 12h';
    }
    if (progressPercentEl) {
      progressPercentEl.textContent = Math.floor(percent) + '%';
    }

    // Excedida banner
    var bannerEl = document.getElementById('tj-excedida-banner');
    if (phase === 'excedido' && !bannerEl) {
      // Will be shown on next full render
    }

    // Intrajornada active time
    if (intraActiveEl && isIntraActive(jornada)) {
      intraActiveEl.textContent = formatHMS(currentIntraElapsed(jornada));
    }
    if (intraTotalEl) {
      intraTotalEl.textContent = 'Total intrajornada: ' + formatHM(calcIntraTotal(jornada));
    }

    // Milestone cards remaining time
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      var subEl = document.getElementById('tj-ms-sub-' + m.key);
      if (subEl) {
        var msTarget = m.horas * HOUR_MS;
        if (elapsed >= msTarget) {
          subEl.textContent = 'Atingido';
        } else {
          var remaining = msTarget - elapsed;
          subEl.textContent = 'Em ' + formatHM(remaining);
        }
      }
    }
  }

  /* ======= RENDER ======= */
  function render() {
    var jornada = getAtiva();
    var html = '';

    if (jornada) {
      html = renderActive(jornada);
    } else {
      html = renderIdle();
    }

    html += renderHistory();
    container.innerHTML = html;
    bindEvents(jornada);

    if (jornada) {
      var elapsed = calcElapsed(jornada);
      updateTimerDisplay(jornada, elapsed);
      checkAlerts(jornada, elapsed);
    }
  }

  function renderActive(jornada) {
    var elapsed = calcElapsed(jornada);
    var phase = getPhase(elapsed);
    var percent = Math.min(100, (elapsed / (12 * HOUR_MS)) * 100);
    var intraTotal = calcIntraTotal(jornada);
    var intraActive = isIntraActive(jornada);

    var html = '';

    // Excedida banner
    if (phase === 'excedido') {
      html += '<div class="tj-excedida-banner" id="tj-excedida-banner">JORNADA EXCEDIDA</div>';
    }

    // Timer
    html += '<div class="tj-timer-section tj-phase-' + phase + '" id="tj-timer-section">';
    html += '  <div class="tj-timer-label">Tempo de Jornada</div>';
    html += '  <div class="tj-timer-display" id="tj-timer-value">' + formatHMS(elapsed) + '</div>';
    html += '  <div class="tj-timer-inicio">Jornada iniciada às ' + formatTimeOfDay(jornada.inicio) + '</div>';
    html += '</div>';

    // Progress
    html += '<div class="tj-progress-section">';
    html += '  <div class="tj-progress-info">';
    html += '    <span class="tj-progress-text" id="tj-progress-text">' + formatHM(elapsed) + ' de 12h</span>';
    html += '    <span class="tj-progress-percent" id="tj-progress-percent">' + Math.floor(percent) + '%</span>';
    html += '  </div>';
    html += '  <div class="tj-progress-track">';
    html += '    <div class="tj-progress-fill ' + getProgressFillClass(phase) + '" id="tj-progress-fill" style="width:' + percent.toFixed(2) + '%"></div>';
    html += '  </div>';
    html += '  <div class="tj-progress-markers">';
    html += '    <span class="tj-progress-marker" style="left:83.33%">10h</span>';
    html += '    <span class="tj-progress-marker" style="left:91.67%">11h</span>';
    html += '    <span class="tj-progress-marker" style="left:100%">12h</span>';
    html += '  </div>';
    html += '</div>';

    // Milestones
    html += '<div class="tj-milestones-title">Marcos da Jornada</div>';
    html += '<div class="tj-milestones-grid">';

    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      var reached = elapsed >= m.horas * HOUR_MS;
      var msClass = 'tj-milestone-' + m.key;
      var remaining = m.horas * HOUR_MS - elapsed;
      var subText = reached ? 'Atingido' : 'Em ' + formatHM(remaining);
      var hoursLabel = m.horas % 1 === 0 ? m.horas + 'h' : Math.floor(m.horas) + 'h30';

      html += '<div class="tj-milestone-card ' + msClass + (reached ? ' tj-milestone-reached' : '') + '">';
      html += '  <div class="tj-milestone-icon">' + m.icon + '</div>';
      html += '  <div class="tj-milestone-label">' + m.label + '</div>';
      html += '  <div class="tj-milestone-time">' + hoursLabel + '</div>';
      html += '  <div class="tj-milestone-sub" id="tj-ms-sub-' + m.key + '">' + subText + '</div>';
      html += '</div>';
    }

    html += '</div>';

    // Intrajornada
    html += '<div class="tj-intra-section">';
    html += '  <div class="tj-intra-header">';
    html += '    <span class="tj-intra-title">Intrajornada</span>';
    if (intraActive) {
      html += '    <span class="tj-intra-badge">Em andamento</span>';
    }
    html += '  </div>';
    html += '  <div class="tj-intra-total" id="tj-intra-total">Total intrajornada: ' + formatHM(intraTotal) + '</div>';

    if (intraActive) {
      html += '  <div class="tj-intra-active" id="tj-intra-active-time">' + formatHMS(currentIntraElapsed(jornada)) + '</div>';
    }

    if (intraActive) {
      html += '  <button class="tj-intra-btn tj-intra-btn-stop" id="tj-intra-toggle">Encerrar Intrajornada</button>';
    } else {
      html += '  <button class="tj-intra-btn tj-intra-btn-start" id="tj-intra-toggle">Iniciar Intrajornada</button>';
    }

    // List past intrajornadas
    if (jornada.intrajornadas && jornada.intrajornadas.length > 0) {
      var completedIntras = [];
      for (var j = 0; j < jornada.intrajornadas.length; j++) {
        if (jornada.intrajornadas[j].fim) completedIntras.push(jornada.intrajornadas[j]);
      }
      if (completedIntras.length > 0) {
        html += '  <div class="tj-intra-list">';
        for (var k = 0; k < completedIntras.length; k++) {
          var intra = completedIntras[k];
          var dur = new Date(intra.fim).getTime() - new Date(intra.inicio).getTime();
          html += '  <div class="tj-intra-item">';
          html += '    <span>' + formatTimeOfDay(intra.inicio) + ' - ' + formatTimeOfDay(intra.fim) + '</span>';
          html += '    <span class="tj-intra-item-time">' + formatHM(dur) + '</span>';
          html += '  </div>';
        }
        html += '  </div>';
      }
    }

    html += '</div>';

    // Encerrar button
    html += '<div class="tj-controls">';
    html += '  <button class="tj-btn-encerrar" id="tj-btn-encerrar">';
    html += '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>';
    html += '    Encerrar Jornada';
    html += '  </button>';
    html += '</div>';

    return html;
  }

  function renderIdle() {
    var html = '';

    html += '<div class="tj-idle-hero">';
    html += '  <div class="tj-idle-icon">🚂</div>';
    html += '  <div class="tj-idle-text">Nenhuma jornada ativa. Inicie o timer ao começar sua jornada na EFVM.</div>';
    html += '</div>';

    html += '<div class="tj-controls">';
    html += '  <button class="tj-btn-iniciar" id="tj-btn-iniciar">';
    html += '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    html += '    Iniciar Jornada';
    html += '  </button>';
    html += '</div>';

    return html;
  }

  function renderHistory() {
    var historico = getHistorico();
    var html = '';

    html += '<div class="tj-divider"></div>';
    html += '<div class="tj-history-section">';
    html += '  <div class="tj-history-title">Histórico Recente</div>';

    if (historico.length === 0) {
      html += '  <div class="tj-history-empty">Nenhum registro encontrado</div>';
    } else {
      var show = Math.min(historico.length, 10);
      for (var i = 0; i < show; i++) {
        var entry = historico[i];
        var durHours = entry.duracaoMs / HOUR_MS;
        var durClass = 'tj-dur-ok';
        if (durHours >= 11) durClass = 'tj-dur-danger';
        else if (durHours >= 10) durClass = 'tj-dur-warn';

        html += '  <div class="tj-history-card">';
        html += '    <div class="tj-history-date">' + formatDateBR(entry.inicio) + '</div>';
        html += '    <div class="tj-history-row">';
        html += '      <span class="tj-history-times">' + formatTimeOfDay(entry.inicio) + ' → ' + formatTimeOfDay(entry.fim) + '</span>';
        html += '      <span class="tj-history-duration ' + durClass + '">' + formatHM(entry.duracaoMs) + '</span>';
        html += '    </div>';
        if (entry.intrajornadaMs && entry.intrajornadaMs > 0) {
          html += '    <div class="tj-history-intra">Intrajornada: ' + formatHM(entry.intrajornadaMs) + '</div>';
        }
        html += '  </div>';
      }
    }

    html += '</div>';
    return html;
  }

  /* ======= BIND EVENTS ======= */
  function bindEvents(jornada) {
    var btnIniciar = document.getElementById('tj-btn-iniciar');
    var btnEncerrar = document.getElementById('tj-btn-encerrar');
    var btnIntra = document.getElementById('tj-intra-toggle');

    if (btnIniciar) {
      btnIniciar.addEventListener('click', iniciarJornada);
    }

    if (btnEncerrar) {
      btnEncerrar.addEventListener('click', encerrarJornada);
    }

    if (btnIntra) {
      btnIntra.addEventListener('click', toggleIntra);
    }
  }

  /* ======= INIT ======= */
  function init() {
    seedDemoData();

    var jornada = getAtiva();
    if (jornada) {
      startTick();
    }

    render();
  }

  init();
})();
