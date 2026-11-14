// Arte propio de las siete civilizaciones que se dibujan con el motor por piezas (src/arte-motor.js):
// suecos, holandeses, alemanes, otomanos, chinos, japoneses y venecianos. Cada archivo arte-<civilización>.js trae varias propuestas
// por casco (son las que muestra la galería de propuestas/); acá se anota cuál eligió Cristian para el juego.
// Para cambiar un barco: poner acá el nombre de otra propuesta del mismo archivo.
import { pintar } from './arte-motor.js';
import { FACCIONES } from './config.js';
import { SUECOS } from './arte-sueco.js';
import { HOLANDESES } from './arte-holandes.js';
import { ALEMANES } from './arte-aleman.js';
import { OTOMANOS } from './arte-otomano.js';
import { CHINOS } from './arte-chino.js';
import { JAPONESES } from './arte-japones.js';
import { VENECIANOS } from './arte-veneciano.js';

const ELEGIDOS = [
  [SUECOS, { balandra: 'Galera de Gustavo Vasa · sin corona', bergantin: 'Lybska Svan (1522)', galeon: 'Kronan (1668)' }],
  [HOLANDESES, { balandra: 'Statenjacht · sirena', bergantin: 'Pinaza "Witte Valk"', galeon: 'De Zeven Provinciën (1665)' }],
  [ALEMANES, { balandra: 'Kraier · grifo', bergantin: 'Fragata "Berlin" (1674) · águila tallada', galeon: 'Adler von Lübeck (1566)' }],
  [OTOMANOS, { balandra: 'Kalyata (galeota)', bergantin: 'Kadırga', galeon: 'Kalyon' }],
  [CHINOS, { balandra: 'Shachuan (barco de arena)', bergantin: 'Fuchuan (junco de Fujian)', galeon: 'Louchuan (barco torre)' }],
  [VENECIANOS, { balandra: 'Fusta', bergantin: 'Galea sottile', galeon: 'Galeaza de Lepanto (1571)' }],
  [JAPONESES, { balandra: 'Gozabune', bergantin: 'Sekibune del shogun', galeon: 'Atakemaru (1635)' }],
];

// facción → pintor(ctx, tipo de casco, opciones), con la misma forma que pintarFrances y compañía
export const ARTE_ELEGIDO = {};
for (const [civ, nombres] of ELEGIDOS) {
  const disenos = {};
  for (const [tipo, nombre] of Object.entries(nombres)) disenos[tipo] = civ[tipo].find((d) => d.nombre === nombre);
  if (Object.values(disenos).some((d) => !d)) { console.warn('Falta un diseño elegido de', civ.nombre); continue; } // sin arte propio antes que romper el juego
  // en las civilizaciones de remo, los remos los pone y los mueve dibujo.js: el diseño no dibuja los suyos
  const sinRemos = !!FACCIONES[civ.faccion].estilo.remos;
  ARTE_ELEGIDO[civ.faccion] = (ctx, tipo, o) => pintar(ctx, disenos[tipo], { ...o, sinRemos });
}
