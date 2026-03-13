(function() {
  'use strict';
  window.T4 = window.T4 || {};
  T4.domain = T4.domain || {};

  /**
   * Seguranca Domain Service
   * Manages task risk analysis (ART) data.
   * Future: REST API /api/v1/seguranca/*
   */
  T4.domain.seguranca = {
    STORAGE_PREFIX: 't4-art-',

    /**
     * Get all saved ART records.
     * @returns {Array} List of {key, data} pairs
     */
    getAllART: function() {
      return T4.data ? T4.data.getAll('art') : [];
    },

    /**
     * Save an ART record.
     * @param {string} id - Record identifier
     * @param {Object} data - ART form data
     * @returns {boolean} Success flag
     */
    saveART: function(id, data) {
      return T4.data ? T4.data.save('art', id, data) : false;
    },

    /**
     * Get a single ART record by id.
     * @param {string} id - Record identifier
     * @returns {Object|null}
     */
    getART: function(id) {
      return T4.data ? T4.data.get('art', id) : null;
    },

    /**
     * Remove an ART record.
     * @param {string} id - Record identifier
     */
    removeART: function(id) {
      if (T4.data) T4.data.remove('art', id);
    }
  };
})();
