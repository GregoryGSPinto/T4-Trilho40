/* ============================================
   EFVM 360 — Motor de Física
   Modelo simplificado de dinâmica ferroviária
   ============================================ */

const EFVM360Physics = (function () {
  'use strict';

  /* === TIPOS DE TREM === */
  const TRAIN_TYPES = {
    M346: {
      id: 'M346',
      nome: 'Trem de Minério M346',
      descricao: 'Composição carregada de minério de ferro',
      locomotivas: 3,
      vagoes: 252,
      peso_vazio_t: 4200,
      peso_carregado_t: 15000,
      comprimento_m: 2700,
      potencia_kw: 9600,
      esforco_max_kn: 850,
      velocidade_max_kmh: 60,
      freio_dinamico_kn: 600,
      freio_pneumatico_kn: 1200,
      aderencia: 0.25,
      coef_arrasto: 0.012,
      area_frontal_m2: 12
    },
    G411: {
      id: 'G411',
      nome: 'Trem de Carga Geral G411',
      descricao: 'Composição mista de carga geral',
      locomotivas: 2,
      vagoes: 120,
      peso_vazio_t: 2400,
      peso_carregado_t: 8000,
      comprimento_m: 1500,
      potencia_kw: 6400,
      esforco_max_kn: 580,
      velocidade_max_kmh: 70,
      freio_dinamico_kn: 420,
      freio_pneumatico_kn: 800,
      aderencia: 0.28,
      coef_arrasto: 0.010,
      area_frontal_m2: 11
    },
    C511: {
      id: 'C511',
      nome: 'Trem de Carga Diversa C511',
      descricao: 'Composição de contêineres e carga diversa',
      locomotivas: 2,
      vagoes: 80,
      peso_vazio_t: 1600,
      peso_carregado_t: 6000,
      comprimento_m: 1100,
      potencia_kw: 6400,
      esforco_max_kn: 520,
      velocidade_max_kmh: 70,
      freio_dinamico_kn: 400,
      freio_pneumatico_kn: 650,
      aderencia: 0.28,
      coef_arrasto: 0.011,
      area_frontal_m2: 11
    },
    P521: {
      id: 'P521',
      nome: 'Trem de Passageiros P521',
      descricao: 'Composição de passageiros da EFVM',
      locomotivas: 1,
      vagoes: 18,
      peso_vazio_t: 600,
      peso_carregado_t: 1500,
      comprimento_m: 420,
      potencia_kw: 3200,
      esforco_max_kn: 260,
      velocidade_max_kmh: 80,
      freio_dinamico_kn: 200,
      freio_pneumatico_kn: 350,
      aderencia: 0.30,
      coef_arrasto: 0.008,
      area_frontal_m2: 10
    }
  };

  /* === CONSTANTES FÍSICAS === */
  const GRAVITY = 9.81;
  const AIR_DENSITY = 1.225;
  const ROLLING_FRICTION = 0.002;
  const CURVE_RESISTANCE_FACTOR = 700;

  /**
   * Calcula a resistência total ao movimento em kN
   * @param {object} train - Dados do trem
   * @param {number} speed_ms - Velocidade em m/s
   * @param {number} gradient_pct - Gradiente em percentual (positivo = subida)
   * @param {number} curve_radius - Raio da curva em metros (0 = reta)
   * @returns {number} Resistência total em kN
   */
  function calcularResistencia(train, speed_ms, gradient_pct, curve_radius) {
    const peso_kn = train.peso_atual_t * GRAVITY;

    /* Resistência ao rolamento (atrito trilho-roda) */
    const res_rolamento = ROLLING_FRICTION * peso_kn;

    /* Resistência aerodinâmica */
    const res_aero = 0.5 * AIR_DENSITY * train.coef_arrasto * train.area_frontal_m2 * speed_ms * speed_ms / 1000;

    /* Resistência de rampa/gradiente */
    const res_rampa = peso_kn * (gradient_pct / 100);

    /* Resistência de curva */
    let res_curva = 0;
    if (curve_radius > 0) {
      res_curva = CURVE_RESISTANCE_FACTOR / curve_radius * peso_kn / 1000;
    }

    return res_rolamento + res_aero + res_rampa + res_curva;
  }

  /**
   * Calcula a força de tração disponível em kN
   * @param {object} train - Dados do trem
   * @param {number} notch - Posição do acelerador (0-8)
   * @param {number} speed_ms - Velocidade em m/s
   * @returns {number} Força de tração em kN
   */
  function calcularTracao(train, notch, speed_ms) {
    if (notch <= 0) return 0;

    const fator_notch = notch / 8;
    const speed_kmh = speed_ms * 3.6;

    /* Curva de tração: esforço máximo até 20 km/h, depois reduz com velocidade */
    let esforco;
    if (speed_kmh <= 20) {
      esforco = train.esforco_max_kn * fator_notch;
    } else {
      const fator_velocidade = Math.min(1, 20 / speed_kmh);
      const esforco_base = train.esforco_max_kn * fator_notch;
      const esforco_potencia = (train.potencia_kw * fator_notch) / Math.max(speed_ms, 0.1) / 1000 * GRAVITY;
      esforco = Math.min(esforco_base, esforco_potencia, esforco_base * fator_velocidade + esforco_potencia * (1 - fator_velocidade));
    }

    /* Limite de aderência */
    const peso_locomotivas_kn = (train.peso_atual_t / (train.locomotivas + train.vagoes)) * train.locomotivas * GRAVITY;
    const limite_aderencia = peso_locomotivas_kn * train.aderencia;

    return Math.min(esforco, limite_aderencia);
  }

  /**
   * Calcula a força de frenagem dinâmica (reostática) em kN
   * @param {object} train - Dados do trem
   * @param {number} nivel - Nível de freio dinâmico (0-8)
   * @param {number} speed_ms - Velocidade em m/s
   * @returns {number} Força de frenagem em kN
   */
  function calcularFreioDinamico(train, nivel, speed_ms) {
    if (nivel <= 0 || speed_ms < 0.5) return 0;

    const fator = nivel / 8;
    const speed_kmh = speed_ms * 3.6;

    /* Freio dinâmico é mais eficiente em velocidades médias */
    let eficiencia;
    if (speed_kmh < 10) {
      eficiencia = speed_kmh / 10;
    } else if (speed_kmh < 50) {
      eficiencia = 1.0;
    } else {
      eficiencia = Math.max(0.5, 1.0 - (speed_kmh - 50) / 100);
    }

    return train.freio_dinamico_kn * fator * eficiencia;
  }

  /**
   * Calcula a força de frenagem pneumática em kN
   * @param {object} train - Dados do trem
   * @param {number} nivel - Nível de freio pneumático (0-8)
   * @returns {number} Força de frenagem em kN
   */
  function calcularFreioPneumatico(train, nivel) {
    if (nivel <= 0) return 0;

    const fator = nivel / 8;
    return train.freio_pneumatico_kn * fator;
  }

  /**
   * Calcula a aceleração resultante em m/s²
   * @param {object} state - Estado atual da simulação
   * @returns {object} { aceleracao, forcas }
   */
  function calcularAceleracao(state) {
    const train = state.trem;
    const speed_ms = state.velocidade_ms;
    const gradient = state.gradiente;
    const curve = state.raio_curva;
    const notch = state.notch_tracao;
    const freio_din = state.notch_freio_dinamico;
    const freio_pneu = state.notch_freio_pneumatico;

    const forca_tracao = calcularTracao(train, notch, speed_ms);
    const forca_resistencia = calcularResistencia(train, speed_ms, gradient, curve);
    const forca_freio_din = calcularFreioDinamico(train, freio_din, speed_ms);
    const forca_freio_pneu = calcularFreioPneumatico(train, freio_pneu);

    const forca_total_kn = forca_tracao - forca_resistencia - forca_freio_din - forca_freio_pneu;

    /* F = ma => a = F/m (convertendo kN para N, t para kg) */
    const massa_kg = train.peso_atual_t * 1000;
    /* Fator de massa rotativa (inércia de rodas, eixos, etc.) */
    const fator_inercial = 1.06;
    const aceleracao = (forca_total_kn * 1000) / (massa_kg * fator_inercial);

    return {
      aceleracao,
      forcas: {
        tracao_kn: forca_tracao,
        resistencia_kn: forca_resistencia,
        freio_dinamico_kn: forca_freio_din,
        freio_pneumatico_kn: forca_freio_pneu,
        total_kn: forca_total_kn
      }
    };
  }

  /**
   * Atualiza o estado físico do trem em um passo de tempo
   * @param {object} state - Estado atual
   * @param {number} dt - Delta time em segundos
   * @returns {object} Novo estado parcial (velocidade, posição)
   */
  function atualizar(state, dt) {
    const { aceleracao, forcas } = calcularAceleracao(state);

    let nova_velocidade_ms = state.velocidade_ms + aceleracao * dt;

    /* Não permite velocidade negativa (trem não anda para trás) */
    if (nova_velocidade_ms < 0) {
      nova_velocidade_ms = 0;
    }

    /* Limite de velocidade do trem */
    const vel_max_ms = state.trem.velocidade_max_kmh / 3.6;
    if (nova_velocidade_ms > vel_max_ms) {
      nova_velocidade_ms = vel_max_ms;
    }

    /* Atualiza posição (km) */
    const deslocamento_m = ((state.velocidade_ms + nova_velocidade_ms) / 2) * dt;
    const nova_posicao_km = state.posicao_km + (deslocamento_m / 1000);

    /* Consumo energético simplificado (kWh) */
    const potencia_utilizada_kw = (forcas.tracao_kn > 0)
      ? (forcas.tracao_kn * state.velocidade_ms) / 0.85
      : 0;
    const energia_consumida_kwh = (potencia_utilizada_kw * dt) / 3600;

    /* Energia regenerada pelo freio dinâmico */
    const potencia_regenerada_kw = (forcas.freio_dinamico_kn > 0)
      ? (forcas.freio_dinamico_kn * state.velocidade_ms) * 0.30
      : 0;
    const energia_regenerada_kwh = (potencia_regenerada_kw * dt) / 3600;

    return {
      velocidade_ms: nova_velocidade_ms,
      velocidade_kmh: nova_velocidade_ms * 3.6,
      posicao_km: nova_posicao_km,
      aceleracao_ms2: aceleracao,
      forcas,
      energia_consumida_kwh,
      energia_regenerada_kwh,
      deslocamento_m
    };
  }

  /**
   * Verifica se há risco de patinação (perda de aderência)
   * @param {object} train - Dados do trem
   * @param {number} notch - Notch de tração
   * @param {number} speed_ms - Velocidade
   * @param {number} gradient - Gradiente
   * @returns {boolean}
   */
  function verificarPatinacao(train, notch, speed_ms, gradient) {
    if (notch <= 0) return false;

    const forca = calcularTracao(train, notch, speed_ms);
    const peso_loco_kn = (train.peso_atual_t / (train.locomotivas + train.vagoes)) * train.locomotivas * GRAVITY;
    const limite = peso_loco_kn * train.aderencia;

    /* Gradiente alto reduz aderência efetiva */
    const fator_rampa = 1 - Math.abs(gradient) / 100 * 0.5;

    return forca > (limite * fator_rampa * 0.95);
  }

  /**
   * Calcula distância de frenagem estimada em metros
   * @param {object} train - Dados do trem
   * @param {number} speed_ms - Velocidade atual
   * @param {number} gradient - Gradiente
   * @returns {number} Distância em metros
   */
  function distanciaFrenagem(train, speed_ms, gradient) {
    if (speed_ms <= 0) return 0;

    /* Estimativa com freio máximo (dinâmico + pneumático) */
    const forca_freio = train.freio_dinamico_kn + train.freio_pneumatico_kn;
    const peso_kn = train.peso_atual_t * GRAVITY;
    const res_rampa = peso_kn * (gradient / 100);
    const forca_total = forca_freio + res_rampa;

    const massa_kg = train.peso_atual_t * 1000;
    const desaceleracao = (forca_total * 1000) / (massa_kg * 1.06);

    if (desaceleracao <= 0) return Infinity;

    /* d = v² / (2a) */
    return (speed_ms * speed_ms) / (2 * desaceleracao);
  }

  /**
   * Retorna dados de um tipo de trem
   * @param {string} tipo - ID do tipo (M346, G411, etc.)
   * @param {boolean} carregado - Se está carregado ou vazio
   * @returns {object}
   */
  function getTrem(tipo, carregado) {
    const base = TRAIN_TYPES[tipo];
    if (!base) return null;

    return {
      ...base,
      peso_atual_t: carregado ? base.peso_carregado_t : base.peso_vazio_t,
      carregado
    };
  }

  /**
   * Lista todos os tipos de trem disponíveis
   * @returns {object}
   */
  function getTrens() {
    return { ...TRAIN_TYPES };
  }

  return {
    calcularResistencia,
    calcularTracao,
    calcularFreioDinamico,
    calcularFreioPneumatico,
    calcularAceleracao,
    atualizar,
    verificarPatinacao,
    distanciaFrenagem,
    getTrem,
    getTrens,
    GRAVITY,
    AIR_DENSITY
  };
})();
