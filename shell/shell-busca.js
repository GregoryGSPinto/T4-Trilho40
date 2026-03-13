(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  function loadRecentSearches() {
    try {
      var recent = JSON.parse(localStorage.getItem('t4-recent-searches') || '[]');
      var section = document.getElementById('busca-recentes-section');
      var list = document.getElementById('busca-recentes-list');
      if (recent.length) {
        section.removeAttribute('hidden');
        list.innerHTML = recent.map(function (t) {
          return '<div class="busca-recent-item"><span>&#128340; ' + t + '</span></div>';
        }).join('');
        list.querySelectorAll('.busca-recent-item').forEach(function (item, i) {
          item.addEventListener('click', function () {
            var input = document.getElementById('busca-input');
            input.value = recent[i];
            input.dispatchEvent(new Event('input'));
          });
        });
      } else {
        section.setAttribute('hidden', '');
      }
    } catch (e) {}
  }

  function saveRecentSearch(term) {
    try {
      var recent = JSON.parse(localStorage.getItem('t4-recent-searches') || '[]');
      recent = recent.filter(function (t) { return t !== term; });
      recent.unshift(term);
      if (recent.length > 10) recent = recent.slice(0, 10);
      localStorage.setItem('t4-recent-searches', JSON.stringify(recent));
      loadRecentSearches();
    } catch (e) {}
  }

  function initBusca() {
    var input = document.getElementById('busca-input');
    var clearBtn = document.getElementById('busca-clear');
    var resultsDiv = document.getElementById('busca-results');
    var defaultDiv = document.getElementById('busca-default');

    loadRecentSearches();

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      clearBtn.hidden = !q;

      if (!q) {
        resultsDiv.hidden = true;
        defaultDiv.hidden = false;
        return;
      }

      function normalizeSearch(str) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      var qn = normalizeSearch(q);
      var matches = T4Shell.SEARCH_INDEX.filter(function (item) {
        return normalizeSearch(item.term).indexOf(qn) !== -1;
      }).sort(function (a, b) {
        var an = normalizeSearch(a.term);
        var bn = normalizeSearch(b.term);
        var aExact = an === qn ? 0 : an.indexOf(qn) === 0 ? 1 : 2;
        var bExact = bn === qn ? 0 : bn.indexOf(qn) === 0 ? 1 : 2;
        return aExact - bExact;
      });

      if (matches.length) {
        defaultDiv.hidden = true;
        resultsDiv.hidden = false;
        var html = '<div class="config-section-title" style="margin-top:8px;">RESULTADOS</div>';
        html += '<div class="config-group">';
        matches.forEach(function (m) {
          var catLabels = { modulo: 'Modulo', glossario: 'Glossario', rof: 'ROF', nav: 'Navegacao' };
          html += '<div class="config-item busca-result-item" data-result-term="' + m.term + '"' +
            (m.module ? ' data-nav-module="' + m.module + '"' : '') +
            (m.navTo ? ' data-nav-to="' + m.navTo + '"' : '') + '>' +
            '<div class="config-item-left">' +
              '<span class="config-label">' + m.term + '</span>' +
            '</div>' +
            '<div class="config-item-right">' +
              '<span class="config-value">' + (catLabels[m.cat] || '') + '</span>' +
              '<span class="config-arrow">&rsaquo;</span>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
        resultsDiv.innerHTML = html;

        // Bind result clicks
        resultsDiv.querySelectorAll('.busca-result-item').forEach(function (item) {
          item.addEventListener('click', function () {
            var term = item.getAttribute('data-result-term');
            saveRecentSearch(term);
            var moduleId = item.getAttribute('data-nav-module');
            var navTo = item.getAttribute('data-nav-to');
            if (moduleId) T4Shell.navigation.openModuleModal(moduleId);
            else if (navTo) T4Shell.navigation.navigateTo(navTo);
          });
        });
      } else {
        defaultDiv.hidden = true;
        resultsDiv.hidden = false;
        resultsDiv.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:14px;">Nenhum resultado para "' + input.value.trim() + '"</div>';
      }
    });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.hidden = true;
      resultsDiv.hidden = true;
      defaultDiv.hidden = false;
      input.focus();
    });

    // Category chips
    document.querySelectorAll('.busca-category-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.textContent;
        input.dispatchEvent(new Event('input'));
      });
    });
  }

  // Expose on T4Shell.busca namespace
  T4Shell.busca = {
    initBusca: initBusca,
    loadRecentSearches: loadRecentSearches,
    saveRecentSearch: saveRecentSearch
  };
})();
