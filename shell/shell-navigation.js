(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  var modalOverlay = null;

  function navigateTo(viewId) {
    document.querySelectorAll('.t4-view').forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.t4-nav-item').forEach(function (n) { n.classList.remove('active'); });
    var navItem = document.querySelector('[data-nav="' + viewId + '"]');
    if (navItem) navItem.classList.add('active');

    // Show/hide FAB only on Hub
    var fab = document.getElementById('hub-fab');
    if (fab) fab.style.display = viewId === 'hub' ? '' : 'none';

    window.scrollTo(0, 0);

    // Focus search input when navigating to busca
    if (viewId === 'busca') {
      setTimeout(function () {
        var input = document.getElementById('busca-input');
        if (input) input.focus();
      }, 100);
    }
  }

  function initNavigation() {
    modalOverlay = document.getElementById('module-modal');

    document.querySelectorAll('.t4-nav-item[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        T4.utils.vibrate(10);
        navigateTo(btn.getAttribute('data-nav'));
      });
    });

    // Module navigation items (config + busca quick access)
    document.querySelectorAll('[data-nav-module]').forEach(function (el) {
      el.addEventListener('click', function () {
        T4.utils.vibrate(10);
        var moduleId = el.getAttribute('data-nav-module');
        openModuleModal(moduleId);
      });
    });
  }

  function openModuleModal(moduleId) {
    var mod = T4Shell.MODULE_DATA[moduleId];
    if (!mod) return;

    if (!modalOverlay) modalOverlay = document.getElementById('module-modal');

    var statusDotColor = mod.status === 'ready' ? 'var(--accent-green)' : 'var(--accent-gold)';
    var featuresHTML = mod.features.map(function (f) {
      return '<div class="modal-feature"><span class="modal-feature-emoji">' + f.emoji + '</span><span>' + f.text + '</span></div>';
    }).join('');

    var actionLabel = 'Abrir ' + mod.name.split(' ')[0] + (mod.type === 'external' ? ' \u2197' : '');

    document.getElementById('modal-content').innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
        '<h3 style="font-size:20px;font-weight:700;color:' + mod.accentHex + ';margin:0;">' + mod.name + '</h3>' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + statusDotColor + ';display:inline-block;"></span>' +
        '<span style="font-size:11px;color:var(--text-muted);">' + mod.statusLabel + '</span>' +
      '</div>' +
      '<p style="font-size:14px;color:var(--text-secondary);margin:12px 0 20px;line-height:1.6;">' + mod.desc + '</p>' +
      '<div class="modal-features">' + featuresHTML + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;margin-top:24px;">' +
        '<button class="t4-btn-primary" id="modal-open-btn" style="width:100%;justify-content:center;">' + actionLabel + '</button>' +
        '<button class="t4-btn-secondary" id="modal-close-btn" style="width:100%;justify-content:center;">Fechar</button>' +
      '</div>';

    modalOverlay.classList.add('active');

    document.getElementById('modal-open-btn').addEventListener('click', function () {
      closeModal();
      if (mod.type === 'external' && mod.url && mod.url !== '#') {
        window.open(mod.url, '_blank');
      } else if (mod.type === 'external' && mod.url === '#') {
        alert('Link sera disponibilizado em breve.');
        return;
      } else if (mod.path) {
        window.location.href = mod.path;
      } else {
        T4.router.navigate(moduleId);
      }
    });

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function handler(e) {
      if (e.target === modalOverlay) { closeModal(); modalOverlay.removeEventListener('click', handler); }
    });
  }

  function closeModal() {
    if (!modalOverlay) modalOverlay = document.getElementById('module-modal');
    modalOverlay.classList.remove('active');
  }

  // Expose on T4Shell.navigation namespace
  T4Shell.navigation = {
    navigateTo: navigateTo,
    initNavigation: initNavigation,
    openModuleModal: openModuleModal,
    closeModal: closeModal
  };
})();
