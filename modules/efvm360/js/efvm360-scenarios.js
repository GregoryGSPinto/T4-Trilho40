/* ============================================
   EFVM 360 — Cenários de Treinamento
   Definições de cenários e dificuldades
   ============================================ */

const EFVM360Scenarios = (function () {
  'use strict';

  /* === NÍVEIS DE DIFICULDADE === */
  const DIFICULDADES = {
    iniciante: {
      id: 'iniciante',
      nome: 'Iniciante',
      descricao: 'Tolerâncias amplas, sem penalidades severas',
      tolerancia_velocidade_kmh: 10,
      tolerancia_parada_m: 50,
      penalidade_velocidade: 0.5,
      penalidade_frenagem: 0.3,
      penalidade_sinal: 5,
      bonus_parada: 10,
      bonus_energia: 5,
      sinais_ativos: false,
      boll_ativo: false,
      tempo_real: false,
      fator_tempo: 4
    },
    intermediario: {
      id: 'intermediario',
      nome: 'Intermediário',
      descricao: 'Tolerâncias moderadas, sinais ativos',
      tolerancia_velocidade_kmh: 5,
      tolerancia_parada_m: 25,
      penalidade_velocidade: 1.0,
      penalidade_frenagem: 0.7,
      penalidade_sinal: 10,
      bonus_parada: 15,
      bonus_energia: 8,
      sinais_ativos: true,
      boll_ativo: false,
      tempo_real: false,
      fator_tempo: 3
    },
    avancado: {
      id: 'avancado',
      nome: 'Avançado',
      descricao: 'Tolerâncias reduzidas, BOLL ativo',
      tolerancia_velocidade_kmh: 3,
      tolerancia_parada_m: 15,
      penalidade_velocidade: 2.0,
      penalidade_frenagem: 1.5,
      penalidade_sinal: 20,
      bonus_parada: 20,
      bonus_energia: 12,
      sinais_ativos: true,
      boll_ativo: true,
      tempo_real: false,
      fator_tempo: 2
    },
    realista: {
      id: 'realista',
      nome: 'Realista',
      descricao: 'Sem tolerância, penalidade máxima, tempo real',
      tolerancia_velocidade_kmh: 0,
      tolerancia_parada_m: 10,
      penalidade_velocidade: 3.0,
      penalidade_frenagem: 2.5,
      penalidade_sinal: 30,
      bonus_parada: 25,
      bonus_energia: 15,
      sinais_ativos: true,
      boll_ativo: true,
      tempo_real: true,
      fator_tempo: 1
    }
  };

  /* === CENÁRIOS === */
  const CENARIOS = [
    {
      id: 'minerio_carregado',
      nome: 'Minério Carregado — VFZ a VOD',
      descricao: 'Conduza uma composição de 252 vagões carregados de minério de ferro de Itabira até o porto de Tubarão. Trecho predominantemente em descida exigindo controle cuidadoso de velocidade.',
      trem_tipo: 'M346',
      carregado: true,
      rota: {
        origem_codigo: 'VFZ',
        origem_nome: 'Itabira (Mina de Cauê)',
        destino_codigo: 'VTS',
        destino_nome: 'Tubarão (Porto)',
        km_inicio: 905,
        km_fim: 0,
        direcao: 'descendente',
        extensao_km: 905
      },
      duracao_estimada_min: 240,
      icone: '⛏️',
      destaques: [
        'Composição pesada de 15.000 toneladas',
        'Descida da Serra do Caraça exige controle rigoroso',
        'Múltiplas restrições de velocidade em áreas urbanas'
      ],
      eventos: [
        { km: 870, tipo: 'sinal', aspecto: 'amarelo', descricao: 'Sinal de saída Itabira' },
        { km: 690, tipo: 'restricao', velocidade: 25, descricao: 'Serra do Caraça — Rampa crítica' },
        { km: 630, tipo: 'parada', estacao: 'SBA', descricao: 'Cruzamento em Santa Bárbara' },
        { km: 540, tipo: 'parada', estacao: 'JMV', descricao: 'Passagem por João Monlevade' },
        { km: 430, tipo: 'restricao', velocidade: 35, descricao: 'Travessia urbana Ipatinga' },
        { km: 280, tipo: 'sinal', aspecto: 'verde', descricao: 'Via livre Governador Valadares' },
        { km: 170, tipo: 'parada', estacao: 'CLT', descricao: 'Passagem por Colatina' },
        { km: 25, tipo: 'restricao', velocidade: 30, descricao: 'Aproximação Vitória' },
        { km: 5, tipo: 'restricao', velocidade: 20, descricao: 'Entrada no Pátio de Tubarão' }
      ]
    },
    {
      id: 'retorno_vazio',
      nome: 'Retorno Vazio — VOD a VFZ',
      descricao: 'Retorne com composição vazia de carga geral de Vitória até Itabira. Trecho em subida contínua exigindo bom gerenciamento de potência e consumo de energia.',
      trem_tipo: 'G411',
      carregado: false,
      rota: {
        origem_codigo: 'VOD',
        origem_nome: 'Vitória (Pedro Nolasco)',
        destino_codigo: 'VFZ',
        destino_nome: 'Itabira (Mina de Cauê)',
        km_inicio: 25,
        km_fim: 905,
        direcao: 'ascendente',
        extensao_km: 880
      },
      duracao_estimada_min: 200,
      icone: '🚂',
      destaques: [
        'Composição leve (2.400 t) permite boa aceleração',
        'Subida contínua exige potência máxima em trechos',
        'Gestão eficiente de energia é essencial'
      ],
      eventos: [
        { km: 30, tipo: 'sinal', aspecto: 'verde', descricao: 'Saída de Vitória' },
        { km: 170, tipo: 'parada', estacao: 'CLT', descricao: 'Parada em Colatina' },
        { km: 280, tipo: 'parada', estacao: 'GVD', descricao: 'Parada em Governador Valadares' },
        { km: 430, tipo: 'restricao', velocidade: 35, descricao: 'Travessia Ipatinga' },
        { km: 540, tipo: 'parada', estacao: 'JMV', descricao: 'Parada em João Monlevade' },
        { km: 600, tipo: 'restricao', velocidade: 35, descricao: 'Subida íngreme Serra' },
        { km: 690, tipo: 'restricao', velocidade: 25, descricao: 'Serra do Caraça — Potência máxima' },
        { km: 870, tipo: 'sinal', aspecto: 'amarelo', descricao: 'Aproximação Itabira' },
        { km: 900, tipo: 'restricao', velocidade: 20, descricao: 'Entrada pátio VFZ' }
      ]
    },
    {
      id: 'passageiros_vod_bh',
      nome: 'Passageiros — Vitória a BH',
      descricao: 'Conduza o famoso trem de passageiros da EFVM de Vitória até a região de Belo Horizonte (Barão de Cocais). Conforto dos passageiros e pontualidade são prioridade.',
      trem_tipo: 'P521',
      carregado: true,
      rota: {
        origem_codigo: 'VOD',
        origem_nome: 'Vitória (Pedro Nolasco)',
        destino_codigo: 'BDC',
        destino_nome: 'Barão de Cocais',
        km_inicio: 25,
        km_fim: 600,
        direcao: 'ascendente',
        extensao_km: 575
      },
      duracao_estimada_min: 160,
      icone: '🧳',
      destaques: [
        'Frenagens suaves para conforto dos passageiros',
        'Parada obrigatória em todas as estações de passageiros',
        'Pontualidade é avaliada na pontuação'
      ],
      eventos: [
        { km: 30, tipo: 'sinal', aspecto: 'verde', descricao: 'Saída Vitória' },
        { km: 170, tipo: 'parada', estacao: 'CLT', descricao: 'Embarque/desembarque Colatina', obrigatoria: true },
        { km: 280, tipo: 'parada', estacao: 'GVD', descricao: 'Embarque/desembarque Gov. Valadares', obrigatoria: true },
        { km: 430, tipo: 'parada', estacao: 'IPT', descricao: 'Embarque/desembarque Ipatinga', obrigatoria: true },
        { km: 440, tipo: 'parada', estacao: 'CFB', descricao: 'Embarque/desembarque Cel. Fabriciano', obrigatoria: true },
        { km: 540, tipo: 'parada', estacao: 'JMV', descricao: 'Embarque/desembarque João Monlevade', obrigatoria: true },
        { km: 595, tipo: 'sinal', aspecto: 'amarelo', descricao: 'Aproximação Barão de Cocais' },
        { km: 600, tipo: 'parada', estacao: 'BDC', descricao: 'Terminal Barão de Cocais', obrigatoria: true }
      ]
    }
  ];

  /**
   * Retorna todos os cenários
   * @returns {Array}
   */
  function getCenarios() {
    return CENARIOS.map(c => ({ ...c }));
  }

  /**
   * Retorna um cenário por ID
   * @param {string} id
   * @returns {object|null}
   */
  function getCenario(id) {
    const c = CENARIOS.find(c => c.id === id);
    return c ? { ...c } : null;
  }

  /**
   * Retorna todas as dificuldades
   * @returns {object}
   */
  function getDificuldades() {
    return { ...DIFICULDADES };
  }

  /**
   * Retorna uma dificuldade por ID
   * @param {string} id
   * @returns {object|null}
   */
  function getDificuldade(id) {
    return DIFICULDADES[id] ? { ...DIFICULDADES[id] } : null;
  }

  /**
   * Monta a configuração completa para uma sessão de simulação
   * @param {string} cenarioId
   * @param {string} dificuldadeId
   * @returns {object}
   */
  function montarSessao(cenarioId, dificuldadeId) {
    const cenario = getCenario(cenarioId);
    const dificuldade = getDificuldade(dificuldadeId);

    if (!cenario || !dificuldade) return null;

    const trem = EFVM360Physics.getTrem(cenario.trem_tipo, cenario.carregado);

    return {
      cenario,
      dificuldade,
      trem,
      estado_inicial: {
        posicao_km: cenario.rota.km_inicio,
        velocidade_ms: 0,
        velocidade_kmh: 0,
        notch_tracao: 0,
        notch_freio_dinamico: 0,
        notch_freio_pneumatico: 0,
        gradiente: 0,
        raio_curva: 0,
        velocidade_limite_kmh: 30,
        tempo_s: 0,
        energia_total_kwh: 0,
        energia_regenerada_total_kwh: 0,
        distancia_percorrida_km: 0,
        sinal_atual: 'verde',
        boll_estado: 'ativo',
        concluido: false
      }
    };
  }

  return {
    getCenarios,
    getCenario,
    getDificuldades,
    getDificuldade,
    montarSessao
  };
})();
