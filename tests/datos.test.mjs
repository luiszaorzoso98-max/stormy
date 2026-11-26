// Pruebas del guardado local: migración de datos antiguos, copia, código de traspaso y modo demostración.
// Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { aIso, aNum } from '../js/motor.js';
import {
  aCodigo, aCopia, borrarTodo, cargar, casaDe, deCodigo, deCopia, diasPendientes, ejemplo, extrasDe, fusionaRespuestas, guardar, muestrasDe,
  normaliza, quienDe, rayosDeEstado,
} from '../js/datos.js';

const HOY = '2026-11-26';
const dia = (i) => aIso(aNum(HOY) + i);

// localStorage mínimo en memoria, como el del navegador.
function almacenFalso() {
  const datos = new Map();
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
    datos,
  };
}

// Estado tal como lo guardaba la versión 1.x publicada.
const ANTIGUO = {
  perfil: { nombre: 'Lucía', nacimiento: '1992-10-14', sigueCiclo: true, duracion: 30, ultimaRegla: '2026-11-01', consentimiento: '2026-10-01', horaAviso: '22:00', alta: true },
  entradas: {
    '2026-11-20': { animo: 4, sueno: 3, estres: 1, etiquetas: ['Plan con amigas', 'Poco tiempo juntos'], nota: 'cena', regla: false },
    '2026-11-21': { animo: 2, etiquetas: [] },
    '2026-11-22': { animo: 9 }, // inválido: se descarta
    'no-es-fecha': { animo: 3 },
  },
};

test('migración: el nombre antiguo pasa a apodo y la relación por defecto es pareja', () => {
  const e = normaliza(ANTIGUO);
  assert.equal(e.perfil.apodo, 'Lucía');
  assert.equal(e.perfil.miApodo, '');
  assert.equal(e.perfil.relacion, 'pareja');
  assert.equal(e.perfil.parentesco, null);
  assert.equal(e.perfil.duracion, 30);
  assert.equal(e.perfil.horaAviso, '22:00');
  // Quien ya usaba la app no repite el recorrido guiado.
  assert.equal(e.perfil.recorrido, true);
  assert.ok(!('nombre' in e.perfil));
});

test('migración: los partes antiguos ganan los campos nuevos vacíos', () => {
  const e = normaliza(ANTIGUO);
  assert.deepEqual(Object.keys(e.entradas), ['2026-11-20', '2026-11-21']);
  const a = e.entradas['2026-11-20'];
  assert.equal(a.manana, null);
  assert.equal(a.orientativo, false);
  // «Poco tiempo juntos» era una etiqueta y ahora es el dato «tiempo juntos: poco».
  assert.equal(a.juntos, 1);
  assert.deepEqual(a.etiquetas, ['Plan con amigos']);
  const b = e.entradas['2026-11-21'];
  assert.deepEqual([b.sueno, b.estres, b.juntos, b.manana, b.orientativo], [null, null, null, null, false]);
});

test('migración: valores raros se corrigen y el apodo manda sobre el nombre', () => {
  const e = normaliza({
    perfil: { nombre: 'Viejo', apodo: 'Nuevo', relacion: 'familia', parentesco: 'abuela', duracion: 99, horaAviso: '9h' },
    entradas: { '2026-11-20': { animo: 3, manana: 'festivo', juntos: 7, orientativo: 1 } },
  });
  assert.equal(e.perfil.apodo, 'Nuevo');
  assert.equal(e.perfil.relacion, 'familia');
  assert.equal(e.perfil.parentesco, null);
  assert.equal(e.perfil.duracion, 40);
  assert.equal(e.perfil.horaAviso, '21:30');
  const x = e.entradas['2026-11-20'];
  assert.deepEqual([x.manana, x.juntos, x.orientativo], [null, null, true]);
  assert.deepEqual(normaliza(null), normaliza({}));
  assert.equal(normaliza({ perfil: { relacion: 'pareja', parentesco: 'madre' } }).perfil.parentesco, null);
});

test('cargar lee el formato antiguo y la clave provisional anterior', () => {
  globalThis.localStorage = almacenFalso();
  localStorage.setItem('sicielo.v1', JSON.stringify(ANTIGUO));
  assert.equal(cargar().perfil.apodo, 'Lucía');
  localStorage.setItem('stormy.v1', JSON.stringify({ perfil: { apodo: 'Ali' }, entradas: {} }));
  assert.equal(cargar().perfil.apodo, 'Ali');
  borrarTodo();
  assert.equal(localStorage.getItem('stormy.v1'), null);
  assert.equal(localStorage.getItem('sicielo.v1'), null);
  delete globalThis.localStorage;
});

test('nombres de la casa sin presuponer relación ni género', () => {
  const p = normaliza({}).perfil;
  assert.equal(casaDe(p), 'En casa');
  assert.equal(casaDe({ ...p, miApodo: 'Luis', apodo: 'Ali' }), 'Casa de Luis y Ali');
  assert.equal(casaDe({ ...p, apodo: 'Ali' }), 'Casa de Ali');
  assert.equal(quienDe(p), 'quien vive contigo');
  assert.equal(quienDe({ ...p, relacion: 'familia', parentesco: 'hijo' }), 'tu hijo');
  assert.equal(quienDe({ ...p, relacion: 'familia', parentesco: 'otro' }), 'quien vive contigo');
  assert.equal(quienDe({ ...p, apodo: ' Ali ' }), 'Ali');
});

test('copia de seguridad: ida y vuelta', () => {
  const e = normaliza(ANTIGUO);
  const copia = aCopia(e);
  assert.equal(JSON.parse(copia).app, 'stormy');
  assert.deepEqual(deCopia(copia), e);
  assert.throws(() => deCopia('{"hola":1}'));
  assert.throws(() => deCopia('no es json'));
});

test('código de traspaso: ida y vuelta, con tildes y emojis, y tolera espacios', () => {
  const e = normaliza(ANTIGUO);
  e.entradas['2026-11-21'].nota = 'Día raro ⛈️ y cañas';
  e.perfil.miApodo = 'Íñigo';
  const codigo = aCodigo(e);
  assert.match(codigo, /^STORMY1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(deCodigo(codigo), e);
  const partido = codigo.replace(/(.{40})/g, '$1\n ');
  assert.deepEqual(deCodigo(partido), e);
  assert.throws(() => deCodigo('OTRA1.abc'));
  assert.throws(() => deCodigo('STORMY1.%%%'));
});

test('modo demostración: el ejemplo no toca el perfil ni los datos guardados', () => {
  globalThis.localStorage = almacenFalso();
  const real = normaliza(ANTIGUO);
  guardar(real);
  const guardado = localStorage.getItem('stormy.v1');
  const perfilAntes = JSON.stringify(real.perfil);
  const demo = ejemplo(30, real.perfil, HOY);
  assert.equal(Object.keys(demo.entradas).length, 30);
  assert.equal(JSON.stringify(real.perfil), perfilAntes);
  assert.equal(localStorage.getItem('stormy.v1'), guardado);
  // Los días de ejemplo terminan ayer y no comparten objetos con el estado real.
  assert.equal(Object.keys(demo.entradas).sort().at(-1), dia(-1));
  assert.notEqual(demo.perfil, real.perfil);
  demo.perfil.apodo = 'cambiado';
  assert.equal(real.perfil.apodo, 'Lucía');
  delete globalThis.localStorage;
});

test('ejemplo: reproducible y con el ciclo solo si encaja', () => {
  assert.deepEqual(ejemplo(20, undefined, HOY), ejemplo(20, undefined, HOY));
  const amigos = ejemplo(20, { relacion: 'amigo', sigueCiclo: false }, HOY);
  assert.equal(amigos.perfil.sigueCiclo, false);
  assert.ok(Object.values(amigos.entradas).every((e) => !e.regla));
  assert.equal(ejemplo(60, undefined, HOY).perfil.sigueCiclo, true);
});

test('rayos del estado: partes, extras y bloques de 7', () => {
  const e = normaliza({ entradas: {} });
  for (let i = 1; i <= 7; i++) e.entradas[dia(-i)] = { ...normaliza({ entradas: { [dia(-i)]: { animo: 3 } } }).entradas[dia(-i)] };
  e.entradas[dia(-1)].sueno = 2;
  e.entradas[dia(-1)].etiquetas = ['Deporte', 'Tareas de casa'];
  e.entradas[dia(-1)].manana = 'libre';
  assert.equal(extrasDe(e.entradas[dia(-1)]), 4);
  assert.equal(rayosDeEstado(e), 7 * 10 + 4 * 2 + 20);
});

test('muestras para el motor llevan los campos nuevos', () => {
  const e = normaliza({ entradas: { [dia(-1)]: { animo: 4, juntos: 3, manana: 'especial', orientativo: true } } });
  const [m] = muestrasDe(e);
  assert.deepEqual([m.juntos, m.manana, m.orientativo], [3, 'especial', true]);
});

test('días pendientes: entre el último parte y ayer', () => {
  const vacio = normaliza({});
  assert.deepEqual(diasPendientes(vacio, HOY), []);
  const conAyer = normaliza({ entradas: { [dia(-1)]: { animo: 3 } } });
  assert.deepEqual(diasPendientes(conAyer, HOY), []);
  const faltaAyer = normaliza({ entradas: { [dia(-2)]: { animo: 3 } } });
  assert.deepEqual(diasPendientes(faltaAyer, HOY), [dia(-1)]);
  const semana = normaliza({ entradas: { [dia(-8)]: { animo: 3 } } });
  assert.equal(diasPendientes(semana, HOY).length, 7);
  // Hoy no cuenta como pendiente aunque ya esté apuntado.
  const conHoy = normaliza({ entradas: { [dia(-3)]: { animo: 3 }, [HOY]: { animo: 4 } } });
  assert.deepEqual(diasPendientes(conHoy, HOY), [dia(-2), dia(-1)]);
});

test('respuestas desde el aviso: crea el parte o solo cambia el tiempo, y devuelve los días', () => {
  const e = normaliza({ entradas: { [dia(-1)]: { animo: 2, sueno: 3, etiquetas: ['Deporte'], nota: 'cena', orientativo: true } } });
  const dias = fusionaRespuestas(e, [{ dia: dia(-1), animo: 5 }, { dia: HOY, animo: 4 }]);
  assert.deepEqual(dias, [dia(-1), HOY]);
  // El día que ya existía conserva sus datos extra; solo cambia el tiempo.
  assert.equal(e.entradas[dia(-1)].animo, 5);
  assert.equal(e.entradas[dia(-1)].sueno, 3);
  assert.deepEqual(e.entradas[dia(-1)].etiquetas, ['Deporte']);
  assert.equal(e.entradas[dia(-1)].nota, 'cena');
  // El día nuevo nace como un parte normal, con los campos vacíos.
  assert.deepEqual(e.entradas[HOY], { animo: 4, sueno: null, estres: null, juntos: null, manana: null, etiquetas: [], nota: '', regla: false, orientativo: false });
});

test('respuestas desde el aviso: ignora lo mal formado', () => {
  const e = normaliza({});
  const dias = fusionaRespuestas(e, [
    { dia: HOY, animo: 0 }, { dia: HOY, animo: 6 }, { dia: HOY, animo: 2.5 }, { dia: 'ayer', animo: 3 }, { dia: '2026-02-31', animo: 3 },
    null, 'x', { animo: 3 }, { dia: HOY, animo: '3' },
  ]);
  assert.deepEqual(dias, [HOY]);
  assert.equal(e.entradas[HOY].animo, 3);
  assert.deepEqual(fusionaRespuestas(e, null), []);
  assert.deepEqual(fusionaRespuestas(e, { dia: HOY, animo: 1 }), []);
});

test('el aviso diario nativo se guarda en el perfil y nace apagado', () => {
  assert.equal(normaliza({}).perfil.avisoActivo, false);
  assert.equal(normaliza({ perfil: { avisoActivo: true } }).perfil.avisoActivo, true);
  assert.equal(normaliza(ANTIGUO).perfil.avisoActivo, false);
});

test('código de traspaso corto (comprimido): ida y vuelta con la tienda y los regalos; lee también los antiguos', async () => {
  const { aCodigoCorto, deCualquierCodigo } = await import('../js/datos.js');
  const e = normaliza(ANTIGUO);
  e.tienda.comprados = ['gafas', 'telediario'];
  e.tienda.equipado.cara = 'gafas';
  e.tienda.eventos = [{ clave: 'nivel-7', dia: HOY, motivo: 'Nivel del día 7', cantidad: 100 }];
  e.tienda.gastados = 40;
  e.entradas['2026-11-21'].nota = 'Día raro ⛈️ y cañas';
  const corto = await aCodigoCorto(e);
  assert.match(corto, /^STORMY2\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await deCualquierCodigo(corto), e);
  assert.deepEqual(await deCualquierCodigo(corto.replace(/(.{30})/g, '$1\n')), e);
  // Un código del formato anterior se sigue leyendo.
  assert.deepEqual(await deCualquierCodigo(aCodigo(e)), e);
  // Con muchos días, el comprimido es bastante más corto.
  const grande = ejemplo(60, undefined, HOY);
  assert.ok((await aCodigoCorto(grande)).length < aCodigo(grande).length * 0.5);
  await assert.rejects(deCualquierCodigo('STORMY2.nonono'));
  await assert.rejects(deCualquierCodigo('hola'));
});

test('cuándo ofrecer pegar el código al abrir la app instalada', async () => {
  const { ofrecerTraspaso, tieneDatos } = await import('../js/datos.js');
  const vacio = normaliza({});
  const conDatos = normaliza({ perfil: { alta: true } });
  assert.equal(tieneDatos(vacio), false);
  assert.equal(tieneDatos(conDatos), true);
  assert.equal(tieneDatos(normaliza({ entradas: { [HOY]: { animo: 3 } } })), true);
  assert.equal(ofrecerTraspaso({ instalada: true, estado: vacio, decidido: false }), true);
  assert.equal(ofrecerTraspaso({ instalada: false, estado: vacio, decidido: false }), false); // en el navegador, no
  assert.equal(ofrecerTraspaso({ instalada: true, estado: conDatos, decidido: false }), false); // ya hay datos
  assert.equal(ofrecerTraspaso({ instalada: true, estado: vacio, decidido: true }), false); // ya eligió
  assert.equal(ofrecerTraspaso({ instalada: true, estado: vacio, decidido: false, nativo: true }), false); // app nativa
});
