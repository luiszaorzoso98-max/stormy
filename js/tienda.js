// La tienda de Stormy: catálogo, cofres y cuentas de rayos. Todo es cosmético y se paga solo con rayos,
// que se ganan apuntando partes. Nunca hay dinero real, ni cuentas atrás, ni escasez de mentira.
// Los rayos no cambian el pronóstico. Funciones puras: reciben la tienda y devuelven una copia nueva.

/** Rareza de cada objeto, con el valor en rayos de un duplicado salido de un cofre. */
export const RAREZAS = {
  comun: { nombre: 'Común', duplicado: 15 },
  raro: { nombre: 'Raro', duplicado: 40 },
  legendario: { nombre: 'Legendario', duplicado: 100 },
};

/** Tipos de objeto: dónde se equipa cada uno. El comodín no se equipa: se gasta. */
export const TIPOS = {
  cara: 'Caras de Stormy', escena: 'Escenas para «Hoy»', tema: 'Temas de color', reaccion: 'Reacciones', personalidad: 'Personalidad del chat', comodin: 'Comodín de racha',
};

/**
 * Cómo se consigue cada objeto: «tienda» se compra directamente; «cofre» solo sale en los cofres (exclusivo).
 * Reparto: todos los comunes en la tienda; los cuatro legendarios, exclusivos; los raros, mitad y mitad,
 * de modo que cada categoría tenga algo comprable y algo que solo da la suerte.
 */
export const CATALOGO = [
  { id: 'gafas', tipo: 'cara', nombre: 'Gafas de sol', rareza: 'comun', precio: 40, via: 'tienda' },
  { id: 'bufanda', tipo: 'cara', nombre: 'Bufanda y gorro de lana', rareza: 'comun', precio: 40, via: 'tienda' },
  { id: 'bigote', tipo: 'cara', nombre: 'Bigote', rareza: 'comun', precio: 30, via: 'tienda' },
  { id: 'auriculares', tipo: 'cara', nombre: 'Auriculares', rareza: 'raro', precio: 60, via: 'tienda' },
  { id: 'dormido', tipo: 'cara', nombre: 'Dormido con gorro', rareza: 'raro', precio: 70, via: 'cofre' },
  { id: 'corona', tipo: 'cara', nombre: 'Corona', rareza: 'legendario', precio: 120, via: 'cofre' },
  { id: 'esqui', tipo: 'escena', nombre: 'Pista de esquí', rareza: 'raro', precio: 80, via: 'tienda' },
  { id: 'playa', tipo: 'escena', nombre: 'Día de playa', rareza: 'raro', precio: 80, via: 'cofre' },
  { id: 'muneco', tipo: 'escena', nombre: 'Muñeco de nieve', rareza: 'comun', precio: 50, via: 'tienda' },
  { id: 'atardecer', tipo: 'escena', nombre: 'Atardecer', rareza: 'comun', precio: 50, via: 'tienda' },
  { id: 'cometa', tipo: 'escena', nombre: 'Cometa al viento', rareza: 'comun', precio: 50, via: 'tienda' },
  { id: 'estrellas', tipo: 'escena', nombre: 'Estrellas fugaces', rareza: 'legendario', precio: 110, via: 'cofre' },
  { id: 'arcoiris', tipo: 'escena', nombre: 'Arcoíris tras la lluvia', rareza: 'legendario', precio: 110, via: 'cofre' },
  { id: 'tema-atardecer', tipo: 'tema', nombre: 'Tema Atardecer', rareza: 'raro', precio: 70, via: 'cofre' },
  { id: 'tema-oceano', tipo: 'tema', nombre: 'Tema Océano', rareza: 'raro', precio: 70, via: 'tienda' },
  { id: 'tema-bosque', tipo: 'tema', nombre: 'Tema Bosque', rareza: 'raro', precio: 70, via: 'tienda' },
  { id: 'fiesta', tipo: 'reaccion', nombre: 'Reacciones de fiesta', rareza: 'comun', precio: 40, via: 'tienda' },
  { id: 'aplausos', tipo: 'reaccion', nombre: 'Reacciones con aplausos', rareza: 'raro', precio: 60, via: 'cofre' },
  { id: 'telediario', tipo: 'personalidad', nombre: 'Modo telediario', rareza: 'raro', precio: 60, via: 'tienda' },
  { id: 'abuela', tipo: 'personalidad', nombre: 'Modo abuela', rareza: 'raro', precio: 60, via: 'cofre' },
  { id: 'poeta', tipo: 'personalidad', nombre: 'Modo poeta', rareza: 'legendario', precio: 100, via: 'cofre' },
  { id: 'comodin', tipo: 'comodin', nombre: 'Comodín de racha', rareza: 'comun', precio: 60, via: 'tienda' },
];
export const objeto = (id) => CATALOGO.find((o) => o.id === id) ?? null;

/** Probabilidades de cada cofre (suman 1). Cuanto más caro, mejores. */
export const COFRES = [
  { id: 'nube', nombre: 'Cofre de nube', precio: 40, prob: { comun: 0.7, raro: 0.25, legendario: 0.05 } },
  { id: 'tormenta', nombre: 'Cofre de tormenta', precio: 90, prob: { comun: 0.45, raro: 0.4, legendario: 0.15 } },
  { id: 'arcoiris', nombre: 'Cofre arcoíris', precio: 180, prob: { comun: 0.2, raro: 0.5, legendario: 0.3 } },
];
export const cofre = (id) => COFRES.find((c) => c.id === id) ?? null;
/**
 * Garantías («pity»): si llevas 4 cofres sin nada raro, el 5.º trae al menos un raro; si llevas 19 sin legendario,
 * el 20.º trae un legendario. Los contadores se guardan y vuelven a cero cuando sale lo garantizado.
 */
export const GARANTIA = { raro: 5, legendario: 20 };
/** Objetos que pueden salir en los cofres: todo menos el comodín, que es un consumible. */
export const COLECCIONABLES = CATALOGO.filter((o) => o.tipo !== 'comodin');
/** Cuántos cofres faltan para el raro y el legendario garantizados (1 = el próximo). */
export const garantiaEn = (tienda) => ({
  raro: GARANTIA.raro - tienda.pity.sinRaro, legendario: GARANTIA.legendario - tienda.pity.sinLegendario,
});
/** Objeto destacado del día: rota cada día según la fecha, sin cuentas atrás. */
export function destacadoDe(hoy, tienda = null) {
  const lista = tienda ? enTienda(tienda).filter((o) => o.tipo !== 'comodin') : COLECCIONABLES.filter((o) => o.via === 'tienda');
  if (!lista.length) return null;
  const [a, m, d] = hoy.split('-').map(Number);
  const n = Math.round(Date.UTC(a, m - 1, d) / 864e5);
  return lista[((n % lista.length) + lista.length) % lista.length];
}

/**
 * «Puede salir» con algo de intriga: los legendarios se enseñan hasta dos (primero los tuyos; si no, dos que
 * cambian cada día) y el resto queda como «+N por descubrir»; de los raros se ven los de la tienda y los tuyos,
 * y los exclusivos que no tienes se agrupan en una sola ficha. Si ya los tienes todos, se ven todos.
 */
export function vistaPuedeSalir(cofreId, tienda, hoy) {
  const n = (() => { const [a, m, d] = hoy.split('-').map(Number); return Math.round(Date.UTC(a, m - 1, d) / 864e5); })();
  return puedeSalir(cofreId).map(({ rareza, prob, objetos }) => {
    const mio = (o) => tienda.comprados.includes(o.id);
    if (rareza === 'legendario') {
      if (objetos.every(mio)) return { rareza, prob, visibles: objetos, ocultos: 0 };
      const visibles = objetos.filter(mio).slice(0, 2);
      const resto = objetos.filter((o) => !mio(o));
      for (let i = 0; visibles.length < 2 && i < resto.length; i++) visibles.push(resto[(n + i) % resto.length]);
      const unicos = [...new Set(visibles)];
      return { rareza, prob, visibles: unicos, ocultos: objetos.length - unicos.length };
    }
    if (rareza === 'raro') {
      const visibles = objetos.filter((o) => o.via === 'tienda' || mio(o));
      return { rareza, prob, visibles, ocultos: objetos.length - visibles.length };
    }
    return { rareza, prob, visibles: [], ocultos: 0, resumen: objetos.length };
  });
}

/** Colección de una categoría: lo que se ve y cuántos exclusivos de cofre te quedan por descubrir. */
export function coleccionDe(tipo, tienda) {
  const deTipo = COLECCIONABLES.filter((o) => o.tipo === tipo);
  const ocultos = deTipo.filter((o) => o.via === 'cofre' && !tienda.comprados.includes(o.id));
  return { visibles: deTipo.filter((o) => !ocultos.includes(o)), ocultos: ocultos.length, legendario: ocultos.some((o) => o.rareza === 'legendario') };
}

/** Lo que se ve en la tienda: lo comprable que aún no tienes (el comodín siempre está). */
export const enTienda = (tienda) => CATALOGO.filter((o) => o.via === 'tienda' && (o.tipo === 'comodin' || !tienda.comprados.includes(o.id)));

/** Estado de un objeto en la colección: «puesto», «mio», «tienda» (se puede comprar) o «cofre» (solo en cofres). */
export function estadoColeccion(o, tienda) {
  if (tienda.comprados.includes(o.id)) return tienda.equipado[o.tipo] === o.id ? 'puesto' : 'mio';
  return o.via === 'cofre' ? 'cofre' : 'tienda';
}

/** «Puede salir» de un cofre: los objetos de cada rareza que tiene alguna probabilidad, legendarios primero. */
export function puedeSalir(cofreId) {
  const c = cofre(cofreId);
  if (!c) return [];
  return ['legendario', 'raro', 'comun'].filter((r) => c.prob[r] > 0).map((r) => ({
    rareza: r, prob: c.prob[r], objetos: COLECCIONABLES.filter((o) => o.rareza === r),
  }));
}
/** Generador de números reproducible (mulberry32), para pruebas y simulaciones. */
export function semilla(n) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * El cofre de bienvenida siempre trae lo mismo: el modo telediario (raro, de la tienda), para que cada persona
 * nueva tenga un segundo modo con el que probar el chat. Cuenta como raro para las garantías.
 */
export const REGALO_BIENVENIDA = 'telediario';

/** Los cofres gratis (bienvenida y semanal) son cofres de nube. */
export const COFRE_GRATIS = 'nube';

const TIPOS_EQUIPABLES = ['cara', 'escena', 'tema', 'reaccion', 'personalidad'];

export const tiendaVacia = () => ({
  comprados: [], // ids de objetos que ya son tuyos
  equipado: { cara: null, escena: null, tema: null, reaccion: null, personalidad: null },
  gastados: 0, // rayos gastados en total
  extra: 0, // rayos devueltos por duplicados
  historial: [], // cofres abiertos: { dia, cofre, premio, duplicado }
  bienvenida: false, // ya se abrió el cofre de bienvenida
  avisoModo: false, // Stormy ya contó en el chat el modo que tocó en la bienvenida
  semanales: 0, // cofres semanales ya abiertos
  comodin: { disponibles: 0, usados: [] }, // días salvados por un comodín
  pity: { sinRaro: 0, sinLegendario: 0 }, // cofres seguidos sin raro (o mejor) y sin legendario
  eventos: [], // rayos regalados: { clave, dia, motivo, cantidad }. La clave impide cobrar dos veces lo mismo.
});

const ES_DIA = /^\d{4}-\d{2}-\d{2}$/;
const entero = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);

/** Convierte cualquier tienda guardada (o ninguna, en estados antiguos) al formato actual. */
export function normalizaTienda(t) {
  const base = tiendaVacia();
  if (!t || typeof t !== 'object') return base;
  const comprados = [...new Set((Array.isArray(t.comprados) ? t.comprados : []).filter((id) => objeto(id) && objeto(id).tipo !== 'comodin'))];
  const equipado = { ...base.equipado };
  for (const tipo of TIPOS_EQUIPABLES) {
    const id = t.equipado?.[tipo];
    if (id && comprados.includes(id) && objeto(id).tipo === tipo) equipado[tipo] = id;
  }
  const usados = [...new Set((Array.isArray(t.comodin?.usados) ? t.comodin.usados : []).filter((d) => typeof d === 'string' && ES_DIA.test(d)))].sort();
  return {
    comprados,
    equipado,
    gastados: entero(t.gastados),
    extra: entero(t.extra),
    historial: (Array.isArray(t.historial) ? t.historial : []).filter((h) => h && cofre(h.cofre) && objeto(h.premio)).slice(-100)
      .map((h) => ({ dia: String(h.dia ?? '').slice(0, 10), cofre: h.cofre, premio: h.premio, duplicado: !!h.duplicado })),
    bienvenida: !!t.bienvenida,
    avisoModo: !!t.avisoModo,
    semanales: entero(t.semanales),
    comodin: { disponibles: Math.min(1, entero(t.comodin?.disponibles)), usados },
    eventos: normalizaEventos(t.eventos),
    pity: { sinRaro: Math.min(GARANTIA.raro - 1, entero(t.pity?.sinRaro)), sinLegendario: Math.min(GARANTIA.legendario - 1, entero(t.pity?.sinLegendario)) },
  };
}

/** Rayos disponibles: ganados apuntando + regalos (eventos) + devueltos por duplicados − gastados. Nunca negativo. */
export const saldo = (ganados, tienda) => Math.max(0, entero(ganados) + tienda.extra + regalados(tienda) - tienda.gastados);
export const regalados = (tienda) => (tienda.eventos ?? []).reduce((n, e) => n + e.cantidad, 0);

function normalizaEventos(lista) {
  const vistas = new Set();
  const salida = [];
  for (const e of Array.isArray(lista) ? lista : []) {
    if (!e || typeof e.clave !== 'string' || vistas.has(e.clave)) continue;
    const cantidad = entero(e.cantidad);
    if (!cantidad || cantidad > 500) continue;
    vistas.add(e.clave);
    salida.push({ clave: e.clave.slice(0, 60), dia: String(e.dia ?? '').slice(0, 10), motivo: String(e.motivo ?? '').slice(0, 40), cantidad });
  }
  return salida.slice(-1000);
}

// ---------- Más formas de ganar rayos (regalos). Cada uno se apunta con una clave única: recargar no da más. ----------

/** Bono al llegar a cada nivel, una sola vez. */
export const BONO_NIVEL = { 7: 100, 14: 150, 21: 200, 30: 300, 40: 400, 50: 500 };
/** Chat con Stormy: +5 la primera pregunta del día; después, 20 % de sorpresa de +5 o +10; tope de 25 al día. */
export const CHAT = { primera: 5, probSorpresa: 0.2, sorpresas: [5, 10], topeDia: 25 };
/** Curiosidad diaria: abrir «Tu horóscopo» o «Conoce el ciclo», +5 una vez al día cada uno. */
export const CURIOSIDAD = 5;

/** Añade un regalo si su clave no estaba. Devuelve { tienda, cantidad } (0 si ya se había dado). */
export function concede(tienda, { clave, dia, motivo, cantidad }) {
  if (!cantidad || tienda.eventos.some((e) => e.clave === clave)) return { tienda, cantidad: 0 };
  const t = copia(tienda);
  t.eventos.push({ clave, dia, motivo, cantidad });
  return { tienda: t, cantidad };
}

/** Bonos de todos los niveles alcanzados con `partes` días que aún no se habían dado. */
export function bonosNivel(tienda, partes, hoy) {
  let t = tienda;
  let total = 0;
  for (const [dias, cantidad] of Object.entries(BONO_NIVEL)) {
    if (partes < Number(dias)) continue;
    const r = concede(t, { clave: `nivel-${dias}`, dia: hoy, motivo: `Nivel del día ${dias}`, cantidad });
    t = r.tienda;
    total += r.cantidad;
  }
  return { tienda: t, cantidad: total };
}

/** Rayos ya ganados hoy en el chat. */
export const chatHoy = (tienda, hoy) => tienda.eventos.filter((e) => e.dia === hoy && e.clave.startsWith('chat-')).reduce((n, e) => n + e.cantidad, 0);

/** Regalo por una pregunta contestada en el chat. `azar` es inyectable para las pruebas. */
export function premioChat(tienda, hoy, azar = Math.random) {
  const ya = chatHoy(tienda, hoy);
  const queda = CHAT.topeDia - ya;
  if (queda <= 0) return { tienda, cantidad: 0, sorpresa: false };
  if (!tienda.eventos.some((e) => e.clave === `chat-primera-${hoy}`)) {
    const r = concede(tienda, { clave: `chat-primera-${hoy}`, dia: hoy, motivo: 'Primera pregunta del día', cantidad: Math.min(CHAT.primera, queda) });
    return { ...r, sorpresa: false };
  }
  if (azar() >= CHAT.probSorpresa) return { tienda, cantidad: 0, sorpresa: false };
  const valor = CHAT.sorpresas[Math.min(CHAT.sorpresas.length - 1, Math.floor(azar() * CHAT.sorpresas.length))];
  const n = tienda.eventos.filter((e) => e.dia === hoy && e.clave.startsWith('chat-sorpresa-')).length;
  const r = concede(tienda, { clave: `chat-sorpresa-${hoy}-${n + 1}`, dia: hoy, motivo: 'Sorpresa de Stormy', cantidad: Math.min(valor, queda) });
  return { ...r, sorpresa: r.cantidad > 0 };
}

/** Regalo por abrir «Tu horóscopo» o «Conoce el ciclo», una vez al día cada uno. */
export const premioCuriosidad = (tienda, cual, hoy) =>
  concede(tienda, { clave: `curiosidad-${cual}-${hoy}`, dia: hoy, motivo: cual === 'horoscopo' ? 'Tu horóscopo' : 'Conoce el ciclo', cantidad: CURIOSIDAD });

const copia = (t) => ({
  ...t, comprados: [...t.comprados], equipado: { ...t.equipado }, historial: [...t.historial], eventos: [...(t.eventos ?? [])],
  comodin: { ...t.comodin, usados: [...t.comodin.usados] }, pity: { ...t.pity },
});

/** Cofres gratis que se pueden abrir ahora: el de bienvenida (una vez) y uno por cada bloque de 7 partes. */
export const cofresGratis = (tienda, partes) => (tienda.bienvenida ? 0 : 1) + Math.max(0, Math.floor(partes / 7) - tienda.semanales);

const mes = (iso) => iso.slice(0, 7);

/** El comodín se puede comprar si no tienes uno guardado y no se ha usado ninguno este mes. */
export function puedeComprarComodin(tienda, hoy) {
  if (tienda.comodin.disponibles > 0) return { ok: false, motivo: 'Ya tienes un comodín guardado' };
  if (tienda.comodin.usados.some((d) => mes(d) === mes(hoy))) return { ok: false, motivo: 'Ya has usado el comodín de este mes' };
  return { ok: true };
}

/**
 * Compra directa de un objeto. Devuelve { ok, tienda, motivo?, faltan? }.
 * @param {object} tienda  @param {string} id  @param {number} ganados rayos ganados  @param {string} hoy AAAA-MM-DD
 */
export function comprar(tienda, id, ganados, hoy) {
  const o = objeto(id);
  if (!o) return { ok: false, tienda, motivo: 'Ese objeto no existe' };
  if (o.tipo !== 'comodin' && tienda.comprados.includes(id)) return { ok: false, tienda, motivo: 'Ya es tuyo' };
  if (o.via !== 'tienda') return { ok: false, tienda, motivo: 'Solo sale en cofres' };
  if (o.tipo === 'comodin') {
    const p = puedeComprarComodin(tienda, hoy);
    if (!p.ok) return { ok: false, tienda, motivo: p.motivo };
  }
  const disponible = saldo(ganados, tienda);
  if (disponible < o.precio) return { ok: false, tienda, motivo: 'Faltan rayos', faltan: o.precio - disponible };
  const t = copia(tienda);
  t.gastados += o.precio;
  if (o.tipo === 'comodin') t.comodin.disponibles = 1;
  else t.comprados.push(id);
  return { ok: true, tienda: t };
}

/** Elige la rareza según las probabilidades del cofre. `azar` devuelve un número en [0, 1). */
export function rarezaDe(prob, azar) {
  const r = azar();
  if (r < prob.comun) return 'comun';
  if (r < prob.comun + prob.raro) return 'raro';
  return 'legendario';
}

/**
 * Abre un cofre. Con `gratis` no cuesta rayos (bienvenida o semanal). Si sale algo que ya tenías,
 * se convierte en rayos. Devuelve { ok, tienda, premio, rareza, duplicado, rayos, motivo?, faltan? }.
 * @param {() => number} azar generador de números en [0, 1), inyectable para las pruebas
 */
export function abrirCofre(tienda, cofreId, ganados, { azar = Math.random, gratis = null, hoy = '' } = {}) {
  const c = cofre(cofreId);
  if (!c) return { ok: false, tienda, motivo: 'Ese cofre no existe' };
  if (gratis === 'bienvenida' && tienda.bienvenida) return { ok: false, tienda, motivo: 'El cofre de bienvenida ya se abrió' };
  if (gratis && cofreId !== COFRE_GRATIS) return { ok: false, tienda, motivo: 'Ese cofre no es gratis' };
  if (!gratis) {
    const disponible = saldo(ganados, tienda);
    if (disponible < c.precio) return { ok: false, tienda, motivo: 'Faltan rayos', faltan: c.precio - disponible };
  }
  // 1) Rareza: la de la tabla publicada, salvo que toque una garantía.
  const fijo = gratis === 'bienvenida' ? objeto(REGALO_BIENVENIDA) : null;
  const tirada = fijo ? fijo.rareza : rarezaDe(c.prob, azar);
  const rareza = fijo ? fijo.rareza : rarezaConGarantia(tirada, tienda.pity);
  // 2) Objeto: al azar entre los de esa rareza que aún no tienes; solo si ya los tienes todos, se repite.
  const deRareza = COLECCIONABLES.filter((o) => o.rareza === rareza);
  const nuevos = deRareza.filter((o) => !tienda.comprados.includes(o.id));
  const lista = nuevos.length ? nuevos : deRareza;
  const premio = fijo ?? lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
  const t = copia(tienda);
  if (!gratis) t.gastados += c.precio;
  if (gratis === 'bienvenida') t.bienvenida = true;
  if (gratis === 'semanal') t.semanales += 1;
  t.pity = siguientePity(tienda.pity, rareza);
  const duplicado = t.comprados.includes(premio.id);
  const rayos = duplicado ? RAREZAS[rareza].duplicado : 0;
  if (duplicado) t.extra += rayos;
  else t.comprados.push(premio.id);
  t.historial.push({ dia: hoy, cofre: cofreId, premio: premio.id, duplicado });
  return { ok: true, tienda: t, premio, rareza, duplicado, rayos, garantizado: rareza !== tirada };
}

const ORDEN = ['comun', 'raro', 'legendario'];
/** Aplica las garantías a la rareza que ha salido en la tirada. */
export function rarezaConGarantia(tirada, pity) {
  if (pity.sinLegendario + 1 >= GARANTIA.legendario) return 'legendario';
  if (pity.sinRaro + 1 >= GARANTIA.raro && tirada === 'comun') return 'raro';
  return tirada;
}
/** Contadores tras abrir un cofre con la rareza dada. */
export const siguientePity = (pity, rareza) => ({
  sinRaro: ORDEN.indexOf(rareza) >= 1 ? 0 : pity.sinRaro + 1,
  sinLegendario: rareza === 'legendario' ? 0 : pity.sinLegendario + 1,
});

/**
 * Tienda «de prueba» para la vista previa: una copia con el objeto puesto. La tienda original no cambia;
 * solo «Equipar» guarda.
 */
export const previsualiza = (tienda, o) => {
  const t = copia(tienda);
  if (o && TIPOS_EQUIPABLES.includes(o.tipo)) t.equipado[o.tipo] = o.id;
  return t;
};

/** Equipa un objeto tuyo, o quita lo equipado de ese tipo con `id = null` (vuelve a lo original). */
export function equipar(tienda, tipo, id) {
  if (!TIPOS_EQUIPABLES.includes(tipo)) return tienda;
  if (id && (!tienda.comprados.includes(id) || objeto(id)?.tipo !== tipo)) return tienda;
  const t = copia(tienda);
  t.equipado[tipo] = id ?? null;
  return t;
}

// ---------- Comodín de racha ----------

const DIA = 864e5;
const num = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / DIA);
};
const iso = (n) => new Date(n * DIA).toISOString().slice(0, 10);

/**
 * Racha con los días salvados por un comodín: esos días no rompen la racha, pero tampoco suman.
 * La racha termina hoy o ayer, como la normal.
 */
export function rachaProtegida(isos, protegidos, hoy) {
  const apuntados = new Set(isos.map(num));
  const salvados = new Set(protegidos.map(num));
  let cursor = num(hoy);
  if (!apuntados.has(cursor)) cursor--;
  let n = 0;
  while (apuntados.has(cursor) || salvados.has(cursor)) {
    if (apuntados.has(cursor)) n++;
    cursor--;
  }
  return n;
}

/**
 * Si tienes un comodín guardado y la racha se ha roto por un único día (con parte la víspera y el día siguiente,
 * o ayer sin parte y anteayer con parte), lo gasta en ese día. Máximo uno por mes natural.
 * Devuelve { tienda, dia } con el día salvado, o el mismo objeto y `dia: null` si no hace falta.
 */
export function aplicaComodin(tienda, isos, hoy) {
  if (tienda.comodin.disponibles < 1) return { tienda, dia: null };
  const apuntados = new Set(isos.map(num));
  const salvados = new Set(tienda.comodin.usados.map(num));
  const h = num(hoy);
  let cursor = apuntados.has(h) ? h : h - 1;
  // Recorre la racha actual hacia atrás hasta el primer hueco.
  while (apuntados.has(cursor) || salvados.has(cursor)) cursor--;
  const hueco = cursor;
  // Solo un día suelto: el anterior tiene parte, y el hueco no es hoy.
  if (hueco >= h || !apuntados.has(hueco - 1)) return { tienda, dia: null };
  const dia = iso(hueco);
  if (tienda.comodin.usados.some((d) => mes(d) === mes(dia))) return { tienda, dia: null };
  const t = copia(tienda);
  t.comodin.disponibles -= 1;
  t.comodin.usados.push(dia);
  t.comodin.usados.sort();
  return { tienda: t, dia };
}
