// Pruebas de Nimbo. Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Motor, aIso, aNum } from '../js/motor.js';
import { consejoDe } from '../js/contenido.js';
import { reaccion, responder, saludo, sugerenciasDe } from '../js/asistente.js';

const HOY = '2026-11-26'; // jueves
const dia = (i) => aIso(aNum(HOY) + i);

function contexto(dias, { ciclo = false, conHoy = null, apodo = 'Ana', relacion = 'pareja', parentesco = null, nacimiento = null } = {}) {
  const entradas = {};
  for (let i = dias; i >= 1; i--) {
    entradas[dia(-i)] = { animo: 3 + ((i % 3) - 1), sueno: (i % 3) + 1, estres: ((i + 1) % 3) + 1, etiquetas: i % 2 ? ['Plan juntos'] : [], nota: '', regla: false };
  }
  if (conHoy) entradas[HOY] = { animo: conHoy, sueno: null, estres: null, etiquetas: [], nota: '', regla: false };
  const perfil = { apodo, miApodo: '', relacion, parentesco, nacimiento, sigueCiclo: ciclo, duracion: 28, ultimaRegla: ciclo ? dia(-10) : null };
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

test('usa el apodo y no inventa datos que no tiene', () => {
  assert.match(responder('¿Está enfadada conmigo?', contexto(10, { apodo: 'Lucía' })).texto, /con Lucía/);
  assert.match(responder('¿En qué fase está?', contexto(10)).texto, /no está activado/);
  assert.match(responder('¿Su horóscopo?', contexto(10)).texto, /No tengo fecha de nacimiento/);
  assert.match(responder('¿Qué le afecta?', contexto(5)).texto, /necesito 14 días y llevo 5/);
  assert.match(responder('¿Aciertas mucho?', contexto(10)).texto, /Aún no presumo/);
});

test('sin apodo no presupone relación ni género', () => {
  const sinApodo = contexto(20, { apodo: '' });
  const preguntas = ['¿Está enfadada conmigo?', '¿Qué le pasa?', '¿Qué tal hoy?', '¿Y mañana?', '¿Qué le afecta?', 'hola', '¿Cuándo propongo un plan?'];
  for (const [i, q] of preguntas.entries()) {
    const t = responder(q, sinApodo, i).texto;
    assert.doesNotMatch(t, /tu pareja|\bella\b|\bél\b|tu novi[ao]|tu mujer|tu marido/i, q);
  }
  assert.match(responder('¿Está enfadada conmigo?', sinApodo).texto, /quien vive contigo/);
  // Con familia y sin apodo, se usa el parentesco elegido.
  assert.match(responder('¿Me odia?', contexto(10, { apodo: '', relacion: 'familia', parentesco: 'hermana' })).texto, /tu hermana/);
});

test('consejos y saludo se adaptan a la relación', () => {
  // Día 5 de enero: índice 0 en las dos listas, y para soleado los textos de pareja y de convivencia difieren.
  const iso = '2026-01-05';
  assert.notEqual(consejoDe(5, iso, 'pareja'), consejoDe(5, iso, 'familia'));
  assert.equal(consejoDe(5, iso, 'amigo'), consejoDe(5, iso, 'familia'));
  const conMote = contexto(3);
  conMote.perfil.miApodo = 'Luis';
  assert.match(saludo(conMote), /^¡Buenas, Luis!/);
  assert.match(saludo(contexto(3)), /^¡Buenas! /);
});

test('sugerencias: la del ciclo solo con el ciclo activado', () => {
  assert.ok(sugerenciasDe({ sigueCiclo: true }).includes('¿Cómo funciona el ciclo menstrual?'));
  assert.ok(!sugerenciasDe({ sigueCiclo: false }).includes('¿Cómo funciona el ciclo menstrual?'));
  for (const s of ['¿Qué dice el horóscopo de hoy?', '¿Qué influye en el ambiente de casa?']) assert.ok(sugerenciasDe({}).includes(s));
  const c = contexto(20, { ciclo: true });
  assert.equal(tema('¿Cómo funciona el ciclo menstrual?', c), 'ciclo-info');
  assert.equal(tema('¿Qué influye en el ambiente de casa?', c), 'factores');
  assert.equal(tema('¿Qué dice el horóscopo de hoy?', c), 'horoscopo');
  assert.equal(tema('¿En qué fase está la luna?', c), 'cielo');
});

test('reacción al registrar: una frase para cada tiempo', () => {
  for (const t of [1, 2, 3, 4, 5]) {
    assert.ok(reaccion(t, 0).length > 10);
    assert.notEqual(reaccion(t, 0), reaccion(t, 1));
  }
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

test('la tienda: Stormy responde a cada pregunta, con los datos de la tienda', async () => {
  const { tiendaVacia, COLECCIONABLES } = await import('../js/tienda.js');
  const c = { ...contexto(20), tienda: { ...tiendaVacia(), comprados: ['gafas'], pity: { sinRaro: 2, sinLegendario: 17 } }, ganados: 250 };
  const q = (p) => responder(p, c);
  assert.equal(q('¿Qué hay en la tienda?').tema, 'tienda');
  assert.match(q('¿Qué hay en la tienda?').texto, /250 rayos/);
  assert.equal(q('¿Cuántos rayos tengo?').tema, 'tienda-saldo');
  assert.match(q('¿Cuántos rayos tengo?').texto, /Tienes 250 rayos/);
  assert.equal(q('¿Qué me falta por conseguir?').tema, 'tienda-falta');
  assert.match(q('¿Qué me falta por conseguir?').texto, new RegExp(`Te faltan ${COLECCIONABLES.length - 1} de ${COLECCIONABLES.length}`));
  assert.match(q('¿Qué me falta por conseguir?').texto, /en la tienda.*solo en cofres/);
  assert.equal(q('¿Qué probabilidad hay de legendario?').tema, 'tienda-probabilidad');
  assert.match(q('¿Qué probabilidad hay de legendario?').texto, /5 %.*15 %.*30 %/);
  assert.equal(q('¿Cuándo me toca un legendario seguro?').tema, 'tienda-garantia');
  assert.match(q('¿Cuándo me toca un legendario seguro?').texto, /en 3 cofres/);
  assert.equal(q('¿Qué me recomiendas comprar?').tema, 'tienda-consejo');
  // Legendario garantizado cerca (3 cofres) y rayos para un cofre: recomienda el cofre.
  assert.match(q('¿Qué me recomiendas comprar?').texto, /cofre de nube/);
  // Lejos de la garantía: lo más barato que aún no tiene.
  const lejos = { ...c, tienda: { ...c.tienda, pity: { sinRaro: 0, sinLegendario: 0 } } };
  assert.match(responder('¿Qué me recomiendas comprar?', lejos).texto, /bigote/);
  // Con todo lo de la tienda, solo recomienda cofres; nunca un exclusivo.
  const todoTienda = { ...c, tienda: { ...c.tienda, comprados: COLECCIONABLES.filter((o) => o.via === 'tienda').map((o) => o.id), pity: { sinRaro: 0, sinLegendario: 0 } } };
  assert.match(responder('¿Qué me recomiendas comprar?', todoTienda).texto, /solo sale en cofres.*cofre de nube/);
  for (const o of COLECCIONABLES.filter((x) => x.via === 'cofre')) assert.doesNotMatch(responder('¿Qué me recomiendas comprar?', lejos).texto, new RegExp(o.nombre, 'i'));
  assert.equal(q('¿Cómo gano rayos?').tema, 'tienda-ganar');
  assert.match(q('¿Cómo gano rayos?').texto, /10 por cada parte/);
  assert.match(q('¿Cómo gano rayos?').texto, /día 7, \+100.*hoy te quedan 25/);
  assert.ok(sugerenciasDe({}).includes('¿Qué hay en la tienda?'));
  // Las preguntas de siempre siguen yendo a su sitio.
  assert.equal(q('dame un consejo').tema, 'consejo');
  assert.equal(q('¿Cuándo propongo un plan?').tema, 'plan');
});
