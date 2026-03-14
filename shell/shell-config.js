(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  var T4Config = {
    _cache: null,
    defaults: function () {
      return {
        patio: 'VFZ', turno: 'A', tremEscalado: 'M346', jornadaMax: 12,
        tema: 'sistema', tamanhoFonte: 'normal', animacoes: true, sons: true,
        notificacoes: true, alertasBoll: true, alertaJornada: true,
        alertasDss: true, relatorios: true, atualizacoes: true,
        modoOffline: false, textoGrande: false, altoContraste: false,
        feedbackTatil: true, bloqueioAuto: true, tempoBloqueio: 5
      };
    },
    load: function () {
      if (this._cache) return this._cache;
      try {
        var saved = localStorage.getItem('t4-config');
        this._cache = saved ? Object.assign(this.defaults(), JSON.parse(saved)) : this.defaults();
      } catch (e) { this._cache = this.defaults(); }
      return this._cache;
    },
    save: function (config) {
      this._cache = config;
      localStorage.setItem('t4-config', JSON.stringify(config));
    },
    set: function (key, value) {
      var c = this.load(); c[key] = value; this.save(c);
    },
    get: function (key) { return this.load()[key]; }
  };

  function applyConfigEffects() {
    var config = T4Config.load();

    // Tema
    document.documentElement.removeAttribute('data-theme');
    if (config.tema === 'claro') document.documentElement.setAttribute('data-theme', 'light');
    if (config.tema === 'escuro') document.documentElement.setAttribute('data-theme', 'dark');

    // Animacoes
    document.body.classList.toggle('t4-no-animations', !config.animacoes);

    // Texto grande
    document.documentElement.style.fontSize = config.textoGrande ? '18px' : '';

    // Alto contraste
    document.body.classList.toggle('t4-high-contrast', config.altoContraste);
  }

  function showConfigModal(type) {
    var modalOverlay = document.getElementById('module-modal');
    var modalContent = document.getElementById('modal-content');
    var config = T4Config.load();
    var html = '';

    if (type === 'patio') {
      var patios = [
        { code: 'VOD', name: 'Vitoria / Oficinas Dique' },
        { code: 'VCS', name: 'Vitoria / Costa' },
        { code: 'VFZ', name: 'Vitoria / Fazendinha' },
        { code: 'TO', name: 'Tubarao Oficinas' },
        { code: 'VBR', name: 'Vitoria / Barreiros' }
      ];
      html = '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">Selecionar Patio</h3>';
      html += '<div class="config-group">';
      patios.forEach(function (p) {
        var active = config.patio === p.code;
        html += '<div class="config-item config-select-item" data-select-value="' + p.code + '">' +
          '<div class="config-item-left"><span class="config-label">' + p.code + '</span>' +
          '<span style="font-size:12px;color:var(--text-muted);margin-left:8px;">' + p.name + '</span></div>' +
          (active ? '<span style="color:var(--accent-teal);font-weight:700;">&#10003;</span>' : '') +
          '</div>';
      });
      html += '</div>';
      html += '<button class="t4-btn-secondary" id="modal-close-btn" style="width:100%;justify-content:center;margin-top:16px;">Fechar</button>';
    } else if (type === 'tema') {
      var temas = [
        { val: 'sistema', label: 'Automatico (Sistema)' },
        { val: 'claro', label: 'Modo Claro' },
        { val: 'escuro', label: 'Modo Escuro' }
      ];
      html = '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">Tema</h3>';
      html += '<div class="config-group">';
      temas.forEach(function (t) {
        var active = config.tema === t.val;
        html += '<div class="config-item config-select-item" data-select-value="' + t.val + '">' +
          '<div class="config-item-left"><span class="config-label">' + t.label + '</span></div>' +
          (active ? '<span style="color:var(--accent-teal);font-weight:700;">&#10003;</span>' : '') +
          '</div>';
      });
      html += '</div>';
      html += '<button class="t4-btn-secondary" id="modal-close-btn" style="width:100%;justify-content:center;margin-top:16px;">Fechar</button>';
    } else if (type === 'fonte') {
      var fontes = [
        { val: 'pequena', label: 'Pequena' },
        { val: 'normal', label: 'Normal' },
        { val: 'grande', label: 'Grande' }
      ];
      html = '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">Tamanho da Fonte</h3>';
      html += '<div class="config-group">';
      fontes.forEach(function (f) {
        var active = config.tamanhoFonte === f.val;
        html += '<div class="config-item config-select-item" data-select-value="' + f.val + '">' +
          '<div class="config-item-left"><span class="config-label">' + f.label + '</span></div>' +
          (active ? '<span style="color:var(--accent-teal);font-weight:700;">&#10003;</span>' : '') +
          '</div>';
      });
      html += '</div>';
      html += '<button class="t4-btn-secondary" id="modal-close-btn" style="width:100%;justify-content:center;margin-top:16px;">Fechar</button>';
    }

    modalContent.innerHTML = html;
    modalOverlay.classList.add('active');

    // Bind select items
    modalContent.querySelectorAll('.config-select-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var val = item.getAttribute('data-select-value');
        if (type === 'patio') {
          T4Config.set('patio', val);
          document.getElementById('config-patio-value').textContent = val;
          var yardEl = document.getElementById('hub-yard-tag');
          if (yardEl) yardEl.textContent = val;
          T4.auth.updatePatio(val);
        } else if (type === 'tema') {
          T4Config.set('tema', val);
          var temaLabels = { sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' };
          document.getElementById('config-tema-value').textContent = temaLabels[val];
          applyConfigEffects();
        } else if (type === 'fonte') {
          T4Config.set('tamanhoFonte', val);
          var fonteLabels = { pequena: 'Pequena', normal: 'Normal', grande: 'Grande' };
          document.getElementById('config-fonte-value').textContent = fonteLabels[val];
          var sizes = { pequena: '14px', normal: '', grande: '18px' };
          document.documentElement.style.fontSize = sizes[val] || '';
        }
        T4Shell.navigation.closeModal();
      });
    });

    document.getElementById('modal-close-btn').addEventListener('click', T4Shell.navigation.closeModal);
    modalOverlay.addEventListener('click', function handler(e) {
      if (e.target === modalOverlay) { T4Shell.navigation.closeModal(); modalOverlay.removeEventListener('click', handler); }
    });
  }

  function initConfig(user) {
    // Profile
    document.getElementById('config-avatar').textContent = user.avatar || user.nome.substring(0, 2).toUpperCase();
    document.getElementById('config-nome').textContent = user.nome;
    document.getElementById('config-funcao').textContent = user.funcao || 'Maquinista';
    document.getElementById('config-matricula').textContent = 'Matricula: ' + (user.matricula || '---');

    var config = T4Config.load();

    // Set operational values
    document.getElementById('config-patio-value').textContent = config.patio;
    document.getElementById('config-turno-value').textContent = config.turno;
    document.getElementById('config-trem-value').textContent = config.tremEscalado;

    // Tema display
    var temaLabels = { sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' };
    document.getElementById('config-tema-value').textContent = temaLabels[config.tema] || 'Sistema';

    // Font display
    var fonteLabels = { pequena: 'Pequena', normal: 'Normal', grande: 'Grande' };
    document.getElementById('config-fonte-value').textContent = fonteLabels[config.tamanhoFonte] || 'Normal';

    // Set toggle states
    document.querySelectorAll('[data-config]').forEach(function (input) {
      var key = input.getAttribute('data-config');
      if (config[key] !== undefined) input.checked = config[key];
    });

    // Toggle change handlers
    document.querySelectorAll('[data-config]').forEach(function (input) {
      input.addEventListener('change', function () {
        var key = input.getAttribute('data-config');
        T4Config.set(key, input.checked);
        applyConfigEffects();
      });
    });

    // Patio selector
    document.getElementById('config-patio-item').addEventListener('click', function () {
      showConfigModal('patio');
    });

    // Tema selector
    document.getElementById('config-tema-item').addEventListener('click', function () {
      showConfigModal('tema');
    });

    // Font selector
    document.getElementById('config-fonte-item').addEventListener('click', function () {
      showConfigModal('fonte');
    });

    // Clear cache
    document.getElementById('config-clear-cache').addEventListener('click', function () {
      if (confirm('Limpar todos os dados em cache?')) {
        caches.keys().then(function (names) {
          names.forEach(function (n) { caches.delete(n); });
        });
        if (T4.notifications) { T4.notifications.success('Cache limpo com sucesso!'); }
        else { alert('Cache limpo com sucesso!'); }
      }
    });

    // Export data
    document.getElementById('config-export-data').addEventListener('click', function () {
      var data = { config: T4Config.load(), alertas: T4Shell.alertas.loadAlertas() };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 't4-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    });

    // Logout
    document.getElementById('config-logout').addEventListener('click', function () {
      if (confirm('Tem certeza que deseja sair?')) {
        T4.auth.logout();
      }
    });

    // Online status
    function updateOnlineStatus() {
      document.getElementById('config-online-status').textContent = navigator.onLine ? 'Online' : 'Offline';
    }
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Last sync
    var now = new Date();
    document.getElementById('config-last-sync').textContent =
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    // Storage estimate
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (est) {
        var usedMB = ((est.usage || 0) / 1024 / 1024).toFixed(1);
        document.getElementById('config-cache-size').textContent = usedMB + ' MB';
        document.getElementById('config-offline-size').textContent = ((est.usage || 0) * 0.4 / 1024 / 1024).toFixed(1) + ' MB';
      });
    }
  }

  // Expose on T4Shell.config namespace
  T4Shell.config = {
    T4Config: T4Config,
    initConfig: initConfig,
    applyConfigEffects: applyConfigEffects,
    showConfigModal: showConfigModal
  };
})();
