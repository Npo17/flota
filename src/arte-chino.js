// Propuestas para los chinos: los juncos de la dinastía Ming (1400-1644), de las flotas de Zheng He a las de Qi Jiguang contra los wokou.
// Proa chata, velas de estera con sables de bambú, casetas con tejado, rojo, negro, verde y oro.
import { dis, ju, remos, caseta, castillo, pavesada, timonPopa, TAU } from './arte-motor.js';
import { banderines, farolesRojos } from './arte-emblemas3.js';
import { enVela, enProa, taiji, ming, fenix } from './arte-emblemas.js';
import { tigreSerio, dragonSerio } from './arte-emblemas4.js';

const ROJO = { casco: '#4a1f14', borda: '#b3261e', franja: '#e0b83e', franja2: '#15151a', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#c49a62', cubiertaAlta: '#d2aa74' };
const VERDE = { casco: '#2a2018', borda: '#2f6a45', franja: '#b3261e', franja2: '#f4f1e8', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#c49a62', cubiertaAlta: '#d2aa74' };
const HIERRO = { casco: '#221812', borda: '#3a2a20', franja: '#b3261e', oro: '#d9b27a', porta: '#b3261e', cubierta: '#b88a55', cubiertaAlta: '#c89c68' };
const ARENA = { casco: '#5a3f22', borda: '#7a5a34', franja: '#f4f1e8', franja2: '#15151a', oro: '#d9b27a', porta: '#d9b27a', cubierta: '#cba56c', cubiertaAlta: '#d8b680' };
const OCRE = '#c9925a', TEJA = '#8f3a22', TEJA_VERDE = '#2f6a45';
// lo común a todo junco: proa y popa chatas, sin bauprés, timón grande a popa
const JUNCO = { forma: { bw: .4, u: .5, xm: -.12, pr: .03 }, tr: .76, bauprés: 0, foques: 0, galeria: 0, spritsail: false, catheads: false, timon: false, popaAlta: undefined, proaAlta: undefined, plataforma: false, relinga: 'rgba(40,20,5,.5)' };
// espejo de popa pintado, con su emblema, y la pala del timón
const espejo = (fn, ...a) => (ctx, c) => {
  const { L, W } = c, h = W * c.tr * .44;
  timonPopa(ctx, c, .07); farolesRojos(ctx, c, 2);
  ctx.fillStyle = '#f4f1e8'; ctx.strokeStyle = '#15151a'; ctx.lineWidth = .6; ctx.fillRect(-L * .5 - W * .07, -h, W * .11, 2 * h); ctx.strokeRect(-L * .5 - W * .07, -h, W * .11, 2 * h);
  ctx.save(); ctx.translate(-L * .5 - W * .015, 0); ctx.rotate(Math.PI / 2); ctx.scale(W * .05, W * .05); fn(ctx, ...a); ctx.restore();
};

export const CHINOS = {
  nombre: 'Chinos', faccion: 'chinos', resumen: 'Cuarta tanda: el tigre y el dragón rehechos con las mismas reglas del león británico y el dragón portugués (dos o tres tonos, contorno fino, ojos chicos y rasgados).',
  balandra: [
    dis('balandra', 'Shachuan (barco de arena)', 'El junco de fondo chato del norte, hecho para los bancos de arena del Yangtsé y el mar Amarillo. Bajo, largo y con dos velas de estera color ocre.', {
      ...JUNCO, E: ARENA, forma: { bw: .5, u: .6, xm: -.1, pr: .03 }, tr: .8, palos: [ju(-.16, .5, .34, -.5), ju(.16, .62, .4, .45)], principal: 1, vela: OCRE,
      sobre: (ctx, c) => { caseta(ctx, c, -.46, -.3, .3, { pared: '#d8c8a0', techo: '#7a5a34' }); },
      popa: (ctx, c) => timonPopa(ctx, c, .07), mascaron: null,
    }),
    dis('balandra', 'Niaochuan (barco pájaro)', 'El junco veloz de Zhejiang: la proa en punta se pinta como la cabeza de un pájaro, Dos velas rojizas y casco verde y rojo.', {
      ...JUNCO, E: VERDE, forma: { u: .15, xm: -.1, pr: .03 }, tr: .7, palos: [ju(-.18, .5, .34, -.5), ju(.12, .66, .42, .45)], principal: 1,
      sobre: (ctx, c) => {
        const { L, W } = c; caseta(ctx, c, -.46, -.28, .3, { pared: '#e8dcc0', techo: TEJA_VERDE });
        ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.moveTo(L * .5, 0); ctx.lineTo(L * .4, -W * .17); ctx.lineTo(L * .4, W * .17); ctx.closePath(); ctx.fill(); // el pico
       
      },
      popa: espejo(fenix), mascaron: null,
    }),
    dis('balandra', 'Wugongchuan (barco ciempiés)', 'El "ciempiés": copiado hacia 1525 de las galeras portuguesas, con muchos remos por banda y cañones de retrocarga. Largo, fino y rapidísimo.', {
      ...JUNCO, E: HIERRO, forma: { bw: .22, u: .2, xm: -.06, pr: .05 }, tr: .5, ancho: 1.0, palos: [ju(.1, .56, .36, .4)], px: [-.18, .22],
      bajo: (ctx, c) => remos(ctx, c, 9, .42, -.3, .3),
      sobre: (ctx, c) => { caseta(ctx, c, -.46, -.32, .26, { pared: '#d8c8a0', techo: TEJA }); },
      popa: (ctx, c) => timonPopa(ctx, c, .06), mascaron: null,
    }),
  ],
  bergantin: [
    dis('bergantin', 'Fuchuan (junco de Fujian)', 'El junco de guerra de alta mar de los Ming: un tigre tallado asomado por la proa, caseta de popa con tejado y el fénix pintado en el espejo.', {
      ...JUNCO, E: ROJO, palos: [ju(-.28, .5, .32, -.5), ju(-.02, .8, .5, .42), ju(.26, .56, .36, -.45)], principal: 1,
      sobre: (ctx, c) => { caseta(ctx, c, -.47, -.24, .33, { pared: '#e8dcc0', techo: TEJA }); pavesada(ctx, c, 6, ['#b3261e', '#e0b83e'], -.18, .26); banderines(ctx, c, -.2, .3, ['#b3261e', '#f2c230']); },
      popa: espejo(fenix), mascaron: tigreSerio(), rm: .25, mo: .5,
      items: [{ t: 'escotilla', x: .1, w: .18, h: .14 }],
    }),
    dis('bergantin', 'Guangchuan (junco de Cantón)', 'El junco de Guangdong, de madera de hierro: más pesado y duro que el de Fujian, capaz de embestir. Casco oscuro, velas ocres en abanico, un dragón verde en la proa y el yin y yang en la vela.', {
      ...JUNCO, E: HIERRO, forma: { bw: .34, u: .55, xm: -.12, pr: .03 }, ancho: 1.2, palos: [ju(-.26, .52, .34, -.55), ju(.0, .82, .52, .5), ju(.27, .56, .36, -.5)], principal: 1, vela: OCRE,
      sobre: (ctx, c) => { caseta(ctx, c, -.47, -.26, .34, { pared: '#3a2a20', techo: '#4a4a52' }); banderines(ctx, c, -.2, .3, ['#15151a', '#b3261e']); },
      popa: espejo(taiji), emblema: enVela(taiji), mascaron: dragonSerio('#1f7a4a', '#124a2b'), rm: .24, mo: .5,
      items: [{ t: 'escotilla', x: .12, w: .18, h: .14 }],
    }),
    dis('bergantin', 'Cangshan (remo y vela)', 'El barco con el que el general Qi Jiguang corrió a los piratas wokou hacia 1560: anda a vela o a remo, lleva escudos de bambú en la borda y un tigre blanco en la proa.', {
      ...JUNCO, E: VERDE, forma: { bw: .28, u: .3, xm: -.08, pr: .04 }, tr: .6, ancho: 1.04, palos: [ju(-.14, .62, .4, -.45), ju(.2, .7, .44, .42)], principal: 1, px: [-.14, .26],
      bajo: (ctx, c) => remos(ctx, c, 6, .42, -.24, .26),
      sobre: (ctx, c) => { caseta(ctx, c, -.46, -.28, .3, { pared: '#e8dcc0', techo: TEJA_VERDE }); pavesada(ctx, c, 8, ['#c9a85a', '#8a6a3a'], -.24, .28); },
      popa: espejo(fenix, '#2f6a45'), mascaron: tigreSerio(), rm: .25, mo: .5,
    }),
  ],
  galeon: [
    dis('galeon', 'Baochuan (barco del tesoro)', 'Las naves gigantes con las que el almirante Zheng He llegó hasta África (1405-1433). Cinco palos, casetas de tejado rojo, un dragón dorado imperial en la proa y el sello de los Ming en la vela mayor.', {
      ...JUNCO, E: ROJO, ancho: 1.24, forma: { bw: .42, u: .55, xm: -.12, pr: .03 }, px: [-.16, .26],
      palos: [ju(-.36, .46, .3, -.5, { emb: false }), ju(-.18, .66, .42, .45, { emb: false }), ju(.02, .84, .52, -.42), ju(.21, .66, .42, .45, { emb: false }), ju(.37, .44, .28, -.5, { emb: false })], principal: 2,
      sobre: (ctx, c) => { caseta(ctx, c, -.48, -.3, .36, { pared: '#e8dcc0', techo: TEJA }); caseta(ctx, c, -.44, -.36, .2, { pared: '#e8dcc0', techo: '#e0b83e' }); },
      popa: espejo(fenix), emblema: enVela(ming), mascaron: dragonSerio('#d9a441', '#6a4812', '#f6e3a0'), rm: .24, mo: .5,
      items: [{ t: 'escotilla', x: -.1, w: .16, h: .13 }, { t: 'bote', x: .11 }, { t: 'fardos', x: .29 }],
    }),
    dis('galeon', 'Gran Fuchuan de guerra', 'El "barco fuerte" de cuatro cubiertas que describen los manuales militares Ming: castillo alto a popa, el tigre en la proa y la borda llena de escudos.', {
      ...JUNCO, E: VERDE, ancho: 1.22, palos: [ju(-.24, .56, .36, -.5), ju(.02, .86, .54, .42), ju(.28, .6, .38, -.45)], principal: 1,
      sobre: (ctx, c) => { castillo(ctx, c, -.48, -.2, .36, null, '#b3261e'); caseta(ctx, c, -.45, -.27, .26, { pared: '#e8dcc0', techo: TEJA_VERDE }); pavesada(ctx, c, 8, ['#b3261e', '#e0b83e', '#2f6a45'], -.16, .3); },
      popa: espejo(fenix), mascaron: tigreSerio(), rm: .25, mo: .5,
      items: [{ t: 'escotilla', x: .12, w: .18, h: .14 }, { t: 'cabrestante', x: .3 }],
    }),
    dis('galeon', 'Louchuan (barco torre)', 'La fortaleza flotante de la tradición china: una torre de varios pisos en el medio, con almenas, para tirar desde arriba. En época Ming era ya un barco de mando y de río. Dragón rojo en la proa.', {
      ...JUNCO, E: HIERRO, ancho: 1.24, forma: { bw: .5, u: .6, xm: -.1, pr: .03 }, tr: .8, palos: [ju(-.33, .6, .38, -.5), ju(.31, .64, .4, .45)], principal: 1, vela: OCRE, px: [-.2, .2],
      sobre: (ctx, c) => {
        const { L, W } = c;
        castillo(ctx, c, -.22, .2, .36, '#c89c68', '#b3261e'); castillo(ctx, c, -.15, .13, .27, '#d2aa74', '#b3261e');
        caseta(ctx, c, -.09, .07, .19, { pared: '#e8dcc0', techo: TEJA });
        ctx.fillStyle = '#e0b83e'; ctx.beginPath(); ctx.arc(-L * .01, 0, W * .035, 0, TAU); ctx.fill();
       
      },
      popa: espejo(taiji), mascaron: dragonSerio('#a3261e', '#5a120e'), rm: .24, mo: .5,
      items: [],
    }),
  ],
};
