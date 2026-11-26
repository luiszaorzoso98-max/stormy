// Pruebas de Nimbo. Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Motor, aIso, aNum } from '../js/motor.js';
import { responder, saludo } from '../js/asistente.js';

const HOY = '2026-11-26'; // jueves
const dia = (i) => aIso(aNum(HOY) + i);

function contexto(dias, { ciclo = false, conHoy = null, nombre = 'Ana', nacimiento = null } = {}) {
  const entradas = {};
  for (let i = dias; i >= 1; i--) {
    entradas[dia(-i)] = { animo: 3 + ((i % 3) - 1), sueno: (i % 3) + 1, estres: ((i + 1) % 3) + 1, etiquetas: i % 2 ? ['Plan juntos'] : [], nota: '', regla: false };
  }
  if (conHoy) entradas[HOY] = { animo: conHoy, sueno: null, estres: null, etiquetas: [], nota: '', regla: false };
  const perfil = { nombre, nacimiento, sigueCiclo: ciclo, duracion: 28, ultimaRegla: ciclo ? dia(-10) : null };
  const motor = new Motor({
    muestras: Object.entries(entradas).map(([d, e]) => ({ dia: d, ...e })),
    reglas: ciclo ? [dia(-10)] : [], duracion: 28, sigueCiclo: ciclo, hoy: HOY,
  });
  return { motor, entradas, perfil, hoy: HOY };
}

const tema = (pregunta, ctx) => responder(pregunta, ctx).tema;

test('reconoce cada tipo de pregunta', () => {
  const c = contexto(30, { ciclo: true, nacimiento: '1992-10-14' });
  assert.equal(tema('¿Qué tal hoy?', c), 'hoy');
  assert.equal(tema('¿Y mañana?', c), 'dia');
  assert.equal(tema('y pasado mañana', c), 'dia');
  assert.equal(tema('¿Cómo pinta el sábado?', c), 'dia');
  assert.equal(tema('¿Qué tal el finde?', c), 'dia');
  assert.equal(tema('¿Cómo viene la semana?', c), 'semana');
  assert.equal(tema('¿Cuándo propongo un plan?', c), 'plan');
  assert.equal(tema('¿Qué le afecta?', c), 'factores');
  assert.equal(tema('¿Aciertas mucho?', c), 'precision');
  assert.equal(tema('¿Cómo va el mes?', c), 'mes');
  assert.equal(tema('¿En qué fase del ciclo está?', c), 'ciclo');
  assert.equal(tema('¿Por qué dices eso?', c), 'motivos');
  assert.equal(tema('¿Qué nivel tengo?', c), 'nivel');
  assert.equal(tema('¿Cuál es el mejor día de la semana?', c), 'semana');
  assert.equal(tema('dame un consejo', c), 'consejo');
  assert.equal(tema('¿Quién eres?', c), 'identidad');
  assert.equal(tema('¿Qué haces con mis datos?', c), 'privacidad');
  assert.equal(tema('¿Qué dice su horóscopo?', c), 'horoscopo');
  assert.equal(tema('¿Le compro flores?', c), 'detalle');
  assert.equal(tema('¿Está enfadada conmigo?', c), 'mente');
  assert.equal(tema('hola', c), 'saludo');
  assert.equal(tema('gracias', c), 'gracias');
  assert.equal(tema('xyzzy', c), 'desconocido');
});

test('no pronostica días futuros antes de tener el nivel', () => {
  const pocos = responder('¿Y mañana?', contexto(5));
  assert.match(pocos.texto, /necesito 14 días/);
  assert.match(pocos.texto, /llevamos 5/);

  const medio = contexto(16);
  assert.match(responder('¿Y mañana?', medio).texto, /Mañana pinta/);
  assert.match(responder('¿Qué tal el miércoles?', medio).texto, /no pronostico|no me mojo/);

  assert.match(responder('¿Qué tal el miércoles?', contexto(30)).texto, /El miércoles pinta/);
});

test('con el parte de hoy registrado dice si acertó', () => {
  const c = contexto(30, { conHoy: 5 });
  const t = responder('¿Qué tal hoy?', c).texto;
  assert.match(t, /Hoy has apuntado soleado/);
  assert.match(t, /Lo clavé|lo rocé|sin paraguas/);
});

test('usa el nombre de la pareja y no inventa datos que no tiene', () => {
  assert.match(responder('¿Qué tal hoy?', contexto(10, { nombre: 'Lucía' })).texto, /con Lucía/);
  assert.match(responder('¿Qué tal hoy?', contexto(10, { nombre: '' })).texto, /con tu pareja/);
  assert.match(responder('¿En qué fase está?', contexto(10)).texto, /no está activado/);
  assert.match(responder('¿Su horóscopo?', contexto(10)).texto, /No tengo su fecha/);
  assert.match(responder('¿Qué le afecta?', contexto(5)).texto, /necesito 14 días y llevo 5/);
  assert.match(responder('¿Aciertas mucho?', contexto(10)).texto, /Aún no presumo/);
});

test('la precisión cita cifras reales con el mes completo', () => {
  const c = contexto(30);
  const p = c.motor.precision();
  const t = responder('¿Aciertas mucho?', c).texto;
  assert.ok(t.includes(`${Math.round(p.exacto * 100)} %`));
  assert.ok(t.includes(`${Math.round(p.cercano * 100)} %`));
});

test('el plan recomienda el mejor día visible', () => {
  const c = contexto(30);
  const mejor = c.motor.pronosticos(dia(1), 7).reduce((a, b) => (b.valor > a.valor ? b : a));
  const t = responder('¿Cuándo le propongo ir a ver el partido?', c).texto;
  assert.match(t, /Tema delicado/);
  assert.ok(t.includes(String(Number(mejor.dia.slice(8)))));
});

test('el saludo cambia con los datos', () => {
  assert.match(saludo(contexto(0)), /Aún no tengo ni un parte/);
  assert.match(saludo(contexto(3)), /Llevo 3 días/);
  assert.match(saludo(contexto(20)), /20 días/);
  assert.match(saludo(contexto(30)), /mes completo/);
});

test('varía las frases según el turno y aguanta entradas raras', () => {
  const c = contexto(10);
  assert.notEqual(responder('asdf', c, 0).texto, responder('asdf', c, 1).texto);
  assert.equal(responder('', c).tema, 'vacio');
  assert.equal(responder('   ¿¿??  ', c).tema, 'vacio');
  assert.ok(responder('<script>alert(1)</script>', c).texto.length > 0);
});
