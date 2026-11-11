// Otomanos, tercera tanda: quedan la Kalyata y el Kalyon elegidos; los tres bergantines mantienen la forma,
// ahora todos con remos y con una talla en la proa (Zulfikar, media luna y halcón).
import { dis, la, remos, espolon, mitad } from './motor.js';
import { enVela, mediaLuna, tresLunas, zulfikar, farol } from './emblemas.js';
import { cupula } from './emblemas2.js';
import { zulfikarProa, lunaTalla, aguilaTalla } from './emblemas3.js';

const ROJA = { casco: '#4a1a12', borda: '#a3262a', franja: '#e8c24a', franja2: '#4a1a12', oro: '#f0c75a', porta: '#f0c75a', cubierta: '#c29560', cubiertaAlta: '#d2a872', galeria: '#a3262a' };
const VERDE = { casco: '#16332b', borda: '#1f6f5c', franja: '#e8c24a', franja2: '#16332b', oro: '#f0c75a', porta: '#f0c75a', cubierta: '#c29560', cubiertaAlta: '#d2a872', galeria: '#1f6f5c' };
const NEGRA = { casco: '#17130f', borda: '#2c241c', franja: '#e8c24a', franja2: '#a3262a', oro: '#f0c75a', porta: '#a3262a', cubierta: '#b88a58', cubiertaAlta: '#c89c68', galeria: '#2c241c' };
const BLANCA = { casco: '#3a2a1a', borda: '#efe6d0', franja: '#a3262a', franja2: '#1f6f5c', oro: '#f0c75a', porta: '#a3262a', cubierta: '#c29560', cubiertaAlta: '#d2a872', galeria: '#a3262a' };
const V_ROJA = '#b3262a', V_VERDE = '#1f7a62', V_CRUDA = '#efe6d0';
const LUNA_ORO = enVela(mediaLuna, '#f0c75a'), LUNA_BLANCA = enVela(mediaLuna, '#f4f1e8'), LUNA_ROJA = enVela(mediaLuna, '#b3262a');
const GALERA = { tr: .26, forma: { pr: .15, xm: -.04 }, kd: [.93, .72], ancho: 1.0, bauprés: 0, foques: 0, timon: false, galeria: 0, spritsail: false, catheads: false, popaAlta: undefined, proaAlta: undefined, items: [], relinga: 'rgba(240,199,90,.75)' };
const faroles = (n) => (ctx, c) => { const { L, W } = c; for (let i = 0; i < n; i++) farol(ctx, -L * .5 - W * .06, (i - (n - 1) / 2) * W * .22, W * .06); };
function crujia(ctx, c, x0, x1, n) {
  const { L, W } = c;
  ctx.strokeStyle = 'rgba(60,35,12,.5)'; ctx.lineWidth = .6;
  for (let i = 0; i < n; i++) { const x = L * (x0 + ((x1 - x0) * i) / (n - 1)), h = mitad(c, x) * .68; ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, h); ctx.stroke(); }
  ctx.fillStyle = '#a3262a'; ctx.fillRect(L * x0 - 2, -W * .05, L * (x1 - x0) + 4, W * .1);
  ctx.strokeStyle = '#f0c75a'; ctx.lineWidth = .4; ctx.strokeRect(L * x0 - 2, -W * .05, L * (x1 - x0) + 4, W * .1);
}
const quiosco = (ctx, c, x, r, cup, base) => {
  const { L, W } = c;
  ctx.fillStyle = base; ctx.strokeStyle = '#f0c75a'; ctx.lineWidth = .5; ctx.fillRect(L * x - W * r * 1.5, -W * r * 1.25, W * r * 3, W * r * 2.5); ctx.strokeRect(L * x - W * r * 1.5, -W * r * 1.25, W * r * 3, W * r * 2.5);
  cupula(ctx, L * x, 0, W * r, cup, base);
};

export const OTOMANOS = {
  nombre: 'Otomanos', faccion: 'otomanos', resumen: 'Tus elegidos (Kalyata y Kalyon) y los tres bergantines con la misma forma, ahora con remos y una talla en la proa.',
  balandra: [
    dis('balandra', 'Kalyata (galeota)', 'Tu elegida, sin cambios: casco verde y oro, dos latinas verdes con la media luna dorada y espolón largo.', {
      ...GALERA, E: VERDE, palos: [la(-.12, .95, -1, { emb: false }), la(.18, 1.2, 1)], principal: 1, vela: V_VERDE, px: [-.12, .22], emblema: LUNA_ORO,
      bajo: (ctx, c) => { remos(ctx, c, 8, .4, -.24, .26); espolon(ctx, c, .15, '#f0c75a'); },
      sobre: (ctx, c) => { crujia(ctx, c, -.22, .3, 9); quiosco(ctx, c, -.37, .13, '#f0c75a', '#16332b'); },
      mascaron: null,
    }),
  ],
  bergantin: [
    dis('bergantin', 'Kadırga', 'La galera de línea del sultán. Misma forma, ahora con el Zulfikar (el sable de dos puntas) acostado sobre la proa, como la espada del bergantín francés.', {
      ...GALERA, E: ROJA, palos: [la(-.1, 1.05, -1, { emb: false }), la(.2, 1.3, 1)], principal: 1, vela: V_ROJA, px: [-.14, .22], emblema: LUNA_BLANCA,
      bajo: (ctx, c) => { remos(ctx, c, 12, .42, -.26, .27); },
      sobre: (ctx, c) => { crujia(ctx, c, -.24, .28, 13); quiosco(ctx, c, -.39, .12, '#f0c75a', '#7a1a1e'); },
      popa: faroles(1), mascaron: zulfikarProa(), rm: .13, mo: 1.2,
    }),
    dis('bergantin', 'Jabeque berberisco', 'El şebek de los corsarios de Argel. Misma forma, ahora con remos y una media luna dorada tallada, con su estrella, en la punta de la proa.', {
      E: BLANCA, forma: { xm: -.04, pr: .1 }, tr: .42, ancho: 1.06, bauprés: 0, foques: 0, galeria: 1, popaAlta: -.26, vela: V_CRUDA, relinga: 'rgba(163,38,42,.6)',
      palos: [la(-.28, .95, -1, { emb: false }), la(.0, 1.3, 1), la(.27, 1.05, -1, { emb: false })], principal: 1, emblema: LUNA_ROJA,
      bajo: (ctx, c) => { remos(ctx, c, 9, .4, -.24, .26); espolon(ctx, c, .1, '#a3262a'); },
      sobre: (ctx, c) => cupula(ctx, -c.L * .37, 0, c.W * .12, '#f0c75a', '#a3262a'), popa: faroles(1),
      mascaron: lunaTalla(), rm: .15, mo: -.3, items: [{ t: 'escotilla', x: .12, w: .18, h: .14 }],
    }),
    dis('bergantin', 'Galeota de Barbarroja', 'La nave de Hayreddin Barbarroja. Misma forma, con un halcón dorado en la proa. El halcón es propuesta mía: no encontré qué llevaban sus galeras en la proa.', {
      ...GALERA, E: NEGRA, palos: [la(-.1, 1.05, -1, { emb: false }), la(.2, 1.3, 1)], principal: 1, vela: V_VERDE, px: [-.14, .22],
      emblema: enVela(zulfikar, '#f4f1e8', '#f0c75a'),
      bajo: (ctx, c) => { remos(ctx, c, 10, .42, -.24, .26); },
      sobre: (ctx, c) => { crujia(ctx, c, -.22, .28, 11); quiosco(ctx, c, -.39, .12, '#1f7a62', '#17130f'); },
      popa: faroles(1), mascaron: aguilaTalla('#e8c24a', '#f4f1e8', false, '#8a6410'), rm: .15, mo: .1,
    }),
  ],
  galeon: [
    dis('galeon', 'Kalyon', 'Tu elegido. Solo cambié el remate de la proa: la media luna ahora es una talla dorada con su estrella, y saqué las velas de abajo.', {
      E: NEGRA, vela: V_ROJA, emblema: enVela(tresLunas, '#f0c75a'), relinga: 'rgba(240,199,90,.75)',
      sobre: (ctx, c) => cupula(ctx, -c.L * .4, 0, c.W * .13, '#f0c75a', '#a3262a'), popa: faroles(3),
      mascaron: lunaTalla(), rm: .15, mo: -.4,
    }),
  ],
};
