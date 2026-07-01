/* Service Worker – Kenntnisprüfung Fallsimulation
   Cache-Version bei jeder inhaltlichen Änderung der HTML erhöhen (v1 -> v2 ...),
   damit Clients die neue Fassung sicher laden. */
const CACHE = 'kp-training-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                              // POST (z.B. KI-API) durchlassen
  if (new URL(req.url).origin !== self.location.origin) return;  // fremde Origins nicht anfassen

  // stale-while-revalidate: sofort aus Cache liefern, im Hintergrund aktualisieren
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req)
          .then(res => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
