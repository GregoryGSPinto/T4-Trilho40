/* ============================================
   VFZ LINK — Integração com VFZ Passagem de Serviço
   Deep link e comunicação com o app externo
   ============================================ */

const VFZLink = (function () {
  let config = null;

  /* Carrega configuração */
  async function loadConfig() {
    try {
      const resp = await fetch('./integration-config.json');
      const data = await resp.json();
      config = data.vfz;
    } catch {
      config = { url: '#', status: 'offline' };
    }
    return config;
  }

  /* Abre o VFZ em nova aba */
  function open(params = {}) {
    if (!config) {
      loadConfig().then(() => open(params));
      return;
    }

    let url = config.url;
    if (Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString();
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* Abre com contexto de passagem de serviço */
  function openWithContext() {
    const user = T4.auth.getUser();
    const ctx = T4.context.get();

    open({
      maquinista: user?.nome || '',
      matricula: user?.matricula || '',
      patio: ctx.patio || '',
      turno: ctx.turno || '',
      trem: ctx.trem || '',
      source: 't4-hub'
    });
  }

  /* Verifica se o VFZ está acessível */
  async function checkStatus() {
    if (!config) await loadConfig();

    try {
      const resp = await fetch(config.url, { mode: 'no-cors', cache: 'no-cache' });
      return 'online';
    } catch {
      return 'offline';
    }
  }

  return {
    loadConfig,
    open,
    openWithContext,
    checkStatus
  };
})();
