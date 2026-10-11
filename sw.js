// Offline-Unterstützung. Code: erst Netz (damit Updates sofort ankommen), sonst Cache.
// Bilder: erst Cache – sie ändern sich nie, und im Studio ist der Empfang oft schlecht.
importScripts("data.js"); // liefert UEBUNGEN und DEHNUNGEN für die Bilderliste

const CACHE = "trainingsplaner-v1";
const BILDER_CACHE = "trainingsplaner-bilder-v1";
const DATEIEN = ["./", "index.html", "style.css", "data.js", "app.js", "manifest.webmanifest", "icon-180.png", "icon-512.png"];
const BILDER = [...Object.keys(UEBUNGEN), ...Object.keys(DEHNUNGEN), ...Object.values(CARDIO).map((c) => c.bild)]
  .flatMap((id) => [`bilder/${id}-0.jpg`, `bilder/${id}-1.jpg`]);

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== BILDER_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
  // Alle Übungsbilder im Hintergrund laden, damit die App auch ohne Netz vollständig ist
  caches.open(BILDER_CACHE).then((c) =>
    Promise.all(BILDER.map((u) => c.match(u).then((r) => r || c.add(u).catch(() => {}))))
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.includes("/bilder/")) {
    ev.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => {
        if (res.ok) { const kopie = res.clone(); caches.open(BILDER_CACHE).then((c) => c.put(req, kopie)); }
        return res;
      }))
    );
    return;
  }

  // cache: "no-cache" fragt jedes Mal kurz beim Server nach (GitHub Pages erlaubt sonst 10 Min. alte Dateien),
  // damit nach einem Update nicht alte und neue Dateien gemischt werden
  ev.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        const kopie = res.clone();
        caches.open(CACHE).then((c) => c.put(req, kopie));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
