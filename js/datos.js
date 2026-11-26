// Guardado local. Todo vive en el navegador de este dispositivo: no hay servidor ni cuentas.
// La copia de seguridad y el código de traspaso los genera y los guarda la propia persona; nada sale solo.
import { aIso, aNum, diaSemana, fase, hoyIso, rayosDe } from './motor.js';
import { ETIQUETAS } from './contenido.js';
import { normalizaTienda, rachaProtegida, saldo, tiendaVacia } from './tienda.js';

const CLAVE = 'stormy.v1';
const CLAVE_ANTERIOR = 'sicielo.v1'; // nombre provisional anterior: se siguen leyendo sus datos

export const RELACIONES = [['pareja', 'Pareja'], ['familia', 'Familia'], ['amigo', 'Amigo o amiga']];
export const PARENTESCOS = [
  ['madre', 'Madre'], ['padre', 'Padre'], ['hermana', 'Hermana'], ['hermano', 'Hermano'], ['hija', 'Hija'], ['hijo', 'Hijo'], ['otro', 'Otro'],
];
const MANANAS_VALIDAS = ['laborable', 'libre', 'especial'];

export const perfilVacio = () => ({
  apodo: '', // cómo se llama en casa a la persona con la que se convive
  miApodo: '', // cómo llaman a quien usa la app
  relacion: 'pareja', // pareja | familia | amigo
  parentesco: null, // solo con relación «familia»
  nacimiento: null,
  sigueCiclo: false,
  duracion: 28,
  ultimaRegla: null,
  consentimiento: null,
  horaAviso: '21:30',
  avisoActivo: false, // aviso diario de la app nativa (en la web, el recordatorio va por el calendario)
  alta: false,
  recorrido: false, // recorrido guiado ya visto
  ofertaRecuperacion: null, // último día en que se ofreció rellenar días pendientes
});

export const entradaVacia = () => ({
  animo: null, sueno: null, estres: null, juntos: null, manana: null, etiquetas: [], nota: '', regla: false, orientativo: false,
});

export const estadoVacio = () => ({ perfil: perfilVacio(), entradas: {}, tienda: tiendaVacia() });

const ES_DIA = /^\d{4}-\d{2}-\d{2}$/;
const ES_HORA = /^\d{2}:\d{2}$/;
const nivel3 = (v) => ([1, 2, 3].includes(v) ? v : null);
const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const MAX_ETIQUETAS = 8;
const diaValido = (v) => (typeof v === 'string' && ES_DIA.test(v) && aIso(aNum(v)) === v ? v : null); // descarta fechas imposibles como el 31 de febrero

function normalizaEntrada(e) {
  const animo = Math.round(Number(e?.animo));
  if (!(animo >= 1 && animo <= 5)) return null;
  let etiquetas = (Array.isArray(e.etiquetas) ? e.etiquetas : []).filter((x) => typeof x === 'string')
    .map((x) => (x === 'Plan con amigas' ? 'Plan con amigos' : x));
  let juntos = nivel3(e.juntos);
  // La etiqueta antigua «Poco tiempo juntos» pasa a ser el dato «tiempo juntos: poco».
  if (etiquetas.includes('Poco tiempo juntos')) {
    juntos = juntos ?? 1;
    etiquetas = etiquetas.filter((x) => x !== 'Poco tiempo juntos');
  }
  return {
    animo, sueno: nivel3(e.sueno), estres: nivel3(e.estres), juntos,
    manana: MANANAS_VALIDAS.includes(e.manana) ? e.manana : null,
    // Solo etiquetas conocidas y como mucho 8: un código pegado no puede colar textos raros ni listas enormes.
    etiquetas: [...new Set(etiquetas)].filter((x) => ETIQUETAS.includes(x)).slice(0, MAX_ETIQUETAS), nota: texto(e.nota, 280), regla: !!e.regla, orientativo: !!e.orientativo,
  };
}

/**
 * Convierte cualquier estado guardado (también los de versiones anteriores o una copia importada) al formato actual.
 * Regla de migración: `perfil.nombre` pasa a `perfil.apodo`, la relación por defecto es «pareja» y los campos
 * nuevos de cada parte (`juntos`, `manana`, `orientativo`) nacen vacíos.
 */
export function normaliza(e, hoy = hoyIso()) {
  const p = e?.perfil && typeof e.perfil === 'object' ? e.perfil : {};
  const base = perfilVacio();
  const relacion = RELACIONES.some(([id]) => id === p.relacion) ? p.relacion : 'pareja';
  const perfil = {
    ...base,
    apodo: texto(p.apodo ?? p.nombre, 30),
    miApodo: texto(p.miApodo, 30),
    relacion,
    parentesco: relacion === 'familia' && PARENTESCOS.some(([id]) => id === p.parentesco) ? p.parentesco : null,
    nacimiento: diaValido(p.nacimiento),
    sigueCiclo: !!p.sigueCiclo,
    duracion: Math.min(40, Math.max(21, Math.round(Number(p.duracion)) || 28)),
    ultimaRegla: diaValido(p.ultimaRegla),
    consentimiento: diaValido(p.consentimiento),
    horaAviso: typeof p.horaAviso === 'string' && ES_HORA.test(p.horaAviso) ? p.horaAviso : base.horaAviso,
    avisoActivo: !!p.avisoActivo,
    alta: !!p.alta,
    // Quien ya usaba la app no necesita que se le lance el recorrido al actualizar.
    recorrido: p.recorrido ?? !!p.alta,
    ofertaRecuperacion: diaValido(p.ofertaRecuperacion),
  };
  const entradas = {};
  const origen = e?.entradas && typeof e.entradas === 'object' ? e.entradas : {};
  for (const dia of Object.keys(origen).sort()) {
    // Los partes con fecha posterior a hoy no pueden existir: se descartan.
    const n = diaValido(dia) && dia <= hoy && normalizaEntrada(origen[dia]);
    if (n) entradas[dia] = n;
  }
  // La tienda (objetos, rayos gastados, cofres): los estados antiguos no tenían, así que nace vacía.
  return { perfil, entradas, tienda: normalizaTienda(e?.tienda) };
}

let memoria = null; // respaldo si el navegador no deja usar localStorage (modo privado estricto)

export function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE) ?? localStorage.getItem(CLAVE_ANTERIOR);
    if (!guardado) return estadoVacio();
    return normaliza(JSON.parse(guardado));
  } catch {
    return memoria ?? estadoVacio();
  }
}

export function guardar(estado) {
  memoria = estado;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function borrarTodo() {
  memoria = null;
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_ANTERIOR);
  } catch {
    /* sin almacenamiento disponible */
  }
  return estadoVacio();
}

// ---------- Cómo se nombra a la casa y a quien vive en ella ----------

const TRATO = { madre: 'tu madre', padre: 'tu padre', hermana: 'tu hermana', hermano: 'tu hermano', hija: 'tu hija', hijo: 'tu hijo' };

/** Apodo, parentesco elegido o, si no hay nada, una fórmula que no presupone relación ni género. */
export const quienDe = (perfil) =>
  perfil.apodo?.trim() || (perfil.relacion === 'familia' && TRATO[perfil.parentesco]) || 'quien vive contigo';

/** Cabecera de «Hoy»: «Casa de Luis y Ali», «Casa de Luis» o «En casa». */
export function casaDe(perfil) {
  const nombres = [perfil.miApodo, perfil.apodo].map((x) => x?.trim()).filter(Boolean);
  return nombres.length ? `Casa de ${nombres.join(' y ')}` : 'En casa';
}

// ---------- Cuentas sobre los partes ----------

/** Número de datos extra de un parte. */
export const extrasDe = (e) =>
  (e.sueno ? 1 : 0) + (e.estres ? 1 : 0) + (e.juntos ? 1 : 0) + (e.manana ? 1 : 0) +
  (e.etiquetas?.length ?? 0) + (e.nota?.trim() ? 1 : 0) + (e.regla ? 1 : 0);

export const totalExtras = (estado) => Object.values(estado.entradas).reduce((n, e) => n + extrasDe(e), 0);

/** Rayos ganados en total (partes, datos extra y bloques de 7). */
export const rayosDeEstado = (estado) => rayosDe(Object.keys(estado.entradas).length, totalExtras(estado));

/** Rayos que se pueden gastar en la tienda: ganados − gastados (+ los devueltos por duplicados). */
export const rayosDisponibles = (estado) => saldo(rayosDeEstado(estado), estado.tienda ?? tiendaVacia());

/** Racha contando los días salvados con un comodín. */
export const rachaDe = (estado, hoy = hoyIso()) => rachaProtegida(Object.keys(estado.entradas), estado.tienda?.comodin?.usados ?? [], hoy);

export const muestrasDe = (estado) =>
  Object.entries(estado.entradas).map(([dia, e]) => ({
    dia, animo: e.animo, sueno: e.sueno ?? null, estres: e.estres ?? null, juntos: e.juntos ?? null,
    manana: e.manana ?? null, orientativo: !!e.orientativo, etiquetas: e.etiquetas ?? [],
  }));

export const reglasDe = (estado) => [
  ...Object.entries(estado.entradas).filter(([, e]) => e.regla).map(([dia]) => dia),
  ...(estado.perfil.ultimaRegla ? [estado.perfil.ultimaRegla] : []),
];

/**
 * Días sin parte entre el último registrado y ayer (hoy no cuenta: aún se puede apuntar con normalidad).
 * Vacío si no hay ningún parte o si no falta nada.
 */
export function diasPendientes(estado, hoy = hoyIso()) {
  const ayer = aNum(hoy) - 1;
  const previos = Object.keys(estado.entradas).map(aNum).filter((n) => n <= ayer);
  if (!previos.length) return [];
  const ultimo = Math.max(...previos);
  return Array.from({ length: ayer - ultimo }, (_, i) => aIso(ultimo + 1 + i));
}

// ---------- Respuestas dadas desde un aviso ----------

/**
 * Apunta en `estado` las respuestas elegidas en un aviso ([{dia: 'AAAA-MM-DD', animo: 1…5}]).
 * Si el día ya tenía parte, solo cambia el tiempo y conserva los datos extra; si no, crea el parte.
 * Ignora las respuestas mal formadas. Devuelve los días apuntados, para confirmarlos a quien los envió.
 */
export function fusionaRespuestas(estado, respuestas) {
  const dias = [];
  for (const r of Array.isArray(respuestas) ? respuestas : []) {
    const dia = diaValido(r?.dia);
    const animo = Number(r?.animo);
    if (!dia || !Number.isInteger(animo) || animo < 1 || animo > 5) continue;
    const e = estado.entradas[dia];
    if (e) e.animo = animo;
    else estado.entradas[dia] = { ...entradaVacia(), animo };
    dias.push(dia);
  }
  return dias;
}

// ---------- Copia de seguridad y código de traspaso ----------
// Dos formatos: «STORMY1.» (JSON en base64url, el de siempre) y «STORMY2.» (JSON comprimido con deflate),
// más corto. Se leen los dos. El código nunca sale del dispositivo salvo que la persona lo copie y lo pegue.

const PREFIJO = 'STORMY1.';

export const aCopia = (estado) => JSON.stringify({ app: 'stormy', formato: 2, ...estado }, null, 2);

// Límites de lo que se acepta al importar: diez años de partes caben de sobra; algo mucho mayor no es una copia de Stormy.
export const LIMITES = { texto: 200 * 1024, descomprimido: 2 * 1024 * 1024, partes: 3700 };
export const ERRORES = {
  grande: 'El código o la copia es demasiado grande para ser de Stormy.',
  partes: 'La copia tiene demasiados partes para ser de Stormy.',
  invalida: 'Esto no parece una copia ni un código de Stormy.',
};

const compruebaTamano = (texto) => {
  if (String(texto).length > LIMITES.texto) throw new Error(ERRORES.grande);
};

/** Lee una copia en JSON. Lanza un error si no es una copia de Stormy. */
export function deCopia(contenido, { limitaTexto = true } = {}) {
  if (limitaTexto) compruebaTamano(contenido);
  let e;
  try {
    e = JSON.parse(contenido);
  } catch {
    throw new Error(ERRORES.invalida);
  }
  if (!e || typeof e !== 'object' || !e.perfil || typeof e.perfil !== 'object' || !e.entradas || typeof e.entradas !== 'object') throw new Error(ERRORES.invalida);
  if (Object.keys(e.entradas).length > LIMITES.partes) throw new Error(ERRORES.partes);
  return normaliza(e);
}

/** El estado entero como un texto que se copia en un móvil y se pega en otro. No pasa por ningún servidor. */
export function aCodigo(estado) {
  const bytes = new TextEncoder().encode(JSON.stringify(estado));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return PREFIJO + btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

const PREFIJO2 = 'STORMY2.';
const aBase64url = (bytes) => {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const deBase64url = (texto) => Uint8Array.from(atob(texto.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));
const flujo = async (bytes, transforma) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transforma)).arrayBuffer());

/** Descomprime leyendo poco a poco y corta en cuanto pasa de `maximo` bytes (evita las «bombas» de compresión). */
async function descomprimeConLimite(bytes, transforma, maximo = LIMITES.descomprimido) {
  const lector = new Blob([bytes]).stream().pipeThrough(transforma).getReader();
  const trozos = [];
  let total = 0;
  for (;;) {
    let paso;
    try {
      paso = await lector.read();
    } catch {
      throw new Error(ERRORES.invalida);
    }
    if (paso.done) break;
    total += paso.value.byteLength;
    if (total > maximo) {
      lector.cancel().catch(() => {});
      throw new Error(ERRORES.grande);
    }
    trozos.push(paso.value);
  }
  const salida = new Uint8Array(total);
  let i = 0;
  for (const t of trozos) {
    salida.set(t, i);
    i += t.byteLength;
  }
  return salida;
}

/** Código corto (comprimido) si el navegador sabe comprimir; si no, el de siempre. */
export async function aCodigoCorto(estado) {
  if (typeof CompressionStream === 'undefined') return aCodigo(estado);
  const bytes = new TextEncoder().encode(JSON.stringify(estado));
  return PREFIJO2 + aBase64url(await flujo(bytes, new CompressionStream('deflate-raw')));
}

/** Lee cualquier código (comprimido o de los de antes). Lanza un error si no es válido. */
export async function deCualquierCodigo(codigo) {
  compruebaTamano(codigo);
  const limpio = String(codigo).replace(/\s+/g, '');
  if (!limpio.startsWith(PREFIJO2)) return deCodigo(limpio);
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no lee códigos comprimidos.');
  let comprimido;
  try {
    comprimido = deBase64url(limpio.slice(PREFIJO2.length));
  } catch {
    throw new Error(ERRORES.invalida);
  }
  const bytes = await descomprimeConLimite(comprimido, new DecompressionStream('deflate-raw'));
  return deCopia(new TextDecoder().decode(bytes), { limitaTexto: false });
}

/** ¿Hay algo que merezca la pena llevarse? (bienvenida hecha o algún parte). */
export const tieneDatos = (estado) => !!estado.perfil.alta || Object.keys(estado.entradas).length > 0;

/**
 * Al abrir la app instalada por primera vez, sin datos: ofrecer pegar el código del navegador.
 * @param {{instalada: boolean, estado: object, decidido: boolean, nativo?: boolean}} o
 */
export const ofrecerTraspaso = ({ instalada, estado, decidido, nativo = false }) => instalada && !nativo && !decidido && !tieneDatos(estado);

export function deCodigo(codigo) {
  compruebaTamano(codigo);
  const limpio = String(codigo).replace(/\s+/g, '');
  if (!limpio.startsWith(PREFIJO)) throw new Error(ERRORES.invalida);
  let binario;
  try {
    binario = atob(limpio.slice(PREFIJO.length).replaceAll('-', '+').replaceAll('_', '/'));
  } catch {
    throw new Error(ERRORES.invalida);
  }
  return deCopia(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))));
}

// ---------- Datos de ejemplo (modo demostración y vistas de ejemplo) ----------

/** Días del modo demostración: entre 1 y 365 (30 si no es un número). */
export const diasDeEjemplo = (n) => Math.min(365, Math.max(1, Math.trunc(Number(n)) || 30));

/**
 * Estado de ejemplo con `dias` partes que terminan ayer: patrón cíclico, semanal y algo de ruido.
 * No toca el estado real: devuelve uno nuevo que solo vive en memoria.
 */
export function ejemplo(diasPedidos = 30, perfilReal = perfilVacio(), hoyTexto = hoyIso()) {
  const dias = diasDeEjemplo(diasPedidos);
  const relacion = perfilReal.relacion ?? 'pareja';
  const hoy = aNum(hoyTexto);
  const inicio = hoy - (dias + 2);
  const perfil = {
    ...perfilVacio(),
    apodo: perfilReal.apodo?.trim() || 'Ali',
    miApodo: perfilReal.miApodo?.trim() || 'Luis',
    relacion,
    parentesco: perfilReal.parentesco ?? null,
    nacimiento: perfilReal.nacimiento ?? '1992-10-14',
    sigueCiclo: !!perfilReal.sigueCiclo || relacion === 'pareja',
    ultimaRegla: aIso(inicio),
    consentimiento: hoyTexto,
    horaAviso: perfilReal.horaAviso ?? '21:30',
    alta: true,
    recorrido: true,
  };
  const entradas = {};
  const previo = { menstrual: -0.2, folicular: 0.15, ovulacion: 0.2, lutea: 0, premenstrual: -0.3 };
  let semilla = 20261126;
  const azar = () => {
    semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0;
    return semilla / 4294967296;
  };
  const nivel = (probabilidad) => (azar() < probabilidad ? Math.floor(azar() * 3) + 1 : null);
  for (let i = dias; i >= 1; i--) {
    const n = hoy - i;
    const diaCiclo = ((((n - inicio) % 28) + 28) % 28) + 1;
    let valor = 3.6 + (perfil.sigueCiclo ? previo[fase(diaCiclo, 28)] * 2.4 : 0);
    const ds = diaSemana(n);
    if (ds === 5 || ds === 6) valor += 0.6;
    if (ds === 1) valor -= 0.5;
    const sueno = nivel(0.75);
    const estres = nivel(0.7);
    const juntos = nivel(0.5);
    if (sueno === 1) valor -= 0.5;
    if (sueno === 3) valor += 0.3;
    if (estres === 3) valor -= 0.5;
    if (juntos === 3) valor += 0.3;
    if (juntos === 1) valor -= 0.4;
    valor += (azar() - 0.5) * 1.2;
    const etiquetas = azar() < 0.45 ? [ETIQUETAS[Math.floor(azar() * ETIQUETAS.length)]] : [];
    const dsManana = diaSemana(n + 1);
    const manana = azar() < 0.6 ? (dsManana === 0 || dsManana === 6 ? 'libre' : 'laborable') : null;
    const regla = perfil.sigueCiclo && diaCiclo === 1;
    entradas[aIso(n)] = {
      ...entradaVacia(), animo: Math.min(5, Math.max(1, Math.round(valor))), sueno, estres, juntos, manana, etiquetas, regla,
    };
    if (regla) perfil.ultimaRegla = aIso(n);
  }
  return { perfil, entradas, tienda: tiendaVacia() };
}

// ---------- Ir directo al registro (avisos, alarma del calendario, acceso directo) ----------

/**
 * Decide adónde lleva un aviso: al registro de hoy, para editarlo si ya tiene parte.
 * Devuelve null si aún no se ha terminado la bienvenida o si se está en el modo demostración.
 */
export function rutaAlRegistro(estado, { demo = false, hoy = hoyIso() } = {}) {
  if (demo || !estado?.perfil?.alta) return null;
  return { dia: hoy, editar: !!estado.entradas?.[hoy] };
}
