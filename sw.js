/* Robotech PWA Service Worker
   - Network-first для HTML (чтобы обновления приходили)
   - Cache-first для ассетов
   - Update flow: waiting SW -> тост -> "Обновить" -> SKIP_WAITING
*/

const VERSION = '2026.03.01.1';
const CACHE_NAME = `robotex-cache-${VERSION}`;

// ВАЖНО: пути должны совпадать с реальными файлами
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './robotex_logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS.filter(Boolean));
    // оставляем (как у тебя) — чтобы новая версия сразу становилась waiting
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // HTML: network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const network = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, network.clone());
        return network;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // assets: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const resp = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, resp.clone());
      return resp;
    } catch (e) {
      // если сеть недоступна, попробуем хотя бы вернуть то, что есть
      const fallback = await caches.match(req);
      if (fallback) return fallback;
      throw e;
    }
  })());
});