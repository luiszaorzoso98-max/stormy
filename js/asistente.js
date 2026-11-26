// Nimbo, el meteorólogo de guardia. Responde preguntas a partir de los datos del dispositivo.
// No usa ningún servicio externo: reconoce la intención de la pregunta y redacta la respuesta con el modelo local.
// Personalidad: hombre del tiempo de la tele, guasón, siempre de parte de la pareja y honesto con lo que no sabe.
import { FASES, SEMANA, aIso, aNum, diaSemana, diasDePronostico, nivelActual, nivelSiguiente, racha, tiempoDe } from './motor.js';
import { TIEMPOS, consejoDe, fraseHoroscopo, signo } from './contenido.js';

export const NIMBO = {
  nombre: 'Stormy',
  cargo: 'Predictor de tormentas',
  sugerencias: ['¿Qué tal hoy?', '¿Y mañana?', '¿Cuándo propongo un plan?', '¿Qué le afecta?', '¿Aciertas mucho?', '¿Cómo va el mes?'],
};

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
  const ella = perfil.nombre?.trim() || 'tu pareja';
  const dias = motor.dias;
  const elige = (xs) => xs[giro % xs.length];
  const hay = (...claves) => claves.some((c) => q.includes(c));
  const desc = (t) => TIEMPOS[t].titulo.toLowerCase();
  const fiab = (p) => `${Math.round(p.fiabilidad * 100)} %`;
  const r = (tema, texto) => ({ tema, texto });
  const visibles = diasDePronostico(dias);

  if (!q.trim()) return r('vacio', 'Te escucho. Pregúntame por hoy, por mañana o por cuándo proponer un plan.');

  // --- Quién es y qué hace con los datos ---
  if (hay(' quien eres', ' como te llamas', ' que eres', ' presentate', ' tu nombre')) {
    return r('identidad', `Soy Stormy. Nací en mitad de una discusión por el mando de la tele y desde entonces vigilo el cielo de vuestra casa. No leo mentes ni tomo partido: aviso de cuándo puede tronar. Ahora mismo tengo ${plural(dias, 'día', 'días')} de datos.`);
  }
  if (hay(' privacidad', ' mis datos', ' los datos', ' espia', ' guardas', ' servidor')) {
    return r('privacidad', 'Todo lo que sé vive en este dispositivo. No tengo servidor, ni cuenta, ni a quién contárselo. Y si me borras, me llevo el secreto a la tumba.');
  }
  if (hay(' horoscopo', ' signo', ' astros', ' zodiaco')) {
    if (!perfil.nacimiento) return r('horoscopo', 'No tengo su fecha de nacimiento, así que hoy los astros descansan. Puedes añadirla en Ajustes, aunque te aviso: es puro teatro.');
    const s = signo(perfil.nacimiento);
    return r('horoscopo', `${s.emoji} ${s.nombre}. ${fraseHoroscopo(hoy)} Esto es broma, claro: los astros no entran en mis cálculos.`);
  }

  // --- Ciclo ---
  if (hay(' regla', ' ciclo', ' fase', ' ovula', ' periodo')) {
    if (!motor.sigueCiclo) return r('ciclo', 'El ciclo no está activado. Si ella quiere compartirlo, se enciende en Ajustes; si no, me apaño con el resto de datos.');
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
    const rch = racha(Object.keys(entradas), hoy);
    return r('nivel', s
      ? `Eres «${n.titulo}» con ${plural(dias, 'día', 'días')} y una racha de ${rch}. Te faltan ${s.dias - dias} para ser «${s.titulo}» y desbloquear ${s.premio.toLowerCase()}.`
      : `Eres «${n.titulo}»: mes completo, ${plural(dias, 'parte', 'partes')} y racha de ${rch}. Ya no te quedan niveles, solo más puntería para mí.`);
  }

  // --- Por qué ---
  if (hay(' por que')) {
    const p = motor.pronostico(hoy, entradas[hoy] ? hoy : null);
    return r('motivos', p.motivos.length
      ? `Para hoy salía ${desc(p.tiempo)} por esto: ${p.motivos.join('; ').toLowerCase()}. Fiabilidad del ${fiab(p)}.`
      : `Para hoy salía ${desc(p.tiempo)} sin nada especial que lo explique: es, sencillamente, su media. Fiabilidad del ${fiab(p)}.`);
  }

  // --- Factores ---
  if (hay(' sueno', ' dorm', ' estres', ' afecta', ' influye', ' factor', ' depende', ' le sienta')) {
    if (dias < 14) return r('factores', `Para hablar de causas necesito 14 días y llevo ${dias}. Mientras tanto, marca sueño, estrés y etiquetas al registrar: es mi materia prima.`);
    const fs = motor.factores().slice(0, 3);
    if (!fs.length) return r('factores', 'Me faltan datos extra. Apunta sueño, estrés y lo que pasa cada día, y te diré qué mueve el clima de casa.');
    const frase = fs.map((f) => `${f.titulo.toLowerCase()} (${f.delta >= 0 ? '+' : '−'}${num(Math.abs(f.delta))})`).join(', ');
    return r('factores', `Lo que más coincide con los cambios: ${frase}. Son niveles sobre 5 y son coincidencias, no sentencias: yo observo, no acuso.`);
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
      `Yo miro el cielo, no dentro de la cabeza de ${ella}. Para eso hay un método infalible que ningún modelo supera: preguntárselo y escuchar.`,
      `Eso no sale en mis mapas. Mi consejo profesional: pregúntale a ${ella} qué tal está, sin móvil en la mano.`,
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
    return r('dia', `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} pinta ${desc(p.tiempo)}, con una fiabilidad del ${fiab(p)}.${p.motivos.length ? ` ${p.motivos[0]}.` : ''} ${consejoDe(p.tiempo, p.dia)}`);
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
    return r('consejo', consejoDe(t, hoy));
  }

  // --- Hoy ---
  if (hay(' hoy', ' ahora', ' que tal', ' como esta', ' que tiempo', ' como anda')) {
    const e = entradas[hoy];
    const p = motor.pronostico(hoy, e ? hoy : null);
    if (e) {
      const acierto = p.tiempo === e.animo ? 'Lo clavé.' : Math.abs(p.tiempo - e.animo) === 1 ? 'Yo preveía algo parecido: lo rocé.' : `Yo preveía ${desc(p.tiempo)}: hoy me ha pillado sin paraguas.`;
      return r('hoy', `Hoy has apuntado ${desc(e.animo)}. ${acierto} ${consejoDe(e.animo, hoy)}`);
    }
    return r('hoy', `Para hoy con ${ella} preveo ${desc(p.tiempo)}, con una fiabilidad del ${fiab(p)}${dias < 7 ? ' (es poco: aún estoy conociendo el clima de la casa)' : ''}. ${consejoDe(p.tiempo, hoy)} Y no te olvides de registrar el parte.`);
  }

  // --- Cortesía ---
  if (hay(' gracias')) return r('gracias', elige(['A mandar. Yo sigo aquí, mirando al cielo.', 'Para eso estamos. Abrígate si refresca.']));
  if (hay(' adios', ' hasta luego', ' chao', ' nos vemos')) return r('adios', 'Buen tiempo y buena suerte. Vuelve mañana con tu parte.');
  if (hay(' hola', ' buenas', ' hey', ' ey ', ' buenos dias')) {
    return r('saludo', `¡Buenas! Aquí Stormy, predictor de tormentas. Pregúntame por hoy, por mañana o por cuándo proponer ese plan.`);
  }

  // --- No lo ha entendido ---
  return r('desconocido', elige([
    'Esa nube no la tengo catalogada. Prueba con: «¿qué tal hoy?», «¿y mañana?», «¿cuándo propongo un plan?» o «¿qué le afecta?».',
    'Ahí me pillas fuera de cobertura. Yo entiendo de hoy, mañana, la semana, el ciclo, los niveles y de si acierto o no.',
  ]));
}

/** Saludo inicial, según lo que ya sabe. */
export function saludo(ctx) {
  const dias = ctx.motor.dias;
  const ella = ctx.perfil.nombre?.trim() || 'tu pareja';
  if (dias === 0) return `¡Buenas! Soy Stormy, vuestro predictor de tormentas. Aún no tengo ni un parte de ${ella}, así que hoy hablo de oídas. Apunta el primero y empiezo a trabajar.`;
  if (dias < 7) return `¡Buenas! Soy Stormy. Llevo ${plural(dias, 'día', 'días')} observando el clima de la casa: todavía hablo con prudencia, pero pregunta lo que quieras.`;
  if (dias < 30) return `¡Buenas! Aquí Stormy, con ${dias} días de partes de ${ella}. Ya voy viendo patrones. ¿Qué quieres saber?`;
  return `¡Buenas! Aquí Stormy, con el mes completo estudiado. Pregunta sin miedo: hoy, mañana, la semana o cuándo proponer ese plan.`;
}
