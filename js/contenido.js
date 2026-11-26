// Textos, estados del tiempo e iconos. El nombre de la app se cambia aquí y en index.html / manifest.
export const APP = { nombre: 'Sí, Cielo', lema: 'El parte del tiempo de tu casa' };

/** Los cinco estados del tiempo en casa. 1 = tormenta, 5 = soleado. */
export const TIEMPOS = {
  5: {
    id: 5, titulo: 'Soleado', desc: 'Día estupendo', emoji: '☀️', tinte: '#FFA826',
    cielo: ['#1877E6', '#49B6F5', '#FFD98A'],
    consejos: [
      'Cielo despejado. Hoy hasta tus chistes malos tienen público.',
      'Día perfecto para proponer ese plan que llevas semanas aplazando.',
      'Buen momento para sacar el tema de las vacaciones.',
    ],
  },
  4: {
    id: 4, titulo: 'Sol y nubes', desc: 'Buen día', emoji: '⛅️', tinte: '#3D9BE9',
    cielo: ['#2F6FD0', '#6FAEE8', '#C4DDF5'],
    consejos: [
      'Buen tiempo con alguna nube. Un café a tiempo mantiene el anticiclón.',
      'Todo en orden. No lo estropees dejando la toalla mojada sobre la cama.',
      'Día agradable: propón un paseo antes de que alguien encienda la tele.',
    ],
  },
  3: {
    id: 3, titulo: 'Nublado', desc: 'Día normal', emoji: '☁️', tinte: '#8794A8',
    cielo: ['#56657A', '#8794A8', '#BFC8D4'],
    consejos: [
      'Cielo cubierto. Pregunta qué tal el día y, esta vez, escucha la respuesta.',
      'Ni frío ni calor. Haz esa tarea de casa sin que nadie te la pida.',
      'Tiempo variable: un detalle pequeño puede abrir claros.',
    ],
  },
  2: {
    id: 2, titulo: 'Lluvia', desc: 'Día bajo', emoji: '🌧️', tinte: '#4A7FB5',
    cielo: ['#2C3E55', '#4B6A88', '#86A0B8'],
    consejos: [
      'Posibles chubascos. Menos consejos y más escuchar.',
      'Lleva paraguas emocional y ten chocolate en la despensa.',
      'Día gris: cena hecha y móvil en el bolsillo.',
    ],
  },
  1: {
    id: 1, titulo: 'Tormenta', desc: 'Día muy difícil', emoji: '⛈️', tinte: '#6C5CE7',
    cielo: ['#171A36', '#3A2E66', '#6A5A96'],
    consejos: [
      'Aviso naranja. No es el día para debatir quién friega más.',
      'Tormenta a la vista: recoge la cocina y ofrece un abrazo.',
      'Hoy toca refugio: manta, su serie favorita y cero opiniones no pedidas.',
    ],
  },
};
export const ORDEN_TIEMPOS = [5, 4, 3, 2, 1];

const diaDelAno = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(a, 0, 0)) / 864e5);
};
export const consejoDe = (tiempo, iso) => {
  const lista = TIEMPOS[tiempo].consejos;
  return lista[diaDelAno(iso) % lista.length];
};

export const ETIQUETAS = [
  'Trabajo intenso', 'Plan juntos', 'Visita familiar', 'Deporte', 'Discusión',
  'Día de descanso', 'Poco tiempo juntos', 'Detalle bonito', 'Malestar físico', 'Plan con amigas',
];

export const INSIGNIAS = [[10, 'Curioso'], [25, 'Detallista'], [50, 'Notario del hogar']];

// ---------- Horóscopo de broma (no interviene en el pronóstico) ----------

export function signo(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const c = m * 100 + d;
  const tabla = [
    [321, 419, 'Aries', '♈️'], [420, 520, 'Tauro', '♉️'], [521, 620, 'Géminis', '♊️'],
    [621, 722, 'Cáncer', '♋️'], [723, 822, 'Leo', '♌️'], [823, 922, 'Virgo', '♍️'],
    [923, 1022, 'Libra', '♎️'], [1023, 1121, 'Escorpio', '♏️'], [1122, 1221, 'Sagitario', '♐️'],
    [120, 218, 'Acuario', '♒️'], [219, 320, 'Piscis', '♓️'],
  ];
  const s = tabla.find(([a, b]) => c >= a && c <= b);
  return s ? { nombre: s[2], emoji: s[3] } : { nombre: 'Capricornio', emoji: '♑️' };
}

const FRASES = [
  'Mercurio retrógrado desaconseja discutir hoy por el mando de la tele.',
  'Venus entra en tu salón: buen día para fregar sin que te lo pidan.',
  'Los astros coinciden en que bajar la basura trae buena suerte.',
  'La Luna sugiere que «lo que tú quieras» no es una respuesta válida para la cena.',
  'Saturno recomienda acordarte de esa fecha que crees que no es importante.',
  'Júpiter favorece a quienes responden a los mensajes antes de tres horas.',
  'Marte aconseja no decir «tranquila» bajo ningún concepto.',
];
export const fraseHoroscopo = (iso) => FRASES[diaDelAno(iso) % FRASES.length];

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
  return `<g stroke="#FFC92E" stroke-width="3.4" stroke-linecap="round">${rayos}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFC92E"/>`;
};

const gotas = (xs) =>
  `<g stroke="#3DBBF2" stroke-width="3.6" stroke-linecap="round">${xs
    .map((x) => `<line x1="${x}" y1="47" x2="${x - 3}" y2="56"/>`)
    .join('')}</g>`;

const DIBUJOS = {
  5: sol(32, 32, 12),
  4: sol(42, 21, 8) + nube(1, 12, 0.92),
  3: nube(0, 5),
  2: nube(0, -5) + gotas([23, 33, 43]),
  1: nube(0, -6) + gotas([21, 45]) + '<path d="M35 42l-7 10h6l-3 9 9-12h-6l3-7z" fill="#FFC92E"/>',
};

export const iconoTiempo = (tiempo, lado = 28) =>
  `<svg class="ico-tiempo" viewBox="0 0 64 64" width="${lado}" height="${lado}" role="img" aria-label="${TIEMPOS[tiempo].titulo}">${DIBUJOS[tiempo]}</svg>`;

/** Ficha cuadrada con el cielo y el icono de un estado. */
export const ficha = (tiempo, lado = 44) => {
  const c = TIEMPOS[tiempo].cielo;
  return `<span class="ficha" style="width:${lado}px;height:${lado}px;border-radius:${Math.round(lado * 0.3)}px;background:linear-gradient(${c[0]},${c[1]} 55%,${c[2]})">${iconoTiempo(tiempo, Math.round(lado * 0.62))}</span>`;
};

/** Retrato de Nimbo: una nube con cara sobre su trozo de cielo. */
export const avatarNimbo = (lado = 44) =>
  `<span class="avatar-nimbo" style="width:${lado}px;height:${lado}px"><svg viewBox="0 0 64 64" width="${Math.round(lado * 0.8)}" height="${Math.round(lado * 0.8)}" aria-hidden="true">${nube(0, 4)}<circle cx="25" cy="33" r="2.6" fill="#1C2340"/><circle cx="38" cy="33" r="2.6" fill="#1C2340"/><path d="M26.5 39.500c2.800 2.800 7.200 2.800 10 0" fill="none" stroke="#1C2340" stroke-width="2.200" stroke-linecap="round"/><circle cx="20.500" cy="38" r="2.400" fill="#FF8A3D" opacity=".55"/><circle cx="42.500" cy="38" r="2.400" fill="#FF8A3D" opacity=".55"/></svg></span>`;

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
  papelera: trazo('<path d="M4 7h16M9 7V4.500h6V7M6.500 7l1 13h9l1-13"/>'),
};
