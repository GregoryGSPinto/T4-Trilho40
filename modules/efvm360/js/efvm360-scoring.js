/* ============================================
   EFVM 360 — Sistema de Pontuação
   Avaliação de desempenho do maquinista
   ============================================ */

const EFVM360Scoring = (function () {
  'use strict';

  /**
   * Cria um registro de pontuação limpo
   * @returns {object}
   */
  function criarRegistro() {
    return {
      pontuacao_base: 100,
      penalidades: {
        excesso_velocidade: 0,
        frenagem_brusca: 0,
        violacao_sinal: 0,
        parada_imprecisa: 0,
        conforto_passageiros: 0
      },
      bonus: {
        parada_precisa: 0,
        eficiencia_energia: 0,
        condução_suave: 0
      },
      estatisticas: {
        velocidade_maxima_kmh: 0,
        velocidade_media_kmh: 0,
        tempo_total_s: 0,
        distancia_total_km: 0,
        energia_consumida_kwh: 0,
        energia_regenerada_kwh: 0,
        frenagens_bruscas: 0,
        excessos_velocidade: 0,
        violacoes_sinal: 0,
        paradas_realizadas: 0,
        paradas_precisas: 0,
        aceleracao_maxima_ms2: 0,
        desaceleracao_maxima_ms2: 0,
        amostras_velocidade: [],
        tempo_em_excesso_s: 0
      },
      eventos: [],
      pontuacao_final: 100,
      classificacao: 'S'
    };
  }

  /**
   * Registra um evento de excesso de velocidade
   * @param {object} registro - Registro de pontuação
   * @param {number} velocidade_kmh - Velocidade atual
   * @param {number} limite_kmh - Limite de velocidade
   * @param {number} tolerancia_kmh - Tolerância da dificuldade
   * @param {number} fator_penalidade - Fator multiplicador da dificuldade
   * @param {number} dt - Delta time
   */
  function registrarExcessoVelocidade(registro, velocidade_kmh, limite_kmh, tolerancia_kmh, fator_penalidade, dt) {
    const excesso = velocidade_kmh - limite_kmh - tolerancia_kmh;
    if (excesso <= 0) return;

    const penalidade = excesso * fator_penalidade * dt * 0.1;
    registro.penalidades.excesso_velocidade += penalidade;
    registro.estatisticas.tempo_em_excesso_s += dt;

    if (excesso > 5) {
      registro.estatisticas.excessos_velocidade++;
      registro.eventos.push({
        tipo: 'excesso_velocidade',
        timestamp: Date.now(),
        velocidade: velocidade_kmh,
        limite: limite_kmh,
        excesso: excesso,
        descricao: `Excesso de ${excesso.toFixed(0)} km/h (${velocidade_kmh.toFixed(0)}/${limite_kmh.toFixed(0)} km/h)`
      });
    }
  }

  /**
   * Registra uma frenagem brusca
   * @param {object} registro - Registro de pontuação
   * @param {number} desaceleracao_ms2 - Desaceleração em m/s²
   * @param {number} fator_penalidade - Fator multiplicador
   * @param {boolean} passageiros - Se é trem de passageiros
   */
  function registrarFrenagemBrusca(registro, desaceleracao_ms2, fator_penalidade, passageiros) {
    const limite = passageiros ? 0.8 : 1.2;
    const des_abs = Math.abs(desaceleracao_ms2);

    if (des_abs > limite) {
      const penalidade = (des_abs - limite) * fator_penalidade * 2;
      registro.penalidades.frenagem_brusca += penalidade;
      registro.estatisticas.frenagens_bruscas++;

      if (passageiros) {
        const pen_conforto = (des_abs - limite) * fator_penalidade;
        registro.penalidades.conforto_passageiros += pen_conforto;
      }

      registro.eventos.push({
        tipo: 'frenagem_brusca',
        timestamp: Date.now(),
        desaceleracao: des_abs,
        descricao: `Frenagem brusca: ${des_abs.toFixed(2)} m/s²`
      });
    }

    if (des_abs > registro.estatisticas.desaceleracao_maxima_ms2) {
      registro.estatisticas.desaceleracao_maxima_ms2 = des_abs;
    }
  }

  /**
   * Registra violação de sinal
   * @param {object} registro - Registro de pontuação
   * @param {string} aspecto - Aspecto do sinal violado
   * @param {number} penalidade_base - Penalidade base da dificuldade
   */
  function registrarViolacaoSinal(registro, aspecto, penalidade_base) {
    const fator = aspecto === 'vermelho' ? 2.0 : 1.0;
    const penalidade = penalidade_base * fator;
    registro.penalidades.violacao_sinal += penalidade;
    registro.estatisticas.violacoes_sinal++;

    registro.eventos.push({
      tipo: 'violacao_sinal',
      timestamp: Date.now(),
      aspecto,
      descricao: `Violação de sinal ${aspecto}`
    });
  }

  /**
   * Registra parada em estação
   * @param {object} registro - Registro de pontuação
   * @param {string} estacao - Código da estação
   * @param {number} erro_m - Erro de posicionamento em metros
   * @param {number} tolerancia_m - Tolerância da dificuldade
   * @param {number} bonus_base - Bônus base da dificuldade
   */
  function registrarParada(registro, estacao, erro_m, tolerancia_m, bonus_base) {
    registro.estatisticas.paradas_realizadas++;

    if (erro_m <= tolerancia_m) {
      registro.estatisticas.paradas_precisas++;
      const fator_precisao = 1 - (erro_m / tolerancia_m);
      const bonus = bonus_base * fator_precisao;
      registro.bonus.parada_precisa += bonus;

      registro.eventos.push({
        tipo: 'parada_precisa',
        timestamp: Date.now(),
        estacao,
        erro_m,
        bonus,
        descricao: `Parada precisa em ${estacao} (erro: ${erro_m.toFixed(0)}m)`
      });
    } else {
      const penalidade = (erro_m - tolerancia_m) * 0.1;
      registro.penalidades.parada_imprecisa += penalidade;

      registro.eventos.push({
        tipo: 'parada_imprecisa',
        timestamp: Date.now(),
        estacao,
        erro_m,
        descricao: `Parada imprecisa em ${estacao} (erro: ${erro_m.toFixed(0)}m)`
      });
    }
  }

  /**
   * Atualiza estatísticas a cada frame
   * @param {object} registro - Registro de pontuação
   * @param {number} velocidade_kmh - Velocidade atual
   * @param {number} aceleracao_ms2 - Aceleração atual
   * @param {number} dt - Delta time
   */
  function atualizarEstatisticas(registro, velocidade_kmh, aceleracao_ms2, dt) {
    if (velocidade_kmh > registro.estatisticas.velocidade_maxima_kmh) {
      registro.estatisticas.velocidade_maxima_kmh = velocidade_kmh;
    }

    if (aceleracao_ms2 > registro.estatisticas.aceleracao_maxima_ms2) {
      registro.estatisticas.aceleracao_maxima_ms2 = aceleracao_ms2;
    }

    registro.estatisticas.amostras_velocidade.push(velocidade_kmh);

    /* Limita amostras para economizar memória */
    if (registro.estatisticas.amostras_velocidade.length > 5000) {
      const reduzido = [];
      for (let i = 0; i < registro.estatisticas.amostras_velocidade.length; i += 2) {
        reduzido.push(registro.estatisticas.amostras_velocidade[i]);
      }
      registro.estatisticas.amostras_velocidade = reduzido;
    }
  }

  /**
   * Calcula pontuação final
   * @param {object} registro - Registro de pontuação
   * @param {number} energia_consumida - Total em kWh
   * @param {number} energia_regenerada - Total regenerado em kWh
   * @param {number} bonus_energia_base - Bônus base para eficiência
   * @returns {object} Resultado final
   */
  function calcularFinal(registro, energia_consumida, energia_regenerada, bonus_energia_base) {
    /* Bônus de eficiência energética */
    if (energia_consumida > 0) {
      const razao_regeneracao = energia_regenerada / energia_consumida;
      registro.bonus.eficiencia_energia = razao_regeneracao * bonus_energia_base * 10;
    }

    /* Bônus de condução suave */
    if (registro.estatisticas.frenagens_bruscas === 0) {
      registro.bonus.condução_suave = 5;
    }

    registro.estatisticas.energia_consumida_kwh = energia_consumida;
    registro.estatisticas.energia_regenerada_kwh = energia_regenerada;

    /* Velocidade média */
    const amostras = registro.estatisticas.amostras_velocidade;
    if (amostras.length > 0) {
      registro.estatisticas.velocidade_media_kmh = amostras.reduce((a, b) => a + b, 0) / amostras.length;
    }

    /* Cálculo final */
    const total_penalidades =
      registro.penalidades.excesso_velocidade +
      registro.penalidades.frenagem_brusca +
      registro.penalidades.violacao_sinal +
      registro.penalidades.parada_imprecisa +
      registro.penalidades.conforto_passageiros;

    const total_bonus =
      registro.bonus.parada_precisa +
      registro.bonus.eficiencia_energia +
      registro.bonus.condução_suave;

    registro.pontuacao_final = Math.max(0, Math.min(100,
      registro.pontuacao_base - total_penalidades + total_bonus
    ));

    registro.pontuacao_final = Math.round(registro.pontuacao_final * 10) / 10;

    /* Classificação */
    if (registro.pontuacao_final >= 95) registro.classificacao = 'S';
    else if (registro.pontuacao_final >= 85) registro.classificacao = 'A';
    else if (registro.pontuacao_final >= 70) registro.classificacao = 'B';
    else if (registro.pontuacao_final >= 55) registro.classificacao = 'C';
    else if (registro.pontuacao_final >= 40) registro.classificacao = 'D';
    else registro.classificacao = 'F';

    /* Remove amostras detalhadas para salvar espaço */
    delete registro.estatisticas.amostras_velocidade;

    return registro;
  }

  /**
   * Salva resultado no IndexedDB
   * @param {object} registro - Registro final
   * @param {object} sessao - Dados da sessão (cenário, dificuldade, etc.)
   * @returns {Promise}
   */
  async function salvarResultado(registro, sessao) {
    const user = T4.auth.getUser();

    const resultado = {
      id: T4.utils.uid(),
      type: 'simulation_result',
      timestamp: Date.now(),
      usuario: user ? user.nome : 'Convidado',
      matricula: user ? user.matricula : '0000',
      cenario_id: sessao.cenario.id,
      cenario_nome: sessao.cenario.nome,
      dificuldade_id: sessao.dificuldade.id,
      dificuldade_nome: sessao.dificuldade.nome,
      trem_tipo: sessao.trem.id,
      pontuacao: registro.pontuacao_final,
      classificacao: registro.classificacao,
      penalidades: { ...registro.penalidades },
      bonus: { ...registro.bonus },
      estatisticas: { ...registro.estatisticas },
      eventos_count: registro.eventos.length
    };

    await T4.storage.put('efvm360_scores', resultado);
    return resultado;
  }

  /**
   * Carrega histórico de resultados
   * @returns {Promise<Array>}
   */
  async function carregarHistorico() {
    const resultados = await T4.storage.getAll('efvm360_scores');
    return resultados.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Carrega melhor resultado para um cenário
   * @param {string} cenarioId
   * @returns {Promise<object|null>}
   */
  async function melhorResultado(cenarioId) {
    const todos = await carregarHistorico();
    const filtrados = todos.filter(r => r.cenario_id === cenarioId);
    if (filtrados.length === 0) return null;
    return filtrados.reduce((melhor, atual) =>
      atual.pontuacao > melhor.pontuacao ? atual : melhor
    );
  }

  return {
    criarRegistro,
    registrarExcessoVelocidade,
    registrarFrenagemBrusca,
    registrarViolacaoSinal,
    registrarParada,
    atualizarEstatisticas,
    calcularFinal,
    salvarResultado,
    carregarHistorico,
    melhorResultado
  };
})();
