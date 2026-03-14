(function () {
  'use strict';

  /* ======= CONSTANTS ======= */
  var STORAGE_PREFIX = 't4-boa-jornada-';
  var CHECKLIST_ITEMS = [
    'ATC', 'Lacre Supervisor Velocidade', 'Lacre BD26', 'Sino', 'Buzina',
    'Radio', 'Vidros', 'Truques', 'Extintores', 'Fusiveis',
    'Nivel de Agua', 'Motores de Tracao', 'Niveis de Areia', 'Cabo Jumper',
    'Ar Condicionado', 'Alertor', 'Farois', 'Teste Config. ATC',
    'Travamento de Portas', 'Limp. de Parabrisa', 'Oleo Carter',
    'Oleo Compressor', 'Kit Emergencia', 'Geladeira',
    'Condicoes Sanitario', 'Limpeza Cabine'
  ];

  var MERCADORIAS = ['Minerio de Ferro', 'Carvao', 'Pelota', 'Calcario', 'Container', 'Carga Geral', 'Vazio', 'Outro'];

  var container = document.getElementById('bj-container');
  var currentStep = 0; // 0=history, 1=dados, 2=checklist, 3=finalizar
  var formData = {};
  var viewingId = null; // if viewing a saved record
  var readOnly = false;

  /* ======= UTILS ======= */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(str) {
    if (!str) return '-';
    var parts = str.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return str;
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function getConfig(key) {
    try {
      var cfg = JSON.parse(localStorage.getItem('t4-config') || '{}');
      return cfg[key] || '';
    } catch (e) { return ''; }
  }

  function getUser() {
    try {
      var u = JSON.parse(localStorage.getItem('t4-user') || '{}');
      return u.nome || u.name || 'Maquinista';
    } catch (e) { return 'Maquinista'; }
  }

  /* ======= STORAGE ======= */
  function getAllSaved() {
    var items = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(STORAGE_PREFIX) === 0) {
        try {
          var data = JSON.parse(localStorage.getItem(key));
          data._key = key;
          items.push(data);
        } catch (e) {}
      }
    }
    items.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    return items;
  }

  function saveForm(data) {
    var key = STORAGE_PREFIX + Date.now();
    data.timestamp = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    return key;
  }

  function deleteForm(key) {
    localStorage.removeItem(key);
  }

  /* ======= INIT FORM DATA ======= */
  function initFormData() {
    formData = {
      data: todayStr(),
      vma: '',
      prefixo: '',
      osPl: '',
      comp: '',
      cauda: '',
      formacao: '',
      locomotivas: ['', '', '', ''],
      mct: '',
      mci: '',
      dca: '',
      qtdeVgs: '',
      peso: '',
      grad: '',
      vaz: '',
      acrescimo10psi: '',
      lotacao: [
        { qtd: '', mercadoria: '' },
        { qtd: '', mercadoria: '' },
        { qtd: '', mercadoria: '' }
      ],
      vagoesIsolados: [
        { pos1: '', vag1: '', pos2: '', vag2: '' },
        { pos1: '', vag1: '', pos2: '', vag2: '' },
        { pos1: '', vag1: '', pos2: '', vag2: '' }
      ],
      observacoesGerais: '',
      manuaisApertados: '',
      qtdeTrensEstacionados: '',
      qualLocomotiva: '',
      ultimoVgApertado: '',
      checklist: {},
      checklistObs: {},
      checklistObsGeral: '',
      fotoAnexo: null,
      fotoNome: '',
      maquinista: getUser(),
      patio: getConfig('patio')
    };
    CHECKLIST_ITEMS.forEach(function (item) {
      formData.checklist[item] = '';
      formData.checklistObs[item] = '';
    });
  }

  /* ======= BACK BUTTON ======= */
  document.getElementById('bj-back').addEventListener('click', function () {
    if (currentStep === 0) {
      window.location.href = '../../';
    } else {
      currentStep = 0;
      viewingId = null;
      readOnly = false;
      renderHistory();
    }
  });

  /* ======= RENDER HISTORY ======= */
  function renderHistory() {
    var saved = getAllSaved();
    var html = '<button class="bj-new-btn" id="bj-new">+ Nova Boa Jornada</button>';

    if (saved.length > 0) {
      html += '<div class="bj-history-title">HISTORICO</div>';
      saved.forEach(function (item) {
        var checkOk = 0;
        var checkTotal = CHECKLIST_ITEMS.length;
        CHECKLIST_ITEMS.forEach(function (ci) {
          if (item.checklist && item.checklist[ci]) checkOk++;
        });
        html += '<div class="bj-history-card" data-key="' + item._key + '">' +
          '<div class="bj-history-top">' +
            '<span class="bj-history-prefixo">' + (item.prefixo || 'Sem prefixo') + '</span>' +
            '<span class="bj-history-date">' + formatDate(item.data) + '</span>' +
          '</div>' +
          '<div class="bj-history-meta">' +
            '<span>' + checkOk + '/' + checkTotal + ' OK</span>' +
            '<span>' + (item.formacao || '-') + '</span>' +
            '<span>' + formatTime(item.timestamp) + '</span>' +
          '</div>' +
          '<div class="bj-history-actions">' +
            '<button class="bj-history-action-btn view-btn" data-key="' + item._key + '">Visualizar</button>' +
            '<button class="bj-history-action-btn delete" data-key="' + item._key + '">Excluir</button>' +
          '</div>' +
        '</div>';
      });
    } else {
      html += '<div class="bj-empty">Nenhuma Boa Jornada salva.<br>Crie uma nova para comecar.</div>';
    }

    container.innerHTML = html;

    document.getElementById('bj-new').addEventListener('click', function () {
      initFormData();
      viewingId = null;
      readOnly = false;
      currentStep = 1;
      renderStep1();
    });

    container.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var key = btn.getAttribute('data-key');
        try {
          formData = JSON.parse(localStorage.getItem(key));
          formData._key = key;
          viewingId = key;
          readOnly = true;
          currentStep = 1;
          renderStep1();
        } catch (err) {}
      });
    });

    container.querySelectorAll('.bj-history-action-btn.delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('Excluir esta Boa Jornada?')) {
          deleteForm(btn.getAttribute('data-key'));
          renderHistory();
        }
      });
    });
  }

  /* ======= PROGRESS BAR ======= */
  function progressHTML(step) {
    var s1 = step > 1 ? 'completed' : (step === 1 ? 'active' : '');
    var s2 = step > 2 ? 'completed' : (step === 2 ? 'active' : '');
    var s3 = step === 3 ? 'active' : '';
    var l1 = step > 1 ? 'completed' : '';
    var l2 = step > 2 ? 'completed' : '';
    return '<div class="bj-progress">' +
      '<div class="bj-step ' + s1 + '">' + (step > 1 ? '&#10003;' : '1') + '</div>' +
      '<div class="bj-step-line ' + l1 + '"></div>' +
      '<div class="bj-step ' + s2 + '">' + (step > 2 ? '&#10003;' : '2') + '</div>' +
      '<div class="bj-step-line ' + l2 + '"></div>' +
      '<div class="bj-step ' + s3 + '">3</div>' +
    '</div>';
  }

  /* ======= COLLECT STEP 1 DATA ======= */
  function collectStep1() {
    if (readOnly) return;
    var f = formData;
    var v = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    f.data = v('bj-data');
    f.vma = v('bj-vma');
    f.prefixo = v('bj-prefixo');
    f.osPl = v('bj-ospl');
    f.comp = v('bj-comp');
    f.cauda = v('bj-cauda');
    f.mct = v('bj-mct');
    f.mci = v('bj-mci');
    f.dca = v('bj-dca');
    f.qtdeVgs = v('bj-qtdevgs');
    f.peso = v('bj-peso');
    f.grad = v('bj-grad');
    f.vaz = v('bj-vaz');
    f.acrescimo10psi = v('bj-acrescimo');
    f.observacoesGerais = v('bj-obs-gerais');
    f.manuaisApertados = v('bj-manuais');
    f.qtdeTrensEstacionados = v('bj-qtde-trens');
    f.qualLocomotiva = v('bj-qual-loco');
    f.ultimoVgApertado = v('bj-ultimo-vg');

    // Locomotivas
    f.locomotivas = [];
    document.querySelectorAll('.bj-loco-input').forEach(function (inp) {
      f.locomotivas.push(inp.value);
    });

    // Lotacao
    f.lotacao = [];
    document.querySelectorAll('.bj-lotacao-row').forEach(function (row) {
      var inputs = row.querySelectorAll('input, select');
      f.lotacao.push({ qtd: inputs[0] ? inputs[0].value : '', mercadoria: inputs[1] ? inputs[1].value : '' });
    });

    // Vagoes isolados
    f.vagoesIsolados = [];
    document.querySelectorAll('.bj-vagoes-row').forEach(function (row) {
      var inputs = row.querySelectorAll('input');
      f.vagoesIsolados.push({
        pos1: inputs[0] ? inputs[0].value : '',
        vag1: inputs[1] ? inputs[1].value : '',
        pos2: inputs[2] ? inputs[2].value : '',
        vag2: inputs[3] ? inputs[3].value : ''
      });
    });
  }

  /* ======= RENDER STEP 1 ======= */
  function renderStep1() {
    var f = formData;
    var ro = readOnly ? ' readonly' : '';
    var dis = readOnly ? ' disabled' : '';
    var roClass = readOnly ? ' bj-readonly' : '';

    var mercOpts = '<option value="">Selecionar</option>';
    MERCADORIAS.forEach(function (m) { mercOpts += '<option value="' + m + '">' + m + '</option>'; });

    // Locomotivas
    var locoHTML = '<div class="bj-loco-grid">';
    (f.locomotivas || ['', '', '', '']).forEach(function (l, i) {
      locoHTML += '<div><label class="bj-label">Loco ' + (i + 1) + '</label>' +
        '<input type="text" class="bj-input bj-loco-input" value="' + (l || '') + '" placeholder="Num."' + ro + '></div>';
    });
    locoHTML += '</div>';
    if (!readOnly) {
      locoHTML += '<button class="bj-add-row-btn" id="bj-add-loco">+ Adicionar Locomotiva</button>';
    }

    // Lotacao
    var lotacaoHTML = '';
    (f.lotacao || []).forEach(function (lt, i) {
      var selMerc = '<option value="">Selecionar</option>';
      MERCADORIAS.forEach(function (m) {
        selMerc += '<option value="' + m + '"' + (lt.mercadoria === m ? ' selected' : '') + '>' + m + '</option>';
      });
      lotacaoHTML += '<div class="bj-repeatable-row bj-lotacao-row">' +
        '<input type="number" class="bj-input" value="' + (lt.qtd || '') + '" placeholder="Qtd"' + ro + ' style="max-width:80px;">' +
        '<select class="bj-select"' + dis + '>' + selMerc + '</select>' +
        (readOnly ? '' : '<button class="bj-remove-row" data-idx="' + i + '">&#10005;</button>') +
      '</div>';
    });
    if (!readOnly) {
      lotacaoHTML += '<button class="bj-add-row-btn" id="bj-add-lotacao">+ Adicionar Lotacao</button>';
    }

    // Vagoes isolados
    var vagoesHTML = '';
    (f.vagoesIsolados || []).forEach(function (v, i) {
      vagoesHTML += '<div class="bj-vagoes-row">' +
        '<input type="text" class="bj-input" value="' + (v.pos1 || '') + '" placeholder="Pos"' + ro + '>' +
        '<input type="text" class="bj-input" value="' + (v.vag1 || '') + '" placeholder="Num. Vagao"' + ro + '>' +
        '<input type="text" class="bj-input" value="' + (v.pos2 || '') + '" placeholder="Pos"' + ro + '>' +
        '<input type="text" class="bj-input" value="' + (v.vag2 || '') + '" placeholder="Num. Vagao"' + ro + '>' +
      '</div>';
    });
    if (!readOnly) {
      vagoesHTML += '<button class="bj-add-row-btn" id="bj-add-vagoes">+ Adicionar Vagoes</button>';
    }

    // Formacao radio
    var formacoes = ['Convencional', 'Conv. Linkado', 'Tracao Distribuida'];
    var formacaoHTML = '<div class="bj-radio-group">';
    formacoes.forEach(function (fm) {
      formacaoHTML += '<div class="bj-radio-btn' + (f.formacao === fm ? ' selected' : '') + '" data-val="' + fm + '">' + fm + '</div>';
    });
    formacaoHTML += '</div>';

    var html = progressHTML(1) +
      '<div class="bj-validation-msg" id="bj-val-msg"></div>' +
      '<div' + roClass + '>' +

      // Info do Trem
      '<div class="bj-section">' +
        '<div class="bj-section-title">Informacoes do Trem</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">Data</label><input type="date" id="bj-data" class="bj-input" value="' + f.data + '"' + ro + '></div>' +
          '<div><label class="bj-label">VMA do Trem</label><input type="number" id="bj-vma" class="bj-input" value="' + (f.vma || '') + '" placeholder="Ex: 80"' + ro + '></div>' +
        '</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">Prefixo</label><input type="text" id="bj-prefixo" class="bj-input" value="' + (f.prefixo || '') + '" placeholder="Ex: M346"' + ro + '></div>' +
          '<div><label class="bj-label">OS/PL</label><input type="text" id="bj-ospl" class="bj-input" value="' + (f.osPl || '') + '" placeholder="Ordem de servico"' + ro + '></div>' +
        '</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">Comp</label><input type="text" id="bj-comp" class="bj-input" value="' + (f.comp || '') + '" placeholder="Composicao"' + ro + '></div>' +
          '<div><label class="bj-label">Cauda</label><input type="text" id="bj-cauda" class="bj-input" value="' + (f.cauda || '') + '" placeholder="Num. cauda"' + ro + '></div>' +
        '</div>' +
      '</div>' +

      // Formacao
      '<div class="bj-section">' +
        '<div class="bj-section-title">Formacao do Trem</div>' +
        formacaoHTML +
      '</div>' +

      // Locomotivas
      '<div class="bj-section">' +
        '<div class="bj-section-title">Locomotivas Diesel</div>' +
        locoHTML +
      '</div>' +

      // Config ATC
      '<div class="bj-section">' +
        '<div class="bj-section-title">Configuracao do ATC</div>' +
        '<div class="bj-field-row-3">' +
          '<div><label class="bj-label">MCT</label><input type="text" id="bj-mct" class="bj-input" value="' + (f.mct || '') + '"' + ro + '></div>' +
          '<div><label class="bj-label">MCI</label><input type="text" id="bj-mci" class="bj-input" value="' + (f.mci || '') + '"' + ro + '></div>' +
          '<div><label class="bj-label">DCA</label><input type="text" id="bj-dca" class="bj-input" value="' + (f.dca || '') + '"' + ro + '></div>' +
        '</div>' +
      '</div>' +

      // Dados Composicao
      '<div class="bj-section">' +
        '<div class="bj-section-title">Dados da Composicao</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">QTDE VGS</label><input type="number" id="bj-qtdevgs" class="bj-input" value="' + (f.qtdeVgs || '') + '" placeholder="Vagoes"' + ro + '></div>' +
          '<div><label class="bj-label">Peso (ton)</label><input type="number" id="bj-peso" class="bj-input" value="' + (f.peso || '') + '" placeholder="Toneladas"' + ro + '></div>' +
        '</div>' +
        '<div class="bj-field-row-3">' +
          '<div><label class="bj-label">GRAD</label><input type="text" id="bj-grad" class="bj-input" value="' + (f.grad || '') + '"' + ro + '></div>' +
          '<div><label class="bj-label">VAZ</label><input type="text" id="bj-vaz" class="bj-input" value="' + (f.vaz || '') + '"' + ro + '></div>' +
          '<div><label class="bj-label">ACRESC. 10psi</label><input type="text" id="bj-acrescimo" class="bj-input" value="' + (f.acrescimo10psi || '') + '"' + ro + '></div>' +
        '</div>' +
        '<div class="bj-alert">&#9888;&#65039; Atentar para vagoes geminados na cauda unidos por engate</div>' +
      '</div>' +

      // Lotacao
      '<div class="bj-section">' +
        '<div class="bj-section-title">Lotacao</div>' +
        '<div id="bj-lotacao-list">' + lotacaoHTML + '</div>' +
      '</div>' +

      // Vagoes Isolados
      '<div class="bj-section">' +
        '<div class="bj-section-title">Vagoes Isolados</div>' +
        '<div id="bj-vagoes-list">' + vagoesHTML + '</div>' +
      '</div>' +

      // Observacoes
      '<div class="bj-section">' +
        '<div class="bj-section-title">Observacoes Gerais</div>' +
        '<textarea class="bj-textarea" id="bj-obs-gerais" placeholder="Observacoes..."' + ro + '>' + (f.observacoesGerais || '') + '</textarea>' +
      '</div>' +

      // Trens Estacionados
      '<div class="bj-section">' +
        '<div class="bj-section-title">Trens Estacionados</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">Manuais Apertados?</label>' +
            '<select id="bj-manuais" class="bj-select"' + dis + '>' +
              '<option value="">Selecionar</option>' +
              '<option value="Sim"' + (f.manuaisApertados === 'Sim' ? ' selected' : '') + '>Sim</option>' +
              '<option value="Nao"' + (f.manuaisApertados === 'Nao' ? ' selected' : '') + '>Nao</option>' +
            '</select></div>' +
          '<div><label class="bj-label">Qtd. Trens Estac.</label><input type="number" id="bj-qtde-trens" class="bj-input" value="' + (f.qtdeTrensEstacionados || '') + '"' + ro + '></div>' +
        '</div>' +
        '<div class="bj-field-row">' +
          '<div><label class="bj-label">Qual Locomotiva?</label><input type="text" id="bj-qual-loco" class="bj-input" value="' + (f.qualLocomotiva || '') + '"' + ro + '></div>' +
          '<div><label class="bj-label">Ultimo VG Apertado</label><input type="text" id="bj-ultimo-vg" class="bj-input" value="' + (f.ultimoVgApertado || '') + '"' + ro + '></div>' +
        '</div>' +
      '</div>' +

      '</div>';

    // Nav buttons
    if (readOnly) {
      html += '<div class="bj-nav-btns">' +
        '<button class="bj-nav-btn bj-nav-prev" id="bj-back-history">Voltar</button>' +
        '<button class="bj-nav-btn bj-nav-next" id="bj-to-step2">Checklist &rarr;</button>' +
      '</div>';
    } else {
      html += '<div class="bj-nav-btns">' +
        '<button class="bj-nav-btn bj-nav-prev" id="bj-back-history">Cancelar</button>' +
        '<button class="bj-nav-btn bj-nav-next" id="bj-to-step2">Proximo &rarr;</button>' +
      '</div>';
    }

    container.innerHTML = html;
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    bindStep1Events();
  }

  function bindStep1Events() {
    // Formacao radio
    container.querySelectorAll('.bj-radio-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (readOnly) return;
        container.querySelectorAll('.bj-radio-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        formData.formacao = btn.getAttribute('data-val');
      });
    });

    // Add loco
    var addLocoBtn = document.getElementById('bj-add-loco');
    if (addLocoBtn) {
      addLocoBtn.addEventListener('click', function () {
        collectStep1();
        formData.locomotivas.push('');
        renderStep1();
      });
    }

    // Add lotacao
    var addLotBtn = document.getElementById('bj-add-lotacao');
    if (addLotBtn) {
      addLotBtn.addEventListener('click', function () {
        collectStep1();
        formData.lotacao.push({ qtd: '', mercadoria: '' });
        renderStep1();
      });
    }

    // Remove lotacao
    container.querySelectorAll('.bj-lotacao-row .bj-remove-row').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectStep1();
        var idx = parseInt(btn.getAttribute('data-idx'));
        formData.lotacao.splice(idx, 1);
        if (formData.lotacao.length === 0) formData.lotacao.push({ qtd: '', mercadoria: '' });
        renderStep1();
      });
    });

    // Add vagoes
    var addVagBtn = document.getElementById('bj-add-vagoes');
    if (addVagBtn) {
      addVagBtn.addEventListener('click', function () {
        collectStep1();
        formData.vagoesIsolados.push({ pos1: '', vag1: '', pos2: '', vag2: '' });
        renderStep1();
      });
    }

    // Nav
    document.getElementById('bj-back-history').addEventListener('click', function () {
      if (readOnly) {
        currentStep = 0;
        viewingId = null;
        readOnly = false;
        renderHistory();
      } else {
        if (confirm('Descartar formulario?')) {
          currentStep = 0;
          renderHistory();
        }
      }
    });

    document.getElementById('bj-to-step2').addEventListener('click', function () {
      collectStep1();
      if (!readOnly) {
        // Validate
        var errors = [];
        if (!formData.data) errors.push('Data');
        if (!formData.prefixo) errors.push('Prefixo');
        if (!formData.formacao) errors.push('Formacao');
        var hasLoco = formData.locomotivas.some(function (l) { return l.trim() !== ''; });
        if (!hasLoco) errors.push('Ao menos 1 locomotiva');

        if (errors.length > 0) {
          var msg = document.getElementById('bj-val-msg');
          msg.textContent = 'Campos obrigatorios: ' + errors.join(', ');
          msg.classList.add('visible');
          // Highlight
          if (!formData.prefixo) document.getElementById('bj-prefixo').classList.add('error');
          if (!formData.data) document.getElementById('bj-data').classList.add('error');
          window.scrollTo(0, 0);
          return;
        }
      }
      currentStep = 2;
      renderStep2();
    });
  }

  /* ======= RENDER STEP 2: CHECKLIST ======= */
  function renderStep2() {
    var roClass = readOnly ? ' bj-readonly' : '';
    var ro = readOnly ? ' readonly' : '';

    var checked = 0;
    CHECKLIST_ITEMS.forEach(function (item) {
      if (formData.checklist[item]) checked++;
    });
    var pct = Math.round((checked / CHECKLIST_ITEMS.length) * 100);

    var html = progressHTML(2) +
      '<div class="bj-validation-msg" id="bj-val-msg"></div>' +
      '<div class="bj-checklist-progress">' +
        '<div class="bj-checklist-progress-text">Checklist: ' + checked + '/' + CHECKLIST_ITEMS.length + ' itens verificados — ' + pct + '%</div>' +
        '<div class="bj-checklist-bar"><div class="bj-checklist-bar-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
      '<div' + roClass + '>';

    CHECKLIST_ITEMS.forEach(function (item) {
      var status = formData.checklist[item] || '';
      var obs = formData.checklistObs[item] || '';
      var itemClass = status ? ' ' + status : '';
      var showObs = status === 'defeito' || obs;

      html += '<div class="bj-checklist-item' + itemClass + '" data-item="' + item + '">' +
        '<div class="bj-checklist-label">' + item + '</div>' +
        '<div class="bj-status-btns">' +
          '<div class="bj-status-btn' + (status === 'ok' ? ' selected-ok' : '') + '" data-status="ok">&#10003; OK</div>' +
          '<div class="bj-status-btn' + (status === 'defeito' ? ' selected-defeito' : '') + '" data-status="defeito">&#9888; Defeito</div>' +
          '<div class="bj-status-btn' + (status === 'na' ? ' selected-na' : '') + '" data-status="na">&#8212; N/A</div>' +
        '</div>' +
        '<div class="bj-checklist-obs" style="' + (showObs ? '' : 'display:none') + '">' +
          '<input type="text" class="bj-input bj-obs-input" value="' + obs + '" placeholder="Observacao..."' + ro + '>' +
        '</div>' +
      '</div>';
    });

    html += '<div class="bj-section" style="margin-top:16px;">' +
      '<div class="bj-section-title">Observacoes do Checklist</div>' +
      '<textarea class="bj-textarea" id="bj-checklist-obs-geral" placeholder="Observacoes gerais do checklist..."' + ro + '>' + (formData.checklistObsGeral || '') + '</textarea>' +
    '</div>';

    html += '</div>';

    // Nav
    html += '<div class="bj-nav-btns">' +
      '<button class="bj-nav-btn bj-nav-prev" id="bj-to-step1">&larr; Dados</button>' +
      '<button class="bj-nav-btn bj-nav-next" id="bj-to-step3">Finalizar &rarr;</button>' +
    '</div>';

    container.innerHTML = html;
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    bindStep2Events();
  }

  function collectStep2() {
    if (readOnly) return;
    var obsGeral = document.getElementById('bj-checklist-obs-geral');
    if (obsGeral) formData.checklistObsGeral = obsGeral.value;

    container.querySelectorAll('.bj-checklist-item').forEach(function (el) {
      var item = el.getAttribute('data-item');
      var obsInput = el.querySelector('.bj-obs-input');
      if (obsInput) formData.checklistObs[item] = obsInput.value;
    });
  }

  function bindStep2Events() {
    // Status buttons
    container.querySelectorAll('.bj-status-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (readOnly) return;
        var itemEl = btn.closest('.bj-checklist-item');
        var item = itemEl.getAttribute('data-item');
        var status = btn.getAttribute('data-status');

        // Toggle off if same
        if (formData.checklist[item] === status) {
          formData.checklist[item] = '';
          status = '';
        } else {
          formData.checklist[item] = status;
        }

        // Update classes
        itemEl.className = 'bj-checklist-item' + (status ? ' ' + status : '');
        itemEl.querySelectorAll('.bj-status-btn').forEach(function (b) {
          b.className = 'bj-status-btn';
        });
        if (status) btn.classList.add('selected-' + status);

        // Show/hide obs
        var obsDiv = itemEl.querySelector('.bj-checklist-obs');
        if (status === 'defeito') {
          obsDiv.style.display = '';
        } else if (!formData.checklistObs[item]) {
          obsDiv.style.display = 'none';
        }

        // Update progress
        var checked = 0;
        CHECKLIST_ITEMS.forEach(function (ci) { if (formData.checklist[ci]) checked++; });
        var pct = Math.round((checked / CHECKLIST_ITEMS.length) * 100);
        var progText = container.querySelector('.bj-checklist-progress-text');
        var progFill = container.querySelector('.bj-checklist-bar-fill');
        if (progText) progText.textContent = 'Checklist: ' + checked + '/' + CHECKLIST_ITEMS.length + ' itens verificados — ' + pct + '%';
        if (progFill) progFill.style.width = pct + '%';
      });
    });

    // Nav
    document.getElementById('bj-to-step1').addEventListener('click', function () {
      collectStep2();
      currentStep = 1;
      renderStep1();
    });

    document.getElementById('bj-to-step3').addEventListener('click', function () {
      collectStep2();
      if (!readOnly) {
        var checked = 0;
        CHECKLIST_ITEMS.forEach(function (ci) { if (formData.checklist[ci]) checked++; });
        if (checked < 20) {
          var msg = document.getElementById('bj-val-msg');
          msg.textContent = 'Marque ao menos 20 dos 26 itens do checklist para continuar. (' + checked + '/26 marcados)';
          msg.classList.add('visible');
          window.scrollTo(0, 0);
          return;
        }
      }
      currentStep = 3;
      renderStep3();
    });
  }

  /* ======= RENDER STEP 3: FINALIZAR ======= */
  function renderStep3() {
    var f = formData;
    var checkOk = 0;
    var checkDefeito = 0;
    var defeitos = [];
    CHECKLIST_ITEMS.forEach(function (item) {
      if (f.checklist[item] === 'ok') checkOk++;
      if (f.checklist[item] === 'defeito') {
        checkDefeito++;
        defeitos.push(item);
      }
    });
    var checkTotal = 0;
    CHECKLIST_ITEMS.forEach(function (item) { if (f.checklist[item]) checkTotal++; });

    var defeitoHTML = '';
    if (defeitos.length > 0) {
      defeitoHTML = '<div class="bj-resumo-defeitos">';
      defeitos.forEach(function (d) {
        defeitoHTML += '<span class="bj-defeito-tag">' + d + '</span>';
      });
      defeitoHTML += '</div>';
    }

    var previewVisible = f.fotoAnexo ? ' visible' : '';
    var previewContent = '';
    if (f.fotoAnexo) {
      if (f.fotoAnexo.indexOf('data:image') === 0) {
        previewContent = '<img class="bj-preview-img" src="' + f.fotoAnexo + '" alt="Anexo">';
      } else {
        previewContent = '<div class="bj-preview-filename">' + (f.fotoNome || 'Arquivo anexado') + '</div>';
      }
    }

    var html = progressHTML(3) +
      '<div class="bj-resumo-card">' +
        '<div class="bj-resumo-title">Resumo da Boa Jornada</div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Prefixo</span><span class="bj-resumo-value">' + (f.prefixo || '-') + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Data</span><span class="bj-resumo-value">' + formatDate(f.data) + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Formacao</span><span class="bj-resumo-value">' + (f.formacao || '-') + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Vagoes</span><span class="bj-resumo-value">' + (f.qtdeVgs || '-') + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Peso</span><span class="bj-resumo-value">' + (f.peso ? f.peso + ' ton' : '-') + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">VMA</span><span class="bj-resumo-value">' + (f.vma ? f.vma + ' km/h' : '-') + '</span></div>' +
        '<div class="bj-resumo-row"><span class="bj-resumo-label">Checklist</span><span class="bj-resumo-value">' + checkOk + '/' + CHECKLIST_ITEMS.length + ' OK</span></div>' +
        (checkDefeito > 0 ? '<div class="bj-resumo-row"><span class="bj-resumo-label">Defeitos</span><span class="bj-resumo-value" style="color:var(--status-danger);">' + checkDefeito + '</span></div>' : '') +
        defeitoHTML +
        (f.observacoesGerais ? '<div class="bj-resumo-row" style="flex-direction:column;gap:4px;"><span class="bj-resumo-label">Observacoes</span><span class="bj-resumo-value" style="font-weight:400;font-size:13px;">"' + f.observacoesGerais + '"</span></div>' : '') +
      '</div>';

    // Foto/Anexo
    if (!readOnly) {
      html += '<div class="bj-anexo-section">' +
        '<div class="bj-anexo-title">Anexar Documento</div>' +
        '<div class="bj-anexo-desc">Se preferir, anexe uma foto do formulario preenchido em papel.</div>' +
        '<div class="bj-anexo-btns">' +
          '<button class="bj-anexo-btn" id="bj-foto-btn">&#128247; Tirar Foto</button>' +
          '<button class="bj-anexo-btn" id="bj-arquivo-btn">&#128193; Escolher Arquivo</button>' +
        '</div>' +
        '<input type="file" id="bj-foto-camera" accept="image/*" capture="environment" style="display:none">' +
        '<input type="file" id="bj-foto-galeria" accept="image/*,.pdf,.doc,.docx" style="display:none">' +
        '<div class="bj-preview-container' + previewVisible + '" id="bj-preview">' +
          previewContent +
          '<button class="bj-remove-anexo" id="bj-remove-foto">Remover anexo</button>' +
        '</div>' +
      '</div>';
    } else if (f.fotoAnexo) {
      html += '<div class="bj-anexo-section">' +
        '<div class="bj-anexo-title">Anexo</div>' +
        '<div class="bj-preview-container visible">' + previewContent + '</div>' +
      '</div>';
    }

    // Actions
    if (readOnly) {
      html += '<div class="bj-actions">' +
        '<button class="bj-btn-secondary" id="bj-share-btn">Compartilhar</button>' +
        '<button class="bj-btn-secondary" id="bj-back-hist">Voltar ao Historico</button>' +
      '</div>';
    } else {
      html += '<div class="bj-actions">' +
        '<button class="bj-btn-primary" id="bj-save-btn">Salvar Boa Jornada</button>' +
        '<button class="bj-btn-secondary" id="bj-share-save-btn">Salvar e Compartilhar</button>' +
        '<button class="bj-btn-danger" id="bj-discard-btn">Descartar</button>' +
      '</div>';

      html += '<div class="bj-nav-btns" style="margin-top:8px;">' +
        '<button class="bj-nav-btn bj-nav-prev" id="bj-to-step2b">&larr; Checklist</button>' +
      '</div>';
    }

    container.innerHTML = html;
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    bindStep3Events();
  }

  function bindStep3Events() {
    // Foto
    var fotoBtn = document.getElementById('bj-foto-btn');
    var arqBtn = document.getElementById('bj-arquivo-btn');
    var fotoInput = document.getElementById('bj-foto-camera');
    var arqInput = document.getElementById('bj-foto-galeria');

    if (fotoBtn) fotoBtn.addEventListener('click', function () { fotoInput.click(); });
    if (arqBtn) arqBtn.addEventListener('click', function () { arqInput.click(); });

    function handleFile(e) {
      var file = e.target.files[0];
      if (!file) return;
      formData.fotoNome = file.name;
      if (file.type.indexOf('image') === 0) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          formData.fotoAnexo = ev.target.result;
          renderStep3();
        };
        reader.readAsDataURL(file);
      } else {
        formData.fotoAnexo = 'file:' + file.name;
        renderStep3();
      }
    }

    if (fotoInput) fotoInput.addEventListener('change', handleFile);
    if (arqInput) arqInput.addEventListener('change', handleFile);

    var removeBtn = document.getElementById('bj-remove-foto');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        formData.fotoAnexo = null;
        formData.fotoNome = '';
        renderStep3();
      });
    }

    // Save
    var saveBtn = document.getElementById('bj-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        doSave();
        currentStep = 0;
        renderHistory();
      });
    }

    // Save + Share
    var shareBtn = document.getElementById('bj-share-save-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        doSave();
        compartilhar(formData);
        currentStep = 0;
        renderHistory();
      });
    }

    // Share only (readonly)
    var shareOnly = document.getElementById('bj-share-btn');
    if (shareOnly) {
      shareOnly.addEventListener('click', function () {
        compartilhar(formData);
      });
    }

    // Discard
    var discardBtn = document.getElementById('bj-discard-btn');
    if (discardBtn) {
      discardBtn.addEventListener('click', function () {
        if (confirm('Descartar formulario?')) {
          currentStep = 0;
          renderHistory();
        }
      });
    }

    // Back to checklist
    var backBtn = document.getElementById('bj-to-step2b');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        currentStep = 2;
        renderStep2();
      });
    }

    // Back to history (readonly)
    var histBtn = document.getElementById('bj-back-hist');
    if (histBtn) {
      histBtn.addEventListener('click', function () {
        currentStep = 0;
        viewingId = null;
        readOnly = false;
        renderHistory();
      });
    }
  }

  /* ======= SAVE ======= */
  function doSave() {
    // Strip base64 foto if too large (>5MB)
    var data = JSON.parse(JSON.stringify(formData));
    delete data._key;
    if (data.fotoAnexo && data.fotoAnexo.length > 5 * 1024 * 1024) {
      data.fotoAnexo = null;
      data.fotoNome = '';
    }
    saveForm(data);
  }

  /* ======= COMPARTILHAR ======= */
  function gerarResumoTexto(d) {
    var checkOk = 0;
    var defeitos = [];
    CHECKLIST_ITEMS.forEach(function (item) {
      if (d.checklist[item] === 'ok') checkOk++;
      if (d.checklist[item] === 'defeito') defeitos.push(item);
    });

    var locos = (d.locomotivas || []).filter(function (l) { return l; }).join(', ');

    var text = 'BOA JORNADA — ' + (d.prefixo || 'Sem prefixo') + '\n' +
      'Data: ' + formatDate(d.data) + '\n' +
      'Formacao: ' + (d.formacao || '-') + '\n' +
      'Locomotivas: ' + (locos || '-') + '\n' +
      'Vagoes: ' + (d.qtdeVgs || '-') + ' | Peso: ' + (d.peso ? d.peso + ' ton' : '-') + '\n' +
      'VMA: ' + (d.vma ? d.vma + ' km/h' : '-') + '\n' +
      '\nChecklist: ' + checkOk + '/' + CHECKLIST_ITEMS.length + ' OK\n';

    if (defeitos.length > 0) {
      text += 'Defeitos: ' + defeitos.join(', ') + '\n';
    }
    if (d.observacoesGerais) {
      text += '\nObs: ' + d.observacoesGerais + '\n';
    }
    text += '\n— T4 Trilho 4.0';
    return text;
  }

  function compartilhar(dados) {
    var texto = gerarResumoTexto(dados);
    if (navigator.share) {
      navigator.share({
        title: 'Boa Jornada — ' + (dados.prefixo || ''),
        text: texto
      }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(function () {
        if (T4.notifications) { T4.notifications.success('Resumo copiado para a area de transferencia!'); }
      }).catch(function () {
        prompt('Copie o resumo abaixo:', texto);
      });
    } else {
      prompt('Copie o resumo abaixo:', texto);
    }
  }

  /* ======= INIT ======= */
  renderHistory();

})();
