const VERSION = '2026.05.30.1';
const CACHE_NAME = `setka-cache-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './setka-icon.svg',
  './setka-icon-192.png',
  './setka-icon-512.png',
  './storage/teams.js',
  './storage/events.js',
  './storage/matches.js',
  './stats/calculateTeamStats.js',
  './stats/calculatePlayerStats.js',
  './stats/calculateRoleStats.js',
  './stats/calculateSetStats.js',
  './stats/calculateSeasonStats.js',
  './stats/compareMatches.js',
  './stats/getBestPerformers.js',
  './export/pdf.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key === CACHE_NAME) return Promise.resolve();
      return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      } catch (error) {
        return caches.match(request) || caches.match('./index.html');
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  })());
});
