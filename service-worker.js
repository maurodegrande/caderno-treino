// Bump este número toda vez que publicar uma nova versão do app,
// para forçar a atualização do cache no iPhone do usuário.
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = 'caderno-treino-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache-first para o app shell; network-first com fallback de cache para o resto
// (assim fontes externas ainda tentam atualizar quando há internet).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const isAppShell = APP_SHELL.some((path) => req.url.endsWith(path.replace('./', '/')));

  if(isAppShell){
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  } else {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
