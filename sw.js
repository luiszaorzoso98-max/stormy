// Servicio de trabajo: guarda la app en el dispositivo para que funcione sin conexión.
// Al publicar una versión nueva, cambia VERSION para que los dispositivos se actualicen.
const VERSION = 'sicielo-1.2.0';
const ARCHIVOS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/motor.js', './js/contenido.js', './js/datos.js', './js/asistente.js',
  './iconos/icono-180.png', './iconos/icono-192.png', './iconos/icono-512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Red primero para tener siempre la última versión; si no hay conexión, se sirve la copia guardada.
self.addEventListener('fetch', (ev) => {
  const peticion = ev.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== location.origin) return;
  ev.respondWith(
    fetch(peticion)
      .then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(VERSION).then((c) => c.put(peticion, copia));
        }
        return res;
      })
      .catch(() => caches.match(peticion, { ignoreSearch: true }).then((r) => r ?? caches.match('./index.html'))),
  );
});
