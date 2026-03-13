(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  function showLoginScreen() {
    var loginScreen = document.getElementById('login-screen');
    var dashboard = document.getElementById('hub-dashboard');
    loginScreen.removeAttribute('hidden');
    loginScreen.style.display = '';
    dashboard.setAttribute('hidden', '');
    dashboard.style.display = 'none';

    /* Show demo hint only in demo mode */
    var demoHint = document.getElementById('login-demo-hint');
    if (demoHint && T4.auth.isDemoMode && T4.auth.isDemoMode()) {
      demoHint.removeAttribute('hidden');
    }

    var btnLogin = document.getElementById('login-btn');
    var inputMat = document.getElementById('login-matricula');
    var inputPin = document.getElementById('login-pin');
    var errorEl = document.getElementById('login-error');

    function doLogin() {
      var result = T4.auth.login(inputMat.value.trim(), inputPin.value.trim());
      if (result.success) {
        T4.storage.local.remove('redirectAfterLogin');
        loginScreen.setAttribute('hidden', '');
        loginScreen.style.display = 'none';
        T4Shell.init.showDashboard();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        inputPin.value = '';
        inputPin.focus();
        T4.utils.vibrate(50);
      }
    }

    btnLogin.addEventListener('click', doLogin);
    inputPin.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    inputMat.addEventListener('keydown', function (e) { if (e.key === 'Enter') inputPin.focus(); });

    // Scroll button into view when mobile keyboard opens
    function scrollLoginBtn() {
      setTimeout(function () {
        btnLogin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
    inputMat.addEventListener('focus', scrollLoginBtn);
    inputPin.addEventListener('focus', scrollLoginBtn);
  }

  // Expose on T4Shell.login namespace
  T4Shell.login = {
    showLoginScreen: showLoginScreen
  };
})();
