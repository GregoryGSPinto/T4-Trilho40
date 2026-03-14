(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  function showDashboard() {
    var dashboard = document.getElementById('hub-dashboard');
    var loginScreen = document.getElementById('login-screen');
    loginScreen.setAttribute('hidden', '');
    loginScreen.style.display = 'none';
    dashboard.removeAttribute('hidden');
    dashboard.style.display = '';

    var user = T4.auth.getUser();
    if (!user) return;

    var config = T4Shell.config.T4Config.load();

    // Cockpit header
    document.getElementById('hub-user-avatar').textContent = user.avatar || user.nome.substring(0, 2).toUpperCase();
    document.getElementById('hub-user-name').textContent = user.nome;
    document.getElementById('hub-yard-tag').textContent = config.patio || user.patio || 'N/A';

    // Status row
    var turnoEl = document.getElementById('hub-status-turno');
    if (turnoEl) turnoEl.textContent = config.turno || 'A';

    // Online/offline status
    function updateHubOnline() {
      var el = document.getElementById('hub-status-online');
      if (el) el.innerHTML = navigator.onLine
        ? '<span class="hub-status-dot"></span> Online'
        : '<span class="hub-status-dot hub-status-dot--off"></span> Offline';
    }
    updateHubOnline();
    window.addEventListener('online', updateHubOnline);
    window.addEventListener('offline', updateHubOnline);

    // Clock
    function updateClock() {
      var now = new Date();
      document.getElementById('hub-clock').textContent =
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    updateClock();
    setInterval(updateClock, 30000);

    // ===== Operational Panel (Jornada) =====
    function renderOpsPanel() {
      var panel = document.getElementById('hub-ops-panel');
      if (!panel) return;
      try {
        var jornada = JSON.parse(localStorage.getItem('t4-jornada-ativa'));
        if (jornada && jornada.ativa) {
          var elapsed = Date.now() - new Date(jornada.inicio).getTime();
          var hours = Math.floor(elapsed / 3600000);
          var mins = Math.floor((elapsed % 3600000) / 60000);
          var totalMins = hours * 60 + mins;
          var maxMins = 12 * 60;
          var pct = Math.min(100, Math.round((totalMins / maxMins) * 100));
          var timeStr = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
          var phaseClass = hours >= 11 ? 'hub-ops-phase--red' : (hours >= 10 ? 'hub-ops-phase--gold' : 'hub-ops-phase--green');

          var inicioDate = new Date(jornada.inicio);
          var inicioStr = String(inicioDate.getHours()).padStart(2, '0') + ':' + String(inicioDate.getMinutes()).padStart(2, '0');

          var nextAlert = '';
          if (hours < 10) nextAlert = 'Prox alerta: 10h';
          else if (hours < 11) nextAlert = 'Prox alerta: 11h';
          else if (hours < 11.5) nextAlert = 'Prox alerta: 11h30';
          else nextAlert = 'LIMITE PROXIMO';

          panel.innerHTML =
            '<div class="hub-ops-card ' + phaseClass + '">' +
              '<div class="hub-ops-top">' +
                '<div class="hub-ops-icon">&#9201;&#65039;</div>' +
                '<div class="hub-ops-title">JORNADA</div>' +
                '<div class="hub-ops-time">' + timeStr + ' / 12:00</div>' +
              '</div>' +
              '<div class="hub-ops-bar-wrap">' +
                '<div class="hub-ops-bar" style="width:' + pct + '%;"></div>' +
              '</div>' +
              '<div class="hub-ops-pct">' + pct + '%</div>' +
              '<div class="hub-ops-info">Inicio: ' + inicioStr + ' &middot; ' + nextAlert + '</div>' +
            '</div>';
        } else {
          panel.innerHTML =
            '<div class="hub-ops-card hub-ops-card--cta" id="hub-ops-cta">' +
              '<div class="hub-ops-icon">&#9201;&#65039;</div>' +
              '<div class="hub-ops-cta-text">' +
                '<div class="hub-ops-title">INICIAR JORNADA</div>' +
                '<div class="hub-ops-info">Nenhuma jornada ativa. Toque para iniciar o timer.</div>' +
              '</div>' +
            '</div>';
          var cta = document.getElementById('hub-ops-cta');
          if (cta) cta.addEventListener('click', function () {
            T4.utils.vibrate(10);
            T4Shell.navigation.openModuleModal('timerJornada');
          });
        }
      } catch (e) {
        panel.innerHTML =
          '<div class="hub-ops-card hub-ops-card--cta" id="hub-ops-cta">' +
            '<div class="hub-ops-icon">&#9201;&#65039;</div>' +
            '<div class="hub-ops-cta-text">' +
              '<div class="hub-ops-title">INICIAR JORNADA</div>' +
              '<div class="hub-ops-info">Nenhuma jornada ativa. Toque para iniciar o timer.</div>' +
            '</div>' +
          '</div>';
      }
    }
    renderOpsPanel();
    setInterval(renderOpsPanel, 30000);

    // ===== Alerts Preview =====
    function renderAlertsPreview() {
      var container = document.getElementById('hub-alerts-preview');
      if (!container) return;
      var alertas = T4Shell.alertas.loadAlertas();
      var unread = alertas.filter(function (a) { return !a.lido; }).slice(0, 3);
      if (!unread.length) {
        container.innerHTML = '<div class="hub-alert-empty">Nenhum aviso recente</div>';
        return;
      }
      var html = '';
      unread.forEach(function (a) {
        var dotColors = { urgente: 'var(--status-danger)', atencao: 'var(--accent-gold)', ok: 'var(--accent-green)', info: 'var(--accent-cyan)' };
        var dotColor = dotColors[a.tipo] || 'var(--text-muted)';
        html += '<div class="hub-alert-item">' +
          '<div class="hub-alert-dot" style="background:' + dotColor + ';"></div>' +
          '<div class="hub-alert-text">' + a.titulo + '</div>' +
        '</div>';
      });
      container.innerHTML = html;
    }
    renderAlertsPreview();

    // ===== Quick Actions =====
    document.querySelectorAll('.hub-qa-btn[data-qa]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        T4.utils.vibrate(10);
        var action = btn.getAttribute('data-qa');
        if (action === 'emergencia') T4Shell.navigation.openModuleModal('contatos');
        else if (action === 'logcco') T4Shell.navigation.openModuleModal('logCco');
        else if (action === 'art') T4Shell.navigation.openModuleModal('art');
        else if (action === 'boajornada') T4Shell.navigation.openModuleModal('boajornada');
      });
    });

    // ===== Ver todos alertas =====
    var verAlertasBtn = document.getElementById('hub-ver-alertas');
    if (verAlertasBtn) {
      verAlertasBtn.addEventListener('click', function () {
        T4.utils.vibrate(10);
        T4Shell.navigation.navigateTo('alertas');
      });
    }

    // App card click handlers (tools + corp grids)
    document.querySelectorAll('.t4-app-card[data-module]').forEach(function (card) {
      card.addEventListener('click', function () {
        T4.utils.vibrate(10);
        T4Shell.navigation.openModuleModal(card.getAttribute('data-module'));
      });
    });

    // FAB
    document.getElementById('hub-fab').addEventListener('click', function () {
      T4.utils.vibrate(10);
      T4.router.navigate('adamboot');
    });

    // Animate cards
    T4.dom.animateList('.hub-tool-card, .hub-corp-card', 40);

    // Init subsystems
    T4Shell.navigation.initNavigation();
    T4Shell.config.initConfig(user);
    T4Shell.alertas.initAlertas();
    T4Shell.busca.initBusca();
    T4Shell.config.applyConfigEffects();
  }

  // Expose on T4Shell.init namespace
  T4Shell.init = {
    showDashboard: showDashboard
  };

  /* ======= INIT T4 ======= */
  var splash = document.getElementById('splash-screen');
  var splashLogo = document.getElementById('splash-logo');
  var splashSubtitle = document.getElementById('splash-subtitle');
  var splashBar = document.getElementById('splash-loader-bar');

  T4.init('hub');

  /* Se ja autenticado, pula splash e vai direto pro Hub */
  if (T4.auth.isAuthenticated()) {
    splash.style.display = 'none';
    showDashboard();
  } else {
    /* Primeira visita ou sessao expirada: mostra splash -> login */
    requestAnimationFrame(function () {
      splashLogo.classList.add('splash-logo-animate');
      setTimeout(function () { splashSubtitle.classList.add('splash-subtitle-animate'); }, 400);
      setTimeout(function () { splashBar.classList.add('splash-bar-animate'); }, 600);
    });

    setTimeout(function () {
      splash.classList.add('splash-fadeout');
      setTimeout(function () { splash.style.display = 'none'; T4Shell.login.showLoginScreen(); }, 500);
    }, 2000);
  }

  /* ======= SERVICE WORKER ======= */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        T4.log.info('[T4] Service Worker registrado:', reg.scope);
      }).catch(function (err) {
        T4.log.warn('[T4] Service Worker nao registrado:', err);
      });
    });
  }

})();
