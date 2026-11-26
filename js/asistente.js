// Stormy, el ayudante (en el código, «Nimbo»). Responde preguntas a partir de los datos del dispositivo.
// No usa ningún servicio externo: reconoce la intención de la pregunta y redacta la respuesta con el modelo local.
// Personalidad: hombre del tiempo de la tele, guasón, de parte de la casa entera y honesto con lo que no sabe.
// Del ciclo menstrual habla en tono formal y sin bromas.
import { FASES, SEMANA, aIso, aNum, diaSemana, diasDePronostico, nivelActual, nivelSiguiente, premioDe, racha, tiempoDe } from './motor.js';
import { TIEMPOS, consejoDe, horoscopoDe } from './contenido.js';
import { estacion, faseLunar, textoLuz } from './cielo.js';
import { quienDe } from './datos.js';
import { AYUDA, eligeLibre, temaLibre } from './respuestas.js';
import { BONO_NIVEL, CHAT, COFRES, COLECCIONABLES, CURIOSIDAD, GARANTIA, RAREZAS, chatHoy, cofresGratis, destacadoDe, garantiaEn, saldo, tiendaVacia } from './tienda.js';

export const NIMBO = { nombre: 'Stormy', cargo: 'Predictor de tormentas' };

/** Preguntas sugeridas; la del ciclo solo aparece si el ciclo está activado. */
export const sugerenciasDe = (perfil) => [
  '¿Qué tal hoy?', '¿Y mañana?', '¿Qué influye en el ambiente de casa?', '¿Qué hay en la tienda?', '¿Qué dice el horóscopo de hoy?',
  ...(perfil?.sigueCiclo ? ['¿Cómo funciona el ciclo menstrual?'] : []),
  '¿Cuándo propongo un plan?', '¿Aciertas mucho?', '¿Cómo va el mes?',
];

// Lo que dice Stormy justo después de apuntar el parte.
const REACCIONES = {
  5: ['¡Anticiclón en casa! Apuntado, y que dure.', 'Sol a raudales. Me lo guardo para los días nublados.'],
  4: ['Buen tiempo con alguna nube: así da gusto hacer el parte.', 'Apuntado. Cielo amable el de hoy.'],
  3: ['Día nublado, día normal. También cuenta, y mucho.', 'Apuntado. Los días corrientes son mi mejor materia prima.'],
  2: ['Chubascos anotados. Mañana miro si escampa.', 'Día de paraguas. Gracias por apuntarlo igualmente.'],
  1: ['Tormenta registrada. Pasan todas; esta también.', 'Apuntado sin dramas: las tormentas se ven mejor en el mapa.'],
};
/** @param {number} tiempo  @param {number} giro para alternar las frases sin azar */
export const reaccion = (tiempo, giro = 0) => REACCIONES[tiempo][giro % REACCIONES[tiempo].length];

const limpia = (t) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

const NOMBRES_DIA = [['domingo'], ['lunes'], ['martes'], ['miercoles'], ['jueves'], ['viernes'], ['sabado']];
const SINGULAR = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const num = (v) => v.toFixed(1).replace('.', ',');
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const fechaCorta = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, d)));
};

/**
 * @param {string} pregunta
 * @param {{motor: import('./motor.js').Motor, entradas: Record<string, any>, perfil: any, hoy: string}} ctx
 * @param {number} giro número de turno, para variar las frases sin azar (y poder probarlas)
 * @returns {{texto: string, tema: string}}
 */
export function responder(pregunta, ctx, giro = 0) {
  const q = ` ${limpia(pregunta)} `;
  const { motor, entradas, perfil, hoy } = ctx;
  const quien = quienDe(perfil);
  const consejo = (t, iso) => consejoDe(t, iso, perfil.relacion ?? 'pareja');
  const dias = motor.dias;
  const elige = (xs) => xs[giro % xs.length];
  const hay = (...claves) => claves.some((c) => q.includes(c));
  const desc = (t) => TIEMPOS[t].titulo.toLowerCase();
  const fiab = (p) => `${Math.round(p.fiabilidad * 100)} %`;
  const r = (tema, texto) => ({ tema, texto });
  const visibles = diasDePronostico(dias);

  if (!q.trim()) return r('vacio', 'Te escucho. Pregúntame por hoy, por mañana o por cuándo proponer un plan.');
  // Respuestas creativas cuando la pregunta no es de lo suyo: sin repetir hasta agotar cada montón.
  const azarLibre = ctx.azar ?? (() => ((giro * 0.6180339887) % 1));
  const libre = (tema) => r(`libre-${tema}`, eligeLibre(tema, ctx.memoria ?? {}, azarLibre));
  // Algo serio va antes que nada, y sin bromas.
  const temaPrevio = temaLibre(q);
  if (temaPrevio === 'serio') return r('serio', AYUDA);
  const conPlan = hay(' plan', ' propon', ' propong', ' cuando ');
  // Temas ajenos (comida, deporte, la calle, ligar, trabajo, dinero) antes que las intenciones, salvo que se pida un plan.
  if (['ia', 'chiste', 'insulto'].includes(temaPrevio) || (temaPrevio !== 'general' && !conPlan)) return libre(temaPrevio);

  // --- La tienda: rayos, colección, cofres y garantías. Todo es de adorno; los rayos no tocan el pronóstico. ---
  const tienda = ctx.tienda ?? tiendaVacia();
  const ganados = ctx.ganados ?? 0;
  const misRayos = saldo(ganados, tienda);
  const faltanObjetos = COLECCIONABLES.filter((o) => !tienda.comprados.includes(o.id));
  const pct = (v) => `${Math.round(v * 100)} %`;
  if (hay(' gano rayos', ' ganar rayos', ' conseguir rayos', ' consigo rayos', ' sacar rayos')) {
    const quedaChat = Math.max(0, CHAT.topeDia - chatHoy(tienda, hoy));
    return r('tienda-ganar', `Así se ganan rayos: 10 por cada parte, 2 por cada dato extra y 20 por cada bloque de 7 partes (más un cofre gratis). Al subir de nivel, un bono: ${Object.entries(BONO_NIVEL).map(([d, n]) => `día ${d}, +${n}`).join('; ')}. Charlar conmigo: +${CHAT.primera} la primera pregunta del día y alguna sorpresa, hasta ${CHAT.topeDia} al día; hoy te quedan ${quedaChat}. Y +${CURIOSIDAD} al día por mirar tu horóscopo y otros +${CURIOSIDAD} por «Conoce el ciclo». Son solo para la tienda: el pronóstico no se compra.`);
  }
  if (hay(' cuantos rayos', ' mis rayos', ' rayos tengo', ' saldo')) {
    return r('tienda-saldo', `Tienes ${misRayos} rayos para gastar.${cofresGratis(tienda, dias) ? ' Y un cofre gratis esperándote en la tienda.' : ''} Los rayos no cambian mi pronóstico: aquí no se compran soles.`);
  }
  if (hay(' cuando', ' cuanto falta', ' seguro', ' garantiz') && hay(' legendari')) {
    const g = garantiaEn(tienda);
    return r('tienda-garantia', `Llevas ${tienda.pity.sinLegendario} cofres sin legendario. Como mucho en ${plural(g.legendario, 'cofre', 'cofres')} te toca uno seguro (garantía de ${GARANTIA.legendario}). Y un raro, como muy tarde, en ${plural(g.raro, 'cofre', 'cofres')}.`);
  }
  if (hay(' probabilidad', ' posibilidad', ' cuantas veces', ' porcentaje', ' odds') && hay(' legendari', ' cofre', ' raro')) {
    return r('tienda-probabilidad', `Probabilidad de legendario: ${COFRES.map((c) => `${c.nombre.toLowerCase()}, ${pct(c.prob.legendario)}`).join('; ')}. Además, al cofre ${GARANTIA.legendario} sin legendario te toca uno seguro, y al ${GARANTIA.raro} sin raro, un raro. Si sale algo que ya tienes, eliges lo que no tienes primero; solo con la rareza completa te lo cambio por rayos.`);
  }
  if (hay(' que me falta', ' me queda por', ' conseguir', ' coleccion', ' completar')) {
    if (!faltanObjetos.length) return r('tienda-falta', 'Lo tienes todo. Colección completa: eres oficialmente la casa mejor vestida del barrio meteorológico.');
    const enTiendaFaltan = faltanObjetos.filter((o) => o.via === 'tienda');
    const enCofres = faltanObjetos.filter((o) => o.via === 'cofre');
    const ejemplos = enTiendaFaltan.slice(0, 3).map((o) => o.nombre.toLowerCase()).join(', ');
    const tiendaTxt = enTiendaFaltan.length ? `${plural(enTiendaFaltan.length, 'está', 'están')} en la tienda (${ejemplos}${enTiendaFaltan.length > 3 ? '…' : ''})` : 'de la tienda ya lo tienes todo';
    const cofreTxt = enCofres.length ? `${plural(enCofres.length, 'sale', 'salen')} solo en cofres, y no te digo cuáles: es parte de la gracia` : 'y de los exclusivos de cofre no te falta ninguno';
    return r('tienda-falta', `Te faltan ${faltanObjetos.length} de ${COLECCIONABLES.length}: ${tiendaTxt}; ${cofreTxt}.`);
  }
  if (hay(' recomiend', ' que compro', ' que me compro', ' en que gasto', ' merece la pena comprar') && hay(' compr', ' gast', ' tienda', ' rayos')) {
    const g = garantiaEn(tienda);
    const masBarato = COFRES[0];
    if (g.legendario <= 3 && misRayos >= masBarato.precio) {
      return r('tienda-consejo', `Con ${misRayos} rayos, yo abriría un ${masBarato.nombre.toLowerCase()}: te faltan ${plural(g.legendario, 'cofre', 'cofres')} para el legendario seguro.`);
    }
    const asequibles = faltanObjetos.filter((o) => o.via === 'tienda' && o.precio <= misRayos).sort((a, b) => a.precio - b.precio);
    if (asequibles.length) {
      const o = asequibles[0];
      return r('tienda-consejo', `Con ${misRayos} rayos, mi recomendación es ${o.nombre.toLowerCase()} (${RAREZAS[o.rareza].nombre.toLowerCase()}, ${o.precio} rayos): lo más barato que aún no tienes. Es de adorno, que conste.`);
    }
    const proximo = faltanObjetos.filter((o) => o.via === 'tienda').sort((a, b) => a.precio - b.precio)[0];
    if (!proximo && faltanObjetos.length) {
      return r('tienda-consejo', misRayos >= masBarato.precio
        ? `De la tienda ya lo tienes todo. Lo que te falta solo sale en cofres: con ${misRayos} rayos, un ${masBarato.nombre.toLowerCase()} y a ver qué cae.`
        : `De la tienda ya lo tienes todo; lo que queda sale en cofres. Junta ${masBarato.precio} rayos para el ${masBarato.nombre.toLowerCase()}.`);
    }
    return r('tienda-consejo', proximo
      ? `Ahora tienes ${misRayos} rayos. Lo más barato que te falta es ${proximo.nombre.toLowerCase()}, por ${proximo.precio}: unos días más apuntando y es tuyo.`
      : `Ya lo tienes todo. Guarda los rayos para el comodín de racha, por si algún día se te pasa apuntar.`);
  }
  if (hay(' tienda', ' cofre', ' que puedo comprar', ' que hay para comprar')) {
    const d = destacadoDe(hoy, tienda);
    return r('tienda', `En mi tienda hay caras para mí, escenas para la pantalla de «Hoy», temas de color, reacciones, personalidades para el chat y el comodín de racha, todo de adorno.${d ? ` Hoy destaco: ${d.nombre.toLowerCase()} (${d.precio} rayos).` : ''} Algunas cosas solo salen en cofres; hay cofres desde ${COFRES[0].precio} rayos, con las probabilidades a la vista. Tienes ${misRayos} rayos.`);
  }

  // --- Quién es y qué hace con los datos ---
  if (hay(' quien eres', ' como te llamas', ' que eres', ' presentate', ' tu nombre')) {
    return r('identidad', `Soy Stormy. Nací en mitad de una discusión por el mando de la tele y desde entonces vigilo el cielo de vuestra casa. No leo mentes ni tomo partido: aviso de cuándo puede tronar. Ahora mismo tengo ${plural(dias, 'día', 'días')} de datos.`);
  }
  if (hay(' privacidad', ' mis datos', ' los datos', ' espia', ' guardas', ' servidor')) {
    return r('privacidad', 'Todo lo que sé vive en este dispositivo. No tengo servidor, ni cuenta, ni a quién contárselo. Y si me borras, me llevo el secreto a la tumba.');
  }
  if (hay(' horoscopo', ' signo', ' astros', ' zodiaco')) {
    if (!perfil.nacimiento) return r('horoscopo', 'No tengo fecha de nacimiento, así que hoy los astros descansan. Se puede añadir en Ajustes, aunque te aviso: es un juego, no una predicción.');
    const h = horoscopoDe(perfil.nacimiento, hoy, faseLunar(hoy));
    return r('horoscopo', `${h.signo.emoji} ${h.frase} El único dato real es la luna de hoy: ${h.dato}. No hay pruebas de que el signo prediga nada, y no entra en mis cálculos.`);
  }

  // --- El cielo de verdad: luna, horas de luz y estación ---
  if (hay(' luna', ' horas de luz', ' estacion', ' invierno', ' verano', ' otono', ' primavera', ' cielo de hoy')) {
    const luna = faseLunar(hoy);
    const vistos = motor.automaticos().filter((f) => f.visible && f.tipo !== 'semana').slice(0, 2);
    const efecto = vistos.length
      ? `En vuestros partes sí asoma alguna coincidencia: ${vistos.map((f) => `${f.titulo.toLowerCase()} (${f.delta >= 0 ? '+' : '−'}${num(Math.abs(f.delta))})`).join(', ')}. Coincidencia, no causa.`
      : 'En vuestros partes no veo que la luna, la luz o la estación muevan el clima de casa, así que no los cuento.';
    return r('cielo', `Hoy: ${luna.nombre.toLowerCase()} (aprox.), unas ${textoLuz(hoy)} de luz y ${estacion(hoy).nombre.toLowerCase()}. ${efecto}`);
  }

  // --- Ciclo: explicación general, en tono formal ---
  if (hay(' ciclo', ' regla', ' menstrua') && hay(' como funciona', ' que es ', ' explica', ' en que consiste', ' fases del')) {
    return r('ciclo-info', `El ciclo menstrual se cuenta desde el primer día de una regla hasta el primer día de la siguiente. La media ronda los 28 días y son habituales los ciclos de entre 21 y 35. Tiene cuatro momentos: menstruación, fase folicular, ovulación y fase lútea. Cada persona lo vive de forma distinta y no hay una regla general sobre el ánimo. ${perfil.sigueCiclo ? 'En Descubrimientos, «Conoce el ciclo» lo explica fase a fase, con sus fuentes.' : 'Si lo veis necesario, se puede añadir en Ajustes; entonces Descubrimientos lo explica fase a fase, con sus fuentes.'} Es información general, no consejo médico.`);
  }

  // --- Ciclo: en qué día está ---
  if (hay(' regla', ' ciclo', ' fase', ' ovula', ' periodo', ' menstrua')) {
    if (!motor.sigueCiclo) return r('ciclo', 'El ciclo menstrual no está activado. Se puede añadir en Ajustes, si lo veis necesario; si no, me apaño con el resto de datos.');
    const d = motor.diaCiclo(hoy);
    const f = FASES.find((x) => x.id === motor.fase(hoy));
    const faltan = motor.duracion - d + 1;
    return r('ciclo', `Hoy es el día ${d} de un ciclo de ${motor.duracion}: ${f.titulo.toLowerCase()}. La próxima regla caería hacia el ${fechaCorta(aIso(aNum(hoy) + faltan))}, día arriba, día abajo. Es una estimación de calendario, no un diagnóstico.`);
  }

  // --- Acierto y fiabilidad ---
  if (hay(' aciert', ' fiab', ' precis', ' equivoc', ' fallas', ' fiar', ' te fio', ' seguro')) {
    const p = motor.precision();
    if (dias < 30 || !p) {
      return r('precision', `Aún no presumo de nada: con ${plural(dias, 'día', 'días')} mi fiabilidad para hoy es del ${fiab(motor.pronostico(hoy))}. Al llegar a 30 me examino contra tus propios partes y te enseño la nota.`);
    }
    return r('precision', `Me he examinado con tus ${p.dias} partes: clavo el tiempo exacto el ${Math.round(p.exacto * 100)} % de los días y acierto o rozo el ${Math.round(p.cercano * 100)} %. ${p.exacto >= 0.5 ? 'Mejor que el hombre del tiempo de la tele, dicho con modestia.' : 'Margen de mejora tengo: cada parte me afina.'}`);
  }

  // --- Niveles y progreso ---
  if (hay(' nivel', ' racha', ' cuanto falta', ' cuantos dias', ' progreso', ' desbloque', ' llevo')) {
    const n = nivelActual(dias);
    const s = nivelSiguiente(dias);
    const rch = ctx.racha ?? racha(Object.keys(entradas), hoy);
    return r('nivel', s
      ? `Eres «${n.titulo}» con ${plural(dias, 'día', 'días')}, una racha de ${rch}${ctx.rayos != null ? ` y ${ctx.rayos} rayos` : ''}. Te faltan ${s.dias - dias} para ser «${s.titulo}» y desbloquear: ${premioDe(s, perfil.sigueCiclo).toLowerCase()}.`
      : `Eres «${n.titulo}»: ${plural(dias, 'parte', 'partes')} y racha de ${rch}. Ya no quedan mundos por abrir, solo más puntería para mí.`);
  }

  // --- Por qué ---
  if (hay(' por que')) {
    const p = motor.pronostico(hoy, entradas[hoy] ? hoy : null);
    return r('motivos', p.motivos.length
      ? `Para hoy salía ${desc(p.tiempo)} por esto: ${p.motivos.join('; ').toLowerCase()}. Fiabilidad del ${fiab(p)}.`
      : `Para hoy salía ${desc(p.tiempo)} sin nada especial que lo explique: es, sencillamente, la media de la casa. Fiabilidad del ${fiab(p)}.`);
  }

  // --- Factores ---
  if (hay(' sueno', ' dorm', ' noche', ' estres', ' afecta', ' influye', ' factor', ' depende', ' le sienta', ' ambiente')) {
    if (dias < 14) return r('factores', `Para hablar de qué influye necesito 14 días y llevo ${dias}. Mientras tanto, marca la noche, el estrés y lo que pasa cada día al registrar: es mi materia prima.`);
    const firma = (f) => `${f.titulo.toLowerCase()} (${f.delta >= 0 ? '+' : '−'}${num(Math.abs(f.delta))})`;
    const fs = motor.factores().slice(0, 3);
    const auto = motor.automaticos().filter((f) => f.visible).slice(0, 2);
    // Los factores automáticos se comentan siempre, con la salvedad honesta cuando no se ve efecto.
    const cielo = auto.length
      ? `De lo que no hace falta apuntar: ${auto.map(firma).join(', ')}.`
      : 'También miro la luna, las horas de luz, la estación y el día de la semana: por ahora no veo que muevan vuestro clima.';
    if (!fs.length) return r('factores', `Me faltan datos extra. Apunta la noche, el estrés y lo que pasa cada día, y te diré qué mueve el clima de casa. ${cielo}`);
    return r('factores', `Lo que más coincide con los cambios: ${fs.map(firma).join(', ')}. ${cielo} Son niveles sobre 5 y son coincidencias, no sentencias: yo observo, no acuso.`);
  }

  // --- Patrón semanal ---
  const patron = () => {
    const con = motor.mediasPorDiaSemana().filter((x) => x.dias > 0);
    const mejor = con.reduce((a, b) => (b.media > a.media ? b : a));
    const peor = con.reduce((a, b) => (b.media < a.media ? b : a));
    return { mejor, peor };
  };
  if (hay(' mejor dia', ' peor dia', ' que dia de la semana', ' dias buenos', ' dias malos')) {
    if (dias < 7) return r('semana', `Dame una semana entera y te lo digo: llevo ${dias} de 7 días.`);
    const { mejor, peor } = patron();
    if (mejor.id === peor.id) return r('semana', 'De momento todos los días se parecen. O vivís en un anticiclón, o me faltan partes.');
    return r('semana', `Los ${SEMANA.plural[mejor.id]} suelen ser los más despejados (media ${num(mejor.media)}) y los ${SEMANA.plural[peor.id]} los más cubiertos (${num(peor.media)}). Planifica en consecuencia.`);
  }

  // --- Cuándo proponer algo ---
  if (hay(' plan', ' propon', ' propong', ' cena', ' vacaciones', ' pedir', ' suegr', ' padres', ' futbol', ' partido', ' amigos', ' le digo', ' se lo digo', ' buen momento', ' cuando ')) {
    if (visibles === 0) {
      if (dias >= 7) {
        const { mejor } = patron();
        return r('plan', `Todavía no pronostico días concretos (me faltan ${14 - dias} partes), pero el patrón dice que los ${SEMANA.plural[mejor.id]} suelen ser buen día. Yo apuntaría ahí.`);
      }
      return r('plan', `Con ${plural(dias, 'día', 'días')} sería tirar una moneda. Vuelve cuando lleve 7 y te doy el mejor día de la semana; con 14, día concreto.`);
    }
    const ps = motor.pronosticos(aIso(aNum(hoy) + 1), visibles);
    const mejor = ps.reduce((a, b) => (b.valor > a.valor ? b : a));
    const delicado = hay(' suegr', ' padres', ' futbol', ' partido', ' amigos');
    return r('plan', `${delicado ? 'Tema delicado, así que elige bien el cielo.' : 'Para proponer algo, busca cielo despejado.'} En los próximos ${visibles} días, el mejor es el ${fechaCorta(mejor.dia)}: ${desc(mejor.tiempo)}, fiabilidad ${fiab(mejor)}. ${mejor.tiempo <= 2 ? 'Tampoco es para tirar cohetes: ve con tacto.' : 'Lleva la propuesta pensada y la cena hecha.'}`);
  }

  // --- Detalles ---
  if (hay(' regalo', ' flores', ' chocolate', ' detalle', ' sorpresa')) {
    const p = motor.pronostico(hoy);
    const t = entradas[hoy]?.animo ?? p.tiempo;
    return r('detalle', t <= 2
      ? 'Con el cielo así, un detalle ayuda, pero no arregla el clima: primero escucha, después el chocolate.'
      : 'Los detalles funcionan mejor cuando no hacen falta. Hoy, por ejemplo: sin motivo y sin esperar aplausos.');
  }

  // --- Lo que no sabe ---
  if (hay(' que le pasa', ' enfadad', ' me quiere', ' me odia', ' que piensa', ' que he hecho', ' cabread', ' molest')) {
    return r('mente', elige([
      `Yo miro el cielo de casa, no dentro de la cabeza de nadie. Para eso hay un método que ningún modelo supera: hablarlo con ${quien} y escuchar.`,
      `Eso no sale en mis mapas. Mi consejo profesional: sentaos a hablar, ${quien} y tú, sin móvil en la mano.`,
    ]));
  }

  // --- Un día concreto ---
  const previsionDia = (salto, etiqueta) => {
    if (salto > visibles) {
      if (dias >= 7) {
        const iso = aIso(aNum(hoy) + salto);
        const ds = diaSemana(aNum(iso));
        const m = motor.mediasPorDiaSemana().find((x) => x.id === ds);
        if (m?.dias) return r('dia', `Para ${etiqueta} aún no pronostico (${dias < 14 ? `necesito 14 días y llevo ${dias}` : `a más de 3 días no me mojo hasta tener el mes completo; faltan ${30 - dias}`}). Te doy el patrón: los ${SEMANA.plural[ds]} suelen venir de ${desc(tiempoDe(m.media))}.`);
      }
      return r('dia', `Para ${etiqueta} todavía no tengo licencia: necesito ${dias < 14 ? 14 : 30} días de partes y llevamos ${dias}. Sigue apuntando y te lo canto.`);
    }
    const p = motor.pronostico(aIso(aNum(hoy) + salto));
    return r('dia', `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} pinta ${desc(p.tiempo)}, con una fiabilidad del ${fiab(p)}.${p.motivos.length ? ` ${p.motivos[0]}.` : ''} ${consejo(p.tiempo, p.dia)}`);
  };
  for (let ds = 0; ds < 7; ds++) {
    if (NOMBRES_DIA[ds].some((n) => q.includes(` ${n} `))) {
      const salto = ((ds - diaSemana(aNum(hoy)) + 7) % 7) || 7;
      return previsionDia(salto, `el ${SINGULAR[ds]}`);
    }
  }
  if (hay(' finde', ' fin de semana')) {
    const salto = ((6 - diaSemana(aNum(hoy)) + 7) % 7) || 7;
    return previsionDia(salto, 'el sábado');
  }
  if (hay(' pasado manana')) return previsionDia(2, 'pasado mañana');
  if (hay(' manana')) return previsionDia(1, 'mañana');

  if (hay(' semana', ' proximos dias', ' estos dias')) {
    if (visibles === 0) return r('semana', `La semana aún no la veo: necesito 14 días de partes y llevamos ${dias}.`);
    const ps = motor.pronosticos(aIso(aNum(hoy) + 1), visibles);
    return r('semana', `Próximos ${visibles} días: ${ps.map((p) => `${fechaCorta(p.dia)}, ${desc(p.tiempo)}`).join('; ')}. ${visibles < 7 ? 'Con el mes completo te doy la semana entera.' : 'Semana completa, como en la tele.'}`);
  }

  // --- Resumen del mes ---
  if (hay(' mes', ' resumen', ' como va', ' historial', ' balance')) {
    const delMes = Object.entries(entradas).filter(([d]) => d.slice(0, 7) === hoy.slice(0, 7)).map(([, e]) => e.animo);
    if (!delMes.length) return r('mes', 'Este mes está en blanco. Apunta el parte de hoy y empezamos a tener historia.');
    const media = delMes.reduce((a, b) => a + b, 0) / delMes.length;
    const soles = delMes.filter((a) => a >= 4).length;
    const tormentas = delMes.filter((a) => a <= 2).length;
    return r('mes', `Este mes llevas ${plural(delMes.length, 'parte', 'partes')}: clima medio de ${desc(tiempoDe(media))}, ${plural(soles, 'día bueno', 'días buenos')} y ${plural(tormentas, 'día revuelto', 'días revueltos')}. ${soles >= tormentas ? 'Balance favorable: algo estarás haciendo bien.' : 'Mes movido. Paciencia y buena letra.'}`);
  }

  // --- Consejo ---
  if (hay(' consejo', ' que hago', ' que puedo hacer', ' ayuda', ' recomiend', ' que me dices')) {
    const t = entradas[hoy]?.animo ?? motor.pronostico(hoy).tiempo;
    return r('consejo', consejo(t, hoy));
  }

  // --- Hoy ---
  if (hay(' hoy', ' ahora', ' que tal', ' como esta', ' que tiempo', ' como anda')) {
    const e = entradas[hoy];
    const p = motor.pronostico(hoy, e ? hoy : null);
    if (e) {
      const acierto = p.tiempo === e.animo ? 'Lo clavé.' : Math.abs(p.tiempo - e.animo) === 1 ? 'Yo preveía algo parecido: lo rocé.' : `Yo preveía ${desc(p.tiempo)}: hoy me ha pillado sin paraguas.`;
      return r('hoy', `Hoy has apuntado ${desc(e.animo)}. ${acierto} ${consejo(e.animo, hoy)}`);
    }
    return r('hoy', `Para hoy en casa preveo ${desc(p.tiempo)}, con una fiabilidad del ${fiab(p)}${dias < 7 ? ' (es poco: aún estoy conociendo el clima de la casa)' : ''}. ${consejo(p.tiempo, hoy)} Y no te olvides de registrar el parte.`);
  }

  // --- Cortesía ---
  if (hay(' gracias')) return r('gracias', elige(['A mandar. Yo sigo aquí, mirando al cielo.', 'Para eso estamos. Abrígate si refresca.']));
  if (hay(' adios', ' hasta luego', ' chao', ' nos vemos')) return r('adios', 'Buen tiempo y buena suerte. Vuelve mañana con tu parte.');
  if (hay(' hola', ' buenas', ' hey', ' ey ', ' buenos dias')) {
    return r('saludo', `¡Buenas! Aquí Stormy, predictor de tormentas. Pregúntame por hoy, por mañana o por cuándo proponer ese plan.`);
  }

  // --- No lo ha entendido: respuesta creativa según el tema ---
  return libre(temaPrevio);
}

/**
 * Personalidades de la tienda: solo cambian el estilo del saludo y de la reacción al registrar.
 * El contenido (datos, honestidad, lo que no sabe) es el mismo.
 */
export const PERSONALIDADES = {
  telediario: { nombre: 'Telediario', descripcion: 'Serio y con corbata, como en la tele', entrada: 'Buenas noches y bienvenidos al parte de casa.', cierre: 'Les seguiremos informando.', corto: 'Les seguiremos informando.' },
  abuela: { nombre: 'Abuela', descripcion: 'Cariñoso y preocupado por si has comido', entrada: 'Ay, cariño, qué alegría verte.', cierre: '¿Has comido bien? Abrígate, que refresca.', corto: 'Abrígate, cariño.' },
  poeta: { nombre: 'Poeta', descripcion: 'Todo en verso, o casi', entrada: 'Bajo el cielo de esta casa, ni una nube pasa sin que la escriba en verso.', cierre: 'Y así, entre nubes y claros, sigue el poema del hogar.', corto: 'Y así sigue el poema del hogar.' },
};
export const MODO_NORMAL = { nombre: 'Normal', descripcion: 'El Stormy de siempre', entrada: '¡Buenas!' };

/** Respuestas del chat con el modo elegido: solo una coletilla al final; lo que dice no cambia. */
export const conEstilo = (texto, modo) => (PERSONALIDADES[modo] ? `${texto} ${PERSONALIDADES[modo].corto}` : texto);

/** Viste un texto con la personalidad elegida. Sin personalidad (o una desconocida), lo deja igual. */
export function conPersonalidad(texto, modo) {
  const p = PERSONALIDADES[modo];
  return p ? `${p.entrada} ${texto} ${p.cierre}` : texto;
}

/** Saludo inicial, según lo que ya sabe y cómo llaman a quien pregunta. */
export function saludo(ctx) {
  const dias = ctx.motor.dias;
  const yo = ctx.perfil.miApodo?.trim();
  const hola = yo ? `¡Buenas, ${yo}!` : '¡Buenas!';
  if (dias === 0) return `${hola} Soy Stormy, el predictor de tormentas de la casa. Aún no tengo ni un parte, así que hoy hablo de oídas. Apunta el primero y empiezo a trabajar.`;
  if (dias < 7) return `${hola} Soy Stormy. Llevo ${plural(dias, 'día', 'días')} observando el clima de la casa: todavía hablo con prudencia, pero pregunta lo que quieras.`;
  if (dias < 30) return `${hola} Aquí Stormy, con ${dias} días de partes de la casa. Ya voy viendo patrones. ¿Qué quieres saber?`;
  return `${hola} Aquí Stormy, con el mes completo estudiado. Pregunta sin miedo: hoy, mañana, la semana o cuándo proponer ese plan.`;
}
