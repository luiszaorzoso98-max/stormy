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
const diaValido = (v) => (typeof v === 'string' && ES_DIA.test(v) && aIso(aNum(v)) === v ? v : null); // descarta fechas imposibles como el 31 de febrero

function normalizaEntrada(e) {
  const animo = Math.round(Number(e?.animo));
  if (!(animo >= 1 && animo <= 5)) return null;
  let etiquetas = (Array.isArray(e.etiquetas) ? e.etiquetas : []).filter((x) => typeof x === 'string')
    .map((x) => (x === 'Plan con amigas' ? 'Plan con amigos' : x.slice(0, 40)));
  let juntos = nivel3(e.juntos);
  // La etiqueta antigua «Poco tiempo juntos» pasa a ser el dato «tiempo juntos: poco».
  if (etiquetas.includes('Poco tiempo juntos')) {
    juntos = juntos ?? 1;
    etiquetas = etiquetas.filter((x) => x !== 'Poco tiempo juntos');
  }
  return {
    animo, sueno: nivel3(e.sueno), estres: nivel3(e.estres), juntos,
    manana: MANANAS_VALIDAS.includes(e.manana) ? e.manana : null,
    etiquetas: [...new Set(etiquetas)], nota: texto(e.nota, 280), regla: !!e.regla, orientativo: !!e.orientativo,
  };
}

/**
 * Convierte cualquier estado guardado (también los de versiones anteriores o una copia importada) al formato actual.
 * Regla de migración: `perfil.nombre` pasa a `perfil.apodo`, la relación por defecto es «pareja» y los campos
 * nuevos de cada parte (`juntos`, `manana`, `orientativo`) nacen vacíos.
 */
export function normaliza(e) {
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
    const n = diaValido(dia) && normalizaEntrada(origen[dia]);
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

const PREFIJO = 'STORMY1.';

export const aCopia = (estado) => JSON.stringify({ app: 'stormy', formato: 2, ...estado }, null, 2);

/** Lee una copia en JSON. Lanza un error si no es una copia de Stormy. */
export function deCopia(contenido) {
  const e = JSON.parse(contenido);
  if (!e || typeof e !== 'object' || typeof e.perfil !== 'object' || typeof e.entradas !== 'object') throw new Error('copia no válida');
  return normaliza(e);
}

/** El estado entero como un texto que se copia en un móvil y se pega en otro. No pasa por ningún servidor. */
export function aCodigo(estado) {
  const bytes = new TextEncoder().encode(JSON.stringify(estado));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return PREFIJO + btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function deCodigo(codigo) {
  const limpio = String(codigo).replace(/\s+/g, '');
  if (!limpio.startsWith(PREFIJO)) throw new Error('código no válido');
  const binario = atob(limpio.slice(PREFIJO.length).replaceAll('-', '+').replaceAll('_', '/'));
  return deCopia(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))));
}

// ---------- Datos de ejemplo (modo demostración y vistas de ejemplo) ----------

/**
 * Estado de ejemplo con `dias` partes que terminan ayer: patrón cíclico, semanal y algo de ruido.
 * No toca el estado real: devuelve uno nuevo que solo vive en memoria.
 */
export function ejemplo(dias = 30, perfilReal = perfilVacio(), hoyTexto = hoyIso()) {
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
