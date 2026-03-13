(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  var ALERTAS_KEY = 't4-alertas';

  function getDefaultAlertas() {
    var now = Date.now();
    return [
      { id: 1, tipo: 'urgente', titulo: 'BOLL Ativa \u2014 km 342 a 348', desc: 'Restricao de velocidade 30 km/h. Manutencao de via em andamento.', tempo: now - 2 * 3600000, lido: false },
      { id: 2, tipo: 'atencao', titulo: 'Jornada \u2014 10h atingidas', desc: 'Limite de 12h em 2 horas. Planejar encerramento do turno.', tempo: now - 4 * 3600000, lido: false },
      { id: 3, tipo: 'ok', titulo: 'DSS Concluido \u2014 Turno A', desc: 'Dialogo de Seguranca e Saude registrado. Patio VFZ.', tempo: now - 6 * 3600000, lido: false },
      { id: 4, tipo: 'info', titulo: 'Atualizacao ROF Digital', desc: 'Artigo 52 \u2014 Procedimentos de cruzamento. Nova revisao disponivel.', tempo: now - 24 * 3600000, lido: true },
      { id: 5, tipo: 'ok', titulo: 'Simulacao EFVM 360 Completa', desc: 'Cenario: Minerio VFZ\u2192VOD. Score final: 87/100. Ranking: #3 do patio.', tempo: now - 28 * 3600000, lido: true },
      { id: 6, tipo: 'atencao', titulo: 'CCQ \u2014 Prazo do projeto', desc: 'Projeto "Reducao de tempo de manobra" fase Do vence em 3 dias.', tempo: now - 30 * 3600000, lido: true },
      { id: 7, tipo: 'info', titulo: 'AdamBoot \u2014 Nova base de conhecimento', desc: 'Normas de transporte de produtos perigosos atualizadas.', tempo: now - 48 * 3600000, lido: true },
      { id: 8, tipo: 'urgente', titulo: 'Restricao Temporaria \u2014 km 156', desc: 'Passagem de nivel com defeito no km 156. Velocidade maxima 10 km/h. Buzinar.', tempo: now - 50 * 3600000, lido: true }
    ];
  }

  function loadAlertas() {
    try {
      var saved = localStorage.getItem(ALERTAS_KEY);
      return saved ? JSON.parse(saved) : getDefaultAlertas();
    } catch (e) { return getDefaultAlertas(); }
  }

  function saveAlertas(alertas) {
    localStorage.setItem(ALERTAS_KEY, JSON.stringify(alertas));
  }

  function formatTimeAgo(timestamp) {
    var diff = Date.now() - timestamp;
    var mins = Math.floor(diff / 60000);
    if (mins < 60) return 'Ha ' + mins + ' min';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return 'Ha ' + hours + 'h';
    var days = Math.floor(hours / 24);
    return 'Ha ' + days + ' dia' + (days > 1 ? 's' : '');
  }

  function updateAlertBadge(alertas) {
    if (!alertas) alertas = loadAlertas();
    var unread = alertas.filter(function (a) { return !a.lido; }).length;
    var badge = document.getElementById('alertBadge');
    if (unread > 0) {
      badge.textContent = unread;
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  function renderAlertas(alertas) {
    var list = document.getElementById('alertas-list');
    var empty = document.getElementById('alertas-empty');

    if (!alertas.length) {
      list.innerHTML = '';
      empty.removeAttribute('hidden');
      return;
    }
    empty.setAttribute('hidden', '');

    // Group by day
    var groups = {};
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var yesterday = today - 86400000;

    alertas.forEach(function (a) {
      var label;
      if (a.tempo >= today) label = 'Hoje';
      else if (a.tempo >= yesterday) label = 'Ontem';
      else label = 'Anterior';
      if (!groups[label]) groups[label] = [];
      groups[label].push(a);
    });

    var html = '';
    ['Hoje', 'Ontem', 'Anterior'].forEach(function (label) {
      if (!groups[label]) return;
      html += '<div class="alertas-day-label">' + label + '</div>';
      groups[label].forEach(function (a) {
        var dotColors = { urgente: 'var(--status-danger)', atencao: 'var(--accent-gold)', ok: 'var(--accent-green)', info: 'var(--accent-cyan)' };
        var dotColor = dotColors[a.tipo] || 'var(--text-muted)';
        var opacity = a.lido ? '0.5' : '1';
        var timeAgo = formatTimeAgo(a.tempo);
        html += '<div class="alerta-item" style="opacity:' + opacity + ';" data-alerta-id="' + a.id + '">' +
          '<div class="alerta-dot" style="background:' + dotColor + ';"></div>' +
          '<div class="alerta-content">' +
            '<div class="alerta-titulo">' + a.titulo + '</div>' +
            '<div class="alerta-desc">' + a.desc + '</div>' +
            '<div class="alerta-time">' + timeAgo + '</div>' +
          '</div>' +
          (!a.lido ? '<button class="alerta-mark-read" data-mark-id="' + a.id + '" title="Marcar como lido">&#10003;</button>' : '') +
        '</div>';
      });
    });

    list.innerHTML = html;

    // Mark as read handlers
    list.querySelectorAll('.alerta-mark-read').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-mark-id'));
        var alertas = loadAlertas();
        var al = alertas.find(function (a) { return a.id === id; });
        if (al) { al.lido = true; saveAlertas(alertas); }
        renderAlertas(alertas);
        updateAlertBadge(alertas);
      });
    });
  }

  function initAlertas() {
    var alertas = loadAlertas();
    renderAlertas(alertas);
    updateAlertBadge(alertas);

    // Filter buttons
    document.querySelectorAll('.alertas-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.alertas-filter').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        var alertas = loadAlertas();
        var filtered = filter === 'todos' ? alertas : alertas.filter(function (a) { return a.tipo === filter; });
        renderAlertas(filtered);
      });
    });

    // Clear all
    document.getElementById('alertas-clear-all').addEventListener('click', function () {
      var alertas = loadAlertas();
      alertas.forEach(function (a) { a.lido = true; });
      saveAlertas(alertas);
      renderAlertas(alertas);
      updateAlertBadge(alertas);
    });
  }

  // Expose on T4Shell.alertas namespace
  T4Shell.alertas = {
    loadAlertas: loadAlertas,
    saveAlertas: saveAlertas,
    initAlertas: initAlertas,
    renderAlertas: renderAlertas,
    updateAlertBadge: updateAlertBadge,
    formatTimeAgo: formatTimeAgo,
    getDefaultAlertas: getDefaultAlertas
  };
})();
