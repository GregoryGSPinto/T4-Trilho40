(function() {
  'use strict';
  window.T4 = window.T4 || {};
  T4.domain = T4.domain || {};

  /**
   * Jornada Domain Service
   * Manages journey timer and shift handover data.
   * Current adapter: localStorage
   * Future: REST API /api/v1/jornada/*
   */
  T4.domain.jornada = {
    STORAGE_KEY_ATIVA: 't4-jornada-ativa',
    STORAGE_KEY_HISTORICO: 't4-jornada-historico',
    MAX_HISTORICO: 30,

    // ── Active journey ────────────────────────────────────────────────

    /**
     * Get the currently active journey, if any.
     * @returns {Object|null} Active journey data or null
     */
    getAtiva: function() {
      try {
        var raw = localStorage.getItem(this.STORAGE_KEY_ATIVA);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },

    /**
     * Save active journey state.
     * @param {Object} jornada - Journey data to persist
     */
    saveAtiva: function(jornada) {
      localStorage.setItem(this.STORAGE_KEY_ATIVA, JSON.stringify(jornada));
    },

    /**
     * Clear the active journey (on journey end).
     */
    clearAtiva: function() {
      localStorage.removeItem(this.STORAGE_KEY_ATIVA);
    },

    /**
     * Check whether a journey is currently active.
     * @returns {boolean}
     */
    isActive: function() {
      var j = this.getAtiva();
      return j && j.ativa === true;
    },

    // ── History ───────────────────────────────────────────────────────

    /**
     * Get the journey history list (most-recent first).
     * @returns {Array} List of completed journey entries
     */
    getHistorico: function() {
      try {
        var raw = localStorage.getItem(this.STORAGE_KEY_HISTORICO);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    },

    /**
     * Add a completed journey to the history (capped at MAX_HISTORICO).
     * @param {Object} entry - Completed journey record
     */
    addToHistorico: function(entry) {
      var hist = this.getHistorico();
      hist.unshift(entry);
      if (hist.length > this.MAX_HISTORICO) hist = hist.slice(0, this.MAX_HISTORICO);
      localStorage.setItem(this.STORAGE_KEY_HISTORICO, JSON.stringify(hist));
    },

    // ── Elapsed time calculation ──────────────────────────────────────

    /**
     * Calculate elapsed milliseconds since journey start.
     * @param {Object} jornada - Journey object with 'inicio' ISO string
     * @returns {number} Elapsed milliseconds (0 if invalid)
     */
    calcElapsed: function(jornada) {
      if (!jornada || !jornada.inicio) return 0;
      return Date.now() - new Date(jornada.inicio).getTime();
    },

    // ── Phase determination ───────────────────────────────────────────

    /**
     * Determine the current phase based on elapsed time.
     * Phases: normal < 10h, atencao 10-11h, alerta 11-11.5h, critico >= 11.5h.
     * @param {number} elapsedMs - Elapsed time in milliseconds
     * @returns {string} Phase name
     */
    getPhase: function(elapsedMs) {
      var hours = elapsedMs / 3600000;
      if (hours >= 11.5) return 'critico';
      if (hours >= 11) return 'alerta';
      if (hours >= 10) return 'atencao';
      return 'normal';
    },

    // ── Boa Jornada (shift handover) ──────────────────────────────────

    /**
     * Get all saved Boa Jornada records.
     * @returns {Array} List of {key, data} pairs
     */
    getAllBoaJornada: function() {
      return T4.data ? T4.data.getAll('boa-jornada') : [];
    },

    /**
     * Save a Boa Jornada record.
     * @param {string} id - Record identifier
     * @param {Object} data - Boa Jornada form data
     * @returns {boolean} Success flag
     */
    saveBoaJornada: function(id, data) {
      return T4.data ? T4.data.save('boa-jornada', id, data) : false;
    },

    /**
     * Get a single Boa Jornada record by id.
     * @param {string} id - Record identifier
     * @returns {Object|null}
     */
    getBoaJornada: function(id) {
      return T4.data ? T4.data.get('boa-jornada', id) : null;
    },

    /**
     * Remove a Boa Jornada record.
     * @param {string} id - Record identifier
     */
    removeBoaJornada: function(id) {
      if (T4.data) T4.data.remove('boa-jornada', id);
    }
  };
})();
