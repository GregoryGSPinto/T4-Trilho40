(function () {
  'use strict';

  var STORAGE_KEY = 't4-log-cco';

  var container = document.getElementById('lc-container');

  /* ======= CATEGORY CONFIG ======= */
  var CATEGORIAS = [
    'Ordem de circulação',
    'Autorização de avanço de sinal',
    'Restrição de velocidade / BOLL',
    'Autorização de manobra',
    'Teste de rádio',
    'Informação de cruzamento',
    'Informação de trem estacionado',
    'Parada de emergência',
    'Confirmação de recebimento',
    'Aviso de condição da via',
    'Liberação de trecho',
    'Outro'
  ];

  var CAT_ICONS = {
    'Ordem de circulação': '📻',
    'Autorização de avanço de sinal': '🟢',
    'Restrição de velocidade / BOLL': '⚠️',
    'Autorização de manobra': '🔄',
    'Teste de rádio': '📡',
    'Informação de cruzamento': '🚂',
    'Informação de trem estacionado': '🅿️',
    'Parada de emergência': '🚨',
    'Confirmação de recebimento': '✅',
    'Aviso de condição da via': '🛤️',
    'Liberação de trecho': '🟢',
    'Outro': '📝'
  };

  /* Map categories to entry accent types */
  function catAccent(cat) {
    if (cat === 'Parada de emergência') return 'emergencia';
    if (cat === 'Restrição de velocidade / BOLL') return 'restricao';
    if (cat === 'Autorização de avanço de sinal' || cat === 'Autorização de manobra' || cat === 'Liberação de trecho') return 'autorizacao';
    if (cat === 'Informação de cruzamento' || cat === 'Informação de trem estacionado' || cat === 'Aviso de condição da via') return 'info';
    return '';
  }

  /* ======= QUICK TEMPLATES ======= */
  var templates = {
    testeRadio: { categoria: 'Teste de rádio', direcao: 'ambos', descricao: 'Teste de rádio com CCO. Sinal OK.' },
    bollRecebida: { categoria: 'Confirmação de recebimento', direcao: 'euCco', descricao: 'Confirmei recebimento de BOLL.' },
    cruzamento: { categoria: 'Informação de cruzamento', direcao: 'ccoEu', descricao: 'CCO informou cruzamento com trem.' },
    paradaEmergencia: { categoria: 'Parada de emergência', direcao: 'euCco', descricao: 'Comuniquei parada de emergência.' }
  };

  /* ======= DIRECTION LABELS ======= */
  var DIR_LABELS = {
    ccoEu: 'CCO→Eu',
    euCco: 'Eu→CCO',
    ambos: 'Eu↔CCO'
  };

  /* ======= UTILS ======= */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function nowTime() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDateBR(str) {
    if (!str) return '-';
    var p = str.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : str;
  }

  function getUser() {
    try {
      var s = JSON.parse(localStorage.getItem('t4_session') || '{}');
      return s.nome || s.name || '';
    } catch (e) {
      return '';
    }
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function genId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  /* ======= STORAGE ======= */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getOrCreateData() {
    var data = loadData();
    var today = todayStr();
    if (!data || data.turnoData !== today) {
      data = {
        turnoData: today,
        turnoInicio: nowTime(),
        trem: '',
        registros: []
      };
      // Add demo data only for fresh install (no previous data at all)
      if (!loadData()) {
        data.registros = createDemoData();
      }
      saveData(data);
    }
    return data;
  }

  function createDemoData() {
    var base = Date.now();
    return [
      {
        id: genId(),
        hora: '06:15',
        direcao: 'ambos',
        categoria: 'Teste de rádio',
        descricao: 'Teste de rádio com CCO. Sinal OK.',
        despachador: 'Carlos',
        criadoEm: base - 28800000
      },
      {
        id: genId(),
        hora: '07:30',
        direcao: 'ccoEu',
        categoria: 'Ordem de circulação',
        descricao: 'CCO autorizou partida do pátio. Linha principal livre até km 142.',
        despachador: 'Carlos',
        criadoEm: base - 24300000
      },
      {
        id: genId(),
        hora: '09:45',
        direcao: 'ccoEu',
        categoria: 'Restrição de velocidade / BOLL',
        descricao: 'BOLL entre km 98 e km 102. Velocidade máxima 20 km/h. Manutenção na via.',
        despachador: 'Ana',
        criadoEm: base - 16200000
      },
      {
        id: genId(),
        hora: '10:10',
        direcao: 'euCco',
        categoria: 'Confirmação de recebimento',
        descricao: 'Confirmei recebimento de BOLL km 98-102.',
        despachador: 'Ana',
        criadoEm: base - 14700000
      }
    ];
  }

  /* ======= DRAWER STATE ======= */
  var drawerOpen = false;

  /* ======= RENDER ======= */
  function render() {
    var data = getOrCreateData();
    var registros = data.registros || [];
    var count = registros.length;

    var html = '';

    // Turno summary card
    html += '<div class="lc-turno-card">';
    html += '  <div class="lc-turno-info">';
    html += '    <div class="lc-turno-date">📋 Turno ' + formatDateBR(data.turnoData) + '</div>';
    html += '    <div class="lc-turno-count">' + count + ' comunicaç' + (count === 1 ? 'ão' : 'ões') + ' registrada' + (count === 1 ? '' : 's') + '</div>';
    html += '  </div>';
    html += '  <div class="lc-turno-badge">' + count + '</div>';
    html += '</div>';

    // New registro button
    html += '<button class="lc-new-btn" onclick="window._lc.openDrawer()">';
    html += '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M12 5v14M5 12h14"/></svg>';
    html += '  Novo Registro';
    html += '</button>';

    // Quick chips
    html += '<div class="lc-chips-row">';
    html += '  <button class="lc-chip" onclick="window._lc.quick(\'testeRadio\')">📡 Teste Rádio OK</button>';
    html += '  <button class="lc-chip" onclick="window._lc.quick(\'bollRecebida\')">✅ BOLL Recebida</button>';
    html += '  <button class="lc-chip" onclick="window._lc.quick(\'cruzamento\')">🚂 Cruzamento</button>';
    html += '  <button class="lc-chip" onclick="window._lc.quick(\'paradaEmergencia\')">🚨 Parada Emerg.</button>';
    html += '</div>';

    // Log entries
    if (count > 0) {
      html += '<div class="lc-section-label">Comunicações</div>';

      // Reverse chronological
      var sorted = registros.slice().sort(function (a, b) {
        return (b.criadoEm || 0) - (a.criadoEm || 0);
      });

      for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i];
        var icon = CAT_ICONS[r.categoria] || '📝';
        var accent = catAccent(r.categoria);

        html += '<div class="lc-entry" data-cat="' + accent + '">';
        html += '  <div class="lc-entry-top">';
        html += '    <span class="lc-entry-icon">' + icon + '</span>';
        html += '    <span class="lc-entry-categoria">' + esc(r.categoria) + '</span>';
        html += '    <span class="lc-entry-hora">' + esc(r.hora) + '</span>';
        html += '  </div>';
        html += '  <div class="lc-entry-desc">' + esc(r.descricao) + '</div>';
        html += '  <div class="lc-entry-bottom">';
        html += '    <span class="lc-dir-badge ' + r.direcao + '">' + (DIR_LABELS[r.direcao] || r.direcao) + '</span>';
        if (r.despachador) {
          html += '    <span class="lc-entry-despachador">Desp: ' + esc(r.despachador) + '</span>';
        }
        html += '    <button class="lc-entry-delete" onclick="window._lc.del(\'' + r.id + '\')" aria-label="Excluir">✕</button>';
        html += '  </div>';
        html += '</div>';
      }
    } else {
      html += '<div class="lc-empty">';
      html += '  <div class="lc-empty-icon">📻</div>';
      html += '  <div class="lc-empty-text">Nenhuma comunicação registrada neste turno.</div>';
      html += '</div>';
    }

    // Export button
    if (count > 0) {
      html += '<button class="lc-export-btn" onclick="window._lc.exportLog()">';
      html += '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>';
      html += '  Exportar Log do Turno';
      html += '</button>';
    }

    // Drawer overlay
    html += '<div class="lc-overlay' + (drawerOpen ? ' active' : '') + '" id="lc-overlay" onclick="window._lc.closeDrawer()"></div>';

    // Drawer form
    html += '<div class="lc-drawer' + (drawerOpen ? ' active' : '') + '" id="lc-drawer">';
    html += '  <div class="lc-drawer-handle"></div>';
    html += '  <div class="lc-drawer-title">Novo Registro</div>';

    // Hora
    html += '  <div class="lc-field">';
    html += '    <label class="lc-field-label">Hora</label>';
    html += '    <input type="time" class="lc-field-input" id="lc-hora" value="' + nowTime() + '">';
    html += '  </div>';

    // Direção
    html += '  <div class="lc-field">';
    html += '    <label class="lc-field-label">Direção</label>';
    html += '    <div class="lc-dir-selector">';
    html += '      <button class="lc-dir-btn active" data-dir="ccoEu" onclick="window._lc.setDir(\'ccoEu\')">CCO→Eu</button>';
    html += '      <button class="lc-dir-btn" data-dir="euCco" onclick="window._lc.setDir(\'euCco\')">Eu→CCO</button>';
    html += '      <button class="lc-dir-btn" data-dir="ambos" onclick="window._lc.setDir(\'ambos\')">Ambos</button>';
    html += '    </div>';
    html += '  </div>';

    // Categoria
    html += '  <div class="lc-field">';
    html += '    <label class="lc-field-label">Categoria</label>';
    html += '    <select class="lc-field-select" id="lc-categoria">';
    html += '      <option value="">Selecionar...</option>';
    for (var c = 0; c < CATEGORIAS.length; c++) {
      html += '      <option value="' + esc(CATEGORIAS[c]) + '">' + esc(CATEGORIAS[c]) + '</option>';
    }
    html += '    </select>';
    html += '  </div>';

    // Descrição
    html += '  <div class="lc-field">';
    html += '    <label class="lc-field-label">Descrição</label>';
    html += '    <textarea class="lc-field-textarea" id="lc-descricao" placeholder="Detalhes da comunicação..."></textarea>';
    html += '  </div>';

    // Despachador
    html += '  <div class="lc-field">';
    html += '    <label class="lc-field-label">Despachador (opcional)</label>';
    html += '    <input type="text" class="lc-field-input" id="lc-despachador" placeholder="Nome do despachador">';
    html += '  </div>';

    // Buttons
    html += '  <button class="lc-submit-btn" onclick="window._lc.submit()">Registrar</button>';
    html += '  <button class="lc-cancel-btn" onclick="window._lc.closeDrawer()">Cancelar</button>';

    html += '</div>';

    // Toast
    html += '<div class="lc-toast" id="lc-toast"></div>';

    container.innerHTML = html;
  }

  /* ======= CURRENT DIRECTION STATE ======= */
  var currentDir = 'ccoEu';

  /* ======= ACTIONS ======= */
  function openDrawer() {
    drawerOpen = true;
    currentDir = 'ccoEu';
    render();
    // Focus after animation
    setTimeout(function () {
      var el = document.getElementById('lc-categoria');
      if (el) el.focus();
    }, 400);
  }

  function closeDrawer() {
    drawerOpen = false;
    render();
  }

  function setDir(dir) {
    currentDir = dir;
    var btns = document.querySelectorAll('.lc-dir-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute('data-dir') === dir) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    }
  }

  function submit() {
    var categoriaEl = document.getElementById('lc-categoria');
    var descricaoEl = document.getElementById('lc-descricao');
    var horaEl = document.getElementById('lc-hora');
    var despachadorEl = document.getElementById('lc-despachador');

    var categoria = categoriaEl ? categoriaEl.value.trim() : '';
    var descricao = descricaoEl ? descricaoEl.value.trim() : '';
    var hora = horaEl ? horaEl.value : nowTime();
    var despachador = despachadorEl ? despachadorEl.value.trim() : '';

    if (!categoria) {
      showToast('Selecione uma categoria.');
      return;
    }
    if (!descricao) {
      showToast('Preencha a descrição.');
      return;
    }

    var data = getOrCreateData();
    data.registros.push({
      id: genId(),
      hora: hora,
      direcao: currentDir,
      categoria: categoria,
      descricao: descricao,
      despachador: despachador,
      criadoEm: Date.now()
    });
    saveData(data);

    drawerOpen = false;
    render();
    showToast('Registro salvo.');
  }

  function quickRegister(key) {
    var tmpl = templates[key];
    if (!tmpl) return;

    var data = getOrCreateData();
    data.registros.push({
      id: genId(),
      hora: nowTime(),
      direcao: tmpl.direcao,
      categoria: tmpl.categoria,
      descricao: tmpl.descricao,
      despachador: '',
      criadoEm: Date.now()
    });
    saveData(data);
    render();
    showToast('Registro rápido salvo.');
  }

  function deleteEntry(id) {
    var data = getOrCreateData();
    data.registros = data.registros.filter(function (r) { return r.id !== id; });
    saveData(data);
    render();
    showToast('Registro excluído.');
  }

  /* ======= EXPORT ======= */
  function exportLog() {
    var data = getOrCreateData();
    var registros = (data.registros || []).slice().sort(function (a, b) {
      return (a.criadoEm || 0) - (b.criadoEm || 0);
    });
    var userName = getUser() || 'Maquinista';

    var sep = '═══════════════════════════════════';
    var lines = [];
    lines.push('═══ LOG CCO — TURNO ' + formatDateBR(data.turnoData) + ' ═══');
    lines.push('Maquinista: ' + userName);
    lines.push('');

    for (var i = 0; i < registros.length; i++) {
      var r = registros[i];
      var dirLabel = DIR_LABELS[r.direcao] || r.direcao;
      lines.push(r.hora + ' | ' + (r.categoria || '').toUpperCase() + ' | ' + dirLabel);
      lines.push(r.descricao || '');
      if (r.despachador) {
        lines.push('Despachador: ' + r.despachador);
      }
      lines.push('');
    }

    lines.push(sep);
    lines.push('Total: ' + registros.length + ' comunicaç' + (registros.length === 1 ? 'ão' : 'ões'));

    var text = lines.join('\n');

    // Try Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'Log CCO — ' + formatDateBR(data.turnoData),
        text: text
      }).catch(function () {
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Log copiado para a área de transferência.');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Log copiado para a área de transferência.');
    } catch (e) {
      showToast('Não foi possível copiar.');
    }
    document.body.removeChild(ta);
  }

  /* ======= TOAST ======= */
  var toastTimer = null;
  function showToast(msg) {
    clearTimeout(toastTimer);
    var el = document.getElementById('lc-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2200);
  }

  /* ======= BACK ======= */
  document.getElementById('lc-back').addEventListener('click', function () {
    window.location.href = '../../';
  });

  /* ======= PUBLIC API ======= */
  window._lc = {
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    setDir: setDir,
    submit: submit,
    quick: quickRegister,
    del: deleteEntry,
    exportLog: exportLog
  };

  /* ======= INIT ======= */
  render();

})();
