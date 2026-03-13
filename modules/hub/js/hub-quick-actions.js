/* ============================================
   HUB QUICK ACTIONS — Atalhos rápidos
   Ações comuns acessíveis diretamente do Hub
   ============================================ */

const HubQuickActions = (function () {
  /* Definição dos atalhos rápidos */
  const ACTIONS = [
    {
      id: 'simulador',
      label: 'Iniciar Simulação',
      icon: '\u{1F3AF}',
      handler: function () {
        T4.router.navigate('efvm360');
      }
    },
    {
      id: 'rof-busca',
      label: 'Consultar ROF',
      icon: '\u{1F50D}',
      handler: function () {
        T4.router.navigate('rof-digital', { action: 'search' });
      }
    },
    {
      id: 'adamboot-chat',
      label: 'Perguntar ao Adam',
      icon: '\u{1F4AC}',
      handler: function () {
        T4.router.navigate('adamboot');
      }
    },
    {
      id: 'ccq-novo',
      label: 'Novo Projeto CCQ',
      icon: '\u2795',
      handler: function () {
        T4.router.navigate('ccq', { action: 'new' });
      }
    }
  ];

  /* Renderiza as ações rápidas */
  function render() {
    var container = T4.dom.$('#hub-quick-actions');
    if (!container) return;

    container.innerHTML = ACTIONS.map(function (action) {
      return '<button class="hub-quick-action" data-action="' + action.id + '"' +
        ' aria-label="' + action.label + '">' +
        '<span class="hub-quick-action-icon">' + action.icon + '</span>' +
        '<span>' + action.label + '</span>' +
      '</button>';
    }).join('');

    /* Bind de eventos */
    T4.dom.$$('.hub-quick-action', container).forEach(function (btn) {
      btn.addEventListener('click', function () {
        T4.utils.vibrate(10);
        var actionId = btn.getAttribute('data-action');
        var action = ACTIONS.find(function (a) { return a.id === actionId; });
        if (action && action.handler) {
          action.handler();
        }
      });
    });
  }

  /* Renderiza o botão de logout */
  function renderLogout() {
    var container = T4.dom.$('#hub-logout');
    if (!container) return;

    container.innerHTML = '<button class="hub-logout-btn" aria-label="Sair da conta">' +
      '<span>\u23FB</span>' +
      '<span>Sair</span>' +
    '</button>';

    container.querySelector('.hub-logout-btn').addEventListener('click', function () {
      T4.notifications.confirm('Deseja realmente sair?', {
        title: 'Encerrar sessão',
        confirmText: 'Sair',
        cancelText: 'Cancelar',
        type: 'danger'
      }).then(function (confirmed) {
        if (confirmed) {
          T4.auth.logout();
        }
      });
    });
  }

  function init() {
    render();
    renderLogout();
  }

  return { init: init };
})();
