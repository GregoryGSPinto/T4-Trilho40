(function() {
  'use strict';
  window.T4 = window.T4 || {};

  /**
   * T4 Module Utilities
   *
   * Extracts common utility functions that were duplicated across
   * self-contained modules (boa-jornada, art, log-cco, timer-jornada).
   *
   * Modules can optionally load this file to use shared helpers instead
   * of maintaining their own copies. Existing modules keep working
   * without changes until migrated.
   */
  T4.moduleUtils = {

    // ── Date / Time Formatting ────────────────────────────────────────

    /**
     * Zero-pad a number to 2 digits.
     * Duplicated in: log-cco-app.js (pad), timer-jornada-app.js (pad)
     * @param {number} n
     * @returns {string}
     */
    pad: function(n) {
      return String(n).padStart(2, '0');
    },

    /**
     * Get today's date as 'YYYY-MM-DD'.
     * Duplicated in: boa-jornada-app.js, art-app.js, log-cco-app.js
     * @returns {string}
     */
    todayStr: function() {
      var d = new Date();
      return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate());
    },

    /**
     * Format a 'YYYY-MM-DD' string as 'DD/MM/YYYY' (Brazilian format).
     * Duplicated in: boa-jornada-app.js (formatDate), art-app.js (formatDate),
     *                log-cco-app.js (formatDateBR)
     * @param {string} str - Date string in YYYY-MM-DD format
     * @returns {string} Formatted date or '-'
     */
    formatDate: function(str) {
      if (!str) return '-';
      var parts = str.split('-');
      if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
      return str;
    },

    /**
     * Format a timestamp (ms since epoch) as 'HH:MM'.
     * Duplicated in: boa-jornada-app.js (formatTime), art-app.js (formatTime)
     * @param {number} timestamp - Milliseconds since epoch
     * @returns {string} Formatted time
     */
    formatTime: function(timestamp) {
      var d = new Date(timestamp);
      return this.pad(d.getHours()) + ':' + this.pad(d.getMinutes());
    },

    /**
     * Format an ISO date string as 'DD/MM/YYYY HH:MM'.
     * Useful for combined display; avoids redundant code in modules.
     * @param {string} isoStr - ISO 8601 date string
     * @returns {string} Formatted date-time
     */
    formatDateTime: function(isoStr) {
      var d = new Date(isoStr);
      return this.pad(d.getDate()) + '/' + this.pad(d.getMonth() + 1) + '/' + d.getFullYear() +
        ' ' + this.pad(d.getHours()) + ':' + this.pad(d.getMinutes());
    },

    /**
     * Get the current time as 'HH:MM'.
     * Duplicated in: log-cco-app.js (nowTime)
     * @returns {string}
     */
    nowTime: function() {
      var d = new Date();
      return this.pad(d.getHours()) + ':' + this.pad(d.getMinutes());
    },

    // ── Config / User Access ──────────────────────────────────────────

    /**
     * Read a key from the t4-config localStorage object.
     * Duplicated in: boa-jornada-app.js (getConfig), art-app.js (getConfig)
     * @param {string} key - Config property name
     * @returns {string} Value or empty string
     */
    getConfig: function(key) {
      try {
        var cfg = JSON.parse(localStorage.getItem('t4-config') || '{}');
        return cfg[key] || '';
      } catch(e) { return ''; }
    },

    /**
     * Get the current user display name.
     * Duplicated in: boa-jornada-app.js (getUser), art-app.js (getUser),
     *                log-cco-app.js (getUser) — note log-cco reads t4_session
     * @returns {string} User name or 'Maquinista'
     */
    getUser: function() {
      try {
        // Try t4-user first (used by boa-jornada, art)
        var u = JSON.parse(localStorage.getItem('t4-user') || '{}');
        if (u.nome || u.name) return u.nome || u.name;
        // Fallback to t4_session (used by log-cco)
        var s = JSON.parse(localStorage.getItem('t4_session') || '{}');
        if (s.nome || s.name) return s.nome || s.name;
        return 'Maquinista';
      } catch(e) { return 'Maquinista'; }
    },

    // ── HTML Escaping ─────────────────────────────────────────────────

    /**
     * Escape a string for safe HTML attribute/content insertion.
     * Duplicated in: art-app.js (esc), log-cco-app.js (esc)
     * @param {string} str - Raw string
     * @returns {string} Escaped string
     */
    esc: function(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    // ── Common localStorage Patterns ──────────────────────────────────

    /**
     * Load and parse a JSON value from localStorage.
     * Common pattern across all modules for reading stored data.
     * @param {string} key - localStorage key
     * @returns {*} Parsed value or null
     */
    loadJSON: function(key) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },

    /**
     * Serialize and save a value to localStorage.
     * Common pattern across all modules for writing stored data.
     * @param {string} key - localStorage key
     * @param {*} data - Data to serialize
     * @returns {boolean} Success flag
     */
    saveJSON: function(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch(e) { return false; }
    },

    // ── ID Generation ─────────────────────────────────────────────────

    /**
     * Generate a unique ID string for records.
     * Duplicated in: log-cco-app.js (genId)
     * @param {string} [prefix] - Optional prefix (e.g., 'log', 'art')
     * @returns {string} Unique identifier
     */
    genId: function(prefix) {
      return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
  };
})();
