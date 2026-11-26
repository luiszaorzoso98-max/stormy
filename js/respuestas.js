// Respuestas de Stormy cuando la pregunta no es de lo suyo. Stormy no es un asistente para todo: es el
// experto en el tiempo de vuestra casa. Cada respuesta reconduce con humor y acaba sugiriendo una pregunta.
// Sin burlas a nadie, sin chistes de género, sin consejos médicos ni legales.

/** Temas serios: aquí no hay bromas. Se comprueban antes que cualquier otra cosa. */
const SERIO = [
  ' me pega', ' me pegan', ' me ha pegado', ' pegarme', ' maltrat', ' violencia', ' me amenaza', ' me amenazan', ' tengo miedo de',
  ' miedo en casa', ' no me siento segur', ' no estoy segur', ' me hace dano', ' me hacen dano', ' agresion', ' me agrede',
  ' suicid', ' quitarme la vida', ' no quiero vivir', ' quiero morir', ' me quiero morir', ' hacerme dano', ' autolesion', ' acabar con todo',
];
export const AYUDA =
  'Esto es importante y aquí no hay bromas: yo solo soy un juego y no puedo ayudarte como mereces. Si estás en peligro, llama al 112. ' +
  'Si se trata de violencia de género, el 016 es gratuito, atiende a cualquier hora y no deja rastro en la factura. ' +
  'Si estás pensando en hacerte daño, llama al 024 (línea de atención a la conducta suicida), también gratuita y a cualquier hora. ' +
  'Hablar con alguien de confianza también ayuda. No estás sola ni solo.';
export const esSerio = (q) => SERIO.some((c) => q.includes(c));

/** Palabras que delatan cada tema (sobre el texto ya limpio: minúsculas, sin tildes, con espacios alrededor). */
const TEMAS = [
  ['ia', [' eres una ia', ' eres un robot', ' eres una maquina', ' inteligencia artificial', ' quien te ha creado', ' quien te creo', ' quien te hizo', ' eres real', ' eres humano', ' estas vivo', ' sentido de la vida', ' existes']],
  ['chiste', [' chiste', ' hazme reir', ' algo gracioso']],
  ['insulto', [' tonto', ' idiota', ' inutil', ' estupido', ' callate', ' no sirves', ' pesado', ' eres malo', ' te odio', ' mierda', ' imbecil']],
  ['comida', [' comer ', ' comida', ' cenar', ' receta', ' cocino', ' cocinar', ' hambre', ' desayun', ' pizza', ' tortilla', ' paella']],
  ['deporte', [' futbol', ' liga', ' baloncesto', ' tenis', ' gimnasio', ' correr', ' deporte', ' madrid ', ' barca', ' gol ']],
  ['fuera', [' llover', ' lluvia fuera', ' en la calle', ' temperatura', ' grados', ' paraguas fuera', ' nieva', ' nevar', ' calor fuera', ' frio fuera', ' tiempo fuera', ' tiempo en ']],
  ['amor', [' ligar', ' ligo', ' ligue', ' enamorad', ' amor ', ' novio', ' novia', ' cita ', ' crush', ' me gusta alguien', ' declararme', ' san valentin']],
  ['trabajo', [' trabajo', ' jefe', ' jefa', ' oficina', ' reunion', ' curro', ' sueldo', ' teletrabajo', ' compañeros de trabajo', ' companeros de trabajo']],
  ['dinero', [' dinero', ' ahorrar', ' hipoteca', ' invertir', ' bolsa ', ' loteria', ' euros', ' factura', ' gastos']],
];

export function temaLibre(q) {
  if (esSerio(q)) return 'serio';
  for (const [tema, claves] of TEMAS) if (claves.some((c) => q.includes(c))) return tema;
  return 'general';
}

export const RESPUESTAS_LIBRES = {
  general: [
    'Esa nube no la tengo catalogada. Yo no soy un sabelotodo: soy el hombre del tiempo de vuestra casa. Prueba con «¿Qué tal hoy?».',
    'Ahí me pillas fuera de cobertura. Lo mío es el clima de casa, no la enciclopedia. ¿Por qué no me preguntas «¿Y mañana?»?',
    'Mi radar no llega tan lejos. Solo leo vuestros partes, y de eso sé bastante. Pregúntame «¿Cómo viene la semana?».',
    'Uy, esa pregunta viene con niebla espesa. Yo solo veo claro dentro de casa. Prueba: «¿Cuándo propongo un plan?».',
    'No soy un oráculo de todo: soy un barómetro con cara. Lo que sí te sé decir es «¿Qué influye en el ambiente de casa?».',
    'Me has dejado más cubierto que un día de noviembre. Pregúntame algo de mi zona: «¿Aciertas mucho?».',
    'Eso cae fuera de mi mapa. Yo trabajo con lo que apuntáis cada día, nada más. ¿Probamos con «¿Qué dice el horóscopo de hoy?»?',
    'Esa no me la sé, y prefiero decirlo a inventármela. Lo mío es otra cosa: «¿Qué tal hoy?», por ejemplo.',
    'Interesante, pero mi especialidad es más modesta: el tiempo de una sola casa, la vuestra. Pregunta «¿Y mañana?».',
    'Ni nubes ni claros: esa pregunta no aparece en mis mapas. Si quieres algo útil, prueba «¿Cuándo propongo un plan?».',
    'Soy pequeño y de pueblo: no sé de todo, sé de vuestra casa. Y de eso, bastante. Prueba con «¿Cómo viene la semana?».',
    'Si me preguntas eso, me nublo. Pregúntame por lo que mido y te contesto con datos: «¿Qué influye en el ambiente de casa?».',
    'Ese frente no viene en mi parte. Mi trabajo es mirar el cielo de casa, no el de todo el mundo. ¿«¿Aciertas mucho?»?',
    'Me encantaría ayudarte con eso, pero solo soy un hombre del tiempo de bolsillo. Lo que sí tengo: «¿Qué hay en la tienda?».',
    'Ahí no llego: no tengo internet ni bola de cristal, solo vuestros partes. Prueba «¿Cuántos rayos tengo?».',
    'Esa pregunta es de otra emisora. En esta damos el tiempo de casa. Sintoniza con «¿Qué tal hoy?».',
    'Lo apunto en la libreta de cosas que no sé, que es larga. Mejor algo de mi terreno: «¿Y mañana?».',
    'Ni idea, y no te voy a vender humo, que bastante tengo con las nubes. Pregunta «¿Cuándo propongo un plan?».',
    'Mi cobertura acaba en la puerta de casa. Dentro, pregunta lo que quieras: «¿Cómo viene la semana?».',
    'Eso no sale en mi termómetro. Lo que sí sale: «¿Qué influye en el ambiente de casa?».',
    'Soy un experto muy concreto, como el que solo arregla persianas. Lo mío es el clima de casa: «¿Cómo funciona el ciclo menstrual?», por ejemplo.',
  ],
  insulto: [
    'Recibido, aunque viene con algo de granizo. Yo sigo de buen humor, que es lo mío. ¿Te digo «¿Qué tal hoy?»?',
    'Tomo nota del frente frío. No me lo tomo a mal: los hombres del tiempo estamos acostumbrados a que nos culpen de todo. Pregunta «¿Y mañana?».',
    'Tormenta pasajera, seguro. Yo aquí sigo, sin rencor y con paraguas. ¿Probamos con «¿Cuándo propongo un plan?»?',
    'Vale, hoy toca borrasca conmigo. Me la apunto como dato extra. Mientras escampa: «¿Qué influye en el ambiente de casa?».',
    'Con ese viento no me vuelo, tranquilo. Si te apetece, pregúntame algo y te demuestro que sirvo: «¿Aciertas mucho?».',
  ],
  comida: [
    'De cocina no sé, pero de climas sí: con buen tiempo en casa, hasta las lentejas saben mejor. Pregunta «¿Qué tal hoy?».',
    'No tengo recetas, solo previsiones. Eso sí: si sale tormenta, una cena calentita nunca falla. ¿«¿Y mañana?»?',
    'Mi nevera está vacía: solo guardo partes. Para saber si es buen día para cenar juntos, prueba «¿Cuándo propongo un plan?».',
    'La paella no es lo mío, pero el ambiente para comerla sí. Pregunta «¿Cómo viene la semana?» y elegís el día.',
    'Lo único que cocino son pronósticos, y a fuego lento. ¿Te sirvo uno? «¿Qué tal hoy?».',
  ],
  deporte: [
    'De fútbol solo sé que un derbi puede traer chubascos en casa. Para el resto, prueba «¿Qué influye en el ambiente de casa?».',
    'No sigo la liga; sigo vuestra racha. Pregúntame «¿Qué nivel tengo?» y te cuento.',
    'El único marcador que llevo es el de vuestros partes. Si hay partido, mira antes «¿Cuándo propongo un plan?».',
    'De deportes no entiendo, pero de calentamientos de ambiente, un poco. Prueba con «¿Y mañana?».',
    'Yo no corro, solo miro el cielo. Eso sí: «¿Cómo viene la semana?» te lo digo sin sudar.',
  ],
  fuera: [
    'El tiempo de la calle es para los de la tele; yo solo miro el de dentro de casa. Pregunta «¿Qué tal hoy?» en casa.',
    'Si fuera llueve, no lo sé: no tengo ventana a la calle, solo vuestros partes. Para casa, «¿Y mañana?».',
    'Para la temperatura de fuera, mira el móvil o asómate. Yo mido otro clima: «¿Cómo viene la semana?».',
    'Mi barómetro apunta hacia dentro. Lo de fuera, otro día. ¿Te digo «¿Qué tal hoy?» en casa?',
    'Paraguas para la calle no te sé decir; para casa, sí. Prueba «¿Cuándo propongo un plan?».',
  ],
  amor: [
    'De ligar no doy consejos, que soy una nube y me disuelvo. Lo mío es el ambiente de la casa que compartís: «¿Qué influye en el ambiente de casa?».',
    'El amor no sale en mis mapas, pero el buen tiempo en casa ayuda a todo. Pregunta «¿Cuándo propongo un plan?».',
    'Yo no hago de celestino: solo doy el parte. Y el de hoy está en «¿Qué tal hoy?».',
    'Eso es cosa de personas, no de barómetros. Yo lo dejo en vuestras manos y miro el cielo: «¿Y mañana?».',
    'Para el corazón no tengo previsión fiable; para la semana en casa, sí: «¿Cómo viene la semana?».',
  ],
  trabajo: [
    'Del trabajo no sé, pero los días de mucho curro suelen nublar la casa. Lo compruebo en «¿Qué influye en el ambiente de casa?».',
    'No conozco a tu jefe, por suerte para los dos. Lo que sí: «¿Y mañana?» en casa.',
    'Mi oficina es el cielo de vuestro salón. Si hoy viene cargado, apunta «Trabajo intenso» al registrar y pregúntame «¿Qué influye en el ambiente de casa?».',
    'Reuniones no, previsiones sí. Para desconectar al llegar a casa: «¿Qué tal hoy?».',
    'Del sueldo no sé nada; de rayos, bastante. Pregunta «¿Cuántos rayos tengo?».',
  ],
  chiste: [
    '¿Qué le dice una nube a otra? «Nos vemos en el chubasco». Perdón. ¿Te digo «¿Qué tal hoy?» para compensar?',
    '¿Por qué el hombre del tiempo nunca discute? Porque siempre lo ve venir. Y ahora en serio: «¿Y mañana?».',
    'Un rayo entra en un bar y dice: «Vengo de visita relámpago». Me lo apunto como día nublado. Pregunta «¿Cómo viene la semana?».',
    '¿Cuál es el colmo de un barómetro? Estar bajo de presión. Si lo estás tú, mira «¿Qué influye en el ambiente de casa?».',
    'Iba a contarte un chiste de niebla, pero no se ve venir. ¿Probamos «¿Cuándo propongo un plan?»?',
    '¿Qué hace una nube con picor? Llover sobre mojado. Ya está, ya me callo. «¿Aciertas mucho?», si quieres.',
  ],
  dinero: [
    'De dinero no doy consejos: no soy asesor, soy una nube. Lo que sí sé contar son rayos: «¿Cuántos rayos tengo?».',
    'Invertir, ni idea. Gastar rayos, en cambio, te lo explico encantado: «¿Qué hay en la tienda?».',
    'Las facturas no salen en mis mapas, aunque a veces traen tormenta. Mira «¿Qué influye en el ambiente de casa?».',
    'Mi única economía son los rayos, y ni siquiera se compran con dinero. Pregunta «¿Cómo gano rayos?».',
  ],
  ia: [
    'Soy un programa sencillo hecho para esta app. No estoy conectado a internet: respondo a partir de vuestros partes y de unas cuantas frases mías. Prueba «¿Qué tal hoy?».',
    'Nada de cerebro gigante: soy un pequeño programa que vive en este móvil y calcula con lo que apuntáis. Por eso sé de vuestra casa y de poco más. Pregunta «¿Aciertas mucho?».',
    'Me hicieron para esta app y no tengo más mundo que vuestros partes. Ni internet, ni secretos. ¿Te digo «¿Y mañana?»?',
    'Real, real, no soy: soy un programa sencillo hecho para esta app, una nube con cálculos. Los cálculos sí son de verdad, y salen de vuestros partes. Prueba «¿Cómo viene la semana?».',
    'Me creó quien hizo esta app, para una sola cosa: mirar el tiempo de vuestra casa sin conexión a internet. Del sentido de la vida no sé; del viento en casa, un poco. Pregunta «¿Qué influye en el ambiente de casa?».',
  ],
};

/**
 * Elige una respuesta de un tema sin repetir hasta agotar el montón. `memoria` guarda las usadas por tema
 * durante la sesión; `azar` es inyectable para las pruebas.
 */
export function eligeLibre(tema, memoria = {}, azar = Math.random) {
  const lista = RESPUESTAS_LIBRES[tema] ?? RESPUESTAS_LIBRES.general;
  const usadas = memoria[tema] ?? (memoria[tema] = []);
  if (usadas.length >= lista.length) usadas.length = 0;
  const libres = lista.map((_, i) => i).filter((i) => !usadas.includes(i));
  const i = libres[Math.min(libres.length - 1, Math.floor(azar() * libres.length))];
  usadas.push(i);
  return lista[i];
}
