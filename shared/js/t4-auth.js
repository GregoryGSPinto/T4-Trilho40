/* ============================================
   T4 AUTH — Sistema de autenticação
   Login-first com persistência local
   ============================================ */

T4.auth = (function () {
  const SESSION_KEY = 't4_session';
  const USERS_KEY = 't4_users';

  /* Perfis de demonstração (em produção seria um backend) */
  const DEFAULT_USERS = [
    {
      id: 'maq001',
      nome: 'Gregory',
      matricula: '0001',
      funcao: 'Maquinista Sênior',
      patio: 'VOD',
      turno: 'A',
      avatar: 'GR',
      pin: '1234'
    },
    {
      id: 'maq002',
      nome: 'Carlos Silva',
      matricula: '0002',
      funcao: 'Maquinista',
      patio: 'VFZ',
      turno: 'B',
      avatar: 'CS',
      pin: '5678'
    },
    {
      id: 'maq003',
      nome: 'Roberto Santos',
      matricula: '0003',
      funcao: 'Maquinista Auxiliar',
      patio: 'VCS',
      turno: 'A',
      avatar: 'RS',
      pin: '9012'
    }
  ];

  /* Inicializa usuários padrão se não existirem */
  function initUsers() {
    if (!T4.storage.local.has('users')) {
      T4.storage.local.set('users', DEFAULT_USERS);
    }
  }

  /* Retorna sessão atual */
  function getSession() {
    return T4.storage.local.get('session', null);
  }

  /* Verifica se está logado */
  function isAuthenticated() {
    const session = getSession();
    return session !== null;
  }

  /* Login por matrícula + PIN */
  function login(matricula, pin) {
    initUsers();
    const users = T4.storage.local.get('users', []);
    const user = users.find(u => u.matricula === matricula && u.pin === pin);

    if (!user) {
      return { success: false, error: 'Matrícula ou PIN incorretos' };
    }

    const session = {
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
    return { success: true, session };
  }

  /* Logout */
  function logout() {
    T4.storage.local.remove('session');
    T4.events.emit('auth:logout');
    window.location.href = T4.router.getModuleURL('hub') || '/';
  }

  /* Retorna dados do usuário logado */
  function getUser() {
    const session = getSession();
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

  /* Atualiza pátio do usuário */
  function updatePatio(patio) {
    const session = getSession();
    if (session) {
      session.patio = patio;
      T4.storage.local.set('session', session);
      T4.context.set({ patio });
    }
  }

  /* Atualiza trem escalado */
  function setTrem(prefixo) {
    const session = getSession();
    if (session) {
      session.trem = prefixo;
      T4.storage.local.set('session', session);
      T4.context.set({ trem: prefixo });
    }
  }

  /* Verifica autenticação e redireciona se necessário */
  function requireAuth() {
    if (!isAuthenticated()) {
      T4.storage.local.set('redirectAfterLogin', window.location.href);
      return false;
    }
    return true;
  }

  /* Gera tela de login (usado por cada módulo) */
  function renderLoginScreen(container) {
    container.innerHTML = `
      <div class="t4-login" style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
      ">
        <div style="margin-bottom: 32px;">
          <div style="
            font-family: var(--t4-font-display);
            font-size: 2rem;
            font-weight: 700;
            background: var(--t4-brand-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
          ">T4</div>
          <p style="color: var(--t4-text-secondary); font-size: 0.875rem;">
            Trilho 4.0 — Acesso do Maquinista
          </p>
        </div>

        <div style="width: 100%; max-width: 300px;">
          <div class="t4-input-group" style="margin-bottom: 16px;">
            <label class="t4-label">Matrícula</label>
            <input type="text" id="t4-login-matricula" class="t4-input"
              placeholder="Digite sua matrícula"
              inputmode="numeric" autocomplete="off" aria-label="Matrícula">
          </div>

          <div class="t4-input-group" style="margin-bottom: 24px;">
            <label class="t4-label">PIN</label>
            <input type="password" id="t4-login-pin" class="t4-input"
              placeholder="Digite seu PIN"
              inputmode="numeric" maxlength="4" autocomplete="off" aria-label="PIN">
          </div>

          <div id="t4-login-error" style="
            color: var(--t4-status-danger);
            font-size: 0.8125rem;
            margin-bottom: 16px;
            display: none;
          "></div>

          <button id="t4-login-btn" class="t4-btn t4-btn-primary t4-btn-block t4-btn-lg">
            Entrar
          </button>

          <p style="
            color: var(--t4-text-muted);
            font-size: 0.75rem;
            margin-top: 24px;
          ">
            Demo: Matrícula 0001 / PIN 1234
          </p>
        </div>
      </div>
    `;

    const btnLogin = document.getElementById('t4-login-btn');
    const inputMat = document.getElementById('t4-login-matricula');
    const inputPin = document.getElementById('t4-login-pin');
    const errorEl = document.getElementById('t4-login-error');

    function doLogin() {
      const result = login(inputMat.value.trim(), inputPin.value.trim());
      if (result.success) {
        const redirect = T4.storage.local.get('redirectAfterLogin');
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
    inputPin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
    inputMat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') inputPin.focus();
    });
  }

  initUsers();

  return {
    login,
    logout,
    getSession,
    getUser,
    isAuthenticated,
    requireAuth,
    updatePatio,
    setTrem,
    renderLoginScreen
  };
})();
