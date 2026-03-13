/* ============================================
   T4 SERVICE WORKER — Cache e offline
   ============================================ */

const CACHE_NAME = 't4-trilho40-v1';

const PRECACHE_URLS = [
  '/',
  'index.html',
  'shared/css/t4-design-system.css',
  'shared/css/t4-components.css',
  'shared/css/t4-animations.css',
  'modules/hub/css/hub-specific.css',
  'shared/js/t4-core.js',
  'shared/js/t4-storage.js',
  'shared/js/t4-router.js',
  'shared/js/t4-auth.js',
  'shared/js/t4-notifications.js',
  'modules/hub/js/hub-dashboard.js',
  'modules/hub/js/hub-quick-actions.js'
];

/* Instalação — pré-cacheia recursos essenciais */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Ativação — limpa caches antigos */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Fetch — Network first, fallback to cache */
self.addEventListener('fetch', function (event) {
  /* Ignora requisições não-GET */
  if (event.request.method !== 'GET') return;

  /* Ignora requisições para APIs externas */
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      /* Atualiza o cache com a resposta fresca */
      if (response.ok) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function () {
      /* Sem rede — tenta o cache */
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        /* Fallback para a home se for navegação */
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
