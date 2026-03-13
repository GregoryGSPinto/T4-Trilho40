(function () {
  'use strict';

  var STORAGE_PREFIX = 't4-pense-risco-';
  var EVENTOS_COMUNS = [
    'Atropelamento', 'Queda', 'Choque eletrico', 'Prensamento',
    'Descarrilamento', 'Colisao', 'Incendio', 'Exposicao quimica',
    'Corte', 'Projecao de particulas', 'Ruido excessivo'
  ];

  var PERGUNTAS_360 = [
    'Estou bem para executar a tarefa?',
    'O local de trabalho esta seguro?',
    'EPI Disponiveis?',
    'Equipamentos/Ferramentas estao em condicoes de uso?'
  ];

  var PERGUNTAS_360_KEYS = ['bemParaExecutar', 'localSeguro', 'epiDisponiveis', 'equipamentosOk'];

  var container = document.getElementById('pnr-container');
  var currentStep = 0;
  var formData = {};
  var viewingId = null;
  var readOnly = false;

  /* ======= UTILS ======= */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(str) {
    if (!str) return '-';
    var p = str.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : str;
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function getConfig(key) {
    try { return JSON.parse(localStorage.getItem('t4-config') || '{}')[key] || ''; } catch (e) { return ''; }
  }

  function getUser() {
    try { var u = JSON.parse(localStorage.getItem('t4-user') || '{}'); return u.nome || u.name || 'Maquinista'; } catch (e) { return 'Maquinista'; }
  }

  function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* ======= STORAGE ======= */
  function getAllSaved() {
    var items = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(STORAGE_PREFIX) === 0) {
        try { var d = JSON.parse(localStorage.getItem(key)); d._key = key; items.push(d); } catch (e) {}
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

  function deleteForm(key) { localStorage.removeItem(key); }

  /* ======= INIT ======= */
  function initFormData() {
    formData = {
      empresa: 'Vale S.A.',
      tarefa: '',
      localTarefa: getConfig('patio') ? 'Patio ' + getConfig('patio') : '',
      avaliacao360: { bemParaExecutar: null, localSeguro: null, epiDisponiveis: null, equipamentosOk: null },
      matrizDecisao: null,
      riscoGrave: null,
      eventos: [
        { numero: '', circunstancia: '', medidaControle: '' },
        { numero: '', circunstancia: '', medidaControle: '' }
      ],
      riscosControlados: null,
      podeExecutar: null,
      observacoes: '',
      nomeLegivel: getUser(),
      data: todayStr(),
      fotoAnexo: null,
      fotoNome: '',
      status: 'aprovado'
    };
  }

  /* ======= BACK ======= */
  document.getElementById('pnr-back').addEventListener('click', function () {
    if (currentStep === 0) {
      window.location.href = '../../';
    } else {
      currentStep = 0;
      viewingId = null;
      readOnly = false;
      renderHistory();
    }
  });

  /* ======= PROGRESS ======= */
  function progressHTML(step) {
    var s1 = step > 1 ? 'completed' : (step === 1 ? 'active' : '');
    var s2 = step > 2 ? 'completed' : (step === 2 ? 'active' : '');
    var s3 = step === 3 ? 'active' : '';
    var l1 = step > 1 ? 'completed' : '';
    var l2 = step > 2 ? 'completed' : '';
    return '<div class="pnr-progress">' +
      '<div class="pnr-step ' + s1 + '">' + (step > 1 ? '&#10003;' : '1') + '</div>' +
      '<div class="pnr-step-line ' + l1 + '"></div>' +
      '<div class="pnr-step ' + s2 + '">' + (step > 2 ? '&#10003;' : '2') + '</div>' +
      '<div class="pnr-step-line ' + l2 + '"></div>' +
      '<div class="pnr-step ' + s3 + '">3</div>' +
    '</div>';
  }

  /* ======= HISTORY ======= */
  function renderHistory() {
    var saved = getAllSaved();
    var html = '<button class="pnr-new-btn" id="pnr-new">+ Novo Pense no Risco</button>';

    if (saved.length > 0) {
      html += '<div class="pnr-history-title">HISTORICO</div>';
      saved.forEach(function (item) {
        var evtCount = (item.eventos || []).filter(function (e) { return e.numero; }).length;
        var statusClass = item.status || 'aprovado';
        var statusLabel = statusClass === 'aprovado' ? 'Aprovado' : (statusClass === 'pendente' ? 'Pendente' : 'Bloqueado');
        html += '<div class="pnr-history-card ' + statusClass + '" data-key="' + item._key + '">' +
          '<div class="pnr-history-top">' +
            '<span class="pnr-history-tarefa">' + (item.tarefa || 'Sem tarefa') + '</span>' +
            '<span class="pnr-history-date">' + formatDate(item.data) + '</span>' +
          '</div>' +
          '<div class="pnr-history-meta">' +
            '<span>' + (item.localTarefa || '-') + '</span>' +
            '<span>' + evtCount + ' evento' + (evtCount !== 1 ? 's' : '') + '</span>' +
            '<span class="pnr-history-status ' + statusClass + '">' + statusLabel + '</span>' +
            '<span>' + formatTime(item.timestamp) + '</span>' +
          '</div>' +
          '<div class="pnr-history-actions">' +
            '<button class="pnr-history-action-btn view-btn" data-key="' + item._key + '">Visualizar</button>' +
            '<button class="pnr-history-action-btn delete" data-key="' + item._key + '">Excluir</button>' +
          '</div>' +
        '</div>';
      });
    } else {
      html += '<div class="pnr-empty">Nenhum Pense no Risco salvo.<br>Crie um novo para comecar.</div>';
    }

    container.innerHTML = html;

    document.getElementById('pnr-new').addEventListener('click', function () {
      initFormData();
      viewingId = null;
      readOnly = false;
      currentStep = 1;
      renderStep1();
    });

    container.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        try {
          formData = JSON.parse(localStorage.getItem(btn.getAttribute('data-key')));
          formData._key = btn.getAttribute('data-key');
          viewingId = formData._key;
          readOnly = true;
          currentStep = 1;
          renderStep1();
        } catch (err) {}
      });
    });

    container.querySelectorAll('.pnr-history-action-btn.delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('Excluir este Pense no Risco?')) {
          deleteForm(btn.getAttribute('data-key'));
          renderHistory();
        }
      });
    });
  }

  /* ======= STEP 1: IDENTIFICACAO + 360 + MATRIZ + RISCO GRAVE ======= */
  function renderStep1() {
    var f = formData;
    var ro = readOnly ? ' readonly' : '';
    var roClass = readOnly ? ' pnr-readonly' : '';

    // Checklist 360
    var checklistHTML = '';
    PERGUNTAS_360.forEach(function (pergunta, i) {
      var key = PERGUNTAS_360_KEYS[i];
      var val = f.avaliacao360[key];
      var isDanger = val === false;
      checklistHTML += '<div class="pnr-question' + (isDanger ? ' danger' : '') + '" data-key="' + key + '">' +
        '<div class="pnr-question-text">' + pergunta + '</div>' +
        '<div class="pnr-answer-btns">' +
          '<div class="pnr-answer-btn' + (val === true ? ' selected-sim' : '') + '" data-answer="sim">&#10003; Sim</div>' +
          '<div class="pnr-answer-btn' + (val === false ? ' selected-nao' : '') + '" data-answer="nao">&#10005; Nao</div>' +
        '</div>' +
      '</div>';
    });

    // Has any "Nao"
    var hasNao = Object.keys(f.avaliacao360).some(function (k) { return f.avaliacao360[k] === false; });

    // Matriz
    var matrizHTML = '<div class="pnr-matriz-btns">' +
      '<div class="pnr-matriz-btn' + (f.matrizDecisao === 'realizar' ? ' selected-realizar' : '') + '" data-val="realizar">&#10003; Realizar a Atividade</div>' +
      '<div class="pnr-matriz-btn' + (f.matrizDecisao === 'chamarLider' ? ' selected-lider' : '') + '" data-val="chamarLider">&#128680; Chamar o Lider</div>' +
    '</div>';

    // Risco Grave
    var riscoHTML = '<div class="pnr-risco-btns">' +
      '<div class="pnr-risco-btn' + (f.riscoGrave === false ? ' selected-nao' : '') + '" data-val="nao">&#10003; Nao</div>' +
      '<div class="pnr-risco-btn' + (f.riscoGrave === true ? ' selected-sim' : '') + '" data-val="sim">&#128308; SIM — Comunique e formalize a interdicao</div>' +
    '</div>';

    var html = progressHTML(1) +
      '<div class="pnr-validation-msg" id="pnr-val-msg"></div>' +
      '<div' + roClass + '>' +

      // Identificacao
      '<div class="pnr-section">' +
        '<div class="pnr-section-title">Identificacao</div>' +
        '<div class="pnr-field-full"><label class="pnr-label">Empresa</label><input type="text" id="pnr-empresa" class="pnr-input" value="' + esc(f.empresa) + '"' + ro + '></div>' +
        '<div class="pnr-field-full"><label class="pnr-label">Tarefa</label><input type="text" id="pnr-tarefa" class="pnr-input" value="' + esc(f.tarefa) + '" placeholder="Descreva a tarefa a ser executada"' + ro + '></div>' +
        '<div class="pnr-field-full"><label class="pnr-label">Local da Tarefa</label><input type="text" id="pnr-local" class="pnr-input" value="' + esc(f.localTarefa) + '" placeholder="Ex: Patio VFZ — Linha 3"' + ro + '></div>' +
      '</div>' +

      // Banner 360
      '<div class="pnr-banner pnr-banner-green">&#128260; Realize a avaliacao 360° — Observe ao redor antes de iniciar</div>' +

      // Checklist
      '<div class="pnr-section">' +
        '<div class="pnr-section-title">Checklist de Seguranca</div>' +
        checklistHTML +
      '</div>' +

      (hasNao ? '<div class="pnr-banner pnr-banner-red">&#9888;&#65039; Nao execute a atividade. Chame o lider.</div>' : '') +

      // Matriz
      '<div class="pnr-section">' +
        '<div class="pnr-banner pnr-banner-gold">&#128202; Matriz de Decisao — Frequencia x Risco de Acidente</div>' +
        '<div class="pnr-section-title">Resultado da Matriz</div>' +
        matrizHTML +
      '</div>' +

      // Risco Grave
      '<div class="pnr-section">' +
        '<div class="pnr-banner pnr-banner-red">&#128308; Existe condicao de Risco Grave e Iminente?</div>' +
        riscoHTML +
      '</div>' +

      (f.riscoGrave === true ? '<div class="pnr-bloqueio"><div class="pnr-bloqueio-text">&#128683; PARE! Comunique imediatamente e formalize a interdicao. NAO execute a atividade.</div></div>' : '') +

      '</div>';

    // Nav
    if (readOnly) {
      html += '<div class="pnr-nav-btns">' +
        '<button class="pnr-nav-btn pnr-nav-prev" id="pnr-back-hist">Voltar</button>' +
        '<button class="pnr-nav-btn pnr-nav-next" id="pnr-to-step2">Eventos &rarr;</button>' +
      '</div>';
    } else {
      html += '<div class="pnr-nav-btns">' +
        '<button class="pnr-nav-btn pnr-nav-prev" id="pnr-cancel">Cancelar</button>' +
        '<button class="pnr-nav-btn pnr-nav-next" id="pnr-to-step2">Proximo &rarr;</button>' +
      '</div>';
    }

    container.innerHTML = html;
    window.scrollTo(0, 0);
    bindStep1Events();
  }

  function collectStep1() {
    if (readOnly) return;
    var v = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    formData.empresa = v('pnr-empresa');
    formData.tarefa = v('pnr-tarefa');
    formData.localTarefa = v('pnr-local');
  }

  function bindStep1Events() {
    // 360 answers
    container.querySelectorAll('.pnr-question').forEach(function (q) {
      q.querySelectorAll('.pnr-answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (readOnly) return;
          var key = q.getAttribute('data-key');
          var answer = btn.getAttribute('data-answer') === 'sim';

          formData.avaliacao360[key] = answer;

          // Update UI
          q.querySelectorAll('.pnr-answer-btn').forEach(function (b) { b.className = 'pnr-answer-btn'; });
          btn.classList.add(answer ? 'selected-sim' : 'selected-nao');
          q.classList.toggle('danger', !answer);

          // Check for "Nao" warnings
          var hasNao = Object.keys(formData.avaliacao360).some(function (k) { return formData.avaliacao360[k] === false; });
          var existing = container.querySelector('.pnr-banner-red.pnr-nao-warning');
          if (hasNao && !existing) {
            // Re-render to show warning
            collectStep1();
            renderStep1();
          } else if (!hasNao && existing) {
            existing.remove();
          }
        });
      });
    });

    // Matriz
    container.querySelectorAll('.pnr-matriz-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (readOnly) return;
        formData.matrizDecisao = btn.getAttribute('data-val');
        container.querySelectorAll('.pnr-matriz-btn').forEach(function (b) { b.className = 'pnr-matriz-btn'; });
        btn.classList.add(formData.matrizDecisao === 'realizar' ? 'selected-realizar' : 'selected-lider');
      });
    });

    // Risco Grave
    container.querySelectorAll('.pnr-risco-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (readOnly) return;
        var val = btn.getAttribute('data-val') === 'sim';
        formData.riscoGrave = val;
        collectStep1();
        renderStep1();
      });
    });

    // Nav: cancel
    var cancelBtn = document.getElementById('pnr-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        if (confirm('Descartar formulario?')) {
          currentStep = 0;
          renderHistory();
        }
      });
    }

    var backHist = document.getElementById('pnr-back-hist');
    if (backHist) {
      backHist.addEventListener('click', function () {
        currentStep = 0;
        viewingId = null;
        readOnly = false;
        renderHistory();
      });
    }

    // Nav: next
    document.getElementById('pnr-to-step2').addEventListener('click', function () {
      collectStep1();

      if (!readOnly) {
        // Block if risco grave
        if (formData.riscoGrave === true) {
          var msg = document.getElementById('pnr-val-msg');
          msg.textContent = 'Risco Grave e Iminente identificado. NAO e possivel prosseguir.';
          msg.classList.add('visible');
          window.scrollTo(0, 0);
          return;
        }

        // Validate required
        var errors = [];
        if (!formData.tarefa) errors.push('Tarefa');
        if (errors.length > 0) {
          var msg2 = document.getElementById('pnr-val-msg');
          msg2.textContent = 'Campos obrigatorios: ' + errors.join(', ');
          msg2.classList.add('visible');
          if (!formData.tarefa) document.getElementById('pnr-tarefa').classList.add('error');
          window.scrollTo(0, 0);
          return;
        }

        // Warn if any "Nao" in 360
        var hasNao = Object.keys(formData.avaliacao360).some(function (k) { return formData.avaliacao360[k] === false; });
        if (hasNao) {
          if (!confirm('Ha respostas negativas na avaliacao 360. Deseja continuar mesmo assim?')) return;
        }
      }

      currentStep = 2;
      renderStep2();
    });
  }

  /* ======= STEP 2: EVENTOS INDESEJADOS ======= */
  function renderStep2() {
    var f = formData;
    var ro = readOnly ? ' readonly' : '';
    var roClass = readOnly ? ' pnr-readonly' : '';

    var html = progressHTML(2) +
      '<div class="pnr-validation-msg" id="pnr-val-msg"></div>' +
      '<div class="pnr-banner pnr-banner-gold">&#128203; Utilize a matriz de condicao perigosa para preencher os campos abaixo</div>';

    // Chips
    if (!readOnly) {
      html += '<div class="pnr-section"><div class="pnr-section-title">Eventos frequentes (toque para adicionar)</div><div class="pnr-chips">';
      EVENTOS_COMUNS.forEach(function (ev) {
        html += '<div class="pnr-chip" data-ev="' + esc(ev) + '">' + ev + '</div>';
      });
      html += '</div></div>';
    }

    html += '<div' + roClass + '>';

    // Eventos
    (f.eventos || []).forEach(function (ev, i) {
      html += '<div class="pnr-evento" data-idx="' + i + '">' +
        '<div class="pnr-evento-header">' +
          '<span class="pnr-evento-num">Evento #' + (i + 1) + '</span>' +
          (readOnly ? '' : '<button class="pnr-evento-remove" data-idx="' + i + '">&#10005;</button>') +
        '</div>' +
        '<div class="pnr-evento-field">' +
          '<label class="pnr-label">Evento Indesejado</label>' +
          '<input type="text" class="pnr-input pnr-evt-numero" value="' + esc(ev.numero) + '" placeholder="Ex: Atropelamento"' + ro + '>' +
        '</div>' +
        '<div class="pnr-evento-field">' +
          '<label class="pnr-label">Circunstancia (Quando)?</label>' +
          '<input type="text" class="pnr-input pnr-evt-circ" value="' + esc(ev.circunstancia) + '" placeholder="Ex: Durante manobra no patio"' + ro + '>' +
        '</div>' +
        '<div class="pnr-evento-field">' +
          '<label class="pnr-label">Medida de Controle</label>' +
          '<input type="text" class="pnr-input pnr-evt-medida" value="' + esc(ev.medidaControle) + '" placeholder="Ex: Sinalizacao previa via radio"' + ro + '>' +
        '</div>' +
      '</div>';
    });

    if (!readOnly) {
      html += '<button class="pnr-add-evento-btn" id="pnr-add-evento">+ Adicionar Evento</button>';
    }

    html += '</div>';

    // Nav
    html += '<div class="pnr-nav-btns">' +
      '<button class="pnr-nav-btn pnr-nav-prev" id="pnr-to-step1">&larr; Avaliacao</button>' +
      '<button class="pnr-nav-btn pnr-nav-next" id="pnr-to-step3">Finalizar &rarr;</button>' +
    '</div>';

    container.innerHTML = html;
    window.scrollTo(0, 0);
    bindStep2Events();
  }

  function collectStep2() {
    if (readOnly) return;
    formData.eventos = [];
    container.querySelectorAll('.pnr-evento').forEach(function (el) {
      formData.eventos.push({
        numero: el.querySelector('.pnr-evt-numero').value,
        circunstancia: el.querySelector('.pnr-evt-circ').value,
        medidaControle: el.querySelector('.pnr-evt-medida').value
      });
    });
  }

  function bindStep2Events() {
    // Chips
    container.querySelectorAll('.pnr-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var ev = chip.getAttribute('data-ev');
        // Find first empty evento
        var inputs = container.querySelectorAll('.pnr-evt-numero');
        var filled = false;
        for (var i = 0; i < inputs.length; i++) {
          if (!inputs[i].value) {
            inputs[i].value = ev;
            filled = true;
            break;
          }
        }
        if (!filled) {
          collectStep2();
          formData.eventos.push({ numero: ev, circunstancia: '', medidaControle: '' });
          renderStep2();
        }
      });
    });

    // Remove evento
    container.querySelectorAll('.pnr-evento-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectStep2();
        var idx = parseInt(btn.getAttribute('data-idx'));
        formData.eventos.splice(idx, 1);
        if (formData.eventos.length === 0) formData.eventos.push({ numero: '', circunstancia: '', medidaControle: '' });
        renderStep2();
      });
    });

    // Add evento
    var addBtn = document.getElementById('pnr-add-evento');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        collectStep2();
        if (formData.eventos.length < 5) {
          formData.eventos.push({ numero: '', circunstancia: '', medidaControle: '' });
          renderStep2();
        }
      });
    }

    // Nav
    document.getElementById('pnr-to-step1').addEventListener('click', function () {
      collectStep2();
      currentStep = 1;
      renderStep1();
    });

    document.getElementById('pnr-to-step3').addEventListener('click', function () {
      collectStep2();
      currentStep = 3;
      renderStep3();
    });
  }

  /* ======= STEP 3: FINALIZAR ======= */
  function renderStep3() {
    var f = formData;
    var ro = readOnly ? ' readonly' : '';
    var roClass = readOnly ? ' pnr-readonly' : '';

    // Resumo
    var evtCount = (f.eventos || []).filter(function (e) { return e.numero; }).length;
    var a360 = f.avaliacao360;
    var simNao = function (v) { return v === true ? '&#10003; Sim' : (v === false ? '&#10005; Nao' : '-'); };
    var simNaoColor = function (v) { return v === true ? 'color:var(--accent-green)' : (v === false ? 'color:var(--status-danger)' : ''); };

    var matrizLabel = f.matrizDecisao === 'realizar' ? 'Realizar a atividade' : (f.matrizDecisao === 'chamarLider' ? 'Chamar o lider' : '-');
    var riscoLabel = f.riscoGrave === false ? 'Nao' : (f.riscoGrave === true ? 'SIM' : '-');

    var html = progressHTML(3) +
      '<div class="pnr-validation-msg" id="pnr-val-msg"></div>';

    // Conclusion questions
    if (!readOnly) {
      html += '<div class="pnr-section">' +
        '<div class="pnr-section-title">Conclusao de Seguranca</div>' +
        '<div class="pnr-question" data-key="riscosControlados">' +
          '<div class="pnr-question-text">Todos os riscos estao controlados?</div>' +
          '<div class="pnr-answer-btns">' +
            '<div class="pnr-answer-btn conclusion-btn' + (f.riscosControlados === true ? ' selected-sim' : '') + '" data-field="riscosControlados" data-answer="sim">&#10003; Sim</div>' +
            '<div class="pnr-answer-btn conclusion-btn' + (f.riscosControlados === false ? ' selected-nao' : '') + '" data-field="riscosControlados" data-answer="nao">&#10005; Nao</div>' +
          '</div>' +
        '</div>' +
        '<div class="pnr-question" data-key="podeExecutar">' +
          '<div class="pnr-question-text">A atividade pode ser executada com seguranca?</div>' +
          '<div class="pnr-answer-btns">' +
            '<div class="pnr-answer-btn conclusion-btn' + (f.podeExecutar === true ? ' selected-sim' : '') + '" data-field="podeExecutar" data-answer="sim">&#10003; Sim</div>' +
            '<div class="pnr-answer-btn conclusion-btn' + (f.podeExecutar === false ? ' selected-nao' : '') + '" data-field="podeExecutar" data-answer="nao">&#10005; Nao</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      var hasConclNao = f.riscosControlados === false || f.podeExecutar === false;
      if (hasConclNao) {
        html += '<div class="pnr-banner pnr-banner-red">&#9888;&#65039; Caso haja resposta negativa, NAO execute a atividade e chame o lider.</div>';
      }

      // Observacoes
      html += '<div class="pnr-section">' +
        '<div class="pnr-section-title">Observacoes</div>' +
        '<textarea class="pnr-textarea" id="pnr-obs" placeholder="Observacoes adicionais...">' + (f.observacoes || '') + '</textarea>' +
      '</div>';

      // Assinatura
      html += '<div class="pnr-section">' +
        '<div class="pnr-section-title">Assinatura</div>' +
        '<div class="pnr-field-full"><label class="pnr-label">Nome Legivel</label><input type="text" id="pnr-nome" class="pnr-input" value="' + esc(f.nomeLegivel) + '"></div>' +
        '<div class="pnr-field-full"><label class="pnr-label">Data</label><input type="date" id="pnr-data" class="pnr-input" value="' + f.data + '"></div>' +
      '</div>';
    }

    // Foto/Anexo
    var previewVisible = f.fotoAnexo ? ' visible' : '';
    var previewContent = '';
    if (f.fotoAnexo) {
      if (f.fotoAnexo.indexOf('data:image') === 0) {
        previewContent = '<img class="pnr-preview-img" src="' + f.fotoAnexo + '" alt="Anexo">';
      } else {
        previewContent = '<div class="pnr-preview-filename">' + (f.fotoNome || 'Arquivo anexado') + '</div>';
      }
    }

    if (!readOnly) {
      html += '<div class="pnr-anexo-section">' +
        '<div class="pnr-anexo-title">Anexar Documento</div>' +
        '<div class="pnr-anexo-desc">Se preferir, anexe uma foto do formulario preenchido em papel.</div>' +
        '<div class="pnr-anexo-btns">' +
          '<button class="pnr-anexo-btn" id="pnr-foto-btn">&#128247; Tirar Foto</button>' +
          '<button class="pnr-anexo-btn" id="pnr-arq-btn">&#128193; Escolher Arquivo</button>' +
        '</div>' +
        '<input type="file" id="pnr-foto-camera" accept="image/*" capture="environment" style="display:none">' +
        '<input type="file" id="pnr-foto-galeria" accept="image/*,.pdf,.doc,.docx" style="display:none">' +
        '<div class="pnr-preview-container' + previewVisible + '" id="pnr-preview">' +
          previewContent +
          '<button class="pnr-remove-anexo" id="pnr-remove-foto">Remover anexo</button>' +
        '</div>' +
      '</div>';
    } else if (f.fotoAnexo) {
      html += '<div class="pnr-anexo-section">' +
        '<div class="pnr-anexo-title">Anexo</div>' +
        '<div class="pnr-preview-container visible">' + previewContent + '</div>' +
      '</div>';
    }

    // Resumo card
    html += '<div class="pnr-resumo-card">' +
      '<div class="pnr-resumo-title">Resumo do Pense no Risco</div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Tarefa</span><span class="pnr-resumo-value">' + (f.tarefa || '-') + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Local</span><span class="pnr-resumo-value">' + (f.localTarefa || '-') + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Data</span><span class="pnr-resumo-value">' + formatDate(f.data) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Bem para executar</span><span class="pnr-resumo-value" style="' + simNaoColor(a360.bemParaExecutar) + '">' + simNao(a360.bemParaExecutar) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Local seguro</span><span class="pnr-resumo-value" style="' + simNaoColor(a360.localSeguro) + '">' + simNao(a360.localSeguro) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">EPI disponiveis</span><span class="pnr-resumo-value" style="' + simNaoColor(a360.epiDisponiveis) + '">' + simNao(a360.epiDisponiveis) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Equipamentos OK</span><span class="pnr-resumo-value" style="' + simNaoColor(a360.equipamentosOk) + '">' + simNao(a360.equipamentosOk) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Matriz</span><span class="pnr-resumo-value">' + matrizLabel + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Risco Grave</span><span class="pnr-resumo-value" style="' + (f.riscoGrave ? 'color:var(--status-danger)' : '') + '">' + riscoLabel + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Eventos</span><span class="pnr-resumo-value">' + evtCount + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Riscos controlados</span><span class="pnr-resumo-value" style="' + simNaoColor(f.riscosControlados) + '">' + simNao(f.riscosControlados) + '</span></div>' +
      '<div class="pnr-resumo-row"><span class="pnr-resumo-label">Pode executar</span><span class="pnr-resumo-value" style="' + simNaoColor(f.podeExecutar) + '">' + simNao(f.podeExecutar) + '</span></div>' +
    '</div>';

    // Actions
    if (readOnly) {
      html += '<div class="pnr-actions">' +
        '<button class="pnr-btn-secondary" id="pnr-share-btn">Compartilhar</button>' +
        '<button class="pnr-btn-secondary" id="pnr-back-hist2">Voltar ao Historico</button>' +
      '</div>';
    } else {
      html += '<div class="pnr-actions">' +
        '<button class="pnr-btn-primary" id="pnr-save-btn">Salvar Pense no Risco</button>' +
        '<button class="pnr-btn-secondary" id="pnr-share-save-btn">Salvar e Compartilhar</button>' +
        '<button class="pnr-btn-danger" id="pnr-discard-btn">Descartar</button>' +
      '</div>';

      html += '<div class="pnr-nav-btns" style="margin-top:8px;">' +
        '<button class="pnr-nav-btn pnr-nav-prev" id="pnr-to-step2b">&larr; Eventos</button>' +
      '</div>';
    }

    container.innerHTML = html;
    window.scrollTo(0, 0);
    bindStep3Events();
  }

  function collectStep3() {
    if (readOnly) return;
    var obs = document.getElementById('pnr-obs');
    if (obs) formData.observacoes = obs.value;
    var nome = document.getElementById('pnr-nome');
    if (nome) formData.nomeLegivel = nome.value;
    var data = document.getElementById('pnr-data');
    if (data) formData.data = data.value;
  }

  function computeStatus() {
    if (formData.riscoGrave === true) return 'bloqueado';
    if (formData.matrizDecisao === 'chamarLider') return 'pendente';
    var hasNao = Object.keys(formData.avaliacao360).some(function (k) { return formData.avaliacao360[k] === false; });
    if (hasNao || formData.riscosControlados === false || formData.podeExecutar === false) return 'pendente';
    return 'aprovado';
  }

  function bindStep3Events() {
    // Conclusion answers
    container.querySelectorAll('.conclusion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.getAttribute('data-field');
        var answer = btn.getAttribute('data-answer') === 'sim';
        formData[field] = answer;

        var q = btn.closest('.pnr-question');
        q.querySelectorAll('.pnr-answer-btn').forEach(function (b) { b.className = 'pnr-answer-btn conclusion-btn'; });
        btn.classList.add(answer ? 'selected-sim' : 'selected-nao');

        // Re-render to show/hide warning
        collectStep3();
        renderStep3();
      });
    });

    // Foto
    var fotoBtn = document.getElementById('pnr-foto-btn');
    var arqBtn = document.getElementById('pnr-arq-btn');
    var fotoInput = document.getElementById('pnr-foto-camera');
    var arqInput = document.getElementById('pnr-foto-galeria');

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
          collectStep3();
          renderStep3();
        };
        reader.readAsDataURL(file);
      } else {
        formData.fotoAnexo = 'file:' + file.name;
        collectStep3();
        renderStep3();
      }
    }

    if (fotoInput) fotoInput.addEventListener('change', handleFile);
    if (arqInput) arqInput.addEventListener('change', handleFile);

    var removeBtn = document.getElementById('pnr-remove-foto');
    if (removeBtn) removeBtn.addEventListener('click', function () {
      formData.fotoAnexo = null;
      formData.fotoNome = '';
      collectStep3();
      renderStep3();
    });

    // Save
    var saveBtn = document.getElementById('pnr-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function () { collectStep3(); doSave(); currentStep = 0; renderHistory(); });

    var shareSaveBtn = document.getElementById('pnr-share-save-btn');
    if (shareSaveBtn) shareSaveBtn.addEventListener('click', function () { collectStep3(); doSave(); compartilhar(formData); currentStep = 0; renderHistory(); });

    var shareBtn = document.getElementById('pnr-share-btn');
    if (shareBtn) shareBtn.addEventListener('click', function () { compartilhar(formData); });

    var discardBtn = document.getElementById('pnr-discard-btn');
    if (discardBtn) discardBtn.addEventListener('click', function () {
      if (confirm('Descartar formulario?')) { currentStep = 0; renderHistory(); }
    });

    var backBtn = document.getElementById('pnr-to-step2b');
    if (backBtn) backBtn.addEventListener('click', function () { collectStep3(); currentStep = 2; renderStep2(); });

    var histBtn = document.getElementById('pnr-back-hist2');
    if (histBtn) histBtn.addEventListener('click', function () { currentStep = 0; viewingId = null; readOnly = false; renderHistory(); });
  }

  /* ======= SAVE ======= */
  function doSave() {
    formData.status = computeStatus();
    var data = JSON.parse(JSON.stringify(formData));
    delete data._key;
    if (data.fotoAnexo && data.fotoAnexo.length > 5 * 1024 * 1024) {
      data.fotoAnexo = null;
      data.fotoNome = '';
    }
    saveForm(data);
  }

  /* ======= COMPARTILHAR ======= */
  function gerarResumo(d) {
    var a = d.avaliacao360 || {};
    var yn = function (v) { return v === true ? 'Sim' : (v === false ? 'Nao' : '-'); };
    var evtCount = (d.eventos || []).filter(function (e) { return e.numero; }).length;
    return 'PENSE NO RISCO — ART\n' +
      'Tarefa: ' + (d.tarefa || '-') + '\n' +
      'Local: ' + (d.localTarefa || '-') + '\n' +
      'Data: ' + formatDate(d.data) + '\n\n' +
      'Avaliacao 360:\n' +
      '  Bem para executar: ' + yn(a.bemParaExecutar) + '\n' +
      '  Local seguro: ' + yn(a.localSeguro) + '\n' +
      '  EPI: ' + yn(a.epiDisponiveis) + '\n' +
      '  Equipamentos: ' + yn(a.equipamentosOk) + '\n\n' +
      'Matriz: ' + (d.matrizDecisao === 'realizar' ? 'Realizar' : (d.matrizDecisao === 'chamarLider' ? 'Chamar lider' : '-')) + '\n' +
      'Risco Grave: ' + yn(d.riscoGrave === false ? true : (d.riscoGrave === true ? false : null)).replace('Sim', 'Nao').replace('Nao', d.riscoGrave === true ? 'SIM' : 'Nao') + '\n' +
      'Eventos: ' + evtCount + '\n' +
      'Riscos controlados: ' + yn(d.riscosControlados) + '\n' +
      'Pode executar: ' + yn(d.podeExecutar) + '\n' +
      'Status: ' + (d.status || '-') + '\n\n' +
      '— T4 Trilho 4.0';
  }

  function compartilhar(dados) {
    var texto = gerarResumo(dados);
    if (navigator.share) {
      navigator.share({ title: 'Pense no Risco — ' + (dados.tarefa || ''), text: texto }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(function () {
        alert('Resumo copiado para a area de transferencia!');
      }).catch(function () { alert(texto); });
    } else {
      alert(texto);
    }
  }

  /* ======= INIT ======= */
  renderHistory();

})();
