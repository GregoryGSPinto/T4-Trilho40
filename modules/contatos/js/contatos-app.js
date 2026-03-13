/* ===== T4 — Contatos Rápidos ===== */
(function () {
  'use strict';

  // ── Default Contacts ──────────────────────────────────────────────
  var contatosPadrao = {
    emergencia: [
      { nome: 'Emergência EFVM', tel: '08007231515', icon: '\u{1F6A8}' },
      { nome: 'SAMU', tel: '192', icon: '\u{1F691}' },
      { nome: 'Bombeiros', tel: '193', icon: '\u{1F692}' },
      { nome: 'Polícia Ferroviária', tel: '190', icon: '\u{1F694}' }
    ],
    operacional: [
      { nome: 'CCO / Despacho EFVM', tel: '2733001000', canalRadio: 'Canal 5', icon: '\u{1F4FB}' },
      { nome: 'Líder Operacional — VFZ', tel: '2733001001', icon: '\u{1F464}' },
      { nome: 'Líder Operacional — TO', tel: '2733001002', icon: '\u{1F464}' },
      { nome: 'Líder Operacional — VOD', tel: '2733001003', icon: '\u{1F464}' },
      { nome: 'Manutenção de Via', tel: '2733001010', icon: '\u{1F527}' },
      { nome: 'Manutenção Locomotiva', tel: '2733001011', icon: '\u{1F527}' },
      { nome: 'Segurança Operacional', tel: '2733001020', icon: '\u{1F6E1}\uFE0F' }
    ],
    apoio: [
      { nome: 'Saúde / Ambulatório', tel: '2733001030', icon: '\u{1F3E5}' },
      { nome: 'RH / Gestão de Pessoas', tel: '2733001040', icon: '\u{1F4CB}' },
      { nome: 'Transporte', tel: '2733001050', icon: '\u{1F690}' }
    ]
  };

  var STORAGE_KEY = 't4-contatos-custom';

  // ── Helpers ────────────────────────────────────────────────────────

  function isShortNumber(tel) {
    return /^\d{2,3}$/.test(tel);
  }

  function is0800(tel) {
    return /^0800/.test(tel);
  }

  function formatPhone(tel) {
    if (isShortNumber(tel)) return tel;
    if (is0800(tel)) {
      // 0800 XXX XXXX
      var digits = tel.replace(/\D/g, '');
      if (digits.length === 11) {
        return digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
      }
      return tel;
    }
    var d = tel.replace(/\D/g, '');
    if (d.length === 10) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    }
    if (d.length === 11) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    }
    return tel;
  }

  function telHref(tel) {
    if (isShortNumber(tel)) return 'tel:' + tel;
    if (is0800(tel)) return 'tel:' + tel;
    var d = tel.replace(/\D/g, '');
    return 'tel:+55' + d;
  }

  function waHref(tel) {
    var d = tel.replace(/\D/g, '');
    return 'https://wa.me/55' + d;
  }

  function canWhatsApp(tel) {
    return !isShortNumber(tel) && !is0800(tel);
  }

  // ── Custom Contacts Storage ────────────────────────────────────────

  function loadCustom() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) { /* ignore */ }
    // First-time demo contact
    var demo = [
      { nome: 'João Silva', cargo: 'Maquinista', tel: '27999990001', icon: '\u{1F468}\u200D\u{1F527}', id: Date.now() }
    ];
    saveCustom(demo);
    return demo;
  }

  function saveCustom(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  // ── SVG Icons ──────────────────────────────────────────────────────

  var svgCall = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

  var svgWhatsApp = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.15 12.01c0-5.455 4.436-9.89 9.9-9.89a9.83 9.83 0 017 2.9 9.83 9.83 0 012.9 7.01c-.004 5.455-4.44 9.89-9.9 9.89zm0-21.67C5.438.115.105 5.448.1 12.06a11.77 11.77 0 001.578 5.897L0 24l6.233-1.635a11.87 11.87 0 005.81 1.48h.006c6.613 0 11.996-5.383 12-11.995a11.93 11.93 0 00-3.516-8.51A11.93 11.93 0 0012.05.115z"/></svg>';

  var svgDelete = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';

  var svgSearch = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';

  var svgPlus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>';

  // ── DOM References ─────────────────────────────────────────────────

  var container = document.getElementById('ct-container');
  var backBtn = document.getElementById('ct-back');
  var searchQuery = '';

  // ── Rendering ──────────────────────────────────────────────────────

  function matchesSearch(contact) {
    if (!searchQuery) return true;
    var q = searchQuery.toLowerCase();
    var haystack = (contact.nome + ' ' + contact.tel + ' ' + (contact.cargo || '') + ' ' + (contact.canalRadio || '')).toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  function renderCard(contact, category) {
    var iconClass = 'ct-icon ct-icon--' + category;
    var extra = '';
    if (contact.canalRadio) {
      extra = '<div class="ct-extra">' + escHtml(contact.canalRadio) + '</div>';
    }
    if (contact.cargo) {
      extra = '<div class="ct-extra">' + escHtml(contact.cargo) + '</div>';
    }

    var actions = '<a class="ct-btn ct-btn--call" href="' + telHref(contact.tel) + '" aria-label="Ligar">' + svgCall + '</a>';

    if (canWhatsApp(contact.tel)) {
      actions += '<a class="ct-btn ct-btn--whatsapp" href="' + waHref(contact.tel) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + svgWhatsApp + '</a>';
    }

    if (category === 'custom' && contact.id) {
      actions += '<button class="ct-btn ct-btn--delete" data-delete-id="' + contact.id + '" aria-label="Excluir">' + svgDelete + '</button>';
    }

    return '<div class="ct-card">' +
      '<div class="' + iconClass + '">' + contact.icon + '</div>' +
      '<div class="ct-info">' +
        '<div class="ct-name">' + escHtml(contact.nome) + '</div>' +
        '<div class="ct-tel">' + formatPhone(contact.tel) + '</div>' +
        extra +
      '</div>' +
      '<div class="ct-actions">' + actions + '</div>' +
    '</div>';
  }

  function renderSection(title, contacts, category) {
    var filtered = contacts.filter(matchesSearch);
    if (filtered.length === 0) return '';

    var cards = filtered.map(function (c) { return renderCard(c, category); }).join('');

    return '<div class="ct-section">' +
      '<div class="ct-section-title">' + escHtml(title) + '</div>' +
      '<div class="ct-group">' + cards + '</div>' +
    '</div>';
  }

  function render() {
    var customContacts = loadCustom();
    var html = '';

    // Emergency highlight button (only when not searching or it matches)
    var emer = contatosPadrao.emergencia[0];
    if (matchesSearch(emer)) {
      html += '<a class="ct-emergency-btn" href="' + telHref(emer.tel) + '">' +
        '<div class="ct-emergency-icon">' + emer.icon + '</div>' +
        '<div class="ct-emergency-info">' +
          '<div class="ct-emergency-name">' + escHtml(emer.nome) + '</div>' +
          '<div class="ct-emergency-tel">' + formatPhone(emer.tel) + '</div>' +
        '</div>' +
        '<div class="ct-emergency-call">' + svgCall + '</div>' +
      '</a>';
    }

    // Search
    html += '<div class="ct-search-wrap">' +
      '<span class="ct-search-icon">' + svgSearch + '</span>' +
      '<input type="text" class="ct-search" id="ct-search" placeholder="Buscar contato..." value="' + escAttr(searchQuery) + '">' +
    '</div>';

    // Sections
    var emerCards = contatosPadrao.emergencia.slice(1); // Skip first (highlighted)
    html += renderSection('Emergência', emerCards, 'emergencia');
    html += renderSection('Operacional', contatosPadrao.operacional, 'operacional');
    html += renderSection('Apoio', contatosPadrao.apoio, 'apoio');

    // Custom contacts section
    var customFiltered = customContacts.filter(matchesSearch);
    var customSection = '';
    if (customFiltered.length > 0 || !searchQuery) {
      customSection = '<div class="ct-section">' +
        '<div class="ct-section-title">Meus Contatos</div>';

      if (customFiltered.length > 0) {
        customSection += '<div class="ct-group">' +
          customFiltered.map(function (c) { return renderCard(c, 'custom'); }).join('') +
        '</div>';
      } else if (!searchQuery) {
        customSection += '<div class="ct-empty"><div class="ct-empty-icon">\u{1F4D6}</div>Nenhum contato personalizado</div>';
      }

      customSection += '<button class="ct-add-btn" id="ct-add-btn">' + svgPlus + ' Adicionar contato</button>' +
      '</div>';
    }
    html += customSection;

    // No results
    if (searchQuery) {
      var totalVisible = contatosPadrao.emergencia.filter(matchesSearch).length +
        contatosPadrao.operacional.filter(matchesSearch).length +
        contatosPadrao.apoio.filter(matchesSearch).length +
        customFiltered.length;
      if (totalVisible === 0) {
        html += '<div class="ct-no-results">Nenhum contato encontrado para "<strong>' + escHtml(searchQuery) + '</strong>"</div>';
      }
    }

    // Drawer overlay + drawer
    html += '<div class="ct-overlay" id="ct-overlay"></div>';
    html += '<div class="ct-drawer" id="ct-drawer">' +
      '<div class="ct-drawer-handle"></div>' +
      '<div class="ct-drawer-title">Novo Contato</div>' +
      '<div class="ct-field">' +
        '<label class="ct-label" for="ct-f-nome">Nome *</label>' +
        '<input class="ct-input" id="ct-f-nome" type="text" placeholder="Ex: Carlos Ferreira">' +
      '</div>' +
      '<div class="ct-field">' +
        '<label class="ct-label" for="ct-f-cargo">Cargo</label>' +
        '<input class="ct-input" id="ct-f-cargo" type="text" placeholder="Ex: Maquinista (opcional)">' +
      '</div>' +
      '<div class="ct-field">' +
        '<label class="ct-label" for="ct-f-tel">Telefone *</label>' +
        '<input class="ct-input" id="ct-f-tel" type="tel" placeholder="Ex: 27999991234">' +
      '</div>' +
      '<button class="ct-save-btn" id="ct-save-btn">Salvar</button>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  // ── Events ─────────────────────────────────────────────────────────

  function bindEvents() {
    var searchInput = document.getElementById('ct-search');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value.trim();
        render();
        // Restore focus & cursor position
        var newInput = document.getElementById('ct-search');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    var addBtn = document.getElementById('ct-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', openDrawer);
    }

    var overlay = document.getElementById('ct-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeDrawer);
    }

    var saveBtn = document.getElementById('ct-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveContact);
    }

    // Delete buttons
    var deleteBtns = container.querySelectorAll('[data-delete-id]');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-delete-id'), 10);
        deleteContact(id);
      });
    });
  }

  function openDrawer() {
    var overlay = document.getElementById('ct-overlay');
    var drawer = document.getElementById('ct-drawer');
    if (overlay) overlay.classList.add('ct-overlay--active');
    if (drawer) drawer.classList.add('ct-drawer--active');
    // Clear form
    var fNome = document.getElementById('ct-f-nome');
    var fCargo = document.getElementById('ct-f-cargo');
    var fTel = document.getElementById('ct-f-tel');
    if (fNome) fNome.value = '';
    if (fCargo) fCargo.value = '';
    if (fTel) fTel.value = '';
    setTimeout(function () {
      if (fNome) fNome.focus();
    }, 350);
  }

  function closeDrawer() {
    var overlay = document.getElementById('ct-overlay');
    var drawer = document.getElementById('ct-drawer');
    if (overlay) overlay.classList.remove('ct-overlay--active');
    if (drawer) drawer.classList.remove('ct-drawer--active');
  }

  function saveContact() {
    var fNome = document.getElementById('ct-f-nome');
    var fCargo = document.getElementById('ct-f-cargo');
    var fTel = document.getElementById('ct-f-tel');

    var nome = (fNome ? fNome.value : '').trim();
    var cargo = (fCargo ? fCargo.value : '').trim();
    var tel = (fTel ? fTel.value : '').replace(/\D/g, '');

    if (!nome) {
      if (fNome) fNome.focus();
      return;
    }
    if (!tel) {
      if (fTel) fTel.focus();
      return;
    }

    var list = loadCustom();
    list.push({
      nome: nome,
      cargo: cargo || null,
      tel: tel,
      icon: '\u{1F464}',
      id: Date.now()
    });
    saveCustom(list);
    closeDrawer();
    render();
  }

  function deleteContact(id) {
    if (!confirm('Excluir este contato?')) return;
    var list = loadCustom();
    list = list.filter(function (c) { return c.id !== id; });
    saveCustom(list);
    render();
  }

  // ── Utilities ──────────────────────────────────────────────────────

  function escHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Back Button ────────────────────────────────────────────────────

  backBtn.addEventListener('click', function () {
    window.location.href = '../../';
  });

  // ── Init ───────────────────────────────────────────────────────────

  render();

})();
