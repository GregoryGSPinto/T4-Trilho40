/* ============================================
   T4 NOTIFICATIONS — Sistema de alertas e toasts
   ============================================ */

T4.notifications = (function () {
  let container = null;
  let toastId = 0;

  /* Ícones por tipo */
  const ICONS = {
    ok: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ'
  };

  /* Cria container de toasts se não existir */
  function ensureContainer() {
    if (container && document.body.contains(container)) return;
    container = document.createElement('div');
    container.className = 't4-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'status');
    document.body.appendChild(container);
  }

  /* Mostra toast */
  function show(message, type = 'info', duration = 3500) {
    ensureContainer();

    const id = ++toastId;
    const toast = document.createElement('div');
    toast.className = `t4-toast t4-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="t4-toast-icon">${ICONS[type] || ICONS.info}</span>
      <span>${T4.utils.escapeHTML(message)}</span>
    `;

    container.appendChild(toast);
    T4.utils.vibrate(type === 'danger' ? [50, 30, 50] : 10);

    /* Auto-remove */
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    /* Toque para dispensar */
    toast.addEventListener('click', () => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    });

    return id;
  }

  /* Atalhos por tipo */
  function success(msg, duration) { return show(msg, 'ok', duration); }
  function warning(msg, duration) { return show(msg, 'warning', duration); }
  function error(msg, duration) { return show(msg, 'danger', duration); }
  function info(msg, duration) { return show(msg, 'info', duration); }

  /* Confirmação (modal simples) */
  function confirm(message, options = {}) {
    return new Promise((resolve) => {
      const title = options.title || 'Confirmar';
      const confirmText = options.confirmText || 'Confirmar';
      const cancelText = options.cancelText || 'Cancelar';
      const type = options.type || 'warning';

      const backdrop = document.createElement('div');
      backdrop.className = 't4-modal-backdrop active';

      const modal = document.createElement('div');
      modal.className = 't4-modal active';
      modal.innerHTML = `
        <div class="t4-modal-handle"></div>
        <h3 class="t4-modal-title">${T4.utils.escapeHTML(title)}</h3>
        <p style="color: var(--t4-text-secondary); margin-bottom: 24px; font-size: 0.9375rem;">
          ${T4.utils.escapeHTML(message)}
        </p>
        <div style="display: flex; gap: 12px;">
          <button class="t4-btn t4-btn-secondary" style="flex:1" id="t4-confirm-cancel">
            ${cancelText}
          </button>
          <button class="t4-btn t4-btn-${type === 'danger' ? 'danger' : 'primary'}" style="flex:1" id="t4-confirm-ok">
            ${confirmText}
          </button>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);

      function cleanup(result) {
        backdrop.classList.remove('active');
        modal.classList.remove('active');
        setTimeout(() => {
          backdrop.remove();
          modal.remove();
        }, 300);
        resolve(result);
      }

      document.getElementById('t4-confirm-ok').addEventListener('click', () => cleanup(true));
      document.getElementById('t4-confirm-cancel').addEventListener('click', () => cleanup(false));
      backdrop.addEventListener('click', () => cleanup(false));
    });
  }

  /* Notificação push (se permissão concedida) */
  async function sendPush(title, body, options = {}) {
    if (!('Notification' in window)) return false;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: options.icon || '/shared/icons/t4-icon-192.png',
        badge: '/shared/icons/t4-badge.png',
        tag: options.tag || 't4-notification',
        ...options
      });

      if (options.onClick) {
        notif.onclick = options.onClick;
      }

      return true;
    }

    return false;
  }

  /* Solicitar permissão de notificação */
  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  }

  return {
    show,
    success,
    warning,
    error,
    info,
    confirm,
    sendPush,
    requestPermission
  };
})();
