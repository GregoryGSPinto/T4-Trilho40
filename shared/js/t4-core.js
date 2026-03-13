/* ============================================
   T4 CORE — Funções utilitárias compartilhadas
   ============================================ */

const T4 = window.T4 || {};

/* === UTILIDADES GERAIS === */
T4.utils = {
  /* Gera ID único */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  /* Debounce para inputs */
  debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },

  /* Throttle para scroll/resize */
  throttle(fn, ms = 100) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, args);
      }
    };
  },

  /* Formata data no padrão brasileiro */
  formatDate(date, format = 'short') {
    const d = new Date(date);
    const opts = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      full: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    return d.toLocaleDateString('pt-BR', opts[format] || opts.short);
  },

  /* Formata hora */
  formatTime(date) {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  /* Capitaliza primeira letra */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /* Trunca texto */
  truncate(str, len = 100) {
    if (str.length <= len) return str;
    return str.substring(0, len).trim() + '...';
  },

  /* Escapa HTML */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /* Deep clone de objetos */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /* Verifica se está online */
  isOnline() {
    return navigator.onLine;
  },

  /* Aguarda ms milissegundos */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /* Formata número com separador de milhar */
  formatNumber(num) {
    return new Intl.NumberFormat('pt-BR').format(num);
  },

  /* Vibrar dispositivo (feedback tátil) */
  vibrate(pattern = 10) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
};

/* === GERENCIADOR DE EVENTOS === */
T4.events = {
  _listeners: {},

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => cb(data));
  }
};

/* === DOM HELPERS === */
T4.dom = {
  /* Seletor curto */
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
  },

  /* Cria elemento com atributos */
  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'class') el.className = val;
      else if (key === 'text') el.textContent = val;
      else if (key === 'html') el.innerHTML = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      }
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  },

  /* Anima fadeUp em elementos de uma lista */
  animateList(selector, delay = 50) {
    const items = this.$$(selector);
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      setTimeout(() => {
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, i * delay);
    });
  },

  /* Mostra/esconde elemento */
  show(el) { el.style.display = ''; el.removeAttribute('hidden'); },
  hide(el) { el.style.display = 'none'; el.setAttribute('hidden', ''); }
};

/* === GERENCIADOR DE ESTADO SIMPLES === */
T4.state = {
  _data: {},
  _watchers: {},

  get(key) {
    return this._data[key];
  },

  set(key, value) {
    const old = this._data[key];
    this._data[key] = value;
    if (this._watchers[key]) {
      this._watchers[key].forEach(fn => fn(value, old));
    }
    T4.events.emit('state:change', { key, value, old });
  },

  watch(key, callback) {
    if (!this._watchers[key]) this._watchers[key] = [];
    this._watchers[key].push(callback);
    return () => {
      this._watchers[key] = this._watchers[key].filter(fn => fn !== callback);
    };
  }
};

/* === CONTEXTO OPERACIONAL === */
T4.context = {
  _data: {
    patio: null,
    turno: null,
    trem: null,
    maquinista: null
  },

  get() {
    const saved = localStorage.getItem('t4_context');
    if (saved) {
      this._data = JSON.parse(saved);
    }
    return { ...this._data };
  },

  set(updates) {
    Object.assign(this._data, updates);
    localStorage.setItem('t4_context', JSON.stringify(this._data));
    T4.events.emit('context:update', this._data);
  },

  getPatio() { return this.get().patio; },
  getTurno() { return this.get().turno; },
  getTrem() { return this.get().trem; },

  /* Determina turno baseado na hora */
  getCurrentTurno() {
    const h = new Date().getHours();
    if (h >= 6 && h < 14) return 'A';
    if (h >= 14 && h < 22) return 'B';
    return 'C';
  }
};

/* === INICIALIZAÇÃO === */
T4.init = function (moduleName) {
  /* Marca módulo ativo */
  T4.state.set('activeModule', moduleName);
  document.body.setAttribute('data-module', moduleName);

  /* Monitora conectividade */
  T4.state.set('online', navigator.onLine);

  window.addEventListener('online', () => {
    T4.state.set('online', true);
    T4.events.emit('connectivity', { online: true });
    T4.events.emit('connectivity:online');
    T4.notifications.show('Conexão restabelecida', 'ok');
  });

  window.addEventListener('offline', () => {
    T4.state.set('online', false);
    T4.events.emit('connectivity', { online: false });
    T4.events.emit('connectivity:offline');
    T4.notifications.show('Sem conexão — modo offline ativo', 'warning');
  });

  /* Atualiza turno no contexto */
  T4.context.set({ turno: T4.context.getCurrentTurno() });

  /* Log de inicialização removido por segurança */
};

window.T4 = T4;
