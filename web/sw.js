// UmaiOS PWA service worker — basit çevrimdışı önbellek (app shell).
const CACHE = 'umaios-shell-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // API çağrıları önbelleğe alınmaz (her zaman ağdan).
  if (request.method !== 'GET' || new URL(request.url).pathname.includes('/api/')) return;
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('./index.html')))
  );
});
