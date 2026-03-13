/* ============================================
   T4 STORAGE — Abstração IndexedDB + LocalStorage
   Persistência offline para todos os módulos
   ============================================ */

T4.storage = (function () {
  const DB_NAME = 't4_trilho40';
  const DB_VERSION = 1;
  let db = null;

  /* Stores padrão do ecossistema */
  const STORES = [
    'efvm360_simulations',
    'efvm360_scores',
    'ccq_projects',
    'ccq_charts',
    'rof_articles',
    'rof_bookmarks',
    'rof_history',
    'adamboot_conversations',
    'adamboot_knowledge',
    'hub_preferences',
    'sync_queue'
  ];

  /* === INDEXEDDB === */

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        STORES.forEach(storeName => {
          if (!database.objectStoreNames.contains(storeName)) {
            const store = database.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        });
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('[T4] Erro ao abrir IndexedDB:', event.target.errorCode || 'desconhecido');
        reject(event.target.error);
      };
    });
  }

  async function getStore(storeName, mode = 'readonly') {
    const database = await openDB();
    const tx = database.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  /* Salvar item */
  async function put(storeName, data) {
    const item = {
      ...data,
      id: data.id || T4.utils.uid(),
      timestamp: data.timestamp || Date.now(),
      updatedAt: Date.now()
    };

    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName, 'readwrite');
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Buscar por ID */
  async function get(storeName, id) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Buscar todos */
  async function getAll(storeName) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Buscar por índice */
  async function getByIndex(storeName, indexName, value) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Deletar por ID */
  async function remove(storeName, id) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Limpar store */
  async function clear(storeName) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* Contar itens */
  async function count(storeName) {
    return new Promise(async (resolve, reject) => {
      const store = await getStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /* === LOCALSTORAGE (para preferências simples) === */

  const local = {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem(`t4_${key}`);
        return val ? JSON.parse(val) : fallback;
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(`t4_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[T4] Erro no localStorage:', e.name || 'desconhecido');
        return false;
      }
    },

    remove(key) {
      localStorage.removeItem(`t4_${key}`);
    },

    has(key) {
      return localStorage.getItem(`t4_${key}`) !== null;
    }
  };

  /* === FILA DE SINCRONIZAÇÃO (para quando voltar online) === */

  async function addToSyncQueue(action) {
    return put('sync_queue', {
      action: action.type,
      data: action.data,
      module: action.module,
      createdAt: Date.now(),
      synced: false
    });
  }

  async function processSyncQueue() {
    const items = await getAll('sync_queue');
    const pending = items.filter(i => !i.synced);

    for (const item of pending) {
      try {
        T4.events.emit('sync:process', item);
        await put('sync_queue', { ...item, synced: true, syncedAt: Date.now() });
      } catch (e) {
        console.error('[T4] Erro na sincronização:', e.name || 'desconhecido');
      }
    }

    return pending.length;
  }

  /* Escuta reconexão para sincronizar */
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      setTimeout(processSyncQueue, 2000);
    });
  }

  /* Inicializar DB ao carregar */
  openDB().catch(err => {
    console.warn('[T4] IndexedDB indisponível, usando apenas localStorage');
  });

  return {
    put,
    get,
    getAll,
    getByIndex,
    remove,
    clear,
    count,
    local,
    addToSyncQueue,
    processSyncQueue,
    openDB
  };
})();
