const CACHE = 'finflow-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/base.css',
  './styles/layout.css',
  './styles/components.css',
  './styles/dark.css',
  './js/vendor/chart.min.js',
  './js/constants.js',
  './js/state.js',
  './js/health.js',
  './js/modals.js',
  './js/expenses.js',
  './js/revenue.js',
  './js/loans.js',
  './js/savings.js',
  './js/analytics.js',
  './js/calendar.js',
  './js/archive.js',
  './js/settings.js',
  './js/onboarding.js',
  './js/boot.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.url.indexOf('chrome-extension') > -1 || e.request.url.indexOf('api.anthropic') > -1) return;
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).catch(function () {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
