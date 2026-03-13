/* ============================================
   T4 SERVICE WORKER — Cache e funcionalidade offline
   ============================================ */

const CACHE_NAME = 't4-trilho40-v1';
const CACHE_VERSION = 1;

/* Arquivos essenciais que devem estar sempre em cache */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shared/css/t4-design-system.css',
  '/shared/css/t4-components.css',
  '/shared/css/t4-animations.css',
  '/shared/js/t4-core.js',
  '/shared/js/t4-storage.js',
  '/shared/js/t4-router.js',
  '/shared/js/t4-auth.js',
  '/shared/js/t4-notifications.js',
  '/modules/hub/css/hub-specific.css',
  '/modules/hub/js/hub-dashboard.js',
  '/modules/hub/js/hub-quick-actions.js'
];

/* Arquivos dos módulos */
const MODULE_ASSETS = [
  /* EFVM 360 */
  '/modules/efvm360/index.html',
  '/modules/efvm360/css/efvm360.css',
  '/modules/efvm360/js/efvm360-app.js',
  '/modules/efvm360/js/efvm360-simulator.js',
  '/modules/efvm360/js/efvm360-physics.js',
  '/modules/efvm360/js/efvm360-scenarios.js',
  '/modules/efvm360/js/efvm360-hud.js',
  '/modules/efvm360/js/efvm360-scoring.js',
  '/modules/efvm360/data/efvm-track-profile.json',
  '/modules/efvm360/data/efvm-stations.json',
  '/modules/efvm360/data/efvm-restrictions.json',
  /* CCQ */
  '/modules/ccq/index.html',
  '/modules/ccq/css/ccq.css',
  '/modules/ccq/js/ccq-app.js',
  '/modules/ccq/js/ccq-projects.js',
  '/modules/ccq/js/ccq-methodology.js',
  '/modules/ccq/js/ccq-charts.js',
  '/modules/ccq/js/ccq-presentations.js',
  '/modules/ccq/js/ccq-timeline.js',
  '/modules/ccq/data/ccq-templates.json',
  /* ROF Digital */
  '/modules/rof-digital/index.html',
  '/modules/rof-digital/css/rof-digital.css',
  '/modules/rof-digital/js/rof-app.js',
  '/modules/rof-digital/js/rof-search.js',
  '/modules/rof-digital/js/rof-viewer.js',
  '/modules/rof-digital/js/rof-bookmarks.js',
  '/modules/rof-digital/js/rof-quiz.js',
  '/modules/rof-digital/js/rof-ai-assistant.js',
  '/modules/rof-digital/data/rof-articles.json',
  '/modules/rof-digital/data/rof-keywords.json',
  '/modules/rof-digital/data/rof-categories.json',
  /* AdamBoot */
  '/modules/adamboot/index.html',
  '/modules/adamboot/css/adamboot.css',
  '/modules/adamboot/js/adamboot-app.js',
  '/modules/adamboot/js/adamboot-chat.js',
  '/modules/adamboot/js/adamboot-knowledge.js',
  '/modules/adamboot/js/adamboot-context.js',
  '/modules/adamboot/js/adamboot-voice.js',
  '/modules/adamboot/js/adamboot-personality.js',
  '/modules/adamboot/data/adamboot-prompts.json',
  '/modules/adamboot/data/adamboot-faq.json',
  '/modules/adamboot/data/adamboot-glossary.json'
];

const ALL_ASSETS = [...CORE_ASSETS, ...MODULE_ASSETS];

/* === INSTALAÇÃO === */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets do T4...');
        /* Cachear core primeiro, módulos em background */
        return cache.addAll(CORE_ASSETS).then(() => {
          /* Módulos são cacheados de forma não-bloqueante */
          return cache.addAll(MODULE_ASSETS).catch((err) => {
            console.warn('[SW] Alguns módulos não puderam ser cacheados:', err);
          });
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* === ATIVAÇÃO === */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* === FETCH — Estratégia: Network First para HTML, Cache First para assets === */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  /* Ignora requisições que não são GET */
  if (request.method !== 'GET') return;

  /* Ignora requisições para outros domínios */
  if (url.origin !== self.location.origin) return;

  /* HTML: Network First (tenta rede, fallback cache) */
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  /* JSON (dados): Network First */
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* CSS, JS, imagens: Cache First (usa cache, atualiza em background) */
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

/* === MENSAGENS DO APP === */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache limpo');
    });
  }
});

/* === SINCRONIZAÇÃO EM BACKGROUND === */
self.addEventListener('sync', (event) => {
  if (event.tag === 't4-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'sync', status: 'processing' });
        });
      })
    );
  }
});
