// Textos, estados del tiempo, fichas informativas e iconos. El nombre de la app se cambia aquí y en index.html / manifest.
export const APP = {
  nombre: 'Stormy',
  version: '2.0',
  lema: 'Que no te pille la tormenta sin paraguas.',
  presentacion: 'En casa dicen que soy muy predecible. Así que he creado Stormy, para comprobar si el clima de casa también lo es.',
  queHace: 'Stormy aprende cómo suele estar el ánimo en casa y te avisa de los días buenos y de los días de tormenta.',
  explicacion: 'Cada día apuntas qué tiempo ha hecho en casa. En unas semanas, Stormy te avisa de cuándo viene tormenta y de cuándo sale el sol.',
};

/** Los cinco estados del tiempo en casa. 1 = tormenta, 5 = soleado. */
export const TIEMPOS = {
  5: {
    id: 5, titulo: 'Soleado', desc: 'Día estupendo', emoji: '☀️', tinte: '#FFB627', sobre: '#1E2749',
    cielo: ['#FFC94D', '#FFDB80', '#FFEFC2'],
    cieloOscuro: ['#5C3F0C', '#46300E', '#2B1F10'],
    consejos: [
      'Cielo despejado. Hoy hasta tus chistes malos tienen público.',
      'Día perfecto para proponer ese plan que llevas semanas aplazando.',
      'Buen momento para sacar el tema de las vacaciones.',
    ],
  },
  4: {
    id: 4, titulo: 'Sol y nubes', desc: 'Buen día', emoji: '⛅️', tinte: '#3CC9A3', sobre: '#1E2749',
    cielo: ['#8EE0C8', '#B4ECD9', '#DDF7EC'],
    cieloOscuro: ['#0F4D44', '#0C3B35', '#0A2926'],
    consejos: [
      'Buen tiempo con alguna nube. Un café a tiempo mantiene el anticiclón.',
      'Todo en orden. No lo estropees dejando la toalla mojada sobre la cama.',
      'Día agradable: propón un paseo antes de que alguien encienda la tele.',
    ],
  },
  3: {
    id: 3, titulo: 'Nublado', desc: 'Día normal', emoji: '☁️', tinte: '#A99BE0', sobre: '#1E2749',
    cielo: ['#C9BFF0', '#DAD3F5', '#EEEAFB'],
    cieloOscuro: ['#3B3070', '#2E275A', '#211C42'],
    consejos: [
      'Cielo cubierto. Pregunta qué tal el día y, esta vez, escucha la respuesta.',
      'Ni frío ni calor. Haz esa tarea de casa sin que nadie te la pida.',
      'Tiempo variable: un detalle pequeño puede abrir claros.',
    ],
  },
  2: {
    id: 2, titulo: 'Lluvia', desc: 'Día bajo', emoji: '🌧️', tinte: '#6C8AEA', sobre: '#1E2749',
    cielo: ['#8FA8F0', '#B1C3F6', '#DCE5FC'],
    cieloOscuro: ['#1F3673', '#192B5C', '#121E40'],
    consejos: [
      'Posibles chubascos. Menos consejos y más escuchar.',
      'Lleva paraguas emocional y ten chocolate en la despensa.',
      'Día gris: cena hecha y móvil en el bolsillo.',
    ],
  },
  1: {
    id: 1, titulo: 'Tormenta', desc: 'Día muy difícil', emoji: '⛈️', tinte: '#4A3AA0', sobre: '#FFFFFF',
    cielo: ['#2E2466', '#47388F', '#6A5BB5'],
    cieloOscuro: ['#2E2466', '#251D52', '#18133A'],
    consejos: [
      'Aviso naranja. No es el día para debatir quién friega más.',
      'Tormenta a la vista: recoge la cocina y ofrece un abrazo.',
      'Hoy toca refugio: manta, serie favorita y cero opiniones no pedidas.',
    ],
  },
};
export const ORDEN_TIEMPOS = [5, 4, 3, 2, 1];

/**
 * Textos del recordatorio. En la web el aviso se toca y se elige (dos toques: las opciones dentro del aviso
 * no aparecen al mantenerlo pulsado). Solo la app nativa del iPhone responde con una pulsación larga.
 */
export const TEXTOS_AVISO = {
  web: {
    paso: 'Dos toques: toca el aviso y elige.',
    ajustes: 'Toca el aviso y elige: son dos toques. La alarma es un evento diario de tu calendario con un enlace al registro; para quitarla, bórrala desde el calendario.',
    confirmacion: (hora) => `El recordatorio va por tu calendario, con una alarma a las ${hora}. Toca el aviso y elige.`,
  },
  nativo: {
    paso: 'Mantén pulsado el aviso y elige: no hace falta abrir la app.',
    ajustes: (hora) => `Te avisaremos cada día a las ${hora}. Mantén pulsado el aviso y elige.`,
    confirmacion: (hora) => `Te avisaremos cada día a las ${hora}. Mantén pulsado el aviso y elige.`,
  },
};

const diaDelAno = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(a, 0, 0)) / 864e5);
};
// Consejos de convivencia para familia y amigos: los de TIEMPOS tienen guiños de pareja.
const CONSEJOS_CONVIVENCIA = {
  5: [
    'Cielo despejado en casa. Buen día para proponer ese plan común que nunca cuadra.',
    'Día redondo: aprovecha para repartir tareas sin que nadie proteste.',
    'Hoy hasta el turno del lavavajillas se negocia con una sonrisa.',
  ],
  4: [
    'Buen tiempo con alguna nube. Un café compartido mantiene el anticiclón.',
    'Todo en orden. No lo estropees dejando los platos «en remojo».',
    'Día agradable: propón comer juntos antes de que cada cual se vaya a su cuarto.',
  ],
  3: [
    'Cielo cubierto. Pregunta qué tal el día y, esta vez, escucha la respuesta.',
    'Ni frío ni calor. Haz esa tarea de casa sin que nadie te la pida.',
    'Tiempo variable: un detalle pequeño puede abrir claros.',
  ],
  2: [
    'Posibles chubascos. Menos consejos y más escuchar.',
    'Día gris: baja el volumen y deja la cocina recogida.',
    'Lleva paraguas: los comentarios sobre el orden, mejor mañana.',
  ],
  1: [
    'Aviso naranja. No es el día para debatir a quién le toca la basura.',
    'Tormenta a la vista: deja espacio y recoge lo tuyo.',
    'Hoy toca refugio: poco ruido y cero opiniones no pedidas.',
  ],
};
export const consejoDe = (tiempo, iso, relacion = 'pareja') => {
  const lista = relacion === 'pareja' ? TIEMPOS[tiempo].consejos : CONSEJOS_CONVIVENCIA[tiempo];
  return lista[diaDelAno(iso) % lista.length];
};

export const ETIQUETAS = [
  'Trabajo intenso', 'Plan juntos', 'Visita familiar', 'Deporte', 'Discusión',
  'Día de descanso', 'Tareas de casa', 'Detalle bonito', 'Malestar físico', 'Plan con amigos',
];

export const INSIGNIAS = [[10, 'Curioso'], [25, 'Detallista'], [50, 'Notario del hogar']];

// ---------- Horóscopo: un juego con un dato real (la luna de hoy). No interviene en el pronóstico. ----------

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaSigno = (c) => `${c % 100} ${MESES_CORTOS[Math.floor(c / 100) - 1]}`;
const SIGNOS = [
  [321, 419, 'Aries', '♈️', 'fuego'], [420, 520, 'Tauro', '♉️', 'tierra'], [521, 620, 'Géminis', '♊️', 'aire'],
  [621, 722, 'Cáncer', '♋️', 'agua'], [723, 822, 'Leo', '♌️', 'fuego'], [823, 922, 'Virgo', '♍️', 'tierra'],
  [923, 1022, 'Libra', '♎️', 'aire'], [1023, 1121, 'Escorpio', '♏️', 'agua'], [1122, 1221, 'Sagitario', '♐️', 'fuego'],
  [1222, 119, 'Capricornio', '♑️', 'tierra'], [120, 218, 'Acuario', '♒️', 'aire'], [219, 320, 'Piscis', '♓️', 'agua'],
];

/** Signo del zodiaco de una fecha, con su símbolo, elemento y fechas («22 dic – 19 ene»). */
export function signo(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const c = m * 100 + d;
  const s = SIGNOS.find(([a, b]) => (a <= b ? c >= a && c <= b : c >= a || c <= b));
  return { nombre: s[2], emoji: s[3], elemento: s[4], fechas: `${fechaSigno(s[0])} – ${fechaSigno(s[1])}` };
}

// Frases propias de Stormy: grupo de fase lunar × elemento del signo, con dos variantes que alternan cada día.
const TOCA = {
  nueva: {
    fuego: ['empezar algo pequeño; por ejemplo, la lavadora', 'estrenar plan sin pedir permiso al sofá'],
    tierra: ['hacer la lista de la compra con calma', 'ordenar ese cajón que todo el mundo evita'],
    aire: ['proponer una idea nueva para la cena', 'abrir las ventanas y cambiar de tema'],
    agua: ['irse pronto a la cama sin dar explicaciones', 'preparar algo caliente y poco más'],
  },
  creciente: {
    fuego: ['acabar lo que se empezó el lunes', 'animar la casa, que hoy hay cuerda'],
    tierra: ['sumar un detalle pequeño al día', 'regar las plantas y, ya puestos, la convivencia'],
    aire: ['hacer la pregunta que lleva días rondando', 'poner música mientras se recoge'],
    agua: ['escuchar un rato largo sin mirar el móvil', 'cocinar para dos aunque sobre'],
  },
  llena: {
    fuego: ['bajar un punto el volumen', 'salir a mirar la luna en vez de discutir por el mando'],
    tierra: ['no reorganizar la casa a las once de la noche', 'dejar las cuentas para mañana'],
    aire: ['hablar menos y pasear más', 'no abrir tres debates a la vez'],
    agua: ['no tomarse nada a la tremenda', 'dormir con la persiana bajada'],
  },
  menguante: {
    fuego: ['soltar esa discusión que ya no va a ningún sitio', 'descansar sin sentir culpa'],
    tierra: ['tirar lo que sobra, empezando por la nevera', 'cerrar tareas pendientes de una en una'],
    aire: ['dar por buena la versión corta de la historia', 'apagar las notificaciones un rato'],
    agua: ['manta, sofá y turno de palabra para quien tengas al lado', 'dejar que el día acabe pronto'],
  },
};

/**
 * Frase del día para un signo. Se apoya en un dato real, la fase de la luna, calculado en el dispositivo.
 * @param {string} nacimiento  @param {string} hoy  @param {{grupo: string, nombre: string, emoji: string, iluminada: number}} luna
 */
export function horoscopoDe(nacimiento, hoy, luna) {
  const s = signo(nacimiento);
  const variantes = TOCA[luna.grupo][s.elemento];
  return {
    signo: s,
    frase: `${luna.nombre} y ${s.nombre}: dicen los astros que hoy toca ${variantes[diaDelAno(hoy) % variantes.length]}.`,
    dato: `${luna.emoji} ${luna.nombre}, iluminada al ${Math.round(luna.iluminada * 100)} % (aprox.)`,
  };
}

/**
 * Trazado SVG de la parte iluminada de la luna (hemisferio norte: creciente iluminada a la derecha).
 * @param {number} iluminada fracción iluminada, de 0 a 1  @param {boolean} creciente  @param {number} r radio
 */
export function caminoLuna(iluminada, creciente, r = 40, cx = 50, cy = 50) {
  const k = Math.min(1, Math.max(0, iluminada));
  if (k < 0.005) return '';
  const rx = (r * Math.abs(2 * k - 1)).toFixed(2);
  const borde = creciente ? 1 : 0; // lado iluminado del contorno
  const terminador = (k < 0.5) === creciente ? 0 : 1; // la sombra se curva hacia el lado iluminado en las fases finas
  return `M${cx} ${cy - r}A${r} ${r} 0 0 ${borde} ${cx} ${cy + r}A${rx} ${r} 0 0 ${terminador} ${cx} ${cy - r}Z`;
}

/** La luna de hoy dibujada en su fase real. `luna` es lo que devuelve faseLunar() de cielo.js. */
export const lunaSVG = (luna, lado = 96) => {
  const creciente = luna.edad < 29.530588853 / 2;
  return `<svg class="luna-dibujo" viewBox="0 0 100 100" width="${lado}" height="${lado}" role="img" aria-label="${luna.nombre}, iluminada al ${Math.round(luna.iluminada * 100)} %"><circle cx="50" cy="50" r="40" fill="#2E2466"/><path d="${caminoLuna(luna.iluminada, creciente)}" fill="#FFF3C9"/><circle cx="50" cy="50" r="40" fill="none" stroke="#FFF3C9" stroke-opacity=".35" stroke-width="1.5"/></svg>`;
};

export const ENLACE_LUNA = 'https://www.timeanddate.com/moon/phases/';

/** «Qué hay detrás» del horóscopo: [título, texto, [[nombre del enlace, dirección]]]. */
export const HOROSCOPO_DETRAS = [
  ['Astronomía: lo que sí es real', 'La fase de la luna se repite, de media, cada 29,53 días (mes sinódico). Stormy la calcula en tu móvil con esa cifra, así que puede desviarse en torno a un día respecto a un almanaque.', [
    ['NASA: órbita y fases de la Luna', 'https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html'],
    ['Fase de la luna de hoy (timeanddate)', ENLACE_LUNA],
  ]],
  ['Historia', 'El zodiaco de doce signos iguales viene de la astronomía babilónica, hacia el siglo V a. C. Desde entonces, por la precesión del eje de la Tierra (una vuelta cada 26.000 años), las fechas de los signos ya no coinciden con las constelaciones que les dieron nombre.', [
    ['NASA: la precesión', 'https://pwg.gsfc.nasa.gov/stargaze/Sprecess.htm'],
    ['Wikipedia: Zodiac', 'https://en.wikipedia.org/wiki/Zodiac'],
  ]],
  ['Qué dice la ciencia', 'La astrología no se basa en evidencia científica. En ensayos controlados, como el de Carlson publicado en Nature en 1985, no se ha demostrado que la carta natal describa la personalidad. No hay pruebas de que el signo prediga el carácter ni el ánimo; por eso el horóscopo es un juego y no entra en el pronóstico.', [
    ['NASA Space Place: astronomía y astrología', 'https://spaceplace.nasa.gov/starfinder2/en/'],
    ['Carlson, «A double-blind test of astrology», Nature (1985)', 'https://www.nature.com/articles/318419a0'],
  ]],
];

// ---------- Conoce el ciclo: fichas informativas. Tono formal, sin humor, y solo hechos asentados. ----------

const F = {
  nhsCiclo: ['NHS: el ciclo menstrual', 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/'],
  nhsRegla: ['NHS: la regla', 'https://www.nhs.uk/conditions/periods/'],
  nhsSpm: ['NHS: síndrome premenstrual', 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/'],
  nhsAbundante: ['NHS: reglas abundantes', 'https://www.nhs.uk/conditions/heavy-periods/'],
  owhCiclo: ['Office on Women’s Health (EE. UU.): el ciclo menstrual', 'https://www.womenshealth.gov/menstrual-cycle/your-menstrual-cycle'],
  owhSpm: ['Office on Women’s Health (EE. UU.): síndrome premenstrual', 'https://www.womenshealth.gov/menstrual-cycle/premenstrual-syndrome'],
  owhProblemas: ['Office on Women’s Health (EE. UU.): problemas con la regla', 'https://www.womenshealth.gov/menstrual-cycle/period-problems'],
  sacyl: ['Junta de Castilla y León, Aula de Pacientes: ciclo menstrual', 'https://www.saludcastillayleon.es/escueladepacientes/es/ciudadania/mujer'],
  nichd: ['NICHD (NIH, EE. UU.): menstruación, en español', 'https://espanol.nichd.nih.gov/salud/temas/menstruation/informacion'],
  medline: ['MedlinePlus en español: menstruación', 'https://medlineplus.gov/spanish/menstruation.html'],
  medlineSpm: ['MedlinePlus en español: síndrome premenstrual', 'https://medlineplus.gov/spanish/premenstrualsyndrome.html'],
};

/**
 * Cada fase en cuatro partes cortas, sacadas de las fichas de abajo (mismas fuentes; no añade afirmaciones nuevas).
 * Los identificadores coinciden con FASES de motor.js.
 */
export const FASES_INFO = {
  menstrual: {
    color: '#C9BFF0',
    que: 'El sangrado con el que el cuerpo expulsa el revestimiento del útero (endometrio) cuando no ha habido embarazo.',
    dura: 'Suele durar entre 2 y 7 días, con una media de unos 5. El primer día de sangrado es el día 1 del ciclo.',
    cuerpo: 'Se desprende el revestimiento del útero que se había preparado en el ciclo anterior.',
    fuentes: [F.nhsRegla, F.medline, F.nichd],
  },
  folicular: {
    color: '#8EE0C8',
    que: 'La fase en la que, en los ovarios, comienzan a desarrollarse folículos.',
    dura: 'Llega hasta la ovulación, que en un ciclo de 28 días ocurre hacia el día 14.',
    cuerpo: 'La hormona FSH estimula los folículos. Aumentan los estrógenos y, con ellos, el revestimiento del útero vuelve a engrosarse.',
    fuentes: [F.sacyl, F.nhsCiclo, F.nichd],
  },
  ovulacion: {
    color: '#FFC94D',
    que: 'El momento en que un ovario libera un óvulo maduro.',
    dura: 'El óvulo vive entre 12 y 24 horas. En la mayoría de los casos ocurre entre 10 y 16 días antes de la siguiente regla.',
    cuerpo: 'Se produce tras un aumento de la hormona LH.',
    fuentes: [F.nhsCiclo, F.sacyl, F.owhCiclo],
  },
  lutea: {
    color: '#8FA8F0',
    que: 'La fase que sigue a la ovulación.',
    dura: 'Va desde la ovulación hasta la siguiente regla.',
    cuerpo: 'Aumenta la progesterona, que prepara el útero por si hubiera embarazo. Si no lo hay, bajan los estrógenos y la progesterona.',
    fuentes: [F.sacyl, F.nhsCiclo, F.owhCiclo],
  },
  premenstrual: {
    color: '#7A6CC4',
    que: 'Los días anteriores a la regla. Pueden aparecer síntomas físicos, emocionales o ambos: es lo que se conoce como síndrome premenstrual.',
    dura: 'La semana o las dos semanas anteriores a la regla.',
    cuerpo: 'No se conoce con exactitud la causa del síndrome premenstrual.',
    distinto: 'Los síntomas no son iguales para todas las personas y pueden cambiar de un mes a otro. Algunas personas no tienen síntomas o los tienen muy leves.',
    fuentes: [F.nhsSpm, F.owhSpm, F.medlineSpm],
  },
};
/**
 * Textos de «Conoce el ciclo». Sin el ciclo activado se enseña la versión general (sin «hoy» ni fechas personales)
 * y solo una línea discreta sobre Ajustes. Con el ciclo activado, la fase de hoy.
 * @param {boolean} sigueCiclo  @param {string|null} faseHoy título de la fase de hoy, si se conoce
 */
export function textosConoceCiclo(sigueCiclo, faseHoy = null) {
  if (!sigueCiclo) {
    return { sub: 'Opcional · Conoce cómo funciona el ciclo', nota: 'Si os apetece, podéis activarlo en Ajustes.', personal: false };
  }
  return { sub: faseHoy ? `Hoy: ${faseHoy.toLowerCase()}` : 'Las fases, una a una', nota: null, personal: true };
}

export const CADA_PERSONA = 'Cada persona vive el ciclo de forma distinta, y la duración cambia de una persona a otra y de un mes a otro. Esta información sirve para entender, no para etiquetar.';

/**
 * Curvas esquemáticas de cuatro hormonas a lo largo de un ciclo (x de 0 a 1), solo para ilustrar
 * lo que dicen las fichas: la FSH al principio, los estrógenos suben antes de la ovulación, el pico de LH
 * la desencadena y la progesterona sube después. Valores relativos, sin escala.
 */
const campana = (x, centro, ancho) => Math.exp(-(((x - centro) / ancho) ** 2));
export const HORMONAS = [
  { id: 'estrogenos', nombre: 'Estrógenos', color: '#FF6B5E', valor: (x) => 0.15 + 0.75 * campana(x, 0.46, 0.1) + 0.35 * campana(x, 0.72, 0.12) },
  { id: 'progesterona', nombre: 'Progesterona', color: '#6A5BB5', valor: (x) => 0.08 + 0.8 * campana(x, 0.74, 0.12) },
  { id: 'lh', nombre: 'LH', color: '#E0A400', valor: (x) => 0.1 + 0.85 * campana(x, 0.5, 0.025) },
  { id: 'fsh', nombre: 'FSH', color: '#2FA88A', valor: (x) => 0.12 + 0.3 * campana(x, 0.1, 0.12) },
];

export const AVISO_CICLO = 'Texto informativo, pendiente de revisión por personal sanitario. No sustituye el consejo médico.';

/** [título, texto, fuentes] */
export const FICHAS_CICLO = [
  ['El ciclo en conjunto', 'El ciclo menstrual se cuenta desde el primer día de una regla hasta el primer día de la siguiente. La media ronda los 28 días y en personas adultas se consideran habituales los ciclos de entre 21 y 35 días (alguna fuente da entre 24 y 38). La duración cambia de una persona a otra y de un mes a otro. Es frecuente que sea más irregular en los primeros años tras la primera regla y al acercarse la menopausia; el estrés, los cambios de peso o los anticonceptivos hormonales también pueden modificarla.',
    [F.nhsCiclo, F.owhCiclo, F.sacyl, F.nichd]],
  ['Menstruación', 'Es el sangrado con el que el cuerpo expulsa el revestimiento del útero (endometrio) cuando no ha habido embarazo. El primer día de sangrado es el día 1 del ciclo. Suele durar entre 2 y 7 días, con una media de unos 5.',
    [F.nhsRegla, F.medline, F.nichd]],
  ['Fase folicular', 'En los ovarios comienzan a desarrollarse folículos, estimulados por la hormona FSH. Aumentan los estrógenos y, con ellos, el revestimiento del útero vuelve a engrosarse.',
    [F.sacyl, F.nhsCiclo, F.nichd]],
  ['Ovulación', 'Un ovario libera un óvulo maduro tras un aumento de la hormona LH. En un ciclo de 28 días ocurre hacia el día 14; en la mayoría de los casos, entre 10 y 16 días antes de la siguiente regla. El óvulo vive entre 12 y 24 horas.',
    [F.nhsCiclo, F.sacyl, F.owhCiclo]],
  ['Fase lútea', 'Después de la ovulación aumenta la progesterona, que prepara el útero por si hubiera embarazo. Si no lo hay, los niveles de estrógenos y progesterona bajan y el revestimiento del útero se desprende: empieza la siguiente regla.',
    [F.sacyl, F.nhsCiclo, F.owhCiclo]],
  ['Días previos y síndrome premenstrual', 'En la semana o las dos semanas anteriores a la regla pueden aparecer síntomas físicos, emocionales o ambos; es lo que se conoce como síndrome premenstrual. No son iguales para todas las personas y pueden cambiar de un mes a otro y a lo largo de la vida. Algunas personas no tienen síntomas o los tienen muy leves. No se conoce con exactitud su causa.',
    [F.nhsSpm, F.owhSpm, F.medlineSpm]],
  ['Lo que no se puede deducir', 'Cada persona vive el ciclo de forma distinta y no hay una regla general que permita saber cómo se va a encontrar alguien por la fase en la que está. Por eso Stormy parte de un efecto muy pequeño y lo corrige únicamente con vuestros registros. Esta información sirve para entender, no para etiquetar.',
    [F.nhsSpm, F.owhSpm]],
  ['Cuándo consultar', 'Conviene consultar con un profesional sanitario ante sangrados muy abundantes o reglas de más de 7 días, dolor que impide la vida diaria, ausencia de regla durante tres meses sin embarazo, sangrado entre reglas o síntomas premenstruales intensos.',
    [F.sacyl, F.nhsAbundante, F.owhProblemas]],
];

// ---------- Iconos (SVG propios, sin dependencias) ----------

const nube = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M18 44a10 10 0 0 1-1.2-19.9 14 14 0 0 1 27-3.6A11.5 11.5 0 0 1 46 44z" fill="#fff"/>`;

const sol = (cx, cy, r) => {
  let rayos = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 4);
    const y1 = cy + Math.sin(a) * (r + 4);
    const x2 = cx + Math.cos(a) * (r + 9);
    const y2 = cy + Math.sin(a) * (r + 9);
    rayos += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  return `<g stroke="#FF6B5E" stroke-width="3.4" stroke-linecap="round">${rayos}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FF6B5E"/>`;
};

const gotas = (xs) =>
  `<g stroke="#4C6FFF" stroke-width="3.6" stroke-linecap="round">${xs
    .map((x) => `<line x1="${x}" y1="47" x2="${x - 3}" y2="56"/>`)
    .join('')}</g>`;

const DIBUJOS = {
  5: sol(32, 32, 12),
  4: sol(42, 21, 8) + nube(1, 12, 0.92),
  3: nube(0, 5),
  2: nube(0, -5) + gotas([23, 33, 43]),
  1: nube(0, -6) + gotas([21, 45]) + '<path d="M35 42l-7 10h6l-3 9 9-12h-6l3-7z" fill="#FFC94D"/>',
};

export const iconoTiempo = (tiempo, lado = 28) =>
  `<svg class="ico-tiempo" viewBox="0 0 64 64" width="${lado}" height="${lado}" role="img" aria-label="${TIEMPOS[tiempo].titulo}">${DIBUJOS[tiempo]}</svg>`;

/** Ficha cuadrada con el cielo y el icono de un estado. */
export const ficha = (tiempo, lado = 44) => {
  const c = TIEMPOS[tiempo].cielo;
  return `<span class="ficha" style="width:${lado}px;height:${lado}px;border-radius:${Math.round(lado * 0.3)}px;background:linear-gradient(${c[0]},${c[1]} 55%,${c[2]})">${iconoTiempo(tiempo, Math.round(lado * 0.62))}</span>`;
};

const CARA = '<circle cx="25" cy="33" r="2.6" fill="#1C2340"/><circle cx="38" cy="33" r="2.6" fill="#1C2340"/><path d="M26.5 39.5c2.8 2.8 7.2 2.8 10 0" fill="none" stroke="#1C2340" stroke-width="2.2" stroke-linecap="round"/><circle cx="20.5" cy="38" r="2.4" fill="#FF6B5E" opacity=".6"/><circle cx="42.5" cy="38" r="2.4" fill="#FF6B5E" opacity=".6"/>';
const CORONA = '<path d="M21 15l3.5-9 6 6.5L36 5l5.500 7.500L47 6l1 10z" fill="#FFC94D" stroke="#1E2749" stroke-width="1.6" stroke-linejoin="round"/>';

/** Retrato de Stormy: una nube con cara sobre su trozo de cielo. Con `especial`, lleva la corona del último mundo. */
/** Complementos de la tienda para la cara de Stormy, dibujados sobre la misma rejilla de 64. */
export const COMPLEMENTOS = {
  gafas: '<rect x="18.5" y="28.5" width="12" height="8.5" rx="3.5" fill="#1E2749"/><rect x="33" y="28.5" width="12" height="8.5" rx="3.5" fill="#1E2749"/><path d="M30.5 32h2.5" stroke="#1E2749" stroke-width="2"/><path d="M21 31.2l3.5-1.2M35.5 31.2l3.5-1.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>',
  bufanda: '<path d="M20 22a12 11 0 0 1 24 0z" fill="#8FA8F0"/><rect x="18" y="19.5" width="28" height="5" rx="2.5" fill="#fff" stroke="#8FA8F0" stroke-width="1"/><circle cx="32" cy="10" r="3.6" fill="#fff" stroke="#8FA8F0" stroke-width="1"/><path d="M15 44.5h34v5.5H15z" fill="#FF6B5E"/><path d="M39 48.5l5 9h-6.5z" fill="#FF6B5E"/><path d="M18 47h28" stroke="#fff" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/>',
  dormido: '<circle cx="25" cy="33" r="3.6" fill="#fff"/><circle cx="38" cy="33" r="3.6" fill="#fff"/><path d="M22 33q3 2.6 6 0M35 33q3 2.6 6 0" fill="none" stroke="#1C2340" stroke-width="2" stroke-linecap="round"/><path d="M18 22q14-15 28 0z" fill="#C9BFF0"/><path d="M44 20q8-7 11 4" fill="none" stroke="#C9BFF0" stroke-width="4.5" stroke-linecap="round"/><circle cx="55" cy="25" r="3.2" fill="#fff" stroke="#C9BFF0"/><text x="47" y="13" font-size="9" font-weight="800" fill="#1E2749" font-family="system-ui">z</text>',
  corona: '<path d="M21 15l3.5-9 6 6.5L36 5l5.5 7.5L47 6l1 10z" fill="#FFC94D" stroke="#1E2749" stroke-width="1.6" stroke-linejoin="round"/><circle cx="34.5" cy="10.5" r="1.6" fill="#FF6B5E"/>',
  auriculares: '<path d="M13.5 35a18.5 18.5 0 0 1 37 0" fill="none" stroke="#1E2749" stroke-width="3" stroke-linecap="round"/><rect x="9.5" y="30" width="7.5" height="13" rx="3.5" fill="#FF6B5E" stroke="#1E2749" stroke-width="1.2"/><rect x="47" y="30" width="7.5" height="13" rx="3.5" fill="#FF6B5E" stroke="#1E2749" stroke-width="1.2"/>',
  bigote: '<path d="M31.8 37.6c-2-2.8-6.4-2.8-8.6.6 2.2 0 4.2.9 5.4 2.1 1.6 0 2.7-1.1 3.2-2.7zM31.8 37.6c2-2.8 6.4-2.8 8.6.6-2.2 0-4.2.9-5.4 2.1-1.6 0-2.7-1.1-3.2-2.7z" fill="#5A3E0E"/>',
  // Packs. Dibujos propios: ningún personaje, logotipo ni marca reconocible.
  // Espacio: casco de cristal con antena y cuello de traje.
  astronauta: '<circle cx="32" cy="33" r="26.5" fill="#BFD8F2" fill-opacity=".22" stroke="#E8ECF7" stroke-width="2.6"/><path d="M14 24a20 20 0 0 1 12-11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/><path d="M32 6.5V2" stroke="#1E2749" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="2.4" r="2" fill="#FF6B5E"/><rect x="15" y="54" width="34" height="8" rx="4" fill="#E8ECF7" stroke="#1E2749" stroke-width="1.4"/><circle cx="25" cy="58" r="1.4" fill="#4C7BF0"/><circle cx="39" cy="58" r="1.4" fill="#FF6B5E"/>',
  // Arcade: la nube redibujada en píxeles de 4, con su cara de píxeles (tapa la nube redonda).
  pixel: '<g shape-rendering="crispEdges"><path d="M20 16h24v4h4v4h8v4h4v20h-4v4H8v-4H4V28h4v-4h8v-4h4z" fill="#fff" stroke="#1E2749" stroke-width="2"/><path d="M22 30h4v4h-4zM38 30h4v4h-4zM24 38h4v3h-4zM28 41h8v3h-8zM36 38h4v3h-4z" fill="#1C2340"/><path d="M13 38h5v4h-5zM46 38h5v4h-5z" fill="#FF6B5E" opacity=".6"/><path d="M24 20h8v4h-8z" fill="#DCE5FC"/></g>',
  // Navidad: gorro de lana rojo con borde blanco, borla y dos hojas de acebo.
  'gorro-navidad': '<path d="M17 23c1-10 11-17 24-15 8 1 13 6 15 12l-5 1c-2-3-5-5-8-5 3 2 5 5 5 8z" fill="#D9534F"/><rect x="14" y="20" width="36" height="6.5" rx="3.2" fill="#fff" stroke="#E5D9C3" stroke-width=".8"/><circle cx="55.5" cy="21.5" r="4.4" fill="#fff" stroke="#E5D9C3" stroke-width=".8"/><ellipse cx="20" cy="22.5" rx="3.2" ry="1.7" fill="#3F9E5A" transform="rotate(-25 20 22.5)"/><ellipse cx="24.5" cy="22.5" rx="3.2" ry="1.7" fill="#3F9E5A" transform="rotate(25 24.5 22.5)"/><circle cx="22.3" cy="21.6" r="1.3" fill="#C9302C"/>',
  // Dibujos animados: contorno grueso y ojos grandes.
  cartoon: '<path transform="translate(0 4)" d="M18 44a10 10 0 0 1-1.2-19.9 14 14 0 0 1 27-3.6A11.5 11.5 0 0 1 46 44z" fill="none" stroke="#1E2749" stroke-width="3.4" stroke-linejoin="round"/><ellipse cx="25" cy="31.5" rx="5.2" ry="6.4" fill="#fff" stroke="#1E2749" stroke-width="1.8"/><ellipse cx="38.5" cy="31.5" rx="5.2" ry="6.4" fill="#fff" stroke="#1E2749" stroke-width="1.8"/><circle cx="26" cy="33" r="2.8" fill="#1C2340"/><circle cx="39.5" cy="33" r="2.8" fill="#1C2340"/><circle cx="27" cy="31.6" r="1" fill="#fff"/><circle cx="40.5" cy="31.6" r="1" fill="#fff"/><path d="M25.5 40.5q6.5 6 13 0" fill="#1C2340" stroke="#1C2340" stroke-width="2" stroke-linejoin="round"/>',
};

/** Retrato de Stormy. Con `especial` lleva la corona del último mundo; `cara` es un complemento de la tienda. */
export const avatarNimbo = (lado = 44, especial = false, cara = null) => {
  const extra = cara && COMPLEMENTOS[cara] ? COMPLEMENTOS[cara] : especial ? CORONA : '';
  return `<span class="avatar-nimbo ${especial ? 'especial' : ''}" style="width:${lado}px;height:${lado}px"><svg viewBox="0 0 64 64" width="${Math.round(lado * 0.8)}" height="${Math.round(lado * 0.8)}" aria-hidden="true">${nube(0, 4)}${CARA}${extra}</svg></span>`;
};

// ---------- Escenas animadas para el fondo de «Hoy» (tienda) ----------

const copos = (n, clase = 'copo') => Array.from({ length: n }, (_, i) => `<i class="${clase}" style="left:${(i * 6.9 + 2) % 100}%;animation-delay:${(-(i * 0.73) % 6).toFixed(2)}s;animation-duration:${(5 + (i % 5)).toFixed(1)}s"></i>`).join('');
const ESQUIADOR = '<svg class="esquiador" viewBox="0 0 40 40" aria-hidden="true"><path d="M-30 39q14-2 36-3" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="21" cy="8" r="4" fill="#FF6B5E"/><path d="M20 12l-3 10 6 5-2 8M17 22l-6 4M20 14l7 3" stroke="#1E2749" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 37l26-6" stroke="#1E2749" stroke-width="2.5" stroke-linecap="round"/></svg>';
const MUNECO = '<svg class="muneco" viewBox="0 0 60 80" aria-hidden="true"><circle cx="30" cy="58" r="18" fill="#fff"/><circle cx="30" cy="30" r="13" fill="#fff"/><circle cx="25.5" cy="27" r="1.8" fill="#1E2749"/><circle cx="34.5" cy="27" r="1.8" fill="#1E2749"/><path d="M30 31l9 2-9 2z" fill="#FF8A3D"/><rect x="20" y="10" width="20" height="8" rx="2" fill="#1E2749"/><rect x="16" y="17" width="28" height="3" rx="1.5" fill="#1E2749"/><path d="M17 40h26v4H17z" fill="#FF6B5E"/><circle cx="30" cy="54" r="1.6" fill="#1E2749"/><circle cx="30" cy="62" r="1.6" fill="#1E2749"/><path d="M13 52l-9-8M47 52l9-8" stroke="#5A3E0E" stroke-width="2" stroke-linecap="round"/></svg>';
const SOMBRILLA = '<svg class="sombrilla" viewBox="0 0 80 90" aria-hidden="true"><path d="M40 20v66" stroke="#1E2749" stroke-width="3" stroke-linecap="round"/><path d="M4 34a36 24 0 0 1 72 0z" fill="#FF6B5E"/><path d="M28 34a12 24 0 0 1 24 0z" fill="#fff"/><path d="M4 34q6-4 12 0 6-4 12 0 6-4 12 0 6-4 12 0 6-4 12 0 6-4 12 0" fill="none" stroke="#1E2749" stroke-width="1.5" opacity=".3"/></svg>';
const OLAS = '<svg class="olas" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12q12-10 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0V30H0z" fill="#8FA8F0" opacity=".75"/><path d="M0 18q12-8 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0V30H0z" fill="#fff" opacity=".45"/></svg>';
const PELOTA = '<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#fff"/><path d="M15 2a13 13 0 0 1 0 26" fill="#FFC94D"/><path d="M2 15h26" stroke="#FF6B5E" stroke-width="4"/></svg>';
const COMETA = '<svg class="cometa" viewBox="0 0 70 140" aria-hidden="true"><path d="M35 4l22 26-22 30-22-30z" fill="#FF6B5E"/><path d="M35 4v56M13 30h44" stroke="#fff" stroke-width="2"/><path d="M35 60q-8 14 2 26t-4 26 4 24" fill="none" stroke="#1E2749" stroke-width="1.5"/><path d="M31 74l8 3-8 3zM33 96l8 3-8 3z" fill="#FFC94D"/></svg>';
const ARCOIRIS = '<svg class="arco-escena" viewBox="0 0 200 110" aria-hidden="true">' + ['#FF6B5E', '#FFC94D', '#8EE0C8', '#8FA8F0', '#C9BFF0'].map((c, i) => `<path d="M${10 + i * 10} 105a${90 - i * 10} ${90 - i * 10} 0 0 1 ${180 - i * 20} 0" fill="none" stroke="${c}" stroke-width="10"/>`).join('') + '</svg>';

const PLANETA = '<svg class="planeta" viewBox="0 0 80 50" aria-hidden="true"><ellipse cx="40" cy="27" rx="38" ry="9" fill="none" stroke="#FFC94D" stroke-width="3" opacity=".9"/><circle cx="40" cy="25" r="17" fill="#8FA8F0"/><path d="M26 19q14 6 28 0M24 28q16 5 32 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/><path d="M2 27a38 9 0 0 0 76 0" fill="none" stroke="#FFC94D" stroke-width="3"/></svg>';
const LUNITA = '<svg class="lunita" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#C9BFF0"/><circle cx="7" cy="8" r="2" fill="#fff" opacity=".4"/><circle cx="13" cy="13" r="1.4" fill="#fff" opacity=".35"/></svg>';
// Figurita de píxeles para el salón recreativo: Stormy en miniatura con su rayo, nada reconocible de ningún juego.
const SPRITE = '<svg class="sprite" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M5 2h5v1h1v1h3v1h1v5h-1v1H2v-1H1V5h1V4h2V3h1z" fill="#fff"/><path d="M5 6h1v1H5zM10 6h1v1h-1zM6 8h4v1H6z" fill="#1C2340"/><path d="M8 11h2l-1 2h2l-3 3 1-2H7z" fill="#FFC94D"/></svg>';
const REJILLA = '<svg class="rejilla-neon" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><g stroke="#FF4FD8" stroke-width=".8" fill="none" opacity=".8">' +
  [0, 8, 18, 31, 47].map((y) => `<path d="M0 ${13 + y}H200"/>`).join('') +
  Array.from({ length: 11 }, (_, i) => `<path d="M${100 + (i - 5) * 12} 13L${100 + (i - 5) * 60} 60"/>`).join('') + '</g><path d="M0 13H200" stroke="#3DF5FF" stroke-width="1.4"/></svg>';
const LUCES = '<svg class="guirnalda" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4q25 18 50 4t50 0 50 0 50 0" fill="none" stroke="#1E2749" stroke-width="1" opacity=".5"/></svg>' +
  Array.from({ length: 9 }, (_, i) => `<i class="bombilla-luz" style="left:${5 + i * 11}%;top:${[16, 32, 38, 26, 16, 30, 36, 24, 16][i]}%;background:${['#FFC94D', '#E85D5D', '#5DBB7A', '#FFC94D', '#E85D5D', '#5DBB7A', '#FFC94D', '#E85D5D', '#5DBB7A'][i]};animation-delay:${(i * 0.37 % 2).toFixed(2)}s"></i>`).join('');
const ABETOS = '<svg class="abetos" viewBox="0 0 120 50" aria-hidden="true"><path d="M20 6l12 18h-6l10 14H4l10-14H8z" fill="#3F9E5A" opacity=".85"/><path d="M96 2l14 22h-7l11 16H78l11-16h-7z" fill="#2F7E46" opacity=".85"/><rect x="18" y="38" width="4" height="6" fill="#6B4A2B"/><rect x="94" y="40" width="4" height="6" fill="#6B4A2B"/></svg>';
const NUBE_VINETA = (clase) => `<svg class="nube-vineta ${clase}" viewBox="0 0 64 40" aria-hidden="true"><path d="M14 34a9 9 0 0 1-1-18 12 12 0 0 1 23-4 10 10 0 0 1 18 6 8 8 0 0 1-2 16z" fill="#fff" stroke="#1E2749" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
const ONOMATOPEYA = (texto, clase, color) => `<span class="onomatopeya ${clase}"><svg viewBox="0 0 100 60" aria-hidden="true"><path d="M50 2l8 12 14-8-2 15 16-2-10 12 14 8-16 3 6 14-15-6-5 13-8-12-10 11-2-15-15 5 7-13-14-6 15-5-8-13 16 3 2-15z" fill="${color}" stroke="#1E2749" stroke-width="2.4" stroke-linejoin="round"/><text x="50" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="12" textLength="38" lengthAdjust="spacingAndGlyphs" fill="#1E2749">${texto}</text></svg></span>`;

/** Capa de cada escena. Solo se animan transformaciones y opacidad; con «reducir movimiento» se queda quieta. */
export const ESCENAS = {
  // Todas las escenas se dibujan dentro de la franja de «Hoy» reservada para ellas (ver .escena-banda).
  esqui: () => `<svg class="ladera-banda" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20V12Q50 2 100 8V20z" fill="#fff" opacity=".85"/></svg>${copos(18)}<span class="ruta"><span class="figura">${ESQUIADOR}</span></span>`,
  playa: () => `<span class="olas-ruta">${OLAS}</span>${SOMBRILLA}<span class="ruta-pelota"><span class="pelota">${PELOTA}</span></span>`,
  muneco: () => `<svg class="ladera-banda" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20V10q50-10 100 0V20z" fill="#fff" opacity=".85"/></svg>${copos(12)}${MUNECO}`,
  atardecer: () => '<span class="sol-poniente"></span><span class="franjas"><i></i><i></i><i></i></span>',
  estrellas: () => Array.from({ length: 14 }, (_, i) => `<i class="estrella" style="left:${(i * 13.7 + 4) % 96}%;top:${(i * 23.3 + 6) % 80 + 5}%;animation-delay:${((i * 0.41) % 3).toFixed(2)}s"></i>`).join('') + '<i class="fugaz"></i><i class="fugaz dos"></i>',
  arcoiris: () => ARCOIRIS,
  cometa: () => `<span class="cometa-ruta">${COMETA}</span>`,
  // Packs
  espacio: () => Array.from({ length: 12 }, (_, i) => `<i class="estrella astro" style="left:${(i * 13.7 + 4) % 96}%;top:${(i * 23.3 + 6) % 80 + 5}%;animation-delay:${((i * 0.41) % 3).toFixed(2)}s"></i>`).join('') +
    `<i class="fugaz lenta"></i><i class="fugaz lenta dos"></i><span class="planeta-ruta">${PLANETA}</span><span class="lunita-ruta">${LUNITA}</span>`,
  arcade: () => `${REJILLA}<span class="sprite-ruta"><span class="sprite-salta">${SPRITE}</span></span><i class="neon-sol"></i>`,
  navidad: () => `${LUCES}${copos(10, 'copo copo-suave')}${ABETOS}`,
  vineta: () => `${NUBE_VINETA('a')}${NUBE_VINETA('b')}${ONOMATOPEYA('¡PLIC!', 'plic', '#8EE0C8')}${ONOMATOPEYA('¡ZAS!', 'zas', '#FFC94D')}`,
};

/** Miniatura estática de cada escena para las tarjetas de la tienda. */
export const MINIATURAS = {
  esqui: '<svg viewBox="0 0 60 40"><path d="M0 10L60 30V40H0z" fill="#fff"/><g transform="translate(26 8) scale(.5)"><circle cx="21" cy="8" r="4" fill="#FF6B5E"/><path d="M20 12l-3 10 6 5-2 8M17 22l-6 4M20 14l7 3" stroke="#1E2749" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M6 37l26-6" stroke="#1E2749" stroke-width="2.5"/></g><circle cx="10" cy="6" r="1.5" fill="#fff"/><circle cx="48" cy="10" r="1.5" fill="#fff"/></svg>',
  playa: '<svg viewBox="0 0 60 40"><path d="M0 30q8-5 15 0t15 0 15 0 15 0V40H0z" fill="#8FA8F0"/><path d="M14 10v22" stroke="#1E2749" stroke-width="1.5"/><path d="M2 16a12 8 0 0 1 24 0z" fill="#FF6B5E"/><circle cx="44" cy="18" r="5" fill="#FFC94D" stroke="#fff"/></svg>',
  muneco: '<svg viewBox="0 0 60 40"><path d="M0 32q30-8 60 0V40H0z" fill="#fff"/><circle cx="30" cy="27" r="8" fill="#fff"/><circle cx="30" cy="14" r="6" fill="#fff"/><rect x="25" y="5" width="10" height="4" fill="#1E2749"/><path d="M30 15l5 1-5 1z" fill="#FF8A3D"/></svg>',
  atardecer: '<svg viewBox="0 0 60 40"><circle cx="30" cy="40" r="16" fill="#FF8A5E"/><path d="M0 30h60M6 35h48" stroke="#fff" stroke-width="2" opacity=".6"/></svg>',
  estrellas: '<svg viewBox="0 0 60 40"><path d="M8 8l30 14" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="23" r="2.5" fill="#FFC94D"/><circle cx="12" cy="30" r="1.3" fill="#fff"/><circle cx="50" cy="8" r="1.3" fill="#fff"/><circle cx="26" cy="34" r="1" fill="#fff"/></svg>',
  arcoiris: '<svg viewBox="0 0 60 40">' + ['#FF6B5E', '#FFC94D', '#8EE0C8', '#8FA8F0', '#C9BFF0'].map((c, i) => `<path d="M${6 + i * 4} 38a${24 - i * 4} ${24 - i * 4} 0 0 1 ${48 - i * 8} 0" fill="none" stroke="${c}" stroke-width="4"/>`).join('') + '</svg>',
  cometa: '<svg viewBox="0 0 60 40"><path d="M36 3l9 11-9 12-9-12z" fill="#FF6B5E"/><path d="M36 26q-6 6-2 10" fill="none" stroke="#1E2749" stroke-width="1"/></svg>',
  espacio: '<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#1B266C"/><circle cx="8" cy="8" r="1" fill="#fff"/><circle cx="52" cy="6" r="1.2" fill="#fff"/><circle cx="22" cy="33" r=".9" fill="#fff"/><path d="M4 14l14 6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/><ellipse cx="38" cy="22" rx="16" ry="4" fill="none" stroke="#FFC94D" stroke-width="1.6"/><circle cx="38" cy="21" r="8" fill="#8FA8F0"/><path d="M22 22a16 4 0 0 0 32 0" fill="none" stroke="#FFC94D" stroke-width="1.6"/></svg>',
  arcade: '<svg viewBox="0 0 60 40" shape-rendering="crispEdges"><rect width="60" height="40" fill="#2A0E3D"/><g stroke="#FF4FD8" stroke-width=".7"><path d="M0 26H60M0 30H60M0 35H60M30 24L30 40M22 24L12 40M38 24L48 40M14 24L-6 40M46 24L66 40"/></g><path d="M0 24H60" stroke="#3DF5FF"/><g transform="translate(24 8) scale(.8)"><path d="M5 2h5v1h1v1h3v1h1v5h-1v1H2v-1H1V5h1V4h2V3h1z" fill="#fff"/><path d="M5 6h1v1H5zM10 6h1v1h-1z" fill="#1C2340"/></g></svg>',
  navidad: '<svg viewBox="0 0 60 40"><path d="M0 4q15 10 30 2t30 0" fill="none" stroke="#1E2749" stroke-width=".8" opacity=".5"/><circle cx="8" cy="8" r="2" fill="#FFC94D"/><circle cx="20" cy="10" r="2" fill="#E85D5D"/><circle cx="34" cy="6" r="2" fill="#5DBB7A"/><circle cx="48" cy="6" r="2" fill="#FFC94D"/><path d="M14 14l8 12h-4l6 9H6l6-9H8z" fill="#3F9E5A"/><path d="M0 36q30-6 60 0V40H0z" fill="#fff"/><circle cx="42" cy="20" r="1.3" fill="#fff"/><circle cx="52" cy="28" r="1" fill="#fff"/></svg>',
  vineta: '<svg viewBox="0 0 60 40"><path d="M8 20a5 5 0 0 1 0-10 7 7 0 0 1 13-2 6 6 0 0 1 9 6 4 4 0 0 1-1 6z" fill="#fff" stroke="#1E2749" stroke-width="1.6"/><path d="M42 12l4 6 7-4-1 7 8-1-5 6 7 4-8 1 3 7-7-3-3 7-4-6-5 6-1-8-7 3 3-7-7-3 8-3-4-6 8 1 1-8z" fill="#FFC94D" stroke="#1E2749" stroke-width="1.3"/><text x="45" y="28" text-anchor="middle" font-family="system-ui" font-weight="900" font-size="6.5" fill="#1E2749">¡ZAS!</text></svg>',
};

// ---------- Temas de color para «Hoy» (tienda) ----------
// Cada tema cambia los cinco campos sin bajar el contraste del texto respecto a los colores de siempre
// (lo comprueban las pruebas), con su versión honda para el modo oscuro.
export const TEMAS_HOY = {
  'tema-atardecer': {
    nombre: 'Atardecer',
    claro: { 5: ['#FFD98A', '#FFE6B3', '#FFF4DE'], 4: ['#FFCBB0', '#FFDCCB', '#FFEFE7'], 3: ['#F6CCE0', '#FADCEA', '#FDEFF5'], 2: ['#C8B8F2', '#DAD0F6', '#EEE9FC'], 1: ['#2A1030', '#2E1430', '#200E22'] },
    oscuro: { 5: ['#5A3510', '#442810', '#2A1A0E'], 4: ['#5A2A1E', '#452018', '#2C1510'], 3: ['#4A2440', '#381C32', '#241222'], 2: ['#2E2A66', '#241F52', '#18153A'], 1: ['#2A1030', '#200C26', '#14081A'] },
  },
  'tema-oceano': {
    nombre: 'Océano',
    claro: { 5: ['#FFE08A', '#FFEBB5', '#FFF6DF'], 4: ['#9FE6E0', '#C2EFEB', '#E3F8F6'], 3: ['#BFD8F2', '#D3E5F6', '#EAF2FB'], 2: ['#93B7F0', '#B5CDF5', '#DCE8FC'], 1: ['#0F2A55', '#0C2247', '#081733'] },
    oscuro: { 5: ['#4F4410', '#3C330E', '#26200A'], 4: ['#0E4A4A', '#0B3A3A', '#082828'], 3: ['#1E3A5A', '#182E48', '#101F32'], 2: ['#16326E', '#122858', '#0C1A3C'], 1: ['#0A1E40', '#081834', '#050F22'] },
  },
  'tema-bosque': {
    nombre: 'Bosque',
    claro: { 5: ['#F5E08A', '#F8EAB2', '#FCF5DE'], 4: ['#B5E3A8', '#CCEBC2', '#E6F6E0'], 3: ['#CFE0C0', '#DCE8D1', '#EEF4E8'], 2: ['#9ED0B8', '#BDDECE', '#E0F0E8'], 1: ['#14301C', '#122B19', '#0B1D10'] },
    oscuro: { 5: ['#4B4410', '#3A340E', '#25210A'], 4: ['#1E4A22', '#173A1B', '#0F2712'], 3: ['#2C3D2E', '#233124', '#18221A'], 2: ['#144034', '#103329', '#0A241D'], 1: ['#0F2A16', '#0B2111', '#07160B'] },
  },
};

// Temas de los packs (mismas reglas de contraste; se comprueban en las pruebas).
Object.assign(TEMAS_HOY, {
  'tema-espacio': {
    nombre: 'Noche espacial',
    claro: { 5: ['#F6D656', '#F9E286', '#FCF1C5'], 4: ['#C6D1F5', '#DAE2F9', '#EFF2FC'], 3: ['#C5C2ED', '#D8D5F3', '#EDECF9'], 2: ['#96B9E9', '#B7CFF0', '#E0EAF8'], 1: ['#1B266C', '#28389F', '#4154CF'] },
    oscuro: { 5: ['#4E411A', '#3B3114', '#27200D'], 4: ['#12254A', '#0E1C39', '#0A1429'], 3: ['#362C74', '#2B235E', '#1F1A44'], 2: ['#193964', '#142D4F', '#0E1F37'], 1: ['#182472', '#131D5C', '#0D133D'] },
  },
  'tema-neon': {
    nombre: 'Neón',
    claro: { 5: ['#F9FF4D', '#FBFF80', '#FDFFC2'], 4: ['#76F8F3', '#A6FAF7', '#D7FDFC'], 3: ['#F7B8F2', '#FACEF6', '#FDE8FB'], 2: ['#C19AF7', '#D5BAF9', '#ECE1FD'], 1: ['#4A105D', '#70198D', '#A324CD'] },
    oscuro: { 5: ['#3A490D', '#2D380A', '#1C2306'], 4: ['#084C4C', '#063939', '#042727'], 3: ['#631957', '#511447', '#3B0F34'], 2: ['#411A78', '#341461', '#250E44'], 1: ['#491264', '#3B0E51', '#280A37'] },
  },
  'tema-navidad': {
    nombre: 'Navidad',
    claro: { 5: ['#F3CE70', '#F7DD9C', '#FBF0D2'], 4: ['#A7DEB9', '#C8EAD3', '#E6F6EB'], 3: ['#EFC0C4', '#F4D4D6', '#FAEBEC'], 2: ['#ACD3C6', '#C6E1D8', '#E6F2EE'], 1: ['#551923', '#7F2534', '#B9364C'] },
    oscuro: { 5: ['#513E17', '#3F3012', '#281E0C'], 4: ['#17452A', '#123521', '#0D2617'], 3: ['#62252A', '#4F1E22', '#391619'], 2: ['#1B3F36', '#15322B', '#0F221D'], 1: ['#521B25', '#42161D', '#2C0F14'] },
  },
  'tema-primarios': {
    nombre: 'Primarios',
    claro: { 5: ['#FFE14D', '#FFEA80', '#FFF5C2'], 4: ['#F9C6C5', '#FBD9D8', '#FDF1F0'], 3: ['#BAD8F5', '#D0E4F8', '#E9F3FC'], 2: ['#93AEEC', '#B5C7F2', '#DFE7F9'], 1: ['#192A62', '#253E93', '#3D5FCE'] },
    oscuro: { 5: ['#4F4314', '#3B320F', '#251F09'], 4: ['#451917', '#351312', '#260E0D'], 3: ['#1E3B5B', '#182E48', '#112133'], 2: ['#1F366B', '#192B55', '#111E3C'], 1: ['#1A2966', '#142051', '#0E1637'] },
  },
});

// ---------- Reacciones nuevas al registrar (tienda) ----------
export const REACCIONES_EXTRA = {
  fiesta: { lineas: ['¡Parte entregado! Esto hay que celebrarlo.', 'Confeti para el parte de hoy: constancia de campeonato.', '¡Toma ya! Un día más en el mapa.'], rafaga: 'confeti' },
  aplausos: { lineas: ['Plas, plas, plas. El público en pie por este parte.', 'Ovación cerrada desde la sala de máquinas.', 'Aplausos de todo el equipo de meteorología (o sea, de mí).'], rafaga: 'aplausos' },
};


/** Stormy para la portada: la nube con su rayo mango, que parpadea. */
export const stormyPortada = (lado = 132) =>
  `<svg class="stormy-portada" viewBox="0 0 64 64" width="${lado}" height="${lado}" role="img" aria-label="Stormy, una nube con un rayo"><circle class="destello-rayo" cx="33" cy="52" r="13" fill="#FFC94D"/>${nube(0, -2)}<g transform="translate(0 -6)">${CARA}</g><path class="rayito" d="M35 41l-8 11h6.500l-3.500 10 10-13.500h-6.500l3.500-7.500z" fill="#FFC94D" stroke="#2E2466" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

/** Sol y nube sueltos, para la animación de «Juego limpio». */
export const solSuelto = (lado = 96) => `<svg viewBox="0 0 64 64" width="${lado}" height="${lado}" aria-hidden="true">${sol(32, 32, 13)}</svg>`;
export const nubeSuelta = (lado = 96) => `<svg viewBox="0 0 64 64" width="${lado}" height="${lado}" aria-hidden="true">${nube(0, 5)}</svg>`;

const trazo = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONOS = {
  hoy: trazo('<circle cx="16.5" cy="7.5" r="3"/><path d="M16.5 1.8v1M21.2 3.6l-.7.7M23 7.5h-1M11.8 3.6l.7.7"/><path d="M6.5 20a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6-1.4A4.6 4.6 0 0 1 17 20z" fill="currentColor"/>'),
  calendario: trazo('<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  grafico: trazo('<path d="M5 20V11M12 20V5M19 20v-6"/>', 'stroke-width="3.2"'),
  ajustes: trazo('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>', 'stroke-width="1.7"'),
  candado: trazo('<rect x="5" y="10.5" width="14" height="10" rx="2.8" fill="currentColor" stroke="none"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/>'),
  mas: trazo('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
  subir: trazo('<path d="M12 19V6M6.500 11.500L12 6l5.500 5.500"/>', 'stroke-width="2.6"'),
  lapiz: trazo('<path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5z"/>'),
  izquierda: trazo('<path d="M15 5l-7 7 7 7"/>', 'stroke-width="2.6"'),
  derecha: trazo('<path d="M9 5l7 7-7 7"/>', 'stroke-width="2.6"'),
  bombilla: trazo('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.300 1.100 2.200h5c0-.9.4-1.600 1.100-2.200A6 6 0 0 0 12 3z"/>'),
  llama: trazo('<path d="M12 21a6 6 0 0 0 6-6c0-3.500-2.500-5-3.500-8-1.500 1.500-2 3-2 4.500C11 10 10 8.500 10 7c-2 1.800-4 4.500-4 8a6 6 0 0 0 6 6z" fill="currentColor" stroke="none"/>'),
  compartir: trazo('<path d="M12 15V4M8 7.500L12 3.500l4 4M5.500 12v6.500a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V12"/>'),
  termometro: trazo('<path d="M10 14.500V5a2 2 0 0 1 4 0v9.500a4 4 0 1 1-4 0z"/><path d="M12 9v7.500"/>'),
  prismaticos: trazo('<circle cx="7" cy="16" r="3.500"/><circle cx="17" cy="16" r="3.500"/><path d="M5 13l2-7.500h3V15M19 13l-2-7.500h-3V15M10.500 12h3"/>'),
  nubesol: trazo('<circle cx="16.500" cy="7.500" r="3"/><path d="M6.500 20a4 4 0 0 1-.5-8 5.500 5.500 0 0 1 10.600-1.400A4.600 4.600 0 0 1 17 20z"/>'),
  tornado: trazo('<path d="M4 5h16M6 9h12M8.500 13h8M11 17h4M12.500 21h1"/>', 'stroke-width="2.4"'),
  destello: trazo('<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor" stroke="none"/>'),
  medalla: trazo('<circle cx="12" cy="9" r="5.500"/><path d="M8.500 13.500L7 21l5-2.500 5 2.500-1.500-7.500"/>'),
  historia: trazo('<path d="M4 4v16h16"/><path d="M7.500 14l3.500-4 3 2.500L19 7"/>'),
  semana: trazo('<rect x="3.500" y="5" width="17" height="15.500" rx="3.500"/><path d="M8 10v6M12 10v6M16 10v6"/>'),
  factores: trazo('<path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="17" r="2"/>'),
  ciclo: trazo('<circle cx="12" cy="12" r="8.500" stroke-dasharray="2.500 3.500"/><circle cx="12" cy="12" r="3"/>'),
  diana: trazo('<circle cx="12" cy="12" r="6.500"/><circle cx="12" cy="12" r="1.500" fill="currentColor"/><path d="M12 2.500v4M12 17.500v4M2.500 12h4M17.500 12h4"/>'),
  toque: trazo('<path d="M9 11V5.500a1.800 1.800 0 0 1 3.600 0V11l4.700 1a2.500 2.500 0 0 1 2 2.900l-.7 3.600a3 3 0 0 1-2.900 2.500h-4.200a3 3 0 0 1-2.300-1.100l-3.900-4.600a1.700 1.700 0 0 1 2.500-2.300z"/>'),
  personas: trazo('<circle cx="9" cy="8" r="3.300"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 5a3.300 3.300 0 0 1 0 6.400M17.500 14.200a6.500 6.500 0 0 1 4 5.800"/>'),
  movil: trazo('<rect x="6.500" y="2.500" width="11" height="19" rx="2.800"/><rect x="10" y="11" width="4" height="3.600" rx=".8" fill="currentColor" stroke="none"/><path d="M10.800 11v-1a1.200 1.200 0 0 1 2.400 0v1"/>'),
  mascaras: trazo('<path d="M3 5c3 1.500 6 1.500 9 0v6a4.500 4.500 0 0 1-9 0z"/><path d="M12 9.500c3 1.500 6 1.500 9 0V15a4.500 4.500 0 0 1-8.300 2.400"/><path d="M5.800 11c1 1 2.400 1 3.400 0"/>'),
  gota: trazo('<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z" fill="currentColor" stroke="none"/>'),
  rayo: trazo('<path d="M13.500 2.500L5 13.500h5.500L9.500 21.500 19 10h-6z" fill="currentColor" stroke="none"/>'),
  luna: trazo('<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500z"/>'),
  estrella: trazo('<path d="M12 3.500l2.500 5.300 5.800.7-4.300 4 1.100 5.700L12 16.400l-5.100 2.800L8 13.500l-4.300-4 5.800-.7z"/>'),
  visto: trazo('<path d="M5 12.500l4.500 4.500L19 7.500"/>', 'stroke-width="2.8"'),
  escudo: trazo('<path d="M12 3l7.500 3v5.500c0 4.500-3 8-7.500 9.500-4.500-1.500-7.500-5-7.500-9.500V6z"/><path d="M9 12l2.200 2.200L15.200 10"/>'),
  corona: trazo('<path d="M4 18.500h16M4.500 15.500L3 7l5.500 4L12 5l3.500 6L21 7l-1.500 8.500z"/>'),
  libro: trazo('<path d="M12 6.500C10 5 7 4.500 4 5v13c3-.5 6 0 8 1.500 2-1.500 5-2 8-1.500V5c-3-.5-6 0-8 1.500zM12 6.500v13"/>'),
  comparar: trazo('<path d="M5 20V10M10 20V5M15 20v-7M20 20V8"/>', 'stroke-width="2.6"'),
  resumen: trazo('<rect x="5" y="3.500" width="14" height="17" rx="3"/><path d="M8.500 8.500h7M8.500 12h7M8.500 15.500h4"/>'),
  copiar: trazo('<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M5.500 15.500V6.500a2 2 0 0 1 2-2h8"/>'),
  campana: trazo('<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15zM10 21h4"/>'),
  ojo: trazo('<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>'),
  casa: trazo('<path d="M4 11l8-7 8 7v8.500a1 1 0 0 1-1 1h-4.500v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
  tienda: trazo('<path d="M4 10.5h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M3.5 10.5V8.5A3.5 3.5 0 0 1 7 5h10a3.5 3.5 0 0 1 3.5 3.5v2"/><rect x="10.2" y="12" width="3.6" height="4.4" rx="1.2" fill="currentColor" stroke="none"/><path d="M8 5v5.5M16 5v5.5"/>'),
  papelera: trazo('<path d="M4 7h16M9 7V4.500h6V7M6.500 7l1 13h9l1-13"/>'),
};
