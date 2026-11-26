// Pruebas del modelo. Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Motor, NIVELES, NIVELES_BASE, PESO_ORIENTATIVO, RAYOS, aIso, aNum, diaSemana, diasDePronostico, fase, nivelActual, nivelSiguiente,
  FASES, estadoHoy, marcaRegla, premioDe, racha, rayosDe,
} from '../js/motor.js';
import { APP, FASES_INFO, HORMONAS, TIEMPOS, caminoLuna, signo } from '../js/contenido.js';

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
  assert.equal(f[0].titulo, 'Mala noche');
  assert.ok(f[0].delta < 0);
  assert.ok(f.some((x) => x.titulo === 'Plan juntos' && x.delta > 0));
});

test('niveles', () => {
  assert.equal(nivelActual(0).id, 0);
  assert.equal(nivelActual(6).id, 0);
  assert.equal(nivelActual(7).id, 1);
  assert.equal(nivelActual(14).id, 2);
  assert.equal(nivelActual(21).id, 3);
  assert.equal(nivelActual(30).id, 4);
  assert.equal(nivelActual(39).id, 4);
  assert.equal(nivelActual(45).id, 5);
  assert.equal(nivelActual(50).id, 6);
  assert.equal(nivelActual(400).id, 6);
  assert.equal(nivelSiguiente(13).dias, 14);
  assert.equal(nivelSiguiente(30).dias, 40);
  assert.equal(nivelSiguiente(49).dias, 50);
  assert.equal(nivelSiguiente(50), null);
  assert.equal(diasDePronostico(13), 0);
  assert.equal(diasDePronostico(14), 3);
  assert.equal(diasDePronostico(30), 7);
});

test('lista de niveles: nombres, mundos extra y premio del día 21 sin ciclo', () => {
  assert.deepEqual(NIVELES.map((n) => n.dias), [0, 7, 14, 21, 30, 40, 50]);
  assert.equal(NIVELES[0].titulo, 'Aprendiz del tiempo');
  assert.equal(NIVELES[4].titulo, 'Oráculo del clima');
  assert.equal(NIVELES[5].titulo, 'Guardián del anticiclón');
  assert.equal(NIVELES[6].titulo, 'Leyenda del clima');
  assert.ok(!NIVELES.some((n) => /becario/i.test(n.titulo)));
  assert.deepEqual(NIVELES.filter((n) => n.extra).map((n) => n.dias), [40, 50]);
  assert.equal(NIVELES_BASE.length, 5);
  assert.equal(premioDe(NIVELES[3], true), 'Mapa del ciclo');
  assert.equal(premioDe(NIVELES[3], false), 'Factores de la casa en detalle');
  assert.equal(premioDe(NIVELES[1], false), NIVELES[1].premio);
});

test('rayos: 10 por parte, 2 por dato extra y 20 por cada bloque de 7 partes', () => {
  assert.equal(rayosDe(0, 0), 0);
  assert.equal(rayosDe(1, 0), 10);
  assert.equal(rayosDe(1, 3), 16);
  assert.equal(rayosDe(6, 0), 60);
  assert.equal(rayosDe(7, 0), 90);
  assert.equal(rayosDe(14, 5), 140 + 10 + 40);
  assert.deepEqual(RAYOS, { parte: 10, extra: 2, semana: 20 });
});

test('los rayos no cambian el pronóstico', () => {
  // El motor no recibe rayos: dos estados con los mismos partes dan el mismo pronóstico, tengan los extras que tengan.
  const a = new Motor({ muestras: muestras(20, (i) => (i % 5) + 1), hoy: dia(20) });
  const b = new Motor({ muestras: muestras(20, (i) => (i % 5) + 1).map((m) => ({ ...m, etiquetas: ['Deporte'] })), hoy: dia(20) });
  assert.equal(a.pronostico(dia(20)).valor, b.pronostico(dia(20)).valor);
});

test('los días orientativos pesan la mitad', () => {
  // Diez días normales a 3 y cinco días a 5: si son orientativos, la media se mueve menos.
  const base = muestras(10, () => 3);
  const extra = Array.from({ length: 5 }, (_, i) => ({ dia: dia(10 + i), animo: 5 }));
  const normal = new Motor({ muestras: [...base, ...extra], hoy: dia(30) });
  const orientativo = new Motor({ muestras: [...base, ...extra.map((m) => ({ ...m, orientativo: true }))], hoy: dia(30) });
  assert.equal(orientativo.muestras.filter((m) => m.peso === PESO_ORIENTATIVO).length, 5);
  assert.equal(PESO_ORIENTATIVO, 0.5);
  const lejos = dia(60); // lejos de la inercia
  assert.ok(normal.pronostico(lejos).valor > orientativo.pronostico(lejos).valor);
  assert.ok(orientativo.pronostico(lejos).valor > new Motor({ muestras: base, hoy: dia(30) }).pronostico(lejos).valor);
  // Cuentan como días (para niveles) aunque pesen menos.
  assert.equal(orientativo.dias, 15);
  // Y también pesan menos en la fiabilidad.
  assert.ok(normal.pronostico(dia(30)).fiabilidad > orientativo.pronostico(dia(30)).fiabilidad);
});

test('«qué toca mañana» mueve el pronóstico del día siguiente', () => {
  // Cada víspera de día libre se apunta «libre» y esos días salen soleados; los laborables, nublados.
  const datos = Array.from({ length: 28 }, (_, i) => {
    const libreManana = (i + 1) % 3 === 0;
    const libreHoy = i % 3 === 0 && i > 0;
    return { dia: dia(i), animo: libreHoy ? 5 : 3, manana: libreManana ? 'libre' : 'laborable' };
  });
  const conLibre = [...datos, { dia: dia(28), animo: 3, manana: 'libre' }];
  const conLaborable = [...datos, { dia: dia(28), animo: 3, manana: 'laborable' }];
  const pLibre = new Motor({ muestras: conLibre, hoy: dia(29) }).pronostico(dia(29));
  const pLaborable = new Motor({ muestras: conLaborable, hoy: dia(29) }).pronostico(dia(29));
  assert.equal(pLibre.tipo, 'libre');
  assert.equal(pLaborable.tipo, 'laborable');
  assert.ok(pLibre.efectoManana > 0.3);
  assert.ok(pLaborable.efectoManana < 0);
  assert.ok(pLibre.valor > pLaborable.valor + 0.5);
  assert.ok(pLibre.motivos.some((m) => m.includes('días libres')));
  // Sin dato de la víspera, no hay efecto.
  const sinDato = new Motor({ muestras: datos.map(({ manana, ...m }) => m), hoy: dia(28) }).pronostico(dia(28));
  assert.equal(sinDato.tipo, null);
  assert.equal(sinDato.efectoManana, 0);
});

test('factores automáticos: solo visibles con diferencia en los datos', () => {
  const plano = new Motor({ muestras: muestras(30, () => 3), hoy: dia(30) });
  assert.ok(plano.automaticos().length > 0);
  assert.ok(plano.automaticos().every((f) => !f.visible));
  const finde = new Motor({ muestras: muestras(28, (_, d) => ([0, 6].includes(diaSemana(aNum(d))) ? 5 : 3)), hoy: dia(28) });
  const f = finde.automaticos().find((x) => x.titulo === 'Fin de semana');
  assert.ok(f.visible && f.delta > 0);
});

test('factores incluyen el tiempo juntos', () => {
  const datos = muestras(10, () => 3);
  datos[0] = { dia: dia(0), animo: 5, juntos: 3 };
  datos[1] = { dia: dia(1), animo: 5, juntos: 3 };
  const f = new Motor({ muestras: datos }).factores();
  assert.equal(f[0].titulo, 'Mucho tiempo juntos');
  assert.ok(f[0].delta > 0);
});

test('racha', () => {
  const hoy = dia(10);
  assert.equal(racha([], hoy), 0);
  assert.equal(racha([dia(10), dia(9), dia(8)], hoy), 3);
  assert.equal(racha([dia(9), dia(8)], hoy), 2);
  assert.equal(racha([dia(8)], hoy), 0);
});

// ---------- Segunda revisión (48–52) ----------

test('línea de estado de «Hoy»', () => {
  assert.equal(estadoHoy(3, null), 'Previsión para hoy');
  assert.equal(estadoHoy(3, 3), '✓ Apuntado · Stormy acertó');
  assert.equal(estadoHoy(3, 4), '✓ Apuntado · Stormy lo rozó');
  assert.equal(estadoHoy(5, 1), '✓ Apuntado · Stormy no lo vio venir');
});

test('motivos en etiquetas cortas, «Pocos datos» primero', () => {
  const pocos = new Motor({ muestras: muestras(3, () => 2), reglas: [dia(0)], sigueCiclo: true, hoy: dia(3) }).pronostico(dia(3));
  assert.equal(pocos.etiquetas[0], 'Pocos datos');
  assert.ok(pocos.etiquetas.every((e) => e.length <= 24));
  const datos = muestras(28, (_, d) => ({ 6: 5, 1: 1 })[diaSemana(aNum(d))] ?? 3);
  const sabado = new Motor({ muestras: datos, hoy: dia(28) }).pronostico(dia(33));
  assert.ok(!sabado.etiquetas.includes('Pocos datos'));
  assert.equal(sabado.etiquetas[0], 'Sáb: suele despejar');
  const ciclo = new Motor({ muestras: muestras(3, () => 3), reglas: [dia(0)], sigueCiclo: true, hoy: dia(0) }).pronostico(dia(0));
  assert.ok(ciclo.etiquetas.includes('Día 1 del ciclo'));
});

test('días de regla en el calendario: apuntada, estimada y en meses siguientes', () => {
  const m = new Motor({ reglas: [BASE], duracion: 28, sigueCiclo: true, hoy: BASE });
  const registradas = new Set([BASE]);
  assert.equal(marcaRegla(m, BASE, registradas), 'registrada');
  assert.equal(marcaRegla(m, dia(1), registradas), 'estimada');
  assert.equal(marcaRegla(m, dia(4), registradas), 'estimada');
  assert.equal(marcaRegla(m, dia(5), registradas), null);
  // Próximas reglas estimadas, un mes y dos meses después.
  assert.equal(marcaRegla(m, dia(28), registradas), 'estimada');
  assert.equal(marcaRegla(m, dia(56 + 2), registradas), 'estimada');
  assert.equal(marcaRegla(m, dia(40), registradas), null);
  // Sin ciclo activado no se marca nada.
  assert.equal(marcaRegla(new Motor({ hoy: BASE }), dia(1), new Set()), null);
});

test('luna dibujada: trazado según la fase', () => {
  assert.equal(caminoLuna(0, true), '');
  const llena = caminoLuna(1, true);
  assert.match(llena, /A40\.00 40 0 0 1/);
  // Creciente: contorno iluminado por la derecha (barrido 1); menguante, por la izquierda (barrido 0).
  assert.match(caminoLuna(0.3, true), /^M50 10A40 40 0 0 1 50 90/);
  assert.match(caminoLuna(0.3, false), /^M50 10A40 40 0 0 0 50 90/);
  // Terminador: elipse con semieje proporcional a |2k − 1|.
  assert.match(caminoLuna(0.25, true), /A20\.00 40 0 0 0 50 10Z$/);
  assert.match(caminoLuna(0.75, true), /A20\.00 40 0 0 1 50 10Z$/);
  assert.match(caminoLuna(0.5, true), /A0\.00 40/);
});

test('signos con sus fechas, también Capricornio, que cruza el año', () => {
  assert.equal(signo('1992-10-14').fechas, '23 sep – 22 oct');
  assert.equal(signo('1990-12-25').nombre, 'Capricornio');
  assert.equal(signo('1990-01-19').nombre, 'Capricornio');
  assert.equal(signo('1990-01-20').nombre, 'Acuario');
  assert.equal(signo('1990-12-25').fechas, '22 dic – 19 ene');
});

test('contenido del ciclo: cada fase con sus cuatro partes y fuentes; hormonas en rango', () => {
  for (const f of FASES) {
    const info = FASES_INFO[f.id];
    assert.ok(info, f.id);
    for (const campo of ['que', 'dura', 'cuerpo', 'color']) assert.ok(info[campo]?.length > 3, `${f.id}.${campo}`);
    assert.ok(info.fuentes.length >= 2 && info.fuentes.every(([n, u]) => n && u.startsWith('https://')));
  }
  for (const h of HORMONAS) {
    for (let i = 0; i <= 20; i++) {
      const v = h.valor(i / 20);
      assert.ok(v >= 0 && v <= 1.05, `${h.id} ${v}`);
    }
  }
  // La LH tiene su pico en la ovulación (mitad del ciclo) y la progesterona después.
  const lh = HORMONAS.find((h) => h.id === 'lh');
  const pro = HORMONAS.find((h) => h.id === 'progesterona');
  assert.ok(lh.valor(0.5) > lh.valor(0.3) + 0.5);
  assert.ok(pro.valor(0.75) > pro.valor(0.25) + 0.5);
  assert.equal(APP.queHace, 'Stormy aprende cómo suele estar el ánimo en casa y te avisa de los días buenos y de los días de tormenta.');
});

test('colores de las fases sin rojo ni coral (la regla en lila)', () => {
  const rojizo = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return r > 200 && r - Math.max(g, b) > 60;
  };
  for (const f of FASES) assert.ok(!rojizo(FASES_INFO[f.id].color), `${f.id} ${FASES_INFO[f.id].color}`);
  assert.equal(FASES_INFO.menstrual.color, '#C9BFF0');
});

test('cada tiempo tiene su versión honda para el modo oscuro, legible con texto claro', () => {
  const luz = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => (Math.max(luz(a), luz(b)) + 0.05) / (Math.min(luz(a), luz(b)) + 0.05);
  for (const t of [1, 2, 3, 4, 5]) {
    const campo = TIEMPOS[t].cieloOscuro;
    assert.equal(campo.length, 3);
    for (const c of campo) assert.ok(contraste(c, '#F4F2FB') >= 7, `${t} ${c} ${contraste(c, '#F4F2FB').toFixed(1)}`);
  }
});
