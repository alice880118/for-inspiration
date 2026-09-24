/* Pobbi service worker — app-shell caching only. User data lives in IndexedDB and is never touched here. */
const VERSION = "pobbi-v6";
const SHELL = [
  "/",
  "/home",
  "/welcome",
  "/onboarding",
  "/library",
  "/reading",
  "/settings",
  "/settings/categories",
  "/settings/tags",
  "/notifications",
  "/reading/history",
  "/inspiration",
  "/manifest.webmanifest",
  "/brand/pobbi-wordmark.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function sameOrigin(url) {
  return url.origin === location.origin;
}

function isApi(url) {
  return sameOrigin(url) && url.pathname.startsWith("/api/");
}

function isStatic(url) {
  return (
    (sameOrigin(url) && url.pathname.startsWith("/_next/static/")) ||
    (sameOrigin(url) && url.pathname.startsWith("/icons/")) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

function isAppDoc(req, url) {
  if (req.mode === "navigate" || req.destination === "document") return true;
  if (!sameOrigin(url) || isApi(url)) return false;
  return Boolean(
    req.headers.get("RSC") === "1" ||
      req.headers.get("Next-Router-State-Tree") ||
      req.headers.get("Next-Url")
  );
}

function put(req, res) {
  if (!res || !res.ok) return res;
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy));
  return res;
}

function fallbackPage(url) {
  return caches
    .match(url.pathname)
    .then((hit) => hit || caches.match("/") || caches.match("/home"))
    .then(
      (hit) =>
        hit ||
        new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (isApi(url)) return;

  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => put(req, res))
          .catch(
            () =>
              new Response("", {
                status: 503,
                statusText: "Offline",
              })
          );
      })
    );
    return;
  }

  if (isAppDoc(req, url)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          put(req, res);
          if (res.ok && (req.mode === "navigate" || req.destination === "document")) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => {
            if (hit) return hit;
            const rsc =
              req.headers.get("RSC") === "1" || req.headers.get("Next-Router-State-Tree");
            if (rsc) {
              return new Response("", { status: 503, statusText: "Offline" });
            }
            return fallbackPage(url);
          })
        )
    );
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/reading";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
