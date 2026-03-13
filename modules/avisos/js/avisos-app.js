/* ============================================
   AVISOS OPERACIONAIS — App Logic
   ============================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 't4-avisos';
  var MATRICULA_ATUAL = '0001';

  var CATEGORIAS = [
    'Avistamento na via',
    'Restricao de velocidade',
    'Sinalizacao com defeito',
    'Condicao da via',
    'Passagem de nivel',
    'Condicao do patio',
    'Manobra/Linha ocupada',
    'Comunicacao/Radio',
    'Condicao climatica',
    'Produto perigoso',
    'Ocorrencia de seguranca',
    'Outro'
  ];

  var TRECHOS = [
    'Tubarao \u2014 Vitoria (VTS-VOD)',
    'Vitoria \u2014 Colatina',
    'Colatina \u2014 Gov. Valadares',
    'Gov. Valadares \u2014 Ipatinga',
    'Ipatinga \u2014 Cel. Fabriciano',
    'Cel. Fabriciano \u2014 J. Monlevade',
    'J. Monlevade \u2014 Barao Cocais',
    'Barao Cocais \u2014 Itabira'
  ];

  var PATIOS = [
    'VOD', 'VCS', 'VFZ', 'TO', 'VBR',
    'Tubarao', 'Colatina', 'Gov. Valadares',
    'Ipatinga', 'Cel. Fabriciano',
    'J. Monlevade', 'B. Cocais',
    'Sta Barbara', 'Itabira'
  ];

  /* Demo data */
  function getDefaultAvisos() {
    var now = Date.now();
    return [
      {
        id: 'aviso_demo_1', tipo: 'urgente', categoria: 'Avistamento na via',
        localizacao: { tipo: 'km', kmInicio: 342, kmFim: 342, trecho: 'Vitoria \u2014 Colatina', patio: null },
        descricao: 'Animal de grande porte na faixa de dominio. Buzinar e reduzir velocidade. Aproximacao com cautela.',
        autor: 'Carlos Mendes', matricula: '0047', patio: 'VFZ',
        destinatarios: ['maquinistas', 'lideres'], validade: 4,
        criadoEm: new Date(now - 14 * 60000).toISOString(),
        confirmacoes: 3, confirmadoPor: ['0012', '0023', '0031'], ativo: true
      },
      {
        id: 'aviso_demo_2', tipo: 'atencao', categoria: 'Restricao de velocidade',
        localizacao: { tipo: 'km', kmInicio: 156, kmFim: 158, trecho: 'Colatina \u2014 Gov. Valadares', patio: null },
        descricao: 'Manutencao de via em andamento. Velocidade maxima 30 km/h. Previsao de conclusao as 18:00.',
        autor: 'Lider Marcos Silva', matricula: '0008', patio: 'VCS',
        destinatarios: ['maquinistas', 'lideres', 'cco'], validade: 8,
        criadoEm: new Date(now - 2 * 3600000).toISOString(),
        confirmacoes: 7, confirmadoPor: ['0001', '0012', '0023', '0031', '0042', '0047', '0053'], ativo: true
      },
      {
        id: 'aviso_demo_3', tipo: 'info', categoria: 'Condicao do patio',
        localizacao: { tipo: 'patio', kmInicio: null, kmFim: null, trecho: null, patio: 'VFZ' },
        descricao: 'Patio VFZ normalizado. Linha 3 liberada apos manutencao. Manobra normal em todas as linhas.',
        autor: 'Despachador Ana Costa', matricula: '0015', patio: 'VFZ',
        destinatarios: ['maquinistas'], validade: 12,
        criadoEm: new Date(now - 1 * 3600000).toISOString(),
        confirmacoes: 12, confirmadoPor: [], ativo: true
      },
      {
        id: 'aviso_demo_4', tipo: 'atencao', categoria: 'Sinalizacao com defeito',
        localizacao: { tipo: 'km', kmInicio: 89, kmFim: 89, trecho: 'Tubarao \u2014 Vitoria (VTS-VOD)', patio: null },
        descricao: 'Sinal S-42 apagado. Considerar como aspecto mais restritivo. CCO ciente. Manutencao acionada.',
        autor: 'Pedro Oliveira', matricula: '0033', patio: 'TO',
        destinatarios: ['maquinistas', 'lideres', 'cco'], validade: 24,
        criadoEm: new Date(now - 3 * 3600000).toISOString(),
        confirmacoes: 5, confirmadoPor: ['0001', '0012', '0023', '0031', '0042'], ativo: true
      },
      {
        id: 'aviso_demo_5', tipo: 'urgente', categoria: 'Passagem de nivel',
        localizacao: { tipo: 'km', kmInicio: 203, kmFim: 203, trecho: 'Colatina \u2014 Gov. Valadares', patio: null },
        descricao: 'PN km 203 com cancela travada aberta. Buzinar obrigatorio. Velocidade maxima 20 km/h. Manutencao a caminho.',
        autor: 'Ricardo Santos', matricula: '0051', patio: 'VCS',
        destinatarios: ['maquinistas', 'lideres', 'cco', 'manutencao'], validade: 4,
        criadoEm: new Date(now - 45 * 60000).toISOString(),
        confirmacoes: 4, confirmadoPor: ['0001', '0023', '0033', '0047'], ativo: true
      },
      {
        id: 'aviso_demo_6', tipo: 'info', categoria: 'Condicao climatica',
        localizacao: { tipo: 'km', kmInicio: 400, kmFim: 450, trecho: 'Gov. Valadares \u2014 Ipatinga', patio: null },
        descricao: 'Neblina densa entre km 400 e 450. Visibilidade reduzida para menos de 200m. Atencao redobrada.',
        autor: 'Maq. Felipe Lima', matricula: '0062', patio: 'VCS',
        destinatarios: ['maquinistas'], validade: 4,
        criadoEm: new Date(now - 30 * 60000).toISOString(),
        confirmacoes: 2, confirmadoPor: ['0047', '0053'], ativo: true
      },
      {
        id: 'aviso_demo_7', tipo: 'atencao', categoria: 'Manobra/Linha ocupada',
        localizacao: { tipo: 'patio', kmInicio: null, kmFim: null, trecho: null, patio: 'TO' },
        descricao: 'Patio TO \u2014 Linhas 1 e 2 ocupadas com composicao aguardando manutencao. Usar linha 3 para recepcao.',
        autor: 'Despachador Joao', matricula: '0019', patio: 'TO',
        destinatarios: ['maquinistas', 'lideres'], validade: 8,
        criadoEm: new Date(now - 5 * 3600000).toISOString(),
        confirmacoes: 8, confirmadoPor: [], ativo: true
      }
    ];
  }

  /* Storage */
  function loadAvisos() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    var defaults = getDefaultAvisos();
    saveAvisos(defaults);
    return defaults;
  }

  function saveAvisos(avisos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(avisos));
  }

  /* User info */
  function getUser() {
    try {
      var session = JSON.parse(localStorage.getItem('t4_local_session'));
      if (session) {
        MATRICULA_ATUAL = session.matricula || '0001';
        return { nome: session.nome || 'Gregory', matricula: MATRICULA_ATUAL, patio: session.patio || 'VFZ' };
      }
    } catch (e) {}
    return { nome: 'Gregory', matricula: '0001', patio: 'VFZ' };
  }

  /* Time formatting */
  function formatTimeAgo(isoStr) {
    var diff = Date.now() - new Date(isoStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return 'Ha ' + mins + ' min';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return 'Ha ' + hours + 'h';
    var days = Math.floor(hours / 24);
    return 'Ha ' + days + ' dia' + (days > 1 ? 's' : '');
  }

  /* Check expiry */
  function isExpired(aviso) {
    if (!aviso.validade || aviso.validade === 0) return false;
    var created = new Date(aviso.criadoEm).getTime();
    return Date.now() > created + aviso.validade * 3600000;
  }

  /* Priority sort */
  var tipoPriority = { urgente: 0, atencao: 1, info: 2 };

  function sortAvisos(avisos) {
    return avisos.slice().sort(function (a, b) {
      var expA = isExpired(a) ? 1 : 0;
      var expB = isExpired(b) ? 1 : 0;
      if (expA !== expB) return expA - expB;
      var pa = tipoPriority[a.tipo] || 2;
      var pb = tipoPriority[b.tipo] || 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
  }

  /* ======= RENDER FEED ======= */
  var currentFilter = 'todos';

  function renderFeed() {
    var avisos = loadAvisos();
    var container = document.getElementById('avisos-feed');
    var countEl = document.getElementById('avisos-active-count');

    var activeCount = avisos.filter(function (a) { return a.ativo && !isExpired(a); }).length;
    countEl.textContent = activeCount;

    // Filter
    var filtered = avisos;
    if (currentFilter === 'via') {
      filtered = avisos.filter(function (a) { return a.localizacao.tipo === 'km'; });
    } else if (currentFilter === 'patio') {
      filtered = avisos.filter(function (a) { return a.localizacao.tipo === 'patio'; });
    } else if (currentFilter === 'meus') {
      filtered = avisos.filter(function (a) { return a.matricula === MATRICULA_ATUAL; });
    }

    filtered = sortAvisos(filtered);

    if (!filtered.length) {
      container.innerHTML = '<div class="avisos-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin-bottom:12px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><p>Nenhum aviso nesta categoria</p></div>';
      return;
    }

    var html = '';
    filtered.forEach(function (aviso) {
      var expired = isExpired(aviso);
      var tipoLabels = { urgente: 'URGENTE', atencao: 'ATENCAO', info: 'INFORMATIVO' };
      var locText = '';
      if (aviso.localizacao.tipo === 'km') {
        locText = '\u{1F4CD} km ' + aviso.localizacao.kmInicio;
        if (aviso.localizacao.kmFim && aviso.localizacao.kmFim !== aviso.localizacao.kmInicio) {
          locText += ' a ' + aviso.localizacao.kmFim;
        }
        if (aviso.localizacao.trecho) locText += ' \u2014 ' + aviso.localizacao.trecho;
      } else {
        locText = '\u{1F3ED} Patio ' + (aviso.localizacao.patio || '');
      }

      var jaConfirmou = aviso.confirmadoPor && aviso.confirmadoPor.indexOf(MATRICULA_ATUAL) !== -1;

      html += '<div class="aviso-card ' + aviso.tipo + (expired ? ' expirado' : '') + '">' +
        '<div class="aviso-card-header">' +
          '<span class="aviso-badge-tipo ' + aviso.tipo + '">' + (tipoLabels[aviso.tipo] || 'INFO') + '</span>' +
          (expired ? '<span style="font-size:10px;color:var(--text-muted);">EXPIRADO</span>' : '') +
        '</div>' +
        '<div class="aviso-categoria">' + aviso.categoria + '</div>' +
        '<div class="aviso-localizacao">' + locText + '</div>' +
        '<div class="aviso-descricao">' + aviso.descricao + '</div>' +
        '<div class="aviso-footer">' +
          '<div class="aviso-autor">' +
            '<span>\u{1F464} ' + aviso.autor + ' \u00B7 \u23F1\uFE0F ' + formatTimeAgo(aviso.criadoEm) + '</span>' +
          '</div>' +
          '<button class="aviso-confirmar' + (jaConfirmou ? ' confirmado' : '') + '" data-aviso-id="' + aviso.id + '">' +
            '\u{1F44D} ' + (aviso.confirmacoes || 0) +
          '</button>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;

    // Bind confirm buttons
    container.querySelectorAll('.aviso-confirmar').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-aviso-id');
        confirmarAviso(id);
      });
    });
  }

  function confirmarAviso(id) {
    var avisos = loadAvisos();
    var aviso = avisos.find(function (a) { return a.id === id; });
    if (!aviso) return;

    if (!aviso.confirmadoPor) aviso.confirmadoPor = [];
    var idx = aviso.confirmadoPor.indexOf(MATRICULA_ATUAL);
    if (idx === -1) {
      aviso.confirmadoPor.push(MATRICULA_ATUAL);
      aviso.confirmacoes = (aviso.confirmacoes || 0) + 1;
    } else {
      aviso.confirmadoPor.splice(idx, 1);
      aviso.confirmacoes = Math.max(0, (aviso.confirmacoes || 1) - 1);
    }

    saveAvisos(avisos);
    renderFeed();
  }

  /* ======= MODAL — Novo Aviso ======= */
  function openNovoAvisoModal() {
    var overlay = document.getElementById('aviso-modal-overlay');
    overlay.classList.add('active');
  }

  function closeNovoAvisoModal() {
    var overlay = document.getElementById('aviso-modal-overlay');
    overlay.classList.remove('active');
  }

  function buildModalContent() {
    var content = document.getElementById('aviso-modal-content');

    // Categorias options
    var catOptions = '<option value="">Selecione a categoria</option>';
    CATEGORIAS.forEach(function (c) { catOptions += '<option value="' + c + '">' + c + '</option>'; });

    // Trechos options
    var trechoOptions = '<option value="">Selecione o trecho</option>';
    TRECHOS.forEach(function (t) { trechoOptions += '<option value="' + t + '">' + t + '</option>'; });

    // Patios options
    var patioOptions = '<option value="">Selecione o patio</option>';
    PATIOS.forEach(function (p) { patioOptions += '<option value="' + p + '">' + p + '</option>'; });

    content.innerHTML =
      '<div class="aviso-modal-handle"></div>' +
      '<div class="aviso-modal-title">Novo Aviso</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">TIPO DO AVISO</span>' +
        '<div class="aviso-tipo-grid">' +
          '<div class="aviso-tipo-btn selected" data-tipo="urgente"><span class="tipo-dot"></span>Urgente</div>' +
          '<div class="aviso-tipo-btn" data-tipo="atencao"><span class="tipo-dot"></span>Atencao</div>' +
          '<div class="aviso-tipo-btn" data-tipo="info"><span class="tipo-dot"></span>Info</div>' +
        '</div>' +
      '</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">CATEGORIA</span>' +
        '<select class="aviso-select" id="aviso-categoria">' + catOptions + '</select>' +
      '</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">LOCALIZACAO</span>' +
        '<div class="aviso-loc-toggle">' +
          '<div class="aviso-loc-btn selected" data-loc="km">\u{1F4CD} Km</div>' +
          '<div class="aviso-loc-btn" data-loc="patio">\u{1F3ED} Patio</div>' +
        '</div>' +
        '<div id="aviso-loc-km">' +
          '<div class="aviso-km-row">' +
            '<input type="number" class="aviso-input" id="aviso-km-inicio" placeholder="Km inicio" inputmode="numeric">' +
            '<input type="number" class="aviso-input" id="aviso-km-fim" placeholder="Km fim (opcional)" inputmode="numeric">' +
          '</div>' +
          '<select class="aviso-select" id="aviso-trecho">' + trechoOptions + '</select>' +
        '</div>' +
        '<div id="aviso-loc-patio" style="display:none;">' +
          '<select class="aviso-select" id="aviso-patio">' + patioOptions + '</select>' +
        '</div>' +
      '</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">DESCRICAO</span>' +
        '<textarea class="aviso-textarea" id="aviso-descricao" placeholder="Descreva o aviso..." maxlength="500"></textarea>' +
      '</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">DESTINATARIOS</span>' +
        '<div class="aviso-check-list">' +
          '<div class="aviso-check-item"><input type="checkbox" id="dest-maq" value="maquinistas" checked><label for="dest-maq">Todos os maquinistas</label></div>' +
          '<div class="aviso-check-item"><input type="checkbox" id="dest-lid" value="lideres" checked><label for="dest-lid">Lideres operacionais</label></div>' +
          '<div class="aviso-check-item"><input type="checkbox" id="dest-cco" value="cco"><label for="dest-cco">Despachador CCO</label></div>' +
          '<div class="aviso-check-item"><input type="checkbox" id="dest-man" value="manutencao"><label for="dest-man">Manutencao de via</label></div>' +
          '<div class="aviso-check-item"><input type="checkbox" id="dest-seg" value="seguranca"><label for="dest-seg">Seguranca operacional</label></div>' +
        '</div>' +
      '</div>' +

      '<div class="aviso-form-section">' +
        '<span class="aviso-form-label">VALIDADE</span>' +
        '<div class="aviso-validade-grid">' +
          '<div class="aviso-validade-btn" data-val="1">1h</div>' +
          '<div class="aviso-validade-btn selected" data-val="4">4h</div>' +
          '<div class="aviso-validade-btn" data-val="8">8h</div>' +
          '<div class="aviso-validade-btn" data-val="12">12h</div>' +
          '<div class="aviso-validade-btn" data-val="24">24h</div>' +
          '<div class="aviso-validade-btn" data-val="0">Indef.</div>' +
        '</div>' +
      '</div>' +

      '<button class="aviso-submit-btn" id="aviso-submit">\u{1F4E2} Publicar Aviso</button>' +
      '<button class="aviso-cancel-btn" id="aviso-cancel">Cancelar</button>';

    // Bind tipo selection
    content.querySelectorAll('.aviso-tipo-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        content.querySelectorAll('.aviso-tipo-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });

    // Bind location toggle
    content.querySelectorAll('.aviso-loc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        content.querySelectorAll('.aviso-loc-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        var loc = btn.getAttribute('data-loc');
        document.getElementById('aviso-loc-km').style.display = loc === 'km' ? '' : 'none';
        document.getElementById('aviso-loc-patio').style.display = loc === 'patio' ? '' : 'none';
      });
    });

    // Bind validade
    content.querySelectorAll('.aviso-validade-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        content.querySelectorAll('.aviso-validade-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });

    // Bind submit
    document.getElementById('aviso-submit').addEventListener('click', submitAviso);
    document.getElementById('aviso-cancel').addEventListener('click', closeNovoAvisoModal);
  }

  function submitAviso() {
    var user = getUser();

    // Gather values
    var tipoEl = document.querySelector('.aviso-tipo-btn.selected');
    var tipo = tipoEl ? tipoEl.getAttribute('data-tipo') : 'info';
    var categoria = document.getElementById('aviso-categoria').value;
    var descricao = document.getElementById('aviso-descricao').value.trim();

    if (!categoria) { alert('Selecione uma categoria.'); return; }
    if (!descricao) { alert('Preencha a descricao do aviso.'); return; }

    var locTipo = document.querySelector('.aviso-loc-btn.selected');
    var locType = locTipo ? locTipo.getAttribute('data-loc') : 'km';

    var localizacao = { tipo: locType, kmInicio: null, kmFim: null, trecho: null, patio: null };

    if (locType === 'km') {
      var kmI = document.getElementById('aviso-km-inicio').value;
      if (!kmI) { alert('Informe o km.'); return; }
      localizacao.kmInicio = parseInt(kmI);
      localizacao.kmFim = parseInt(document.getElementById('aviso-km-fim').value) || localizacao.kmInicio;
      localizacao.trecho = document.getElementById('aviso-trecho').value || null;
    } else {
      var p = document.getElementById('aviso-patio').value;
      if (!p) { alert('Selecione o patio.'); return; }
      localizacao.patio = p;
    }

    // Destinatarios
    var dests = [];
    document.querySelectorAll('.aviso-check-item input:checked').forEach(function (cb) {
      dests.push(cb.value);
    });

    // Validade
    var valEl = document.querySelector('.aviso-validade-btn.selected');
    var validade = valEl ? parseInt(valEl.getAttribute('data-val')) : 4;

    var novoAviso = {
      id: 'aviso_' + Date.now(),
      tipo: tipo,
      categoria: categoria,
      localizacao: localizacao,
      descricao: descricao,
      autor: user.nome,
      matricula: user.matricula,
      patio: user.patio,
      destinatarios: dests,
      validade: validade,
      criadoEm: new Date().toISOString(),
      confirmacoes: 0,
      confirmadoPor: [],
      ativo: true
    };

    var avisos = loadAvisos();
    avisos.unshift(novoAviso);
    saveAvisos(avisos);

    closeNovoAvisoModal();
    renderFeed();
  }

  /* ======= INIT ======= */
  function init() {
    getUser();
    renderFeed();
    buildModalContent();

    // Filters
    document.querySelectorAll('.aviso-filtro').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.aviso-filtro').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderFeed();
      });
    });

    // FAB
    document.getElementById('aviso-fab').addEventListener('click', openNovoAvisoModal);

    // Modal overlay close
    document.getElementById('aviso-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeNovoAvisoModal();
    });

    // Back button
    document.getElementById('avisos-back').addEventListener('click', function () {
      window.location.href = '../../';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
