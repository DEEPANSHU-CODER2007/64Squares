// 64Squares Chess Service Worker for PWA Installation and Offline Shell
const CACHE_NAME = '64squares-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/pieces/neo/wp.png',
  '/pieces/neo/wn.png',
  '/pieces/neo/wb.png',
  '/pieces/neo/wr.png',
  '/pieces/neo/wq.png',
  '/pieces/neo/wk.png',
  '/pieces/neo/bp.png',
  '/pieces/neo/bn.png',
  '/pieces/neo/bb.png',
  '/pieces/neo/br.png',
  '/pieces/neo/bq.png',
  '/pieces/neo/bk.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently continue if some assets fail to precache during install
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Cache-first for chess pieces and static media
  if (url.pathname.startsWith('/pieces/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return res;
          })
        );
      })
    );
    return;
  }

  // Network-first with cache fallback for pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
