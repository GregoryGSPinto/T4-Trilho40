/* ============================================
   EFVM 360 — Renderização do HUD
   Interface da cabine de condução
   ============================================ */

const EFVM360HUD = (function () {
  'use strict';

  const { $, $$ } = T4.dom;
  let _container = null;
  let _canvas = null;
  let _canvasCtx = null;
  let _trackData = null;
  let _stationsData = null;

  /* Circunferência do arco do velocímetro (270 graus do arco) */
  const GAUGE_RADIUS = 70;
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
  const GAUGE_ARC = GAUGE_CIRCUMFERENCE * 0.75;

  /**
   * Renderiza o HTML completo do HUD
   * @param {HTMLElement} container
   * @param {object} sessao - Dados da sessão
   */
  function renderizar(container, sessao) {
    _container = container;

    const direcaoLabel = sessao.cenario.rota.direcao === 'descendente' ? 'Descendente' : 'Ascendente';

    container.innerHTML = `
      <div class="efvm-hud" id="efvm-hud">
        <!-- Barra superior -->
        <div class="efvm-hud-topbar">
          <div class="efvm-hud-topbar-left">
            <span class="efvm-hud-timer" id="efvm-timer">00:00</span>
            <span class="efvm-hud-km" id="efvm-km">km ${sessao.cenario.rota.km_inicio.toFixed(1)}</span>
          </div>
          <div class="efvm-score-display">
            <span class="efvm-score-star">★</span>
            <span class="efvm-score-value" id="efvm-score">100</span>
          </div>
          <button class="efvm-hud-btn-exit" id="efvm-btn-exit" aria-label="Sair da simulação">✕</button>
        </div>

        <!-- Área principal -->
        <div class="efvm-hud-main">
          <!-- Sinais e BOLL -->
          <div class="efvm-signals-row">
            <div class="efvm-signal">
              <div class="efvm-signal-light verde" id="efvm-signal-light"></div>
              <span class="efvm-signal-label">Sinal</span>
            </div>
            <div class="efvm-boll ativo" id="efvm-boll">
              <span>●</span>
              <span>BOLL</span>
            </div>
            <div class="efvm-signal">
              <div class="efvm-signal-light apagado" id="efvm-radio-light"></div>
              <span class="efvm-signal-label">Rádio</span>
            </div>
          </div>

          <!-- Velocímetro -->
          <div class="efvm-speedometer" id="efvm-speedometer">
            <svg viewBox="0 0 180 180">
              <circle class="efvm-speedometer-bg"
                cx="90" cy="90" r="${GAUGE_RADIUS}"
                stroke-dasharray="${GAUGE_ARC}"
                stroke-dashoffset="0"
                transform="rotate(0, 90, 90)" />
              <circle class="efvm-speedometer-limit" id="efvm-gauge-limit"
                cx="90" cy="90" r="${GAUGE_RADIUS}"
                stroke-dasharray="${GAUGE_ARC}"
                stroke-dashoffset="${GAUGE_ARC}"
                transform="rotate(0, 90, 90)" />
              <circle class="efvm-speedometer-value" id="efvm-gauge-value"
                cx="90" cy="90" r="${GAUGE_RADIUS}"
                stroke-dasharray="${GAUGE_ARC}"
                stroke-dashoffset="${GAUGE_ARC}"
                transform="rotate(0, 90, 90)" />
            </svg>
            <div class="efvm-speedometer-center">
              <div class="efvm-speedometer-speed" id="efvm-speed-display">0</div>
              <div class="efvm-speedometer-unit">km/h</div>
              <div class="efvm-speedometer-limit-text" id="efvm-limit-display">Lim: 30</div>
            </div>
          </div>

          <!-- Indicadores -->
          <div class="efvm-indicators">
            <div class="efvm-indicator">
              <div class="efvm-indicator-label">Tração</div>
              <div class="efvm-indicator-value accent" id="efvm-ind-tracao">0</div>
            </div>
            <div class="efvm-indicator">
              <div class="efvm-indicator-label">Fr. Din.</div>
              <div class="efvm-indicator-value" id="efvm-ind-freio-din">0</div>
            </div>
            <div class="efvm-indicator">
              <div class="efvm-indicator-label">Fr. Pneu.</div>
              <div class="efvm-indicator-value" id="efvm-ind-freio-pneu">0</div>
            </div>
          </div>

          <!-- Próxima estação e restrição -->
          <div class="efvm-next-info">
            <div class="efvm-next-card">
              <div class="efvm-next-card-label">Próxima parada</div>
              <div class="efvm-next-card-value" id="efvm-next-station">—</div>
              <div class="efvm-next-card-sub" id="efvm-next-station-dist">—</div>
            </div>
            <div class="efvm-next-card">
              <div class="efvm-next-card-label">Restrição</div>
              <div class="efvm-next-card-value" id="efvm-next-restriction">—</div>
              <div class="efvm-next-card-sub" id="efvm-next-restriction-dist">—</div>
            </div>
          </div>

          <!-- Gradiente -->
          <div class="efvm-gradient-bar">
            <span class="efvm-gradient-icon plano" id="efvm-gradient-icon">═</span>
            <span class="efvm-gradient-text" id="efvm-gradient-text">Plano</span>
            <span class="efvm-gradient-value" id="efvm-gradient-value">0.0%</span>
          </div>

          <!-- Mini perfil de via -->
          <div class="efvm-track-profile">
            <canvas class="efvm-track-profile-canvas" id="efvm-track-canvas" width="400" height="50"></canvas>
            <div class="efvm-track-profile-position" id="efvm-track-position" style="left: 0%"></div>
          </div>
          <div class="efvm-track-profile-labels">
            <span class="efvm-track-profile-label" id="efvm-track-label-start">${sessao.cenario.rota.origem_codigo}</span>
            <span class="efvm-track-profile-label">${direcaoLabel}</span>
            <span class="efvm-track-profile-label" id="efvm-track-label-end">${sessao.cenario.rota.destino_codigo}</span>
          </div>
        </div>

        <!-- Controles -->
        <div class="efvm-controls">
          <div class="efvm-control-group">
            <span class="efvm-control-group-label">Tração</span>
            <div class="efvm-control-buttons">
              <button class="efvm-ctrl-btn tracao-up" id="efvm-btn-tracao-up" aria-label="Aumentar tração">
                <span class="efvm-ctrl-btn-icon">▲</span>
                <span>Acelerar</span>
              </button>
              <button class="efvm-ctrl-btn tracao-down" id="efvm-btn-tracao-down" aria-label="Reduzir tração">
                <span class="efvm-ctrl-btn-icon">▼</span>
                <span>Reduzir</span>
              </button>
            </div>
          </div>
          <div class="efvm-control-group">
            <span class="efvm-control-group-label">Freio</span>
            <div class="efvm-control-buttons">
              <button class="efvm-ctrl-btn freio-apply" id="efvm-btn-freio-apply" aria-label="Aplicar freio">
                <span class="efvm-ctrl-btn-icon">■</span>
                <span>Aplicar</span>
              </button>
              <button class="efvm-ctrl-btn freio-release" id="efvm-btn-freio-release" aria-label="Aliviar freio">
                <span class="efvm-ctrl-btn-icon">▽</span>
                <span>Aliviar</span>
              </button>
            </div>
          </div>
          <button class="efvm-ctrl-btn emergencia" id="efvm-btn-emergencia" style="grid-column: span 2;">
            <span class="efvm-ctrl-btn-icon">⚠</span>
            <span>EMERGÊNCIA</span>
          </button>
        </div>
      </div>
    `;

    _canvas = document.getElementById('efvm-track-canvas');
    _canvasCtx = _canvas ? _canvas.getContext('2d') : null;
  }

  /**
   * Desenha o perfil de via no canvas
   * @param {Array} segmentos - Segmentos do track profile
   * @param {object} rota - Dados da rota
   */
  function desenharPerfil(segmentos, rota) {
    if (!_canvasCtx || !segmentos || segmentos.length === 0) return;

    _trackData = segmentos;
    const ctx = _canvasCtx;
    const w = _canvas.width;
    const h = _canvas.height;

    ctx.clearRect(0, 0, w, h);

    /* Filtra segmentos da rota */
    const km_min = Math.min(rota.km_inicio, rota.km_fim);
    const km_max = Math.max(rota.km_inicio, rota.km_fim);
    const segs = segmentos.filter(s => s.km >= km_min && s.km <= km_max);

    if (segs.length < 2) return;

    /* Encontra min/max altitude */
    const altitudes = segs.map(s => s.altitude);
    const alt_min = Math.min(...altitudes);
    const alt_max = Math.max(...altitudes);
    const alt_range = alt_max - alt_min || 1;

    /* Desenha perfil */
    ctx.beginPath();
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-teal').trim() || '#008C7E';
    ctx.strokeStyle = accentColor + '66';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = accentColor + '14';

    const extensao = km_max - km_min;

    segs.forEach((seg, i) => {
      const x = ((seg.km - km_min) / extensao) * w;
      const y = h - ((seg.altitude - alt_min) / alt_range) * (h - 8) - 4;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    /* Preenche área abaixo */
    const lastSeg = segs[segs.length - 1];
    const lastX = ((lastSeg.km - km_min) / extensao) * w;
    ctx.lineTo(lastX, h);
    ctx.lineTo(((segs[0].km - km_min) / extensao) * w, h);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Atualiza todos os elementos do HUD
   * @param {object} state - Estado atual da simulação
   * @param {object} sessao - Dados da sessão
   * @param {object} scoring - Registro de pontuação atual
   */
  function atualizar(state, sessao, scoring) {
    if (!_container) return;

    /* Timer */
    const timerEl = document.getElementById('efvm-timer');
    if (timerEl) {
      const min = Math.floor(state.tempo_s / 60);
      const sec = Math.floor(state.tempo_s % 60);
      timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    /* Posição km */
    const kmEl = document.getElementById('efvm-km');
    if (kmEl) {
      kmEl.textContent = `km ${state.posicao_km.toFixed(1)}`;
    }

    /* Pontuação */
    const scoreEl = document.getElementById('efvm-score');
    if (scoreEl) {
      const pontuacao = Math.max(0, Math.round(
        scoring.pontuacao_base -
        scoring.penalidades.excesso_velocidade -
        scoring.penalidades.frenagem_brusca -
        scoring.penalidades.violacao_sinal -
        scoring.penalidades.parada_imprecisa -
        scoring.penalidades.conforto_passageiros +
        scoring.bonus.parada_precisa +
        scoring.bonus.eficiencia_energia +
        scoring.bonus.condução_suave
      ));
      scoreEl.textContent = Math.min(100, pontuacao);
    }

    /* Velocímetro */
    atualizarVelocimetro(state.velocidade_kmh, state.velocidade_limite_kmh, sessao.trem.velocidade_max_kmh);

    /* Indicadores de tração/freio */
    const indTracao = document.getElementById('efvm-ind-tracao');
    if (indTracao) indTracao.textContent = state.notch_tracao;

    const indFreioDin = document.getElementById('efvm-ind-freio-din');
    if (indFreioDin) {
      indFreioDin.textContent = state.notch_freio_dinamico;
      indFreioDin.className = 'efvm-indicator-value' + (state.notch_freio_dinamico > 0 ? ' warn' : '');
    }

    const indFreioPneu = document.getElementById('efvm-ind-freio-pneu');
    if (indFreioPneu) {
      indFreioPneu.textContent = state.notch_freio_pneumatico;
      indFreioPneu.className = 'efvm-indicator-value' + (state.notch_freio_pneumatico > 0 ? ' danger' : '');
    }

    /* Sinal */
    atualizarSinal(state.sinal_atual);

    /* BOLL */
    atualizarBOLL(state.boll_estado);

    /* Gradiente */
    atualizarGradiente(state.gradiente);

    /* Posição no perfil de via */
    atualizarPosicaoPerfil(state.posicao_km, sessao.cenario.rota);

    /* Próxima estação/restrição */
    atualizarProximaInfo(state, sessao);
  }

  /**
   * Atualiza o velocímetro circular SVG
   */
  function atualizarVelocimetro(velocidade_kmh, limite_kmh, max_kmh) {
    const speedDisplay = document.getElementById('efvm-speed-display');
    const limitDisplay = document.getElementById('efvm-limit-display');
    const gaugeValue = document.getElementById('efvm-gauge-value');
    const gaugeLimit = document.getElementById('efvm-gauge-limit');

    if (!speedDisplay || !gaugeValue) return;

    speedDisplay.textContent = Math.round(velocidade_kmh);
    if (limitDisplay) limitDisplay.textContent = `Lim: ${Math.round(limite_kmh)}`;

    /* Atualiza arco do velocímetro */
    const fator_vel = Math.min(1, velocidade_kmh / max_kmh);
    const offset_vel = GAUGE_ARC * (1 - fator_vel);
    gaugeValue.setAttribute('stroke-dashoffset', offset_vel);

    /* Arco do limite */
    if (gaugeLimit) {
      const fator_lim = Math.min(1, limite_kmh / max_kmh);
      const offset_lim = GAUGE_ARC * (1 - fator_lim);
      gaugeLimit.setAttribute('stroke-dashoffset', offset_lim);
    }

    /* Cor baseada na relação velocidade/limite */
    gaugeValue.classList.remove('warn', 'danger');
    speedDisplay.classList.remove('efvm-speed-flashing');

    if (velocidade_kmh > limite_kmh) {
      gaugeValue.classList.add('danger');
      speedDisplay.classList.add('efvm-speed-flashing');
    } else if (velocidade_kmh > limite_kmh * 0.9) {
      gaugeValue.classList.add('warn');
    }
  }

  /**
   * Atualiza indicador de sinal
   */
  function atualizarSinal(aspecto) {
    const light = document.getElementById('efvm-signal-light');
    if (!light) return;

    light.classList.remove('verde', 'amarelo', 'vermelho', 'apagado');
    light.classList.add(aspecto || 'verde');
  }

  /**
   * Atualiza indicador BOLL
   */
  function atualizarBOLL(estado) {
    const boll = document.getElementById('efvm-boll');
    if (!boll) return;

    boll.classList.remove('ativo', 'alerta', 'violacao');
    boll.classList.add(estado || 'ativo');
  }

  /**
   * Atualiza indicador de gradiente
   */
  function atualizarGradiente(gradiente) {
    const icon = document.getElementById('efvm-gradient-icon');
    const text = document.getElementById('efvm-gradient-text');
    const value = document.getElementById('efvm-gradient-value');

    if (!icon || !text || !value) return;

    icon.classList.remove('subida', 'descida', 'plano');

    if (gradiente > 0.05) {
      icon.textContent = '↗';
      icon.classList.add('subida');
      text.textContent = 'Subida';
    } else if (gradiente < -0.05) {
      icon.textContent = '↘';
      icon.classList.add('descida');
      text.textContent = 'Descida';
    } else {
      icon.textContent = '═';
      icon.classList.add('plano');
      text.textContent = 'Plano';
    }

    value.textContent = `${gradiente >= 0 ? '+' : ''}${gradiente.toFixed(2)}%`;
  }

  /**
   * Atualiza posição no mini perfil de via
   */
  function atualizarPosicaoPerfil(posicao_km, rota) {
    const posEl = document.getElementById('efvm-track-position');
    if (!posEl) return;

    const km_min = Math.min(rota.km_inicio, rota.km_fim);
    const km_max = Math.max(rota.km_inicio, rota.km_fim);
    const extensao = km_max - km_min;

    if (extensao <= 0) return;

    const progresso = ((posicao_km - km_min) / extensao) * 100;
    posEl.style.left = `${Math.max(0, Math.min(100, progresso))}%`;
  }

  /**
   * Atualiza informações da próxima estação e restrição
   */
  function atualizarProximaInfo(state, sessao) {
    const stationName = document.getElementById('efvm-next-station');
    const stationDist = document.getElementById('efvm-next-station-dist');
    const restrictName = document.getElementById('efvm-next-restriction');
    const restrictDist = document.getElementById('efvm-next-restriction-dist');

    if (!stationName) return;

    const ascendente = sessao.cenario.rota.direcao === 'ascendente';
    const eventos = sessao.cenario.eventos;

    /* Próxima parada */
    const proxParada = eventos.find(e => {
      if (e.tipo !== 'parada') return false;
      return ascendente ? e.km > state.posicao_km : e.km < state.posicao_km;
    });

    if (proxParada) {
      stationName.textContent = proxParada.descricao.split(' ').slice(-1)[0];
      const dist = Math.abs(proxParada.km - state.posicao_km);
      stationDist.textContent = dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)} km`;
    } else {
      stationName.textContent = sessao.cenario.rota.destino_codigo;
      const distFim = Math.abs(sessao.cenario.rota.km_fim - state.posicao_km);
      stationDist.textContent = `${distFim.toFixed(1)} km`;
    }

    /* Próxima restrição */
    const proxRestricao = eventos.find(e => {
      if (e.tipo !== 'restricao') return false;
      return ascendente ? e.km > state.posicao_km : e.km < state.posicao_km;
    });

    if (proxRestricao) {
      restrictName.textContent = `${proxRestricao.velocidade} km/h`;
      const dist = Math.abs(proxRestricao.km - state.posicao_km);
      restrictDist.textContent = dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)} km`;
    } else {
      restrictName.textContent = '—';
      restrictDist.textContent = '—';
    }
  }

  /**
   * Renderiza tela de resultados
   * @param {HTMLElement} container
   * @param {object} resultado - Resultado final da simulação
   * @param {object} sessao - Dados da sessão
   */
  function renderizarResultados(container, resultado, sessao) {
    const corClassificacao = {
      'S': 'var(--status-ok)',
      'A': 'var(--efvm-accent)',
      'B': 'var(--status-info)',
      'C': 'var(--status-warning)',
      'D': 'var(--status-warning)',
      'F': 'var(--status-danger)'
    };

    const cor = corClassificacao[resultado.classificacao] || 'var(--efvm-accent)';

    container.innerHTML = `
      <div class="efvm-results t4-fadeUp">
        <div class="efvm-results-header">
          <h2 class="efvm-results-title">Simulação Concluída</h2>
          <p class="efvm-results-subtitle">${sessao.cenario.nome}</p>
        </div>

        <div class="efvm-results-score" style="border-color: ${cor}; box-shadow: 0 0 30px ${cor}40;">
          <div class="efvm-results-score-num" style="color: ${cor};">${Math.round(resultado.pontuacao_final)}</div>
          <div class="efvm-results-score-label">Classe ${resultado.classificacao}</div>
        </div>

        <div class="efvm-results-details">
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">⏱ Tempo total</span>
            <span class="efvm-results-row-value neutral">${formatarTempo(resultado.estatisticas.tempo_total_s)}</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">📏 Distância</span>
            <span class="efvm-results-row-value neutral">${resultado.estatisticas.distancia_total_km.toFixed(1)} km</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🚄 Vel. média</span>
            <span class="efvm-results-row-value neutral">${resultado.estatisticas.velocidade_media_kmh.toFixed(1)} km/h</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🚄 Vel. máxima</span>
            <span class="efvm-results-row-value neutral">${resultado.estatisticas.velocidade_maxima_kmh.toFixed(1)} km/h</span>
          </div>

          <hr class="t4-divider">

          <div class="efvm-results-row">
            <span class="efvm-results-row-label">⚡ Excesso de velocidade</span>
            <span class="efvm-results-row-value penalty">-${resultado.penalidades.excesso_velocidade.toFixed(1)}</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">⛔ Frenagem brusca</span>
            <span class="efvm-results-row-value penalty">-${resultado.penalidades.frenagem_brusca.toFixed(1)}</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🚦 Violação de sinal</span>
            <span class="efvm-results-row-value penalty">-${resultado.penalidades.violacao_sinal.toFixed(1)}</span>
          </div>
          ${resultado.penalidades.conforto_passageiros > 0 ? `
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🧳 Conforto passageiros</span>
            <span class="efvm-results-row-value penalty">-${resultado.penalidades.conforto_passageiros.toFixed(1)}</span>
          </div>
          ` : ''}

          <hr class="t4-divider">

          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🎯 Paradas precisas</span>
            <span class="efvm-results-row-value bonus">+${resultado.bonus.parada_precisa.toFixed(1)}</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🔋 Eficiência energética</span>
            <span class="efvm-results-row-value bonus">+${resultado.bonus.eficiencia_energia.toFixed(1)}</span>
          </div>
          <div class="efvm-results-row">
            <span class="efvm-results-row-label">🛤 Condução suave</span>
            <span class="efvm-results-row-value bonus">+${resultado.bonus.condução_suave.toFixed(1)}</span>
          </div>
        </div>

        <div class="efvm-results-actions">
          <button class="t4-btn t4-btn-primary t4-btn-block t4-btn-lg" id="efvm-btn-retry">
            Tentar Novamente
          </button>
          <button class="t4-btn t4-btn-secondary t4-btn-block" id="efvm-btn-back-menu">
            Voltar ao Menu
          </button>
          <button class="t4-btn t4-btn-ghost t4-btn-block" id="efvm-btn-go-home">
            Voltar ao Hub
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Formata segundos em HH:MM:SS
   */
  function formatarTempo(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);

    if (h > 0) {
      return `${h}h ${String(m).padStart(2, '0')}min`;
    }
    return `${m}min ${String(s).padStart(2, '0')}s`;
  }

  /**
   * Limpa o HUD
   */
  function destruir() {
    _container = null;
    _canvas = null;
    _canvasCtx = null;
    _trackData = null;
  }

  return {
    renderizar,
    desenharPerfil,
    atualizar,
    atualizarVelocimetro,
    atualizarSinal,
    atualizarBOLL,
    renderizarResultados,
    formatarTempo,
    destruir
  };
})();
