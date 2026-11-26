// Datos del cielo calculados en el dispositivo, sin red: fase de la luna, horas de luz y estación.
// Son aproximaciones suficientes para un juego (error de la fase: en torno a un día). No entran en el pronóstico.

const MES_SINODICO = 29.530588853; // días entre dos lunas nuevas (media)
const LUNA_NUEVA_REF = Date.UTC(2000, 0, 6, 18, 14) / 864e5; // luna nueva del 6 de enero de 2000
const LATITUD = 40; // España peninsular, a grandes rasgos

const partes = (iso) => iso.split('-').map(Number);
const mediodia = (iso) => {
  const [a, m, d] = partes(iso);
  return Date.UTC(a, m - 1, d, 12) / 864e5;
};
const diaDelAno = (iso) => {
  const [a, m, d] = partes(iso);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(a, 0, 0)) / 864e5);
};

export const FASES_LUNA = [
  { id: 'nueva', grupo: 'nueva', nombre: 'Luna nueva', emoji: '🌑' },
  { id: 'creciente', grupo: 'creciente', nombre: 'Luna creciente', emoji: '🌒' },
  { id: 'cuarto-creciente', grupo: 'creciente', nombre: 'Cuarto creciente', emoji: '🌓' },
  { id: 'gibosa-creciente', grupo: 'llena', nombre: 'Gibosa creciente', emoji: '🌔' },
  { id: 'llena', grupo: 'llena', nombre: 'Luna llena', emoji: '🌕' },
  { id: 'gibosa-menguante', grupo: 'menguante', nombre: 'Gibosa menguante', emoji: '🌖' },
  { id: 'cuarto-menguante', grupo: 'menguante', nombre: 'Cuarto menguante', emoji: '🌗' },
  { id: 'menguante', grupo: 'nueva', nombre: 'Luna menguante', emoji: '🌘' },
];

export const GRUPOS_LUNA = {
  nueva: 'Luna nueva o casi', creciente: 'Luna creciente', llena: 'Luna llena o casi', menguante: 'Luna menguante',
};

/** Fase de la luna a mediodía (UTC) del día dado. `iluminada` va de 0 a 1. */
export function faseLunar(iso) {
  const edad = ((((mediodia(iso) - LUNA_NUEVA_REF) % MES_SINODICO) + MES_SINODICO) % MES_SINODICO);
  const indice = Math.floor((edad / MES_SINODICO) * 8 + 0.5) % 8;
  const iluminada = (1 - Math.cos((2 * Math.PI * edad) / MES_SINODICO)) / 2;
  return { ...FASES_LUNA[indice], edad, iluminada };
}

/** Horas entre la salida y la puesta del sol a unos 40° de latitud norte. */
export function horasDeLuz(iso, latitud = LATITUD) {
  const rad = Math.PI / 180;
  const declinacion = 23.44 * rad * Math.sin((2 * Math.PI * (284 + diaDelAno(iso))) / 365);
  const x = Math.min(1, Math.max(-1, -Math.tan(latitud * rad) * Math.tan(declinacion)));
  return (24 / Math.PI) * Math.acos(x);
}

/** Estación astronómica del hemisferio norte, con fechas fijas aproximadas. */
export function estacion(iso) {
  const [, m, d] = partes(iso);
  const c = m * 100 + d;
  if (c >= 320 && c < 621) return { id: 'primavera', nombre: 'Primavera' };
  if (c >= 621 && c < 923) return { id: 'verano', nombre: 'Verano' };
  if (c >= 923 && c < 1221) return { id: 'otono', nombre: 'Otoño' };
  return { id: 'invierno', nombre: 'Invierno' };
}

/** Texto corto de la duración del día: «9 h 35 min». */
export function textoLuz(iso) {
  const h = horasDeLuz(iso);
  const horas = Math.floor(h);
  const min = Math.round((h - horas) * 60);
  return min === 60 ? `${horas + 1} h` : `${horas} h ${min} min`;
}
