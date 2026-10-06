// Service worker: guarda la app en el teléfono para que abra sin señal.
// Al publicar una versión nueva, cambiá el número de VERSION.
const VERSION = 'fichada-v11-0';
const APP = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return; // planilla: siempre por red
  if (url.pathname.endsWith('version.json')) return;                 // siempre por red, nunca guardado
  // App: primero la red SIN caché del navegador (para tomar actualizaciones), si no hay señal, la copia guardada
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request.url, { cache: 'no-store' }).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Íconos y fuentes externas: la copia guardada, si no, la red
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const c = res.clone(); caches.open(VERSION).then(ca => ca.put(e.request, c)); return res;
  })));
});
