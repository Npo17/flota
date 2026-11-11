// Suecos, tercera tanda: quedan los tres elegidos por Cristian, con lo que pidió corregir.
import { dis, cu, la, remos, espolon, postiza, bancos, toldo, castillo } from './motor.js';
import { enVela, tresCoronas, gavilla } from './emblemas.js';
import { coronaTalla, cisneProa } from './emblemas3.js';

const AZUL = { casco: '#1f3157', borda: '#2b4580', franja: '#f2c230', oro: '#f2c230', porta: '#f2c230', cubierta: '#b98a52', cubiertaAlta: '#c99d62' };
const BREA = { casco: '#3a2416', borda: '#5a3a20', franja: '#f2c230', franja2: '#24478f', oro: '#e0b83e', porta: '#e0b83e', cubierta: '#b08450', cubiertaAlta: '#c2965c' };
const CAROLINO = { casco: '#17171a', borda: '#2a2a30', franja: '#e3b23c', franja2: '#17171a', oro: '#f2c230', porta: '#c8102e', galeria: '#1f3157', cubierta: '#b98a52', cubiertaAlta: '#caa066' };
const GALERA = {
  E: AZUL, ancho: .98, tr: .3, forma: { pr: .14, xm: -.02 }, kd: [.92, .7], bauprés: 0, foques: 0, timon: false, items: [],
  palos: [la(.08, .95, 1, { rayas: ['#24478f', 6] })], px: [-.16, .2],
  bajo: (ctx, c) => { postiza(ctx, c, -.3, .3, .08); remos(ctx, c, 7, .42, -.26, .26); espolon(ctx, c, .1); },
  sobre: (ctx, c) => { bancos(ctx, c, -.24, .3, 8); toldo(ctx, c, -.47, -.28, .3, ['#24478f', '#f2c230']); },
};

export const SUECOS = {
  nombre: 'Suecos', faccion: 'suecos', resumen: 'Tus tres elegidos, corregidos: la corona ahora es una talla vista desde arriba (no un ícono) y el cisne está rehecho.',
  balandra: [
    dis('balandra', 'Galera de Gustavo Vasa · con corona tallada', 'Tu elegida. La corona de la punta ahora es una talla dorada vista desde arriba: aro con florones, diademas y orbe.', { ...GALERA, mascaron: coronaTalla(), rm: .11, mo: 1.5 }),
    dis('balandra', 'Galera de Gustavo Vasa · sin corona', 'La misma galera con la proa limpia: solo el espolón dorado. Por si la corona sigue sin convencerte.', { ...GALERA, mascaron: null, bajo: (ctx, c) => { postiza(ctx, c, -.3, .3, .08); remos(ctx, c, 7, .42, -.26, .26); espolon(ctx, c, .14, '#f2c230'); } }),
  ],
  bergantin: [
    dis('bergantin', 'Lybska Svan (1522)', 'Tu elegido, con el cisne rehecho: cuerpo blanco con las alas plegadas y plumas marcadas, cuello largo en S y pico naranja.', {
      E: BREA, forma: { u: .45 }, palos: [la(-.34, .62, -1, { emb: false }), cu(-.04, [.74, .44], [.5, .33]), cu(.24, [.6, .36])], principal: 1, galeria: 0, popaAlta: undefined, foques: 1,
      sobre: (ctx, c) => { castillo(ctx, c, -.47, -.2, .3, null, '#24478f'); castillo(ctx, c, .28, .43, .2, null, '#24478f'); },
      emblema: enVela(gavilla), mascaron: cisneProa(), rm: .15, mo: 1.0,
      items: [{ t: 'escotilla', x: .1, w: .2, h: .16 }],
    }),
  ],
  galeon: [
    dis('galeon', 'Kronan (1668)', 'Tu elegido. La corona de proa ahora es una talla (aro, florones, diademas y orbe), sin el disco de fondo ni velas debajo.', {
      E: CAROLINO, ancho: 1.22, emblema: enVela(tresCoronas), mascaron: coronaTalla(), rm: .15, mo: .4,
      palos: [cu(-.28, [.62, .38], [.44, .3]), cu(-.02, [.8, .46], [.6, .38], [.42, .3]), cu(.2, [.72, .42], [.54, .35], [.36, .27])],
    }),
  ],
};
