/* ===================================================
   Service Worker - SUSTEN Gestão Paroquial
   Versão: 1.0.0
   =================================================== */

const CACHE_NAME = 'susten-v3';
const OFFLINE_URL = '/login.html';

const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/Fiel.html',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/charts.js',
  '/js/config.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap'
];

// Instalar e fazer cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
    }).then(() => self.skipWaiting())
  );
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignorar requisições não-GET e requisições ao Apps Script
  if (request.method !== 'GET') return;
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.hostname === 'script.google.com') return;
  } catch (_) { return; }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});
