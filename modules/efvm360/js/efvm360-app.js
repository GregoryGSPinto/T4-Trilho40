/* ============================================
   EFVM 360 — Controlador Principal
   Gerencia telas, ciclo de vida e navegação
   ============================================ */

const EFVM360App = (function () {
  'use strict';

  const { $, $$ } = T4.dom;

  /* === ESTADO DA APLICAÇÃO === */
  let _tela = 'menu';
  let _dificuldadeSelecionada = 'iniciante';
  let _trackProfile = null;
  let _restrictions = null;
  let _stations = null;
  let _dataLoaded = false;

  /* === INICIALIZAÇÃO === */

  async function init() {
    T4.init('efvm360');

    /* Verifica autenticação */
    if (!T4.auth.requireAuth()) {
      const container = document.getElementById('app');
      T4.auth.renderLoginScreen(container);
      return;
    }

    /* Carrega dados */
    await carregarDados();

    /* Renderiza menu */
    mostrarMenu();
  }

  /**
   * Carrega os arquivos JSON de dados
   */
  async function carregarDados() {
    try {
      const [trackRes, restrictRes, stationsRes] = await Promise.all([
        fetch('data/efvm-track-profile.json'),
        fetch('data/efvm-restrictions.json'),
        fetch('data/efvm-stations.json')
      ]);

      _trackProfile = await trackRes.json();
      _restrictions = await restrictRes.json();
      _stations = await stationsRes.json();
      _dataLoaded = true;
    } catch (err) {
      console.error('[EFVM360] Erro ao carregar dados:', err);
      T4.notifications.error('Erro ao carregar dados da ferrovia');
      _dataLoaded = false;
    }
  }

  /* === TELA DE MENU === */

  function mostrarMenu() {
    _tela = 'menu';
    const container = document.getElementById('app');
    const cenarios = EFVM360Scenarios.getCenarios();
    const dificuldades = EFVM360Scenarios.getDificuldades();
    const user = T4.auth.getUser();

    container.innerHTML = `
      <div class="t4-container t4-safe-top efvm-menu">
        <!-- Header -->
        <div class="t4-header">
          <button class="t4-header-back" id="efvm-btn-home" aria-label="Voltar ao Hub">←</button>
          <span class="t4-header-title" style="color: var(--efvm-accent);">EFVM 360</span>
          <div class="t4-avatar t4-avatar-sm" style="background: var(--efvm-accent-dim); color: var(--efvm-accent);">
            ${user ? user.avatar : '??'}
          </div>
        </div>

        <div class="efvm-menu-header t4-fadeUp">
          <div class="efvm-menu-icon">🚂</div>
          <h1 class="efvm-menu-title">Simulador de Condução</h1>
          <p class="efvm-menu-subtitle">Estrada de Ferro Vitória a Minas</p>
        </div>

        <!-- Dificuldade -->
        <div class="efvm-difficulty-section t4-fadeUp t4-fadeUp-2">
          <div class="efvm-difficulty-label">Dificuldade</div>
          <div class="efvm-difficulty-chips" id="efvm-difficulty-chips">
            ${Object.values(dificuldades).map(d => `
              <button class="efvm-difficulty-chip ${d.id === _dificuldadeSelecionada ? 'active' : ''}"
                data-dificuldade="${d.id}">
                ${d.nome}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Cenários -->
        <h3 class="t4-mt-md t4-mb-sm t4-fadeUp t4-fadeUp-3" style="font-size: 0.9375rem;">Escolha o cenário</h3>
        <div class="efvm-scenarios" id="efvm-scenarios">
          ${cenarios.map((c, i) => renderizarCardCenario(c, i + 4)).join('')}
        </div>
      </div>
    `;

    /* Event listeners */
    bindMenuEvents();
  }

  /**
   * Renderiza card de um cenário
   */
  function renderizarCardCenario(cenario, fadeIndex) {
    const trem = EFVM360Physics.getTrem(cenario.trem_tipo, cenario.carregado);
    const dif = EFVM360Scenarios.getDificuldade(_dificuldadeSelecionada);
    const difClass = `efvm-diff-${_dificuldadeSelecionada}`;

    return `
      <div class="efvm-scenario-card t4-fadeUp t4-fadeUp-${Math.min(fadeIndex, 8)}"
        data-cenario="${cenario.id}" role="button" tabindex="0">
        <div class="efvm-scenario-header">
          <span class="efvm-scenario-name">${cenario.icone} ${cenario.nome.split('—')[0].trim()}</span>
          <span class="efvm-scenario-difficulty ${difClass}">${dif.nome}</span>
        </div>
        <p class="efvm-scenario-desc">${cenario.descricao}</p>
        <div class="efvm-scenario-meta">
          <div class="efvm-scenario-meta-item">
            <span>🚂</span>
            <span>${trem.nome.split(' ')[0]} ${trem.id}</span>
          </div>
          <div class="efvm-scenario-meta-item">
            <span>⚖️</span>
            <span>${T4.utils.formatNumber(trem.peso_carregado_t)}t</span>
          </div>
          <div class="efvm-scenario-meta-item">
            <span>📏</span>
            <span>${cenario.rota.extensao_km} km</span>
          </div>
          <div class="efvm-scenario-meta-item">
            <span>⏱</span>
            <span>~${cenario.duracao_estimada_min} min</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Vincula eventos do menu
   */
  function bindMenuEvents() {
    /* Voltar ao Hub */
    const btnHome = document.getElementById('efvm-btn-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => T4.router.goHome());
    }

    /* Chips de dificuldade */
    const chipsContainer = document.getElementById('efvm-difficulty-chips');
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.efvm-difficulty-chip');
        if (!chip) return;

        _dificuldadeSelecionada = chip.dataset.dificuldade;
        T4.utils.vibrate(10);

        /* Atualiza visual */
        $$('.efvm-difficulty-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        /* Re-renderiza cenários com nova dificuldade */
        const cenarios = EFVM360Scenarios.getCenarios();
        const scenariosContainer = document.getElementById('efvm-scenarios');
        if (scenariosContainer) {
          scenariosContainer.innerHTML = cenarios.map((c, i) => renderizarCardCenario(c, 0)).join('');
          bindScenarioCards();
        }
      });
    }

    bindScenarioCards();
  }

  /**
   * Vincula eventos dos cards de cenário
   */
  function bindScenarioCards() {
    $$('.efvm-scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        const cenarioId = card.dataset.cenario;
        T4.utils.vibrate(15);
        iniciarSimulacao(cenarioId);
      });
    });
  }

  /* === TELA DE SIMULAÇÃO === */

  /**
   * Inicia uma simulação
   * @param {string} cenarioId
   */
  async function iniciarSimulacao(cenarioId) {
    if (!_dataLoaded) {
      T4.notifications.error('Dados da ferrovia não carregados');
      return;
    }

    const sessao = EFVM360Scenarios.montarSessao(cenarioId, _dificuldadeSelecionada);
    if (!sessao) {
      T4.notifications.error('Cenário ou dificuldade inválidos');
      return;
    }

    _tela = 'simulacao';
    const container = document.getElementById('app');

    /* Inicializa simulador */
    EFVM360Simulator.inicializar(sessao, _trackProfile, _restrictions, _stations);

    /* Renderiza HUD */
    EFVM360HUD.renderizar(container, sessao);

    /* Desenha perfil de via */
    EFVM360HUD.desenharPerfil(_trackProfile.segmentos || _trackProfile, sessao.cenario.rota);

    /* Vincula controles */
    bindControlEvents();

    /* Vincula eventos do simulador */
    EFVM360Simulator.on('update', onSimulatorUpdate);
    EFVM360Simulator.on('concluido', onSimulationComplete);
    EFVM360Simulator.on('evento', onSimulatorEvent);

    /* Inicia simulação */
    EFVM360Simulator.iniciar();

    T4.notifications.info(`Simulação iniciada: ${sessao.cenario.nome.split('—')[0].trim()}`);
  }

  /**
   * Vincula eventos dos controles de cabine
   */
  function bindControlEvents() {
    /* Tração */
    const btnTracaoUp = document.getElementById('efvm-btn-tracao-up');
    const btnTracaoDown = document.getElementById('efvm-btn-tracao-down');
    const btnFreioApply = document.getElementById('efvm-btn-freio-apply');
    const btnFreioRelease = document.getElementById('efvm-btn-freio-release');
    const btnEmergencia = document.getElementById('efvm-btn-emergencia');
    const btnExit = document.getElementById('efvm-btn-exit');

    if (btnTracaoUp) {
      btnTracaoUp.addEventListener('click', () => EFVM360Simulator.aumentarTracao());
      /* Suporte a long press para acelerar rápido */
      let intervalTracao = null;
      btnTracaoUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        EFVM360Simulator.aumentarTracao();
        intervalTracao = setInterval(() => EFVM360Simulator.aumentarTracao(), 300);
      }, { passive: false });
      btnTracaoUp.addEventListener('touchend', () => clearInterval(intervalTracao));
      btnTracaoUp.addEventListener('touchcancel', () => clearInterval(intervalTracao));
    }

    if (btnTracaoDown) {
      btnTracaoDown.addEventListener('click', () => EFVM360Simulator.reduzirTracao());
      let intervalReduz = null;
      btnTracaoDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        EFVM360Simulator.reduzirTracao();
        intervalReduz = setInterval(() => EFVM360Simulator.reduzirTracao(), 300);
      }, { passive: false });
      btnTracaoDown.addEventListener('touchend', () => clearInterval(intervalReduz));
      btnTracaoDown.addEventListener('touchcancel', () => clearInterval(intervalReduz));
    }

    if (btnFreioApply) {
      btnFreioApply.addEventListener('click', () => EFVM360Simulator.aplicarFreio());
      let intervalFreio = null;
      btnFreioApply.addEventListener('touchstart', (e) => {
        e.preventDefault();
        EFVM360Simulator.aplicarFreio();
        intervalFreio = setInterval(() => EFVM360Simulator.aplicarFreio(), 250);
      }, { passive: false });
      btnFreioApply.addEventListener('touchend', () => clearInterval(intervalFreio));
      btnFreioApply.addEventListener('touchcancel', () => clearInterval(intervalFreio));
    }

    if (btnFreioRelease) {
      btnFreioRelease.addEventListener('click', () => EFVM360Simulator.aliviarFreio());
      let intervalAliviar = null;
      btnFreioRelease.addEventListener('touchstart', (e) => {
        e.preventDefault();
        EFVM360Simulator.aliviarFreio();
        intervalAliviar = setInterval(() => EFVM360Simulator.aliviarFreio(), 250);
      }, { passive: false });
      btnFreioRelease.addEventListener('touchend', () => clearInterval(intervalAliviar));
      btnFreioRelease.addEventListener('touchcancel', () => clearInterval(intervalAliviar));
    }

    if (btnEmergencia) {
      btnEmergencia.addEventListener('click', async () => {
        const confirmar = await T4.notifications.confirm(
          'Acionar frenagem de emergência? Haverá penalidade na pontuação.',
          { title: 'Frenagem de Emergência', confirmText: 'Acionar', type: 'danger' }
        );
        if (confirmar) {
          EFVM360Simulator.emergencia();
        }
      });
    }

    if (btnExit) {
      btnExit.addEventListener('click', async () => {
        const confirmar = await T4.notifications.confirm(
          'Deseja encerrar a simulação? O progresso será perdido.',
          { title: 'Sair da Simulação', confirmText: 'Sair', type: 'danger' }
        );
        if (confirmar) {
          EFVM360Simulator.destruir();
          EFVM360HUD.destruir();
          mostrarMenu();
        }
      });
    }

    /* Atalhos de teclado (para teste em desktop) */
    document.addEventListener('keydown', onKeyDown);
  }

  /**
   * Handler de teclado para controles
   */
  function onKeyDown(e) {
    if (_tela !== 'simulacao') return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        EFVM360Simulator.aumentarTracao();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        EFVM360Simulator.reduzirTracao();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        EFVM360Simulator.aliviarFreio();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        EFVM360Simulator.aplicarFreio();
        break;
      case ' ':
        e.preventDefault();
        EFVM360Simulator.emergencia();
        break;
      case 'Escape':
        EFVM360Simulator.destruir();
        EFVM360HUD.destruir();
        mostrarMenu();
        break;
    }
  }

  /**
   * Callback de atualização do simulador
   */
  function onSimulatorUpdate(data) {
    EFVM360HUD.atualizar(data.state, EFVM360Simulator.getSessao(), data.scoring);
  }

  /**
   * Callback de simulação concluída
   */
  async function onSimulationComplete(data) {
    _tela = 'resultados';
    document.removeEventListener('keydown', onKeyDown);

    const container = document.getElementById('app');

    /* Salva resultado */
    try {
      await EFVM360Scoring.salvarResultado(data.resultado, data.sessao);
    } catch (err) {
      console.error('[EFVM360] Erro ao salvar resultado:', err);
    }

    /* Renderiza tela de resultados */
    EFVM360HUD.renderizarResultados(container, data.resultado, data.sessao);

    /* Vincula botões dos resultados */
    bindResultsEvents(data.sessao.cenario.id);

    T4.notifications.success('Simulação concluída!');
  }

  /**
   * Callback de eventos do simulador
   */
  function onSimulatorEvent(data) {
    switch (data.tipo) {
      case 'parada':
        T4.notifications.success(`Parada em ${data.evento.estacao} (erro: ${data.erro_m.toFixed(0)}m)`);
        break;
      case 'parada_perdida':
        T4.notifications.warning(`Parada perdida em ${data.evento.estacao}!`);
        break;
      case 'restricao':
        T4.notifications.info(`Restrição: ${data.evento.velocidade} km/h — ${data.evento.descricao}`);
        break;
      case 'emergencia':
        T4.notifications.error('FRENAGEM DE EMERGÊNCIA ACIONADA');
        break;
    }
  }

  /* === TELA DE RESULTADOS === */

  /**
   * Vincula eventos da tela de resultados
   */
  function bindResultsEvents(cenarioId) {
    const btnRetry = document.getElementById('efvm-btn-retry');
    const btnMenu = document.getElementById('efvm-btn-back-menu');
    const btnHome = document.getElementById('efvm-btn-go-home');

    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        EFVM360Simulator.destruir();
        EFVM360HUD.destruir();
        iniciarSimulacao(cenarioId);
      });
    }

    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        EFVM360Simulator.destruir();
        EFVM360HUD.destruir();
        mostrarMenu();
      });
    }

    if (btnHome) {
      btnHome.addEventListener('click', () => {
        EFVM360Simulator.destruir();
        EFVM360HUD.destruir();
        T4.router.goHome();
      });
    }
  }

  /* === DESTRUIÇÃO === */

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    EFVM360Simulator.destruir();
    EFVM360HUD.destruir();
  }

  return {
    init,
    destroy,
    mostrarMenu
  };
})();

/* Auto-inicialização */
document.addEventListener('DOMContentLoaded', () => {
  EFVM360App.init();
});
