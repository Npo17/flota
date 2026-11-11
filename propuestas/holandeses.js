// Holandeses, tercera tanda: quedan el Statenjacht y el De Zeven Provinciën (limpios, sin nada debajo de la talla)
// y tres bergantines nuevos con tallas de proa en lugar de íconos redondos.
import { dis, cu, la, ca, orzas } from './motor.js';
import { sirenaSeria } from './emblemas4.js';
import { delfinProa } from './emblemas2.js';
import { caballoProa, aguilaTalla, grifoProa } from './emblemas3.js';

const ROBLE = { casco: '#4a2f18', borda: '#2f6a45', franja: '#e3b23c', franja2: '#b3261e', oro: '#e8c24a', porta: '#e8c24a', cubierta: '#c09560', cubiertaAlta: '#cfa772', galeria: '#2f6a45' };
const VOC = { casco: '#3a2a1a', borda: '#3d7a52', franja: '#d9a441', franja2: '#f4f1e8', oro: '#e8c24a', porta: '#b3261e', cubierta: '#c09560', cubiertaAlta: '#cfa772', galeria: '#3d7a52' };
const ALMIRANTE = { casco: '#241a12', borda: '#1f3f73', franja: '#d9a441', franja2: '#241a12', oro: '#f0c75a', porta: '#b3261e', cubierta: '#c09560', cubiertaAlta: '#d0aa76', galeria: '#1f3f73' };
const REAL = { casco: '#1f3f73', borda: '#2b55a0', franja: '#f0c75a', franja2: '#e07b1a', oro: '#f0c75a', porta: '#f0c75a', cubierta: '#c09560', cubiertaAlta: '#d0aa76', galeria: '#1f3f73' };
const STATEN = { E: REAL, forma: { u: .5 }, palos: [ca(.1, 1.2, 1, { gavia: [.5, .3] })], bauprés: .06, galeria: 1, bajo: (ctx, c) => orzas(ctx, c, .0, '#7a4f26') };
const TRES = (k = 1) => [la(-.34, .6 * k, -1), cu(-.06, [.72, .43], [.52, .35]), cu(.2, [.62, .37], [.44, .3])];

export const HOLANDESES = {
  nombre: 'Holandeses', faccion: 'holandeses', resumen: 'Cuarta tanda: el Statenjacht con la talla bien visible, en tres versiones. El bergantín (Witte Valk) y el galeón ya están elegidos.',
  balandra: [
    dis('balandra', 'Statenjacht · sirena', 'La sirena rehecha para que se lea como mujer: melena larga que le cae por la espalda, hombros angostos, cintura, los brazos pegados al cuerpo con las manos juntas adelante y la cola verde con escamas.', { ...STATEN, mascaron: sirenaSeria(), rm: .34, mo: .35 }),
    dis('balandra', 'Statenjacht · caballo marino', 'El mismo yate con un caballo marino dorado de crin blanca en la proa.', { ...STATEN, mascaron: caballoProa(), rm: .32, mo: .55 }),
    dis('balandra', 'Statenjacht · halcón', 'Con el halcón blanco del bergantín "Witte Valk" que elegiste, para que la flota holandesa lleve el mismo emblema.', { ...STATEN, mascaron: aguilaTalla('#f1ece0', '#e3b23c', false, '#b9b3a2'), rm: .3, mo: .45 }),
  ],
  bergantin: [
    dis('bergantin', 'Filibote "De Meermin"', 'El filibote panzón de cubierta angosta y popa redonda, con carga a la vista. En la proa, una sirena tallada de cola verde. El nombre es inventado.', {
      E: ROBLE, forma: { u: .85, pr: .17, pl: .36 }, tr: .32, kd: [.9, .6], ancho: 1.2, galeria: 0, popaAlta: -.3, portaY: .74, palos: TRES(.95), principal: 1,
      items: [{ t: 'escotilla', x: .1, w: .16, h: .13 }, { t: 'fardos', x: -.14 }, { t: 'cabrestante', x: .3 }],
      mascaron: sirenaSeria(), rm: .22, mo: .35,
    }),
    dis('bergantin', 'Pinaza "Witte Valk"', 'Pinaza armada de la VOC con popa alta pintada de verde y ocre. En la proa, un halcón blanco con las alas echadas hacia atrás. El nombre es inventado.', {
      E: VOC, forma: { u: .4 }, palos: TRES(), principal: 1, popaAlta: -.2, popaAlta2: -.36, proaAlta: .3,
      mascaron: aguilaTalla('#f1ece0', '#e3b23c', false, '#b9b3a2'), rm: .17, mo: .5,
    }),
    dis('bergantin', 'Fragata "Zeepaard"', 'Fragata ligera del Almirantazgo, casco oscuro con azul y oro. En la proa, un caballo marino dorado con la crin blanca. Hubo varios barcos holandeses con ese nombre; el dibujo es mío.', {
      E: ALMIRANTE, palos: [la(-.34, .6, -1), cu(-.08, [.72, .43], [.54, .35], [.36, .27]), cu(.18, [.64, .38], [.46, .31])], principal: 1,
      mascaron: caballoProa(), rm: .18, mo: .6,
    }),
  ],
  galeon: [
    dis('galeon', 'De Zeven Provinciën (1665)', 'Tu elegido. Lo blanco de abajo del delfín eran la cebadera y los foques: los saqué. También saqué el escudo de la vela, que era otro ícono.', {
      E: ALMIRANTE, ancho: 1.22, emblema: null, mascaron: delfinProa(), rm: .18, mo: .4,
      palos: [cu(-.28, [.62, .38], [.44, .3]), cu(-.02, [.8, .46], [.6, .38], [.42, .3]), cu(.2, [.72, .42], [.54, .35], [.36, .27])],
    }),
  ],
};
