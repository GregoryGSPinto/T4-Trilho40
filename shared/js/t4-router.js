/* ============================================
   T4 ROUTER — Navegação entre módulos
   Sistema de roteamento simples para PWA
   ============================================ */

T4.router = (function () {
  const routes = {};
  let currentRoute = null;
  let basePath = '';

  /* Módulos registrados e seus caminhos */
  const MODULES = {
    hub: { path: '/', title: 'T4 — Trilho 4.0', icon: '🏠' },
    efvm360: { path: '/modules/efvm360/', title: 'EFVM 360', icon: '🚂' },
    ccq: { path: '/modules/ccq/', title: 'CCQ', icon: '📊' },
    'rof-digital': { path: '/modules/rof-digital/', title: 'ROF Digital', icon: '📋' },
    adamboot: { path: '/modules/adamboot/', title: 'AdamBoot', icon: '🤖' }
  };

  /* Detecta base path do projeto */
  function detectBasePath() {
    const path = window.location.pathname;
    /* Se estamos em um módulo, o base é 2 níveis acima */
    if (path.includes('/modules/')) {
      const parts = path.split('/modules/');
      basePath = parts[0];
    } else {
      /* Estamos no hub — base é o diretório atual */
      basePath = path.replace(/\/index\.html$/, '').replace(/\/$/, '');
    }
    return basePath;
  }

  /* Navega para um módulo */
  function navigate(moduleName, params = {}) {
    const module = MODULES[moduleName];
    if (!module) {
      console.error(`[T4] Módulo não encontrado: ${moduleName}`);
      return;
    }

    detectBasePath();
    let url = basePath + module.path;

    /* Adiciona parâmetros como query string */
    if (Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url += '?' + qs;
    }

    /* Salva contexto antes de navegar */
    T4.storage.local.set('lastModule', moduleName);
    T4.storage.local.set('lastNavigation', Date.now());

    window.location.href = url;
  }

  /* Volta para o Hub */
  function goHome() {
    navigate('hub');
  }

  /* Volta para página anterior */
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goHome();
    }
  }

  /* Retorna informações do módulo atual */
  function getCurrentModule() {
    const path = window.location.pathname;
    for (const [name, mod] of Object.entries(MODULES)) {
      if (path.includes(mod.path) && name !== 'hub') {
        return { name, ...mod };
      }
    }
    return { name: 'hub', ...MODULES.hub };
  }

  /* Pega parâmetros da URL */
  function getParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }

  /* Gera URL absoluta para um módulo */
  function getModuleURL(moduleName) {
    detectBasePath();
    const module = MODULES[moduleName];
    return module ? basePath + module.path : null;
  }

  /* Lista todos os módulos disponíveis */
  function getModules() {
    return { ...MODULES };
  }

  /* Abre link externo */
  function openExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* Registra rota interna (para SPAs dentro de módulos) */
  function register(path, handler) {
    routes[path] = handler;
  }

  /* Resolve rota interna */
  function resolve(path) {
    const handler = routes[path];
    if (handler) {
      currentRoute = path;
      handler(getParams());
    }
  }

  /* Inicializa */
  detectBasePath();

  return {
    navigate,
    goHome,
    goBack,
    getCurrentModule,
    getParams,
    getModuleURL,
    getModules,
    openExternal,
    register,
    resolve
  };
})();
