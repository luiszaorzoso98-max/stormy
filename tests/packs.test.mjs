// Pruebas de los packs de la tienda (Espacio, Arcade, Navidad y Dibujos animados).
// Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGO, DE_COFRE, PACKS, abrirCofre, aLaVenta, comprar, enTemporada, enTienda, equipar, estadoColeccion, objeto, puedeSalir, tiendaVacia,
} from '../js/tienda.js';
import { COMPLEMENTOS, ESCENAS, MINIATURAS, TEMAS_HOY } from '../js/contenido.js';

const delPack = (p) => CATALOGO.filter((o) => o.pack === p);

test('cada pack es un conjunto completo: una cara, una escena y un tema, con su dibujo', () => {
  assert.deepEqual(Object.keys(PACKS), ['espacio', 'arcade', 'navidad', 'dibujos']);
  for (const p of Object.keys(PACKS)) {
    const objetos = delPack(p);
    assert.deepEqual(objetos.map((o) => o.tipo).sort(), ['cara', 'escena', 'tema'], p);
    for (const o of objetos) {
      if (o.tipo === 'cara') assert.ok(COMPLEMENTOS[o.id], o.id);
      if (o.tipo === 'escena') assert.ok(ESCENAS[o.id] && MINIATURAS[o.id], o.id);
      if (o.tipo === 'tema') assert.ok(TEMAS_HOY[o.id]?.claro && TEMAS_HOY[o.id]?.oscuro, o.id);
    }
  }
});

test('rareza y forma de conseguir cada pack', () => {
  const es = (p, rareza, via) => assert.ok(delPack(p).every((o) => o.rareza === rareza && o.via === via), p);
  es('espacio', 'legendario', 'cofre');
  es('arcade', 'raro', 'tienda');
  es('navidad', 'raro', 'temporada');
  es('dibujos', 'raro', 'cofre');
});

test('temporada de Navidad: del 1 de diciembre al 6 de enero, también al cambiar de año', () => {
  for (const d of ['2026-12-01', '2026-12-24', '2026-12-31', '2027-01-01', '2027-01-06']) assert.equal(enTemporada('navidad', d), true, d);
  for (const d of ['2026-11-30', '2027-01-07', '2027-06-15', '2026-02-01']) assert.equal(enTemporada('navidad', d), false, d);
  assert.equal(enTemporada('otra', '2026-12-24'), false);
});

test('Navidad: se vende solo en temporada; fuera, «Vuelve en Navidad»; lo comprado se usa todo el año', () => {
  const gorro = objeto('gorro-navidad');
  assert.equal(aLaVenta(gorro, '2026-12-15'), true);
  assert.equal(aLaVenta(gorro, '2027-01-07'), false);
  assert.ok(enTienda(tiendaVacia(), '2026-12-15').some((o) => o.id === 'gorro-navidad'));
  assert.ok(!enTienda(tiendaVacia(), '2026-11-26').some((o) => o.pack === 'navidad'));
  const fuera = comprar(tiendaVacia(), 'gorro-navidad', 999, '2026-11-26');
  assert.equal(fuera.ok, false);
  assert.equal(fuera.motivo, 'Vuelve en Navidad');
  assert.equal(estadoColeccion(gorro, tiendaVacia(), '2026-11-26'), 'temporada');
  assert.equal(estadoColeccion(gorro, tiendaVacia(), '2026-12-02'), 'tienda');
  const dentro = comprar(tiendaVacia(), 'gorro-navidad', 999, '2026-12-02');
  assert.ok(dentro.ok);
  // En julio, ya es tuyo: se ve como tuyo y se puede poner.
  assert.equal(estadoColeccion(gorro, dentro.tienda, '2027-07-01'), 'mio');
  assert.equal(equipar(dentro.tienda, 'cara', 'gorro-navidad').equipado.cara, 'gorro-navidad');
});

test('cofres: Espacio y Dibujos salen en cofres; Navidad nunca; Arcade se compra y también puede salir', () => {
  const ids = DE_COFRE.map((o) => o.id);
  for (const o of delPack('espacio')) assert.ok(ids.includes(o.id), o.id);
  for (const o of delPack('dibujos')) assert.ok(ids.includes(o.id), o.id);
  for (const o of delPack('arcade')) assert.ok(ids.includes(o.id), o.id);
  for (const o of delPack('navidad')) assert.ok(!ids.includes(o.id), o.id);
  for (const c of ['nube', 'tormenta', 'arcoiris']) {
    assert.ok(!puedeSalir(c).some((g) => g.objetos.some((o) => o.via === 'temporada')), c);
  }
  // Con todos los raros de cofre ya tuyos, un raro nunca da un objeto de Navidad.
  const conTodo = { ...tiendaVacia(), comprados: DE_COFRE.filter((o) => o.rareza === 'raro').map((o) => o.id) };
  for (let i = 0; i < 40; i++) {
    const r = abrirCofre(conTodo, 'tormenta', 9999, { azar: ((v) => () => v)(0.5 + (i % 10) / 100) });
    assert.notEqual(r.premio.via, 'temporada');
  }
  // Los packs de cofre no se pueden comprar.
  assert.equal(comprar(tiendaVacia(), 'astronauta', 9999, '2026-11-26').motivo, 'Solo sale en cofres');
  assert.equal(comprar(tiendaVacia(), 'cartoon', 9999, '2026-11-26').motivo, 'Solo sale en cofres');
  assert.ok(comprar(tiendaVacia(), 'pixel', 9999, '2026-11-26').ok);
});

test('los dibujos son originales: sin nombres de marcas ni personajes conocidos', () => {
  const prohibidas = /\b(disney|marvel|warner|nintendo|pac-?man|invaders|santa|claus|mickey|mario|looney)\b/i;
  const textos = [
    ...delPack('espacio'), ...delPack('arcade'), ...delPack('navidad'), ...delPack('dibujos'),
  ].flatMap((o) => [o.nombre, COMPLEMENTOS[o.id] ?? '', ESCENAS[o.id]?.() ?? '', MINIATURAS[o.id] ?? '', TEMAS_HOY[o.id]?.nombre ?? '']);
  for (const t of textos) assert.doesNotMatch(t, prohibidas);
  assert.match(ESCENAS.vineta(), /¡PLIC!/);
  assert.match(ESCENAS.vineta(), /¡ZAS!/);
});
