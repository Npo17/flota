// Emblemas de clan (17/11/2026), por capas: forma + fondo + patrón + símbolo + borde, cada uno con su color.
// Se guarda como { forma, fondo, patron, cPatron, simbolo, cSimbolo, borde (0 a 3), cBorde } y se dibuja acá, en SVG,
// igual en todas partes (pantalla del clan, chat, rankings, marcador, vela del barco). Lo que no se conoce cae en el primero
// de cada lista, así se pueden sumar formas, patrones o símbolos sin tocar la base de datos.
// Todo está dibujado en una caja de 120 x 120.

export const PALETA = ['#0b1d33', '#1d3f6e', '#2a5f80', '#3f8fc0', '#7ec8e3', '#0e6b5c', '#2e8b57', '#9acd32',
  '#f3ead2', '#ffffff', '#c0c6cc', '#6b7680', '#2b2b2b', '#000000', '#ffd166', '#e0a526',
  '#c98b4f', '#7a4a22', '#3b220e', '#ff8a3d', '#e63946', '#8a1c1c', '#5b0f1a', '#ff7eb6',
  '#c9a4ff', '#7b3fbf', '#3d1a6e', '#12a39a', '#b8ffcb', '#ffe9a8', '#d4af37', '#4a5568'];

const BANDERA = 'M4 20 H116 V100 H4Z';
export const FORMAS = {
  rectangular: BANDERA,
  corneta: 'M4 20 H116 L92 60 L116 100 H4Z',
  gallardete: 'M4 18 L116 60 L4 102Z',
  grimpola: 'M4 18 L116 42 V78 L4 102Z',
  ondeante: 'M4 24 C34 10 58 34 88 22 C100 17 110 16 116 18 V96 C106 94 98 96 88 100 C58 112 34 88 4 102Z',
  dentada: 'M4 20 H116 L100 33 L116 46 L100 60 L116 74 L100 87 L116 100 H4Z',
  estandarte: 'M22 6 H98 V100 L60 84 L22 100Z',
  pendon: 'M22 6 H98 V94 L79 114 L60 94 L41 114 L22 94Z',
  escudo: 'M14 8 H106 V58 C106 88 84 106 60 114 C36 106 14 88 14 58Z',
  escudo_frances: 'M14 8 H106 V82 Q106 102 86 102 H72 L60 114 L48 102 H34 Q14 102 14 82Z',
  escudo_redondo: 'M14 8 H106 V64 A46 46 0 0 1 14 64Z',
  escudo_puntas: 'M14 6 L37 16 L60 4 L83 16 L106 6 V60 C106 88 84 106 60 114 C36 106 14 88 14 60Z',
  ovalo: 'M60 4 C90 4 108 30 108 60 C108 90 90 116 60 116 C30 116 12 90 12 60 C12 30 30 4 60 4Z',
  circulo: 'M60 6 A54 54 0 1 1 59.9 6Z',
  rombo: 'M60 4 L116 60 L60 116 L4 60Z',
  hexagono: 'M60 4 L109 32 V88 L60 116 L11 88 V32Z',
  octogono: 'M38 6 H82 L114 38 V82 L82 114 H38 L6 82 V38Z',
};
const ES_BANDERA = (f) => ['rectangular', 'corneta', 'gallardete', 'grimpola', 'ondeante', 'dentada'].includes(f);

// Patrones: se dibujan del color cPatron, recortados por la forma
export const PATRONES = {
  liso: () => '',
  asta: (c) => `<rect x="0" y="0" width="30" height="120" fill="${c}"/>`,
  franjas_h: (c) => `<rect x="0" y="47" width="120" height="26" fill="${c}"/>`,
  tres_franjas: (c) => `<rect x="0" y="0" width="120" height="40" fill="${c}"/><rect x="0" y="80" width="120" height="40" fill="${c}"/>`,
  franjas_v: (c) => `<rect x="47" y="0" width="26" height="120" fill="${c}"/>`,
  rayado: (c) => [0, 1, 2, 3, 4, 5].map((k) => `<rect x="0" y="${k * 20 + 10}" width="120" height="10" fill="${c}"/>`).join(''),
  cruz: (c) => `<rect x="50" y="0" width="20" height="120" fill="${c}"/><rect x="0" y="50" width="120" height="20" fill="${c}"/>`,
  cruz_nordica: (c) => `<rect x="34" y="0" width="18" height="120" fill="${c}"/><rect x="0" y="51" width="120" height="18" fill="${c}"/>`,
  aspa: (c) => `<path d="M0 0 L20 0 L120 100 L120 120 L100 120 L0 20Z M120 0 L120 20 L20 120 L0 120 L0 100 L100 0Z" fill="${c}"/>`,
  banda: (c) => `<path d="M0 0 L30 0 L120 90 L120 120 L90 120 L0 30Z" fill="${c}"/>`,
  barra: (c) => `<path d="M120 0 L90 0 L0 90 L0 120 L30 120 L120 30Z" fill="${c}"/>`,
  mitad_h: (c) => `<rect x="0" y="60" width="120" height="60" fill="${c}"/>`,
  mitad_v: (c) => `<rect x="60" y="0" width="60" height="120" fill="${c}"/>`,
  diagonal: (c) => `<path d="M120 0 L120 120 L0 120Z" fill="${c}"/>`,
  cuartelado: (c) => `<rect x="60" y="0" width="60" height="60" fill="${c}"/><rect x="0" y="60" width="60" height="60" fill="${c}"/>`,
  canton: (c) => `<rect x="0" y="0" width="56" height="56" fill="${c}"/>`,
  triangulo: (c) => `<path d="M0 0 L62 60 L0 120Z" fill="${c}"/>`,
  chevron: (c) => `<path d="M0 70 L60 30 L120 70 L120 96 L60 56 L0 96Z" fill="${c}"/>`,
  bordura: (c) => `<path fill-rule="evenodd" d="M0 0 H120 V120 H0Z M16 16 V104 H104 V16Z" fill="${c}"/>`,
  ondas: (c) => [30, 62, 94].map((y) => `<path d="M0 ${y} Q15 ${y - 9} 30 ${y} T60 ${y} T90 ${y} T120 ${y} V${y + 9} Q105 ${y} 90 ${y + 9} T60 ${y + 9} T30 ${y + 9} T0 ${y + 9}Z" fill="${c}"/>`).join(''),
  ajedrezado: (c) => { let s = ''; for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) if ((i + k) % 2) s += `<rect x="${i * 20}" y="${k * 20}" width="20" height="20" fill="${c}"/>`; return s; },
  rayos: (c) => { let s = ''; for (let k = 0; k < 16; k += 2) { const a = k * Math.PI / 8, b = (k + 1) * Math.PI / 8; s += `<path d="M60 60 L${(60 + Math.cos(a) * 120).toFixed(1)} ${(60 + Math.sin(a) * 120).toFixed(1)} L${(60 + Math.cos(b) * 120).toFixed(1)} ${(60 + Math.sin(b) * 120).toFixed(1)}Z" fill="${c}"/>`; } return s; },
  anillo: (c) => `<circle cx="60" cy="60" r="36" fill="none" stroke="${c}" stroke-width="10"/>`,
};

// Símbolos, en una caja de 40 x 40, del color c
const pts = (n, cx, cy, r1, r2, giro = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, k) => { const a = giro + k * Math.PI / n, r = k % 2 ? r2 : r1; return (cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1); }).join(' ');
const trazo = (c, w, d) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ojo = (x, y, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" opacity="0.55"/>`;
const ANCLA = (c) => `<circle cx="20" cy="6.5" r="3.6" fill="none" stroke="${c}" stroke-width="3"/>` + trazo(c, 3.2, 'M20 10V36 M12 15h16 M6 25c2 8 8 11 14 11s12-3 14-11 M6 25l-1.5 4 M34 25l1.5 4');
const SABLE = (c) => trazo(c, 3.4, 'M9 33 C18 25 26 15 32 4') + trazo(c, 3, 'M6 26 L15 35 M10 30 L5 35');
const CALAVERA = (c) => `<path fill="${c}" fill-rule="evenodd" d="M20 4C11 4 6 10 6 17c0 5 2 8 5 10v5h18v-5c3-2 5-5 5-10 0-7-5-13-14-13Z M13.5 14a3.5 4 0 1 0 0.1 0Z M26.5 14a3.5 4 0 1 0 0.1 0Z M20 20l-2 4h4Z"/>` + trazo(c, 2.2, 'M13 33v3 M18 33v3 M22 33v3 M27 33v3');
export const SIMBOLOS = {
  ancla: ANCLA,
  anclas_cruzadas: (c) => `<g transform="rotate(-30 20 20) scale(0.85) translate(3.5 3)">${ANCLA(c)}</g><g transform="rotate(30 20 20) scale(0.85) translate(3.5 3)">${ANCLA(c)}</g>`,
  timon: (c) => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><circle cx="20" cy="20" r="10"/>${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<path d="M${(20 + Math.cos(a) * 3).toFixed(1)} ${(20 + Math.sin(a) * 3).toFixed(1)} L${(20 + Math.cos(a) * 17).toFixed(1)} ${(20 + Math.sin(a) * 17).toFixed(1)}"/>`; }).join('')}</g><circle cx="20" cy="20" r="3.5" fill="${c}"/>`,
  calavera: CALAVERA,
  calavera_tibias: (c) => trazo(c, 3.4, 'M4 26 L36 38 M36 26 L4 38') + `<g transform="translate(4 -1) scale(0.8)">${CALAVERA(c)}</g>`,
  kraken: (c) => `<path fill="${c}" d="M20 3c-7 0-11 5-11 11 0 4 2 6 4 8h14c2-2 4-4 4-8 0-6-4-11-11-11Z"/>` + trazo(c, 3, 'M13 22c-4 4-8 6-10 12 M17 23c-2 5-3 9-6 13 M23 23c2 5 3 9 6 13 M27 22c4 4 8 6 10 12') + ojo(16, 13, 2) + ojo(24, 13, 2),
  sirena: (c) => `<circle cx="20" cy="7" r="4.5" fill="${c}"/><path fill="${c}" d="M15 12 H25 L24 22 C24 28 20 31 18 33 L13 37 L12 31 C14 30 17 27 16 22Z"/><path fill="${c}" d="M18 32 L10 38 L13 31Z M18 33 L26 38 L22 31Z"/>` + trazo(c, 2.2, 'M16 4 C12 8 13 14 10 17 M24 4 C28 8 27 14 30 17'),
  tridente: (c) => trazo(c, 3.2, 'M20 8V38 M10 6v8c0 4 4 7 10 7s10-3 10-7V6') + `<path fill="${c}" d="M20 1l3.5 7h-7Z M10 0l3.5 7h-7Z M30 0l3.5 7h-7Z"/>`,
  sable: SABLE,
  sables_cruzados: (c) => SABLE(c) + `<g transform="translate(40 0) scale(-1 1)">${SABLE(c)}</g>`,
  canon: (c) => `<path fill="${c}" d="M5 15 L31 10 C35 10 36 13 35 16 L32 20 L6 22 C3 22 2 16 5 15Z"/><circle cx="14" cy="27" r="7" fill="none" stroke="${c}" stroke-width="3"/><circle cx="14" cy="27" r="2" fill="${c}"/>` + trazo(c, 3, 'M4 35 H36'),
  bomba: (c) => `<circle cx="18" cy="23" r="13" fill="${c}"/><rect x="22" y="6" width="7" height="6" rx="1" transform="rotate(35 25 9)" fill="${c}"/>` + trazo(c, 2, 'M28 6 C31 3 34 4 35 2') + `<polygon points="${pts(5, 36, 2, 3.5, 1.4)}" fill="${c}"/>`,
  catalejo: (c) => `<g transform="rotate(-30 20 20)"><rect x="2" y="15" width="12" height="10" rx="1.5" fill="${c}"/><rect x="14" y="16" width="12" height="8" fill="${c}" opacity="0.85"/><rect x="26" y="17" width="12" height="6" fill="${c}"/></g>`,
  velero: (c) => `<path fill="${c}" d="M19 3 V27 H6Z M21 5 L34 27 H21Z"/><path fill="${c}" d="M3 29 H37 L32 36 H8Z"/>`,
  galeon: (c) => `<path fill="${c}" d="M3 26 H37 L33 35 H9Z"/><path fill="${c}" d="M10 8 H18 V23 H8Z M21 4 H30 V23 H20Z M32 12 L37 20 H32Z"/>` + trazo(c, 1.6, 'M14 4 V26 M25 1 V26 M34 9 V26'),
  faro: (c) => `<path fill="${c}" d="M15 36 L17 14 H23 L25 36Z M15 12 H25 L23 8 H17Z"/><rect x="13" y="35" width="14" height="3" fill="${c}"/>` + trazo(c, 2, 'M26 10 L37 6 M26 12 L38 13 M14 10 L3 6 M14 12 L2 13'),
  rosa: (c) => `<polygon fill="${c}" points="${pts(4, 20, 20, 18, 3.5)}"/><polygon fill="${c}" opacity="0.6" points="${pts(4, 20, 20, 11, 3, -Math.PI / 4)}"/>` + ojo(20, 20, 2.2),
  brujula: (c) => `<circle cx="20" cy="20" r="16" fill="none" stroke="${c}" stroke-width="3"/><polygon fill="${c}" points="20,6 24,20 20,34 16,20"/>` + ojo(20, 20, 2),
  estrella: (c) => `<polygon fill="${c}" points="${pts(5, 20, 21, 18, 7.5)}"/>`,
  estrella_nautica: (c) => `<polygon fill="${c}" points="${pts(8, 20, 20, 18, 7)}"/><circle cx="20" cy="20" r="4" fill="#000" opacity="0.35"/>`,
  corona: (c) => `<path fill="${c}" d="M4 30 L6 12 L13 20 L20 8 L27 20 L34 12 L36 30Z"/><rect x="4" y="31" width="32" height="5" rx="1.5" fill="${c}"/><circle cx="20" cy="7" r="2.5" fill="${c}"/><circle cx="6" cy="11" r="2" fill="${c}"/><circle cx="34" cy="11" r="2" fill="${c}"/>`,
  ballena: (c) => `<path fill="${c}" d="M3 22c0-7 7-12 16-12 8 0 13 4 15 9l3-6c2 0 3 1 2 3l-3 6 4 3c1 1 0 2-1 2l-5-2c-3 5-9 7-16 7C10 32 3 28 3 22Z"/>` + ojo(12, 20) + trazo(c, 2, 'M14 9c0-3 1-5 3-6 M14 9c0-3-1-5-3-6'),
  tiburon: (c) => `<path fill="${c}" d="M2 24 C8 18 16 16 22 17 L25 6 L29 17 C33 18 36 20 38 22 L33 25 C26 29 14 30 2 24Z M34 21 L39 15 L38 25Z"/>` + ojo(30, 21, 1.4),
  delfin: (c) => `<path fill="${c}" d="M5 30 C6 18 16 9 28 9 L33 5 L33 11 C36 13 37 15 38 17 L33 17 C30 22 22 22 17 24 L20 30 L13 26 C10 28 8 31 5 30Z"/>` + ojo(30, 13, 1.3),
  pez: (c) => `<path fill="${c}" d="M4 20 C10 10 24 9 30 18 L37 11 L35 20 L37 29 L30 22 C24 31 10 30 4 20Z"/>` + ojo(12, 18),
  caballito: (c) => `<path fill="${c}" d="M22 3 C28 3 30 8 27 12 L31 13 L27 16 C30 22 28 28 23 31 C20 33 20 36 23 37 C17 38 15 33 18 29 C21 26 21 21 18 18 C15 15 15 9 18 6Z"/>` + ojo(24, 7, 1.3) + trazo(c, 2, 'M17 12 L13 10 M17 17 L13 17'),
  cangrejo: (c) => `<ellipse cx="20" cy="24" rx="11" ry="8" fill="${c}"/>` + trazo(c, 2.4, 'M10 22 L3 18 M10 26 L3 27 M11 29 L5 34 M30 22 L37 18 M30 26 L37 27 M29 29 L35 34 M14 17 L9 9 M26 17 L31 9') + `<path fill="${c}" d="M5 4 C2 7 4 12 9 11 L10 6Z M35 4 C38 7 36 12 31 11 L30 6Z"/>`,
  tortuga: (c) => `<ellipse cx="20" cy="22" rx="12" ry="10" fill="${c}"/><circle cx="20" cy="8" r="4" fill="${c}"/><ellipse cx="7" cy="14" rx="4" ry="2.5" fill="${c}"/><ellipse cx="33" cy="14" rx="4" ry="2.5" fill="${c}"/><ellipse cx="8" cy="31" rx="4" ry="2.5" fill="${c}"/><ellipse cx="32" cy="31" rx="4" ry="2.5" fill="${c}"/>` + `<path d="M20 14 L26 19 L24 27 H16 L14 19Z" fill="#000" opacity="0.25"/>`,
  gaviota: (c) => trazo(c, 3.6, 'M2 18 C8 10 14 12 20 20 C26 12 32 10 38 18'),
  ola: (c) => `<path fill="${c}" d="M2 34 C4 20 14 8 26 8 C34 8 38 14 36 20 C34 15 28 14 25 18 C22 22 26 26 30 25 C26 32 18 34 2 34Z"/>`,
  sol: (c) => `<circle cx="20" cy="20" r="8" fill="${c}"/>` + Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return trazo(c, 2.6, `M${(20 + Math.cos(a) * 11).toFixed(1)} ${(20 + Math.sin(a) * 11).toFixed(1)} L${(20 + Math.cos(a) * 17).toFixed(1)} ${(20 + Math.sin(a) * 17).toFixed(1)}`); }).join(''),
  luna: (c) => `<path fill="${c}" fill-rule="evenodd" d="M24 3 A17 17 0 1 0 37 28 A14 14 0 1 1 24 3Z"/>`,
  rayo: (c) => `<path fill="${c}" d="M23 2 L8 22 H18 L14 38 L32 15 H21 L27 2Z"/>`,
  cofre: (c) => `<path fill="${c}" d="M4 16 C4 9 10 6 20 6 C30 6 36 9 36 16Z"/><rect x="4" y="17" width="32" height="17" rx="1.5" fill="${c}"/><rect x="17" y="15" width="6" height="8" rx="1" fill="#000" opacity="0.4"/>`,
  moneda: (c) => `<circle cx="20" cy="20" r="16" fill="${c}"/><circle cx="20" cy="20" r="12" fill="none" stroke="#000" stroke-width="1.6" opacity="0.35"/><polygon points="${pts(5, 20, 20.5, 7, 3)}" fill="#000" opacity="0.35"/>`,
  barril: (c) => `<path fill="${c}" d="M10 4 H30 C34 12 34 28 30 36 H10 C6 28 6 12 10 4Z"/>` + trazo('#000', 1.6, 'M8 12 H32 M8 28 H32'),
  campana: (c) => `<path fill="${c}" d="M20 4 C12 4 10 12 10 20 C10 26 7 28 5 30 H35 C33 28 30 26 30 20 C30 12 28 4 20 4Z"/><circle cx="20" cy="34" r="3.5" fill="${c}"/><rect x="18" y="1" width="4" height="4" fill="${c}"/>`,
  garfio: (c) => trazo(c, 3.4, 'M20 2 V24 M20 24 C20 34 8 34 7 26 M20 24 C20 34 32 34 33 26 M20 24 C20 34 20 36 20 38') + `<circle cx="20" cy="4" r="3" fill="none" stroke="${c}" stroke-width="2.6"/>`,
  llave: (c) => `<circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="4"/>` + trazo(c, 4, 'M18 18 L36 36 M30 30 L34 26 M26 26 L30 22'),
  corazon: (c) => `<path fill="${c}" d="M20 36 C6 26 2 18 6 11 C10 5 17 6 20 12 C23 6 30 5 34 11 C38 18 34 26 20 36Z"/>`,
  aguila: (c) => `<path fill="${c}" d="M20 8 C17 8 16 11 17 13 L13 15 L2 8 C3 16 7 21 13 23 L16 30 L13 37 L20 33 L27 37 L24 30 L27 23 C33 21 37 16 38 8 L27 15 L23 13 C24 11 23 8 20 8Z"/><path fill="${c}" d="M20 8 L24 6 L22 10Z"/>`,
  leon: (c) => `<circle cx="20" cy="17" r="13" fill="${c}"/><circle cx="20" cy="19" r="8" fill="#000" opacity="0.25"/>` + ojo(17, 17, 1.4) + ojo(23, 17, 1.4) + `<path d="M17 23 Q20 26 23 23" fill="none" stroke="#000" stroke-width="1.5" opacity="0.5"/><path fill="${c}" d="M13 28 L11 38 H17 L18 30Z M27 28 L29 38 H23 L22 30Z"/>`,
};

// La bandera o el escudo completo. tam: alto en píxeles (la caja es cuadrada).
let n = 0;
export function emblemaSVG(e, tam = 60, titulo = '') {
  e = e || {};
  const color = (v, otro) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : otro);
  const forma = FORMAS[e.forma] ? e.forma : 'rectangular', d = FORMAS[forma];
  const patron = PATRONES[e.patron] || PATRONES.liso, simbolo = SIMBOLOS[e.simbolo] || SIMBOLOS.ancla;
  const fondo = color(e.fondo, '#1d3f6e'), cPatron = color(e.cPatron, '#ffd166'), cSimbolo = color(e.cSimbolo, '#ffd166'), cBorde = color(e.cBorde, '#0b1d33');
  const borde = [0, 4, 8, 13][Math.max(0, Math.min(3, +e.borde || 0))];
  const id = 'emb' + (++n);
  // el símbolo va en el centro (en las banderas, un poco corrido hacia el vuelo si hay franja en el asta)
  const k = forma === 'gallardete' ? 1.15 : ES_BANDERA(forma) ? 1.5 : 1.6;
  const cx = forma === 'gallardete' ? 44 : e.patron === 'asta' || e.patron === 'triangulo' ? 70 : 60;
  const cy = forma === 'estandarte' || forma === 'pendon' ? 50 : forma.startsWith('escudo') ? 56 : 60;
  const cuerpo = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})"><path d="${d}" fill="${fondo}"/>${patron(cPatron)}`
    + `<g transform="translate(${cx - 20 * k} ${cy - 20 * k}) scale(${k})">${simbolo(cSimbolo)}</g>`
    + (borde ? `<path d="${d}" fill="none" stroke="${cBorde}" stroke-width="${borde * 2}"/>` : '') + `</g>`
    + `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>`;
  return `<svg class="emblema" viewBox="0 0 120 120" width="${tam}" height="${tam}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>`;
}

// Un emblema al azar (para empezar el editor con algo lindo)
export function emblemaAlAzar() {
  const de = (o) => { const ks = Array.isArray(o) ? o : Object.keys(o); return ks[Math.floor(Math.random() * ks.length)]; };
  const oscuros = ['#0b1d33', '#1d3f6e', '#8a1c1c', '#0e6b5c', '#2b2b2b', '#3d1a6e', '#5b0f1a', '#3b220e'], claros = ['#ffd166', '#f3ead2', '#ffffff', '#c0c6cc', '#7ec8e3', '#ff8a3d'];
  return { forma: de(FORMAS), fondo: de(oscuros), patron: de(PATRONES), cPatron: de(claros), simbolo: de(SIMBOLOS), cSimbolo: de(claros), borde: '2', cBorde: '#0b1d33' };
}
