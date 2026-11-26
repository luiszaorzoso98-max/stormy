// Avisos del sistema con opciones de respuesta.
// El aviso lo muestra el servicio de trabajo (sw.js). Si la persona pulsa una opción, sw.js guarda la respuesta
// en una pequeña base de datos y la app la recoge al abrirse: así el parte queda apuntado sin abrir la app.
import { TIEMPOS, ORDEN_TIEMPOS } from './contenido.js';

const BASE = 'stormy-avisos';
const ALMACEN = 'pendientes';

function abre() {
  return new Promise((ok, mal) => {
    const p = indexedDB.open(BASE, 1);
    p.onupgradeneeded = () => p.result.createObjectStore(ALMACEN, { keyPath: 'dia' });
    p.onsuccess = () => ok(p.result);
    p.onerror = () => mal(p.error);
  });
}

/** Devuelve y borra las respuestas dadas desde los avisos: [{ dia, animo }]. */
export async function recogePendientes() {
  if (!('indexedDB' in globalThis)) return [];
  try {
    const db = await abre();
    return await new Promise((ok) => {
      const tx = db.transaction(ALMACEN, 'readwrite');
      const almacen = tx.objectStore(ALMACEN);
      const todas = almacen.getAll();
      todas.onsuccess = () => {
        almacen.clear();
        tx.oncomplete = () => ok(todas.result ?? []);
      };
      todas.onerror = () => ok([]);
    });
  } catch {
    return [];
  }
}

/** Qué puede hacer este dispositivo con los avisos. */
export function capacidad() {
  const hayAvisos = 'Notification' in window && 'serviceWorker' in navigator;
  return {
    hayAvisos,
    permiso: hayAvisos ? Notification.permission : 'no-disponible',
    // Número de botones que el sistema admite en un aviso (0 o indefinido = ninguno).
    botones: hayAvisos ? Number(Notification.maxActions ?? 0) : 0,
    instalada: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  };
}

export const contenidoAviso = () => ({
  titulo: '¿Qué tiempo hace hoy en casa?',
  opciones: {
    body: 'Elige el parte de hoy.',
    tag: 'parte-diario',
    icon: 'iconos/icono-192.png',
    badge: 'iconos/icono-192.png',
    requireInteraction: true,
    data: { url: './?hoja=registro' },
    actions: ORDEN_TIEMPOS.map((t) => ({ action: `tiempo-${t}`, title: `${TIEMPOS[t].emoji} ${TIEMPOS[t].titulo}` })),
  },
});

/**
 * Pide permiso y muestra el aviso con sus opciones.
 * @returns {Promise<{ok: boolean, motivo?: string, botones: number}>}
 */
export async function muestraAviso() {
  const c = capacidad();
  if (!c.hayAvisos) return { ok: false, motivo: 'sin-soporte', botones: 0 };
  const permiso = c.permiso === 'default' ? await Notification.requestPermission() : c.permiso;
  if (permiso !== 'granted') return { ok: false, motivo: 'denegado', botones: c.botones };
  const registro = await navigator.serviceWorker.ready;
  const { titulo, opciones } = contenidoAviso();
  await registro.showNotification(titulo, opciones);
  return { ok: true, botones: c.botones };
}
