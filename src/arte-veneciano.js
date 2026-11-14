// Venecianos: las naves de remo de la Serenísima. Rojo veneciano y oro, velas latinas a rayas rojas y blancas, carroza de
// popa con toldo, fanal dorado y el león (de San Marcos) en la vela mayor y en la proa de la galeaza.
// Una propuesta por casco: fusta (chica y rápida), galea sottile (la galera de línea) y la galeaza de Lepanto (1571),
// la fortaleza de remo con castillo redondo a proa que rompió la línea otomana.
import { dis, la, remos, espolon, bancos, toldo, castillo } from './arte-motor.js';
import { enVela, leonRampante, leonProa, farol } from './arte-emblemas.js';

const ROJO = { casco: '#3d1010', borda: '#8f1d1d', franja: '#e8c24a', franja2: '#3d1010', oro: '#f0c75a', porta: '#f0c75a', cubierta: '#c29560', cubiertaAlta: '#d2a872', galeria: '#8f1d1d' };
const NEGRO = { casco: '#17110d', borda: '#7a1a1a', franja: '#e8c24a', franja2: '#17110d', oro: '#f0c75a', porta: '#f0c75a', cubierta: '#bd9060', cubiertaAlta: '#cfa570', galeria: '#7a1a1a' };
const TELA = '#f1e9d2', RAYAS = ['#a3161a', 8], LEON = enVela(leonRampante, '#e8c24a', '#8a6410');
const GALERA = { tr: .26, forma: { pr: .15, xm: -.04 }, kd: [.93, .72], ancho: 1.0, bauprés: 0, foques: 0, timon: false, galeria: 0, spritsail: false, catheads: false, popaAlta: undefined, proaAlta: undefined, items: [], relinga: 'rgba(232,194,74,.8)' };
const fanales = (n) => (ctx, c) => { const { L, W } = c; for (let i = 0; i < n; i++) farol(ctx, -L * .5 - W * .06, (i - (n - 1) / 2) * W * .22, W * .065); };
const TOLDO = ['#a3161a', '#f1e9d2'];

export const VENECIANOS = {
  nombre: 'Venecianos', faccion: 'venecianos', resumen: 'Tres naves de remo de la Serenísima: fusta, galea sottile y la galeaza de Lepanto.',
  balandra: [
    dis('balandra', 'Fusta', 'La galera chica de exploración y corso: una sola latina a rayas, espolón dorado y toldo de popa.', {
      ...GALERA, E: ROJO, palos: [la(.12, 1.25, 1)], principal: 0, vela: TELA, rayas: RAYAS, px: [-.1, .2], emblema: null,
      bajo: (ctx, c) => { remos(ctx, c, 8, .4, -.24, .26); espolon(ctx, c, .14, '#f0c75a'); },
      sobre: (ctx, c) => { bancos(ctx, c, -.2, .3, 9); toldo(ctx, c, -.46, -.26, .3, TOLDO); },
      popa: fanales(1), mascaron: null,
    }),
  ],
  bergantin: [
    dis('bergantin', 'Galea sottile', 'La galera de línea del Arsenal: dos latinas a rayas con el león dorado en la mayor y carroza con toldo.', {
      ...GALERA, E: ROJO, palos: [la(-.12, 1.0, -1, { emb: false }), la(.18, 1.3, 1)], principal: 1, vela: TELA, rayas: RAYAS, px: [-.14, .22], emblema: LEON,
      bajo: (ctx, c) => { remos(ctx, c, 12, .42, -.26, .27); espolon(ctx, c, .13, '#f0c75a'); },
      sobre: (ctx, c) => { bancos(ctx, c, -.24, .3, 13); toldo(ctx, c, -.47, -.28, .3, TOLDO); },
      popa: fanales(1), mascaron: null,
    }),
  ],
  galeon: [
    dis('galeon', 'Galeaza de Lepanto (1571)', 'La fortaleza de remo: casco negro y rojo, castillo redondo artillado a proa, tres latinas a rayas con el león en la mayor, tres fanales y un león dorado en la proa.', {
      E: NEGRO, tr: .5, forma: { pr: .2, xm: -.02 }, kd: [.92, .74], ancho: 1.12, bauprés: 0, foques: 0, timon: false, galeria: 1, spritsail: false, catheads: false, popaAlta: -.3, proaAlta: undefined,
      relinga: 'rgba(232,194,74,.8)', vela: TELA, rayas: RAYAS, emblema: LEON, px: [-.2, .2], items: [],
      palos: [la(-.3, .95, -1, { emb: false }), la(-.02, 1.35, 1), la(.24, 1.05, -1, { emb: false })], principal: 1,
      bajo: (ctx, c) => { remos(ctx, c, 14, .4, -.28, .24); },
      sobre: (ctx, c) => {
        bancos(ctx, c, -.26, .22, 13);
        toldo(ctx, c, -.48, -.31, .34, TOLDO);
        castillo(ctx, c, .27, .41, .3, '#7a1a1a', '#e8c24a'); // el castillo de proa, con sus piezas
        const { L, W } = c;
        ctx.fillStyle = '#16161a'; for (const y of [-.2, 0, .2]) { ctx.fillRect(L * .39, y * W - 1.1, W * .16, 2.2); }
      },
      popa: fanales(3), mascaron: leonProa(), rm: .15, mo: .2,
    }),
  ],
};
