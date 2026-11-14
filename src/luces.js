// Los faroles de cada barco, como datos: dónde van, de qué tamaño y con qué fuerza. Solo dibujo.
// Cada civilización tiene barcos distintos (un junco no lleva la popa de un galeón), así que cada una dice sus puntos de luz
// por tipo de casco. Para ajustar un barco se toca su fila acá, sin tocar la lógica de dibujo.
//
// x: a lo largo del casco, de -0,5 (popa) a 0,5 (proa).  y: de través, de -0,5 (babor) a 0,5 (estribor).
// r: tamaño del resplandor (1 = el farol de popa común).  i: fuerza (1 = normal).  color: opcional, si no es el farol común.
export const COLOR_FAROL = '#ffb45e';
export const COLOR_FOGONAZO = '#ffc873';

const popa = (r = 1, i = 1) => ({ x: -0.47, y: 0, r, i });
const proa = (r = 0.55, i = 0.6) => ({ x: 0.43, y: 0, r, i });
// galeón europeo: los dos fanales de la galería de popa y uno chico en el castillo de proa
const EUROPEO = {
  balandra: [popa(0.9)],
  bergantin: [popa(1), proa(0.5, 0.5)],
  galeon: [{ x: -0.47, y: -0.20, r: 0.95, i: 1 }, { x: -0.47, y: 0.20, r: 0.95, i: 1 }, proa(0.6, 0.6)],
};

export const LUCES = {
  _: EUROPEO, // lo que vale si una civilización no dice nada
  britanicos: EUROPEO, espanoles: EUROPEO, franceses: EUROPEO, portugueses: EUROPEO, holandeses: EUROPEO, suecos: EUROPEO,
  // cocas y naves de la Hansa: un solo fanal alto en el castillo de popa, y en la grande otro a proa
  hanseaticos: { balandra: [popa(0.9)], bergantin: [popa(1.05)], galeon: [popa(1.15), proa(0.6, 0.6)] },
  // galeras: el fanal bajo la toldilla de popa y otro en el espolón
  otomanos: { balandra: [{ x: -0.40, y: 0, r: 0.9, i: 1 }], bergantin: [{ x: -0.41, y: 0, r: 1, i: 1 }, proa(0.5, 0.55)], galeon: [{ x: -0.42, y: 0, r: 1.1, i: 1 }, proa(0.55, 0.6)] },
  // galeras de Venecia: el fanal dorado de popa (tres en la galeaza) y otro en el espolón
  venecianos: { balandra: [{ x: -0.46, y: 0, r: 0.9, i: 1 }], bergantin: [{ x: -0.47, y: 0, r: 1, i: 1 }, proa(0.5, 0.55)], galeon: [{ x: -0.48, y: -0.22, r: 0.85, i: 0.95 }, { x: -0.48, y: 0, r: 1, i: 1 }, { x: -0.48, y: 0.22, r: 0.85, i: 0.95 }, proa(0.55, 0.6)] },
  // barcos dragón: teas, más rojizas, a proa y a popa
  vikingos: {
    balandra: [{ x: -0.40, y: 0, r: 0.8, i: 0.9, color: '#ff9440' }],
    bergantin: [{ x: -0.41, y: 0, r: 0.85, i: 0.9, color: '#ff9440' }, { x: 0.40, y: 0, r: 0.7, i: 0.8, color: '#ff9440' }],
    galeon: [{ x: -0.42, y: 0, r: 0.9, i: 0.9, color: '#ff9440' }, { x: 0.41, y: 0, r: 0.8, i: 0.85, color: '#ff9440' }],
  },
  // juncos: faroles de papel, más rojos, repartidos por la cubierta y no en un fanal de popa
  chinos: {
    balandra: [{ x: -0.36, y: 0, r: 0.8, i: 0.95, color: '#ff8650' }],
    bergantin: [{ x: -0.38, y: -0.22, r: 0.7, i: 0.9, color: '#ff8650' }, { x: -0.38, y: 0.22, r: 0.7, i: 0.9, color: '#ff8650' }, { x: 0.30, y: 0, r: 0.6, i: 0.7, color: '#ff8650' }],
    galeon: [{ x: -0.36, y: -0.26, r: 0.7, i: 0.9, color: '#ff8650' }, { x: -0.36, y: 0.26, r: 0.7, i: 0.9, color: '#ff8650' }, { x: 0.02, y: -0.28, r: 0.6, i: 0.75, color: '#ff8650' }, { x: 0.02, y: 0.28, r: 0.6, i: 0.75, color: '#ff8650' }, { x: 0.34, y: 0, r: 0.6, i: 0.7, color: '#ff8650' }],
  },
  // naves con castillo: faroles en las esquinas del castillo de madera
  japoneses: {
    balandra: [{ x: -0.30, y: 0, r: 0.85, i: 0.95 }],
    bergantin: [{ x: -0.26, y: -0.24, r: 0.65, i: 0.85 }, { x: -0.26, y: 0.24, r: 0.65, i: 0.85 }, { x: 0.22, y: 0, r: 0.6, i: 0.7 }],
    galeon: [{ x: -0.24, y: -0.27, r: 0.65, i: 0.85 }, { x: -0.24, y: 0.27, r: 0.65, i: 0.85 }, { x: 0.18, y: -0.27, r: 0.65, i: 0.85 }, { x: 0.18, y: 0.27, r: 0.65, i: 0.85 }],
  },
};

export function lucesDe(faccion, casco) {
  const f = LUCES[faccion] || LUCES._;
  return f[casco] || f.bergantin || LUCES._.bergantin;
}
