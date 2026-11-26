// Motor de pronóstico: media de la casa + día de la semana + fase del ciclo + «qué toca mañana» + inercia,
// con encogimiento cuando hay pocos datos. Los días apuntados de memoria (orientativos) pesan la mitad.
// Los días se manejan como números enteros (días desde 1970) para no depender de la zona horaria.

import { GRUPOS_LUNA, estacion, faseLunar, horasDeLuz } from './cielo.js';

const pad = (n) => String(n).padStart(2, '0');

export const aNum = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / 864e5);
};
export const aIso = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
export const hoyIso = (f = new Date()) => `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
/** 0 = domingo … 6 = sábado */
export const diaSemana = (n) => (((n + 4) % 7) + 7) % 7;

export const SEMANA = {
  orden: [1, 2, 3, 4, 5, 6, 0],
  inicial: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  corto: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  plural: ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'],
};

// Efecto de partida de cada fase, deliberadamente pequeño: se corrige con los registros de cada casa.
export const FASES = [
  { id: 'menstrual', titulo: 'Menstruación', previo: -0.2 },
  { id: 'folicular', titulo: 'Fase folicular', previo: 0.15 },
  { id: 'ovulacion', titulo: 'Ovulación', previo: 0.2 },
  { id: 'lutea', titulo: 'Fase lútea', previo: 0 },
  { id: 'premenstrual', titulo: 'Días previos', previo: -0.3 },
];
const FASE = Object.fromEntries(FASES.map((f) => [f.id, f]));

export function fase(diaCiclo, duracion) {
  const ovulacion = duracion - 14;
  if (diaCiclo <= 5) return 'menstrual';
  if (diaCiclo > duracion - 5) return 'premenstrual';
  if (Math.abs(diaCiclo - ovulacion) <= 1) return 'ovulacion';
  return diaCiclo < ovulacion ? 'folicular' : 'lutea';
}

const limita = (v, min, max) => Math.min(max, Math.max(min, v));
export const tiempoDe = (valor) => limita(Math.round(valor), 1, 5);
const suma = (xs) => xs.reduce((a, b) => a + b, 0);
const media = (xs) => (xs.length ? suma(xs) / xs.length : 0);

const MEDIA_PREVIA = 3.4;
const PESO_MEDIA_PREVIA = 2;
const ENCOGE_SEMANA = 2.5;
const ENCOGE_FASE = 4;
const ENCOGE_MANANA = 3;
export const PESO_ORIENTATIVO = 0.5;
/** Diferencia mínima (en niveles) para dar por visible un factor automático. */
export const UMBRAL_AUTOMATICO = 0.3;

export const ETIQUETA_TIPO = { laborable: 'Día laborable', libre: 'Día libre', especial: 'Plan especial' };
export const MANANAS = { laborable: 'días laborables', libre: 'días libres', especial: 'días con plan especial' };

export class Motor {
  /**
   * @param {{muestras: {dia: string, animo: number, sueno?: number|null, estres?: number|null, juntos?: number|null,
   *          manana?: string|null, orientativo?: boolean, etiquetas?: string[]}[],
   *          reglas?: string[], duracion?: number, sigueCiclo?: boolean, hoy?: string}} opciones
   */
  constructor({ muestras = [], reglas = [], duracion = 28, sigueCiclo = false, hoy = hoyIso() } = {}) {
    const porDia = new Map();
    for (const m of muestras) {
      porDia.set(m.dia, { ...m, n: aNum(m.dia), etiquetas: m.etiquetas ?? [], peso: m.orientativo ? PESO_ORIENTATIVO : 1 });
    }
    this.muestras = [...porDia.values()].sort((a, b) => a.n - b.n);
    this.porNumero = new Map(this.muestras.map((m) => [m.n, m]));
    this.reglas = [...new Set(reglas.filter(Boolean).map(aNum))].sort((a, b) => a - b);
    this.duracionPerfil = limita(duracion, 18, 45);
    this.sigueCiclo = sigueCiclo && this.reglas.length > 0;
    this.hoy = aNum(hoy);
  }

  get dias() {
    return this.muestras.length;
  }

  /** Duración observada entre reglas registradas si hay dos o más; si no, la configurada. */
  get duracion() {
    const intervalos = [];
    for (let i = 1; i < this.reglas.length; i++) {
      const d = this.reglas[i] - this.reglas[i - 1];
      if (d >= 18 && d <= 45) intervalos.push(d);
    }
    return intervalos.length ? Math.round(media(intervalos)) : this.duracionPerfil;
  }

  diaCiclo(iso) {
    if (!this.sigueCiclo) return null;
    const n = aNum(iso);
    let ref = this.reglas[0];
    for (const r of this.reglas) if (r <= n) ref = r;
    const L = this.duracion;
    return ((((n - ref) % L) + L) % L) + 1;
  }

  fase(iso) {
    const d = this.diaCiclo(iso);
    return d == null ? null : fase(d, this.duracion);
  }

  /** Lo que se apuntó la víspera en «qué toca mañana» para el día `n`. */
  tipoDe(n) {
    return this.porNumero.get(n - 1)?.manana ?? null;
  }

  pronostico(iso, excluir = null) {
    const n = aNum(iso);
    const datos = excluir ? this.muestras.filter((m) => m.dia !== excluir) : this.muestras;
    const total = datos.length;
    const pesoTotal = suma(datos.map((m) => m.peso));
    const base = (MEDIA_PREVIA * PESO_MEDIA_PREVIA + suma(datos.map((m) => m.peso * m.animo))) / (PESO_MEDIA_PREVIA + pesoTotal);
    // Efecto encogido de un grupo de días: suma ponderada de sus desvíos, tirada hacia el valor de partida.
    const efecto = (grupo, encoge, previo = 0) =>
      (encoge * previo + suma(grupo.map((m) => m.peso * (m.animo - base)))) / (encoge + suma(grupo.map((m) => m.peso)));

    const ds = diaSemana(n);
    const deSemana = datos.filter((m) => diaSemana(m.n) === ds);
    const efectoSemana = efecto(deSemana, ENCOGE_SEMANA);

    const f = this.fase(iso);
    let efectoFase = 0;
    let diasFase = 0;
    if (f) {
      const deFase = datos.filter((m) => this.fase(m.dia) === f);
      diasFase = deFase.length;
      efectoFase = efecto(deFase, ENCOGE_FASE, FASE[f].previo);
    }

    // «Qué toca mañana»: si la víspera se apuntó el tipo de día, se compara con otros días del mismo tipo.
    const tipo = this.tipoDe(n);
    let efectoManana = 0;
    let diasManana = 0;
    if (tipo) {
      const deTipo = datos.filter((m) => m.n !== n && this.tipoDe(m.n) === tipo);
      diasManana = deTipo.length;
      efectoManana = efecto(deTipo, ENCOGE_MANANA);
    }

    // Inercia: los días cercanos se parecen entre sí.
    let inercia = 0;
    const previos = datos.filter((m) => m.n < n && n - m.n <= 3);
    if (previos.length) {
      const hueco = n - previos[previos.length - 1].n;
      const desvio = suma(previos.map((m) => m.peso * (m.animo - base))) / suma(previos.map((m) => m.peso));
      inercia = 0.35 * desvio * 0.5 ** (hueco - 1);
    }

    const valor = limita(base + efectoSemana + efectoFase + efectoManana + inercia, 1, 5);

    const motivos = [];
    if (total < 7) motivos.push('Pocos datos: previsión genérica');
    if (deSemana.length >= 2 && Math.abs(efectoSemana) >= 0.2) {
      motivos.push(`Los ${SEMANA.plural[ds]} suelen venir ${efectoSemana > 0 ? 'más despejados' : 'más cubiertos'}`);
    }
    if (f && Math.abs(efectoFase) >= 0.12) motivos.push(`${FASE[f].titulo} (día ${this.diaCiclo(iso)} del ciclo)`);
    if (tipo && diasManana >= 2 && Math.abs(efectoManana) >= 0.2) {
      motivos.push(`Los ${MANANAS[tipo]} suelen venir ${efectoManana > 0 ? 'más despejados' : 'más cubiertos'}`);
    }
    if (Math.abs(inercia) >= 0.15) motivos.push(inercia > 0 ? 'Viene de días despejados' : 'Viene de días revueltos');

    // Las mismas razones en etiquetas cortas, de la que más pesa a la que menos (la vista enseña dos como mucho).
    const etiquetas = [];
    if (total < 7) etiquetas.push({ texto: 'Pocos datos', peso: Infinity });
    if (deSemana.length >= 2 && Math.abs(efectoSemana) >= 0.2) {
      etiquetas.push({ texto: `${SEMANA.corto[ds].charAt(0).toUpperCase()}${SEMANA.corto[ds].slice(1)}: ${efectoSemana > 0 ? 'suele despejar' : 'suele nublarse'}`, peso: Math.abs(efectoSemana) });
    }
    if (f && Math.abs(efectoFase) >= 0.12) etiquetas.push({ texto: `Día ${this.diaCiclo(iso)} del ciclo`, peso: Math.abs(efectoFase) });
    if (tipo && diasManana >= 2 && Math.abs(efectoManana) >= 0.2) etiquetas.push({ texto: ETIQUETA_TIPO[tipo], peso: Math.abs(efectoManana) });
    if (Math.abs(inercia) >= 0.15) etiquetas.push({ texto: inercia > 0 ? 'Viene despejado' : 'Viene revuelto', peso: Math.abs(inercia) });
    etiquetas.sort((a, b) => b.peso - a.peso);

    const parte = Math.min(pesoTotal, 30) / 30;
    let fiabilidad = 0.12 + 0.58 * parte + (0.1 * Math.min(deSemana.length, 4)) / 4;
    fiabilidad += f ? (0.12 * Math.min(diasFase, 5)) / 5 : 0.06 * parte;
    fiabilidad *= 0.94 ** Math.max(0, n - this.hoy);

    return { dia: iso, valor, tiempo: tiempoDe(valor), fiabilidad: limita(fiabilidad, 0.05, 0.95), fase: f, tipo, efectoManana, motivos, etiquetas: etiquetas.map((e) => e.texto) };
  }

  pronosticos(desdeIso, dias) {
    const n = aNum(desdeIso);
    return Array.from({ length: dias }, (_, i) => this.pronostico(aIso(n + i)));
  }

  /** Validación dejando un día fuera. Necesita al menos una semana de datos. */
  precision() {
    if (this.dias < 7) return null;
    let exactos = 0;
    let cercanos = 0;
    let error = 0;
    for (const m of this.muestras) {
      const p = this.pronostico(m.dia, m.dia);
      error += Math.abs(p.valor - m.animo);
      if (p.tiempo === m.animo) exactos++;
      if (Math.abs(p.tiempo - m.animo) <= 1) cercanos++;
    }
    const n = this.dias;
    return { exacto: exactos / n, cercano: cercanos / n, error: error / n, dias: n };
  }

  get mediaGeneral() {
    return this.dias ? media(this.muestras.map((m) => m.animo)) : null;
  }

  mediasPorDiaSemana() {
    return SEMANA.orden.map((ds) => {
      const g = this.muestras.filter((m) => diaSemana(m.n) === ds);
      return { id: ds, titulo: SEMANA.corto[ds], media: media(g.map((m) => m.animo)), dias: g.length };
    });
  }

  mediasPorFase() {
    if (!this.sigueCiclo) return [];
    return FASES.map((f) => {
      const g = this.muestras.filter((m) => this.fase(m.dia) === f.id);
      return { id: f.id, titulo: f.titulo, media: media(g.map((m) => m.animo)), dias: g.length };
    });
  }

  /** Media de cada semana (de lunes a domingo) con algún parte; las más recientes al final. */
  mediasPorSemana(cuantas = 6) {
    const semanas = new Map();
    for (const m of this.muestras) {
      const lunes = m.n - ((diaSemana(m.n) + 6) % 7);
      if (!semanas.has(lunes)) semanas.set(lunes, []);
      semanas.get(lunes).push(m.animo);
    }
    return [...semanas.entries()].sort(([a], [b]) => a - b).slice(-cuantas)
      .map(([lunes, xs]) => ({ lunes: aIso(lunes), media: media(xs), dias: xs.length }));
  }

  /** Noche, estrés, tiempo juntos y etiquetas con al menos dos días, ordenados por cuánto mueven el clima de casa. */
  factores() {
    const general = this.mediaGeneral;
    if (general == null) return [];
    const grupos = [
      ['Buena noche', this.muestras.filter((m) => m.sueno === 3)],
      ['Mala noche', this.muestras.filter((m) => m.sueno === 1)],
      ['Día muy estresante', this.muestras.filter((m) => m.estres === 3)],
      ['Día poco estresante', this.muestras.filter((m) => m.estres === 1)],
      ['Mucho tiempo juntos', this.muestras.filter((m) => m.juntos === 3)],
      ['Poco tiempo juntos', this.muestras.filter((m) => m.juntos === 1)],
    ];
    const etiquetas = [...new Set(this.muestras.flatMap((m) => m.etiquetas))].sort();
    for (const e of etiquetas) grupos.push([e, this.muestras.filter((m) => m.etiquetas.includes(e))]);
    return grupos
      .filter(([, g]) => g.length >= 2)
      .map(([titulo, g]) => ({ titulo, delta: media(g.map((m) => m.animo)) - general, dias: g.length }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  /**
   * Factores que no hay que apuntar: luna, horas de luz, estación y día de la semana.
   * No entran en el pronóstico. `visible` solo si los datos de la casa muestran diferencia (dos días o más
   * dentro y fuera del grupo, y al menos UMBRAL_AUTOMATICO niveles de distancia con la media).
   */
  automaticos() {
    const general = this.mediaGeneral;
    if (general == null) return [];
    const finde = (m) => [0, 6].includes(diaSemana(m.n));
    const grupos = [
      ...Object.entries(GRUPOS_LUNA).map(([id, titulo]) => ['luna', titulo, (m) => faseLunar(m.dia).grupo === id]),
      ['luz', 'Días largos (12 h de luz o más)', (m) => horasDeLuz(m.dia) >= 12],
      ['luz', 'Días cortos (menos de 12 h de luz)', (m) => horasDeLuz(m.dia) < 12],
      ...['Primavera', 'Verano', 'Otoño', 'Invierno'].map((e) => ['estacion', e, (m) => estacion(m.dia).nombre === e]),
      ['semana', 'Fin de semana', finde],
      ['semana', 'Entre semana', (m) => !finde(m)],
    ];
    return grupos
      .map(([tipo, titulo, es]) => {
        const g = this.muestras.filter(es);
        const delta = g.length ? media(g.map((m) => m.animo)) - general : 0;
        const comparable = g.length >= 2 && this.dias - g.length >= 2;
        return { tipo, titulo, delta, dias: g.length, visible: comparable && Math.abs(delta) >= UMBRAL_AUTOMATICO };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }
}

// ---------- Niveles ----------

export const OBJETIVO = 30;

// Los cinco primeros son el mes de aprendizaje; los dos últimos, mundos extra.
export const NIVELES = [
  { id: 0, dias: 0, titulo: 'Aprendiz del tiempo', premio: 'Parte diario y calendario', icono: 'termometro' },
  { id: 1, dias: 7, titulo: 'Observador de nubes', premio: 'Patrón semanal', icono: 'prismaticos' },
  { id: 2, dias: 14, titulo: 'Meteorólogo local', premio: 'Pronóstico a 3 días y factores', icono: 'nubesol' },
  { id: 3, dias: 21, titulo: 'Cazador de borrascas', premio: 'Mapa del ciclo', premioSinCiclo: 'Factores de la casa en detalle', icono: 'tornado' },
  { id: 4, dias: 30, titulo: 'Oráculo del clima', premio: 'Pronóstico a 7 días y precisión del modelo', icono: 'destello' },
  { id: 5, dias: 40, titulo: 'Guardián del anticiclón', premio: 'Comparar unas semanas con otras', icono: 'escudo', extra: true },
  { id: 6, dias: 50, titulo: 'Leyenda del clima', premio: 'Resumen de la casa para compartir y aspecto especial de Stormy', icono: 'corona', extra: true },
];
export const NIVELES_BASE = NIVELES.filter((n) => !n.extra);

export const premioDe = (nivel, conCiclo) => (!conCiclo && nivel.premioSinCiclo) || nivel.premio;
export const nivelActual = (dias) => [...NIVELES].reverse().find((n) => dias >= n.dias) ?? NIVELES[0];
export const nivelSiguiente = (dias) => NIVELES.find((n) => dias < n.dias) ?? null;
export const diasDePronostico = (dias) => (dias >= 30 ? 7 : dias >= 14 ? 3 : 0);

// ---------- Rayos: los puntos del juego. Solo se acumulan y se enseñan; no cambian el pronóstico. ----------

export const RAYOS = { parte: 10, extra: 2, semana: 20 };
/** @param {number} partes días registrados  @param {number} extras datos extra acumulados */
export const rayosDe = (partes, extras) => partes * RAYOS.parte + extras * RAYOS.extra + Math.floor(partes / 7) * RAYOS.semana;

/** Días seguidos registrados que terminan hoy o ayer. */
export function racha(isos, hoy = hoyIso()) {
  const conjunto = new Set(isos.map(aNum));
  let cursor = aNum(hoy);
  if (!conjunto.has(cursor)) cursor--;
  let n = 0;
  while (conjunto.has(cursor)) {
    n++;
    cursor--;
  }
  return n;
}

// ---------- Estado de «Hoy» y días de regla en el calendario ----------

/** Línea de estado bajo el título de «Hoy». `apuntado` es el tiempo registrado o null. */
export function estadoHoy(previsto, apuntado) {
  if (apuntado == null) return 'Previsión para hoy';
  const d = Math.abs(previsto - apuntado);
  return `✓ Apuntado · ${d === 0 ? 'Stormy acertó' : d === 1 ? 'Stormy lo rozó' : 'Stormy no lo vio venir'}`;
}

/**
 * Cómo se marca un día en el calendario con el ciclo activado: «registrada» si ese día se apuntó el inicio
 * de la regla, «estimada» si cae en la menstruación calculada por Stormy (también en meses futuros), o null.
 * @param {Motor} motor  @param {string} iso  @param {Set<string>} registradas días con la regla apuntada
 */
export function marcaRegla(motor, iso, registradas) {
  if (registradas.has(iso)) return 'registrada';
  return motor.fase(iso) === 'menstrual' ? 'estimada' : null;
}
