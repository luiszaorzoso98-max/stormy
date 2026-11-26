// Servicio de trabajo: guarda la app en el dispositivo para que funcione sin conexión.
// Al publicar una versión nueva, cambia VERSION para que los dispositivos se actualicen.
const VERSION = 'stormy-2.5.0';
const ARCHIVOS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/motor.js', './js/contenido.js', './js/datos.js', './js/asistente.js', './js/avisos.js', './js/cielo.js', './js/tienda.js', './js/respuestas.js', './js/navegador.js',
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
// `no-cache` obliga a revalidar con el servidor: así nunca se mezcla un archivo nuevo con otro viejo de la caché HTTP.
self.addEventListener('fetch', (ev) => {
  const peticion = ev.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== location.origin) return;
  ev.respondWith(
    fetch(peticion, { cache: 'no-cache' })
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

// ---------- Avisos con opciones ----------

const OPCIONES = [
  { action: 'tiempo-5', title: '☀️ Soleado' },
  { action: 'tiempo-4', title: '⛅️ Sol y nubes' },
  { action: 'tiempo-3', title: '☁️ Nublado' },
  { action: 'tiempo-2', title: '🌧️ Lluvia' },
  { action: 'tiempo-1', title: '⛈️ Tormenta' },
];

/** Guarda la opción elegida en el aviso; la app la recoge al abrirse (js/avisos.js). */
function guardaRespuesta(animo) {
  return new Promise((ok) => {
    const p = indexedDB.open('stormy-avisos', 1);
    p.onupgradeneeded = () => p.result.createObjectStore('pendientes', { keyPath: 'dia' });
    p.onerror = () => ok();
    p.onsuccess = () => {
      const f = new Date();
      const dos = (n) => String(n).padStart(2, '0');
      const dia = `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
      const tx = p.result.transaction('pendientes', 'readwrite');
      tx.objectStore('pendientes').put({ dia, animo });
      tx.oncomplete = () => ok();
      tx.onerror = () => ok();
    };
  });
}

const ventanas = () => self.clients.matchAll({ type: 'window', includeUncontrolled: true });

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const opcion = /^tiempo-([1-5])$/.exec(ev.action || '');
  if (opcion) {
    // Se eligió una opción en el propio aviso: se apunta sin abrir la app.
    ev.waitUntil(
      guardaRespuesta(Number(opcion[1]))
        .then(ventanas)
        .then((cs) => cs.forEach((c) => c.postMessage({ tipo: 'respuesta-aviso' }))),
    );
    return;
  }
  // Se tocó el aviso en sí: se abre el registro para elegir.
  const destino = new URL(ev.notification.data?.url ?? './?hoja=registro', self.registration.scope).href;
  ev.waitUntil(
    ventanas().then((cs) => {
      const abierta = cs.find((c) => c.url.startsWith(self.registration.scope));
      if (!abierta) return self.clients.openWindow(destino);
      abierta.postMessage({ tipo: 'abrir-registro' });
      return abierta.focus();
    }),
  );
});

// Aviso diario enviado desde un servidor (todavía no hay ninguno montado).
self.addEventListener('push', (ev) => {
  let datos = {};
  try {
    datos = ev.data?.json() ?? {};
  } catch {
    /* aviso sin datos */
  }
  ev.waitUntil(
    self.registration.showNotification(datos.titulo ?? '¿Qué tiempo ha hecho hoy en casa?', {
      body: datos.cuerpo ?? 'Elige el parte de hoy.',
      tag: 'parte-diario',
      icon: 'iconos/icono-192.png',
      badge: 'iconos/icono-192.png',
      requireInteraction: true,
      data: { url: './?hoja=registro' },
      actions: OPCIONES,
    }),
  );
});
