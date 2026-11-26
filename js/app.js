// Stormy — aplicación web instalable. Sin dependencias ni servidor: todo se calcula y se guarda en el dispositivo.
import {
  Motor, FASES, NIVELES, RAYOS, SEMANA, estadoHoy, fase as faseDe, marcaRegla, aIso, aNum, diaSemana, diasDePronostico, hoyIso,
  nivelActual, nivelSiguiente, premioDe, racha, tiempoDe,
} from './motor.js';
import {
  APP, AVISO_CICLO, CADA_PERSONA, textosConoceCiclo, ENLACE_LUNA, ETIQUETAS, FASES_INFO, FICHAS_CICLO, HOROSCOPO_DETRAS, HORMONAS, ICONOS, INSIGNIAS,
  ORDEN_TIEMPOS, TEXTOS_AVISO, TIEMPOS, avatarNimbo, consejoDe, ficha, horoscopoDe, iconoTiempo, lunaSVG, nubeSuelta, signo, solSuelto, stormyPortada,
} from './contenido.js';
import { NIMBO, reaccion, responder, saludo, sugerenciasDe } from './asistente.js';
import { capacidad, muestraAviso, pidePermiso, recogePendientes } from './avisos.js';
import { faseLunar } from './cielo.js';
import {
  PARENTESCOS, RELACIONES, aCodigo, aCopia, borrarTodo, cargar, casaDe, deCodigo, deCopia, diasPendientes, ejemplo, entradaVacia,
  extrasDe, fusionaRespuestas, guardar, muestrasDe, rayosDeEstado, reglasDe, totalExtras,
} from './datos.js';

// ---------- App nativa de iPhone ----------
// Dentro de la app nativa (un visor de esta misma web), el aviso diario lo programa el iPhone y se responde
// desde la propia notificación. La app nativa avisa de que está ahí con `window.STORMY_NATIVO`.
const NATIVO = !!(globalThis.STORMY_NATIVO && globalThis.webkit?.messageHandlers?.stormy);
const nativo = (tipo, datos = {}) => {
  try {
    globalThis.webkit.messageHandlers.stormy.postMessage({ ...datos, tipo }); // `tipo` siempre manda
  } catch {
    /* fuera de la app nativa no hay a quién avisar */
  }
};
const textoAvisoNativo = (hora) => TEXTOS_AVISO.nativo.confirmacion(hora);

// ---------- Estado ----------

let real = cargar();
// Modo demostración: un estado de ejemplo que solo vive en memoria. Los datos reales no se tocan ni se guardan encima.
let demo = null;
const E = () => demo ?? real;
const salva = () => (demo ? false : guardar(real));

const ui = {
  pestana: 'hoy',
  paso: 0,
  pasoPintado: null,
  mes: hoyIso().slice(0, 7),
  hoja: null,
  borrador: null,
  alta: {
    consiente: false, relacion: null, parentesco: null, apodo: '', miApodo: '', conNacimiento: false, nacimiento: '1992-06-15',
    sigueCiclo: false, ultimaRegla: hoyIso(), duracion: 28, hora: '21:30',
  },
  instalar: null,
  chat: [],
  pensando: false,
  recorrido: null, // paso del recorrido guiado, o null si no está en marcha
  recien: null, // último parte apuntado, para animar el calendario
  nivelPendiente: null,
  copiaPendiente: null,
  muestra: null,
};

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const num = (v, d = 1) => v.toFixed(d).replace('.', ',');
const pct = (v) => `${Math.round(v * 100)} %`;
const faltan = (n) => (n === 1 ? 'Falta 1 día' : `Faltan ${n} días`);
const fecha = (iso, opciones) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { ...opciones, timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, d)));
};
const fechaLarga = (iso) => mayus(fecha(iso, { weekday: 'long', day: 'numeric', month: 'long' }));

const motorDe = (st) =>
  new Motor({
    muestras: muestrasDe(st), reglas: reglasDe(st), duracion: st.perfil.duracion, sigueCiclo: st.perfil.sigueCiclo, hoy: hoyIso(),
  });
const motor = () => motorDe(E());
const diasRegistrados = () => Object.keys(E().entradas).length;
/** Estado de ejemplo para las vistas «de ejemplo» de lo que aún está bloqueado. */
const muestra = () => (ui.muestra ??= ejemplo(60, { ...E().perfil, sigueCiclo: true }));
const stormyEspecial = () => diasRegistrados() >= NIVELES[NIVELES.length - 1].dias;

// ---------- Arranque con parámetros de prueba: ?demo=30&pestana=descubrimientos&hoja=registro&paso=2&reiniciar=1 ----------

{
  const q = new URLSearchParams(location.search);
  if (q.has('reiniciar')) {
    real = borrarTodo();
    // Se quita de la dirección para que recargar la página no vuelva a borrar.
    q.delete('reiniciar');
    history.replaceState(null, '', location.pathname + (q.size ? `?${q}` : ''));
  }
  // ?demo=N abre el modo demostración con N días de ejemplo; no escribe nada en el almacenamiento.
  if (q.has('demo')) demo = ejemplo(Number.isFinite(Number(q.get('demo'))) ? Number(q.get('demo')) : 30, real.perfil);
  // ?demo=30&cielo=5: en el modo demostración, el parte de hoy de ejemplo con ese tiempo (solo en memoria).
  if (demo && /^[1-5]$/.test(q.get('cielo') ?? '')) demo.entradas[hoyIso()] = { ...entradaVacia(), animo: Number(q.get('cielo')) };
  if (q.has('pestana')) ui.pestana = q.get('pestana');
  if (q.has('paso')) ui.paso = Number(q.get('paso')) || 0;
  if (q.has('hoja') && E().perfil.alta) {
    const accion = { registro: 'abrirRegistro', niveles: 'abrirNiveles', nimbo: 'abrirNimbo' }[q.get('hoja')] ?? 'abrirRegistro';
    setTimeout(() => acciones[accion]({}), 0);
  }
}

// ---------- Piezas comunes ----------

const tarjeta = (html, clase = '') => `<article class="tarjeta ${clase}">${html}</article>`;
const encabezado = (icono, titulo, sub) =>
  `<header class="encabezado"><span class="marca">${ICONOS[icono]}</span><div><h3>${titulo}</h3><p>${sub}</p></div></header>`;
const interruptor = (modelo, activo, etiqueta) =>
  `<label class="interruptor"><span>${etiqueta}</span><input type="checkbox" role="switch" data-modelo="${modelo}" ${activo ? 'checked' : ''}><i aria-hidden="true"></i></label>`;
const paso = (modelo) =>
  `<span class="pasos"><button type="button" data-accion="pasoNumero" data-modelo="${modelo}" data-d="-1" aria-label="Un día menos">−</button><button type="button" data-accion="pasoNumero" data-modelo="${modelo}" data-d="1" aria-label="Un día más">+</button></span>`;
/** Botones de elección única ligados a un campo: alta.*, perfil.* o borrador.* */
const eleccion = (modelo, actual, opciones, clase = 'triple') =>
  `<div class="${clase}">${opciones
    .map(([v, nombre]) => `<button type="button" class="opcion ${actual === v ? 'on' : ''}" aria-pressed="${actual === v}" data-accion="elige" data-modelo="${modelo}" data-v="${v}">${nombre}</button>`)
    .join('')}</div>`;
const fuentes = (lista) =>
  `<p class="fuentes">Fuentes: ${lista.map(([nombre, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(nombre)}</a>`).join(' · ')}</p>`;

/** Anillo de progreso con algo dentro. `progreso` va de 0 a 1. */
function anillo(progreso, dentro, lado = 40, grosor = 4) {
  const r = (lado - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progreso));
  const circulo = (clase, extra = '') =>
    `<circle class="${clase}" cx="${lado / 2}" cy="${lado / 2}" r="${r}" fill="none" stroke-width="${grosor}" ${extra}/>`;
  return `<span class="anillo ${p >= 1 ? 'lleno' : ''}" style="width:${lado}px;height:${lado}px"><svg viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}" aria-hidden="true">${circulo('pista')}${
    p > 0 ? circulo('avance', `stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p)).toFixed(1)}" transform="rotate(-90 ${lado / 2} ${lado / 2})"`) : ''
  }</svg><span class="dentro">${dentro}</span></span>`;
}

// ---------- Bienvenida ----------

const enPantallaDeInicio = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const esAndroid = () => /android/i.test(navigator.userAgent);
// Navegadores incrustados en otras apps: en iPhone no dejan añadir la web a la pantalla de inicio.
const enAppAjena = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Twitter|TikTok|musical_ly|LinkedInApp|Snapchat|Pinterest|GSA\/|MicroMessenger|Telegram/i.test(navigator.userAgent);

const pasosAlta = () => [
  'presentacion', 'portada', ...(enPantallaDeInicio() || NATIVO ? [] : ['instalar']), 'juego', 'quien',
  ...(ui.alta.relacion === 'pareja' ? ['ciclo'] : []), 'aviso',
];

// Dibujos sencillos de lo que enseña Safari en cada paso, con la parte que hay que tocar resaltada.
const resalte = (x, y, w, h, r = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="#FF6B5E" stroke-width="3"/>`;
const filaHoja = (y, texto, icono, marcada) => `<g><rect x="16" y="${y}" width="248" height="34" rx="9" fill="var(--relleno)"/>
  <text x="30" y="${y + 22}" class="mock-txt">${texto}</text><g transform="translate(232 ${y + 8})" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round">${icono}</g>
  ${marcada ? resalte(12, y - 4, 256, 42, 12) : ''}</g>`;
const ICO_MAS = '<rect x="1" y="1" width="16" height="16" rx="4"/><path d="M9 5v8M5 9h8"/>';
const ICO_COPIAR = '<rect x="5" y="5" width="11" height="11" rx="2.5"/><path d="M2 12V3.5A1.5 1.5 0 0 1 3.5 2H12"/>';
const ICO_ESTRELLA = '<path d="M9 1.5l2.3 4.8 5.2.7-3.8 3.6.9 5.1L9 13.3l-4.6 2.4.9-5.1L1.5 7l5.2-.7z"/>';
const ICO_FLECHA = '<path d="M4 7l5 5 5-5"/>';
const ICO_COMPARTIR = '<path d="M9 11V1.5M5.5 5L9 1.5 12.5 5M4 8v7.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5V8"/>';
const circuloHoja = (x, texto, icono, marcado) => `<g><circle cx="${x}" cy="40" r="24" fill="var(--relleno)"/>
  <g transform="translate(${x - 9} 31)" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">${icono}</g>
  <text x="${x}" y="84" class="mock-txt" text-anchor="middle">${texto}</text>${marcado ? resalte(x - 33, 10, 66, 84, 18) : ''}</g>`;
// Lo que enseña Safari en iOS 26: menú ≡ → Compartir → Ver más → Añadir a pantalla de inicio → Añadir.
const MOCKS_IOS = [
  // 1. Barra de Safari: menú y, en él, «Compartir»
  `<rect x="10" y="8" width="210" height="44" rx="12" fill="var(--tarjeta)" stroke="var(--linea)"/>
   <g transform="translate(24 21)" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">${ICO_COMPARTIR}</g>
   <text x="54" y="36" class="mock-txt">Compartir</text>${resalte(6, 4, 218, 52, 14)}
   <rect x="10" y="76" width="260" height="48" rx="24" fill="var(--relleno)"/>
   <g stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M28 92l-8 8 8 8"/><path d="M58 92h16M58 100h16M58 108h11"/></g>
   <text x="160" y="105" class="mock-txt" text-anchor="middle">stormy</text>${resalte(48, 80, 36, 40, 12)}`,
  // 2. Hoja de compartir: «Ver más»
  `${circuloHoja(40, 'Copiar', ICO_COPIAR)}${circuloHoja(107, 'Marcadores', '<path d="M4 2h10v15l-5-4-5 4z"/>')}${circuloHoja(174, 'Lectura', '<circle cx="4" cy="10" r="3.5"/><circle cx="14" cy="10" r="3.5"/><path d="M7.5 10h3"/>')}${circuloHoja(241, 'Ver más', ICO_FLECHA, true)}`,
  // 3. La lista que se despliega: «Añadir a pantalla de inicio»
  `${filaHoja(8, 'Añadir a favoritos', ICO_ESTRELLA)}${filaHoja(48, 'Buscar en la página', '<circle cx="8" cy="8" r="5"/><path d="M12 12l4 4"/>')}${filaHoja(88, 'Añadir a pantalla de inicio', ICO_MAS, true)}`,
  // 4. Pantalla final: «Añadir», arriba a la derecha
  `<rect x="10" y="10" width="260" height="44" rx="12" fill="var(--relleno)"/>
   <text x="24" y="38" class="mock-txt tenue">✕</text><text x="130" y="38" class="mock-txt" text-anchor="middle" font-weight="700">Añadir a inicio</text>
   <text x="256" y="38" class="mock-txt azul" text-anchor="end" font-weight="700">Añadir</text>${resalte(206, 16, 58, 32, 10)}
   <rect x="20" y="66" width="52" height="52" rx="13" fill="#2E2466"/><path d="M33 98a6 6 0 0 1 0-12 9 9 0 0 1 17-2 7 7 0 0 1 2 14z" fill="#fff"/><path d="M45 94l-5 7h4l-2 6 6-8h-4l2-5z" fill="#FFC94D"/>
   <text x="86" y="90" class="mock-txt">Stormy</text><text x="86" y="108" class="mock-txt tenue">Así aparecerá el icono</text>`,
];
const PASOS_IOS = [
  ['Toca ≡ y luego «Compartir»', 'El menú ≡ está en la barra de abajo de Safari. Si ves directamente el cuadrado con una flecha, tócalo.'],
  ['Toca «Ver más»', 'En la hoja que se abre, el círculo con la flecha hacia abajo.'],
  ['«Añadir a pantalla de inicio»', 'Aparece en la lista, con un cuadrado con un +. Si no lo ves, desliza hacia arriba.'],
  ['Toca «Añadir»', 'Arriba a la derecha. Stormy aparece con su icono, como una app más: ábrela desde ahí.'],
];

function guiaInstalar() {
  if (enAppAjena()) {
    return tarjeta(`<div class="fila"><span class="acento">${ICONOS.compartir}</span><div><strong>Ábrelo en ${esIOS() ? 'Safari' : 'el navegador'}</strong>
      <p>Estás viendo Stormy dentro de otra app y desde aquí no se puede instalar. Copia el enlace, abre ${esIOS() ? 'Safari' : 'el navegador'} y pégalo en la barra de direcciones.</p></div></div>
      <button type="button" class="principal suave con-margen" data-accion="copiarEnlace">${ICONOS.copiar}<span>Copiar enlace</span></button>`, 'cristal');
  }
  if (esIOS()) {
    return `<ol class="pasos-instalar">${PASOS_IOS.map(([t, x], i) => `<li class="tarjeta cristal"><div class="paso-cab"><span class="num">${i + 1}</span><div><strong>${t}</strong><p>${x}</p></div></div>
      <svg class="mock" viewBox="0 0 280 ${i === 1 ? 100 : 130}" role="img" aria-label="Paso ${i + 1}: ${t}">${MOCKS_IOS[i]}</svg></li>`).join('')}</ol>`;
  }
  if (ui.instalar) {
    return tarjeta(`<button type="button" class="principal" data-accion="instalar">${ICONOS.mas}<span>Instalar Stormy</span></button>
      <p class="nota">Un toque y queda en tu pantalla de inicio.</p>`, 'cristal');
  }
  return tarjeta(`<p class="nota sin-margen">${esAndroid()
    ? 'En el menú del navegador (⋮), elige «Instalar aplicación» o «Añadir a pantalla de inicio».'
    : 'Abre este enlace en el móvil para instalar Stormy en la pantalla de inicio. En el ordenador, el navegador puede ofrecer «Instalar» en la barra de direcciones.'}</p>`, 'cristal');
}

/** Móvil sin instalar y fuera de la app nativa: es cuando hay que insistir en instalar. */
const faltaInstalar = () => !NATIVO && !enPantallaDeInicio() && (esIOS() || esAndroid());
const POR_QUE_INSTALAR = 'Sin instalarla no hay avisos, y Safari puede borrar tus partes si pasas unos días sin abrirla.';

function bienvenida() {
  const a = ui.alta;
  const fila = (icono, titulo, texto) =>
    `<div class="fila"><span class="acento">${ICONOS[icono]}</span><div><strong>${titulo}</strong><p>${texto}</p></div></div>`;
  const titulo = (t, sub) => `<div class="titulo-paso"><h1>${t}</h1><p>${sub}</p></div>`;
  const pasos = {
    presentacion: () => `<div class="presentacion">
        ${stormyPortada(120)}
        <p class="cita">«${APP.presentacion}»</p>
        <p class="explica">${APP.queHace}</p>
        <div class="chips-intro"><span>${ICONOS.toque}Un toque al día</span><span>${ICONOS.calendario}En 7 días, primeros patrones</span></div>
      </div>`,
    portada: () => `<div class="portada">
        ${stormyPortada(132)}
        <h1>${APP.nombre}</h1>
        <p class="lema">${APP.lema}</p>
      </div>
      ${tarjeta(
        fila('toque', 'Cada día, un toque', 'Apunta qué tiempo ha hecho en casa. Son 5 segundos.') +
        fila('calendario', 'Resultados desde la primera semana', 'A los 7 días ya ves los primeros patrones. Stormy los estudia y pronostica con criterio.') +
        fila('destello', 'Pronostico con humor', 'Previsión y consejos para llegar a casa con paraguas… o con planes.'),
        'cristal filas')}`,
    instalar: () => `<div class="titulo-paso importante"><span class="etiqueta-importante">Importante</span><h1>Paso importante: instala Stormy</h1><p>${POR_QUE_INSTALAR}</p></div>
      ${guiaInstalar()}`,
    juego: () => `${titulo('Juego limpio', 'Antes de empezar, lo más importante.')}
      <div class="escena ${a.consiente ? 'on' : ''}" aria-hidden="true"><span class="escena-sol">${solSuelto(84)}</span><span class="escena-nube">${nubeSuelta(96)}</span></div>
      ${a.consiente ? '<p class="acierto" role="status">Primer acierto del pronóstico: compartirlo ha sido buena idea.</p>' : ''}
      ${tarjeta(
        fila('personas', 'Es cosa de dos', 'Vais a apuntar cómo está el ambiente en casa. Enseñadle la app y decidid juntos si os apetece.') +
        fila('movil', 'Se queda en este dispositivo', 'Sin cuentas, sin servidores y sin publicidad.') +
        fila('mascaras', 'Es un juego', 'Entretenimiento para entenderos mejor. No es consejo médico ni psicológico.'),
        'cristal filas')}
      ${tarjeta(interruptor('alta.consiente', a.consiente, '<strong>Lo hemos hablado y nos apetece a los dos</strong>'), 'cristal')}`,
    quien: () => `${titulo('¿Con quién vives?', 'Para que el parte tenga nombre propio.')}
      ${tarjeta(`${eleccion('alta.relacion', a.relacion, RELACIONES)}
        ${a.relacion === 'familia' ? `<p class="sobre con-margen">¿Quién es?</p>${eleccion('alta.parentesco', a.parentesco, PARENTESCOS, 'chips')}` : ''}
        ${a.relacion && a.relacion !== 'pareja' ? '<p class="nota">El ciclo menstrual se puede añadir más adelante en Ajustes, si lo veis necesario.</p>' : ''}`, 'cristal')}
      ${tarjeta(`<label class="campo"><span>¿Cómo le llamas en casa?</span>
        <input type="text" data-modelo="alta.apodo" value="${esc(a.apodo)}" placeholder="Mote o apodo" autocomplete="off" autocapitalize="words" enterkeyhint="next" maxlength="30"></label>
        <p class="nota">Mejor un mote que el nombre real: aquí no hacen falta apellidos.</p>
        <label class="campo con-margen"><span>¿Y a ti cómo te llaman?</span>
        <input type="text" data-modelo="alta.miApodo" value="${esc(a.miApodo)}" placeholder="Tu mote" autocomplete="off" autocapitalize="words" enterkeyhint="done" maxlength="30"></label>`, 'cristal')}
      ${tarjeta(`${interruptor('alta.conNacimiento', a.conNacimiento, 'Añadir su fecha de nacimiento')}
        ${a.conNacimiento ? `<label class="linea"><span>Nacimiento</span><input type="date" data-modelo="alta.nacimiento" value="${a.nacimiento}" max="${hoyIso()}"></label>` : ''}
        <p class="nota">¿Aciertan los astros? Quién sabe. Stormy los consulta por si acaso.</p>`, 'cristal')}`,
    ciclo: () => `${titulo('Lo que no nos explicaron en clase', 'Opcional. Si le apetece compartirlo, Stormy os lo explica.')}
      ${tarjeta(`${interruptor('alta.sigueCiclo', a.sigueCiclo, 'Incluir el ciclo menstrual')}
        ${a.sigueCiclo ? `<label class="linea"><span>Inicio de la última regla</span><input type="date" data-modelo="alta.ultimaRegla" value="${a.ultimaRegla}" max="${hoyIso()}"></label>
        <div class="linea"><span>Duración habitual: ${a.duracion} días</span>${paso('alta.duracion')}</div>` : ''}
        <p class="nota">Esta información sirve para entender, no para etiquetar. Cada persona vive el ciclo de forma distinta: Stormy parte de un patrón general muy suave y lo corrige con vuestros registros.</p>
        <p class="nota">Es un dato de salud y se queda en este dispositivo. Se puede cambiar o quitar cuando queráis en Ajustes.</p>`, 'cristal')}`,
    aviso: () => `${titulo('Recordatorio diario', 'Un aviso al día. Sin él, casi nadie llega a los 30.')}
      ${tarjeta(`<div class="aviso-ejemplo" role="img" aria-label="Ejemplo: llega el aviso «¿Qué tiempo ha hecho hoy en casa?», lo abres y eliges una de las cinco opciones">
          <div class="notificacion">${avatarNimbo(34)}<div><strong>Stormy <small>ahora</small></strong><p>¿Qué tiempo ha hecho hoy en casa?</p></div></div>
          <span class="baja-flecha">${ICONOS.subir}</span>
          <div class="cinco">${ORDEN_TIEMPOS.map((t) => ficha(t, 42)).join('')}</div>
        </div>
        <p class="nota centro"><strong>${NATIVO ? TEXTOS_AVISO.nativo.paso : TEXTOS_AVISO.web.paso}</strong></p>`, 'cristal')}
      ${tarjeta(`<label class="linea sin-margen"><span><strong>Hora del aviso</strong></span><input type="time" data-modelo="alta.hora" value="${a.hora}"></label>
        <p class="nota">Puedes cambiar la hora cuando quieras en Ajustes.</p>`, 'cristal')}`,
  };
  const orden = pasosAlta();
  ui.paso = Math.min(Math.max(0, ui.paso), orden.length - 1);
  const id = orden[ui.paso];
  const ultimo = ui.paso === orden.length - 1;
  const bloqueado = (id === 'juego' && !a.consiente) || (id === 'quien' && !a.relacion);
  const quieto = ui.pasoPintado === id;
  ui.pasoPintado = id;
  return `<main class="bienvenida">
    <div class="indicador" aria-hidden="true">${orden.map((_, i) => `<i class="${i <= ui.paso ? 'on' : ''}"></i>`).join('')}</div>
    <div class="paso ${quieto ? 'quieto' : ''}" data-paso="${id}">${pasos[id]()}</div>
    <footer class="pie">
      ${ultimo
        ? `<button class="principal" data-accion="terminar" data-aviso="1">Activar aviso y empezar</button>
           <button class="secundario" data-accion="terminar">Empezar sin aviso</button>`
        : id === 'instalar' && (esIOS() || esAndroid())
          ? `<button class="principal" data-accion="siguiente">Ya la he instalado</button>
             <button class="enlace-pequeno" data-accion="instalarLuego">Ahora no</button>`
          : `<button class="principal" data-accion="siguiente" ${bloqueado ? 'disabled' : ''}>${ui.paso === 0 ? 'Empezar' : 'Continuar'}</button>
           ${ui.paso > 0 ? '<button class="secundario" data-accion="atras">Atrás</button>' : ''}`}
    </footer>
  </main>`;
}

// ---------- Hoy ----------

function anillosNiveles(dias) {
  return NIVELES.map((n, i) => {
    const previo = NIVELES[i - 1]?.dias ?? 0;
    const progreso = i === 0 ? 1 : (dias - previo) / (n.dias - previo);
    return anillo(progreso, dias >= n.dias ? ICONOS[n.icono] : `<b>${n.dias}</b>`, 36, 4);
  }).join('');
}

function vistaHoy() {
  const st = E();
  const hoy = hoyIso();
  const m = motor();
  const entrada = st.entradas[hoy];
  // Con el parte ya registrado, la previsión se calcula sin mirarlo: así "preveía" es una comparación honesta.
  const p = m.pronostico(hoy, entrada ? hoy : null);
  const t = entrada?.animo ?? p.tiempo;
  const perfil = st.perfil;
  const dias = m.dias;

  const visibles = diasDePronostico(dias);
  const proximos = m.pronosticos(aIso(aNum(hoy) + 1), 7)
    .map((f, i) => `<div><span>${SEMANA.inicial[diaSemana(aNum(f.dia))]}</span>${
      i < visibles ? ficha(f.tiempo, 34) : `<span class="bloqueo" aria-label="Bloqueado">${ICONOS.candado}</span>`}</div>`)
    .join('');
  const cuenta = visibles === 0 ? `${faltan(14 - dias)} para tu primer pronóstico`
    : visibles < 7 ? `${faltan(30 - dias)} para ver la semana completa` : '';

  const nivel = nivelActual(dias);
  const sig = nivelSiguiente(dias);
  const s = perfil.nacimiento ? signo(perfil.nacimiento) : null;

  const avisoInstalar = faltaInstalar() && !instalarOcultoHoy()
    ? `<div class="aviso-instalar" role="status"><button type="button" data-accion="verInstalar">${ICONOS.subir}<span>Stormy no está instalada · <u>Cómo instalar</u></span></button>
        <button type="button" class="cerrar" data-accion="ocultarInstalar" aria-label="Ocultar hasta mañana">×</button></div>` : '';
  return `<main class="hoy">
    ${avisoInstalar}
    <header class="cabecera">
      <div><h1>${esc(casaDe(perfil))}</h1><p>${fechaLarga(hoy)}</p></div>
      <button type="button" class="icono-boton" data-accion="compartir" aria-label="Compartir el parte de hoy">${ICONOS.compartir}</button>
      <button type="button" class="burbuja-registro ${entrada ? 'hecho' : ''}" data-accion="abrirRegistro" data-guia="registrar"
        aria-label="${entrada ? `Parte de hoy: ${TIEMPOS[entrada.animo].titulo}. Toca para cambiarlo` : 'Registrar el parte de hoy'}">${
        entrada ? `${ICONOS.visto}${ficha(entrada.animo, 30)}` : `${ICONOS.mas}<span>Registrar</span>`}</button>
    </header>
    <section class="heroe">
      <div class="heroe-cab">
        <span class="disco">${iconoTiempo(t, 64)}</span>
        <div><h2>${TIEMPOS[t].titulo}</h2><p class="sub">${estadoHoy(p.tiempo, entrada?.animo ?? null)}</p></div>
      </div>
      <div class="fiabilidad" role="img" aria-label="Fiabilidad del pronóstico: ${Math.round(p.fiabilidad * 100)} por ciento">
        <span>Fiabilidad</span><span class="medidor"><i style="width:${p.fiabilidad * 100}%"></i></span><b>${pct(p.fiabilidad)}</b>
      </div>
      ${p.etiquetas.length ? `<ul class="motivos" aria-label="Por qué">${p.etiquetas.slice(0, 2).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </section>
    ${tarjeta(`<div class="consejo-cab"><p class="sobre"><i class="acento">${ICONOS.bombilla}</i>Consejo del día</p>
        <button type="button" class="pildora" data-accion="abrirHoroscopo">${s ? `<span aria-hidden="true">${s.emoji}</span>Horóscopo` : `${ICONOS.mas}Añadir horóscopo`}</button></div>
      <p class="texto">${consejoDe(t, hoy, perfil.relacion)}</p>`, 'cristal compacta')}
    ${tarjeta(`<h3>Próximos días</h3><div class="semana">${proximos}</div>
      ${cuenta ? `<p class="nota cuenta">${ICONOS.candado}${cuenta}</p>` : ''}`, 'cristal compacta')}
    <button class="tarjeta cristal compacta boton-tarjeta progreso-hoy" data-accion="abrirNiveles" data-guia="progreso"
      aria-label="${nivel.titulo}. Racha de ${racha(Object.keys(st.entradas), hoy)} días y ${rayosDeEstado(st)} rayos. Abre el camino de niveles">
      <div class="progreso-cab"><p class="sobre">Nivel ${nivel.id + 1} de ${NIVELES.length} · ${nivel.titulo}</p>
        <span class="marcas"><span><i class="acento">${ICONOS.llama}</i>${racha(Object.keys(st.entradas), hoy)}</span><span><i class="mango">${ICONOS.rayo}</i>${rayosDeEstado(st)}</span></span></div>
      <div class="anillos">${anillosNiveles(dias)}</div>
      <p class="nota">${sig ? `${faltan(sig.dias - dias)} para «${premioDe(sig, perfil.sigueCiclo)}»` : 'Todos los mundos abiertos: Stormy ya conoce vuestro clima.'}</p>
    </button>
  </main>`;
}

// El aviso de instalar se puede ocultar hasta el día siguiente (preferencia de este navegador, no un dato de la casa).
const CLAVE_INSTALAR = 'stormy.instalarOculto';
function instalarOcultoHoy() {
  try {
    return localStorage.getItem(CLAVE_INSTALAR) === hoyIso();
  } catch {
    return false;
  }
}

function hojaInstalar() {
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Cerrar</button></div>
    <div class="hoja-cuerpo instalar-hoja">
      <h2>Instala Stormy</h2>
      <p class="fecha">${POR_QUE_INSTALAR}</p>
      ${guiaInstalar()}
    </div>`;
}

// ---------- Registro: un toque guarda; lo demás es opcional ----------

function hojaRegistro() {
  const b = ui.borrador;
  const perfil = E().perfil;
  const esHoy = b.dia === hoyIso();
  const extras = extrasDe(b);
  const tres = (titulo, campo, nombres) =>
    `<div class="grupo"><h4>${titulo}</h4>${eleccion(`borrador.${campo}`, b[campo], nombres.map((n, i) => [i + 1, n]))}</div>`;
  const masDatos = !b.animo ? '' : `
      ${b.reaccion ? `<div class="reaccion" role="status">${avatarNimbo(40, stormyEspecial())}<p>${b.reaccion}</p><span class="premio">+${b.premio}${ICONOS.rayo}</span></div>` : ''}
      <div class="extra-cab"><div><h3>¿Añades algún dato más?</h3><p>Opcional. Se guarda solo según lo tocas.</p></div>${extras ? `<span class="contador">+${extras}</span>` : ''}</div>
      ${tres('¿Qué tal la noche?', 'sueno', ['Mala', 'Regular', 'Buena'])}
      ${tres('¿Día estresante?', 'estres', ['Poco', 'Normal', 'Mucho'])}
      ${tres('Tiempo juntos', 'juntos', ['Poco', 'Normal', 'Mucho'])}
      <div class="grupo"><h4>${esHoy ? '¿Qué ha pasado hoy?' : '¿Qué pasó ese día?'}</h4><div class="chips">${ETIQUETAS.map((e) => `<button type="button" class="opcion ${b.etiquetas.includes(e) ? 'on' : ''}" aria-pressed="${b.etiquetas.includes(e)}" data-accion="etiqueta" data-e="${esc(e)}">${e}</button>`).join('')}</div></div>
      <div class="grupo"><h4>${esHoy ? '¿Qué toca mañana?' : '¿Qué tocaba al día siguiente?'}</h4>${eleccion('borrador.manana', b.manana, [['laborable', 'Laborable'], ['libre', 'Libre'], ['especial', 'Plan especial']])}</div>
      ${perfil.sigueCiclo ? `<div class="caja">${interruptor('borrador.regla', b.regla, esHoy ? 'Hoy ha empezado la regla' : 'Ese día empezó la regla')}</div>` : ''}
      <textarea class="caja" rows="2" maxlength="280" placeholder="Nota (opcional)" data-modelo="borrador.nota" aria-label="Nota">${esc(b.nota)}</textarea>
      ${b.orientativo ? '<p class="nota sin-margen">Apuntado de memoria: cuenta para los niveles y pesa la mitad en el pronóstico.</p>' : ''}`;
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">${b.animo ? 'Hecho' : 'Cerrar'}</button></div>
    <div class="hoja-cuerpo">
      <h2>${esHoy ? '¿Qué tiempo ha hecho hoy en casa?' : '¿Qué tiempo hizo en casa?'}</h2>
      <p class="fecha">${fechaLarga(b.dia)}</p>
      <div class="selector">
        <div class="fichas">${ORDEN_TIEMPOS.map((t) => `<button type="button" class="${b.animo === t ? 'on' : b.animo ? 'off' : ''}" style="--tinte:${TIEMPOS[t].tinte}" aria-label="${TIEMPOS[t].titulo}" aria-pressed="${b.animo === t}" data-accion="elegirTiempo" data-t="${t}">${ficha(t, 54)}</button>`).join('')}</div>
        <p class="${b.animo ? 'elegido' : ''}">${b.animo ? `${TIEMPOS[b.animo].titulo} · ${TIEMPOS[b.animo].desc} · guardado` : 'Toca el que más se parezca al día: se guarda al momento'}</p>
      </div>${masDatos}
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="cerrarHoja">${b.animo ? 'Hecho' : 'Ahora no'}</button></div>`;
}

/** Vuelca el borrador del registro en los datos reales. En modo demostración no se guarda nada. */
function guardaBorrador() {
  const b = ui.borrador;
  if (!b?.animo || demo) return;
  real.entradas[b.dia] = {
    animo: b.animo, sueno: b.sueno, estres: b.estres, juntos: b.juntos, manana: b.manana,
    etiquetas: ETIQUETAS.filter((e) => b.etiquetas.includes(e)), nota: b.nota.trim(), regla: b.regla, orientativo: b.orientativo,
  };
  if (b.regla && (!real.perfil.ultimaRegla || b.dia > real.perfil.ultimaRegla)) real.perfil.ultimaRegla = b.dia;
  if (!salva()) avisa('No se ha podido guardar en este navegador');
}

/** ¿Con este día se ha cerrado su semana (de lunes a domingo) o su mes? */
function cierres(dia) {
  const n = aNum(dia);
  const lunes = n - ((diaSemana(n) + 6) % 7);
  const [a, mes] = dia.split('-').map(Number);
  const diasMes = new Date(Date.UTC(a, mes, 0)).getUTCDate();
  const hay = (iso) => !!E().entradas[iso];
  return {
    semana: Array.from({ length: 7 }, (_, i) => aIso(lunes + i)).every(hay),
    mes: Array.from({ length: diasMes }, (_, i) => `${dia.slice(0, 8)}${String(i + 1).padStart(2, '0')}`).every(hay),
  };
}

// ---------- Recuperación de días sin parte ----------

function hojaRecuperar() {
  const h = ui.hoja;
  const hoy = hoyIso();
  const n = h.pendientes;
  const [titulo, sub] = n === 1
    ? ['Ayer se quedó sin parte', '¿Apuntamos los dos días de una vez?']
    : n <= 3
      ? [`Faltan ${n} días por apuntar`, 'Todos en una pantalla: un toque por día.']
      : ['Una semana sin partes', 'Rellénala a grandes rasgos: con lo que recuerdes basta.'];
  const fichas = (accion, dia, elegido) => `<div class="fichas mini">${ORDEN_TIEMPOS.map((t) =>
    `<button type="button" class="${elegido === t ? 'on' : elegido ? 'off' : ''}" style="--tinte:${TIEMPOS[t].tinte}" aria-label="${TIEMPOS[t].titulo}" aria-pressed="${elegido === t}" data-accion="${accion}" data-dia="${dia}" data-t="${t}">${ficha(t, 38)}</button>`).join('')}</div>`;
  const marcados = Object.keys(h.elegidos).length;
  return `<div class="hoja-cuerpo">
      <div class="reaccion">${avatarNimbo(40, stormyEspecial())}<p><strong>${titulo}.</strong> ${sub}</p></div>
      ${n >= 4 ? `<div class="fila-dia todos"><span>Toda la semana igual</span>${fichas('recuperaTodos', '', h.todos)}</div>` : ''}
      ${h.dias.map((d) => `<div class="fila-dia"><span>${d === hoy ? 'Hoy' : mayus(fecha(d, { weekday: 'short', day: 'numeric' }))}</span>${fichas('recuperaDia', d, h.elegidos[d])}</div>`).join('')}
      <p class="nota sin-margen">Los días apuntados de memoria se marcan como orientativos: cuentan para los niveles y pesan la mitad en el pronóstico.</p>
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="recuperaGuardar" ${marcados ? '' : 'disabled'}>${marcados ? `Guardar ${marcados === 1 ? '1 día' : `${marcados} días`}` : 'Elige al menos un día'}</button>
      <button class="secundario oscuro" data-accion="cerrarHoja">Ahora no</button></div>`;
}

/** Al abrir la app: si faltan días recientes, Stormy ofrece rellenarlos. Una vez al día; con más de una semana, calla. */
function ofreceRecuperacion() {
  const hoy = hoyIso();
  if (demo || !real.perfil.alta || ui.hoja || ui.recorrido != null || real.perfil.ofertaRecuperacion === hoy) return;
  const pendientes = diasPendientes(real, hoy);
  if (!pendientes.length) return;
  real.perfil.ofertaRecuperacion = hoy;
  salva();
  if (pendientes.length > 7) return;
  const dias = pendientes.length === 1 && !real.entradas[hoy] ? [...pendientes, hoy] : pendientes;
  abreHoja({ tipo: 'recuperar', dias, pendientes: pendientes.length, elegidos: {}, todos: null });
}

// ---------- Niveles: un camino de mundos ----------

function hojaNiveles() {
  const st = E();
  const dias = diasRegistrados();
  const extras = totalExtras(st);
  const conCiclo = st.perfil.sigueCiclo;
  const cara = avatarNimbo(34, stormyEspecial());
  const mundos = NIVELES.map((n, i) => {
    const sig = NIVELES[i + 1];
    const abierto = dias >= n.dias;
    const aqui = abierto && (!sig || dias < sig.dias);
    let piedras = '';
    if (sig) {
      for (let d = n.dias + 1; d < sig.dias; d++) {
        piedras += `<i class="${dias >= d ? 'hecha' : ''} ${dias === d ? 'aqui' : ''}">${dias === d ? cara : `<small>${d}</small>`}</i>`;
      }
    }
    return `<section class="mundo m${i} ${abierto ? 'abierto' : 'velado'} ${aqui ? 'actual' : ''}">
        <div class="mundo-cab">
          <span class="mundo-icono">${abierto ? ICONOS[n.icono] : ICONOS.candado}${aqui && dias === n.dias ? `<span class="aqui">${cara}</span>` : ''}</span>
          <div><small>${n.extra ? 'Mundo extra' : `Mundo ${i + 1}`} · ${n.dias === 0 ? 'inicio' : `día ${n.dias}`}</small><h3>${n.titulo}</h3></div>
          <b>${abierto ? ICONOS.visto : faltan(n.dias - dias)}</b>
        </div>
        <ul class="premios">${premioDe(n, conCiclo).split(' y ').map((x) => `<li>${ICONOS.destello}${mayus(x)}</li>`).join('')}</ul>
        ${piedras ? `<div class="piedras" aria-hidden="true">${piedras}</div>` : ''}
      </section>`;
  }).join('');
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Hecho</button></div>
    <div class="hoja-cuerpo">
      <h2>El camino de Stormy</h2>
      <p class="fecha">Cada día registrado es un paso. Sin castigos ni prisas: si un día se te pasa, el camino te espera donde lo dejaste.</p>
      <div class="marcador">
        <div><i class="acento">${ICONOS.llama}</i><b>${racha(Object.keys(st.entradas), hoyIso())}</b><small>de racha</small></div>
        <div><i class="mango">${ICONOS.rayo}</i><b>${rayosDeEstado(st)}</b><small>rayos</small></div>
        <div><i class="acento">${ICONOS.calendario}</i><b>${dias}</b><small>${dias === 1 ? 'día' : 'días'}</small></div>
      </div>
      <div class="camino" role="list" aria-label="Mundos: ${dias} días registrados">${mundos}</div>
      <div class="tarjeta"><h3>Rayos</h3>
        <p class="nota">Son solo parte del juego: ${RAYOS.parte} por cada parte, ${RAYOS.extra} por cada dato extra y ${RAYOS.semana} al completar cada bloque de 7 partes. De momento se acumulan y nada más; no cambian el pronóstico.</p></div>
      <div class="tarjeta"><div class="extra-cab"><h3>Datos extra</h3><span class="cifra-acento">${extras}</span></div>
        <p class="nota">La noche, el estrés, el tiempo juntos, las etiquetas y las notas. Cuantos más aportes, más factores puede explicar Stormy.</p>
        <div class="insignias">${INSIGNIAS.map(([umbral, nombre]) => `<div class="${extras >= umbral ? 'on' : ''}"><span>${extras >= umbral ? ICONOS.medalla : ICONOS.candado}</span><b>${nombre}</b><small>${umbral} datos</small></div>`).join('')}</div>
      </div>
    </div>`;
}

function hojaNivelNuevo() {
  const n = ui.hoja.nivel;
  return `<div class="hoja-cuerpo celebracion">
      <span class="insignia grande">${ICONOS[n.icono]}</span>
      <p class="rotulo">${n.extra ? '¡Mundo extra abierto!' : '¡Nivel desbloqueado!'}</p>
      <h2>${n.titulo}</h2>
      <p>Llevas ${n.dias} días registrados. Ahora tienes: ${premioDe(n, E().perfil.sigueCiclo).toLowerCase()}.</p>
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="cerrarHoja">Genial</button></div>`;
}

// ---------- Stormy, el ayudante ----------

const contextoNimbo = () => ({ motor: motor(), entradas: E().entradas, perfil: E().perfil, hoy: hoyIso(), rayos: rayosDeEstado(E()) });

function hojaNimbo() {
  const especial = stormyEspecial();
  const mensajes = ui.chat
    .map((m) => `<div class="burbuja ${m.de}">${m.de === 'nimbo' ? avatarNimbo(30, especial) : ''}<p>${esc(m.texto)}</p></div>`)
    .join('');
  const pensando = ui.pensando ? `<div class="burbuja nimbo">${avatarNimbo(30, especial)}<p class="puntos-pensando" aria-label="Stormy está escribiendo"><i></i><i></i><i></i></p></div>` : '';
  return `<div class="hoja-cab nimbo-cab">${avatarNimbo(44, especial)}<div><h3>${NIMBO.nombre}</h3><p>${NIMBO.cargo}</p></div><button class="texto-boton" data-accion="cerrarHoja">Cerrar</button></div>
    <div class="hoja-cuerpo chat" role="log" aria-live="polite">${mensajes}${pensando}</div>
    <div class="hoja-pie nimbo-pie">
      <div class="sugerencias">${sugerenciasDe(E().perfil).map((s) => `<button type="button" class="opcion" data-accion="preguntar" data-q="${esc(s)}">${s}</button>`).join('')}</div>
      <form id="form-nimbo" autocomplete="off"><input type="text" id="pregunta" placeholder="Pregúntale a Stormy" enterkeyhint="send" maxlength="140" aria-label="Tu pregunta para Stormy"><button type="submit" class="enviar" aria-label="Enviar">${ICONOS.subir}</button></form>
    </div>`;
}

function preguntaANimbo(texto) {
  const pregunta = texto.trim();
  if (!pregunta || ui.pensando) return;
  const teniaFoco = document.activeElement?.id === 'pregunta';
  ui.chat.push({ de: 'yo', texto: pregunta });
  ui.pensando = true;
  pintaHoja();
  if (teniaFoco) $('#pregunta')?.focus();
  setTimeout(() => {
    const turno = ui.chat.filter((m) => m.de === 'yo').length;
    ui.chat.push({ de: 'nimbo', texto: responder(pregunta, contextoNimbo(), turno).texto });
    ui.pensando = false;
    if (ui.hoja?.tipo !== 'nimbo') return;
    const foco = document.activeElement?.id === 'pregunta';
    const escrito = $('#pregunta')?.value ?? '';
    pintaHoja();
    if ($('#pregunta')) $('#pregunta').value = escrito;
    if (foco) $('#pregunta')?.focus();
  }, 450);
}

function hojaConfirmar() {
  const c = ui.hoja;
  return `<div class="hoja-cuerpo celebracion"><h2>${c.titulo}</h2><p>${c.texto}</p></div>
    <div class="hoja-pie"><button class="principal ${c.suave ? '' : 'peligro'}" data-accion="${c.accion}">${c.boton}</button><button class="secundario oscuro" data-accion="${c.accion2 ?? 'cerrarHoja'}">${c.cancelar ?? 'Cancelar'}</button></div>`;
}

function hojaTexto() {
  const c = ui.hoja;
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Hecho</button></div>
    <div class="hoja-cuerpo"><h2>${c.titulo}</h2>${c.bloques.map(([t, x]) => `<div class="tarjeta"><h3>${t}</h3><p class="nota">${x}</p></div>`).join('')}</div>`;
}

function hojaCodigo() {
  const ver = ui.hoja.modo === 'ver';
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Cerrar</button></div>
    <div class="hoja-cuerpo">
      <h2>${ver ? 'Código de traspaso' : 'Tengo un código'}</h2>
      <p class="fecha">${ver
        ? 'Son tus datos convertidos en texto. Cópialo, envíatelo como prefieras y pégalo en Stormy en el otro móvil (Ajustes → «Tengo un código de traspaso»). No pasa por ningún servidor de Stormy.'
        : 'Pega aquí el código que copiaste en el otro móvil.'}</p>
      <textarea class="caja codigo" id="codigo" rows="6" ${ver ? 'readonly' : 'placeholder="STORMY1.…"'} aria-label="Código de traspaso" autocomplete="off" autocapitalize="off" spellcheck="false">${ver ? esc(aCodigo(real)) : ''}</textarea>
      ${ver ? '<p class="nota sin-margen">Incluye todo lo apuntado, también el ciclo si está activado. Trátalo como algo privado.</p>' : ''}
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="${ver ? 'copiarCodigo' : 'usarCodigo'}">${ver ? 'Copiar código' : 'Recuperar datos'}</button></div>`;
}

function hojaAviso() {
  const permiso = ui.hoja.permiso;
  const estado = permiso === 'granted'
    ? 'Permiso de avisos concedido.'
    : permiso === 'denied'
      ? 'No has dado permiso para los avisos; no pasa nada.'
      : `Este navegador no admite avisos${esIOS() && !enPantallaDeInicio() ? ' (en iPhone hace falta instalar antes Stormy en la pantalla de inicio)' : ''}.`;
  return `<div class="hoja-cuerpo celebracion">
      <span class="insignia grande">${ICONOS.campana}</span>
      <h2>Falta la alarma</h2>
      <p>${estado} Por ahora Stormy no puede enviarte el aviso diario por su cuenta: el recordatorio va por tu calendario, con una alarma a las ${esc(real.perfil.horaAviso)} y un enlace que abre el registro.</p>
      <p><strong>${TEXTOS_AVISO.web.paso}</strong></p>
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="recordatorio" data-cierra="1">Añadir alarma al calendario</button><button class="secundario oscuro" data-accion="cerrarHoja">Ahora no</button></div>`;
}

// ---------- Calendario ----------

function vistaCalendario() {
  const st = E();
  const hoy = hoyIso();
  const m = motor();
  if (ui.mes > mesMaximo()) ui.mes = hoy.slice(0, 7);
  const [a, mes] = ui.mes.split('-').map(Number);
  const primero = `${ui.mes}-01`;
  const n0 = aNum(primero);
  const numDias = new Date(Date.UTC(a, mes, 0)).getUTCDate();
  const hueco = (diaSemana(n0) + 6) % 7;
  const sigue = st.perfil.sigueCiclo;
  const enUltimoMes = ui.mes >= mesMaximo();
  const esFuturo = ui.mes > hoy.slice(0, 7);
  const registradas = new Set(reglasDe(st));
  // Animaciones del último parte: solo cuando el calendario está a la vista, sin hoja encima.
  const recien = ui.hoja ? null : ui.recien;
  const lunesRecien = recien?.semana ? aNum(recien.dia) - ((diaSemana(aNum(recien.dia)) + 6) % 7) : null;

  let celdas = '<i></i>'.repeat(hueco);
  const delMes = [];
  let orientativos = 0;
  for (let i = 0; i < numDias; i++) {
    const iso = aIso(n0 + i);
    const e = st.entradas[iso];
    if (e) delMes.push(e);
    if (e?.orientativo) orientativos++;
    const futuro = iso > hoy;
    const regla = sigue ? marcaRegla(m, iso, registradas) : null;
    const luz = lunesRecien != null && n0 + i >= lunesRecien && n0 + i < lunesRecien + 7;
    celdas += `<button type="button" class="dia ${iso === hoy ? 'es-hoy' : ''} ${futuro ? 'futuro' : ''} ${e?.orientativo ? 'orientativo' : ''} ${recien?.dia === iso ? 'recien' : ''} ${luz ? 'fila-luz' : ''} ${regla ? `regla-${regla}` : ''}" ${futuro ? 'disabled' : ''} data-accion="abrirRegistro" data-dia="${iso}"
      aria-label="${fecha(iso, { day: 'numeric', month: 'long' })}: ${e ? `${TIEMPOS[e.animo].titulo}${e.orientativo ? ', apuntado de memoria' : ''}` : futuro ? 'día futuro' : 'sin registrar'}${regla ? `, regla ${regla}` : ''}">
      <span>${i + 1}</span>${e ? ficha(e.animo, 34) : `<span class="vacio">${iso === hoy ? ICONOS.mas : ''}</span>`}</button>`;
  }

  // Mes de ejemplo: se ve solo mientras se mantiene pulsado el botón. No guarda nada.
  const dem = Object.values(ejemplo(30, st.perfil).entradas);
  const HITOS = { 7: 1, 14: 2, 21: 3, 30: 4 };
  const celdasEjemplo = dem.map((e, i) => `<span class="dia ${HITOS[i + 1] ? 'hito' : ''}"><span>${i + 1}</span>${ficha(e.animo, 34)}</span>`).join('');
  const hitos = Object.entries(HITOS).map(([d, n]) => `<li><b>Día ${d}</b>${premioDe(NIVELES[n], sigue)}</li>`).join('');

  let resumen;
  if (!delMes.length) {
    resumen = `<p class="nota">${esFuturo ? 'Mes por llegar: solo se ve la regla que estima Stormy.' : 'Aún no hay partes este mes. Toca un día para registrarlo.'}</p>`;
  } else {
    const med = delMes.reduce((s, e) => s + e.animo, 0) / delMes.length;
    resumen = `<p class="nota">${delMes.length} ${delMes.length === 1 ? 'parte' : 'partes'} · clima medio: ${TIEMPOS[tiempoDe(med)].titulo.toLowerCase()}${delMes.length === numDias ? ' · mes completo' : ''}</p>
      <div class="recuento">${ORDEN_TIEMPOS.map((t) => `<div>${ficha(t, 34)}<b>${delMes.filter((e) => e.animo === t).length}</b></div>`).join('')}</div>`;
  }

  return `<main class="pagina">
    <h1>Calendario</h1>
    ${recien?.mes ? `<div class="mes-completo" role="status"><i></i><i></i><i></i><i></i><i></i><i></i><strong>¡Mes completo!</strong><span>Ni un día sin parte. Stormy se quita el sombrero.</span></div>` : ''}
    <button type="button" class="mantener" data-mantener aria-pressed="false">${ICONOS.ojo}<span>Ver un mes completo</span><small>mantén pulsado</small></button>
    <article class="tarjeta cal">
      <div class="cal-real">
        <div class="mes-cab">
          <button type="button" data-accion="mes" data-d="-1" aria-label="Mes anterior">${ICONOS.izquierda}</button>
          <h3>${mayus(fecha(primero, { month: 'long', year: 'numeric' }))}</h3>
          <button type="button" data-accion="mes" data-d="1" aria-label="Mes siguiente" ${enUltimoMes ? 'disabled' : ''}>${ICONOS.derecha}</button>
        </div>
        ${sigue ? '<p class="leyenda-regla"><span><i class="muestra-regla registrada"></i>Regla apuntada</span><span><i class="muestra-regla estimada"></i>Regla estimada</span></p>' : ''}
        <div class="rejilla cab">${SEMANA.orden.map((d) => `<span>${SEMANA.inicial[d]}</span>`).join('')}</div>
        <div class="rejilla">${celdas}</div>
      </div>
      <div class="cal-ejemplo" aria-hidden="true">
        <div class="mes-cab"><h3>Un mes completo</h3><span class="etiqueta-ejemplo">Vista de ejemplo</span></div>
        <div class="rejilla">${celdasEjemplo}</div>
        <ul class="hitos">${hitos}</ul>
      </div>
    </article>
    ${tarjeta(`<h3>Resumen del mes</h3>${resumen}`)}
    ${orientativos ? '<p class="leyenda"><span><i class="marca-orientativo"></i> Apuntado de memoria</span></p>' : ''}
  </main>`;
}

/** Con el ciclo activado se puede avanzar tres meses para ver las próximas reglas estimadas. */
function mesMaximo() {
  const [a, m] = hoyIso().split('-').map(Number);
  return new Date(Date.UTC(a, m - 1 + (E().perfil.sigueCiclo ? 3 : 0), 1)).toISOString().slice(0, 7);
}

// ---------- Descubrimientos ----------

const temasDe = (perfil) => [
  { id: 'historico', titulo: 'Histórico', icono: 'historia', dias: 2 },
  { id: 'semanal', titulo: 'Patrón semanal', icono: 'semana', dias: 7 },
  { id: 'factores', titulo: 'Factores', icono: 'factores', dias: 14 },
  perfil.sigueCiclo
    ? { id: 'ciclo', titulo: 'Mapa del ciclo', icono: 'ciclo', dias: 21 }
    : { id: 'detalle', titulo: 'Factores en detalle', icono: 'ojo', dias: 21 },
  { id: 'precision', titulo: 'Precisión', icono: 'diana', dias: 30 },
  { id: 'semanas', titulo: 'Comparar semanas', icono: 'comparar', dias: 40 },
  { id: 'resumen', titulo: 'Resumen de la casa', icono: 'resumen', dias: 50 },
];
/** Las dos secciones fijas de arriba: siempre abiertas, no dependen de los días registrados. */
const ESPECIALES = { conoce: { id: 'conoce', titulo: 'Conoce el ciclo', dias: 0 }, horoscopo: { id: 'horoscopo', titulo: 'Tu horóscopo', dias: 0 } };

// ---------- Rueda del ciclo ----------

/** Tramos de días de cada fase para un ciclo de `L` días: [{id, desde, hasta}]. */
function tramosCiclo(L) {
  const tramos = [];
  for (let d = 1; d <= L; d++) {
    const f = faseDe(d, L);
    if (tramos.at(-1)?.id === f) tramos.at(-1).hasta = d;
    else tramos.push({ id: f, desde: d, hasta: d });
  }
  return tramos;
}

const polar = (c, r, ang) => [c + r * Math.cos(ang), c + r * Math.sin(ang)];
function sectorAnillo(c, r1, r2, a1, a2) {
  const [x1, y1] = polar(c, r2, a1), [x2, y2] = polar(c, r2, a2), [x3, y3] = polar(c, r1, a2), [x4, y4] = polar(c, r1, a1);
  const grande = a2 - a1 > Math.PI ? 1 : 0;
  const f = (v) => v.toFixed(2);
  return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 ${grande} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 ${grande} 0 ${f(x4)} ${f(y4)}Z`;
}

/** Rueda de fases. Con `interactiva`, cada fase es un botón que abre su explicación. */
function ruedaCiclo(m, lado, { interactiva = false, elegida = null } = {}) {
  const L = m.duracion;
  const hoyDia = m.diaCiclo(hoyIso());
  const c = 100;
  const paso = (2 * Math.PI) / L;
  const inicio = -Math.PI / 2;
  const sectores = tramosCiclo(L).map((t) => {
    const fase = FASES.find((f) => f.id === t.id);
    const d = sectorAnillo(c, 60, 94, inicio + (t.desde - 1) * paso + 0.012, inicio + t.hasta * paso - 0.012);
    const etiqueta = `${fase.titulo}, días ${t.desde} a ${t.hasta}`;
    return interactiva
      ? `<path d="${d}" fill="${FASES_INFO[t.id].color}" class="sector ${elegida === t.id ? 'elegido' : ''}" role="button" tabindex="0" aria-label="${etiqueta}. Ver explicación" data-accion="faseCiclo" data-id="${t.id}"/>`
      : `<path d="${d}" fill="${FASES_INFO[t.id].color}"/>`;
  }).join('');
  let marca = '';
  if (hoyDia) {
    const [x, y] = polar(c, 77, inicio + (hoyDia - 0.5) * paso);
    marca = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#fff" stroke="#1E2749" stroke-width="4"/>`;
  }
  const centro = interactiva
    ? `<text x="100" y="${hoyDia ? 94 : 104}" class="rueda-grande">${hoyDia ? `Día ${hoyDia}` : `${L} días`}</text>${hoyDia ? `<text x="100" y="118" class="rueda-chica">de ${L}</text>` : ''}`
    : '';
  return `<svg class="rueda" viewBox="0 0 200 200" width="${lado}" height="${lado}" ${interactiva ? 'role="group" aria-label="Fases del ciclo"' : 'aria-hidden="true"'}>${sectores}${marca}${centro}</svg>`;
}

function vistaDescubrimientos() {
  const st = E();
  const dias = diasRegistrados();
  const perfil = st.perfil;
  const circulos = temasDe(perfil).map((t) => {
    const abierto = dias >= t.dias;
    return `<button type="button" class="circulo ${abierto ? 'abierto' : 'cerrado'}" data-accion="abrirTema" data-id="${t.id}"
      aria-label="${t.titulo}: ${abierto ? 'disponible' : `se desbloquea con ${t.dias} días, ${faltan(t.dias - dias).toLowerCase()}. Abre una vista de ejemplo`}">
      ${anillo(dias / t.dias, ICONOS[t.icono], 64, 5)}
      <strong>${t.titulo}</strong><small>${abierto ? 'Abierto' : faltan(t.dias - dias)}</small></button>`;
  }).join('');
  const m = motor();
  const hoyDia = m.diaCiclo(hoyIso());
  const faseHoy = hoyDia ? FASES.find((f) => f.id === m.fase(hoyIso())) : null;
  const s = perfil.nacimiento ? signo(perfil.nacimiento) : null;
  const luna = faseLunar(hoyIso());
  // «Conoce el ciclo» está siempre: con el ciclo activado, personalizado; sin él, la versión general.
  const tc = textosConoceCiclo(perfil.sigueCiclo, faseHoy?.titulo ?? null);
  const ciclo = `<button type="button" class="destacada ciclo-card ${tc.personal ? '' : 'general'}" data-accion="abrirTema" data-id="conoce">
      ${ruedaCiclo(m, 58)}<span><strong>Conoce el ciclo</strong><small>${tc.sub}</small></span></button>`;
  const horoscopoCard = `<button type="button" class="destacada horoscopo-card" data-accion="abrirTema" data-id="horoscopo">
      <span class="signo-grande" aria-hidden="true">${s ? s.emoji : lunaSVG(luna, 52)}</span><span><strong>Tu horóscopo</strong><small>${s ? `${s.nombre} · ${luna.nombre.toLowerCase()}` : 'Añádelo con una fecha'}</small></span></button>`;
  return `<main class="pagina descubrimientos">
    <h1>Descubrimientos</h1>
    <div class="destacadas">${ciclo}${horoscopoCard}</div>
    <h2 class="seccion">Lo que Stormy aprende de vuestra casa</h2>
    <div class="circulos">${circulos}</div>
    <p class="aviso">Los patrones salen solo de vuestros registros. Con pocos días son orientativos.</p>
  </main>`;
}

function hojaTema() {
  const st = E();
  const id = ui.hoja.id;
  const tema = ESPECIALES[id] ?? temasDe({ sigueCiclo: true }).concat(temasDe({ sigueCiclo: false })).find((t) => t.id === id);
  const dias = diasRegistrados();
  const abierto = dias >= tema.dias;
  const fuente = abierto ? st : muestra();
  const m = abierto ? motor() : motorDe(fuente);
  const cuerpo = {
    historico: () => historico(fuente),
    semanal: () => patronSemanal(m),
    factores: () => factores(m, 6),
    detalle: () => factores(m, 20) + automaticos(m),
    ciclo: () => mapaCiclo(m),
    precision: () => precision(m),
    semanas: () => semanas(m),
    resumen: () => resumenCasa(m, fuente, abierto),
    horoscopo: () => horoscopo(st),
    conoce: () => conoceCiclo(m),
  }[tema.id]();
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Hecho</button></div>
    <div class="hoja-cuerpo">
      <h2>${tema.titulo}</h2>
      ${abierto ? '' : `<p class="fecha"><span class="etiqueta-ejemplo">Vista de ejemplo</span> Se desbloquea con ${tema.dias} días registrados: ${faltan(tema.dias - dias).toLowerCase()}. Así se verá con vuestros partes.</p>`}
      ${cuerpo}
    </div>`;
}

function historico(st) {
  const ultimas = Object.entries(st.entradas).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-30);
  const n = ultimas.length;
  let cuerpo;
  if (n < 2) {
    cuerpo = '<p class="nota">Registra al menos dos días para ver la evolución.</p>';
  } else {
    const W = 300, H = 150;
    const x = (i) => 8 + (i * (W - 16)) / (n - 1);
    const y = (a) => H - 15 - (a - 1) * 30;
    const puntos = ultimas.map(([, e], i) => `${x(i).toFixed(1)},${y(e.animo)}`).join(' ');
    cuerpo = `<div class="grafico">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de la evolución del tiempo en casa">
          ${[1, 2, 3, 4, 5].map((a) => `<line class="guia" x1="0" x2="${W}" y1="${y(a)}" y2="${y(a)}"/>`).join('')}
          <polyline class="linea-graf" points="${puntos}"/>
        </svg>
        <div class="puntos">${ultimas.map(([, e], i) => `<i style="left:${(x(i) / W) * 100}%;top:${(y(e.animo) / H) * 100}%;background:${TIEMPOS[e.animo].tinte}"></i>`).join('')}</div>
        <div class="eje">${ORDEN_TIEMPOS.map((t) => ficha(t, 20)).join('')}</div>
      </div>
      <div class="eje-x"><span>${fecha(ultimas[0][0], { day: 'numeric', month: 'short' })}</span><span>${fecha(ultimas[n - 1][0], { day: 'numeric', month: 'short' })}</span></div>`;
  }
  const sub = n === 0 ? 'Aún sin partes' : n === 1 ? 'El último parte' : `Los últimos ${n} partes`;
  return tarjeta(encabezado('historia', 'Histórico', sub) + cuerpo);
}

function patronSemanal(m) {
  const medias = m.mediasPorDiaSemana();
  const con = medias.filter((x) => x.dias > 0);
  const mejor = con.reduce((a, b) => (b.media > a.media ? b : a), con[0]);
  const peor = con.reduce((a, b) => (b.media < a.media ? b : a), con[0]);
  return tarjeta(`${encabezado('semana', 'Patrón semanal', 'Tiempo medio por día de la semana')}
    <div class="barras">${medias.map((x) => `<div><span class="col"><i style="height:${x.dias ? (x.media / 5) * 100 : 0}%;background:${TIEMPOS[tiempoDe(x.media || 3)].tinte}"></i></span><small>${x.titulo}</small></div>`).join('')}</div>
    ${mejor && peor && mejor.id !== peor.id ? `<p class="texto-normal">El mejor día suelen ser los <strong>${SEMANA.plural[mejor.id]}</strong>; los más cubiertos, los <strong>${SEMANA.plural[peor.id]}</strong>.</p>` : ''}`);
}

const filaFactor = (f) =>
  `<div class="factor"><span class="${f.delta >= 0 ? 'sube' : 'baja'}">${f.delta >= 0 ? '↗' : '↘'}</span><div><strong>${esc(f.titulo)}</strong><small>${f.dias} días</small></div><b>${f.delta >= 0 ? '+' : '−'}${num(Math.abs(f.delta))}</b></div>`;

function factores(m, cuantos) {
  const lista = m.factores().slice(0, cuantos);
  const cuerpo = lista.length
    ? `${lista.map(filaFactor).join('')}
       <p class="mini">En niveles de tiempo (de 1 a 5). Son coincidencias observadas, no causas demostradas.</p>`
    : '<p class="nota">Añade datos extra (la noche, el estrés, el tiempo juntos, etiquetas) al registrar y aquí verás qué mueve el clima de casa.</p>';
  return tarjeta(encabezado('factores', 'Factores que influyen', 'Diferencia frente a un día normal') + cuerpo);
}

/** Luna, luz, estación y día de la semana: solo se enseñan los que marcan diferencia en los datos de la casa. */
function automaticos(m) {
  const vistos = m.automaticos().filter((f) => f.visible);
  const cuerpo = vistos.length
    ? `${vistos.map(filaFactor).join('')}<p class="mini">Stormy los calcula solo a partir de la fecha. No entran en el pronóstico: son coincidencias, no causas.</p>`
    : '<p class="nota">Stormy mira también la fase de la luna, las horas de luz, la estación y si es fin de semana. Con vuestros partes, de momento ninguno marca una diferencia que merezca enseñarse.</p>';
  return tarjeta(encabezado('luna', 'Sin apuntar nada', 'Luna, horas de luz, estación y día de la semana') + cuerpo);
}

function mapaCiclo(m) {
  const fases = m.mediasPorFase();
  const cuerpo = fases.length
    ? `${fases.map((f) => `<div class="factor">${f.dias ? ficha(tiempoDe(f.media), 38) : '<span class="ficha-vacia"></span>'}<div><strong>${f.titulo}</strong><small>${f.dias ? `${TIEMPOS[tiempoDe(f.media)].titulo} · ${f.dias} días` : 'Sin datos todavía'}</small></div>${f.dias ? `<b>${num(f.media)}</b>` : ''}</div>`).join('')}
       <p class="mini">Ciclo de ${m.duracion} días. Es el tiempo medio en casa en cada fase, no una regla sobre nadie; con un solo mes es una primera foto.</p>`
    : '<p class="nota">El ciclo menstrual se puede añadir en Ajustes, si lo veis necesario.</p>';
  return tarjeta(encabezado('ciclo', 'Mapa del ciclo', 'Tiempo medio en casa en cada fase') + cuerpo);
}

function precision(m) {
  const p = m.precision();
  if (!p) return tarjeta('<p class="nota sin-margen">Hace falta al menos una semana de partes.</p>');
  return tarjeta(`${encabezado('diana', 'Precisión de Stormy', 'Comprobada contra vuestros propios registros')}
    <div class="cifras"><div><b>${pct(p.exacto)}</b><small>acierto exacto</small></div><div><b>${pct(p.cercano)}</b><small>acierta o roza</small></div><div><b>${num(p.error)}</b><small>desvío medio</small></div></div>
    <p class="mini">Para cada uno de los ${p.dias} días, Stormy lo predice sin mirar ese día y se compara con lo que registraste. «Roza» significa fallar por un solo nivel.</p>`);
}

function semanas(m) {
  const lista = m.mediasPorSemana(6);
  if (lista.length < 2) return tarjeta('<p class="nota sin-margen">Hacen falta al menos dos semanas con partes para compararlas.</p>');
  const ultima = lista[lista.length - 1];
  const previa = lista[lista.length - 2];
  const d = ultima.media - previa.media;
  return tarjeta(`${encabezado('comparar', 'Comparar semanas', 'Tiempo medio de las últimas semanas')}
    <div class="barras">${lista.map((s) => `<div><span class="col"><i style="height:${(s.media / 5) * 100}%;background:${TIEMPOS[tiempoDe(s.media)].tinte}"></i></span><small>${fecha(s.lunes, { day: 'numeric', month: 'short' })}</small></div>`).join('')}</div>
    <p class="texto-normal">${Math.abs(d) < 0.15 ? 'Esta semana va <strong>muy parecida</strong> a la anterior.' : `Esta semana va <strong>${d > 0 ? 'más despejada' : 'más cubierta'}</strong> que la anterior (${d > 0 ? '+' : '−'}${num(Math.abs(d))}).`}</p>
    <p class="mini">Cada barra es la media de los partes de esa semana, de lunes a domingo. La semana en curso puede estar incompleta.</p>`);
}

function textoResumen(m, st) {
  const con = m.mediasPorDiaSemana().filter((x) => x.dias > 0);
  const mejor = con.reduce((a, b) => (b.media > a.media ? b : a), con[0]);
  return `${casaDe(st.perfil)}: ${m.dias} partes, clima medio de ${TIEMPOS[tiempoDe(m.mediaGeneral ?? 3)].titulo.toLowerCase()}${mejor ? `, los ${SEMANA.plural[mejor.id]} como mejor día` : ''} y ${rayosDeEstado(st)} rayos. Lo firma Stormy.`;
}

function resumenCasa(m, st, abierto) {
  return tarjeta(`${encabezado('resumen', 'Resumen de la casa', 'Para enseñarlo o compartirlo')}
    <div class="resumen-casa">${avatarNimbo(64, true)}<p>${esc(textoResumen(m, st))}</p></div>
    ${abierto ? `<button type="button" class="principal" data-accion="compartirResumen">${ICONOS.compartir}<span>Compartir resumen</span></button>` : ''}
    <p class="mini">Con este mundo Stormy estrena corona. El resumen solo sale del móvil si lo compartes tú.</p>`);
}

const ICONOS_DETRAS = ['luna', 'libro', 'diana'];
const desplegable = (titulo, html, { icono = null, abierto = false, id = '' } = {}) =>
  `<details class="desplegable" ${abierto ? 'open' : ''} ${id ? `id="${id}"` : ''}><summary>${icono ? `<span class="marca">${ICONOS[icono]}</span>` : ''}<span>${titulo}</span><i aria-hidden="true">${ICONOS.derecha}</i></summary><div class="desplegable-cuerpo">${html}</div></details>`;

function horoscopo(st) {
  const perfil = st.perfil;
  const hoy = hoyIso();
  const luna = faseLunar(hoy);
  const detras = `<h3 class="subtitulo">Qué hay detrás</h3>
    ${HOROSCOPO_DETRAS.map(([t, x], i) => desplegable(t, `<p>${x}</p>`, { icono: ICONOS_DETRAS[i] })).join('')}
    ${desplegable('Fuentes', fuentes(HOROSCOPO_DETRAS.flatMap(([, , f]) => f)), { icono: 'libro' })}`;
  const lunaHoy = `<div class="tarjeta luna-hoy">${lunaSVG(luna, 84)}<div><p class="sobre">La luna de hoy (dato real)</p><h3>${luna.nombre}</h3>
      <p class="nota sin-margen">Iluminada al ${Math.round(luna.iluminada * 100)} % (aprox.) · <a href="${ENLACE_LUNA}" target="_blank" rel="noopener noreferrer">Compruébalo</a></p></div></div>`;
  if (!perfil.nacimiento) {
    return `${tarjeta(`<p class="texto">¿Aciertan los astros? Quién sabe. Stormy los consulta por si acaso.</p>
      <label class="linea"><span>Fecha de nacimiento</span><input type="date" id="nacimiento-nuevo" value="1992-06-15" max="${hoy}"></label>
      <button type="button" class="principal con-margen" data-accion="guardarNacimiento">Añadir horóscopo</button>
      <p class="mini">Es un juego: no es una predicción fiable y no entra en el pronóstico.</p>`)}
      ${lunaHoy}${detras}`;
  }
  const h = horoscopoDe(perfil.nacimiento, hoy, luna);
  return `<div class="signo-card"><span class="simbolo" aria-hidden="true">${h.signo.emoji}</span><div><h3>${h.signo.nombre}</h3><p>${h.signo.fechas} · signo de ${h.signo.elemento}</p></div></div>
    ${lunaHoy}
    <blockquote class="frase-dia"><p class="sobre">La frase de Stormy para hoy</p><p>${h.frase}</p></blockquote>
    <p class="mini centro">Es un juego de Stormy, no una predicción fiable. No entra en el pronóstico.</p>
    ${detras}`;
}

/** Esquema de hormonas a lo largo de un ciclo de 28 días de ejemplo, con la fase de hoy resaltada. */
function graficoHormonas(faseHoy) {
  const W = 320, H = 150, abajo = 128;
  const x = (v) => 8 + v * (W - 16);
  const y = (v) => abajo - v * 108;
  const bandas = tramosCiclo(28).map((t) => `<rect x="${x((t.desde - 1) / 28).toFixed(1)}" y="14" width="${(((t.hasta - t.desde + 1) / 28) * (W - 16)).toFixed(1)}" height="${abajo - 14}" fill="${FASES_INFO[t.id].color}" opacity="${t.id === faseHoy ? 0.75 : 0.22}"/>`).join('');
  const curvas = HORMONAS.map((h) => {
    const pts = Array.from({ length: 81 }, (_, i) => `${x(i / 80).toFixed(1)},${y(h.valor(i / 80)).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${h.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');
  const ejes = [[1, 'start'], [14, 'middle'], [28, 'end']].map(([d, ancla]) => `<text x="${x((d - 1) / 27).toFixed(1)}" y="${H - 6}" class="eje-txt" text-anchor="${ancla}">día ${d}</text>`).join('');
  return `<div class="tarjeta hormonas"><h3>Cómo cambian las hormonas</h3>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Esquema aproximado de estrógenos, progesterona, LH y FSH a lo largo de un ciclo de 28 días">${bandas}${curvas}${ejes}</svg>
    <p class="leyenda-hormonas">${HORMONAS.map((h) => `<span><i style="background:${h.color}"></i>${h.nombre}</span>`).join('')}</p>
    <p class="mini">Esquema aproximado de un ciclo de 28 días: indica cuándo sube y baja cada hormona, no cantidades reales.${faseHoy ? ' La franja marcada es la fase de hoy.' : ''}</p></div>`;
}

/** «Conoce el ciclo»: rueda de fases, esquema de hormonas y un desplegable por fase. Tono formal y fuentes al pie. */
function conoceCiclo(m) {
  const faseHoy = m.fase(hoyIso());
  const elegida = ui.hoja.fase ?? faseHoy;
  const L = m.duracion;
  const tramos = tramosCiclo(L);
  const parte = (icono, titulo, texto) => `<div class="parte"><span class="marca">${ICONOS[icono]}</span><div><strong>${titulo}</strong><p>${texto}</p></div></div>`;
  const fases = FASES.map((f) => {
    const info = FASES_INFO[f.id];
    const t = tramos.find((x) => x.id === f.id);
    const dias = t ? ` · días ${t.desde}–${t.hasta}` : '';
    return desplegable(`<i class="punto" style="background:${info.color}"></i>${f.titulo}${f.id === faseHoy ? ' <small class="hoy-chip">hoy</small>' : ''}<small>${dias}</small>`,
      parte('libro', 'Qué es', info.que) + parte('calendario', 'Cuánto dura', info.dura) + parte('ciclo', 'Qué pasa en el cuerpo', info.cuerpo)
      + parte('personas', 'Cada persona lo vive de forma distinta', info.distinto ?? CADA_PERSONA),
      { abierto: f.id === elegida, id: `fase-${f.id}` });
  }).join('');
  const [, , fuentesConsulta] = FICHAS_CICLO[FICHAS_CICLO.length - 1];
  const todas = [...new Map([...FASES.flatMap((f) => FASES_INFO[f.id].fuentes), ...fuentesConsulta].map((x) => [x[1], x])).values()];
  return `<p class="aviso-sanitario">${AVISO_CICLO}</p>
    <div class="tarjeta rueda-tarjeta">${ruedaCiclo(m, 220, { interactiva: true, elegida })}
      <p class="mini centro">Ciclo de ${L} días${m.sigueCiclo ? '' : ' de ejemplo'}. Toca una fase para ver su explicación.${m.diaCiclo(hoyIso()) ? ' El círculo blanco marca hoy (estimado).' : ''}</p></div>
    ${graficoHormonas(faseHoy)}
    <h3 class="subtitulo">Fase a fase</h3>
    ${fases}
    ${desplegable(FICHAS_CICLO[FICHAS_CICLO.length - 1][0], `<p>${FICHAS_CICLO[FICHAS_CICLO.length - 1][1]}</p>`, { icono: 'gota' })}
    ${desplegable('Fuentes', fuentes(todas), { icono: 'libro' })}
    ${textosConoceCiclo(E().perfil.sigueCiclo).nota ? `<p class="mini centro">${textosConoceCiclo(E().perfil.sigueCiclo).nota}</p>` : ''}
    <p class="aviso-sanitario">${AVISO_CICLO}</p>`;
}

// ---------- Ajustes ----------

function vistaAjustes() {
  const p = E().perfil;
  let instalar = '';
  if (!enPantallaDeInicio() && !NATIVO) {
    instalar = `<h2 class="seccion">Instalar</h2><div class="tarjeta lista">${
      ui.instalar
        ? '<button type="button" class="enlace" data-accion="instalar">Instalar en este dispositivo</button>'
        : `<p class="nota">${esIOS()
            ? enAppAjena()
              ? 'Ábrelo en Safari: desde dentro de otra app no se puede instalar.'
              : 'En Safari, toca el botón Compartir y elige «Añadir a pantalla de inicio». Se abrirá como una app y funcionará sin conexión.'
            : 'En el menú del navegador, elige «Instalar aplicación» o «Añadir a pantalla de inicio». Funcionará sin conexión.'}</p>`
    }</div>`;
  }
  return `<main class="pagina">
    <h1>Ajustes</h1>
    <h2 class="seccion">¿Con quién vives?</h2>
    <div class="tarjeta lista">
      <div class="bloque">${eleccion('perfil.relacion', p.relacion, RELACIONES)}
        ${p.relacion === 'familia' ? eleccion('perfil.parentesco', p.parentesco, PARENTESCOS, 'chips con-margen') : ''}</div>
      <label class="linea"><span>¿Cómo le llamas en casa?</span><input type="text" data-modelo="perfil.apodo" value="${esc(p.apodo)}" placeholder="Mote" autocomplete="off" maxlength="30"></label>
      <label class="linea"><span>¿Y a ti cómo te llaman?</span><input type="text" data-modelo="perfil.miApodo" value="${esc(p.miApodo)}" placeholder="Tu mote" autocomplete="off" maxlength="30"></label>
      ${interruptor('perfil.conNacimiento', !!p.nacimiento, 'Su fecha de nacimiento (horóscopo)')}
      ${p.nacimiento ? `<label class="linea"><span>Nacimiento</span><input type="date" data-modelo="perfil.nacimiento" value="${p.nacimiento}" max="${hoyIso()}"></label>` : ''}
    </div>
    <p class="pie-seccion">Mejor un mote que el nombre real. La relación cambia los textos y los consejos, no el cálculo.</p>
    <h2 class="seccion">Ciclo menstrual</h2>
    <div class="tarjeta lista">
      ${interruptor('perfil.sigueCiclo', p.sigueCiclo, 'Incluir el ciclo menstrual')}
      ${p.sigueCiclo ? `<label class="linea"><span>Última regla</span><input type="date" data-modelo="perfil.ultimaRegla" value="${p.ultimaRegla ?? hoyIso()}" max="${hoyIso()}"></label>
      <div class="linea"><span>Duración: ${p.duracion} días</span>${paso('perfil.duracion')}</div>` : ''}
    </div>
    <p class="pie-seccion">Opcional, y solo si le apetece compartirlo. Es un dato de salud: no sale de este dispositivo.</p>
    <h2 class="seccion">Recordatorio</h2>
    ${NATIVO ? `<div class="tarjeta lista">
      ${interruptor('perfil.avisoActivo', p.avisoActivo, 'Aviso diario')}
      <label class="linea"><span>Hora del aviso</span><input type="time" data-modelo="perfil.horaAviso" value="${p.horaAviso}"></label>
      <button type="button" class="enlace" data-accion="probarAviso">Probar el aviso</button>
    </div>
    <p class="pie-seccion">${p.avisoActivo ? textoAvisoNativo(esc(p.horaAviso)) : 'Sin aviso diario. Actívalo para que el iPhone te pregunte cada día; se responde sin abrir la app.'}</p>` : `<div class="tarjeta lista">
      <label class="linea"><span>Hora del aviso</span><input type="time" data-modelo="perfil.horaAviso" value="${p.horaAviso}"></label>
      <button type="button" class="enlace" data-accion="recordatorio">Añadir alarma diaria al calendario</button>
      <button type="button" class="enlace" data-accion="probarAviso">Probar el aviso</button>
    </div>
    <p class="pie-seccion">${TEXTOS_AVISO.web.ajustes}</p>`}
    ${instalar}
    <h2 class="seccion">Modo demostración</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace" data-accion="${demo ? 'salirDemo' : 'entrarDemo'}">${demo ? 'Salir del modo demostración' : 'Ver Stormy con datos de ejemplo'}</button>
      <button type="button" class="enlace" data-accion="repetirRecorrido">Repetir el recorrido guiado</button>
    </div>
    <p class="pie-seccion">Enseña un mes de ejemplo sin tocar tus partes. Mientras lo ves, no se guarda nada.</p>
    <h2 class="seccion">Información</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace neutro" data-accion="verHistoria">La historia de Stormy<span>${ICONOS.derecha}</span></button>
      <button type="button" class="enlace neutro" data-accion="verComo">Cómo funciona Stormy<span>${ICONOS.derecha}</span></button>
      <button type="button" class="enlace neutro" data-accion="verPrivacidad">Privacidad y juego limpio<span>${ICONOS.derecha}</span></button>
    </div>
    <h2 class="seccion">Tus datos</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace" data-accion="exportar">Guardar copia</button>
      <button type="button" class="enlace" data-accion="recuperarCopia">Recuperar copia</button>
      <button type="button" class="enlace" data-accion="verCodigo">Código de traspaso a otro móvil</button>
      <button type="button" class="enlace" data-accion="pegarCodigo">Tengo un código de traspaso</button>
      <button type="button" class="enlace peligro" data-accion="pedirBorrarPartes">Borrar mis partes</button>
      <button type="button" class="enlace peligro" data-accion="pedirBorrarTodo">Borrar todo y empezar de cero</button>
    </div>
    <p class="pie-seccion">Sin cuentas: la copia y el código los guardas tú, y Stormy no los envía a ningún sitio. Incluyen todo lo apuntado, también el ciclo si está activado.<br><br>${APP.nombre} ${APP.version} · Entretenimiento, no consejo médico.</p>
  </main>`;
}

const HISTORIA = [
  ['Una nube con carácter', 'Stormy nació una tarde de domingo, en mitad de una discusión por el mando de la tele. Era una nube pequeña y se quedó con un rayo de recuerdo.'],
  ['Su oficio', 'Desde entonces vive en casa y hace lo único que sabe: mirar el cielo. Apunta contigo qué tiempo hace cada día y busca lo que se repite.'],
  ['Lo que no hace', 'No adivina a nadie ni toma partido. Avisa de cuándo puede tronar para que llegues con paraguas, y celebra los días de sol para que no se te pasen.'],
  ['Su lema', 'Las tormentas pasan. Lo importante es verlas venir juntos.'],
];
const COMO = [
  ['Qué se apunta', 'El ambiente de casa, no el ánimo de una persona: qué tiempo ha hecho hoy entre los que vivís juntos.'],
  ['Primeros resultados', 'A los 7 días ya se ve el patrón semanal; a los 14, pronóstico a 3 días y factores; a los 30, la semana completa y la nota de acierto. Antes de eso el pronóstico es genérico y lo marca con una fiabilidad baja.'],
  ['Qué tiene en cuenta', 'La media de la casa, el día de la semana, lo que apuntes en «qué toca mañana», la fase del ciclo (si la activáis) y la inercia de los últimos días. Los datos extra explican qué acompaña a los días buenos y malos.'],
  ['Prudencia con pocos datos', 'Con pocos días, cada efecto se reduce a propósito para no sacar conclusiones de una casualidad. Los días apuntados de memoria pesan la mitad.'],
  ['Luna, luz y estación', 'Stormy los calcula solo y los compara con vuestros partes. Solo los enseña si se ve alguna diferencia, y no entran en el pronóstico.'],
  ['Rayos y niveles', 'Son la parte de juego. Los rayos se acumulan y no cambian el pronóstico; los niveles dependen solo de cuántos días llevéis apuntados.'],
  ['Lo que no es', 'No es ciencia médica ni una forma de adivinar a nadie. Es un juego para prestar más atención a lo que pasa en casa. El horóscopo es un juego aparte y no entra en el cálculo.'],
];
const PRIVACIDAD = [
  ['Todo se queda en tu dispositivo', 'No hay cuentas, servidores ni publicidad. Los datos se guardan en este navegador y no salen de él.'],
  ['Es cosa de dos', 'Los partes hablan del ambiente de la casa que compartís. Usad Stormy solo si lo habéis hablado y os apetece a los dos; si alguien cambia de opinión, los datos se borran desde Ajustes.'],
  ['El ciclo es opcional y no sale de aquí', 'Es un dato de salud de otra persona: solo se usa si le apetece compartirlo, se puede quitar en cualquier momento y nunca se envía a ningún servidor. Sí va dentro de la copia que guardas tú.'],
  ['Copia, traspaso y borrado', 'Puedes guardar una copia, pasar tus datos a otro móvil con un código y borrarlo todo de forma definitiva desde Ajustes. Si borras los datos del navegador sin copia, se pierden.'],
  ['Entretenimiento', 'No es una herramienta médica ni psicológica y no sustituye a hablar en casa.'],
];

// ---------- Recorrido guiado ----------

const RECORRIDO = [
  ['[data-guia="registrar"]', 'Registrar', 'Aquí apuntas el parte de cada día. Un toque y queda guardado.'],
  ['[data-guia="progreso"]', 'Progreso', 'Cada día apuntado llena los anillos. Aquí ves cuánto falta para el siguiente premio.'],
  ['#nimbo', 'Stormy', 'Aquí estoy yo. Pregúntame por hoy, por mañana o por lo que influye en casa.'],
];

function pintaGuia() {
  const cont = $('#guia');
  const objetivo = ui.recorrido == null ? null : $(RECORRIDO[ui.recorrido][0]);
  if (!objetivo) {
    cont.innerHTML = '';
    cont.hidden = true;
    return;
  }
  const [, titulo, texto] = RECORRIDO[ui.recorrido];
  const r = objetivo.getBoundingClientRect();
  const ultimo = ui.recorrido === RECORRIDO.length - 1;
  const abajo = r.top + r.height / 2 < innerHeight / 2;
  const ancho = Math.min(300, innerWidth - 32);
  const izq = Math.min(Math.max(16, r.left + r.width / 2 - ancho / 2), innerWidth - ancho - 16);
  cont.hidden = false;
  cont.innerHTML = `<div class="foco" style="top:${r.top - 6}px;left:${r.left - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div>
    <div class="globo ${abajo ? 'abajo' : 'arriba'}" role="dialog" aria-label="Recorrido guiado, paso ${ui.recorrido + 1} de ${RECORRIDO.length}"
      style="width:${ancho}px;left:${izq}px;${abajo ? `top:${r.bottom + 20}px` : `bottom:${innerHeight - r.top + 20}px`}">
      <span class="pico" style="left:${Math.min(Math.max(18, r.left + r.width / 2 - izq - 9), ancho - 36)}px"></span>
      <small>${ui.recorrido + 1} de ${RECORRIDO.length}</small><h3>${titulo}</h3><p>${texto}</p>
      <div><button type="button" class="texto-boton" data-accion="saltarRecorrido">Saltar</button><button type="button" class="principal" data-accion="siguienteRecorrido">${ultimo ? 'Entendido' : 'Siguiente'}</button></div>
    </div>`;
  cont.querySelector('.principal').focus({ preventScroll: true });
}

function empiezaRecorrido() {
  ui.pestana = 'hoy';
  ui.recorrido = 0;
  pinta({ arriba: true });
}

function terminaRecorrido() {
  ui.recorrido = null;
  if (!demo && !real.perfil.recorrido) {
    real.perfil.recorrido = true;
    salva();
  }
  pintaGuia();
}

// ---------- Pintado ----------

const VISTAS = { hoy: vistaHoy, calendario: vistaCalendario, descubrimientos: vistaDescubrimientos, ajustes: vistaAjustes };
const PESTANAS = [['hoy', 'Hoy', 'hoy'], ['calendario', 'Calendario', 'calendario'], ['descubrimientos', 'Descubrimientos', 'grafico'], ['ajustes', 'Ajustes', 'ajustes']];

function pinta({ arriba = false } = {}) {
  const vista = $('#vista');
  const y = arriba ? 0 : scrollY;
  const st = E();
  const alta = st.perfil.alta;
  if (!VISTAS[ui.pestana]) ui.pestana = 'hoy';
  const animaCalendario = alta && ui.pestana === 'calendario' && !ui.hoja && ui.recien;
  vista.innerHTML = alta ? VISTAS[ui.pestana]() : bienvenida();
  if (animaCalendario) ui.recien = null;

  // Cada estado es un campo de color plano; el texto va en tinta, salvo sobre la tormenta.
  let campo = null;
  if (!alta) campo = TIEMPOS[ui.pasoPintado === 'presentacion' ? 1 : 4];
  else if (ui.pestana === 'hoy') {
    const hoy = hoyIso();
    campo = TIEMPOS[st.entradas[hoy]?.animo ?? motor().pronostico(hoy).tiempo];
  }
  pintaFondo(alta && ui.pestana === 'hoy' ? campo?.id ?? null : null);
  document.body.classList.toggle('con-cielo', !!campo);
  // En modo oscuro cada tiempo usa una versión honda de su color, con texto claro.
  const oscuro = matchMedia('(prefers-color-scheme: dark)').matches;
  const sobre = campo ? (oscuro ? '#F4F2FB' : campo.sobre) : null;
  document.body.classList.toggle('cielo-oscuro', !!sobre && sobre !== '#1E2749');
  document.body.classList.toggle('en-demo', !!demo);
  if (campo) {
    const c = oscuro ? campo.cieloOscuro : campo.cielo;
    document.body.style.setProperty('--cielo', `linear-gradient(${c[0]}, ${c[1]} 55%, ${c[2]})`);
    document.body.style.setProperty('--sobre', sobre);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', c[0]);
  } else {
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', matchMedia('(prefers-color-scheme: dark)').matches ? '#12152B' : '#F6F4FB');
  }

  $('#franja').hidden = !demo;
  $('#barra').innerHTML = alta
    ? PESTANAS.map(([id, nombre, icono]) => `<button type="button" class="${ui.pestana === id ? 'on' : ''}" ${ui.pestana === id ? 'aria-current="page"' : ''} data-accion="pestana" data-id="${id}">${ICONOS[icono]}<span>${nombre}</span></button>`).join('')
    : '';
  $('#barra').hidden = !alta;
  $('#nimbo').innerHTML = alta ? avatarNimbo(52, stormyEspecial()) : '';
  $('#nimbo').hidden = !alta;
  scrollTo(0, y);
  pintaGuia();
}

// Detalle animado de fondo en «Hoy», propio de cada tiempo. Solo transform y opacidad; se repinta solo si cambia el tiempo.
const FONDOS = {
  5: () => '<svg class="rayos-sol" viewBox="0 0 200 200" aria-hidden="true">' + Array.from({ length: 12 }, (_, i) => `<path d="M100 100L${(100 + 140 * Math.cos(((i * 30 - 4) * Math.PI) / 180)).toFixed(1)} ${(100 + 140 * Math.sin(((i * 30 - 4) * Math.PI) / 180)).toFixed(1)}L${(100 + 140 * Math.cos(((i * 30 + 4) * Math.PI) / 180)).toFixed(1)} ${(100 + 140 * Math.sin(((i * 30 + 4) * Math.PI) / 180)).toFixed(1)}Z"/>`).join('') + '</svg>',
  4: () => `<span class="nube-fondo pasa">${nubeSuelta(150)}</span>`,
  3: () => `<span class="nube-fondo lenta n1">${nubeSuelta(170)}</span><span class="nube-fondo lenta n2">${nubeSuelta(120)}</span><span class="nube-fondo lenta n3">${nubeSuelta(140)}</span>`,
  2: () => Array.from({ length: 14 }, (_, i) => `<i class="gota" style="left:${(i * 7.3 + 3) % 100}%;animation-delay:${((i * 0.37) % 1.4).toFixed(2)}s;animation-duration:${(1.1 + (i % 4) * 0.15).toFixed(2)}s"></i>`).join(''),
  1: () => '<span class="destello-fondo"></span>' + Array.from({ length: 10 }, (_, i) => `<i class="gota" style="left:${(i * 10.7 + 5) % 100}%;animation-delay:${((i * 0.29) % 1.2).toFixed(2)}s"></i>`).join(''),
};
let fondoPintado;
function pintaFondo(tiempo) {
  if (fondoPintado === tiempo) return;
  fondoPintado = tiempo;
  const capa = $('#fondo');
  capa.className = tiempo ? `fondo-${tiempo}` : '';
  capa.innerHTML = tiempo ? FONDOS[tiempo]() : '';
}

const HOJAS = {
  registro: hojaRegistro, niveles: hojaNiveles, nivel: hojaNivelNuevo, confirmar: hojaConfirmar, texto: hojaTexto, nimbo: hojaNimbo,
  recuperar: hojaRecuperar, tema: hojaTema, codigo: hojaCodigo, aviso: hojaAviso, instalar: hojaInstalar,
};
const TITULOS_HOJA = {
  registro: 'Registrar el parte', niveles: 'Niveles', nivel: 'Nivel desbloqueado', confirmar: 'Confirmación', texto: 'Información',
  nimbo: 'Hablar con Stormy', recuperar: 'Días sin apuntar', tema: 'Descubrimiento', codigo: 'Código de traspaso', aviso: 'Recordatorio',
  instalar: 'Cómo instalar Stormy',
};

function pintaHoja(nueva = false) {
  const cont = $('#hoja');
  if (!ui.hoja) {
    cont.innerHTML = '';
    document.body.classList.remove('con-hoja');
    return;
  }
  const previo = cont.querySelector('.hoja-cuerpo')?.scrollTop ?? 0;
  const baja = ['nivel', 'confirmar', 'recuperar', 'aviso'].includes(ui.hoja.tipo);
  // El chat de Stormy es una ventana pequeña y flotante, no una hoja a pantalla completa.
  const chat = ui.hoja.tipo === 'nimbo';
  cont.innerHTML = `<div class="velo ${chat ? 'suave' : ''} ${nueva ? 'entra' : ''}" data-accion="cerrarHoja"></div>
    <section class="hoja ${baja ? 'baja' : ''} ${chat ? 'flotante' : ''} ${nueva ? 'entra' : ''}" role="dialog" aria-modal="true" aria-label="${TITULOS_HOJA[ui.hoja.tipo]}" tabindex="-1">${HOJAS[ui.hoja.tipo]()}</section>`;
  document.body.classList.add('con-hoja');
  const cuerpo = cont.querySelector('.hoja-cuerpo');
  if (cuerpo && !nueva) cuerpo.scrollTop = previo;
  if (cuerpo && ui.hoja.tipo === 'nimbo') cuerpo.scrollTop = cuerpo.scrollHeight;
  if (nueva) cont.querySelector('.hoja').focus?.();
}

function abreHoja(hoja) {
  ui.hoja = hoja;
  pintaHoja(true);
}

let avisoTemporal;
function avisa(texto) {
  const t = $('#aviso');
  t.textContent = texto;
  t.classList.add('on');
  clearTimeout(avisoTemporal);
  avisoTemporal = setTimeout(() => t.classList.remove('on'), 2800);
}
const avisaDemo = () => avisa('Datos de ejemplo: aquí no se guarda nada');

function descarga(nombre, tipo, contenido) {
  // En la app nativa el archivo se entrega al iPhone, que abre la hoja de compartir (Guardar en Archivos, etc.).
  if (NATIVO) return nativo('compartirArchivo', { nombre, mime: tipo, contenido });
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function copia(texto, hecho) {
  try {
    await navigator.clipboard.writeText(texto);
    avisa(hecho);
  } catch {
    avisa('No se ha podido copiar: selecciona el texto y cópialo a mano');
  }
}

/** Evento diario con alarma para el calendario del dispositivo: recordatorio sin servidor. */
function recordatorioICS(hora) {
  const [h, min] = hora.split(':');
  const hoy = hoyIso().replaceAll('-', '');
  // El enlace del aviso abre directamente el registro: alarma, un toque en el enlace y elegir la opción.
  const url = `${location.origin}${location.pathname}?hoja=registro`;
  const sello = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stormy//Recordatorio//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:parte-diario@stormy', `DTSTAMP:${sello}`, `DTSTART:${hoy}T${h}${min}00`, 'DURATION:PT5M',
    'RRULE:FREQ=DAILY', 'SUMMARY:¿Qué tiempo ha hecho hoy en casa?', `DESCRIPTION:Dos toques: abres el enlace y eliges. ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:¿Qué tiempo ha hecho hoy en casa?', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/** Sustituye los datos del dispositivo por una copia ya validada, tras confirmarlo. */
function proponeCopia(estado) {
  ui.copiaPendiente = estado;
  const n = Object.keys(estado.entradas).length;
  const actuales = Object.keys(real.entradas).length;
  abreHoja({
    tipo: 'confirmar', titulo: '¿Recuperar estos datos?',
    texto: `La copia trae ${n === 1 ? '1 parte' : `${n} partes`} y sustituye lo que hay ahora en este dispositivo (${actuales === 1 ? '1 parte' : `${actuales} partes`}). No se puede deshacer.`,
    boton: 'Recuperar', accion: 'aplicarCopia',
  });
}

// ---------- Acciones ----------

const acciones = {
  siguiente() {
    const id = pasosAlta()[ui.paso];
    if ((id === 'juego' && !ui.alta.consiente) || (id === 'quien' && !ui.alta.relacion)) return;
    ui.paso++;
    pinta({ arriba: true });
  },
  /** «Ahora no» en el paso de instalar: antes de seguir, se explica qué se pierde. */
  instalarLuego() {
    abreHoja({
      tipo: 'confirmar', suave: true, titulo: '¿Seguir sin instalar?',
      texto: 'Sin instalar Stormy no podrá avisarte cada día, y Safari puede borrar los datos de las webs que no abres en unos días: perderías tus partes y tu progreso.',
      boton: 'Instalar ahora', accion: 'cerrarHoja', cancelar: 'Seguir sin instalar', accion2: 'seguirSinInstalar',
    });
  },
  seguirSinInstalar() {
    ui.hoja = null;
    pintaHoja();
    acciones.siguiente();
  },
  verInstalar() {
    abreHoja({ tipo: 'instalar' });
  },
  ocultarInstalar() {
    try {
      localStorage.setItem(CLAVE_INSTALAR, hoyIso());
    } catch {
      /* sin almacenamiento: se ocultará solo hasta que se repinte */
    }
    $('.aviso-instalar')?.remove();
  },
  atras() {
    ui.paso = Math.max(0, ui.paso - 1);
    pinta({ arriba: true });
  },
  async terminar(d) {
    const a = ui.alta;
    let permiso = null;
    if (d.aviso && !NATIVO) {
      // El permiso se pide aquí, con el toque de la persona; el aviso diario en sí va por el calendario (ver avisos.js).
      permiso = await pidePermiso().catch(() => 'no-disponible');
    }
    const conCiclo = a.relacion === 'pareja' && a.sigueCiclo;
    Object.assign(real.perfil, {
      apodo: a.apodo.trim(), miApodo: a.miApodo.trim(), relacion: a.relacion ?? 'pareja',
      parentesco: a.relacion === 'familia' ? a.parentesco : null,
      nacimiento: a.conNacimiento ? a.nacimiento : null, sigueCiclo: conCiclo,
      duracion: a.duracion, ultimaRegla: conCiclo ? a.ultimaRegla : null, consentimiento: hoyIso(), horaAviso: a.hora, avisoActivo: !!d.aviso && NATIVO, alta: true, recorrido: false,
    });
    guardar(real);
    ui.pestana = 'hoy';
    pinta({ arriba: true });
    if (d.aviso && NATIVO) {
      // En la app nativa el iPhone pide el permiso y programa el aviso diario de verdad.
      nativo('programarAviso', { hora: a.hora, nombre: real.perfil.apodo });
      avisa(textoAvisoNativo(a.hora));
      empiezaRecorrido();
    } else if (d.aviso) abreHoja({ tipo: 'aviso', permiso, alCerrar: empiezaRecorrido });
    else empiezaRecorrido();
  },
  pasoNumero(d) {
    const [raiz, campo] = d.modelo.split('.');
    if (raiz === 'perfil' && demo) return avisaDemo();
    const destino = raiz === 'alta' ? ui.alta : real.perfil;
    destino[campo] = Math.min(40, Math.max(21, destino[campo] + Number(d.d)));
    if (raiz === 'perfil') salva();
    pinta();
  },
  /** Elección única: relación, parentesco y los datos extra de tres opciones. Tocar la elegida la quita (salvo la relación). */
  elige(d) {
    const [raiz, campo] = d.modelo.split('.');
    const v = /^\d+$/.test(d.v) ? Number(d.v) : d.v;
    if (raiz === 'borrador') {
      ui.borrador[campo] = ui.borrador[campo] === v ? null : v;
      guardaBorrador();
      return pintaHoja();
    }
    if (raiz === 'perfil' && demo) return avisaDemo();
    const destino = raiz === 'alta' ? ui.alta : real.perfil;
    destino[campo] = v;
    if (campo === 'relacion' && v !== 'familia') destino.parentesco = null;
    if (raiz === 'perfil') salva();
    pinta();
  },
  pestana(d) {
    const cambia = ui.pestana !== d.id;
    ui.pestana = d.id;
    pinta({ arriba: cambia });
  },
  abrirRegistro(d) {
    if (demo) return avisaDemo();
    const dia = d.dia || hoyIso();
    const e = real.entradas[dia];
    ui.borrador = { ...entradaVacia(), ...e, etiquetas: [...(e?.etiquetas ?? [])], dia, reaccion: null, premio: 0 };
    abreHoja({ tipo: 'registro' });
  },
  elegirTiempo(d) {
    const b = ui.borrador;
    if (!b || demo) return;
    const nuevo = !real.entradas[b.dia];
    const antes = nivelActual(diasRegistrados());
    b.animo = Number(d.t);
    // Un día que se apunta más tarde va «de memoria»: cuenta para los niveles y pesa la mitad en el cálculo.
    if (nuevo) b.orientativo = b.dia < hoyIso();
    guardaBorrador();
    if (nuevo) {
      const total = diasRegistrados();
      const semana = total % 7 === 0;
      b.reaccion = `${reaccion(b.animo, total)}${semana ? ' Y con este cierras un bloque de 7 partes: premio semanal.' : ''}`;
      b.premio = RAYOS.parte + (semana ? RAYOS.semana : 0);
      const despues = nivelActual(total);
      if (despues.id !== antes.id) ui.nivelPendiente = despues;
      ui.recien = { dia: b.dia, ...cierres(b.dia) };
    }
    navigator.vibrate?.(8);
    pinta();
    pintaHoja();
  },
  etiqueta(d) {
    const lista = ui.borrador.etiquetas;
    const i = lista.indexOf(d.e);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(d.e);
    guardaBorrador();
    pintaHoja();
  },
  recuperaDia(d) {
    const h = ui.hoja;
    const t = Number(d.t);
    if (h.elegidos[d.dia] === t) delete h.elegidos[d.dia];
    else h.elegidos[d.dia] = t;
    h.todos = null;
    pintaHoja();
  },
  recuperaTodos(d) {
    const h = ui.hoja;
    h.todos = Number(d.t);
    for (const dia of h.dias) h.elegidos[dia] = h.todos;
    pintaHoja();
  },
  recuperaGuardar() {
    const h = ui.hoja;
    if (demo || h?.tipo !== 'recuperar') return;
    const hoy = hoyIso();
    const antes = nivelActual(diasRegistrados());
    const nuevos = Object.entries(h.elegidos).filter(([dia]) => !real.entradas[dia]);
    for (const [dia, animo] of nuevos) real.entradas[dia] = { ...entradaVacia(), animo, orientativo: dia < hoy };
    const ok = salva();
    const despues = nivelActual(diasRegistrados());
    ui.hoja = null;
    pinta();
    if (despues.id !== antes.id) abreHoja({ tipo: 'nivel', nivel: despues });
    else pintaHoja();
    avisa(ok ? `${nuevos.length === 1 ? 'Apuntado 1 día' : `Apuntados ${nuevos.length} días`} · +${nuevos.length * RAYOS.parte} rayos` : 'No se ha podido guardar en este navegador');
  },
  cerrarHoja() {
    const cerrada = ui.hoja;
    ui.hoja = null;
    ui.borrador = null;
    ui.copiaPendiente = null;
    if (cerrada?.tipo === 'registro') {
      pinta();
      if (ui.nivelPendiente) {
        const nivel = ui.nivelPendiente;
        ui.nivelPendiente = null;
        return abreHoja({ tipo: 'nivel', nivel });
      }
    }
    pintaHoja();
    if (cerrada?.tipo === 'nivel' && ui.pestana === 'calendario') pinta();
    cerrada?.alCerrar?.();
  },
  abrirNiveles() {
    abreHoja({ tipo: 'niveles' });
  },
  abrirTema(d) {
    abreHoja({ tipo: 'tema', id: d.id });
  },
  faseCiclo(d) {
    if (ui.hoja?.tipo !== 'tema') return;
    ui.hoja.fase = d.id;
    pintaHoja();
    document.getElementById(`fase-${d.id}`)?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  },
  abrirHoroscopo() {
    abreHoja({ tipo: 'tema', id: 'horoscopo' });
  },
  guardarNacimiento() {
    if (demo) return avisaDemo();
    const valor = $('#nacimiento-nuevo')?.value;
    if (!valor) return;
    real.perfil.nacimiento = valor;
    salva();
    pinta();
    pintaHoja();
  },
  abrirNimbo() {
    if (!ui.chat.length) ui.chat.push({ de: 'nimbo', texto: saludo(contextoNimbo()) });
    abreHoja({ tipo: 'nimbo' });
  },
  preguntar(d) {
    preguntaANimbo(d.q);
  },
  mes(d) {
    const [a, m] = ui.mes.split('-').map(Number);
    const f = new Date(Date.UTC(a, m - 1 + Number(d.d), 1));
    const nuevo = f.toISOString().slice(0, 7);
    if (nuevo > mesMaximo()) return;
    ui.mes = nuevo;
    pinta();
  },
  verHistoria() {
    abreHoja({ tipo: 'texto', titulo: 'La historia de Stormy', bloques: HISTORIA });
  },
  verComo() {
    abreHoja({ tipo: 'texto', titulo: 'Cómo funciona', bloques: COMO });
  },
  verPrivacidad() {
    abreHoja({ tipo: 'texto', titulo: 'Privacidad', bloques: PRIVACIDAD });
  },
  siguienteRecorrido() {
    if (ui.recorrido >= RECORRIDO.length - 1) return terminaRecorrido();
    ui.recorrido++;
    pintaGuia();
  },
  saltarRecorrido() {
    terminaRecorrido();
  },
  repetirRecorrido() {
    empiezaRecorrido();
  },
  entrarDemo() {
    demo = ejemplo(30, real.perfil);
    Object.assign(ui, { pestana: 'hoy', chat: [], muestra: null, mes: hoyIso().slice(0, 7) });
    pinta({ arriba: true });
  },
  salirDemo() {
    demo = null;
    const q = new URLSearchParams(location.search);
    if (q.has('demo')) {
      q.delete('demo');
      history.replaceState(null, '', location.pathname + (q.size ? `?${q}` : ''));
    }
    Object.assign(ui, { pestana: real.perfil.alta ? 'ajustes' : 'hoy', hoja: null, chat: [], muestra: null, recorrido: null });
    pintaHoja();
    pinta({ arriba: true });
  },
  async probarAviso() {
    if (NATIVO) {
      nativo('probarAviso');
      return avisa('El aviso llega en unos 10 segundos: sal de la app para verlo');
    }
    const antes = capacidad();
    let r;
    try {
      r = await muestraAviso();
    } catch (e) {
      r = { ok: false, motivo: 'error', botones: antes.botones, detalle: String(e?.message ?? e) };
    }
    const bloques = [];
    if (r.ok) {
      bloques.push(['Aviso enviado', 'Bloquea el móvil y míralo en la pantalla de bloqueo, o baja el centro de notificaciones. Tócalo y elige: son dos toques. Si tu móvil enseña opciones dentro del aviso, también puedes elegir ahí.']);
      bloques.push(['Botones que admite este dispositivo', r.botones >= 5
        ? `Admite ${r.botones}: caben las cinco opciones.`
        : r.botones > 0
          ? `Admite ${r.botones}. Verás solo las ${r.botones} primeras opciones; para el resto, toca el aviso y se abre el registro.`
          : 'Este sistema no enseña botones en los avisos web: al tocar el aviso se abre el registro para elegir.']);
      bloques.push(['Es solo una prueba', 'Este aviso lo has lanzado tú ahora. El recordatorio de cada día va por la alarma del calendario.']);
    } else if (r.motivo === 'sin-soporte') {
      bloques.push(['Este navegador no admite avisos', esIOS() && !antes.instalada
        ? 'En iPhone, los avisos solo funcionan si antes añades Stormy a la pantalla de inicio (botón Compartir → «Añadir a pantalla de inicio») y la abres desde su icono.'
        : 'Prueba con Safari en iPhone (instalada en la pantalla de inicio) o con Chrome en Android.']);
    } else if (r.motivo === 'denegado') {
      bloques.push(['Avisos desactivados', 'Has rechazado los avisos de Stormy. Actívalos en los ajustes del móvil o del navegador y vuelve a probar.']);
    } else {
      bloques.push(['No se ha podido mostrar el aviso', esc(r.detalle ?? 'Error desconocido.')]);
    }
    bloques.push(['Datos técnicos', `Instalada: ${antes.instalada ? 'sí' : 'no'} · Permiso: ${capacidad().permiso} · Botones declarados: ${antes.botones}`]);
    abreHoja({ tipo: 'texto', titulo: 'Prueba de aviso', bloques });
  },
  recordatorio(d) {
    descarga('stormy-recordatorio.ics', 'text/calendar', recordatorioICS(real.perfil.horaAviso));
    if (d.cierra) acciones.cerrarHoja();
    avisa('Abre el archivo para añadirlo a tu calendario');
  },
  exportar() {
    descarga(`stormy-${hoyIso()}.json`, 'application/json', aCopia(real));
    if (!NATIVO) avisa('Copia guardada en tus descargas');
  },
  recuperarCopia() {
    if (demo) return avisaDemo();
    $('#fichero').click();
  },
  verCodigo() {
    abreHoja({ tipo: 'codigo', modo: 'ver' });
  },
  pegarCodigo() {
    if (demo) return avisaDemo();
    abreHoja({ tipo: 'codigo', modo: 'pegar' });
  },
  copiarCodigo() {
    copia($('#codigo').value, 'Código copiado');
  },
  usarCodigo() {
    try {
      proponeCopia(deCodigo($('#codigo').value));
    } catch {
      avisa('Ese código no es de Stormy o está incompleto');
    }
  },
  aplicarCopia() {
    if (!ui.copiaPendiente || demo) return;
    real = ui.copiaPendiente;
    const ok = guardar(real);
    Object.assign(ui, { hoja: null, copiaPendiente: null, chat: [], muestra: null, pestana: 'hoy', paso: 0 });
    pintaHoja();
    pinta({ arriba: true });
    avisa(ok ? 'Datos recuperados' : 'No se ha podido guardar en este navegador');
  },
  copiarEnlace() {
    copia(location.origin + location.pathname, 'Enlace copiado. Pégalo en Safari');
  },
  pedirBorrarPartes() {
    if (demo) return avisaDemo();
    abreHoja({ tipo: 'confirmar', titulo: '¿Borrar mis partes?', texto: 'Se borran todos los días apuntados y el progreso de niveles. La configuración se queda. No se puede deshacer.', boton: 'Borrar partes', accion: 'borrarPartes' });
  },
  pedirBorrarTodo() {
    if (demo) return avisaDemo();
    abreHoja({ tipo: 'confirmar', titulo: '¿Borrar todo?', texto: 'Se borran los partes y la configuración, y la app vuelve a la bienvenida. No se puede deshacer.', boton: 'Borrar todo', accion: 'borrarTodo' });
  },
  borrarPartes() {
    if (demo) return;
    real.entradas = {};
    salva();
    ui.hoja = null;
    pintaHoja();
    pinta();
  },
  borrarTodo() {
    if (demo) return;
    real = borrarTodo();
    Object.assign(ui, { hoja: null, paso: 0, pasoPintado: null, pestana: 'hoy', chat: [], muestra: null });
    ui.alta.consiente = false;
    pintaHoja();
    pinta({ arriba: true });
  },
  async instalar() {
    if (!ui.instalar) return;
    ui.instalar.prompt();
    await ui.instalar.userChoice.catch(() => null);
    ui.instalar = null;
    pinta();
  },
  async compartir() {
    const st = E();
    const hoy = hoyIso();
    const t = st.entradas[hoy]?.animo ?? motor().pronostico(hoy).tiempo;
    const texto = `${st.entradas[hoy] ? 'Hoy en casa' : 'Previsión de hoy en casa'}: ${TIEMPOS[t].emoji} ${TIEMPOS[t].titulo.toLowerCase()}. ${consejoDe(t, hoy, st.perfil.relacion)}`;
    await comparte(texto);
  },
  async compartirResumen() {
    await comparte(textoResumen(motor(), E()));
  },
};

async function comparte(texto) {
  const url = location.origin + location.pathname;
  try {
    if (navigator.share) await navigator.share({ title: APP.nombre, text: texto, url });
    else await copia(`${texto} ${url}`, 'Copiado. Pégalo donde quieras');
  } catch {
    /* el usuario canceló */
  }
}

// ---------- Eventos ----------

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-accion]');
  if (!el || el.disabled) return;
  acciones[el.dataset.accion]?.(el.dataset);
});

function alCambiar(ev) {
  const el = ev.target.closest('[data-modelo]');
  if (!el || el.tagName === 'BUTTON') return;
  const [raiz, campo] = el.dataset.modelo.split('.');
  const casilla = el.type === 'checkbox';
  const valor = casilla ? el.checked : el.value;

  if (raiz === 'alta') {
    if (!casilla && !valor && el.type !== 'text') return;
    ui.alta[campo] = valor;
    if (casilla) pinta();
  } else if (raiz === 'borrador') {
    ui.borrador[campo] = valor;
    guardaBorrador();
    if (casilla) pintaHoja();
  } else if (raiz === 'perfil') {
    if (demo) {
      avisaDemo();
      return pinta();
    }
    const p = real.perfil;
    if (campo === 'conNacimiento') p.nacimiento = valor ? '1992-06-15' : null;
    else if (campo === 'avisoActivo') {
      p.avisoActivo = valor;
      if (valor) nativo('programarAviso', { hora: p.horaAviso, nombre: p.apodo });
      else nativo('cancelarAviso');
    }
    else if (campo === 'sigueCiclo') {
      p.sigueCiclo = valor;
      if (valor && !p.ultimaRegla) p.ultimaRegla = hoyIso();
    } else if (!casilla && !valor && el.type !== 'text') return;
    else p[campo] = valor;
    if (campo === 'horaAviso' && NATIVO && p.avisoActivo) nativo('programarAviso', { hora: p.horaAviso, nombre: p.apodo });
    ui.muestra = null;
    salva();
    if (casilla) pinta();
  }
}
document.addEventListener('input', alCambiar);

document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'fichero') return;
  const fichero = ev.target.files?.[0];
  ev.target.value = '';
  if (!fichero) return;
  try {
    proponeCopia(deCopia(await fichero.text()));
  } catch {
    avisa('Ese archivo no es una copia de Stormy');
  }
});

document.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-nimbo') return;
  ev.preventDefault();
  const campo = $('#pregunta');
  const texto = campo.value;
  campo.value = '';
  preguntaANimbo(texto);
});

// «Ver un mes completo»: la vista de ejemplo solo se ve mientras el botón está pulsado. No se repinta nada:
// las dos rejillas están ya en la página y se alterna una clase, así el dedo no pierde el botón.
function mantener(activo) {
  const cal = $('.cal');
  if (!cal) return;
  cal.classList.toggle('viendo-ejemplo', activo);
  cal.querySelector('.cal-ejemplo').setAttribute('aria-hidden', String(!activo));
  $('[data-mantener]')?.setAttribute('aria-pressed', String(activo));
}
document.addEventListener('pointerdown', (ev) => {
  if (ev.target.closest?.('[data-mantener]')) mantener(true);
});
for (const tipo of ['pointerup', 'pointercancel', 'blur']) addEventListener(tipo, () => mantener(false));
document.addEventListener('contextmenu', (ev) => {
  if (ev.target.closest?.('[data-mantener]')) ev.preventDefault();
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && ui.recorrido != null) return terminaRecorrido();
  if (ev.key === 'Escape' && ui.hoja) acciones.cerrarHoja();
  if ((ev.key === ' ' || ev.key === 'Enter') && ev.target.matches?.('[data-mantener]')) mantener(true);
  // Las fases de la rueda son elementos SVG con role="button": se activan también con Intro o espacio.
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches?.('[role="button"][data-accion]')) {
    ev.preventDefault();
    acciones[ev.target.dataset.accion]?.(ev.target.dataset);
  }
  if (ev.key === 'Enter' && ev.target.matches?.('input[type=text]') && ev.target.id !== 'pregunta') ev.target.blur();
});
document.addEventListener('keyup', (ev) => {
  if (ev.target.matches?.('[data-mantener]')) mantener(false);
});

addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  ui.instalar = ev;
  if (!ui.hoja && (ui.pestana === 'ajustes' || !E().perfil.alta)) pinta();
});

// Si el sistema cambia entre claro y oscuro con la app abierta, se repinta el campo de color.
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => pinta());

addEventListener('resize', () => {
  if (ui.recorrido != null) pintaGuia();
});

// Respuestas dadas desde un aviso del sistema: se apuntan al abrir o al volver a la app.
async function vuelcaPendientes() {
  const pendientes = await recogePendientes();
  if (!pendientes.length || !real.perfil.alta) return;
  fusionaRespuestas(real, pendientes);
  guardar(real);
  if (!ui.hoja) pinta();
  avisa('Parte apuntado desde el aviso');
}
// La app nativa entrega aquí lo respondido desde la notificación y abre el registro al tocar el aviso.
globalThis.stormyRecibe = (respuestas) => {
  const dias = fusionaRespuestas(real, respuestas);
  if (!dias.length) return [];
  const ok = guardar(real);
  if (!ui.hoja) pinta();
  else if (ui.hoja.tipo === 'registro' && dias.includes(ui.borrador?.dia)) {
    ui.borrador.animo = real.entradas[ui.borrador.dia].animo;
    pintaHoja();
  }
  avisa(ok ? 'Parte apuntado desde el aviso' : 'No se ha podido guardar en este navegador');
  // Solo se confirman los días guardados, para que la app nativa los quite de su lista.
  if (ok) nativo('respuestasRecibidas', { dias });
  return dias;
};
globalThis.stormyAviso = (texto) => avisa(String(texto));
globalThis.stormyAbrir = (que) => {
  if (que === 'registro' && real.perfil.alta && !demo && ui.hoja?.tipo !== 'registro') acciones.abrirRegistro({});
};
if (NATIVO) document.documentElement.classList.add('nativa');

navigator.serviceWorker?.addEventListener('message', (ev) => {
  if (ev.data?.tipo === 'respuesta-aviso') vuelcaPendientes();
  if (ev.data?.tipo === 'abrir-registro' && real.perfil.alta && !ui.hoja) acciones.abrirRegistro({});
});

// Al volver a la app: se recogen respuestas de avisos, se refresca el día y se ofrece rellenar lo pendiente.
let diaPintado = hoyIso();
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) return;
  await vuelcaPendientes();
  if (diaPintado !== hoyIso()) {
    diaPintado = hoyIso();
    ui.mes = diaPintado.slice(0, 7);
    if (!ui.hoja) pinta();
  }
  ofreceRecuperacion();
});

// Con el teclado abierto en el móvil, la ventana del chat sube para que el campo de texto siga a la vista.
if (window.visualViewport) {
  const ajusta = () => {
    const tapado = Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop);
    document.documentElement.style.setProperty('--teclado', `${Math.round(tapado)}px`);
  };
  visualViewport.addEventListener('resize', ajusta);
  visualViewport.addEventListener('scroll', ajusta);
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

pinta();
// Quien ya había terminado la bienvenida pero no vio el recorrido (o lo dejó a medias) lo ve al entrar.
if (!demo && real.perfil.alta && !real.perfil.recorrido && !new URLSearchParams(location.search).has('hoja')) empiezaRecorrido();
vuelcaPendientes().then(() => {
  // Si se abre directamente el registro (enlace del aviso), no se interrumpe con la oferta de días pendientes.
  if (!new URLSearchParams(location.search).has('hoja')) setTimeout(ofreceRecuperacion, 400);
});
