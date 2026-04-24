// InterAACtion Web — PWA service worker.
//
// Strategy:
//   - Navigations (HTML): network-first, cached for offline fallback.
//   - Same-origin GET assets: stale-while-revalidate — serve from cache
//     immediately, refresh in the background. Prevents the "stuck on old
//     JS" footgun after a deploy.
//   - Cross-origin requests: pass through, never cached.
//
// Bump CACHE_VERSION when the precache list itself changes; new cache
// name forces the old one to be deleted on activate.

const CACHE_VERSION = 'iaw-portal-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './assets/styles.css',
  './manifest.webmanifest',
  './assets/icons/interAACtionBox.png',
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
