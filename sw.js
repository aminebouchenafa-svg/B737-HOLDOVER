// Service worker : réseau d'abord (mises à jour), avec délai max 3 s puis cache (hors ligne / Wi-Fi faible).
const CACHE = '737-holdover-2026-10-30-87ddbec6';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const fromCache = req => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const net = fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy))); }
    return res;
  });
  const timeout = new Promise(resolve => setTimeout(resolve, 3000));
  e.respondWith(
    Promise.race([net.catch(() => undefined), timeout]).then(r => r && r.ok ? r : fromCache(req).then(c => c || r || net))
      .catch(() => fromCache(req))
  );
});
