// Pruebas de la tienda de Stormy: saldo, compras, cofres (con azar inyectable), comodín y migración.
// Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGO, COFRES, COLECCIONABLES, RAREZAS, abrirCofre, aplicaComodin, cofresGratis, comprar, destacadoDe, equipar, garantiaEn,
  coleccionDe, enTienda, estadoColeccion, vistaPuedeSalir, normalizaTienda, puedeComprarComodin, puedeSalir, rarezaConGarantia, semilla, siguientePity,
  rachaProtegida, rarezaDe, saldo, tiendaVacia,
} from '../js/tienda.js';
import { TEMAS_HOY, TIEMPOS, avatarNimbo, COMPLEMENTOS, ESCENAS, MINIATURAS } from '../js/contenido.js';
import { conPersonalidad, PERSONALIDADES } from '../js/asistente.js';
import { ejemplo, normaliza, rayosDisponibles, rachaDe } from '../js/datos.js';
import { aIso, aNum } from '../js/motor.js';

const HOY = '2026-11-26';
const dia = (i) => aIso(aNum(HOY) + i);
/** Azar de mentira: devuelve los valores dados en orden. */
const secuencia = (...xs) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

test('catálogo: precios baratos, rarezas y legendarios acordados', () => {
  for (const o of CATALOGO) {
    assert.ok(o.precio >= 30 && o.precio <= 120, `${o.id} ${o.precio}`);
    assert.ok(RAREZAS[o.rareza], o.id);
  }
  const legendarios = CATALOGO.filter((o) => o.rareza === 'legendario').map((o) => o.id).sort();
  assert.deepEqual(legendarios, ['arcoiris', 'corona', 'estrellas', 'poeta']);
  assert.deepEqual(COFRES.map((c) => [c.id, c.precio]), [['nube', 40], ['tormenta', 90], ['arcoiris', 180]]);
  for (const c of COFRES) assert.ok(Math.abs(c.prob.comun + c.prob.raro + c.prob.legendario - 1) < 1e-9, c.id);
  // Cuanto más caro el cofre, mejor la probabilidad de legendario.
  assert.ok(COFRES[0].prob.legendario < COFRES[1].prob.legendario && COFRES[1].prob.legendario < COFRES[2].prob.legendario);
  assert.equal(CATALOGO.find((o) => o.id === 'comodin').precio, 60);
});

test('todo lo del catálogo tiene su dibujo o su texto', () => {
  for (const o of CATALOGO) {
    if (o.tipo === 'cara') assert.ok(COMPLEMENTOS[o.id], o.id);
    if (o.tipo === 'escena') assert.ok(ESCENAS[o.id] && MINIATURAS[o.id], o.id);
    if (o.tipo === 'tema') assert.ok(TEMAS_HOY[o.id], o.id);
    if (o.tipo === 'personalidad') assert.ok(PERSONALIDADES[o.id], o.id);
  }
  assert.match(avatarNimbo(40, false, 'gafas'), /rect x="18.5"/);
  assert.doesNotMatch(avatarNimbo(40), /rect x="18.5"/);
});

test('saldo: ganados + devueltos − gastados, nunca negativo', () => {
  assert.equal(saldo(100, tiendaVacia()), 100);
  assert.equal(saldo(100, { ...tiendaVacia(), gastados: 70, extra: 20 }), 50);
  assert.equal(saldo(10, { ...tiendaVacia(), gastados: 70 }), 0);
  assert.equal(saldo(-5, tiendaVacia()), 0);
});

test('comprar: descuenta, no repite, avisa de lo que falta y no muta la tienda original', () => {
  const t0 = tiendaVacia();
  const r = comprar(t0, 'gafas', 100, HOY);
  assert.ok(r.ok);
  assert.deepEqual(t0, tiendaVacia());
  assert.deepEqual(r.tienda.comprados, ['gafas']);
  assert.equal(saldo(100, r.tienda), 60);
  assert.equal(comprar(r.tienda, 'gafas', 100, HOY).motivo, 'Ya es tuyo');
  const caro = comprar(r.tienda, 'esqui', 100, HOY);
  assert.equal(caro.ok, false);
  assert.equal(caro.faltan, 20);
  assert.equal(comprar(t0, 'no-existe', 999, HOY).ok, false);
});

test('equipar: solo lo tuyo y de su tipo; null lo quita', () => {
  let t = comprar(tiendaVacia(), 'esqui', 200, HOY).tienda;
  t = equipar(t, 'escena', 'esqui');
  assert.equal(t.equipado.escena, 'esqui');
  assert.equal(equipar(t, 'escena', 'playa').equipado.escena, 'esqui'); // no es tuya
  assert.equal(equipar(t, 'cara', 'esqui').equipado.cara, null); // no es una cara
  assert.equal(equipar(t, 'escena', null).equipado.escena, null);
});

test('rareza del cofre según sus probabilidades', () => {
  const p = COFRES[0].prob; // 70 / 25 / 5
  assert.equal(rarezaDe(p, () => 0), 'comun');
  assert.equal(rarezaDe(p, () => 0.6999), 'comun');
  assert.equal(rarezaDe(p, () => 0.7), 'raro');
  assert.equal(rarezaDe(p, () => 0.9499), 'raro');
  assert.equal(rarezaDe(p, () => 0.95), 'legendario');
  // Con un azar repartido uniformemente, las frecuencias coinciden con las probabilidades.
  for (const c of COFRES) {
    const n = 1000;
    const cuenta = { comun: 0, raro: 0, legendario: 0 };
    for (let i = 0; i < n; i++) cuenta[rarezaDe(c.prob, () => (i + 0.5) / n)]++;
    for (const r of Object.keys(cuenta)) assert.ok(Math.abs(cuenta[r] / n - c.prob[r]) < 0.002, `${c.id} ${r}`);
  }
});

test('tablas publicadas: con 100.000 tiradas reproducibles, cada rareza sale con su probabilidad (±1 %)', () => {
  for (const c of COFRES) {
    const azar = semilla(2026 + c.precio);
    const cuenta = { comun: 0, raro: 0, legendario: 0 };
    const n = 100000;
    for (let i = 0; i < n; i++) cuenta[rarezaDe(c.prob, azar)]++;
    for (const r of Object.keys(cuenta)) assert.ok(Math.abs(cuenta[r] / n - c.prob[r]) < 0.01, `${c.id} ${r} ${cuenta[r] / n}`);
  }
});

test('abrir un cofre: cobra, da un objeto de la rareza que sale y lo apunta en el historial', () => {
  const comunes = COLECCIONABLES.filter((o) => o.rareza === 'comun');
  const r = abrirCofre(tiendaVacia(), 'nube', 100, { azar: secuencia(0.1, 0), hoy: HOY });
  assert.ok(r.ok);
  assert.equal(r.rareza, 'comun');
  assert.equal(r.premio.id, comunes[0].id);
  assert.equal(r.duplicado, false);
  assert.equal(saldo(100, r.tienda), 60);
  assert.deepEqual(r.tienda.historial, [{ dia: HOY, cofre: 'nube', premio: comunes[0].id, duplicado: false }]);
  const azar = semilla(7);
  for (let i = 0; i < 200; i++) assert.notEqual(abrirCofre(tiendaVacia(), 'arcoiris', 999, { azar }).premio.tipo, 'comodin');
  const pobre = abrirCofre(tiendaVacia(), 'tormenta', 50, { azar: secuencia(0.1, 0) });
  assert.equal(pobre.ok, false);
  assert.equal(pobre.faltan, 40);
});

test('garantías: raro como mínimo al 5.º cofre sin raro y legendario al 20.º sin legendario', () => {
  // Siempre sale «común» en la tirada: los cofres 1-4 son comunes y el 5.º, raro.
  let t = tiendaVacia();
  const rarezas = [];
  for (let i = 0; i < 10; i++) {
    const r = abrirCofre(t, 'nube', 99999, { azar: secuencia(0, 0) });
    rarezas.push(r.rareza);
    t = r.tienda;
  }
  assert.deepEqual(rarezas, ['comun', 'comun', 'comun', 'comun', 'raro', 'comun', 'comun', 'comun', 'comun', 'raro']);
  assert.deepEqual(garantiaEn(t), { raro: 5, legendario: 10 });
  // Siempre sale «raro»: el contador de raro no sube, y el 20.º es legendario.
  t = tiendaVacia();
  const veces = [];
  for (let i = 1; i <= 40; i++) {
    const r = abrirCofre(t, 'nube', 99999, { azar: secuencia(0.8, 0) });
    if (r.rareza === 'legendario') veces.push(i);
    t = r.tienda;
  }
  assert.deepEqual(veces, [20, 40]);
  // Un raro de verdad reinicia su contador; un legendario reinicia los dos.
  assert.deepEqual(siguientePity({ sinRaro: 3, sinLegendario: 7 }, 'raro'), { sinRaro: 0, sinLegendario: 8 });
  assert.deepEqual(siguientePity({ sinRaro: 3, sinLegendario: 7 }, 'legendario'), { sinRaro: 0, sinLegendario: 0 });
  assert.equal(rarezaConGarantia('legendario', { sinRaro: 4, sinLegendario: 0 }), 'legendario');
  assert.equal(abrirCofre({ ...tiendaVacia(), pity: { sinRaro: 4, sinLegendario: 0 } }, 'nube', 999, { azar: secuencia(0, 0) }).garantizado, true);
});

test('protección contra duplicados: primero lo que no tienes; si tienes toda la rareza, rayos (15 / 40 / 100)', () => {
  const comunes = COLECCIONABLES.filter((o) => o.rareza === 'comun');
  let t = tiendaVacia();
  const vistos = new Set();
  for (let i = 0; i < comunes.length; i++) {
    // Sin garantías por medio, para que todas las tiradas sean comunes.
    const r = abrirCofre({ ...t, pity: { sinRaro: 0, sinLegendario: 0 } }, 'nube', 99999, { azar: secuencia(0.1, 0) });
    assert.equal(r.duplicado, false);
    vistos.add(r.premio.id);
    t = r.tienda;
  }
  assert.equal(vistos.size, comunes.length);
  const dup = abrirCofre({ ...t, pity: { sinRaro: 0, sinLegendario: 0 } }, 'nube', 99999, { azar: secuencia(0.1, 0) });
  assert.equal(dup.duplicado, true);
  assert.equal(dup.rayos, 15);
  assert.equal(saldo(99999, dup.tienda), saldo(99999, t) - 40 + 15);
  const todo = { ...tiendaVacia(), comprados: COLECCIONABLES.map((o) => o.id) };
  assert.equal(abrirCofre(todo, 'arcoiris', 999, { azar: secuencia(0.5, 0) }).rayos, 40);
  assert.equal(abrirCofre(todo, 'arcoiris', 999, { azar: secuencia(0.9, 0) }).rayos, 100);
  assert.deepEqual([RAREZAS.comun.duplicado, RAREZAS.raro.duplicado, RAREZAS.legendario.duplicado], [15, 40, 100]);
});

test('destacado del día: siempre algo de la tienda y cambia de un día a otro', () => {
  const a = destacadoDe('2026-11-26');
  assert.ok(COLECCIONABLES.includes(a));
  assert.equal(a.via, 'tienda');
  assert.equal(destacadoDe('2026-11-26'), a);
  assert.notEqual(destacadoDe('2026-11-27'), a);
});

test('cofres gratis: bienvenida una vez y uno por cada bloque de 7 partes', () => {
  const t0 = tiendaVacia();
  assert.equal(cofresGratis(t0, 0), 1);
  const b = abrirCofre(t0, 'nube', 0, { gratis: 'bienvenida', azar: secuencia(0.1, 0) });
  assert.ok(b.ok);
  assert.equal(b.tienda.gastados, 0);
  assert.equal(b.tienda.bienvenida, true);
  assert.equal(abrirCofre(b.tienda, 'nube', 0, { gratis: 'bienvenida' }).ok, false);
  assert.equal(abrirCofre(b.tienda, 'arcoiris', 0, { gratis: 'semanal' }).ok, false); // los gratis son de nube
  assert.equal(cofresGratis(b.tienda, 6), 0);
  assert.equal(cofresGratis(b.tienda, 14), 2);
  const s = abrirCofre(b.tienda, 'nube', 0, { gratis: 'semanal', azar: secuencia(0.1, 0.5) });
  assert.equal(s.tienda.semanales, 1);
  assert.equal(cofresGratis(s.tienda, 14), 1);
});

test('comodín: uno al mes, y salva un día suelto de la racha', () => {
  // Partes de los últimos 6 días salvo anteayer.
  const isos = [dia(0), dia(-1), dia(-3), dia(-4), dia(-5)];
  assert.equal(rachaProtegida(isos, [], HOY), 2);
  let t = comprar(tiendaVacia(), 'comodin', 100, HOY).tienda;
  assert.equal(t.comodin.disponibles, 1);
  assert.equal(puedeComprarComodin(t, HOY).ok, false); // ya tienes uno guardado
  const r = aplicaComodin(t, isos, HOY);
  assert.equal(r.dia, dia(-2));
  assert.equal(r.tienda.comodin.disponibles, 0);
  // El día salvado no rompe la racha pero tampoco suma.
  assert.equal(rachaProtegida(isos, r.tienda.comodin.usados, HOY), 5);
  // Este mes ya no se puede comprar otro; el mes que viene, sí.
  assert.equal(puedeComprarComodin(r.tienda, HOY).ok, false);
  assert.equal(comprar(r.tienda, 'comodin', 999, HOY).ok, false);
  assert.equal(puedeComprarComodin(r.tienda, '2026-12-01').ok, true);
  // No se gasta si no hace falta (racha intacta) ni si el hueco es de más de un día.
  t = comprar(tiendaVacia(), 'comodin', 100, HOY).tienda;
  assert.equal(aplicaComodin(t, [dia(0), dia(-1), dia(-2)], HOY).dia, null);
  assert.equal(aplicaComodin(t, [dia(0), dia(-3)], HOY).dia, null);
  // Sin parte hoy aún, salva ayer si anteayer tiene parte.
  assert.equal(aplicaComodin(t, [dia(-2), dia(-3)], HOY).dia, dia(-1));
});

test('migración: los estados antiguos nacen con la tienda vacía; los datos raros se limpian', () => {
  assert.deepEqual(normaliza({ perfil: {}, entradas: {} }).tienda, tiendaVacia());
  assert.deepEqual(normalizaTienda(undefined), tiendaVacia());
  const t = normalizaTienda({
    comprados: ['gafas', 'gafas', 'inventado', 'comodin'], equipado: { cara: 'gafas', escena: 'playa', tema: 'gafas' },
    gastados: -20, extra: '30', historial: [{ dia: HOY, cofre: 'nube', premio: 'gafas' }, { cofre: 'falso', premio: 'gafas' }],
    comodin: { disponibles: 5, usados: ['2026-11-02', 'mal'] },
  });
  assert.deepEqual(t.comprados, ['gafas']);
  assert.deepEqual(t.equipado, { cara: 'gafas', escena: null, tema: null, reaccion: null, personalidad: null });
  assert.equal(t.gastados, 0);
  assert.equal(t.extra, 30);
  assert.equal(t.historial.length, 1);
  assert.deepEqual(t.comodin, { disponibles: 1, usados: ['2026-11-02'] });
  assert.deepEqual(t.pity, { sinRaro: 0, sinLegendario: 0 });
  assert.deepEqual(normalizaTienda({ pity: { sinRaro: 99, sinLegendario: 7 } }).pity, { sinRaro: 4, sinLegendario: 7 });
});

test('el estado da el saldo y la racha con comodines; la demostración no toca los datos reales', () => {
  const real = normaliza({ entradas: { [dia(-1)]: { animo: 3 }, [dia(-3)]: { animo: 4 } } });
  assert.equal(rayosDisponibles(real), 20);
  real.tienda.comodin.usados = [dia(-2)];
  assert.equal(rachaDe(real, HOY), 2);
  const antes = JSON.stringify(real);
  const demo = ejemplo(30, real.perfil, HOY);
  demo.tienda = comprar(demo.tienda, 'gafas', 999, HOY).tienda;
  assert.equal(JSON.stringify(real), antes);
  assert.notEqual(demo.tienda, real.tienda);
});

test('temas: no bajan el contraste del texto respecto a los colores de siempre, en claro y en oscuro', () => {
  const luz = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => (Math.max(luz(a), luz(b)) + 0.05) / (Math.min(luz(a), luz(b)) + 0.05);
  for (const [id, tema] of Object.entries(TEMAS_HOY)) {
    for (const t of [1, 2, 3, 4, 5]) {
      const texto = t === 1 ? '#FFFFFF' : '#1E2749';
      tema.claro[t].forEach((c, i) => {
        assert.ok(contraste(c, texto) >= contraste(TIEMPOS[t].cielo[i], TIEMPOS[t].sobre) - 1e-9, `${id} claro ${t}.${i} ${c}`);
      });
      tema.oscuro[t].forEach((c, i) => {
        assert.ok(contraste(c, '#F4F2FB') >= contraste(TIEMPOS[t].cieloOscuro[i], '#F4F2FB') - 1e-9, `${id} oscuro ${t}.${i} ${c}`);
      });
    }
  }
});

test('personalidades: solo visten el texto, no lo cambian', () => {
  const t = 'Apuntado. Cielo amable el de hoy.';
  assert.equal(conPersonalidad(t, null), t);
  assert.equal(conPersonalidad(t, 'inventada'), t);
  for (const modo of Object.keys(PERSONALIDADES)) {
    const v = conPersonalidad(t, modo);
    assert.ok(v.includes(t));
    assert.notEqual(v, t);
  }
});

test('reparto tienda / cofre: comunes en la tienda, legendarios exclusivos, raros mitad y mitad, cada categoría con los dos', () => {
  for (const o of CATALOGO) assert.ok(['tienda', 'cofre'].includes(o.via), o.id);
  assert.ok(CATALOGO.filter((o) => o.rareza === 'comun').every((o) => o.via === 'tienda'));
  assert.deepEqual(CATALOGO.filter((o) => o.rareza === 'legendario').map((o) => o.via), ['cofre', 'cofre', 'cofre', 'cofre']);
  const raros = CATALOGO.filter((o) => o.rareza === 'raro');
  assert.equal(raros.filter((o) => o.via === 'tienda').length, raros.length / 2);
  for (const tipo of ['cara', 'escena', 'tema', 'reaccion', 'personalidad']) {
    const deTipo = COLECCIONABLES.filter((o) => o.tipo === tipo);
    assert.ok(deTipo.some((o) => o.via === 'tienda') && deTipo.some((o) => o.via === 'cofre'), tipo);
  }
  assert.equal(CATALOGO.find((o) => o.id === 'comodin').via, 'tienda');
});

test('los exclusivos no se pueden comprar, pero sí salen en los cofres', () => {
  assert.equal(comprar(tiendaVacia(), 'corona', 9999, HOY).motivo, 'Solo sale en cofres');
  const r = abrirCofre(tiendaVacia(), 'arcoiris', 9999, { azar: secuencia(0.99, 0) });
  assert.equal(r.premio.via, 'cofre');
});

test('lista de la tienda: sin lo que ya tienes ni lo exclusivo; el comodín siempre', () => {
  const vacia = enTienda(tiendaVacia());
  assert.ok(vacia.every((o) => o.via === 'tienda'));
  assert.ok(!vacia.some((o) => o.id === 'corona'));
  const t = comprar(tiendaVacia(), 'gafas', 999, HOY).tienda;
  assert.ok(!enTienda(t).some((o) => o.id === 'gafas'));
  const todo = { ...tiendaVacia(), comprados: COLECCIONABLES.filter((o) => o.via === 'tienda').map((o) => o.id) };
  assert.deepEqual(enTienda(todo).map((o) => o.id), ['comodin']);
  assert.equal(destacadoDe(HOY, todo), null);
  assert.equal(destacadoDe(HOY, t).via, 'tienda');
  assert.notEqual(destacadoDe(HOY, t).id, 'gafas');
});

test('estados de la colección', () => {
  let t = comprar(tiendaVacia(), 'gafas', 999, HOY).tienda;
  const o = (id) => CATALOGO.find((x) => x.id === id);
  assert.equal(estadoColeccion(o('gafas'), t), 'mio');
  t = equipar(t, 'cara', 'gafas');
  assert.equal(estadoColeccion(o('gafas'), t), 'puesto');
  assert.equal(estadoColeccion(o('bigote'), t), 'tienda');
  assert.equal(estadoColeccion(o('corona'), t), 'cofre');
});

test('«Puede salir»: legendarios primero y todo agrupado por rareza', () => {
  const grupos = puedeSalir('arcoiris');
  assert.deepEqual(grupos.map((g) => g.rareza), ['legendario', 'raro', 'comun']);
  assert.deepEqual(grupos[0].objetos.map((x) => x.id).sort(), ['arcoiris', 'corona', 'estrellas', 'poeta']);
  assert.equal(grupos.reduce((n, g) => n + g.objetos.length, 0), COLECCIONABLES.length);
  assert.equal(grupos[0].prob, 0.3);
  assert.deepEqual(puedeSalir('nada'), []);
});

// ---------- Más formas de ganar rayos ----------
import { BONO_NIVEL, CHAT, bonosNivel, chatHoy, concede, premioChat, premioCuriosidad, previsualiza, regalados } from '../js/tienda.js';

test('bonos de nivel: una vez por nivel y todos los alcanzados', () => {
  assert.deepEqual(BONO_NIVEL, { 7: 100, 14: 150, 21: 200, 30: 300, 40: 400, 50: 500 });
  const a = bonosNivel(tiendaVacia(), 6, HOY);
  assert.equal(a.cantidad, 0);
  const b = bonosNivel(tiendaVacia(), 14, HOY);
  assert.equal(b.cantidad, 250);
  assert.equal(saldo(0, b.tienda), 250);
  // Repetirlo (recargar la app) no da más.
  assert.equal(bonosNivel(b.tienda, 14, HOY).cantidad, 0);
  assert.equal(bonosNivel(b.tienda, 21, HOY).cantidad, 200);
});

test('chat: +5 la primera pregunta del día, sorpresas del 20 % y tope de 25 al día', () => {
  let t = tiendaVacia();
  const p1 = premioChat(t, HOY, () => 0);
  assert.equal(p1.cantidad, CHAT.primera);
  assert.equal(p1.sorpresa, false);
  t = p1.tienda;
  // Sin sorpresa si el azar no cae en el 20 %.
  assert.equal(premioChat(t, HOY, () => 0.2).cantidad, 0);
  // Sorpresa de 5 o de 10 según el segundo número.
  assert.equal(premioChat(t, HOY, secuencia(0.1, 0.1)).cantidad, 5);
  assert.equal(premioChat(t, HOY, secuencia(0.1, 0.9)).cantidad, 10);
  // El tope: nunca más de 25 al día, aunque haya suerte cada vez.
  for (let i = 0; i < 20; i++) t = premioChat(t, HOY, secuencia(0.1, 0.9)).tienda;
  assert.equal(chatHoy(t, HOY), CHAT.topeDia);
  assert.equal(premioChat(t, HOY, secuencia(0.1, 0.9)).cantidad, 0);
  // Al día siguiente, otra vez la primera.
  assert.equal(premioChat(t, dia(1), () => 0.9).cantidad, CHAT.primera);
});

test('curiosidad: +5 al día por horóscopo y por el ciclo, sin repetir', () => {
  let r = premioCuriosidad(tiendaVacia(), 'horoscopo', HOY);
  assert.equal(r.cantidad, 5);
  assert.equal(premioCuriosidad(r.tienda, 'horoscopo', HOY).cantidad, 0);
  assert.equal(premioCuriosidad(r.tienda, 'ciclo', HOY).cantidad, 5);
  assert.equal(premioCuriosidad(r.tienda, 'horoscopo', dia(1)).cantidad, 5);
});

test('regalos: el saldo es ganado + regalos − gastado; la clave impide duplicados, también tras guardar y cargar', () => {
  let t = concede(tiendaVacia(), { clave: 'x', dia: HOY, motivo: 'prueba', cantidad: 30 }).tienda;
  assert.equal(regalados(t), 30);
  assert.equal(concede(t, { clave: 'x', dia: HOY, motivo: 'prueba', cantidad: 30 }).cantidad, 0);
  const recargada = normalizaTienda(JSON.parse(JSON.stringify({ ...t, eventos: [...t.eventos, t.eventos[0], { clave: 'mal', cantidad: -4 }] })));
  assert.equal(regalados(recargada), 30);
  t = comprar(recargada, 'bigote', 0, HOY).tienda;
  assert.equal(saldo(0, t), 0);
  assert.equal(saldo(10, t), 10);
});

test('regalos en la demostración: van a la tienda de ejemplo, nunca a la real', () => {
  const real = normaliza({ entradas: {} });
  const antes = JSON.stringify(real);
  const demo = ejemplo(30, real.perfil, HOY);
  demo.tienda = bonosNivel(demo.tienda, 30, HOY).tienda;
  demo.tienda = premioChat(demo.tienda, HOY, () => 0).tienda;
  assert.equal(JSON.stringify(real), antes);
  assert.ok(regalados(demo.tienda) > 0);
});

// ---------- Vista previa y equipar ----------

test('probar nunca cambia la tienda: solo devuelve una copia con el objeto puesto', () => {
  const t = comprar(tiendaVacia(), 'gafas', 999, HOY).tienda;
  const antes = JSON.stringify(t);
  const p = previsualiza(t, CATALOGO.find((o) => o.id === 'corona'));
  assert.equal(p.equipado.cara, 'corona');
  assert.equal(JSON.stringify(t), antes);
  assert.equal(previsualiza(t, null).equipado.cara, null);
});

test('equipar, cambiar y volver a lo original en cada categoría', () => {
  let t = { ...tiendaVacia(), comprados: COLECCIONABLES.map((o) => o.id) };
  for (const tipo of ['cara', 'escena', 'tema', 'reaccion', 'personalidad']) {
    const [a, b] = COLECCIONABLES.filter((o) => o.tipo === tipo);
    t = equipar(t, tipo, a.id);
    assert.equal(t.equipado[tipo], a.id);
    t = equipar(t, tipo, b.id); // un solo hueco por categoría
    assert.equal(t.equipado[tipo], b.id);
    t = equipar(t, tipo, null); // «Original» / «Ninguna»
    assert.equal(t.equipado[tipo], null);
  }
});

test('«Puede salir» con intriga: dos legendarios a la vista, el resto y los raros exclusivos agrupados', () => {
  const vacia = tiendaVacia();
  const [leg, raro, comun] = vistaPuedeSalir('arcoiris', vacia, HOY);
  assert.equal(leg.visibles.length, 2);
  assert.equal(leg.ocultos, 2);
  assert.ok(leg.visibles.every((o) => o.rareza === 'legendario'));
  assert.deepEqual(vistaPuedeSalir('arcoiris', vacia, HOY)[0].visibles, leg.visibles); // mismo día, mismos
  const otroDia = vistaPuedeSalir('arcoiris', vacia, dia(1))[0].visibles.map((o) => o.id);
  assert.notDeepEqual(otroDia, leg.visibles.map((o) => o.id)); // cambia de un día a otro
  assert.ok(raro.visibles.every((o) => o.via === 'tienda'));
  assert.equal(raro.ocultos, 5);
  assert.equal(comun.resumen, 7);
  // Los tuyos se ven primero; con todos, no queda misterio.
  const conCorona = { ...vacia, comprados: ['corona', 'dormido'] };
  const v = vistaPuedeSalir('arcoiris', conCorona, HOY);
  assert.equal(v[0].visibles[0].id, 'corona');
  assert.ok(v[1].visibles.some((o) => o.id === 'dormido'));
  assert.equal(v[1].ocultos, 4);
  const todo = { ...vacia, comprados: COLECCIONABLES.map((o) => o.id) };
  assert.deepEqual(vistaPuedeSalir('arcoiris', todo, HOY).slice(0, 2).map((g) => g.ocultos), [0, 0]);
  assert.equal(vistaPuedeSalir('arcoiris', todo, HOY)[0].visibles.length, 4);
});

test('colección por categoría: los exclusivos que no tienes se agrupan en una ficha', () => {
  const c = coleccionDe('cara', tiendaVacia());
  assert.equal(c.ocultos, 2); // dormido y corona
  assert.equal(c.legendario, true);
  assert.ok(c.visibles.every((o) => o.via === 'tienda'));
  const con = coleccionDe('cara', { ...tiendaVacia(), comprados: ['corona'] });
  assert.equal(con.ocultos, 1);
  assert.equal(con.legendario, false);
  assert.ok(con.visibles.some((o) => o.id === 'corona'));
});

test('cofre de bienvenida: siempre el modo telediario, una sola vez, y cuenta como raro', async () => {
  const { REGALO_BIENVENIDA } = await import('../js/tienda.js');
  assert.equal(REGALO_BIENVENIDA, 'telediario');
  for (const v of [0, 0.5, 0.99]) {
    const r = abrirCofre(tiendaVacia(), 'nube', 0, { gratis: 'bienvenida', azar: () => v });
    assert.equal(r.premio.id, 'telediario');
    assert.equal(r.rareza, 'raro');
    assert.equal(r.tienda.pity.sinRaro, 0);
    assert.equal(r.tienda.gastados, 0);
    assert.equal(abrirCofre(r.tienda, 'nube', 0, { gratis: 'bienvenida' }).ok, false);
  }
  // Si ya tenías el modo (por ejemplo, comprado), se convierte en rayos como cualquier repetido.
  const conModo = { ...tiendaVacia(), comprados: ['telediario'] };
  assert.equal(abrirCofre(conModo, 'nube', 0, { gratis: 'bienvenida' }).rayos, 40);
});

test('modos del chat: la coletilla no cambia lo que dice Stormy', async () => {
  const { conEstilo, PERSONALIDADES, MODO_NORMAL } = await import('../js/asistente.js');
  assert.equal(conEstilo('Hoy pinta nublado.', null), 'Hoy pinta nublado.');
  assert.equal(conEstilo('Hoy pinta nublado.', 'telediario'), 'Hoy pinta nublado. Les seguiremos informando.');
  for (const p of Object.values(PERSONALIDADES)) assert.ok(p.nombre && p.descripcion && p.corto);
  assert.equal(MODO_NORMAL.nombre, 'Normal');
});
