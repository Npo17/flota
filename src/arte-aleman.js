// Alemanes, tercera tanda: quedan el Kraier, la fragata Berlin (con el águila rehecha) y el Adler von Lübeck (con las águilas emprolijadas).
import { dis, cu, la } from './arte-motor.js';
import { enVela, enProa, aguilaBicefala, aguila, llave } from './arte-emblemas.js';
import { aguilaTalla, grifoProa, llaveProa } from './arte-emblemas3.js';
import { vacaProa } from './arte-emblemas2.js';

const HANSA = { casco: '#3f2a18', borda: '#b3261e', franja: '#f1ece0', oro: '#e0b83e', porta: '#f1ece0', cubierta: '#b58a58', cubiertaAlta: '#c59a66' };
const IMPERIAL = { casco: '#1b1b1f', borda: '#2c2c33', franja: '#f2c230', franja2: '#b3261e', oro: '#f2c230', porta: '#f2c230', cubierta: '#b58a58', cubiertaAlta: '#c8a06a', galeria: '#b3261e' };
const BRANDEBURGO = { casco: '#2a1c12', borda: '#f1ece0', franja: '#b3261e', franja2: '#15151a', oro: '#e0b83e', porta: '#b3261e', cubierta: '#b98a52', cubiertaAlta: '#caa066', galeria: '#b3261e' };
const BLANCA = '#f1ece0';
const KRAIER = { E: HANSA, forma: { u: .75, pr: .1 }, tr: .4, palos: [la(-.3, .55, -1, { emb: false }), cu(.06, [.74, .44])], principal: 1, vela: BLANCA, bauprés: .08, emblema: enVela(aguila) };
const BERLIN = { E: BRANDEBURGO, palos: [la(-.34, .6, -1, { emb: false }), cu(-.08, [.72, .43], [.54, .35], [.36, .27]), cu(.18, [.64, .38], [.46, .31])], principal: 1, vela: BLANCA, emblema: enVela(aguila) };

export const ALEMANES = {
  nombre: 'Alemanes', faccion: 'hanseaticos', resumen: 'Cuarta tanda: tres tallas nuevas para el Kraier (el águila roja queda para la Berlin). La Berlin y el Adler ya están elegidos.',
  balandra: [
    dis('balandra', 'Kraier · grifo', 'El mismo Kraier con otra talla, ya que el águila roja queda para la Berlin: un grifo dorado (cabeza y alas de águila, cuerpo y cola de león), el emblema de Stralsund y Greifswald, ciudades de la Hansa.', { ...KRAIER, mascaron: grifoProa(), rm: .3, mo: .5 }),
    dis('balandra', 'Kraier · llave de Bremen', 'Con la llave de Bremen acostada sobre la proa, como la espada del bergantín francés que te gustó, y la llave también en la vela.', { ...KRAIER, emblema: enVela(llave), mascaron: llaveProa(), rm: .24, mo: 1.1 }),
    dis('balandra', 'Kraier · vaca de Hamburgo', 'Con la cabeza de la "Vaca Pintada", la nave capitana de Hamburgo que apresó al pirata Störtebeker en 1401.', { ...KRAIER, mascaron: vacaProa(), rm: .3, mo: .45 }),
  ],
  bergantin: [
    dis('bergantin', 'Fragata "Berlin" (1674) · águila tallada', 'Tu elegida. Versión 1: el águila roja como talla, con las alas abiertas hacia atrás, plumas marcadas y pico dorado.', { ...BERLIN, mascaron: aguilaTalla('#c8102e', '#e8b830', false, '#f08a8a'), rm: .19, mo: .5 }),
    dis('bergantin', 'Fragata "Berlin" (1674) · águila del Kraier', 'Tu elegida. Versión 2: la misma águila heráldica del Kraier (de frente, con las alas abiertas), más grande y sin disco.', { ...BERLIN, mascaron: enProa(aguila, 1.5), rm: .16, mo: .9 }),
  ],
  galeon: [
    dis('galeon', 'Adler von Lübeck (1566)', 'Tu elegido. El águila de dos cabezas de la proa está rehecha: plumas en las alas, dos cabezas con pico curvo y la corona imperial entre las dos.', {
      E: IMPERIAL, ancho: 1.22, popaAlta: -.18, popaAlta2: -.34, vela: '#f2c230',
      palos: [la(-.37, .7, -1, { emb: false }), cu(-.08, [.8, .46], [.58, .37], [.4, .29]), cu(.2, [.7, .41], [.52, .34])], principal: 1,
      emblema: enVela(aguilaBicefala), mascaron: aguilaTalla('#1b1b1f', '#f2c230', true, '#6a6a72'), rm: .19, mo: .5,
    }),
  ],
};
