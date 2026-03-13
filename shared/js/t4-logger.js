(function() {
  'use strict';
  window.T4 = window.T4 || {};

  /**
   * T4 Debug-Gated Logging Utility
   *
   * Enable debug logging by either:
   *   - Setting localStorage key 't4-debug' to '1'
   *   - Adding ?debug=1 to the page URL
   *   - Calling T4.log.enable() from the console
   *
   * warn() and error() always output regardless of debug flag.
   * debug() and info() are gated behind the debug flag to keep
   * the console clean in production.
   */
  var debugEnabled = localStorage.getItem('t4-debug') === '1' ||
    (window.location && window.location.search.indexOf('debug=1') > -1);

  T4.log = {
    _debug: debugEnabled,

    /**
     * Enable debug logging and persist the preference.
     */
    enable: function() {
      this._debug = true;
      localStorage.setItem('t4-debug', '1');
    },

    /**
     * Disable debug logging and remove the preference.
     */
    disable: function() {
      this._debug = false;
      localStorage.removeItem('t4-debug');
    },

    /**
     * Log a debug message (only when debug is enabled).
     * Accepts any number of arguments, forwarded to console.log.
     */
    debug: function() {
      if (this._debug) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[T4]');
        console.log.apply(console, args);
      }
    },

    /**
     * Log an informational message (only when debug is enabled).
     * Accepts any number of arguments, forwarded to console.info.
     */
    info: function() {
      if (this._debug) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[T4]');
        console.info.apply(console, args);
      }
    },

    /**
     * Log a warning message (always outputs).
     * Accepts any number of arguments, forwarded to console.warn.
     */
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[T4]');
      console.warn.apply(console, args);
    },

    /**
     * Log an error message (always outputs).
     * Accepts any number of arguments, forwarded to console.error.
     */
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[T4]');
      console.error.apply(console, args);
    }
  };
})();
