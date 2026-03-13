/* ============================================
   T4 SERVICE WORKER — Cache e funcionalidade offline
   Estrategia: Network First para HTML/JSON,
               Cache First para CSS/JS/assets
   ============================================ */

var CACHE_NAME = 'T4-v3';

/* Arquivos essenciais — cacheados no install (bloqueante) */
var CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  /* Design System */
  '/shared/css/t4-design-system.css',
  '/shared/css/t4-components.css',
  '/shared/css/t4-animations.css',
  /* Shared JS */
  '/shared/js/t4-core.js',
  '/shared/js/t4-storage.js',
  '/shared/js/t4-router.js',
  '/shared/js/t4-auth.js',
  '/shared/js/t4-notifications.js',
  '/shared/js/t4-logger.js',
  '/shared/js/t4-module-utils.js',
  '/shared/data/demo-users.json',
  /* Shell */
  '/shell/module-registry.js',
  '/shell/shell-config.js',
  '/shell/shell-alertas.js',
  '/shell/shell-busca.js',
  '/shell/shell-login.js',
  '/shell/shell-navigation.js',
  '/shell/shell-init.js',
  /* Infrastructure */
  '/infrastructure/storage-adapter.js',
  /* Domain Services */
  '/domain/jornada-service.js',
  '/domain/seguranca-service.js',
  '/domain/comunicacao-service.js',
  '/domain/operacional-service.js',
  /* Integrations */
  '/integrations/registry.js',
  /* Hub */
  '/modules/hub/css/hub-specific.css',
  '/modules/hub/js/hub-dashboard.js',
  '/modules/hub/js/hub-quick-actions.js'
];

/* Arquivos dos modulos — cacheados em background (nao-bloqueante) */
var MODULE_ASSETS = [
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
  '/modules/adamboot/data/adamboot-glossary.json',
  /* Boa Jornada */
  '/modules/boa-jornada/index.html',
  '/modules/boa-jornada/css/boa-jornada.css',
  '/modules/boa-jornada/js/boa-jornada-app.js',
  /* ART */
  '/modules/art/index.html',
  '/modules/art/css/art.css',
  '/modules/art/js/art-app.js',
  /* Timer Jornada */
  '/modules/timer-jornada/index.html',
  '/modules/timer-jornada/css/timer-jornada.css',
  '/modules/timer-jornada/js/timer-jornada-app.js',
  /* Log CCO */
  '/modules/log-cco/index.html',
  '/modules/log-cco/css/log-cco.css',
  '/modules/log-cco/js/log-cco-app.js',
  /* Calculadora */
  '/modules/calculadora/index.html',
  '/modules/calculadora/css/calculadora.css',
  '/modules/calculadora/js/calculadora-app.js',
  /* Contatos */
  '/modules/contatos/index.html',
  '/modules/contatos/css/contatos.css',
  '/modules/contatos/js/contatos-app.js',
  /* Avisos */
  '/modules/avisos/index.html',
  '/modules/avisos/css/avisos.css',
  '/modules/avisos/js/avisos-app.js'
];

/* === INSTALACAO === */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        /* Core assets — bloqueante */
        return cache.addAll(CORE_ASSETS).then(function () {
          /* Modulos — nao-bloqueante */
          return cache.addAll(MODULE_ASSETS).catch(function () {
            /* Falha parcial aceitavel — modulos serao cacheados sob demanda */
          });
        });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

/* === ATIVACAO === */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* === FETCH === */
self.addEventListener('fetch', function (event) {
  var request = event.request;

  /* Ignora requisicoes nao-GET */
  if (request.method !== 'GET') return;

  /* Ignora requisicoes para outros dominios */
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* HTML: Network First */
  var accept = request.headers.get('accept') || '';
  if (accept.indexOf('text/html') > -1) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, clone); });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (r) {
            return r || caches.match('/index.html');
          });
        })
    );
    return;
  }

  /* JSON: Network First */
  if (url.pathname.indexOf('.json') > -1) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, clone); });
          return response;
        })
        .catch(function () { return caches.match(request); })
    );
    return;
  }

  /* CSS, JS, assets: Cache First (stale-while-revalidate) */
  event.respondWith(
    caches.match(request).then(function (cached) {
      var fetchPromise = fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, clone); });
          return response;
        })
        .catch(function () { return cached; });

      return cached || fetchPromise;
    })
  );
});

/* === MENSAGENS DO APP === */
self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME);
  }
});

/* === SYNC EM BACKGROUND === */
self.addEventListener('sync', function (event) {
  if (event.tag === 't4-sync') {
    event.waitUntil(
      self.clients.matchAll().then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'sync', status: 'processing' });
        });
      })
    );
  }
});
