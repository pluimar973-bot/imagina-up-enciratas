// Service worker de gastabot: guarda la app para abrirla sin conexión. No toca llamadas a otros dominios.
const CACHE = "gastabot-v2.6.0";
const FILES = ["./", "sidepanel.html", "index.html", "sidepanel.css", "sidepanel.js", "stores.js", "menus.js", "catalogo.js", "locales.js", "restaurantes.js", "tecnologia.js", "near.js", "visual.js", "icons.js", "art.js", "photos.js", "llm.js", "engine.js", "catalog.js", "places.js", "osm.js", "link.js", "db.js", "pwa.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("sidepanel.html"))));
});
