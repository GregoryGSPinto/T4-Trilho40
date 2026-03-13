/* ============================================
   T4 AUTH — Sistema de autenticacao
   Login-first com persistencia local

   Demo mode: credentials loaded from external file.
   Production: replace with SSO/backend auth adapter.
   ============================================ */

T4.auth = (function () {
  var SESSION_KEY = 't4_session';
  var USERS_KEY = 't4_users';

  /**
   * Demo mode flag.
   * When true, authentication uses local demo users.
   * When false, login returns error requesting backend auth.
   * Production deployments should set this to false and
   * implement a backend auth adapter.
   */
  var _demoMode = true;
  var _demoUsersLoaded = false;

  /* Load demo users from external file (not hardcoded) */
  function loadDemoUsers() {
    if (_demoUsersLoaded) return;
    _demoUsersLoaded = true;

    if (!_demoMode) return;

    /* Only load if no users exist yet */
    if (T4.storage.local.has('users')) return;

    /* Fetch demo users from separate data file */
    var basePath = '';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('t4-auth.js') > -1) {
        basePath = src.substring(0, src.lastIndexOf('/js/'));
        break;
      }
    }

    var url = (basePath ? basePath + '/data/demo-users.json' : 'shared/data/demo-users.json');

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (users) {
        if (!T4.storage.local.has('users')) {
          T4.storage.local.set('users', users);
        }
      })
      .catch(function () {
        /* Fallback: if fetch fails (offline first load), use minimal demo user */
        if (!T4.storage.local.has('users')) {
          T4.storage.local.set('users', [
            { id: 'maq001', nome: 'Demo', matricula: '0001', funcao: 'Maquinista',
              patio: 'VOD', turno: 'A', avatar: 'DM', pin: '1234' }
          ]);
        }
      });
  }

  /* Retorna sessao atual */
  function getSession() {
    return T4.storage.local.get('session', null);
  }

  /* Verifica se esta logado */
  function isAuthenticated() {
    var session = getSession();
    return session !== null;
  }

  /* Login por matricula + PIN */
  function login(matricula, pin) {
    if (!_demoMode) {
      return { success: false, error: 'Autenticacao corporativa necessaria' };
    }

    loadDemoUsers();
    var users = T4.storage.local.get('users', []);
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].matricula === matricula && users[i].pin === pin) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      return { success: false, error: 'Matricula ou PIN incorretos' };
    }

    var session = {
      userId: user.id,
      nome: user.nome,
      matricula: user.matricula,
      funcao: user.funcao,
      patio: user.patio,
      turno: user.turno,
      avatar: user.avatar,
      loginAt: Date.now()
    };

    T4.storage.local.set('session', session);

    /* Atualiza contexto operacional */
    T4.context.set({
      maquinista: user.nome,
      patio: user.patio,
      turno: user.turno
    });

    T4.events.emit('auth:login', session);
    return { success: true, session: session };
  }

  /* Logout */
  function logout() {
    T4.storage.local.remove('session');
    T4.events.emit('auth:logout');
    window.location.href = T4.router.getModuleURL('hub') || '/';
  }

  /* Retorna dados do usuario logado */
  function getUser() {
    var session = getSession();
    if (!session) return null;
    return {
      id: session.userId,
      nome: session.nome,
      matricula: session.matricula,
      funcao: session.funcao,
      patio: session.patio,
      turno: session.turno,
      avatar: session.avatar
    };
  }

  /* Atualiza patio do usuario */
  function updatePatio(patio) {
    var session = getSession();
    if (session) {
      session.patio = patio;
      T4.storage.local.set('session', session);
      T4.context.set({ patio: patio });
    }
  }

  /* Atualiza trem escalado */
  function setTrem(prefixo) {
    var session = getSession();
    if (session) {
      session.trem = prefixo;
      T4.storage.local.set('session', session);
      T4.context.set({ trem: prefixo });
    }
  }

  /* Verifica autenticacao e redireciona se necessario */
  function requireAuth() {
    if (!isAuthenticated()) {
      T4.storage.local.set('redirectAfterLogin', window.location.href);
      return false;
    }
    return true;
  }

  /* Gera tela de login (usado por cada modulo) */
  function renderLoginScreen(container) {
    var demoHint = _demoMode
      ? '<p style="color:var(--text-muted);font-size:0.6875rem;margin-top:8px;opacity:0.6;">Demo: matricula 0001 / PIN 1234</p>'
      : '';

    container.innerHTML =
      '<div class="t4-bg-glow t4-bg-glow-teal"></div>' +
      '<div class="t4-bg-glow t4-bg-glow-cyan"></div>' +
      '<div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;position:relative;z-index:1;">' +
        '<div style="margin-bottom:40px;">' +
          '<div class="t4-logo" style="margin-bottom:8px;">T4</div>' +
          '<div class="t4-subtitle">TRILHO 4.0</div>' +
        '</div>' +
        '<div style="width:100%;max-width:300px;">' +
          '<div class="t4-input-group" style="margin-bottom:16px;">' +
            '<label class="t4-label">Matricula</label>' +
            '<input type="text" id="t4-login-matricula" class="t4-input" placeholder="Digite sua matricula" inputmode="numeric" autocomplete="off" aria-label="Matricula">' +
          '</div>' +
          '<div class="t4-input-group" style="margin-bottom:24px;">' +
            '<label class="t4-label">PIN</label>' +
            '<input type="password" id="t4-login-pin" class="t4-input" placeholder="Digite seu PIN" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="PIN">' +
          '</div>' +
          '<div id="t4-login-error" style="color:var(--status-danger);font-size:0.8125rem;margin-bottom:16px;display:none;"></div>' +
          '<button id="t4-login-btn" class="t4-btn-primary" style="width:100%;">Entrar</button>' +
          '<p style="color:var(--text-muted);font-size:0.6875rem;margin-top:32px;letter-spacing:0.5px;">Ecossistema Digital do Maquinista 4.0</p>' +
          demoHint +
        '</div>' +
      '</div>';

    var btnLogin = document.getElementById('t4-login-btn');
    var inputMat = document.getElementById('t4-login-matricula');
    var inputPin = document.getElementById('t4-login-pin');
    var errorEl = document.getElementById('t4-login-error');

    function doLogin() {
      var result = login(inputMat.value.trim(), inputPin.value.trim());
      if (result.success) {
        var redirect = T4.storage.local.get('redirectAfterLogin');
        T4.storage.local.remove('redirectAfterLogin');
        window.location.reload();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        inputPin.value = '';
        inputPin.focus();
        T4.utils.vibrate(50);
      }
    }

    btnLogin.addEventListener('click', doLogin);
    inputPin.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doLogin();
    });
    inputMat.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') inputPin.focus();
    });
  }

  loadDemoUsers();

  return {
    login: login,
    logout: logout,
    getSession: getSession,
    getUser: getUser,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth,
    updatePatio: updatePatio,
    setTrem: setTrem,
    renderLoginScreen: renderLoginScreen,
    /** @type {boolean} True when using demo authentication */
    isDemoMode: function () { return _demoMode; }
  };
})();
