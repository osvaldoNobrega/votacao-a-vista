/* Votacao a Vista - service worker (offline) */
const CACHE = "votacao-a-vista-v6";
const SHELL = [
  ".",
  "index.html",
  "manifest.json",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  /* Página/navegação: rede primeiro (atualizações imediatas), cache se offline */
  if (e.request.mode === "navigate" || e.request.destination === "document") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(h => h || caches.match("index.html"))
        )
    );
    return;
  }

  /* Restantes recursos (ícones, manifest): cache primeiro */
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return res;
      })
    )
  );
});
