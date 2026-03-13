/* ============================================
   HUB DASHBOARD — Lógica principal do Hub Central
   Renderiza módulos, status e saudação
   ============================================ */

const HubDashboard = (function () {
  /* Definição dos módulos do ecossistema */
  const MODULES = [
    {
      id: 'efvm360',
      name: 'EFVM 360',
      desc: 'Simulador Ferroviário',
      icon: '\u{1F682}',
      accent: '#a855f7',
      type: 'internal'
    },
    {
      id: 'ccq',
      name: 'CCQ',
      desc: 'Círculo de Qualidade',
      icon: '\u{1F4CA}',
      accent: '#f472b6',
      type: 'internal'
    },
    {
      id: 'rof-digital',
      name: 'ROF Digital',
      desc: 'Regulamento Operacional',
      icon: '\u{1F4CB}',
      accent: '#ffc72b',
      type: 'internal'
    },
    {
      id: 'adamboot',
      name: 'AdamBoot',
      desc: 'Assistente IA',
      icon: '\u{1F916}',
      accent: '#34d399',
      type: 'internal'
    },
    {
      id: 'optima',
      name: 'OPTIMA',
      desc: 'Alocação de Equipagem',
      icon: '\u2699\uFE0F',
      accent: '#2b8aff',
      type: 'external',
      url: 'https://optima.vale.com'
    },
    {
      id: 'vfz',
      name: 'VFZ',
      desc: 'Passagem de Serviço',
      icon: '\u{1F4DD}',
      accent: '#2bff6b',
      type: 'external',
      url: 'https://vfz.vale.com'
    }
  ];

  /* Renderiza a saudação contextual */
  function renderGreeting(user) {
    const hour = new Date().getHours();
    let greeting;
    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    const firstName = user.nome.split(' ')[0];
    const container = T4.dom.$('#hub-greeting');
    if (!container) return;

    const turno = T4.context.getCurrentTurno();
    const dateStr = T4.utils.formatDate(new Date(), 'long');

    container.innerHTML = `
      <div class="hub-greeting">${greeting}, ${T4.utils.escapeHTML(firstName)}</div>
      <div class="hub-greeting-sub">${dateStr} &mdash; Turno <strong>${turno}</strong></div>
    `;
  }

  /* Renderiza chips de status */
  function renderStatusBar(user) {
    const container = T4.dom.$('#hub-status-bar');
    if (!container) return;

    const online = T4.utils.isOnline();
    const context = T4.context.get();
    const patio = user.patio || context.patio || '---';
    const trem = context.trem || '---';

    container.innerHTML = `
      <div class="hub-status-chip ${online ? 'hub-status-chip--online' : 'hub-status-chip--offline'}">
        <span class="hub-status-dot"></span>
        ${online ? 'Online' : 'Offline'}
      </div>
      <div class="hub-status-chip hub-status-chip--info">
        Pátio: ${T4.utils.escapeHTML(patio)}
      </div>
      <div class="hub-status-chip hub-status-chip--warning">
        Trem: ${T4.utils.escapeHTML(trem)}
      </div>
    `;

    /* Escuta mudanças de conectividade */
    T4.events.on('connectivity', function (data) {
      const chip = container.querySelector('.hub-status-chip:first-child');
      if (chip) {
        chip.className = 'hub-status-chip ' + (data.online ? 'hub-status-chip--online' : 'hub-status-chip--offline');
        chip.innerHTML = `<span class="hub-status-dot"></span>${data.online ? 'Online' : 'Offline'}`;
      }
    });
  }

  /* Renderiza header com branding e avatar */
  function renderHeader(user) {
    const container = T4.dom.$('#hub-header');
    if (!container) return;

    const turno = T4.context.getCurrentTurno();

    container.innerHTML = `
      <div class="hub-brand">
        <div class="hub-brand-title">T4</div>
        <div class="hub-brand-subtitle">TRILHO 4.0</div>
      </div>
      <div class="hub-user-area">
        <div class="hub-user-info">
          <div class="hub-user-name">${T4.utils.escapeHTML(user.nome)}</div>
          <div class="hub-user-shift">Turno <span>${turno}</span></div>
        </div>
        <div class="t4-avatar" aria-label="Avatar do usuário">
          ${T4.utils.escapeHTML(user.avatar)}
        </div>
      </div>
    `;
  }

  /* Renderiza grid de módulos */
  function renderModules() {
    const container = T4.dom.$('#hub-modules-grid');
    if (!container) return;

    container.innerHTML = MODULES.map(function (mod, index) {
      var externalBadge = mod.type === 'external'
        ? '<span class="hub-module-external" aria-label="Link externo">\u2197</span>'
        : '';

      return '<div class="hub-module-card t4-fadeUp t4-fadeUp-' + (index + 1) + '"' +
        ' style="--module-accent: ' + mod.accent + '"' +
        ' data-module="' + mod.id + '"' +
        ' data-type="' + mod.type + '"' +
        (mod.url ? ' data-url="' + mod.url + '"' : '') +
        ' role="button"' +
        ' tabindex="0"' +
        ' aria-label="Abrir ' + mod.name + ' — ' + mod.desc + '">' +
        externalBadge +
        '<div class="hub-module-icon" style="background: ' + mod.accent + '18; color: ' + mod.accent + '">' +
          mod.icon +
        '</div>' +
        '<div>' +
          '<div class="hub-module-name">' + mod.name + '</div>' +
          '<div class="hub-module-desc">' + mod.desc + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    /* Bind de clique nos cards */
    T4.dom.$$('.hub-module-card', container).forEach(function (card) {
      function handleActivate() {
        T4.utils.vibrate(10);
        var moduleId = card.getAttribute('data-module');
        var type = card.getAttribute('data-type');
        var url = card.getAttribute('data-url');

        if (type === 'external' && url) {
          T4.router.openExternal(url);
        } else {
          T4.router.navigate(moduleId);
        }
      }

      card.addEventListener('click', handleActivate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      });
    });
  }

  /* Inicializa o dashboard */
  function init() {
    var user = T4.auth.getUser();
    if (!user) return;

    renderHeader(user);
    renderGreeting(user);
    renderStatusBar(user);
    renderModules();
  }

  return { init: init, renderStatusBar: renderStatusBar };
})();
