// Guardado local. Todo vive en el navegador de este dispositivo: no hay servidor ni cuentas.
import { aIso, aNum, diaSemana, fase, hoyIso } from './motor.js';
import { ETIQUETAS } from './contenido.js';

const CLAVE = 'sicielo.v1';

export const perfilVacio = () => ({
  nombre: '',
  nacimiento: null,
  sigueCiclo: false,
  duracion: 28,
  ultimaRegla: null,
  consentimiento: null,
  horaAviso: '21:30',
  alta: false,
});

export const estadoVacio = () => ({ perfil: perfilVacio(), entradas: {} });

let memoria = null; // respaldo si el navegador no deja usar localStorage (modo privado estricto)

export function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return estadoVacio();
    const e = JSON.parse(texto);
    return { perfil: { ...perfilVacio(), ...(e.perfil ?? {}) }, entradas: e.entradas ?? {} };
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
  } catch {
    /* sin almacenamiento disponible */
  }
  return estadoVacio();
}

export const nombreDe = (perfil) => perfil.nombre.trim() || 'tu pareja';

/** Número de datos extra de un parte. */
export const extrasDe = (e) =>
  (e.sueno ? 1 : 0) + (e.estres ? 1 : 0) + (e.etiquetas?.length ?? 0) + (e.nota?.trim() ? 1 : 0) + (e.regla ? 1 : 0);

export const totalExtras = (estado) => Object.values(estado.entradas).reduce((n, e) => n + extrasDe(e), 0);

export const muestrasDe = (estado) =>
  Object.entries(estado.entradas).map(([dia, e]) => ({
    dia, animo: e.animo, sueno: e.sueno ?? null, estres: e.estres ?? null, etiquetas: e.etiquetas ?? [],
  }));

export const reglasDe = (estado) => [
  ...Object.entries(estado.entradas).filter(([, e]) => e.regla).map(([dia]) => dia),
  ...(estado.perfil.ultimaRegla ? [estado.perfil.ultimaRegla] : []),
];

/** Datos de ejemplo: `dias` días terminando ayer, con patrón cíclico, semanal y algo de ruido. */
export function sembrar(estado, dias = 30) {
  const p = estado.perfil;
  if (!p.nombre) p.nombre = 'Lucía';
  if (!p.nacimiento) p.nacimiento = '1992-10-14';
  p.sigueCiclo = true;
  p.duracion = 28;
  p.consentimiento = p.consentimiento ?? hoyIso();
  p.alta = true;
  const hoy = aNum(hoyIso());
  const inicio = hoy - (dias + 2);
  p.ultimaRegla = aIso(inicio);
  estado.entradas = {};
  const previo = { menstrual: -0.2, folicular: 0.15, ovulacion: 0.2, lutea: 0, premenstrual: -0.3 };
  let semilla = 20261126;
  const azar = () => {
    semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0;
    return semilla / 4294967296;
  };
  for (let i = dias; i >= 1; i--) {
    const n = hoy - i;
    const diaCiclo = ((((n - inicio) % 28) + 28) % 28) + 1;
    let valor = 3.6 + previo[fase(diaCiclo, 28)] * 2.4;
    const ds = diaSemana(n);
    if (ds === 5 || ds === 6) valor += 0.6;
    if (ds === 1) valor -= 0.5;
    const sueno = azar() < 0.75 ? Math.floor(azar() * 3) + 1 : null;
    const estres = azar() < 0.7 ? Math.floor(azar() * 3) + 1 : null;
    if (sueno === 1) valor -= 0.5;
    if (sueno === 3) valor += 0.3;
    if (estres === 3) valor -= 0.5;
    valor += (azar() - 0.5) * 1.2;
    const etiquetas = azar() < 0.45 ? [ETIQUETAS[Math.floor(azar() * ETIQUETAS.length)]] : [];
    estado.entradas[aIso(n)] = {
      animo: Math.min(5, Math.max(1, Math.round(valor))), sueno, estres, etiquetas, nota: '', regla: diaCiclo === 1,
    };
    if (diaCiclo === 1) p.ultimaRegla = aIso(n);
  }
  return estado;
}
