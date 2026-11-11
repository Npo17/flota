// Japoneses, tercera tanda: todo de nuevo y solo barcos japoneses (los de casco europeo y el del sello rojo quedaron afuera).
// Flotas de los señores de la guerra y del shogunato (1550-1640): casco de tablas de ciprés, cortina de guerra con el mon en la borda,
// caja con troneras, torres con tejado, laca negra y bermellón, vela grande con el mon del clan y estandartes en la popa.
import { dis, cu, remos, caseta, caja, empalizada, timonPopa, TAU } from './motor.js';
import { enVela, enProa, solRojo, monMokko, monAoi, monTomoe, monMurakami } from './emblemas.js';
import { jinmaku, ryuProa } from './emblemas3.js';

const CIPRES = { casco: '#4a3420', borda: '#6a4c2c', franja: '#15151a', oro: '#d9b27a', porta: '#15151a', cubierta: '#c9a36a', cubiertaAlta: '#d7b77e', filo: '#15100a' };
const LACA_NEGRA = { casco: '#15151a', borda: '#26262c', franja: '#e0b83e', franja2: '#7a1f1f', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#c9a36a', cubiertaAlta: '#d7b77e' };
const BERMELLON = { casco: '#5a1612', borda: '#b3261e', franja: '#e0b83e', franja2: '#15151a', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#c9a36a', cubiertaAlta: '#d7b77e' };
const HIERRO = { casco: '#17191d', borda: '#2b2f36', franja: '#4a505a', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#8a8f98', cubiertaAlta: '#a0a5ad' };
const COBRE = { casco: '#1f3a33', borda: '#3f6b5a', franja: '#e0b83e', franja2: '#7a1f1f', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#c9a36a', cubiertaAlta: '#d7b77e' };
const TABLA = '#b08a58', TABLA_OSC = '#6a4c2c', CHAPA = '#2b2f36', TEJA = '#4a4f58', NEGRO = '#15151a';
const WASEN = { forma: { u: .05, xm: -.14, pr: .03 }, tr: .66, bauprés: 0, foques: 0, galeria: 0, spritsail: false, catheads: false, timon: false, popaAlta: undefined, proaAlta: undefined, items: [] };
const ATAKE = { ...WASEN, ancho: 1.22, forma: { bw: .46, u: .7, xm: -.1, pr: .03 }, tr: .78, px: [-.22, .26] };
// estandartes verticales (nobori) clavados en la popa
const nobori = (cols) => (ctx, c) => {
  const { L, W } = c; timonPopa(ctx, c, .06);
  cols.forEach((col, i) => { const y = (i - (cols.length - 1) / 2) * W * .22; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-L * .5 - W * .24 + 1, y - W * .04 + 1.4, W * .3, W * .08); ctx.fillStyle = col; ctx.fillRect(-L * .5 - W * .24, y - W * .04, W * .3, W * .08); ctx.strokeStyle = NEGRO; ctx.lineWidth = .3; ctx.strokeRect(-L * .5 - W * .24, y - W * .04, W * .3, W * .08); ctx.fillStyle = NEGRO; ctx.beginPath(); ctx.arc(-L * .5 - W * .1, y, W * .022, 0, TAU); ctx.fill(); });
};
// torre de mando (tenshu): tejados uno sobre otro, con la cumbrera dorada
const tenshu = (ctx, c, x, k = 1, techo = TEJA) => { caseta(ctx, c, x - .1 * k, x + .1 * k, .31 * k, { pared: '#f4f1e8', techo }); caseta(ctx, c, x - .065 * k, x + .065 * k, .2 * k, { pared: '#f4f1e8', techo, cumbrera: '#e0b83e' }); caseta(ctx, c, x - .035 * k, x + .035 * k, .1 * k, { pared: '#f4f1e8', techo, cumbrera: '#e0b83e', tejas: false }); };
// remate de la roda: el poste negro de proa con la borla roja (sagari)
const sagari = (ctx, r) => {
  ctx.fillStyle = NEGRO; ctx.fillRect(-r * .2, -r * .16, r * 1.5, r * .32); ctx.fillStyle = '#e0b83e'; ctx.fillRect(r * .3, -r * .2, r * .22, r * .4); ctx.fillRect(r * .95, -r * .2, r * .22, r * .4);
  ctx.strokeStyle = '#c8102e'; ctx.lineWidth = r * .1; ctx.lineCap = 'round'; for (const k of [-.5, -.25, 0, .25, .5]) { ctx.beginPath(); ctx.moveTo(r * 1.3, 0); ctx.lineTo(r * 1.95, k * r * .7); ctx.stroke(); }
};
// una barra sobre tres estrellas: el mon de los Mōri
const monMori = (ctx, col = NEGRO) => { ctx.fillStyle = col; ctx.fillRect(-.75, -.75, 1.5, .26); for (const [x, y] of [[0, -.12], [-.42, .52], [.42, .52]]) { ctx.beginPath(); ctx.arc(x, y, .3, 0, TAU); ctx.fill(); } };
const VELA = (x, h = .92, b = .6) => [cu(x, [h, b])];

export const JAPONESES = {
  nombre: 'Japoneses', faccion: 'japoneses', resumen: 'Tercera tanda, todo nuevo y solo japonés: cortinas de guerra con el mon, cajas con troneras, torres con tejado, laca negra y bermellón.',
  balandra: [
    dis('balandra', 'Kobaya', 'El más chico y rápido de la flota de guerra, casi todo remos. Cortina blanca con el mon colgada de la borda, vela grande con las tres comas y la borla roja en la proa.', {
      ...WASEN, E: CIPRES, ancho: 1.0, palos: VELA(.1, .8, .54), px: [-.2, .16],
      bajo: (ctx, c) => remos(ctx, c, 7, .42, -.3, .24),
      sobre: (ctx, c) => jinmaku(ctx, c, -.4, .2), popa: nobori(['#f4f1e8', '#c8102e']),
      emblema: enVela(monTomoe), mascaron: sagari, rm: .1, mo: .4,
    }),
    dis('balandra', 'Hayabune de los Murakami', 'El "barco veloz" de los Murakami, los señores del mar Interior que cobraban peaje a quien pasara. Baranda oscura de tablas con troneras, vela de estera con su marca 上 y estandartes rojos.', {
      ...WASEN, E: CIPRES, palos: VELA(.08, .84, .56), vela: '#d9c08a', px: [-.2, .16],
      bajo: (ctx, c) => remos(ctx, c, 6, .4, -.28, .22),
      sobre: (ctx, c) => empalizada(ctx, c, -.38, .2, TABLA_OSC, true), popa: nobori(['#c8102e', '#c8102e', '#c8102e']),
      emblema: enVela(monMurakami), mascaron: sagari, rm: .1, mo: .4,
    }),
    dis('balandra', 'Gozabune', 'La barca de mando lacada en la que viajaba un daimio: bermellón y oro de punta a punta, con un pabellón de tejado negro y cortina con el mon de los Tokugawa.', {
      ...WASEN, E: BERMELLON, ancho: 1.08, palos: VELA(.2, .72, .48), px: [-.2, .1],
      bajo: (ctx, c) => remos(ctx, c, 6, .4, -.28, .22),
      sobre: (ctx, c) => { jinmaku(ctx, c, -.4, .26, '#f4f1e8', '#b3261e', '#e0b83e'); caseta(ctx, c, -.36, .02, .27, { pared: '#b3261e', techo: '#26262c', cumbrera: '#e0b83e' }); },
      popa: nobori(['#e0b83e', '#f4f1e8', '#e0b83e']), emblema: enVela(monAoi), mascaron: sagari, rm: .1, mo: .4,
    }),
  ],
  bergantin: [
    dis('bergantin', 'Sekibune de los Kuki', 'El barco de guerra mediano, el caballo de batalla de toda flota. Caja de tablas con troneras, cortina de guerra, muchos remos y un pabellón con tejado. Los Kuki fueron los almirantes de Nobunaga y de Hideyoshi.', {
      ...WASEN, E: CIPRES, ancho: 1.1, palos: VELA(.14), px: [-.2, .22],
      bajo: (ctx, c) => remos(ctx, c, 10, .44, -.32, .26),
      sobre: (ctx, c) => { caja(ctx, c, -.42, .22, .37, TABLA); jinmaku(ctx, c, -.42, .22); caseta(ctx, c, -.34, -.14, .24, { pared: '#f4f1e8', techo: TEJA, cumbrera: '#e0b83e' }); },
      popa: nobori(['#f4f1e8', NEGRO, '#f4f1e8']), emblema: enVela(monTomoe), mascaron: sagari, rm: .1, mo: .4,
    }),
    dis('bergantin', 'Sekibune de los Mōri', 'La flota de los Mōri dominó el mar Interior hasta que Nobunaga la venció con sus barcos de hierro. Laca negra con filete dorado, cortina roja y su mon: una barra sobre tres estrellas.', {
      ...WASEN, E: LACA_NEGRA, ancho: 1.1, palos: VELA(.14), px: [-.2, .22],
      bajo: (ctx, c) => remos(ctx, c, 10, .44, -.32, .26),
      sobre: (ctx, c) => { caja(ctx, c, -.42, .22, .37, '#3a3026'); jinmaku(ctx, c, -.42, .22, '#b3261e', '#f4f1e8', '#15151a'); caseta(ctx, c, -.34, -.14, .24, { pared: '#f4f1e8', techo: '#26262c', cumbrera: '#e0b83e' }); },
      popa: nobori(['#b3261e', '#f4f1e8', '#b3261e']), emblema: enVela(monMori), mascaron: sagari, rm: .1, mo: .4,
    }),
    dis('bergantin', 'Sekibune del shogun', 'El sekibune de la guardia naval de los Tokugawa (funate-gumi), que custodiaba la bahía de Edo. Bermellón y oro, cortina blanca con el mon y las hojas de malva en la vela.', {
      ...WASEN, E: BERMELLON, ancho: 1.1, palos: VELA(.14), px: [-.2, .22],
      bajo: (ctx, c) => remos(ctx, c, 10, .44, -.32, .26),
      sobre: (ctx, c) => { caja(ctx, c, -.42, .22, .37, '#8a2a20'); jinmaku(ctx, c, -.42, .22, '#f4f1e8', '#15151a', '#e0b83e'); tenshu(ctx, c, -.24, .8, '#26262c'); },
      popa: nobori(['#f4f1e8', '#e0b83e', '#f4f1e8']), emblema: enVela(monAoi), mascaron: sagari, rm: .1, mo: .4,
    }),
  ],
  galeon: [
    dis('galeon', 'Nihon Maru (1591)', 'El atakebune más famoso: el buque insignia que Kuki Yoshitaka construyó para la invasión de Corea de Hideyoshi. Caja enorme con troneras, torre de mando de tres tejados, cortinas de guerra y el sol rojo en la vela.', {
      ...ATAKE, E: CIPRES, palos: VELA(.24, .9, .58),
      bajo: (ctx, c) => remos(ctx, c, 14, .4, -.36, .3),
      sobre: (ctx, c) => { caja(ctx, c, -.46, .4, .4, TABLA); jinmaku(ctx, c, -.44, .36); tenshu(ctx, c, -.12, 1.15); },
      popa: nobori(['#f4f1e8', '#c8102e', '#f4f1e8', '#c8102e']), emblema: enVela(solRojo), mascaron: null,
    }),
    dis('galeon', 'Tekkōsen (1578)', 'Los seis atakebune que Oda Nobunaga mandó forrar con planchas de hierro para romper el bloqueo de los Mōri. Negro de punta a punta, con remaches, y el mon de los Oda en oro.', {
      ...ATAKE, E: HIERRO, palos: VELA(.24, .78, .5), vela: '#e8e2d0',
      bajo: (ctx, c) => remos(ctx, c, 14, .4, -.36, .3),
      sobre: (ctx, c) => {
        const { L, W } = c; caja(ctx, c, -.46, .4, .4, CHAPA, '#0a0b0d');
        ctx.fillStyle = '#6a707a'; for (let x = -.44; x < .4; x += .04) for (const y of [-.3, -.1, .1, .3]) { ctx.beginPath(); ctx.arc(L * x, W * y, .5, 0, TAU); ctx.fill(); }
        tenshu(ctx, c, -.12, 1.15, '#23262b');
      },
      popa: nobori(['#e0b83e', NEGRO, '#e0b83e']), emblema: enVela(monMokko), mascaron: enProa(monMokko, .8, '#e0b83e', NEGRO), rm: .15, mo: 1.6,
    }),
    dis('galeon', 'Atakemaru (1635)', 'El coloso que el shogun Tokugawa Iemitsu mandó construir: forrado en cobre, cubierto de oro y con una cabeza de dragón en la proa. Era tan grande que casi no se movía; lo propongo como la nave de prestigio.', {
      ...ATAKE, E: COBRE, palos: VELA(.24, .9, .58),
      bajo: (ctx, c) => remos(ctx, c, 16, .4, -.38, .3),
      sobre: (ctx, c) => { caja(ctx, c, -.46, .4, .4, '#3f6b5a', '#0f1f1a'); jinmaku(ctx, c, -.44, .36, '#f4f1e8', '#15151a', '#e0b83e'); tenshu(ctx, c, -.16, 1.2, '#26262c'); caseta(ctx, c, .1, .22, .22, { pared: '#b3261e', techo: '#26262c', cumbrera: '#e0b83e' }); },
      popa: nobori(['#e0b83e', '#f4f1e8', '#e0b83e', '#f4f1e8']), emblema: enVela(monAoi), mascaron: ryuProa(), rm: .2, mo: .2,
    }),
  ],
};
