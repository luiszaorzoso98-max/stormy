// Pruebas del modelo. Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Motor, aIso, aNum, diaSemana, diasDePronostico, fase, nivelActual, nivelSiguiente, racha,
} from '../js/motor.js';

const BASE = '2026-11-02'; // lunes
const dia = (i) => aIso(aNum(BASE) + i);
const muestras = (n, animo) => Array.from({ length: n }, (_, i) => ({ dia: dia(i), animo: animo(i, dia(i)) }));

test('fechas: ida y vuelta y día de la semana', () => {
  assert.equal(aIso(aNum('2026-11-26')), '2026-11-26');
  assert.equal(diaSemana(aNum(BASE)), 1);
  assert.equal(diaSemana(aNum('2026-11-01')), 0);
});

test('fases del ciclo', () => {
  assert.equal(fase(1, 28), 'menstrual');
  assert.equal(fase(5, 28), 'menstrual');
  assert.equal(fase(9, 28), 'folicular');
  assert.equal(fase(14, 28), 'ovulacion');
  assert.equal(fase(19, 28), 'lutea');
  assert.equal(fase(24, 28), 'premenstrual');
  assert.equal(fase(28, 28), 'premenstrual');
});

test('el día del ciclo da la vuelta', () => {
  const m = new Motor({ reglas: [BASE], sigueCiclo: true, hoy: BASE });
  assert.equal(m.diaCiclo(dia(0)), 1);
  assert.equal(m.diaCiclo(dia(27)), 28);
  assert.equal(m.diaCiclo(dia(28)), 1);
  assert.equal(m.diaCiclo(dia(-1)), 28);
});

test('sin reglas registradas no hay fase', () => {
  const m = new Motor({ sigueCiclo: true, hoy: BASE });
  assert.equal(m.diaCiclo(BASE), null);
  assert.equal(m.pronostico(BASE).fase, null);
});

test('duración observada del ciclo', () => {
  const m = new Motor({ reglas: [BASE, dia(30)], sigueCiclo: true, hoy: BASE });
  assert.equal(m.duracion, 30);
});

test('aprende el patrón semanal', () => {
  const datos = muestras(28, (_, d) => ({ 6: 5, 1: 1 })[diaSemana(aNum(d))] ?? 3);
  const m = new Motor({ muestras: datos, hoy: dia(28) });
  const sabado = m.pronostico(dia(33));
  const lunes = m.pronostico(dia(35));
  assert.ok(sabado.valor > lunes.valor + 1);
  assert.ok(sabado.tiempo >= 4);
  assert.ok(lunes.tiempo <= 2);
});

test('aprende el patrón del ciclo', () => {
  const datos = muestras(56, (i) => ({ premenstrual: 2, ovulacion: 5 })[fase((i % 28) + 1, 28)] ?? 3);
  const m = new Motor({ muestras: datos, reglas: [dia(0), dia(28)], sigueCiclo: true, hoy: dia(56) });
  const previo = m.pronostico(dia(56 + 25));
  const ovulacion = m.pronostico(dia(56 + 13));
  assert.equal(previo.fase, 'premenstrual');
  assert.equal(ovulacion.fase, 'ovulacion');
  assert.ok(ovulacion.valor > previo.valor + 1);
});

test('el valor siempre está entre 1 y 5', () => {
  const m = new Motor({ muestras: muestras(10, () => 5), hoy: dia(10) });
  for (let i = 0; i < 20; i++) {
    const v = m.pronostico(dia(i)).valor;
    assert.ok(v >= 1 && v <= 5);
  }
  const vacio = new Motor({ hoy: BASE }).pronostico(BASE);
  assert.ok(vacio.valor >= 1 && vacio.valor <= 5);
  assert.ok(vacio.motivos.some((t) => t.includes('Pocos datos')));
});

test('la fiabilidad crece con los datos y baja con el horizonte', () => {
  const pocos = new Motor({ muestras: muestras(3, () => 3), hoy: dia(3) });
  const muchos = new Motor({ muestras: muestras(30, () => 3), hoy: dia(30) });
  assert.ok(muchos.pronostico(dia(30)).fiabilidad > pocos.pronostico(dia(3)).fiabilidad + 0.3);
  assert.ok(muchos.pronostico(dia(30)).fiabilidad > muchos.pronostico(dia(36)).fiabilidad);
});

test('la precisión necesita una semana', () => {
  assert.equal(new Motor({ muestras: muestras(6, () => 3) }).precision(), null);
  const p = new Motor({ muestras: muestras(30, () => 4) }).precision();
  assert.equal(p.exacto, 1);
  assert.ok(p.error < 0.2);
});

test('un día repetido cuenta una vez', () => {
  const m = new Motor({ muestras: [{ dia: BASE, animo: 2 }, { dia: BASE, animo: 4 }] });
  assert.equal(m.dias, 1);
});

test('factores ordenados por impacto', () => {
  const datos = muestras(12, () => 3);
  datos[0] = { dia: dia(0), animo: 1, sueno: 1 };
  datos[1] = { dia: dia(1), animo: 1, sueno: 1 };
  datos[2] = { dia: dia(2), animo: 4, etiquetas: ['Plan juntos'] };
  datos[3] = { dia: dia(3), animo: 4, etiquetas: ['Plan juntos'] };
  const f = new Motor({ muestras: datos }).factores();
  assert.equal(f[0].titulo, 'Durmió mal');
  assert.ok(f[0].delta < 0);
  assert.ok(f.some((x) => x.titulo === 'Plan juntos' && x.delta > 0));
});

test('niveles', () => {
  assert.equal(nivelActual(0).id, 0);
  assert.equal(nivelActual(6).id, 0);
  assert.equal(nivelActual(7).id, 1);
  assert.equal(nivelActual(14).id, 2);
  assert.equal(nivelActual(21).id, 3);
  assert.equal(nivelActual(45).id, 4);
  assert.equal(nivelSiguiente(13).dias, 14);
  assert.equal(nivelSiguiente(30), null);
  assert.equal(diasDePronostico(13), 0);
  assert.equal(diasDePronostico(14), 3);
  assert.equal(diasDePronostico(30), 7);
});

test('racha', () => {
  const hoy = dia(10);
  assert.equal(racha([], hoy), 0);
  assert.equal(racha([dia(10), dia(9), dia(8)], hoy), 3);
  assert.equal(racha([dia(9), dia(8)], hoy), 2);
  assert.equal(racha([dia(8)], hoy), 0);
});
