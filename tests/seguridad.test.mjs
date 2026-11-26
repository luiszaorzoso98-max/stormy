// Pruebas de las defensas ante datos y enlaces ajenos: límites al importar, normalización, parámetros y la ruta del aviso.
// Ejecutar con: node --test web/tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { aIso, aNum } from '../js/motor.js';
import { ETIQUETAS } from '../js/contenido.js';
import {
  ERRORES, LIMITES, aCodigo, aCodigoCorto, deCodigo, deCopia, deCualquierCodigo, diasDeEjemplo, ejemplo, normaliza, rutaAlRegistro,
} from '../js/datos.js';
import { CATALOGO, MAX_ENTERO, normalizaTienda } from '../js/tienda.js';
import { esLocal, parametrosPermitidos } from '../js/navegador.js';

const HOY = '2026-11-26';
const dia = (i) => aIso(aNum(HOY) + i);
const copia = (entradas) => JSON.stringify({ perfil: { alta: true }, entradas });

test('importar: rechaza textos de más de 200 KB antes de leerlos', async () => {
  const enorme = 'x'.repeat(LIMITES.texto + 1);
  assert.throws(() => deCopia(enorme), { message: ERRORES.grande });
  assert.throws(() => deCodigo(`STORMY1.${enorme}`), { message: ERRORES.grande });
  await assert.rejects(deCualquierCodigo(`STORMY2.${enorme}`), { message: ERRORES.grande });
});

test('importar: rechaza más de 3.700 partes con un mensaje claro', () => {
  const entradas = {};
  for (let i = 0; i < LIMITES.partes + 1; i++) entradas[aIso(aNum('2010-01-01') + i)] = { animo: 3 };
  const texto = JSON.stringify({ perfil: {}, entradas });
  assert.ok(texto.length < LIMITES.texto, 'la prueba debe caber en el límite de tamaño');
  assert.throws(() => deCopia(texto), { message: ERRORES.partes });
});

test('importar: un código comprimido que se infla más de 2 MB se corta al descomprimir', async () => {
  // Un JSON válido de unos 3 MB que comprimido ocupa muy poco (una nota enorme repetida).
  const relleno = JSON.stringify({ perfil: { alta: true, apodo: 'a'.repeat(3 * 1024 * 1024) }, entradas: {} });
  const bytes = new TextEncoder().encode(relleno);
  const comprimido = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let binario = '';
  for (const b of comprimido) binario += String.fromCharCode(b);
  const codigo = `STORMY2.${btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`;
  assert.ok(codigo.length < LIMITES.texto);
  await assert.rejects(deCualquierCodigo(codigo), { message: ERRORES.grande });
});

test('importar: los códigos normales siguen funcionando y la basura da un error en español', async () => {
  const estado = ejemplo(20, undefined, HOY);
  assert.equal(Object.keys((await deCualquierCodigo(await aCodigoCorto(estado))).entradas).length, 20);
  assert.equal(Object.keys(deCodigo(aCodigo(estado)).entradas).length, 20);
  assert.throws(() => deCopia('{no es json'), { message: ERRORES.invalida });
  assert.throws(() => deCodigo('STORMY1.%%%'), { message: ERRORES.invalida });
  await assert.rejects(deCualquierCodigo('STORMY2.AAAA'), { message: ERRORES.invalida });
});

test('normalización: solo etiquetas conocidas, como mucho 8, y se conserva la migración de las antiguas', () => {
  const todas = [...ETIQUETAS, 'Inventada', '<b>rara</b>', 'Plan con amigas', 'Poco tiempo juntos'];
  const e = normaliza({ perfil: {}, entradas: { [dia(-1)]: { animo: 3, etiquetas: todas } } }, HOY).entradas[dia(-1)];
  assert.ok(e.etiquetas.length <= 8);
  assert.ok(e.etiquetas.every((x) => ETIQUETAS.includes(x)));
  assert.equal(e.juntos, 1, '«Poco tiempo juntos» sigue pasando a tiempo juntos: poco');
  const migrada = normaliza({ perfil: {}, entradas: { [dia(-1)]: { animo: 3, etiquetas: ['Plan con amigas'] } } }, HOY).entradas[dia(-1)];
  assert.deepEqual(migrada.etiquetas, ['Plan con amigos']);
});

test('normalización: los partes con fecha posterior a hoy se descartan', () => {
  const st = normaliza({ perfil: {}, entradas: { [HOY]: { animo: 4 }, [dia(1)]: { animo: 2 }, '2099-01-01': { animo: 1 } } }, HOY);
  assert.deepEqual(Object.keys(st.entradas), [HOY]);
  const futuro = aIso(aNum(new Date().toISOString().slice(0, 10)) + 400);
  assert.deepEqual(Object.keys(deCopia(copia({ [futuro]: { animo: 3 } })).entradas), []);
});

test('tienda: enteros entre 0 y un millón; compras e historial no pasan del tamaño del catálogo', () => {
  const ids = CATALOGO.filter((o) => o.tipo !== 'comodin').map((o) => o.id);
  const t = normalizaTienda({
    gastados: 1e12, extra: -5, semanales: Infinity, comprados: [...ids, ...ids],
    historial: Array.from({ length: 500 }, () => ({ dia: HOY, cofre: 'nube', premio: ids[0] })),
  });
  assert.equal(t.gastados, MAX_ENTERO);
  assert.equal(t.extra, 0);
  assert.equal(t.semanales, 0);
  assert.ok(t.comprados.length <= CATALOGO.length);
  assert.ok(t.historial.length <= CATALOGO.length);
});

test('demo: los días se limitan a 1…365 y lo que no es número vale 30', () => {
  assert.equal(diasDeEjemplo('1e9'), 365);
  assert.equal(diasDeEjemplo('-4'), 1);
  assert.equal(diasDeEjemplo('abc'), 30);
  assert.equal(diasDeEjemplo('12.7'), 12);
  assert.equal(Object.keys(ejemplo(1e9, undefined, HOY).entradas).length, 365);
});

test('parámetros: en producción solo ?hoja=registro|nimbo, ?demo y ?pestana; en local, todos', () => {
  assert.equal(esLocal('localhost'), true);
  assert.equal(esLocal('127.0.0.1'), true);
  assert.equal(esLocal('luiszaorzoso98-max.github.io'), false);
  const prueba = '?reiniciar=1&pity=19&escena=esqui&ua=x&paso=2&hoja=registro&demo=30&pestana=tienda&cofre=tormenta';
  const fuera = parametrosPermitidos(prueba, false);
  assert.deepEqual([...fuera.keys()].sort(), ['demo', 'hoja', 'pestana']);
  assert.equal(parametrosPermitidos('?hoja=nimbo', false).get('hoja'), 'nimbo');
  assert.equal(parametrosPermitidos('?hoja=tienda', false).has('hoja'), false);
  assert.equal(parametrosPermitidos('?hoja=__proto__', false).has('hoja'), false);
  assert.ok(parametrosPermitidos(prueba, true).has('reiniciar'));
});

test('ruta del aviso: al registro de hoy, para editar si ya está apuntado; nada antes de la bienvenida ni en la demo', () => {
  const sinAlta = normaliza({ perfil: { alta: false }, entradas: {} }, HOY);
  assert.equal(rutaAlRegistro(sinAlta, { hoy: HOY }), null);
  const conAlta = normaliza({ perfil: { alta: true }, entradas: { [dia(-1)]: { animo: 3 } } }, HOY);
  assert.deepEqual(rutaAlRegistro(conAlta, { hoy: HOY }), { dia: HOY, editar: false });
  conAlta.entradas[HOY] = { animo: 5 };
  assert.deepEqual(rutaAlRegistro(conAlta, { hoy: HOY }), { dia: HOY, editar: true });
  assert.equal(rutaAlRegistro(conAlta, { demo: true, hoy: HOY }), null);
});
