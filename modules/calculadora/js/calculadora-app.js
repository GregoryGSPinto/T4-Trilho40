/* ================================================================
   CALCULADORA FERROVIÁRIA — Main Application
   T4 Trilho 4.0 — EFVM Railway Calculator
   8 real-time calculators for train engineers
   ================================================================ */

(function () {
  'use strict';

  // === State ===
  var currentView = 'grid'; // 'grid' | 'detail'
  var currentCalc = null;
  var container = document.getElementById('calc-container');
  var backBtn = document.getElementById('calc-back');

  // === Calculator Definitions ===
  var calculators = [
    { id: 'peso-eixo',       icon: '\u2696\uFE0F', title: 'Peso por Eixo' },
    { id: 'acrescimo-10psi', icon: '\uD83D\uDD27', title: 'Acréscimo de 10psi' },
    { id: 'dist-frenagem',   icon: '\uD83D\uDED1', title: 'Distância de Frenagem' },
    { id: 'ton-metro',       icon: '\uD83D\uDCCF', title: 'Tonelada por Metro Linear' },
    { id: 'grad-compensado', icon: '\uD83D\uDCC8', title: 'Gradiente Compensado' },
    { id: 'tempo-percurso',  icon: '\u23F1\uFE0F', title: 'Tempo de Percurso' },
    { id: 'esforco-trator',  icon: '\uD83D\uDE82', title: 'Esforço Trator Necessário' },
    { id: 'vel-maxima',      icon: '\uD83D\uDEA6', title: 'Velocidade Máxima Autorizada' }
  ];

  // === Velocity data for VMA calculator ===
  var trechos = [
    { nome: 'Trecho geral',       carregado: 80, vazio: 80, passageiros: 80 },
    { nome: 'Área urbana',        carregado: 40, vazio: 50, passageiros: 60 },
    { nome: 'Pátio',              carregado: 15, vazio: 15, passageiros: 15 },
    { nome: 'Ponte/Viaduto',      carregado: 30, vazio: 40, passageiros: 40 },
    { nome: 'Túnel',              carregado: 60, vazio: 60, passageiros: 60 },
    { nome: 'Passagem de nível',  carregado: 30, vazio: 30, passageiros: 30 }
  ];

  // === Navigation ===
  backBtn.addEventListener('click', function () {
    if (currentView === 'detail') {
      showGrid();
    } else {
      window.location.href = '../../';
    }
  });

  // === Render Grid ===
  function showGrid() {
    currentView = 'grid';
    currentCalc = null;
    var html = '<div class="calc-grid">';
    calculators.forEach(function (calc) {
      html += '<div class="calc-grid-card" data-calc="' + calc.id + '">' +
        '<span class="calc-grid-icon">' + calc.icon + '</span>' +
        '<span class="calc-grid-label">' + calc.title + '</span>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    // Bind card clicks
    var cards = container.querySelectorAll('.calc-grid-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        openCalculator(card.getAttribute('data-calc'));
      });
    });
  }

  // === Open a Calculator ===
  function openCalculator(id) {
    currentView = 'detail';
    currentCalc = id;
    var calc = calculators.find(function (c) { return c.id === id; });
    if (!calc) return;

    var html = '<div class="calc-detail">' +
      '<div class="calc-detail-header">' +
      '<button class="calc-detail-back" id="detail-back" aria-label="Voltar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>' +
      '<span class="calc-detail-icon">' + calc.icon + '</span>' +
      '<h2 class="calc-detail-title">' + calc.title + '</h2>' +
      '</div>' +
      '<div class="calc-form" id="calc-form">' + renderForm(id) + '</div>' +
      '<div class="calc-result" id="calc-result">' +
      '<span class="calc-result-placeholder">Preencha os campos acima</span>' +
      '</div>' +
      renderInfo(id) +
      '</div>';

    container.innerHTML = html;

    // Bind back button
    document.getElementById('detail-back').addEventListener('click', function () {
      showGrid();
    });

    // Bind real-time calculation
    var form = document.getElementById('calc-form');
    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        calculate(id);
      });
      input.addEventListener('change', function () {
        calculate(id);
      });
    });
  }

  // === Form Renderers ===
  function renderForm(id) {
    switch (id) {
      case 'peso-eixo':
        return inputGroup('peso', 'Peso total (ton)', 'number', 'Ex: 130') +
          inputGroup('eixos', 'Número de eixos', 'number', 'Ex: 4');

      case 'acrescimo-10psi':
        return inputGroup('pressao', 'Pressão do encanamento geral (psi)', 'number', 'Ex: 90') +
          inputGroup('vagoes', 'Quantidade de vagões', 'number', 'Ex: 120');

      case 'dist-frenagem':
        return inputGroup('velocidade', 'Velocidade (km/h)', 'number', 'Ex: 60') +
          inputGroup('peso', 'Peso do trem (ton)', 'number', 'Ex: 16000') +
          inputGroup('gradiente', 'Gradiente (%)', 'number', 'Ex: -1.5') +
          selectGroup('tipoFreio', 'Tipo de freio', [
            { value: 'servico', label: 'Serviço' },
            { value: 'emergencia', label: 'Emergência' }
          ]);

      case 'ton-metro':
        return inputGroup('peso', 'Peso total (ton)', 'number', 'Ex: 16000') +
          inputGroup('comprimento', 'Comprimento (m)', 'number', 'Ex: 2700');

      case 'grad-compensado':
        return inputGroup('gradReal', 'Gradiente real (%)', 'number', 'Ex: 1.2') +
          inputGroup('raio', 'Raio da curva (m)', 'number', 'Ex: 300');

      case 'tempo-percurso':
        return inputGroup('distancia', 'Distância (km)', 'number', 'Ex: 305') +
          inputGroup('velocidade', 'Velocidade média (km/h)', 'number', 'Ex: 45');

      case 'esforco-trator':
        return inputGroup('peso', 'Peso do trem (ton)', 'number', 'Ex: 16000') +
          inputGroup('gradiente', 'Gradiente (%)', 'number', 'Ex: 1.0') +
          inputGroup('velocidade', 'Velocidade (km/h)', 'number', 'Ex: 40');

      case 'vel-maxima':
        return selectGroup('tipoTrem', 'Tipo do trem', [
            { value: 'carregado', label: 'Carregado' },
            { value: 'vazio', label: 'Vazio' },
            { value: 'passageiros', label: 'Passageiros' }
          ]) +
          selectGroup('trecho', 'Trecho', trechos.map(function (t, i) {
            return { value: String(i), label: t.nome };
          }));

      default:
        return '';
    }
  }

  function inputGroup(id, label, type, placeholder) {
    return '<div class="calc-input-group">' +
      '<label class="calc-label" for="calc-' + id + '">' + label + '</label>' +
      '<input class="calc-input" id="calc-' + id + '" type="' + type + '" inputmode="decimal" placeholder="' + placeholder + '" step="any" autocomplete="off">' +
      '</div>';
  }

  function selectGroup(id, label, options) {
    var html = '<div class="calc-input-group">' +
      '<label class="calc-label" for="calc-' + id + '">' + label + '</label>' +
      '<select class="calc-select" id="calc-' + id + '">';
    options.forEach(function (opt) {
      html += '<option value="' + opt.value + '">' + opt.label + '</option>';
    });
    html += '</select></div>';
    return html;
  }

  // === Info Renderers ===
  function renderInfo(id) {
    if (id === 'peso-eixo') {
      return '<div class="calc-info">Limite EFVM: 32,5 ton/eixo</div>';
    }
    return '';
  }

  // === Calculation Engine ===
  function calculate(id) {
    var result = document.getElementById('calc-result');

    switch (id) {
      case 'peso-eixo':
        calcPesoEixo(result);
        break;
      case 'acrescimo-10psi':
        calcAcrescimo(result);
        break;
      case 'dist-frenagem':
        calcDistFrenagem(result);
        break;
      case 'ton-metro':
        calcTonMetro(result);
        break;
      case 'grad-compensado':
        calcGradCompensado(result);
        break;
      case 'tempo-percurso':
        calcTempoPercurso(result);
        break;
      case 'esforco-trator':
        calcEsforcoTrator(result);
        break;
      case 'vel-maxima':
        calcVelMaxima(result);
        break;
    }
  }

  // === Helper: format number with comma decimal ===
  function fmt(num, decimals) {
    if (decimals === undefined) decimals = 1;
    return num.toFixed(decimals).replace('.', ',');
  }

  function getVal(id) {
    var el = document.getElementById('calc-' + id);
    if (!el) return NaN;
    return parseFloat(el.value);
  }

  function getSel(id) {
    var el = document.getElementById('calc-' + id);
    if (!el) return '';
    return el.value;
  }

  function setResult(el, html) {
    el.innerHTML = html;
    el.classList.add('calc-result--active');
  }

  function clearResult(el) {
    el.innerHTML = '<span class="calc-result-placeholder">Preencha os campos acima</span>';
    el.classList.remove('calc-result--active');
  }

  // === 1. Peso por Eixo ===
  function calcPesoEixo(el) {
    var peso = getVal('peso');
    var eixos = getVal('eixos');
    if (isNaN(peso) || isNaN(eixos) || eixos <= 0) { clearResult(el); return; }

    var pesoEixo = peso / eixos;
    var ok = pesoEixo <= 32.5;
    var statusHtml = ok
      ? '<div class="calc-status calc-status--ok">\u2705 Dentro do limite</div>'
      : '<div class="calc-status calc-status--alerta">\u26A0\uFE0F Acima do limite</div>';

    setResult(el,
      '<span class="calc-result-value">' + fmt(pesoEixo, 1) + ' ton/eixo</span>' +
      statusHtml
    );
  }

  // === 2. Acréscimo de 10psi ===
  function calcAcrescimo(el) {
    var pressao = getVal('pressao');
    var vagoes = getVal('vagoes');
    if (isNaN(pressao) || isNaN(vagoes) || vagoes < 0) { clearResult(el); return; }

    var acrescimo = vagoes * 0.5;
    var pressaoTotal = pressao + acrescimo;

    setResult(el,
      '<span class="calc-result-label">Acréscimo</span>' +
      '<span class="calc-result-value">' + fmt(acrescimo, 1) + ' psi</span>' +
      '<span class="calc-result-label" style="margin-top:12px">Pressão total</span>' +
      '<span class="calc-result-secondary">' + fmt(pressaoTotal, 1) + ' psi</span>'
    );
  }

  // === 3. Distância de Frenagem ===
  function calcDistFrenagem(el) {
    var velocidade = getVal('velocidade');
    var peso = getVal('peso');
    var gradiente = getVal('gradiente');
    var tipoFreio = getSel('tipoFreio');

    if (isNaN(velocidade) || isNaN(peso) || isNaN(gradiente)) { clearResult(el); return; }
    if (velocidade <= 0) { clearResult(el); return; }

    var v = velocidade / 3.6; // m/s
    var taxaFreio = tipoFreio === 'emergencia' ? 0.8 : 0.4;
    var compensacaoGrad = gradiente * 0.01 * 9.81;
    var desaceleracao = taxaFreio - compensacaoGrad;
    var desaceleracaoEfetiva = Math.max(desaceleracao, 0.1);
    var distancia = (v * v) / (2 * desaceleracaoEfetiva);
    var tempo = v / desaceleracaoEfetiva;

    setResult(el,
      '<span class="calc-result-value">' + fmt(distancia, 0) + ' metros</span>' +
      '<span class="calc-result-secondary">' + fmt(tempo, 1) + ' segundos</span>'
    );
  }

  // === 4. Tonelada por Metro Linear ===
  function calcTonMetro(el) {
    var peso = getVal('peso');
    var comprimento = getVal('comprimento');
    if (isNaN(peso) || isNaN(comprimento) || comprimento <= 0) { clearResult(el); return; }

    var tonMetro = peso / comprimento;

    setResult(el,
      '<span class="calc-result-value">' + fmt(tonMetro, 2) + ' ton/m</span>'
    );
  }

  // === 5. Gradiente Compensado ===
  function calcGradCompensado(el) {
    var gradReal = getVal('gradReal');
    var raio = getVal('raio');
    if (isNaN(gradReal) || isNaN(raio) || raio <= 0) { clearResult(el); return; }

    var resistenciaCurva = 500 / raio;
    var gradComp = gradReal + resistenciaCurva;

    setResult(el,
      '<span class="calc-result-label">Gradiente compensado</span>' +
      '<span class="calc-result-value">' + fmt(gradComp, 2) + '%</span>' +
      '<span class="calc-result-label" style="margin-top:12px">Resistência da curva</span>' +
      '<span class="calc-result-secondary">' + fmt(resistenciaCurva, 2) + '%</span>'
    );
  }

  // === 6. Tempo de Percurso ===
  function calcTempoPercurso(el) {
    var distancia = getVal('distancia');
    var velocidade = getVal('velocidade');
    if (isNaN(distancia) || isNaN(velocidade) || velocidade <= 0) { clearResult(el); return; }

    var tempoHoras = distancia / velocidade;
    var horas = Math.floor(tempoHoras);
    var minutos = Math.round((tempoHoras - horas) * 60);

    // Handle 60 minutes rounding
    if (minutos === 60) {
      horas += 1;
      minutos = 0;
    }

    var minStr = minutos < 10 ? '0' + minutos : String(minutos);

    setResult(el,
      '<span class="calc-result-value">' + horas + 'h ' + minStr + 'min</span>'
    );
  }

  // === 7. Esforço Trator Necessário ===
  function calcEsforcoTrator(el) {
    var peso = getVal('peso');
    var gradiente = getVal('gradiente');
    var velocidade = getVal('velocidade');
    if (isNaN(peso) || isNaN(gradiente) || isNaN(velocidade)) { clearResult(el); return; }
    if (peso <= 0) { clearResult(el); return; }

    var resistenciaBase = peso * 1.5; // kgf base rolling resistance
    var resistenciaGrad = peso * gradiente * 10; // kgf gradient resistance
    var esforco = resistenciaBase + resistenciaGrad;
    var locoNecessarias = Math.ceil(Math.max(esforco, 0) / 30000); // ~30000 kgf per loco
    if (locoNecessarias < 1) locoNecessarias = 1;

    setResult(el,
      '<span class="calc-result-label">Esforço trator</span>' +
      '<span class="calc-result-value">' + Math.round(esforco).toLocaleString('pt-BR') + ' kgf</span>' +
      '<span class="calc-result-label" style="margin-top:12px">Locomotivas (estimativa)</span>' +
      '<span class="calc-result-secondary">' + locoNecessarias + '</span>'
    );
  }

  // === 8. Velocidade Máxima Autorizada ===
  function calcVelMaxima(el) {
    var tipoTrem = getSel('tipoTrem');
    var trechoIdx = parseInt(getSel('trecho'), 10);

    if (isNaN(trechoIdx) || trechoIdx < 0 || trechoIdx >= trechos.length) { clearResult(el); return; }

    var trecho = trechos[trechoIdx];
    var vma = trecho[tipoTrem];

    if (vma === undefined) { clearResult(el); return; }

    setResult(el,
      '<span class="calc-result-value">' + vma + ' km/h</span>' +
      '<span class="calc-result-label">' + trecho.nome + '</span>'
    );
  }

  // === Init ===
  showGrid();

  // Trigger VMA calculation on load since it has default select values
  // (handled by user interaction)

})();
