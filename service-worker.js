const CACHE = 'finflow-v4';
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
  './js/boot.js',
  './js/darkmode.js',
  './js/events.js'
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
  var url = e.request.url;
  if (url.indexOf('chrome-extension') > -1 || url.indexOf('api.anthropic') > -1 ||
      url.indexOf('api.openai') > -1 || url.indexOf('open.er-api') > -1) return;

  // Network-first for JS files — prevents stale code bugs after deploys
  var isJS = url.indexOf('/js/') > -1 && url.indexOf('.js') > -1 &&
             url.indexOf('vendor') === -1; // vendor (chart.min.js) can stay cache-first
  if (isJS) {
    e.respondWith(
      fetch(e.request).then(function (response) {
        var clone = response.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return response;
      }).catch(function () {
        return caches.match(e.request).then(function (r) {
          return r || new Response('// offline', { status: 503, headers: { 'Content-Type': 'application/javascript' } });
        });
      })
    );
    return;
  }

  // Cache-first for everything else (HTML, CSS, fonts, vendor JS)
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).catch(function () {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
