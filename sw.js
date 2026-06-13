const CACHE_VERSION = '2026.06.13.8';
const APP_SHELL_CACHE = `setka-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `setka-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `setka-images-${CACHE_VERSION}`;
const CACHE_PREFIX = 'setka-';
const CACHE_ALLOWLIST = [APP_SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE];

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './setka-icon.svg',
  './setka-icon-192.png',
  './setka-icon-512.png',
  './assets/teams/robotech-logo.png',
  './assets/teams/robotech-2-logo.png',
  './assets/placeholders/robotech-default.png',
  './assets/placeholders/robotech2-default.png',
  './assets/legacy-matches/robotech-dgtu-city.jpg',
  './assets/legacy-matches/robotech-2025-10-06.jpg',
  './assets/legacy-matches/robotech-2-atom-region.jpg',
  './assets/legacy-matches/robotech-2-rgups-2025-10-01.jpg',
  './assets/legacy-matches/robotech-2-2026-02-03.jpg',
  './assets/legacy-matches/robotech-2-2025-10-06-unverified.jpg',
  './assets/legacy-matches/robotech-2025-12-20.jpg',
  './storage/teams.js',
  './storage/events.js',
  './storage/importedMatches.js',
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

async function precacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  await Promise.all(CORE_ASSETS.map(async (asset) => {
    try {
      const request = new Request(asset, { cache: 'reload' });
      const response = await fetch(request);
      if (response && response.ok) await cache.put(asset, response);
    } catch (error) {
      const cached = await caches.match(asset);
      if (cached) await cache.put(asset, cached);
    }
  }));
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => {
    if (!key.startsWith(CACHE_PREFIX) || CACHE_ALLOWLIST.includes(key)) return Promise.resolve();
    return caches.delete(key);
  }));
}

function isHtmlRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isAppShellRequest(request) {
  const url = new URL(request.url);
  return [
    '.css',
    '.js',
    '.json',
    '.webmanifest'
  ].some((extension) => url.pathname.endsWith(extension));
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/');
}

async function networkFirst(request, cacheName, fallbackUrl = '') {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(new Request(request, { cache: 'reload' }));
    if (response && response.ok) {
      await cache.put(request, response.clone());
      if (fallbackUrl) await cache.put(fallbackUrl, response.clone());
    }
    return response;
  } catch (error) {
    const cached = (await cache.match(request))
      || (fallbackUrl ? await cache.match(fallbackUrl) : null)
      || caches.match(request)
      || (fallbackUrl ? caches.match(fallbackUrl) : null);
    return cached || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await cleanupOldCaches();
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'SW_VERSION', version: CACHE_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE, './index.html'));
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (isApiRequest(request) || isAppShellRequest(request)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
