(function() {
  'use strict';
  window.T4 = window.T4 || {};

  /**
   * T4 External Integration Registry
   * Single source of truth for all external system URLs and configurations.
   *
   * Categories:
   * - corporativo: Vale corporate systems (SSO, intranet)
   * - operacional: Operational tools hosted externally
   * - treinamento: Training and development platforms
   */
  T4.integrations = {
    _registry: {
      // === OPERATIONAL EXTERNAL TOOLS ===
      'simulador': {
        name: 'Simulador EFVM',
        url: 'https://simulador-efvm.vercel.app/',
        category: 'treinamento',
        auth: 'none',
        description: 'Simulador de conducao ferroviaria',
        offlineAvailable: false
      },
      'efvm360-ext': {
        name: 'EFVM 360',
        url: 'https://efvm360.vercel.app/login/',
        category: 'treinamento',
        auth: 'external',
        description: 'Plataforma Academy, Exames, Performance',
        offlineAvailable: false
      },
      'ccq': {
        name: 'CCQ Qualidade',
        url: 'https://adamboot-mco.vercel.app/',
        category: 'operacional',
        auth: 'none',
        description: 'PDCA, Ishikawa, 5W2H',
        offlineAvailable: false
      },
      'optima': {
        name: 'OPTIMA WORK AI',
        url: 'https://optima-work-ai.vercel.app',
        category: 'operacional',
        auth: 'none',
        deepLink: 'optima://',
        description: 'PWA de alocacao de equipagem ferroviaria',
        offlineAvailable: false
      },
      'vfz': {
        name: 'VFZ Passagem de Servico',
        url: 'https://vfz-passagem-servico.vercel.app',
        category: 'operacional',
        auth: 'none',
        deepLink: 'vfz://',
        description: 'PWA de passagem de servico ferroviario',
        offlineAvailable: false
      },

      // === VALE CORPORATE SYSTEMS ===
      'edados': {
        name: 'eDados',
        url: 'https://gentemobileprd-globalvale.msappproxy.net/portalrh/Produtos/SAAA/Principal2.aspx',
        category: 'corporativo',
        auth: 'sso',
        description: 'Indicadores e metricas operacionais',
        offlineAvailable: false
      },
      'iris': {
        name: 'IRIS',
        url: 'https://iris.valeglobal.net/login',
        category: 'corporativo',
        auth: 'sso',
        description: 'Registro e investigacao de incidentes',
        offlineAvailable: false
      },
      'epi': {
        name: 'Solicitar EPI',
        url: 'https://vale-forms.valeglobal.net/public?id=Ylabiry79tA%2fjLRjIfA55w%3d%3d&lang=pt-BR&need_auth=false',
        category: 'corporativo',
        auth: 'sso',
        description: 'Formulario de solicitacao de EPIs',
        offlineAvailable: false
      },
      'prontidao': {
        name: 'Prontidao',
        url: 'https://sistemaprontos.com.br/auth/realms/vale/protocol/openid-connect/auth?client_id=teste-web&redirect_uri=https%3A%2F%2Fvale.sistemaprontos.com.br%2F&state=afd52c43-a5b6-4ac0-8217-d6f66c483b56&response_mode=fragment&response_type=code&scope=openid&nonce=65958f8d-23dd-47a7-a2e8-5d30d4360838',
        category: 'corporativo',
        auth: 'sso',
        description: 'Controle de prontidao da equipagem',
        offlineAvailable: false
      },
      'ves': {
        name: 'VES',
        url: 'https://performancemanager4.successfactors.com/sf/start?_s.crb=iORNSJUhFN65jL8S11RUC%252fHCdSDDApYx5mbb%252b9ijQL4%253d',
        category: 'corporativo',
        auth: 'sso',
        description: 'Verificacao de Equipamento de Seguranca',
        offlineAvailable: false
      },

      // === PLACEHOLDERS (URL not yet configured) ===
      'gdb': {
        name: 'GDB',
        url: '#',
        category: 'corporativo',
        auth: 'sso',
        description: 'Gestao de Dados',
        offlineAvailable: false,
        status: 'placeholder'
      },
      'cco': {
        name: 'Painel CCO',
        url: '#',
        category: 'corporativo',
        auth: 'sso',
        description: 'Centro de Controle Operacional',
        offlineAvailable: false,
        status: 'placeholder'
      },
      'convocacao': {
        name: 'Convocacao',
        url: '#',
        category: 'corporativo',
        auth: 'sso',
        description: 'Sistema de convocacao e escala',
        offlineAvailable: false,
        status: 'placeholder'
      },
      'equipfer': {
        name: 'Equipfer',
        url: '#',
        category: 'corporativo',
        auth: 'sso',
        description: 'Gestao de equipamentos ferroviarios',
        offlineAvailable: false,
        status: 'placeholder'
      },
      'central': {
        name: 'Central Info',
        url: '#',
        category: 'corporativo',
        auth: 'sso',
        description: 'Portal de comunicados e normas',
        offlineAvailable: false,
        status: 'placeholder'
      }
    },

    /**
     * Get integration config by ID
     */
    get: function(systemId) {
      return this._registry[systemId] || null;
    },

    /**
     * Open an external system
     */
    open: function(systemId, params) {
      var config = this.get(systemId);
      if (!config || !config.url || config.url === '#') {
        if (T4.notifications) {
          T4.notifications.warning('Sistema ainda nao disponivel');
        }
        return false;
      }

      var url = config.url;
      if (params) {
        var sep = url.indexOf('?') > -1 ? '&' : '?';
        var qs = Object.keys(params).map(function(k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        }).join('&');
        url += sep + qs;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    },

    /**
     * Get all integrations
     */
    getAll: function() {
      return Object.assign({}, this._registry);
    },

    /**
     * Get integrations by category
     */
    getByCategory: function(category) {
      var result = {};
      var keys = Object.keys(this._registry);
      for (var i = 0; i < keys.length; i++) {
        if (this._registry[keys[i]].category === category) {
          result[keys[i]] = this._registry[keys[i]];
        }
      }
      return result;
    },

    /**
     * Check if a system is available (not placeholder)
     */
    isAvailable: function(systemId) {
      var config = this.get(systemId);
      return config && config.url && config.url !== '#' && config.status !== 'placeholder';
    }
  };
})();
