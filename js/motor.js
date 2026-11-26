// Motor de pronóstico. Mismo modelo que la app de iPhone (Barometro/Modelo/Motor.swift):
// media personal + día de la semana + fase del ciclo + inercia, con encogimiento cuando hay pocos datos.
// Los días se manejan como números enteros (días desde 1970) para no depender de la zona horaria.

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

// Efecto de partida de cada fase, deliberadamente pequeño: se corrige con los registros de cada pareja.
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

export class Motor {
  /**
   * @param {{muestras: {dia: string, animo: number, sueno?: number|null, estres?: number|null, etiquetas?: string[]}[],
   *          reglas?: string[], duracion?: number, sigueCiclo?: boolean, hoy?: string}} opciones
   */
  constructor({ muestras = [], reglas = [], duracion = 28, sigueCiclo = false, hoy = hoyIso() } = {}) {
    const porDia = new Map();
    for (const m of muestras) porDia.set(m.dia, { ...m, n: aNum(m.dia), etiquetas: m.etiquetas ?? [] });
    this.muestras = [...porDia.values()].sort((a, b) => a.n - b.n);
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

  pronostico(iso, excluir = null) {
    const n = aNum(iso);
    const datos = excluir ? this.muestras.filter((m) => m.dia !== excluir) : this.muestras;
    const total = datos.length;
    const base = (MEDIA_PREVIA * PESO_MEDIA_PREVIA + suma(datos.map((m) => m.animo))) / (PESO_MEDIA_PREVIA + total);

    const ds = diaSemana(n);
    const resSemana = datos.filter((m) => diaSemana(m.n) === ds).map((m) => m.animo - base);
    const efectoSemana = suma(resSemana) / (resSemana.length + ENCOGE_SEMANA);

    const f = this.fase(iso);
    let efectoFase = 0;
    let diasFase = 0;
    if (f) {
      const res = datos.filter((m) => this.fase(m.dia) === f).map((m) => m.animo - base);
      diasFase = res.length;
      efectoFase = (ENCOGE_FASE * FASE[f].previo + suma(res)) / (ENCOGE_FASE + res.length);
    }

    // Inercia: los días cercanos se parecen entre sí.
    let inercia = 0;
    const previos = datos.filter((m) => m.n < n && n - m.n <= 3);
    if (previos.length) {
      const hueco = n - previos[previos.length - 1].n;
      inercia = 0.35 * media(previos.map((m) => m.animo - base)) * 0.5 ** (hueco - 1);
    }

    const valor = limita(base + efectoSemana + efectoFase + inercia, 1, 5);

    const motivos = [];
    if (total < 7) motivos.push('Pocos datos: previsión genérica');
    if (resSemana.length >= 2 && Math.abs(efectoSemana) >= 0.2) {
      motivos.push(`Los ${SEMANA.plural[ds]} suelen venir ${efectoSemana > 0 ? 'más despejados' : 'más cubiertos'}`);
    }
    if (f && Math.abs(efectoFase) >= 0.12) motivos.push(`${FASE[f].titulo} (día ${this.diaCiclo(iso)} del ciclo)`);
    if (Math.abs(inercia) >= 0.15) motivos.push(inercia > 0 ? 'Viene de días despejados' : 'Viene de días revueltos');

    const parte = Math.min(total, 30) / 30;
    let fiabilidad = 0.12 + 0.58 * parte + (0.1 * Math.min(resSemana.length, 4)) / 4;
    fiabilidad += f ? (0.12 * Math.min(diasFase, 5)) / 5 : 0.06 * parte;
    fiabilidad *= 0.94 ** Math.max(0, n - this.hoy);

    return { dia: iso, valor, tiempo: tiempoDe(valor), fiabilidad: limita(fiabilidad, 0.05, 0.95), fase: f, motivos };
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

  /** Sueño, estrés y etiquetas con al menos dos días, ordenados por cuánto mueven el ánimo. */
  factores() {
    const general = this.mediaGeneral;
    if (general == null) return [];
    const grupos = [
      ['Durmió bien', this.muestras.filter((m) => m.sueno === 3)],
      ['Durmió mal', this.muestras.filter((m) => m.sueno === 1)],
      ['Estrés alto', this.muestras.filter((m) => m.estres === 3)],
      ['Estrés bajo', this.muestras.filter((m) => m.estres === 1)],
    ];
    const etiquetas = [...new Set(this.muestras.flatMap((m) => m.etiquetas))].sort();
    for (const e of etiquetas) grupos.push([e, this.muestras.filter((m) => m.etiquetas.includes(e))]);
    return grupos
      .filter(([, g]) => g.length >= 2)
      .map(([titulo, g]) => ({ titulo, delta: media(g.map((m) => m.animo)) - general, dias: g.length }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }
}

// ---------- Niveles ----------

export const OBJETIVO = 30;

export const NIVELES = [
  { id: 0, dias: 0, titulo: 'Becario del tiempo', premio: 'Parte diario y calendario', icono: 'termometro' },
  { id: 1, dias: 7, titulo: 'Observador de nubes', premio: 'Patrón semanal', icono: 'prismaticos' },
  { id: 2, dias: 14, titulo: 'Meteorólogo local', premio: 'Pronóstico a 3 días y factores', icono: 'nubesol' },
  { id: 3, dias: 21, titulo: 'Cazador de borrascas', premio: 'Mapa del ciclo', icono: 'tornado' },
  { id: 4, dias: 30, titulo: 'Oráculo del clima', premio: 'Pronóstico a 7 días y precisión del modelo', icono: 'destello' },
];

export const nivelActual = (dias) => [...NIVELES].reverse().find((n) => dias >= n.dias) ?? NIVELES[0];
export const nivelSiguiente = (dias) => NIVELES.find((n) => dias < n.dias) ?? null;
export const diasDePronostico = (dias) => (dias >= 30 ? 7 : dias >= 14 ? 3 : 0);

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
