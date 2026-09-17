/* Pobbi service worker — app-shell caching only. User data lives in IndexedDB and is never touched here. */
const VERSION = "pobbi-v2";
const SHELL = ["/", "/home", "/welcome", "/onboarding", "/library", "/reading", "/settings", "/settings/categories", "/settings/tags", "/notifications", "/reading/history", "/inspiration", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API calls always go to the network
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return;

  // Hashed build assets + fonts: cache-first
  if ((url.origin === location.origin && url.pathname.startsWith("/_next/static/")) ||
      url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" ||
      (url.origin === location.origin && url.pathname.startsWith("/icons/"))) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Pages: network-first, fall back to cache when offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(url.pathname, copy));
        return res;
      }).catch(() => caches.match(url.pathname).then((hit) => hit || caches.match("/home")))
    );
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/reading";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
