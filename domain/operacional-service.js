(function() {
  'use strict';
  window.T4 = window.T4 || {};
  T4.domain = T4.domain || {};

  /**
   * Operacional Domain Service
   * Manages contacts, operational context, and configuration.
   * Future: REST API /api/v1/operacional/*
   */
  T4.domain.operacional = {

    // ── Contacts ──────────────────────────────────────────────────────

    CONTATOS_KEY: 't4-contatos-custom',

    /**
     * Get the saved contacts list.
     * @returns {Array} Contacts array
     */
    getAllContatos: function() {
      try {
        var raw = localStorage.getItem(this.CONTATOS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    },

    /**
     * Replace the entire contacts list.
     * @param {Array} contatos - Full contacts array
     */
    saveContatos: function(contatos) {
      localStorage.setItem(this.CONTATOS_KEY, JSON.stringify(contatos));
    },

    // ── User config ───────────────────────────────────────────────────

    /**
     * Get the user configuration object.
     * @returns {Object} Config key-value map
     */
    getConfig: function() {
      try {
        var raw = localStorage.getItem('t4-config');
        return raw ? JSON.parse(raw) : {};
      } catch(e) { return {}; }
    },

    /**
     * Save the user configuration object.
     * @param {Object} config - Config key-value map
     */
    saveConfig: function(config) {
      localStorage.setItem('t4-config', JSON.stringify(config));
    },

    // ── Operational context helpers ───────────────────────────────────

    /**
     * Get the current user/session info.
     * @returns {Object|null} Session data or null
     */
    getUserInfo: function() {
      try {
        var raw = localStorage.getItem('t4_session');
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },

    /**
     * Get the current patio (yard) name from config or session.
     * @returns {string} Patio name or 'N/A'
     */
    getPatio: function() {
      var config = this.getConfig();
      var user = this.getUserInfo();
      return (config && config.patio) || (user && user.patio) || 'N/A';
    },

    /**
     * Get the current shift/turno identifier.
     * @returns {string} Turno letter (defaults to 'A')
     */
    getTurno: function() {
      var config = this.getConfig();
      return (config && config.turno) || 'A';
    }
  };
})();
