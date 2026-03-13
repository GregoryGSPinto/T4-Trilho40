(function() {
  'use strict';

  window.T4 = window.T4 || {};

  /**
   * T4 Data Access Layer
   * Adapter pattern: currently resolves to localStorage.
   * Future: swap to API adapter without changing callers.
   */
  T4.data = {
    _adapter: 'local',

    /**
     * Save a record to a domain store.
     * @param {string} domain - Domain name (e.g., 'jornada', 'art', 'logcco')
     * @param {string} key - Record identifier
     * @param {*} data - Data to persist
     */
    save: function(domain, key, data) {
      var storageKey = 't4-' + domain + '-' + key;
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
      } catch(e) {
        return false;
      }
    },

    /**
     * Get a single record from a domain store.
     * @param {string} domain - Domain name
     * @param {string} key - Record identifier
     * @returns {*} Parsed data or null
     */
    get: function(domain, key) {
      var storageKey = 't4-' + domain + '-' + key;
      try {
        var raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch(e) {
        return null;
      }
    },

    /**
     * Get all records matching a domain prefix.
     * @param {string} domain - Domain name
     * @returns {Array<{key: string, data: *}>} Array of key/data pairs
     */
    getAll: function(domain) {
      var prefix = 't4-' + domain + '-';
      var results = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) {
          try {
            results.push({
              key: key.substring(prefix.length),
              data: JSON.parse(localStorage.getItem(key))
            });
          } catch(e) { /* skip corrupt entries */ }
        }
      }
      return results;
    },

    /**
     * Remove a record.
     * @param {string} domain - Domain name
     * @param {string} key - Record identifier
     */
    remove: function(domain, key) {
      localStorage.removeItem('t4-' + domain + '-' + key);
    },

    /**
     * Simple key-value store (for single-value domains like config, session).
     * Uses 't4_' prefix with underscore to distinguish from domain records.
     */
    kv: {
      get: function(key) {
        try {
          var raw = localStorage.getItem('t4_' + key);
          return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
      },
      set: function(key, value) {
        try {
          localStorage.setItem('t4_' + key, JSON.stringify(value));
          return true;
        } catch(e) { return false; }
      },
      remove: function(key) {
        localStorage.removeItem('t4_' + key);
      },
      has: function(key) {
        return localStorage.getItem('t4_' + key) !== null;
      }
    }
  };
})();
