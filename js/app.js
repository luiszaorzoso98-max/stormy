// Stormy — aplicación web instalable. Sin dependencias ni servidor: todo se calcula y se guarda en el dispositivo.
import {
  Motor, NIVELES, OBJETIVO, SEMANA, aIso, aNum, diaSemana, diasDePronostico, hoyIso,
  nivelActual, nivelSiguiente, racha, tiempoDe,
} from './motor.js';
import {
  APP, ETIQUETAS, ICONOS, INSIGNIAS, ORDEN_TIEMPOS, TIEMPOS, avatarNimbo, consejoDe, ficha, fraseHoroscopo, iconoTiempo, signo,
} from './contenido.js';
import { NIMBO, responder, saludo } from './asistente.js';
import {
  borrarTodo, cargar, extrasDe, guardar, muestrasDe, nombreDe, reglasDe, sembrar, totalExtras,
} from './datos.js';

// ---------- Estado ----------

let estado = cargar();
const ui = {
  pestana: 'hoy',
  paso: 0,
  mes: hoyIso().slice(0, 7),
  hoja: null,
  borrador: null,
  alta: { consiente: false, nombre: '', conNacimiento: false, nacimiento: '1992-06-15', sigueCiclo: false, ultimaRegla: hoyIso(), duracion: 28, hora: '21:30' },
  instalar: null,
  chat: [],
  pensando: false,
};

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const num = (v, d = 1) => v.toFixed(d).replace('.', ',');
const pct = (v) => `${Math.round(v * 100)} %`;
const fecha = (iso, opciones) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { ...opciones, timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, d)));
};
const fechaLarga = (iso) => mayus(fecha(iso, { weekday: 'long', day: 'numeric', month: 'long' }));

const motor = () =>
  new Motor({
    muestras: muestrasDe(estado), reglas: reglasDe(estado), duracion: estado.perfil.duracion,
    sigueCiclo: estado.perfil.sigueCiclo, hoy: hoyIso(),
  });
const diasRegistrados = () => Object.keys(estado.entradas).length;

// ---------- Arranque con parámetros de prueba: ?demo=30&pestana=descubrimientos&hoja=registro&paso=2&reiniciar=1 ----------

{
  const q = new URLSearchParams(location.search);
  if (q.has('reiniciar')) estado = borrarTodo();
  if (q.has('demo')) guardar(sembrar(estado, Number(q.get('demo')) || 0));
  if (q.has('pestana')) ui.pestana = q.get('pestana');
  if (q.has('paso')) ui.paso = Number(q.get('paso')) || 0;
  // Se quitan de la dirección para que recargar la página no vuelva a borrar ni a sembrar datos.
  if (q.has('reiniciar') || q.has('demo')) history.replaceState(null, '', location.pathname);
  if (q.has('hoja') && estado.perfil.alta) setTimeout(() => acciones[{ registro: 'abrirRegistro', niveles: 'abrirNiveles', nimbo: 'abrirNimbo' }[q.get('hoja')] ?? 'abrirRegistro']({}), 0);
}

// ---------- Piezas comunes ----------

const tarjeta = (html, clase = '') => `<article class="tarjeta ${clase}">${html}</article>`;
const encabezado = (icono, titulo, sub) =>
  `<header class="encabezado"><span class="marca">${ICONOS[icono]}</span><div><h3>${titulo}</h3><p>${sub}</p></div></header>`;
const interruptor = (modelo, activo, etiqueta) =>
  `<label class="interruptor"><span>${etiqueta}</span><input type="checkbox" role="switch" data-modelo="${modelo}" ${activo ? 'checked' : ''}><i aria-hidden="true"></i></label>`;

function barraNiveles(dias) {
  const progreso = Math.min(1, dias / OBJETIVO) * 100;
  const marcas = NIVELES.slice(1)
    .map((n) => `<b class="${dias >= n.dias ? 'hecha' : ''}" style="left:calc(${(n.dias / OBJETIVO) * 100}% - 9px)"></b>`)
    .join('');
  return `<div class="barra-niveles" role="img" aria-label="Progreso: ${dias} de 30 días"><i style="width:max(12px,${progreso}%)"></i>${marcas}</div>`;
}

// ---------- Bienvenida ----------

const PASOS = 5;

function bienvenida() {
  const a = ui.alta;
  const fila = (icono, titulo, texto) =>
    `<div class="fila"><span class="acento">${ICONOS[icono]}</span><div><strong>${titulo}</strong><p>${texto}</p></div></div>`;
  const titulo = (t, sub) => `<div class="titulo-paso"><h1>${t}</h1><p>${sub}</p></div>`;
  const pasos = [
    () => `<div class="portada">
        ${iconoTiempo(4, 132)}
        <h1>${APP.nombre}</h1>
        <p class="lema">${APP.lema}</p>
      </div>
      ${tarjeta(
        fila('toque', 'Cada día, un toque', 'Apunta qué tiempo hace en casa. Son 5 segundos.') +
        fila('calendario', 'En 30 días aprende', 'Busca patrones que se repiten cada mes.') +
        fila('destello', 'Pronóstico con humor', 'Previsión y consejos para llegar a casa con paraguas… o con planes.'),
        'cristal filas')}`,
    () => `${titulo('Juego limpio', 'Antes de empezar, lo más importante.')}
      ${tarjeta(
        fila('personas', 'Son datos suyos', 'Vas a apuntar cosas sobre el ánimo de tu pareja. Cuéntaselo y enséñale la app.') +
        fila('movil', 'Se quedan en este dispositivo', 'Sin cuentas, sin servidores y sin publicidad.') +
        fila('mascaras', 'Es un juego', 'Entretenimiento para entenderos mejor. No es consejo médico ni psicológico.'),
        'cristal filas')}
      ${tarjeta(interruptor('alta.consiente', a.consiente, '<strong>Mi pareja lo sabe y le parece bien</strong>'), 'cristal')}`,
    () => `${titulo('Tu pareja', 'Para que el parte tenga nombre propio.')}
      ${tarjeta(`<label class="campo"><span>¿Cómo se llama?</span>
        <input type="text" data-modelo="alta.nombre" value="${esc(a.nombre)}" placeholder="Nombre" autocomplete="off" autocapitalize="words" enterkeyhint="done" maxlength="30"></label>`, 'cristal')}
      ${tarjeta(`${interruptor('alta.conNacimiento', a.conNacimiento, 'Añadir fecha de nacimiento')}
        ${a.conNacimiento ? `<label class="linea"><span>Nacimiento</span><input type="date" data-modelo="alta.nacimiento" value="${a.nacimiento}" max="${hoyIso()}"></label>` : ''}
        <p class="nota">Solo sirve para el horóscopo de broma. No influye en el pronóstico.</p>`, 'cristal')}`,
    () => `${titulo('Ciclo menstrual', 'Opcional, y solo si ella quiere compartirlo.')}
      ${tarjeta(`${interruptor('alta.sigueCiclo', a.sigueCiclo, 'Tener en cuenta el ciclo')}
        ${a.sigueCiclo ? `<label class="linea"><span>Inicio de la última regla</span><input type="date" data-modelo="alta.ultimaRegla" value="${a.ultimaRegla}" max="${hoyIso()}"></label>
        <div class="linea"><span>Duración habitual: ${a.duracion} días</span>${paso('alta.duracion', a.duracion)}</div>` : ''}
        <p class="nota">Se parte de un patrón general muy suave y se corrige con vuestros registros. Podéis cambiarlo cuando queráis en Ajustes.</p>`, 'cristal')}`,
    () => `${titulo('Recordatorio diario', 'Un aviso al día. Sin él, casi nadie llega a los 30.')}
      ${tarjeta(`<label class="linea"><span><strong>Hora del aviso</strong></span><input type="time" data-modelo="alta.hora" value="${a.hora}"></label>
        <p class="nota">Se añade a tu calendario como un evento diario con alarma y enlace a la app. Puedes quitarlo cuando quieras desde el propio calendario.</p>`, 'cristal')}`,
  ];
  const ultimo = ui.paso === PASOS - 1;
  const bloqueado = ui.paso === 1 && !a.consiente;
  return `<main class="bienvenida">
    <div class="indicador" aria-hidden="true">${Array.from({ length: PASOS }, (_, i) => `<i class="${i <= ui.paso ? 'on' : ''}"></i>`).join('')}</div>
    <div class="paso" data-paso="${ui.paso}">${pasos[Math.min(ui.paso, PASOS - 1)]()}</div>
    <footer class="pie">
      ${ultimo
        ? `<button class="principal" data-accion="terminar" data-aviso="1">Añadir aviso y empezar</button>
           <button class="secundario" data-accion="terminar">Empezar sin aviso</button>`
        : `<button class="principal" data-accion="siguiente" ${bloqueado ? 'disabled' : ''}>${ui.paso === 0 ? 'Empezar' : 'Continuar'}</button>
           ${ui.paso > 0 ? '<button class="secundario" data-accion="atras">Atrás</button>' : ''}`}
    </footer>
  </main>`;
}

const paso = (modelo, valor) =>
  `<span class="pasos"><button type="button" data-accion="pasoNumero" data-modelo="${modelo}" data-d="-1" aria-label="Un día menos">−</button><button type="button" data-accion="pasoNumero" data-modelo="${modelo}" data-d="1" aria-label="Un día más">+</button></span>`;

// ---------- Hoy ----------

function vistaHoy() {
  const hoy = hoyIso();
  const m = motor();
  const entrada = estado.entradas[hoy];
  // Con el parte ya registrado, la previsión se calcula sin mirarlo: así "preveía" es una comparación honesta.
  const p = m.pronostico(hoy, entrada ? hoy : null);
  const t = entrada?.animo ?? p.tiempo;
  const perfil = estado.perfil;
  const dias = m.dias;

  const visibles = diasDePronostico(dias);
  const proximos = m.pronosticos(aIso(aNum(hoy) + 1), 7)
    .map((f, i) => `<div><span>${SEMANA.inicial[diaSemana(aNum(f.dia))]}</span>${
      i < visibles ? ficha(f.tiempo, 36) : `<span class="bloqueo" aria-label="Bloqueado">${ICONOS.candado}</span>`}</div>`)
    .join('');

  const nivel = nivelActual(dias);
  const sig = nivelSiguiente(dias);

  let horoscopo = '';
  if (perfil.nacimiento) {
    const s = signo(perfil.nacimiento);
    horoscopo = tarjeta(`<p class="sobre">${s.emoji} Horóscopo de broma · ${s.nombre}</p>
      <p class="texto">${fraseHoroscopo(hoy)}</p><p class="mini">Sin base científica. No influye en el pronóstico.</p>`, 'cristal');
  }

  return `<main class="hoy">
    <header class="cabecera"><p>${fecha(hoy, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</p><h1>Parte de casa</h1></header>
    <section class="heroe">
      ${iconoTiempo(t, 132)}
      <h2>${TIEMPOS[t].titulo}</h2>
      <p class="sub">${entrada ? 'Parte de hoy registrado' : `Previsión para hoy con ${esc(nombreDe(perfil))}`}</p>
      ${entrada ? `<p class="preveia">Stormy preveía: ${TIEMPOS[p.tiempo].titulo.toLowerCase()}</p>` : ''}
      <div class="fiabilidad" role="img" aria-label="Fiabilidad del pronóstico: ${Math.round(p.fiabilidad * 100)} por ciento">
        <span>Fiabilidad</span><span class="medidor"><i style="width:${p.fiabilidad * 100}%"></i></span><b>${pct(p.fiabilidad)}</b>
      </div>
      ${p.motivos.length ? `<p class="motivos">${p.motivos.join(' · ')}</p>` : ''}
    </section>
    ${tarjeta(`<div class="fila"><span class="acento">${ICONOS.bombilla}</span><div><p class="sobre">Consejo del día</p><p class="texto">${consejoDe(t, hoy)}</p></div></div>`, 'cristal')}
    <button class="principal ${entrada ? 'suave' : ''}" data-accion="abrirRegistro">${entrada ? ICONOS.lapiz : ICONOS.mas}<span>${entrada ? 'Editar el parte de hoy' : 'Registrar el parte de hoy'}</span></button>
    ${tarjeta(`<h3>Próximos días</h3><div class="semana">${proximos}</div>
      ${visibles < 7 ? `<p class="nota">${visibles === 0 ? 'Con 14 días registrados verás el pronóstico a 3 días; con 30, la semana completa.' : 'Con 30 días registrados verás la semana completa.'}</p>` : ''}`, 'cristal')}
    <button class="tarjeta cristal boton-tarjeta" data-accion="abrirNiveles" aria-label="Nivel ${nivel.id + 1} de ${NIVELES.length}: ${nivel.titulo}. Abre la lista de niveles">
      <div class="nivel-cab"><span class="insignia">${ICONOS[nivel.icono]}</span><div><p class="sobre">Nivel ${nivel.id + 1} de ${NIVELES.length}</p><h3>${nivel.titulo}</h3></div><span class="flecha">${ICONOS.derecha}</span></div>
      ${barraNiveles(dias)}
      <p class="nota">${sig ? `Día ${dias} de 30 · faltan ${sig.dias - dias} para «${sig.premio}»` : 'Mes completo: Stormy ya conoce vuestro clima.'}</p>
      <div class="datos"><span><i class="acento">${ICONOS.llama}</i><b>${racha(Object.keys(estado.entradas), hoy)}</b> de racha</span><span><i class="acento">${ICONOS.mas}</i><b>${totalExtras(estado)}</b> extras</span></div>
    </button>
    ${horoscopo}
    <button class="secundario claro" data-accion="compartir">${ICONOS.compartir}<span>Compartir el parte de hoy</span></button>
  </main>`;
}

// ---------- Registro ----------

function hojaRegistro() {
  const b = ui.borrador;
  const perfil = estado.perfil;
  const esHoy = b.dia === hoyIso();
  const extras = extrasDe(b);
  const triple = (titulo, campo, opciones) => `<div class="grupo"><h4>${titulo}</h4><div class="triple">${opciones
    .map((o, i) => `<button type="button" class="opcion ${b[campo] === i + 1 ? 'on' : ''}" aria-pressed="${b[campo] === i + 1}" data-accion="triple" data-campo="${campo}" data-v="${i + 1}">${o}</button>`)
    .join('')}</div></div>`;
  return `<div class="hoja-cab"><button class="texto-boton" data-accion="cerrarHoja">Cancelar</button></div>
    <div class="hoja-cuerpo">
      <h2>${esHoy ? `¿Qué tiempo hace hoy con ${esc(nombreDe(perfil))}?` : `¿Qué tiempo hizo con ${esc(nombreDe(perfil))}?`}</h2>
      <p class="fecha">${fechaLarga(b.dia)}</p>
      <div class="selector">
        <div class="fichas">${ORDEN_TIEMPOS.map((t) => `<button type="button" class="${b.animo === t ? 'on' : b.animo ? 'off' : ''}" style="--tinte:${TIEMPOS[t].tinte}" aria-label="${TIEMPOS[t].titulo}" aria-pressed="${b.animo === t}" data-accion="elegirTiempo" data-t="${t}">${ficha(t, 54)}</button>`).join('')}</div>
        <p class="${b.animo ? 'elegido' : ''}">${b.animo ? `${TIEMPOS[b.animo].titulo} · ${TIEMPOS[b.animo].desc}` : 'Toca el que más se parezca al día'}</p>
      </div>
      <div class="extra-cab"><div><h3>Datos extra</h3><p>Opcionales. Cada dato afina a Stormy.</p></div>${extras ? `<span class="contador">+${extras}</span>` : ''}</div>
      ${triple('¿Cómo ha dormido?', 'sueno', ['Mal', 'Regular', 'Bien'])}
      ${triple('Estrés del día', 'estres', ['Bajo', 'Medio', 'Alto'])}
      <div class="grupo"><h4>¿Qué ha pasado hoy?</h4><div class="chips">${ETIQUETAS.map((e) => `<button type="button" class="opcion ${b.etiquetas.includes(e) ? 'on' : ''}" aria-pressed="${b.etiquetas.includes(e)}" data-accion="etiqueta" data-e="${esc(e)}">${e}</button>`).join('')}</div></div>
      ${perfil.sigueCiclo ? `<div class="caja">${interruptor('borrador.regla', b.regla, 'Hoy le ha bajado la regla')}</div>` : ''}
      <textarea class="caja" rows="2" maxlength="280" placeholder="Nota (opcional)" data-modelo="borrador.nota" aria-label="Nota">${esc(b.nota)}</textarea>
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="guardarParte" ${b.animo ? '' : 'disabled'}>${b.existia ? 'Actualizar parte' : 'Guardar parte'}</button></div>`;
}

// ---------- Niveles ----------

function hojaNiveles() {
  const dias = diasRegistrados();
  const extras = totalExtras(estado);
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Hecho</button></div>
    <div class="hoja-cuerpo">
      <h2>Niveles</h2>
      <p class="fecha">Cada día registrado acerca a Stormy al mes completo que necesita para aprender.</p>
      ${NIVELES.map((n) => {
        const ok = dias >= n.dias;
        return `<div class="tarjeta nivel ${ok ? '' : 'pendiente'}"><span class="insignia ${ok ? '' : 'gris'}">${ok ? ICONOS[n.icono] : ICONOS.candado}</span>
          <div><h3>${n.titulo}</h3><p>${n.premio}</p></div><b>${n.dias === 0 ? 'Inicio' : ok ? `Día ${n.dias}` : `Faltan ${n.dias - dias}`}</b></div>`;
      }).join('')}
      <div class="tarjeta"><div class="extra-cab"><h3>Datos extra</h3><span class="cifra-acento">${extras}</span></div>
        <p class="nota">Sueño, estrés, etiquetas y notas. Cuantos más aportes, más factores puede explicar Stormy.</p>
        <div class="insignias">${INSIGNIAS.map(([umbral, nombre]) => `<div class="${extras >= umbral ? 'on' : ''}"><span>${extras >= umbral ? ICONOS.medalla : ICONOS.candado}</span><b>${nombre}</b><small>${umbral} datos</small></div>`).join('')}</div>
      </div>
    </div>`;
}

function hojaNivelNuevo() {
  const n = ui.hoja.nivel;
  return `<div class="hoja-cuerpo celebracion">
      <span class="insignia grande">${ICONOS[n.icono]}</span>
      <p class="rotulo">¡Nivel desbloqueado!</p>
      <h2>${n.titulo}</h2>
      <p>Llevas ${n.dias} días registrados. Ahora tienes: ${n.premio.toLowerCase()}.</p>
    </div>
    <div class="hoja-pie"><button class="principal" data-accion="cerrarHoja">Genial</button></div>`;
}

// ---------- Nimbo, el ayudante ----------

const contextoNimbo = () => ({ motor: motor(), entradas: estado.entradas, perfil: estado.perfil, hoy: hoyIso() });

function hojaNimbo() {
  const mensajes = ui.chat
    .map((m) => `<div class="burbuja ${m.de}">${m.de === 'nimbo' ? avatarNimbo(30) : ''}<p>${esc(m.texto)}</p></div>`)
    .join('');
  const pensando = ui.pensando ? `<div class="burbuja nimbo">${avatarNimbo(30)}<p class="puntos-pensando" aria-label="Stormy está escribiendo"><i></i><i></i><i></i></p></div>` : '';
  return `<div class="hoja-cab nimbo-cab">${avatarNimbo(44)}<div><h3>${NIMBO.nombre}</h3><p>${NIMBO.cargo}</p></div><button class="texto-boton" data-accion="cerrarHoja">Cerrar</button></div>
    <div class="hoja-cuerpo chat" role="log" aria-live="polite">${mensajes}${pensando}</div>
    <div class="hoja-pie nimbo-pie">
      <div class="sugerencias">${NIMBO.sugerencias.map((s) => `<button type="button" class="opcion" data-accion="preguntar" data-q="${esc(s)}">${s}</button>`).join('')}</div>
      <form id="form-nimbo" autocomplete="off"><input type="text" id="pregunta" placeholder="Pregúntale a Stormy" enterkeyhint="send" maxlength="140" aria-label="Tu pregunta para Stormy"><button type="submit" class="enviar" aria-label="Enviar">${ICONOS.subir}</button></form>
    </div>`;
}

function preguntaANimbo(texto) {
  const pregunta = texto.trim();
  if (!pregunta || ui.pensando) return;
  const teniaFoco = document.activeElement?.id === 'pregunta';
  ui.chat.push({ de: 'yo', texto: pregunta });
  ui.pensando = true;
  pintaHoja();
  if (teniaFoco) $('#pregunta')?.focus();
  setTimeout(() => {
    const turno = ui.chat.filter((m) => m.de === 'yo').length;
    ui.chat.push({ de: 'nimbo', texto: responder(pregunta, contextoNimbo(), turno).texto });
    ui.pensando = false;
    if (ui.hoja?.tipo !== 'nimbo') return;
    const foco = document.activeElement?.id === 'pregunta';
    const escrito = $('#pregunta')?.value ?? '';
    pintaHoja();
    if ($('#pregunta')) $('#pregunta').value = escrito;
    if (foco) $('#pregunta')?.focus();
  }, 450);
}

function hojaConfirmar() {
  const c = ui.hoja;
  return `<div class="hoja-cuerpo celebracion"><h2>${c.titulo}</h2><p>${c.texto}</p></div>
    <div class="hoja-pie"><button class="principal peligro" data-accion="${c.accion}">${c.boton}</button><button class="secundario oscuro" data-accion="cerrarHoja">Cancelar</button></div>`;
}

function hojaTexto() {
  const c = ui.hoja;
  return `<div class="hoja-cab fin"><button class="texto-boton" data-accion="cerrarHoja">Hecho</button></div>
    <div class="hoja-cuerpo"><h2>${c.titulo}</h2>${c.bloques.map(([t, x]) => `<div class="tarjeta"><h3>${t}</h3><p class="nota">${x}</p></div>`).join('')}</div>`;
}

// ---------- Calendario ----------

function vistaCalendario() {
  const hoy = hoyIso();
  const m = motor();
  const [a, mes] = ui.mes.split('-').map(Number);
  const primero = `${ui.mes}-01`;
  const n0 = aNum(primero);
  const numDias = new Date(Date.UTC(a, mes, 0)).getUTCDate();
  const hueco = (diaSemana(n0) + 6) % 7;
  const esMesActual = ui.mes === hoy.slice(0, 7);
  const sigue = estado.perfil.sigueCiclo;

  let celdas = '<i></i>'.repeat(hueco);
  const delMes = [];
  for (let i = 0; i < numDias; i++) {
    const iso = aIso(n0 + i);
    const e = estado.entradas[iso];
    if (e) delMes.push(e);
    const futuro = iso > hoy;
    const regla = sigue && (e?.regla || m.fase(iso) === 'menstrual');
    celdas += `<button type="button" class="dia ${iso === hoy ? 'hoy' : ''} ${futuro ? 'futuro' : ''}" ${futuro ? 'disabled' : ''} data-accion="abrirRegistro" data-dia="${iso}"
      aria-label="${fecha(iso, { day: 'numeric', month: 'long' })}: ${e ? TIEMPOS[e.animo].titulo : futuro ? 'día futuro' : 'sin registrar'}">
      <span>${i + 1}</span>${e ? ficha(e.animo, 34) : `<span class="vacio">${iso === hoy ? ICONOS.mas : ''}</span>`}<em class="${regla ? 'on' : ''}"></em></button>`;
  }

  let resumen;
  if (!delMes.length) {
    resumen = '<p class="nota">Aún no hay partes este mes. Toca un día para registrarlo.</p>';
  } else {
    const med = delMes.reduce((s, e) => s + e.animo, 0) / delMes.length;
    resumen = `<p class="nota">${delMes.length} ${delMes.length === 1 ? 'parte' : 'partes'} · clima medio: ${TIEMPOS[tiempoDe(med)].titulo.toLowerCase()}</p>
      <div class="recuento">${ORDEN_TIEMPOS.map((t) => `<div>${ficha(t, 34)}<b>${delMes.filter((e) => e.animo === t).length}</b></div>`).join('')}</div>`;
  }

  return `<main class="pagina">
    <h1>Calendario</h1>
    ${tarjeta(`<div class="mes-cab">
        <button type="button" data-accion="mes" data-d="-1" aria-label="Mes anterior">${ICONOS.izquierda}</button>
        <h3>${mayus(fecha(primero, { month: 'long', year: 'numeric' }))}</h3>
        <button type="button" data-accion="mes" data-d="1" aria-label="Mes siguiente" ${esMesActual ? 'disabled' : ''}>${ICONOS.derecha}</button>
      </div>
      <div class="rejilla cab">${SEMANA.orden.map((d) => `<span>${SEMANA.inicial[d]}</span>`).join('')}</div>
      <div class="rejilla">${celdas}</div>`)}
    ${tarjeta(`<h3>Resumen del mes</h3>${resumen}`)}
    ${sigue ? '<p class="leyenda"><em class="on"></em> Regla (registrada o estimada)</p>' : ''}
  </main>`;
}

// ---------- Descubrimientos ----------

function vistaDescubrimientos() {
  const m = motor();
  const dias = m.dias;
  const bloqueada = (titulo, necesarios) =>
    tarjeta(`<header class="encabezado"><span class="marca gris">${ICONOS.candado}</span><div><h3>${titulo}</h3><p>Se desbloquea con ${necesarios} días · faltan ${necesarios - dias}</p></div></header>
      <div class="progreso"><i style="width:${(dias / necesarios) * 100}%"></i></div>`);

  return `<main class="pagina">
    <h1>Descubrimientos</h1>
    ${historico()}
    ${dias >= 7 ? patronSemanal(m) : bloqueada('Patrón semanal', 7)}
    ${dias >= 14 ? factores(m) : bloqueada('Factores que influyen', 14)}
    ${dias >= 21 ? mapaCiclo(m) : bloqueada('Mapa del ciclo', 21)}
    ${dias >= 30 ? precision(m) : bloqueada('Precisión de Stormy', 30)}
    <p class="aviso">Los patrones salen solo de vuestros registros. Con pocos días son orientativos: tómatelos con humor.</p>
  </main>`;
}

function historico() {
  const ultimas = Object.entries(estado.entradas).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-30);
  let cuerpo;
  if (ultimas.length < 2) {
    cuerpo = '<p class="nota">Registra al menos dos días para ver la evolución.</p>';
  } else {
    const W = 300, H = 150;
    const x = (i) => 8 + (i * (W - 16)) / (ultimas.length - 1);
    const y = (a) => H - 15 - (a - 1) * 30;
    const puntos = ultimas.map(([, e], i) => `${x(i).toFixed(1)},${y(e.animo)}`).join(' ');
    cuerpo = `<div class="grafico">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de la evolución del tiempo en casa">
          ${[1, 2, 3, 4, 5].map((a) => `<line class="guia" x1="0" x2="${W}" y1="${y(a)}" y2="${y(a)}"/>`).join('')}
          <polyline class="linea-graf" points="${puntos}"/>
        </svg>
        <div class="puntos">${ultimas.map(([, e], i) => `<i style="left:${(x(i) / W) * 100}%;top:${(y(e.animo) / H) * 100}%;background:${TIEMPOS[e.animo].tinte}"></i>`).join('')}</div>
        <div class="eje">${ORDEN_TIEMPOS.map((t) => ficha(t, 20)).join('')}</div>
      </div>
      <div class="eje-x"><span>${fecha(ultimas[0][0], { day: 'numeric', month: 'short' })}</span><span>${fecha(ultimas[ultimas.length - 1][0], { day: 'numeric', month: 'short' })}</span></div>`;
  }
  return tarjeta(encabezado('historia', 'Histórico', `Los últimos ${Math.max(ultimas.length, 1)} partes`) + cuerpo);
}

function patronSemanal(m) {
  const medias = m.mediasPorDiaSemana();
  const con = medias.filter((x) => x.dias > 0);
  const mejor = con.reduce((a, b) => (b.media > a.media ? b : a), con[0]);
  const peor = con.reduce((a, b) => (b.media < a.media ? b : a), con[0]);
  return tarjeta(`${encabezado('semana', 'Patrón semanal', 'Tiempo medio por día de la semana')}
    <div class="barras">${medias.map((x) => `<div><span class="col"><i style="height:${x.dias ? (x.media / 5) * 100 : 0}%;background:${TIEMPOS[tiempoDe(x.media || 3)].tinte}"></i></span><small>${x.titulo}</small></div>`).join('')}</div>
    ${mejor && peor && mejor.id !== peor.id ? `<p class="texto-normal">El mejor día suelen ser los <strong>${SEMANA.plural[mejor.id]}</strong>; los más cubiertos, los <strong>${SEMANA.plural[peor.id]}</strong>.</p>` : ''}`);
}

function factores(m) {
  const lista = m.factores().slice(0, 6);
  const cuerpo = lista.length
    ? `${lista.map((f) => `<div class="factor"><span class="${f.delta >= 0 ? 'sube' : 'baja'}">${f.delta >= 0 ? '↗' : '↘'}</span><div><strong>${esc(f.titulo)}</strong><small>${f.dias} días</small></div><b>${f.delta >= 0 ? '+' : '−'}${num(Math.abs(f.delta))}</b></div>`).join('')}
       <p class="mini">En niveles de tiempo (de 1 a 5). Son coincidencias observadas, no causas demostradas.</p>`
    : '<p class="nota">Añade datos extra (sueño, estrés, etiquetas) al registrar y aquí verás qué mueve el clima de casa.</p>';
  return tarjeta(encabezado('factores', 'Factores que influyen', 'Diferencia frente a un día normal') + cuerpo);
}

function mapaCiclo(m) {
  const fases = m.mediasPorFase();
  const cuerpo = fases.length
    ? `${fases.map((f) => `<div class="factor">${f.dias ? ficha(tiempoDe(f.media), 38) : '<span class="ficha-vacia"></span>'}<div><strong>${f.titulo}</strong><small>${f.dias ? `${TIEMPOS[tiempoDe(f.media)].titulo} · ${f.dias} días` : 'Sin datos todavía'}</small></div>${f.dias ? `<b>${num(f.media)}</b>` : ''}</div>`).join('')}
       <p class="mini">Ciclo de ${m.duracion} días. Con un solo mes es una primera foto: se afina con cada ciclo.</p>`
    : '<p class="nota">Activa el seguimiento del ciclo en Ajustes (si ella quiere compartirlo) para ver este mapa.</p>';
  return tarjeta(encabezado('ciclo', 'Mapa del ciclo', 'Tiempo medio en cada fase') + cuerpo);
}

function precision(m) {
  const p = m.precision();
  return tarjeta(`${encabezado('diana', 'Precisión de Stormy', 'Comprobada contra vuestros propios registros')}
    <div class="cifras"><div><b>${pct(p.exacto)}</b><small>acierto exacto</small></div><div><b>${pct(p.cercano)}</b><small>acierta o roza</small></div><div><b>${num(p.error)}</b><small>desvío medio</small></div></div>
    <p class="mini">Para cada uno de los ${p.dias} días, Stormy lo predice sin mirar ese día y se compara con lo que registraste. «Roza» significa fallar por un solo nivel.</p>`);
}

// ---------- Ajustes ----------

const enPantallaDeInicio = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function vistaAjustes() {
  const p = estado.perfil;
  let instalar = '';
  if (!enPantallaDeInicio()) {
    instalar = `<h2 class="seccion">Instalar</h2><div class="tarjeta lista">${
      ui.instalar
        ? '<button type="button" class="enlace" data-accion="instalar">Instalar en este dispositivo</button>'
        : `<p class="nota">${esIOS()
            ? 'En Safari, toca el botón Compartir y elige «Añadir a pantalla de inicio». Se abrirá como una app y funcionará sin conexión.'
            : 'En el menú del navegador, elige «Instalar aplicación» o «Añadir a pantalla de inicio». Funcionará sin conexión.'}</p>`
    }</div>`;
  }
  return `<main class="pagina">
    <h1>Ajustes</h1>
    <h2 class="seccion">Tu pareja</h2>
    <div class="tarjeta lista">
      <label class="linea"><span>Nombre</span><input type="text" data-modelo="perfil.nombre" value="${esc(p.nombre)}" placeholder="Nombre" autocomplete="off" maxlength="30"></label>
      ${interruptor('perfil.conNacimiento', !!p.nacimiento, 'Fecha de nacimiento')}
      ${p.nacimiento ? `<label class="linea"><span>Nacimiento</span><input type="date" data-modelo="perfil.nacimiento" value="${p.nacimiento}" max="${hoyIso()}"></label>` : ''}
    </div>
    <h2 class="seccion">Ciclo menstrual</h2>
    <div class="tarjeta lista">
      ${interruptor('perfil.sigueCiclo', p.sigueCiclo, 'Tener en cuenta el ciclo')}
      ${p.sigueCiclo ? `<label class="linea"><span>Última regla</span><input type="date" data-modelo="perfil.ultimaRegla" value="${p.ultimaRegla ?? hoyIso()}" max="${hoyIso()}"></label>
      <div class="linea"><span>Duración: ${p.duracion} días</span>${paso('perfil.duracion', p.duracion)}</div>` : ''}
    </div>
    <p class="pie-seccion">Opcional y solo si ella quiere compartirlo.</p>
    <h2 class="seccion">Recordatorio</h2>
    <div class="tarjeta lista">
      <label class="linea"><span>Hora del aviso</span><input type="time" data-modelo="perfil.horaAviso" value="${p.horaAviso}"></label>
      <button type="button" class="enlace" data-accion="recordatorio">Añadir aviso diario al calendario</button>
    </div>
    <p class="pie-seccion">Crea un evento diario con alarma y enlace a la app. Para quitarlo, bórralo desde tu calendario.</p>
    ${instalar}
    <h2 class="seccion">Información</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace neutro" data-accion="verHistoria">La historia de Stormy<span>${ICONOS.derecha}</span></button>
      <button type="button" class="enlace neutro" data-accion="verComo">Cómo funciona Stormy<span>${ICONOS.derecha}</span></button>
      <button type="button" class="enlace neutro" data-accion="verPrivacidad">Privacidad y juego limpio<span>${ICONOS.derecha}</span></button>
    </div>
    <h2 class="seccion">Tus datos</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace" data-accion="exportar">Descargar una copia de mis datos</button>
      <button type="button" class="enlace peligro" data-accion="pedirBorrarPartes">Borrar todos los partes</button>
      <button type="button" class="enlace peligro" data-accion="pedirBorrarTodo">Borrar todo y volver a empezar</button>
    </div>
    <h2 class="seccion">Zona de pruebas</h2>
    <div class="tarjeta lista">
      <button type="button" class="enlace" data-accion="sembrar" data-n="30">Cargar 30 días de ejemplo</button>
      <button type="button" class="enlace" data-accion="sembrar" data-n="10">Cargar 10 días de ejemplo</button>
    </div>
    <p class="pie-seccion">Los datos de ejemplo sustituyen a los partes actuales.<br><br>${APP.nombre} 1.0 · Entretenimiento, no consejo médico.</p>
  </main>`;
}

const HISTORIA = [
  ['Una nube con carácter', 'Stormy nació una tarde de domingo, en mitad de una discusión por el mando de la tele. Era una nube pequeña y se quedó con un rayo de recuerdo.'],
  ['Su oficio', 'Desde entonces vive en casa y hace lo único que sabe: mirar el cielo. Apunta contigo qué tiempo hace cada día y busca lo que se repite.'],
  ['Lo que no hace', 'No adivina a nadie ni toma partido. Avisa de cuándo puede tronar para que llegues con paraguas, y celebra los días de sol para que no se te pasen.'],
  ['Su lema', 'Las tormentas pasan. Lo importante es verlas venir juntos.'],
];
const COMO = [
  ['Un mes de observación', 'Stormy necesita 30 días de partes para buscar un patrón que se repita. Antes de eso, el pronóstico es genérico y lo marca con una fiabilidad baja.'],
  ['Qué tiene en cuenta', 'Tu media personal, el día de la semana, la fase del ciclo (si la activáis) y la inercia de los últimos días. Los datos extra explican qué factores acompañan a los días buenos y malos.'],
  ['Prudencia con pocos datos', 'Con pocos días, cada efecto se reduce a propósito para no sacar conclusiones de una casualidad. La fiabilidad sube con cada parte.'],
  ['Cómo se mide el acierto', 'Al llegar a 30 días, Stormy predice cada día registrado sin mirarlo y lo compara con lo que apuntaste. Esa cifra es la que ves en Descubrimientos.'],
  ['Lo que no es', 'No es ciencia médica ni una forma de adivinar a nadie. Es un juego para prestar más atención a quien tienes al lado. El horóscopo es solo una broma y no entra en el cálculo.'],
];
const PRIVACIDAD = [
  ['Todo se queda en tu dispositivo', 'No hay cuentas, servidores ni publicidad. Los datos se guardan en este navegador y no salen de él.'],
  ['Con su consentimiento', 'Los partes hablan de tu pareja. Úsala solo si ella lo sabe y le parece bien; si cambia de opinión, borra los datos desde Ajustes.'],
  ['El ciclo es opcional', 'Solo se usa si ella quiere compartirlo. Puedes desactivarlo en cualquier momento.'],
  ['Copia y borrado', 'Puedes descargar una copia de tus datos o borrarlo todo de forma definitiva desde Ajustes. Si borras los datos del navegador, también se pierden.'],
  ['Entretenimiento', 'No es una herramienta médica ni psicológica y no sustituye a hablar con tu pareja.'],
];

// ---------- Pintado ----------

const VISTAS = { hoy: vistaHoy, calendario: vistaCalendario, descubrimientos: vistaDescubrimientos, ajustes: vistaAjustes };
const PESTANAS = [['hoy', 'Hoy', 'hoy'], ['calendario', 'Calendario', 'calendario'], ['descubrimientos', 'Descubrimientos', 'grafico'], ['ajustes', 'Ajustes', 'ajustes']];

function pinta({ arriba = false } = {}) {
  const vista = $('#vista');
  const y = arriba ? 0 : scrollY;
  const alta = estado.perfil.alta;
  if (!VISTAS[ui.pestana]) ui.pestana = 'hoy';
  vista.innerHTML = alta ? VISTAS[ui.pestana]() : bienvenida();

  // Cada estado es un campo de color plano; el texto va en tinta, salvo sobre la tormenta.
  let campo = null;
  if (!alta) campo = TIEMPOS[4];
  else if (ui.pestana === 'hoy') {
    const hoy = hoyIso();
    campo = TIEMPOS[estado.entradas[hoy]?.animo ?? motor().pronostico(hoy).tiempo];
  }
  document.body.classList.toggle('con-cielo', !!campo);
  document.body.classList.toggle('cielo-oscuro', campo?.sobre === '#FFFFFF');
  if (campo) {
    const c = campo.cielo;
    document.body.style.setProperty('--cielo', `linear-gradient(${c[0]}, ${c[1]} 55%, ${c[2]})`);
    document.body.style.setProperty('--sobre', campo.sobre);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', c[0]);
  } else {
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', matchMedia('(prefers-color-scheme: dark)').matches ? '#12152B' : '#F6F4FB');
  }

  $('#barra').innerHTML = alta
    ? PESTANAS.map(([id, nombre, icono]) => `<button type="button" class="${ui.pestana === id ? 'on' : ''}" ${ui.pestana === id ? 'aria-current="page"' : ''} data-accion="pestana" data-id="${id}">${ICONOS[icono]}<span>${nombre}</span></button>`).join('')
    : '';
  $('#barra').hidden = !alta;
  $('#nimbo').innerHTML = alta ? avatarNimbo(58) : '';
  $('#nimbo').hidden = !alta;
  scrollTo(0, y);
}

const HOJAS = { registro: hojaRegistro, niveles: hojaNiveles, nivel: hojaNivelNuevo, confirmar: hojaConfirmar, texto: hojaTexto, nimbo: hojaNimbo };

function pintaHoja(nueva = false) {
  const cont = $('#hoja');
  if (!ui.hoja) {
    cont.innerHTML = '';
    document.body.classList.remove('con-hoja');
    return;
  }
  const previo = cont.querySelector('.hoja-cuerpo')?.scrollTop ?? 0;
  const baja = ['nivel', 'confirmar'].includes(ui.hoja.tipo);
  // El chat de Stormy es una ventana pequeña y flotante, no una hoja a pantalla completa.
  const chat = ui.hoja.tipo === 'nimbo';
  cont.innerHTML = `<div class="velo ${chat ? 'suave' : ''} ${nueva ? 'entra' : ''}" data-accion="cerrarHoja"></div>
    <section class="hoja ${baja ? 'baja' : ''} ${chat ? 'flotante' : ''} ${nueva ? 'entra' : ''}" role="dialog" aria-modal="true">${HOJAS[ui.hoja.tipo]()}</section>`;
  document.body.classList.add('con-hoja');
  const cuerpo = cont.querySelector('.hoja-cuerpo');
  if (cuerpo && !nueva) cuerpo.scrollTop = previo;
  if (cuerpo && ui.hoja.tipo === 'nimbo') cuerpo.scrollTop = cuerpo.scrollHeight;
  if (nueva) cont.querySelector('.hoja').focus?.();
}

function abreHoja(hoja) {
  ui.hoja = hoja;
  pintaHoja(true);
}

let avisoTemporal;
function avisa(texto) {
  const t = $('#aviso');
  t.textContent = texto;
  t.classList.add('on');
  clearTimeout(avisoTemporal);
  avisoTemporal = setTimeout(() => t.classList.remove('on'), 2600);
}

function descarga(nombre, tipo, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Evento diario con alarma para el calendario del dispositivo: recordatorio sin servidor. */
function recordatorioICS(hora) {
  const [h, min] = hora.split(':');
  const hoy = hoyIso().replaceAll('-', '');
  const url = location.origin + location.pathname;
  const sello = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stormy//Recordatorio//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:parte-diario@stormy', `DTSTAMP:${sello}`, `DTSTART:${hoy}T${h}${min}00`, 'DURATION:PT5M',
    'RRULE:FREQ=DAILY', 'SUMMARY:¿Qué tiempo hace hoy en casa?', `DESCRIPTION:Registra el parte de hoy en 5 segundos: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:¿Qué tiempo hace hoy en casa?', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

// ---------- Acciones ----------

const acciones = {
  siguiente() {
    if (ui.paso === 1 && !ui.alta.consiente) return;
    ui.paso = Math.min(PASOS - 1, ui.paso + 1);
    pinta({ arriba: true });
  },
  atras() {
    ui.paso = Math.max(0, ui.paso - 1);
    pinta({ arriba: true });
  },
  terminar(d) {
    const a = ui.alta;
    Object.assign(estado.perfil, {
      nombre: a.nombre.trim(), nacimiento: a.conNacimiento ? a.nacimiento : null, sigueCiclo: a.sigueCiclo,
      duracion: a.duracion, ultimaRegla: a.sigueCiclo ? a.ultimaRegla : null, consentimiento: hoyIso(), horaAviso: a.hora, alta: true,
    });
    guardar(estado);
    if (d.aviso) descarga('stormy-recordatorio.ics', 'text/calendar', recordatorioICS(a.hora));
    ui.pestana = 'hoy';
    pinta({ arriba: true });
  },
  pasoNumero(d) {
    const [raiz, campo] = d.modelo.split('.');
    const destino = raiz === 'alta' ? ui.alta : estado.perfil;
    destino[campo] = Math.min(40, Math.max(21, destino[campo] + Number(d.d)));
    if (raiz === 'perfil') guardar(estado);
    pinta();
  },
  pestana(d) {
    const cambia = ui.pestana !== d.id;
    ui.pestana = d.id;
    pinta({ arriba: cambia });
  },
  abrirRegistro(d) {
    const dia = d.dia || hoyIso();
    const e = estado.entradas[dia];
    ui.borrador = { dia, animo: e?.animo ?? null, sueno: e?.sueno ?? null, estres: e?.estres ?? null, etiquetas: [...(e?.etiquetas ?? [])], regla: !!e?.regla, nota: e?.nota ?? '', existia: !!e };
    abreHoja({ tipo: 'registro' });
  },
  elegirTiempo(d) {
    ui.borrador.animo = Number(d.t);
    navigator.vibrate?.(8);
    pintaHoja();
  },
  triple(d) {
    const v = Number(d.v);
    ui.borrador[d.campo] = ui.borrador[d.campo] === v ? null : v;
    pintaHoja();
  },
  etiqueta(d) {
    const lista = ui.borrador.etiquetas;
    const i = lista.indexOf(d.e);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(d.e);
    pintaHoja();
  },
  guardarParte() {
    const b = ui.borrador;
    if (!b?.animo) return;
    const antes = nivelActual(diasRegistrados());
    estado.entradas[b.dia] = { animo: b.animo, sueno: b.sueno, estres: b.estres, etiquetas: ETIQUETAS.filter((e) => b.etiquetas.includes(e)), nota: b.nota.trim(), regla: b.regla };
    if (b.regla && (!estado.perfil.ultimaRegla || b.dia > estado.perfil.ultimaRegla)) estado.perfil.ultimaRegla = b.dia;
    const ok = guardar(estado);
    const despues = nivelActual(diasRegistrados());
    ui.borrador = null;
    ui.hoja = null;
    pinta({ arriba: ui.pestana === 'hoy' });
    if (despues.id !== antes.id) abreHoja({ tipo: 'nivel', nivel: despues });
    else pintaHoja();
    if (!ok) avisa('No se ha podido guardar en este navegador');
  },
  cerrarHoja() {
    ui.hoja = null;
    ui.borrador = null;
    pintaHoja();
  },
  abrirNiveles() {
    abreHoja({ tipo: 'niveles' });
  },
  abrirNimbo() {
    if (!ui.chat.length) ui.chat.push({ de: 'nimbo', texto: saludo(contextoNimbo()) });
    abreHoja({ tipo: 'nimbo' });
  },
  preguntar(d) {
    preguntaANimbo(d.q);
  },
  mes(d) {
    const [a, m] = ui.mes.split('-').map(Number);
    const f = new Date(Date.UTC(a, m - 1 + Number(d.d), 1));
    const nuevo = f.toISOString().slice(0, 7);
    if (nuevo > hoyIso().slice(0, 7)) return;
    ui.mes = nuevo;
    pinta();
  },
  verHistoria() {
    abreHoja({ tipo: 'texto', titulo: 'La historia de Stormy', bloques: HISTORIA });
  },
  verComo() {
    abreHoja({ tipo: 'texto', titulo: 'Cómo funciona', bloques: COMO });
  },
  verPrivacidad() {
    abreHoja({ tipo: 'texto', titulo: 'Privacidad', bloques: PRIVACIDAD });
  },
  recordatorio() {
    descarga('stormy-recordatorio.ics', 'text/calendar', recordatorioICS(estado.perfil.horaAviso));
    avisa('Abre el archivo para añadirlo a tu calendario');
  },
  exportar() {
    descarga(`stormy-${hoyIso()}.json`, 'application/json', JSON.stringify(estado, null, 2));
  },
  sembrar(d) {
    guardar(sembrar(estado, Number(d.n)));
    avisa(`Cargados ${d.n} días de ejemplo`);
    pinta();
  },
  pedirBorrarPartes() {
    abreHoja({ tipo: 'confirmar', titulo: '¿Borrar todos los partes?', texto: 'Se perderá el progreso de niveles. No se puede deshacer.', boton: 'Borrar partes', accion: 'borrarPartes' });
  },
  pedirBorrarTodo() {
    abreHoja({ tipo: 'confirmar', titulo: '¿Borrar todo?', texto: 'Se borran los partes y la configuración, y la app vuelve a la bienvenida. No se puede deshacer.', boton: 'Borrar todo', accion: 'borrarTodo' });
  },
  borrarPartes() {
    estado.entradas = {};
    guardar(estado);
    ui.hoja = null;
    pintaHoja();
    pinta();
  },
  borrarTodo() {
    estado = borrarTodo();
    Object.assign(ui, { hoja: null, paso: 0, pestana: 'hoy' });
    ui.alta.consiente = false;
    pintaHoja();
    pinta({ arriba: true });
  },
  async instalar() {
    if (!ui.instalar) return;
    ui.instalar.prompt();
    await ui.instalar.userChoice.catch(() => null);
    ui.instalar = null;
    pinta();
  },
  async compartir() {
    const hoy = hoyIso();
    const t = estado.entradas[hoy]?.animo ?? motor().pronostico(hoy).tiempo;
    const texto = `${estado.entradas[hoy] ? 'Hoy en casa' : 'Previsión de hoy en casa'}: ${TIEMPOS[t].emoji} ${TIEMPOS[t].titulo.toLowerCase()}. ${consejoDe(t, hoy)}`;
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: APP.nombre, text: texto, url });
      else {
        await navigator.clipboard.writeText(`${texto} ${url}`);
        avisa('Copiado. Pégalo donde quieras');
      }
    } catch {
      /* el usuario canceló */
    }
  },
};

// ---------- Eventos ----------

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-accion]');
  if (!el || el.disabled) return;
  acciones[el.dataset.accion]?.(el.dataset);
});

function alCambiar(ev) {
  const el = ev.target.closest('[data-modelo]');
  if (!el || el.tagName === 'BUTTON') return;
  const [raiz, campo] = el.dataset.modelo.split('.');
  const casilla = el.type === 'checkbox';
  const valor = casilla ? el.checked : el.value;

  if (raiz === 'alta') {
    if (!casilla && !valor && el.type !== 'text') return;
    ui.alta[campo] = valor;
    if (casilla) pinta();
  } else if (raiz === 'borrador') {
    ui.borrador[campo] = valor;
    if (casilla) pintaHoja();
  } else if (raiz === 'perfil') {
    const p = estado.perfil;
    if (campo === 'conNacimiento') p.nacimiento = valor ? '1992-06-15' : null;
    else if (campo === 'sigueCiclo') {
      p.sigueCiclo = valor;
      if (valor && !p.ultimaRegla) p.ultimaRegla = hoyIso();
    } else if (!casilla && !valor && el.type !== 'text') return;
    else p[campo] = valor;
    guardar(estado);
    if (casilla) pinta();
  }
}
document.addEventListener('input', alCambiar);

document.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-nimbo') return;
  ev.preventDefault();
  const campo = $('#pregunta');
  const texto = campo.value;
  campo.value = '';
  preguntaANimbo(texto);
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && ui.hoja) acciones.cerrarHoja();
  if (ev.key === 'Enter' && ev.target.matches?.('input[type=text]') && ev.target.id !== 'pregunta') ev.target.blur();
});

addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  ui.instalar = ev;
  if (ui.pestana === 'ajustes' && estado.perfil.alta) pinta();
});

// Al volver a la app otro día, refresca el parte.
let diaPintado = hoyIso();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && diaPintado !== hoyIso()) {
    diaPintado = hoyIso();
    ui.mes = diaPintado.slice(0, 7);
    if (!ui.hoja) pinta();
  }
});

// Con el teclado abierto en el móvil, la ventana del chat sube para que el campo de texto siga a la vista.
if (window.visualViewport) {
  const ajusta = () => {
    const tapado = Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop);
    document.documentElement.style.setProperty('--teclado', `${Math.round(tapado)}px`);
  };
  visualViewport.addEventListener('resize', ajusta);
  visualViewport.addEventListener('scroll', ajusta);
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

pinta();
