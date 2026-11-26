// Qué navegador es y cómo se instala Stormy en él. Pasos sacados de la ayuda oficial de Apple, Google, Samsung,
// Microsoft y Mozilla. Función pura: se prueba con user agents reales.

const APPS_AJENAS = [
  ['WhatsApp', /WhatsApp/i], ['Instagram', /Instagram/i], ['Facebook', /FBAN|FBAV|FB_IAB|FBIOS/i], ['TikTok', /TikTok|musical_ly|BytedanceWebview/i],
  ['Gmail', /GSA\/|Gmail/i], ['LinkedIn', /LinkedInApp/i], ['X', /Twitter/i], ['Snapchat', /Snapchat/i], ['Pinterest', /Pinterest/i],
  ['Telegram', /Telegram/i], ['WeChat', /MicroMessenger/i], ['Line', /\bLine\//],
];

/**
 * @param {string} ua  user agent
 * @param {{maxTouchPoints?: number, standalone?: boolean}} extra
 * @returns {{plataforma: 'ios'|'android'|'escritorio', navegador: string, app: string|null, standalone: boolean, guia: string}}
 */
export function detectaNavegador(ua = '', { maxTouchPoints = 0, standalone = false } = {}) {
  // iPadOS se presenta como un Mac; se le distingue porque tiene pantalla táctil.
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const plataforma = ios ? 'ios' : android ? 'android' : 'escritorio';
  let app = APPS_AJENAS.find(([, re]) => re.test(ua))?.[0] ?? null;
  // Vista web genérica de Android dentro de otra app («; wv)»).
  if (!app && android && /; wv\)/.test(ua)) app = 'otra app';
  let navegador;
  if (ios) navegador = /CriOS/.test(ua) ? 'chrome' : /EdgiOS/.test(ua) ? 'edge' : /FxiOS/.test(ua) ? 'firefox' : 'safari';
  else if (android) navegador = /SamsungBrowser/.test(ua) ? 'samsung' : /EdgA/.test(ua) ? 'edge' : /Firefox/.test(ua) ? 'firefox' : /Chrome/.test(ua) ? 'chrome' : 'otro';
  else navegador = /Edg\//.test(ua) ? 'edge' : /Firefox/.test(ua) ? 'firefox' : /Chrome|Chromium/.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'otro';
  const guia = app ? 'inapp'
    : ios ? (navegador === 'safari' ? 'safari-ios' : navegador === 'chrome' ? 'chrome-ios' : 'otro-ios')
      : android ? ({ chrome: 'android-chrome', samsung: 'samsung', firefox: 'firefox-android', edge: 'edge-android' }[navegador] ?? 'android-chrome')
        : ({ chrome: 'escritorio-chrome', edge: 'escritorio-edge', safari: 'safari-mac' }[navegador] ?? 'escritorio-otro');
  return { plataforma, navegador, app, standalone: !!standalone, guia };
}

/** Enlace para abrir la página en Chrome desde el navegador de otra app en Android. */
export const enlaceChrome = (url) => {
  const u = new URL(url);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;end`;
};

/**
 * Guías por navegador: nombre para el selector y pasos [título, texto, dibujo]. El dibujo describe qué pintar:
 * { barra: icono, lado } (barra del navegador con el botón marcado), { menu: [filas], marca } o { confirma: botón }.
 */
export const GUIAS = {
  'safari-ios': { nombre: 'Safari (iPhone/iPad)', pasos: null }, // usa los dibujos de Safari de siempre
  'chrome-ios': {
    nombre: 'Chrome (iPhone/iPad)',
    pasos: [
      ['Toca «Compartir»', 'El cuadrado con una flecha, a la derecha de la barra de direcciones.', { barra: 'compartir', lado: 'derecha', arriba: true }],
      ['«Añadir a pantalla de inicio»', 'Búscalo en la lista; si no lo ves, desliza hacia arriba.', { menu: ['Copiar', 'Añadir a favoritos', 'Añadir a pantalla de inicio'], marca: 2 }],
      ['Toca «Añadir»', 'Stormy aparece en tu pantalla de inicio como una app más.', { confirma: 'Añadir' }],
    ],
  },
  'otro-ios': {
    nombre: 'Edge, Firefox u otro (iPhone)',
    pasos: [
      ['Abre el menú y toca «Compartir»', 'En Edge y Firefox está en el menú del navegador (… o ≡).', { barra: 'menu', lado: 'derecha' }],
      ['«Añadir a pantalla de inicio»', 'En la hoja de compartir de iPhone.', { menu: ['Copiar', 'Añadir a favoritos', 'Añadir a pantalla de inicio'], marca: 2 }],
      ['Toca «Añadir»', 'Si no aparece la opción, abre el enlace en Safari: allí siempre está.', { confirma: 'Añadir' }],
    ],
  },
  'android-chrome': {
    nombre: 'Chrome (Android)',
    pasos: [
      ['Toca el menú ⋮', 'Los tres puntos, arriba a la derecha.', { barra: 'puntos', lado: 'derecha', arriba: true }],
      ['«Instalar y crear acceso directo»', 'En algunos móviles pone «Instalar aplicación» o «Añadir a pantalla de inicio».', { menu: ['Nueva pestaña', 'Historial', 'Instalar y crear acceso directo'], marca: 2 }],
      ['Toca «Instalar»', 'Stormy queda en tu pantalla de inicio y en el cajón de apps.', { confirma: 'Instalar' }],
    ],
  },
  samsung: {
    nombre: 'Samsung Internet',
    pasos: [
      ['Toca el menú ≡', 'Abajo a la derecha. Si ves un «+» en la barra de direcciones, también vale.', { barra: 'hamburguesa', lado: 'derecha' }],
      ['«Añadir página a»', 'Y después elige «Pantalla de inicio».', { menu: ['Marcadores', 'Añadir página a', 'Pantalla de inicio'], marca: 1 }],
      ['Toca «Añadir»', 'Stormy aparece en tu pantalla de inicio.', { confirma: 'Añadir' }],
    ],
  },
  'firefox-android': {
    nombre: 'Firefox (Android)',
    pasos: [
      ['Toca el menú ⋮', 'Arriba o abajo a la derecha, según dónde tengas la barra.', { barra: 'puntos', lado: 'derecha' }],
      ['«Añadir a pantalla de inicio»', 'En algunas versiones pone «Instalar».', { menu: ['Marcadores', 'Compartir', 'Añadir a pantalla de inicio'], marca: 2 }],
      ['Toca «Añadir»', 'Stormy aparece en tu pantalla de inicio.', { confirma: 'Añadir' }],
    ],
  },
  'edge-android': {
    nombre: 'Edge (Android)',
    pasos: [
      ['Toca el menú …', 'Abajo, en el centro de la barra.', { barra: 'menu', lado: 'centro' }],
      ['«Añadir al teléfono»', 'Puede aparecer como «Instalar» o «Añadir a pantalla de inicio».', { menu: ['Favoritos', 'Compartir', 'Añadir al teléfono'], marca: 2 }],
      ['Toca «Instalar»', 'Stormy queda en tu pantalla de inicio.', { confirma: 'Instalar' }],
    ],
  },
  'escritorio-chrome': {
    nombre: 'Chrome (ordenador)',
    pasos: [
      ['Icono «Instalar»', 'A la derecha de la barra de direcciones. Si no está: menú ⋮ → «Enviar, guardar y compartir» → «Instalar página como aplicación…».', { barra: 'instalar', lado: 'derecha', arriba: true }],
      ['Toca «Instalar»', 'Stormy se abre en su propia ventana.', { confirma: 'Instalar' }],
    ],
  },
  'escritorio-edge': {
    nombre: 'Edge (ordenador)',
    pasos: [
      ['Icono «Aplicación disponible»', 'En la barra de direcciones.', { barra: 'instalar', lado: 'derecha', arriba: true }],
      ['Haz clic en «Instalar»', 'Stormy queda como una app más de Windows.', { confirma: 'Instalar' }],
    ],
  },
  'safari-mac': {
    nombre: 'Safari (Mac)',
    pasos: [
      ['Archivo → «Añadir al Dock»', 'O con el botón Compartir → «Añadir al Dock». Necesita macOS Sonoma o posterior.', { menu: ['Nueva ventana', 'Exportar como PDF…', 'Añadir al Dock…'], marca: 2 }],
      ['Haz clic en «Añadir»', 'Stormy queda en el Dock y en Aplicaciones.', { confirma: 'Añadir' }],
    ],
  },
  'escritorio-otro': {
    nombre: 'Otro navegador (ordenador)',
    pasos: [
      ['Mejor desde el móvil', 'Stormy está pensada para el móvil. En el ordenador se puede instalar desde Chrome, Edge o Safari (Mac).', { confirma: 'Abrir en el móvil' }],
    ],
  },
  inapp: { nombre: 'Dentro de otra app (WhatsApp, Instagram…)', pasos: null },
};

/** Guías que se ofrecen en «¿Usas otro navegador?», agrupadas por dispositivo. */
export const ORDEN_GUIAS = [
  ['iPhone y iPad', ['safari-ios', 'chrome-ios', 'otro-ios']],
  ['Android', ['android-chrome', 'samsung', 'firefox-android', 'edge-android']],
  ['Ordenador', ['escritorio-chrome', 'escritorio-edge', 'safari-mac']],
  ['Otras', ['inapp']],
];
