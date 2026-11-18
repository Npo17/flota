// Insignias y emblemas (17/11/2026): todo se dibuja acá, en SVG, para que se vea igual en el HUD, el chat, los rankings,
// los perfiles y la pantalla del clan. Son dibujos propios (galones, anclas, estrellas, laureles), no imágenes bajadas.
//  - rangoSVG(i): los 13 rangos navales de las clasificatorias (0 = Grumete … 12 = Gran Almirante). Bronce para los
//    marineros, plata y azul para los guardiamarinas y oficiales, oro para los capitanes y almirantes, violeta para el top.
//  - cargoSVG(c): los 6 cargos dentro de un clan (1 = Almirante … 6 = Grumete), en forma de escudito para no confundirlos
//    con los rangos.
//  - Los emblemas de los clanes están en src/emblemas.js.

export const RANGOS = ['Grumete', 'Marinero', 'Cabo', 'Suboficial', 'Guardiamarina', 'Alférez', 'Teniente', 'Capitán de Corbeta',
  'Capitán de Fragata', 'Capitán de Navío', 'Contraalmirante', 'Almirante', 'Gran Almirante'];
export const CARGOS = ['', 'Almirante', 'Vicealmirante', 'Capitán', 'Teniente', 'Marinero', 'Grumete'];

const BRONCE = ['#c98b4f', '#7a4a22'], PLATA = ['#e3e8ee', '#8b98a6'], ORO = ['#ffd166', '#a8741a'], AZUL = '#1d3f6e', VIOLETA = ['#c9a4ff', '#5b2a9e'];
const svg = (vb, cuerpo, tam, titulo) => `<svg class="insignia" viewBox="${vb}" width="${tam}" height="${tam}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>`;
const grad = (id, [a, b]) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
let n = 0; // ids únicos para los degradados (puede haber muchas insignias en la misma página)

const estrella = (cx, cy, r, color) => {
  const p = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); }
  return `<polygon points="${p.join(' ')}" fill="${color}"/>`;
};
const galon = (y, alto, color) => `<rect x="14" y="${y}" width="36" height="${alto}" rx="1.5" fill="${color}"/>`;
const chevron = (y, color) => `<path d="M14 ${y} L32 ${y + 10} L50 ${y} L50 ${y + 6} L32 ${y + 16} L14 ${y + 6} Z" fill="${color}"/>`;
const anclaChica = (color) => `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="17" r="3.5"/><path d="M32 20.5V46 M24 26h16 M19 36c2 7 7 10 13 10s11-3 13-10"/></g>`;
const laurel = (color) => `<g fill="${color}">${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="${13 + k * 1.2}" cy="${50 - k * 7}" rx="2.6" ry="5" transform="rotate(${-30 + k * 8} ${13 + k * 1.2} ${50 - k * 7})"/><ellipse cx="${51 - k * 1.2}" cy="${50 - k * 7}" rx="2.6" ry="5" transform="rotate(${30 - k * 8} ${51 - k * 1.2} ${50 - k * 7})"/>`).join('')}</g>`;

// Rango de clasificatoria. i: 0 a 12. division: 1, 2 o 3 (los rangos de Teniente a Contraalmirante), se muestra en números romanos.
export function rangoSVG(i, tam = 28, division = 0) {
  i = Math.max(0, Math.min(12, i | 0));
  const id = 'rg' + (++n);
  const fondo = i <= 3 ? BRONCE : i <= 5 ? PLATA : i <= 11 ? ORO : VIOLETA;
  let marco, dentro = '';
  if (i <= 3) { // marineros: escudo de hombro redondeado, bronce, con galones en V
    marco = `<path d="M8 6h48v34c0 10-12 18-24 20C20 58 8 50 8 40Z" fill="url(#${id})" stroke="#3b220e" stroke-width="2"/>`;
    if (i === 0) dentro = `<circle cx="32" cy="30" r="6" fill="none" stroke="#3b220e" stroke-width="3"/>`; // un nudo
    for (let k = 0; k < i; k++) dentro += chevron(16 + k * 10, '#3b220e');
    if (i === 3) dentro += `<path d="M16 50 Q32 58 48 50" fill="none" stroke="#3b220e" stroke-width="4"/>`;
  } else if (i <= 5) { // guardiamarina y alférez: azul con borde de plata y el ancla
    marco = `<rect x="8" y="6" width="48" height="52" rx="8" fill="${AZUL}" stroke="url(#${id})" stroke-width="4"/>`;
    dentro = anclaChica('#e3e8ee') + (i === 5 ? galon(50, 4, '#ffd166') : '');
  } else if (i <= 9) { // tenientes y capitanes: galones dorados sobre azul (2, 3 con el del medio fino, 3, 4)
    marco = `<rect x="8" y="6" width="48" height="52" rx="8" fill="${AZUL}" stroke="url(#${id})" stroke-width="4"/>`;
    const filas = { 6: [6, 6], 7: [6, 3, 6], 8: [6, 6, 6], 9: [5, 5, 5, 5] }[i];
    const total = filas.reduce((a, b) => a + b, 0) + (filas.length - 1) * 4;
    let y = 36 - total / 2;
    for (const alto of filas) { dentro += galon(y, alto, `url(#${id})`); y += alto + 4; }
    dentro += estrella(32, 15, 5, '#ffd166');
  } else if (i <= 11) { // contraalmirante (1 estrella) y almirante (3): estrellas con laurel, todo oro
    marco = `<circle cx="32" cy="32" r="27" fill="${AZUL}" stroke="url(#${id})" stroke-width="4"/>`;
    dentro = laurel('#ffd166') + (i === 10 ? estrella(32, 30, 12, `url(#${id})`) : estrella(32, 20, 8, '#ffd166') + estrella(22, 36, 7, '#ffd166') + estrella(42, 36, 7, '#ffd166'));
  } else { // gran almirante: corona sobre cinco estrellas, violeta con oro
    marco = `<circle cx="32" cy="32" r="28" fill="#2a1450" stroke="url(#${id})" stroke-width="4"/><circle cx="32" cy="32" r="22" fill="none" stroke="#ffd166" stroke-width="1.5" opacity="0.7"/>`;
    dentro = `<path d="M18 30 L22 16 L28 25 L32 12 L36 25 L42 16 L46 30 Z" fill="#ffd166" stroke="#7a4a00" stroke-width="1"/>`
      + [0, 1, 2, 3, 4].map((k) => estrella(18 + k * 7, 42 + (k === 2 ? 0 : Math.abs(k - 2) * -1.5), 3.6, '#ffd166')).join('');
  }
  const num = division ? `<text x="54" y="60" font-size="15" font-weight="900" text-anchor="end" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" font-family="system-ui">${['', 'I', 'II', 'III'][division]}</text>` : '';
  return svg('0 0 64 64', grad(id, fondo) + marco + dentro + num, tam, RANGOS[i] + (division ? ' ' + ['', 'I', 'II', 'III'][division] : ''));
}

// Cargo dentro del clan: escudito con punta, color por altura (oro, plata, bronce) y estrellas o ancla.
export function cargoSVG(c, tam = 20) {
  c = Math.max(1, Math.min(6, c | 0));
  const id = 'cg' + (++n);
  const color = c <= 2 ? ORO : c <= 4 ? PLATA : BRONCE;
  const marco = `<path d="M6 4h52v30c0 14-14 24-26 28C20 58 6 48 6 34Z" fill="url(#${id})" stroke="#1b1b1b" stroke-width="2.5"/>`;
  let dentro = '';
  const estrellas = { 1: 4, 2: 3, 3: 2, 4: 1 }[c] || 0;
  if (c === 1) dentro = `<path d="M18 14 L22 6 L27 12 L32 4 L37 12 L42 6 L46 14 Z" fill="#7a4a00"/>`; // el Almirante, además, lleva corona
  for (let k = 0; k < estrellas; k++) {
    const fila = estrellas > 2 ? (k < 2 ? 0 : 1) : 0, enFila = estrellas > 2 ? (fila === 0 ? 2 : estrellas - 2) : estrellas, pos = estrellas > 2 ? (fila === 0 ? k : k - 2) : k;
    dentro += estrella(32 + (pos - (enFila - 1) / 2) * 15, 26 + fila * 15 + (c === 1 ? 2 : 0), 7, '#1b1b1b');
  }
  if (c === 5) dentro = anclaChica('#3b220e').replace('stroke-width="3"', 'stroke-width="4"');
  if (c === 6) dentro = `<circle cx="32" cy="28" r="9" fill="none" stroke="#3b220e" stroke-width="4"/><path d="M26 36 L22 46 M38 36 L42 46" stroke="#3b220e" stroke-width="4" stroke-linecap="round"/>`; // un nudo de cabo
  return svg('0 0 64 64', grad(id, color) + marco + dentro, tam, CARGOS[c]);
}

// El rango (0 a 12) y la división (0, 3, 2 o 1) que corresponden a un ELO. top10: si está entre los 10 mejores de la temporada.
export function rangoDeElo(elo, top10 = false) {
  const cortes = [900, 1000, 1100, 1200, 1300, 1400, 1550, 1700, 1850, 2000, 2200];
  let i = 0;
  while (i < cortes.length && elo >= cortes[i]) i++;
  if (i === 11 && top10) i = 12;
  let division = 0;
  if (i >= 6 && i <= 10) { // de Teniente a Contraalmirante: III, II, I
    const desde = cortes[i - 1], hasta = cortes[i], tercio = (hasta - desde) / 3;
    division = elo < desde + tercio ? 3 : elo < desde + 2 * tercio ? 2 : 1;
  }
  return { i, division };
}
