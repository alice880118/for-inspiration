const CACHE_NAME = 'inspiration-collector-v3';
const APP_SHELL = [
  '/for-inspiration/',
  '/for-inspiration/index.html',
  '/for-inspiration/manifest.webmanifest',
  '/for-inspiration/icons/icon.svg',
  '/for-inspiration/icons/icon-192.png',
  '/for-inspiration/icons/icon-512.png',
  '/for-inspiration/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.method !== 'GET') return;

  const isDocument = event.request.mode === 'navigate'
    || /\.(html|webmanifest)$/.test(url.pathname)
    || url.pathname.endsWith('/');

  // 頁面本身走 network-first，改版後手機才不會一直開到舊的畫面。
  if (isDocument) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request)
        .then(cached => cached || caches.match('/for-inspiration/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
