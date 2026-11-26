// Respuestas creativas cuando Stormy no tiene respuesta. Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { AYUDA, RESPUESTAS_LIBRES, eligeLibre, esSerio, temaLibre } from '../js/respuestas.js';
import { responder } from '../js/asistente.js';
import { Motor } from '../js/motor.js';

const limpia = (t) => ` ${t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
const ctx = (extra = {}) => ({ motor: new Motor({ hoy: '2026-11-26' }), entradas: {}, perfil: { apodo: '', relacion: 'pareja' }, hoy: '2026-11-26', ...extra });

test('hay unas 60 respuestas y cada tema tiene entre 4 y 6, salvo el montón general', () => {
  const total = Object.values(RESPUESTAS_LIBRES).reduce((n, l) => n + l.length, 0);
  assert.ok(total >= 55 && total <= 70, total);
  for (const [tema, lista] of Object.entries(RESPUESTAS_LIBRES)) {
    if (tema !== 'general') assert.ok(lista.length >= 4 && lista.length <= 6, tema);
  }
});

test('cada respuesta acaba proponiendo una pregunta concreta y no nombra marcas', () => {
  for (const lista of Object.values(RESPUESTAS_LIBRES)) {
    for (const t of lista) {
      assert.match(t, /«¿[^»]+\?»/, t);
      assert.doesNotMatch(t, /chatgpt|openai|claude|anthropic|google|gemini|siri|alexa|copilot|microsoft|apple/i, t);
      assert.doesNotMatch(t, /\b(ella|él)\b|tu mujer|tu marido/i, t);
    }
  }
});

test('detecta cada tema', () => {
  const casos = {
    ia: '¿Eres una IA?', chiste: 'Cuéntame un chiste', insulto: 'eres tonto', comida: '¿Qué hago de comida?', deporte: '¿Quién gana la liga de fútbol?',
    fuera: '¿Va a llover en la calle?', amor: '¿Cómo ligo con alguien? Me gusta alguien', trabajo: 'Mi jefe me agobia', dinero: '¿Cómo ahorro dinero?',
    general: 'xyzzy plof',
  };
  for (const [tema, texto] of Object.entries(casos)) assert.equal(temaLibre(limpia(texto)), tema, texto);
  // Y llegan así a través del chat.
  assert.equal(responder('¿Quién te ha creado?', ctx()).tema, 'libre-ia');
  assert.equal(responder('cuéntame un chiste', ctx()).tema, 'libre-chiste');
  assert.equal(responder('¿qué hacemos de cenar hoy? tengo hambre', ctx()).tema, 'libre-comida');
  // Las intenciones de siempre no cambian.
  assert.equal(responder('¿Cuándo propongo un plan para cenar?', ctx()).tema, 'plan');
  assert.equal(responder('gracias', ctx()).tema, 'gracias');
});

test('no repite hasta agotar el montón, y es reproducible', () => {
  for (const tema of Object.keys(RESPUESTAS_LIBRES)) {
    const memoria = {};
    const vistas = Array.from({ length: RESPUESTAS_LIBRES[tema].length }, () => eligeLibre(tema, memoria, Math.random));
    assert.equal(new Set(vistas).size, RESPUESTAS_LIBRES[tema].length, tema);
    // Al agotarse, vuelve a empezar.
    assert.ok(RESPUESTAS_LIBRES[tema].includes(eligeLibre(tema, memoria, Math.random)));
  }
  const a = eligeLibre('general', {}, () => 0.3);
  assert.equal(eligeLibre('general', {}, () => 0.3), a);
  // Por el chat, con la memoria de la sesión, tampoco se repite.
  const memoria = {};
  const textos = Array.from({ length: 10 }, (_, i) => responder('xyzzy', ctx({ memoria }), i).texto);
  assert.equal(new Set(textos).size, 10);
});

test('lo serio nunca es una broma: se responde con calma y con los teléfonos de ayuda', () => {
  const serias = ['Mi pareja me pega', 'Tengo miedo en casa', 'No me siento segura en casa', 'Me quiero morir', 'He pensado en suicidarme', 'Me amenaza cuando bebe'];
  for (const t of serias) {
    assert.ok(esSerio(limpia(t)), t);
    const r = responder(t, ctx({ memoria: {} }));
    assert.equal(r.tema, 'serio', t);
    assert.equal(r.texto, AYUDA);
  }
  assert.match(AYUDA, /112/);
  assert.match(AYUDA, /016/);
  assert.match(AYUDA, /024/);
  for (const lista of Object.values(RESPUESTAS_LIBRES)) assert.ok(!lista.includes(AYUDA));
  assert.ok(!esSerio(limpia('¿Qué tal hoy?')));
});
