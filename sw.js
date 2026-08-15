const CACHE = "chino-basico-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=5",
  "./app.js?v=5",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const isPageOrCode = req.mode === "navigate" || ["script", "style"].includes(req.destination);

  if (isPageOrCode) {
    event.respondWith(
      fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return response;
      }).catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return response;
    }))
  );
});
