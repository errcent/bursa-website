/**
 * Bursa Note Service Worker.
 *
 * Caches the app shell for offline use.
 * Note data lives in IndexedDB (already local), so the app
 * works fully offline once the shell is cached.
 */

const CACHE = "bursa-note-v1";
const APP_SHELL = [
  "/note",
  "/note/jurnal",
  "/note/analytics",
  "/note/baru",
  "/note/impor",
  "/note/setelan",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GET requests
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first for navigations, cache fallback for offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/note")))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images)
  if (/\.(js|css|png|jpg|svg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // API requests: always network (don't cache)
  if (url.pathname.startsWith("/api/")) return;
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "Bursa Note", body: "Log trade hari ini" };
  try {
    data = JSON.parse(event.data.text());
  } catch {
    /* use default */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-note-192.png",
      badge: "/icon-note-192.png",
      tag: "bursa-note-reminder",
      data: { url: "/note/baru" },
    })
  );
});

// Notification click → open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const client = clients[0];
      if (client) {
        client.focus();
        client.postMessage({ type: "navigate", url: "/note/baru" });
      } else {
        self.clients.openWindow("/note/baru");
      }
    })
  );
});
