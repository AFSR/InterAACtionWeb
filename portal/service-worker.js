// InterAACtion Web — PWA service worker.
//
// Strategy:
//   - Navigations (HTML): network-first, cached for offline fallback.
//   - Fast-moving assets (gaze-bridge.js, app-skin.css, icons.svg):
//     network-first too. We do NOT want a deploy that ships a new bar
//     to be invisible because the SW kept serving the old bridge from
//     cache for two reloads.
//   - Other same-origin GETs: stale-while-revalidate. Fast first
//     paint, then refresh in the background for the next visit.
//   - Cross-origin requests: pass through, never cached.
//
// Bump CACHE_VERSION when the precache list itself changes; new cache
// name forces the old one to be deleted on activate.

const CACHE_VERSION = 'iaw-portal-v3';
const PRECACHE_URLS = [
  './',
  './index.html',
  './assets/styles.css',
  './assets/tokens.css',
  './manifest.webmanifest',
  './assets/icons/interAACtionBox.png',
];

// Paths that must never be served stale — they carry the chrome the
// rest of the suite reads at runtime, so a stale copy = visible regression.
const NETWORK_FIRST_PATHS = [
  '/gaze-client/gaze-bridge.js',
  '/gaze-client/afsr-gaze.umd.js',
  '/assets/app-skin.css',
  '/assets/icons.svg',
  '/assets/tokens.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATHS.some((p) => url.pathname === p);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  if (isNetworkFirst(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res && res.ok && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        } catch (e) {
          const cached = await cache.match(req);
          if (cached) return cached;
          throw e;
        }
      })
    );
    return;
  }

  // stale-while-revalidate for every other same-origin GET
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
