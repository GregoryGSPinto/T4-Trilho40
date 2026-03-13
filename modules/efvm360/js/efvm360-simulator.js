/* ============================================
   EFVM 360 — Motor de Simulação
   Game loop e lógica de simulação
   ============================================ */

const EFVM360Simulator = (function () {
  'use strict';

  /* === ESTADO INTERNO === */
  let _sessao = null;
  let _state = null;
  let _scoring = null;
  let _trackProfile = null;
  let _restrictions = null;
  let _stations = null;
  let _running = false;
  let _paused = false;
  let _animFrameId = null;
  let _lastTimestamp = 0;
  let _callbacks = {};
  let _eventosProcessados = new Set();

  /**
   * Inicializa a simulação
   * @param {object} sessao - Sessão montada pelo EFVM360Scenarios
   * @param {object} trackProfile - Dados do perfil de via
   * @param {object} restrictions - Restrições de velocidade
   * @param {object} stations - Dados das estações
   */
  function inicializar(sessao, trackProfile, restrictions, stations) {
    _sessao = sessao;
    _state = { ..._sessao.estado_inicial, trem: _sessao.trem };
    _scoring = EFVM360Scoring.criarRegistro();
    _trackProfile = trackProfile.segmentos || trackProfile;
    _restrictions = restrictions.restricoes || restrictions;
    _stations = stations.estacoes || stations;
    _running = false;
    _paused = false;
    _eventosProcessados = new Set();
    _lastTimestamp = 0;

    /* Atualiza gradiente e limite iniciais */
    atualizarDadosVia();
  }

  /**
   * Inicia o game loop
   */
  function iniciar() {
    if (_running) return;
    _running = true;
    _paused = false;
    _lastTimestamp = performance.now();
    _animFrameId = requestAnimationFrame(gameLoop);
    emitir('start');
  }

  /**
   * Pausa a simulação
   */
  function pausar() {
    _paused = true;
    emitir('pause');
  }

  /**
   * Resume a simulação
   */
  function resumir() {
    if (!_running) return;
    _paused = false;
    _lastTimestamp = performance.now();
    _animFrameId = requestAnimationFrame(gameLoop);
    emitir('resume');
  }

  /**
   * Para a simulação completamente
   */
  function parar() {
    _running = false;
    _paused = false;
    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
      _animFrameId = null;
    }
    emitir('stop');
  }

  /**
   * Game loop principal
   * @param {number} timestamp - Timestamp do requestAnimationFrame
   */
  function gameLoop(timestamp) {
    if (!_running || _paused) return;

    const dt_real = (timestamp - _lastTimestamp) / 1000;
    _lastTimestamp = timestamp;

    /* Limita dt para evitar saltos grandes */
    const dt_capped = Math.min(dt_real, 0.1);

    /* Aplica fator de tempo da dificuldade */
    const fator = _sessao.dificuldade.fator_tempo;
    const dt_sim = dt_capped * fator;

    /* === PASSO DE SIMULAÇÃO === */
    passo(dt_sim, dt_capped);

    /* === VERIFICAÇÕES === */
    verificarCondicoes(dt_sim);

    /* === ATUALIZA HUD === */
    emitir('update', { state: _state, scoring: _scoring });

    /* === VERIFICA FIM === */
    if (verificarFim()) {
      concluir();
      return;
    }

    _animFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Executa um passo da simulação
   * @param {number} dt_sim - Delta time simulado
   * @param {number} dt_real - Delta time real
   */
  function passo(dt_sim, dt_real) {
    /* Atualiza dados da via para posição atual */
    atualizarDadosVia();

    /* Calcula física */
    const resultado = EFVM360Physics.atualizar(_state, dt_sim);

    /* Atualiza estado */
    _state.velocidade_ms = resultado.velocidade_ms;
    _state.velocidade_kmh = resultado.velocidade_kmh;
    _state.posicao_km = resultado.posicao_km;
    _state.aceleracao_ms2 = resultado.aceleracao_ms2;
    _state.forcas = resultado.forcas;
    _state.tempo_s += dt_sim;
    _state.energia_total_kwh += resultado.energia_consumida_kwh;
    _state.energia_regenerada_total_kwh += resultado.energia_regenerada_kwh;
    _state.distancia_percorrida_km += Math.abs(resultado.deslocamento_m) / 1000;

    /* Atualiza estatísticas de pontuação */
    EFVM360Scoring.atualizarEstatisticas(
      _scoring,
      _state.velocidade_kmh,
      _state.aceleracao_ms2,
      dt_sim
    );
  }

  /**
   * Atualiza gradiente, raio de curva e limite de velocidade
   * baseado na posição atual no perfil de via
   */
  function atualizarDadosVia() {
    if (!_trackProfile || _trackProfile.length === 0) return;

    const km = _state.posicao_km;

    /* Encontra segmento atual por interpolação linear */
    let segAnterior = _trackProfile[0];
    let segPosterior = _trackProfile[_trackProfile.length - 1];

    for (let i = 0; i < _trackProfile.length - 1; i++) {
      if (km >= _trackProfile[i].km && km <= _trackProfile[i + 1].km) {
        segAnterior = _trackProfile[i];
        segPosterior = _trackProfile[i + 1];
        break;
      } else if (km <= _trackProfile[i].km && km >= _trackProfile[i + 1].km) {
        segAnterior = _trackProfile[i + 1];
        segPosterior = _trackProfile[i];
        break;
      }
    }

    /* Interpolação */
    const dist = segPosterior.km - segAnterior.km;
    const fator = dist !== 0 ? (km - segAnterior.km) / dist : 0;

    const gradiente = segAnterior.gradiente + (segPosterior.gradiente - segAnterior.gradiente) * fator;
    const raio = segAnterior.raio_curva > 0 && segPosterior.raio_curva > 0
      ? segAnterior.raio_curva + (segPosterior.raio_curva - segAnterior.raio_curva) * fator
      : segAnterior.raio_curva || segPosterior.raio_curva || 0;

    /* Direção descendente inverte o gradiente */
    if (_sessao.cenario.rota.direcao === 'descendente') {
      _state.gradiente = -gradiente;
    } else {
      _state.gradiente = gradiente;
    }

    _state.raio_curva = raio;

    /* Velocidade limite: menor entre perfil de via e restrições */
    let limite = segAnterior.velocidade_max || 60;

    /* Verifica restrições */
    if (_restrictions) {
      for (const r of _restrictions) {
        if (km >= r.km_inicio && km <= r.km_fim) {
          limite = Math.min(limite, r.velocidade_max);
        }
      }
    }

    /* Limite do trem */
    limite = Math.min(limite, _state.trem.velocidade_max_kmh);

    _state.velocidade_limite_kmh = limite;
  }

  /**
   * Verifica condições de penalidade e eventos
   */
  function verificarCondicoes(dt) {
    const dificuldade = _sessao.dificuldade;

    /* Excesso de velocidade */
    EFVM360Scoring.registrarExcessoVelocidade(
      _scoring,
      _state.velocidade_kmh,
      _state.velocidade_limite_kmh,
      dificuldade.tolerancia_velocidade_kmh,
      dificuldade.penalidade_velocidade,
      dt
    );

    /* BOLL */
    if (dificuldade.boll_ativo) {
      if (_state.velocidade_kmh > _state.velocidade_limite_kmh + dificuldade.tolerancia_velocidade_kmh) {
        _state.boll_estado = 'violacao';
      } else if (_state.velocidade_kmh > _state.velocidade_limite_kmh * 0.9) {
        _state.boll_estado = 'alerta';
      } else {
        _state.boll_estado = 'ativo';
      }
    }

    /* Frenagem brusca */
    if (_state.aceleracao_ms2 < -0.5) {
      const passageiros = _sessao.cenario.trem_tipo === 'P521';
      EFVM360Scoring.registrarFrenagemBrusca(
        _scoring,
        _state.aceleracao_ms2,
        dificuldade.penalidade_frenagem,
        passageiros
      );
    }

    /* Eventos do cenário */
    verificarEventos();
  }

  /**
   * Verifica se o trem passou por eventos do cenário
   */
  function verificarEventos() {
    const ascendente = _sessao.cenario.rota.direcao === 'ascendente';
    const eventos = _sessao.cenario.eventos;

    eventos.forEach((evento, idx) => {
      if (_eventosProcessados.has(idx)) return;

      const distancia = Math.abs(evento.km - _state.posicao_km);

      /* Verifica se passou pelo evento */
      const passou = ascendente
        ? _state.posicao_km >= evento.km
        : _state.posicao_km <= evento.km;

      if (!passou) return;

      /* Sinal */
      if (evento.tipo === 'sinal') {
        _state.sinal_atual = evento.aspecto;
        _eventosProcessados.add(idx);

        /* Verifica violação: passar em sinal vermelho */
        if (evento.aspecto === 'vermelho' && _state.velocidade_kmh > 0) {
          if (_sessao.dificuldade.sinais_ativos) {
            EFVM360Scoring.registrarViolacaoSinal(
              _scoring,
              'vermelho',
              _sessao.dificuldade.penalidade_sinal
            );
          }
        }
        emitir('evento', { tipo: 'sinal', evento });
      }

      /* Parada em estação */
      if (evento.tipo === 'parada' && distancia < 0.5) {
        _eventosProcessados.add(idx);

        /* Calcula precisão da parada */
        const erro_m = distancia * 1000;

        if (_state.velocidade_kmh < 5) {
          EFVM360Scoring.registrarParada(
            _scoring,
            evento.estacao,
            erro_m,
            _sessao.dificuldade.tolerancia_parada_m,
            _sessao.dificuldade.bonus_parada
          );
          emitir('evento', { tipo: 'parada', evento, erro_m });
        } else if (evento.obrigatoria) {
          /* Passou sem parar em estação obrigatória */
          EFVM360Scoring.registrarParada(
            _scoring,
            evento.estacao,
            1000,
            _sessao.dificuldade.tolerancia_parada_m,
            _sessao.dificuldade.bonus_parada
          );
          emitir('evento', { tipo: 'parada_perdida', evento });
        }
      }

      /* Restrição (informativo, já aplicada nos dados de via) */
      if (evento.tipo === 'restricao' && distancia < 2) {
        if (!_eventosProcessados.has(idx)) {
          _eventosProcessados.add(idx);
          emitir('evento', { tipo: 'restricao', evento });
        }
      }
    });
  }

  /**
   * Verifica se a simulação deve terminar
   * @returns {boolean}
   */
  function verificarFim() {
    const rota = _sessao.cenario.rota;

    if (rota.direcao === 'ascendente') {
      return _state.posicao_km >= rota.km_fim;
    } else {
      return _state.posicao_km <= rota.km_fim;
    }
  }

  /**
   * Conclui a simulação e calcula resultado final
   */
  function concluir() {
    parar();
    _state.concluido = true;

    _scoring.estatisticas.tempo_total_s = _state.tempo_s;
    _scoring.estatisticas.distancia_total_km = _state.distancia_percorrida_km;

    const resultado = EFVM360Scoring.calcularFinal(
      _scoring,
      _state.energia_total_kwh,
      _state.energia_regenerada_total_kwh,
      _sessao.dificuldade.bonus_energia
    );

    emitir('concluido', { resultado, sessao: _sessao, state: _state });
  }

  /* === CONTROLES DO MAQUINISTA === */

  /**
   * Aumenta tração (0-8)
   */
  function aumentarTracao() {
    if (!_running || _paused) return;

    /* Tração e freio são mutuamente exclusivos */
    if (_state.notch_freio_dinamico > 0 || _state.notch_freio_pneumatico > 0) {
      return;
    }

    if (_state.notch_tracao < 8) {
      _state.notch_tracao++;
      T4.utils.vibrate(10);
      emitir('controle', { tipo: 'tracao', valor: _state.notch_tracao });
    }
  }

  /**
   * Reduz tração
   */
  function reduzirTracao() {
    if (!_running || _paused) return;

    if (_state.notch_tracao > 0) {
      _state.notch_tracao--;
      T4.utils.vibrate(10);
      emitir('controle', { tipo: 'tracao', valor: _state.notch_tracao });
    }
  }

  /**
   * Aplica freio (dinâmico primeiro, depois pneumático)
   */
  function aplicarFreio() {
    if (!_running || _paused) return;

    /* Zera tração ao frear */
    _state.notch_tracao = 0;

    if (_state.notch_freio_dinamico < 8) {
      _state.notch_freio_dinamico++;
      T4.utils.vibrate(15);
      emitir('controle', { tipo: 'freio_dinamico', valor: _state.notch_freio_dinamico });
    } else if (_state.notch_freio_pneumatico < 8) {
      _state.notch_freio_pneumatico++;
      T4.utils.vibrate([15, 10, 15]);
      emitir('controle', { tipo: 'freio_pneumatico', valor: _state.notch_freio_pneumatico });
    }
  }

  /**
   * Alivia freio
   */
  function aliviarFreio() {
    if (!_running || _paused) return;

    if (_state.notch_freio_pneumatico > 0) {
      _state.notch_freio_pneumatico--;
      T4.utils.vibrate(10);
      emitir('controle', { tipo: 'freio_pneumatico', valor: _state.notch_freio_pneumatico });
    } else if (_state.notch_freio_dinamico > 0) {
      _state.notch_freio_dinamico--;
      T4.utils.vibrate(10);
      emitir('controle', { tipo: 'freio_dinamico', valor: _state.notch_freio_dinamico });
    }
  }

  /**
   * Frenagem de emergência
   */
  function emergencia() {
    if (!_running || _paused) return;

    _state.notch_tracao = 0;
    _state.notch_freio_dinamico = 8;
    _state.notch_freio_pneumatico = 8;

    T4.utils.vibrate([50, 30, 50, 30, 100]);
    emitir('controle', { tipo: 'emergencia' });
    emitir('evento', { tipo: 'emergencia' });

    /* Penalidade por uso de emergência */
    _scoring.penalidades.frenagem_brusca += _sessao.dificuldade.penalidade_frenagem * 3;
  }

  /* === SISTEMA DE EVENTOS === */

  function on(evento, callback) {
    if (!_callbacks[evento]) _callbacks[evento] = [];
    _callbacks[evento].push(callback);
  }

  function off(evento, callback) {
    if (!_callbacks[evento]) return;
    _callbacks[evento] = _callbacks[evento].filter(cb => cb !== callback);
  }

  function emitir(evento, data) {
    if (!_callbacks[evento]) return;
    _callbacks[evento].forEach(cb => cb(data));
  }

  /* === GETTERS === */

  function getState() {
    return _state ? { ..._state } : null;
  }

  function getScoring() {
    return _scoring;
  }

  function getSessao() {
    return _sessao;
  }

  function isRunning() {
    return _running;
  }

  function isPaused() {
    return _paused;
  }

  /**
   * Limpa recursos da simulação
   */
  function destruir() {
    parar();
    _sessao = null;
    _state = null;
    _scoring = null;
    _trackProfile = null;
    _restrictions = null;
    _stations = null;
    _callbacks = {};
    _eventosProcessados.clear();
  }

  return {
    inicializar,
    iniciar,
    pausar,
    resumir,
    parar,
    concluir,
    aumentarTracao,
    reduzirTracao,
    aplicarFreio,
    aliviarFreio,
    emergencia,
    on,
    off,
    getState,
    getScoring,
    getSessao,
    isRunning,
    isPaused,
    destruir
  };
})();
