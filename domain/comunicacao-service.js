(function() {
  'use strict';
  window.T4 = window.T4 || {};
  T4.domain = T4.domain || {};

  /**
   * Comunicacao Domain Service
   * Manages radio communication logs and operational alerts.
   * Future: REST API /api/v1/comunicacao/*
   */
  T4.domain.comunicacao = {

    // ── Log CCO ───────────────────────────────────────────────────────

    LOGCCO_KEY: 't4_logcco',

    /**
     * Get all communication log entries for the current shift.
     * @returns {Array} Log entries (most-recent first)
     */
    getAllLogs: function() {
      try {
        var raw = localStorage.getItem(this.LOGCCO_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    },

    /**
     * Replace the entire log array (use after bulk edits).
     * @param {Array} logs - Full log array
     */
    saveLogs: function(logs) {
      localStorage.setItem(this.LOGCCO_KEY, JSON.stringify(logs));
    },

    /**
     * Add a single log entry (prepended to the list).
     * @param {Object} entry - Log entry with id, hora, direcao, categoria, descricao, etc.
     * @returns {Object} The entry that was added
     */
    addLog: function(entry) {
      var logs = this.getAllLogs();
      logs.unshift(entry);
      this.saveLogs(logs);
      return entry;
    },

    // ── Avisos ────────────────────────────────────────────────────────

    AVISOS_KEY: 't4_avisos',

    /**
     * Get all operational alerts.
     * @returns {Array} Avisos list
     */
    getAllAvisos: function() {
      try {
        var raw = localStorage.getItem(this.AVISOS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    },

    /**
     * Replace the entire avisos array.
     * @param {Array} avisos - Full avisos array
     */
    saveAvisos: function(avisos) {
      localStorage.setItem(this.AVISOS_KEY, JSON.stringify(avisos));
    },

    /**
     * Add a single aviso (prepended to the list).
     * @param {Object} aviso - Alert object with id, text, lido, etc.
     * @returns {Object} The aviso that was added
     */
    addAviso: function(aviso) {
      var avisos = this.getAllAvisos();
      avisos.unshift(aviso);
      this.saveAvisos(avisos);
      return aviso;
    },

    /**
     * Mark a specific aviso as read.
     * @param {string} id - Aviso identifier
     */
    markAvisoRead: function(id) {
      var avisos = this.getAllAvisos();
      for (var i = 0; i < avisos.length; i++) {
        if (avisos[i].id === id) {
          avisos[i].lido = true;
          break;
        }
      }
      this.saveAvisos(avisos);
    }
  };
})();
