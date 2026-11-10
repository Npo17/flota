// Mapas del juego: 20 lugares reales de la era de la vela (1400–1700).
// Cada uno tiene su clima, sus costas (manchas [x, y, radio] sobre un mundo de 6400 x 6400, con el puerto en el centro)
// y sus reglas: qué banderas navegan ahí, cuánto comercio o guerra hay, arrecifes, hielo, remolinos.

const TROPICAL = {
  mar: [[0, 47, 159, 184], [0.38, 35, 124, 158], [0.68, 24, 88, 124], [1, 15, 51, 80]],
  bajos: ['rgba(120,225,215,0.28)', 'rgba(150,235,220,0.3)'],
  arena: ['#ecd9a0', '#d9c488'], pasto: ['#5aa552', '#458a44'], arbol: 'palmera', mini: '#d9c488',
};
const SELVA = { ...TROPICAL, pasto: ['#3f9a4a', '#2c7a3a'] };
const VOLCANICO = { ...TROPICAL, arena: ['#5a544f', '#454039'], pasto: ['#4f9a4a', '#3a7a3a'], mini: '#7a746c' };
const MEDITERRANEO = {
  mar: [[0, 40, 150, 190], [0.4, 30, 112, 170], [0.7, 22, 80, 140], [1, 14, 48, 96]],
  bajos: ['rgba(120,210,225,0.26)', 'rgba(150,225,235,0.28)'],
  arena: ['#e8dcb4', '#d6c79a'], pasto: ['#8a9a4e', '#6f8040'], arbol: 'pino', mini: '#d6c79a',
};
const TEMPLADO = {
  mar: [[0, 58, 132, 160], [0.4, 40, 104, 138], [0.7, 28, 76, 110], [1, 18, 48, 78]],
  bajos: ['rgba(140,205,215,0.24)', 'rgba(160,215,220,0.26)'],
  arena: ['#d8cfa8', '#c2b78c'], pasto: ['#6a9a4e', '#4f7f3f'], arbol: 'pino', mini: '#b9b48c',
};
const FRIO = { ...TEMPLADO, mar: [[0, 52, 112, 140], [0.4, 36, 88, 120], [0.7, 26, 64, 96], [1, 16, 40, 68]], pasto: ['#7a8a5a', '#5f7048'] };
const HIELO = {
  mar: [[0, 70, 140, 170], [0.4, 44, 104, 140], [0.7, 28, 72, 108], [1, 16, 44, 74]],
  bajos: ['rgba(190,235,245,0.26)', 'rgba(210,242,250,0.3)'],
  arena: ['#eef6fa', '#d6e8f0'], pasto: ['#ffffff', '#e3eef5'], arbol: 'ninguno', mini: '#eef6fa',
};
const ESTUARIO = {
  mar: [[0, 150, 122, 84], [0.5, 128, 104, 74], [1, 98, 84, 64]],
  bajos: ['rgba(200,170,120,0.28)', 'rgba(215,190,140,0.3)'],
  arena: ['#dccb9a', '#c8b582'], pasto: ['#7fa552', '#648a44'], arbol: 'pino', mini: '#c8b582',
};

// Costas enteras para armar los mapas
const N = [[700, 450, 680], [1950, 300, 600], [3200, 250, 560], [4450, 300, 600], [5700, 450, 680]];
const S = N.map(([x, y, r]) => [x, 6400 - y, r]);
const O = N.map(([x, y, r]) => [y, x, r]);
const E = O.map(([x, y, r]) => [6400 - x, y, r]);

export const MAPAS = {
  lepanto: { nombre: 'Golfo de Lepanto', lugar: 'Grecia, 1571', tema: MEDITERRANEO, semilla: 1571,
    desc: 'Donde la Liga Santa frenó a la flota otomana en la mayor batalla de galeras de la historia.',
    rasgo: 'Golfo cerrado entre dos costas. Mucha guerra: galeras otomanas contra galeones españoles.',
    masas: [...N, ...S, [1400, 1500, 420], [5000, 1450, 380], [1600, 4950, 420], [4800, 5000, 400]],
    islas: 8, radio: [60, 150], remolinos: 6, reglas: { facciones: ['otomanos', 'espanoles', 'venecianos'], guerra: 1.8, comercio: 0.5 } },
  gibraltar: { nombre: 'Estrecho de Gibraltar', lugar: 'España y Berbería, 1607', tema: MEDITERRANEO, semilla: 1607,
    desc: 'La puerta entre el Mediterráneo y el Atlántico, vigilada por el Peñón y acechada por corsarios berberiscos.',
    rasgo: 'Paso entre Europa y África con corrientes traicioneras: más remolinos que en ningún otro mar.',
    masas: [...N, ...S, [3950, 1250, 330], [2450, 5150, 380]],
    islas: 3, radio: [60, 120], remolinos: 12, reglas: { facciones: ['espanoles', 'holandeses', 'otomanos'], piratas: 1.6 } },
  cadiz: { nombre: 'Bahía de Cádiz', lugar: 'España, 1587', tema: MEDITERRANEO, semilla: 1587,
    desc: 'Puerto de la Flota de Indias. Drake entró en 1587 y quemó los barcos del rey en su propia bahía.',
    rasgo: 'Las flotas del tesoro pasan el doble de seguido.',
    masas: [...E, [5200, 1500, 380], [5100, 4900, 400]],
    islas: 6, radio: [60, 150], remolinos: 6, reglas: { facciones: ['espanoles', 'britanicos'], convoy: 0.5, comercio: 1.4 } },
  gravelinas: { nombre: 'Gravelinas', lugar: 'Canal de la Mancha, 1588', tema: TEMPLADO, semilla: 1588,
    desc: 'Frente a estos bancos de arena los ingleses desbarataron a la Armada Invencible.',
    rasgo: 'Bancos de arena por todo el canal y casi solo barcos de guerra: españoles contra británicos.',
    masas: [...N, ...S],
    islas: 2, radio: [60, 110], arrecifes: 22, remolinos: 6, reglas: { facciones: ['espanoles', 'britanicos', 'holandeses'], guerra: 2, comercio: 0.4 } },
  oresund: { nombre: 'Estrecho de Øresund', lugar: 'Dinamarca y Suecia, 1658', tema: FRIO, semilla: 1658,
    desc: 'La llave del Báltico: desde 1429 todo barco que pasaba le pagaba peaje al rey de Dinamarca.',
    rasgo: 'Aguas frías con hielo a la deriva y mucho mercante cargado. Daneses, suecos y alemanes de la Hansa.',
    masas: [...O, ...E, [1900, 2300, 430], [1500, 4300, 380], [4700, 1500, 300], [4600, 4900, 330]],
    islas: 6, radio: [60, 150], icebergs: 12, remolinos: 5, reglas: { facciones: ['daneses', 'suecos', 'hanseaticos', 'holandeses'], comercio: 1.8 } },
  bosforo: { nombre: 'Bósforo', lugar: 'Constantinopla, 1453', tema: MEDITERRANEO, semilla: 1453,
    desc: 'El estrecho que une dos mares y dos continentes. En 1453 la ciudad cayó y pasó a ser otomana.',
    rasgo: 'Canal angosto de norte a sur dominado por galeras otomanas: poco lugar para escapar.',
    masas: [...O, ...E, [1500, 2000, 450], [4900, 2100, 450], [1500, 4500, 450], [4900, 4400, 450]],
    islas: 2, radio: [60, 110], remolinos: 5, reglas: { facciones: ['otomanos', 'otomanos', 'venecianos'], guerra: 1.4 } },
  malta: { nombre: 'Malta', lugar: 'Mediterráneo central, 1565', tema: MEDITERRANEO, semilla: 1565,
    desc: 'Los caballeros de la Orden resistieron acá el Gran Sitio otomano durante casi cuatro meses.',
    rasgo: 'Mar abierto casi sin islas: no hay dónde esconderse ni dónde reparar.',
    masas: [[1900, 1700, 300], [2450, 2250, 110], [3200, 150, 620], [4600, 250, 560]],
    islas: 3, radio: [60, 120], remolinos: 7, reglas: { facciones: ['otomanos', 'espanoles', 'venecianos'], guerra: 1.5 } },
  venecia: { nombre: 'Laguna de Venecia', lugar: 'Adriático, siglo XV', tema: MEDITERRANEO, semilla: 1423,
    desc: 'La república que se hizo rica con el comercio de Oriente, protegida por su laberinto de islotes.',
    rasgo: 'Decenas de islotes y un mar lleno de mercantes: el mejor lugar para saquear.',
    masas: [...N],
    islas: 34, radio: [35, 95], remolinos: 4, reglas: { facciones: ['venecianos', 'venecianos', 'otomanos'], comercio: 2.4, guerra: 0.7 } },
  cartagena: { nombre: 'Cartagena de Indias', lugar: 'Nueva Granada, 1586', tema: TROPICAL, semilla: 1586,
    desc: 'La plaza fuerte donde se embarcaba el oro del Perú. Drake la tomó y cobró rescate para devolverla.',
    rasgo: 'Flotas del tesoro muy seguidas y arrecifes de coral cerca de la costa.',
    masas: [...S, [1700, 4700, 330], [4900, 4800, 360]],
    islas: 8, radio: [50, 130], arrecifes: 12, remolinos: 6, reglas: { facciones: ['espanoles', 'britanicos', 'franceses'], convoy: 0.5, piratas: 1.3 } },
  portroyal: { nombre: 'Port Royal', lugar: 'Jamaica, 1692', tema: TROPICAL, semilla: 1692,
    desc: 'La capital de los bucaneros del Caribe, hasta que un terremoto la hundió en el mar en 1692.',
    rasgo: 'Nido de piratas: enjambres de balandros rápidos entre cayos y arrecifes.',
    masas: [[1400, 500, 560], [2600, 350, 520], [3800, 350, 520], [5000, 500, 560], [2300, 1250, 220], [2850, 1400, 170]],
    islas: 12, radio: [40, 110], arrecifes: 18, remolinos: 6, reglas: { facciones: ['britanicos', 'espanoles', 'franceses', 'holandeses'], piratas: 2.6, guerra: 0.7 } },
  tortuga: { nombre: 'Isla de la Tortuga', lugar: 'La Española, siglo XVII', tema: SELVA, semilla: 1630,
    desc: 'El refugio de los Hermanos de la Costa, frente a la costa norte de La Española.',
    rasgo: 'Piratas por todos lados y arrecifes que no perdonan.',
    masas: [...S, [3000, 1300, 300], [3700, 1250, 220]],
    islas: 6, radio: [50, 130], arrecifes: 14, remolinos: 7, reglas: { facciones: ['franceses', 'britanicos', 'espanoles'], piratas: 2.2 } },
  habana: { nombre: 'La Habana', lugar: 'Cuba, siglo XVI', tema: TROPICAL, semilla: 1561,
    desc: 'Acá se juntaban las flotas de México y de Tierra Firme antes de cruzar juntas a España.',
    rasgo: 'El paso obligado del oro: flotas del tesoro constantes y bien escoltadas.',
    masas: [...S, [1900, 5000, 360], [4500, 5000, 360]],
    islas: 10, radio: [40, 110], arrecifes: 6, remolinos: 6, reglas: { facciones: ['espanoles', 'espanoles', 'franceses', 'britanicos'], convoy: 0.45, guerra: 1.3 } },
  magallanes: { nombre: 'Estrecho de Magallanes', lugar: 'Patagonia, 1520', tema: FRIO, semilla: 1520,
    desc: 'El paso que encontró Magallanes entre los dos océanos, después de 38 días de canales y tormentas.',
    rasgo: 'Canales fríos y sinuosos, con hielo, muchísimos remolinos y más tritones.',
    masas: [...N, ...S, [1300, 1600, 480], [2600, 1450, 300], [4700, 1700, 460], [1700, 4800, 460], [3900, 5050, 330], [5200, 4700, 420]],
    islas: 5, radio: [60, 140], icebergs: 16, remolinos: 12, reglas: { facciones: ['espanoles', 'britanicos', 'holandeses'], tritones: 1.6, comercio: 0.6 } },
  buenaesperanza: { nombre: 'Cabo de Buena Esperanza', lugar: 'Sur de África, 1488', tema: TEMPLADO, semilla: 1488,
    desc: 'Bartolomé Dias lo llamó Cabo de las Tormentas. Doblarlo abría el camino a la India.',
    rasgo: 'Mar abierto y bravo: remolinos enormes y tritones al acecho.',
    masas: [...N, [3650, 1150, 330], [2700, 1000, 300]],
    islas: 3, radio: [60, 130], remolinos: 13, reglas: { facciones: ['portugueses', 'holandeses', 'britanicos'], tritones: 1.7, comercio: 1.3 } },
  molucas: { nombre: 'Islas Molucas', lugar: 'Islas de las Especias, 1521', tema: SELVA, semilla: 1521,
    desc: 'El único lugar del mundo donde crecían el clavo y la nuez moscada, que valían su peso en oro.',
    rasgo: 'Archipiélago selvático repleto de mercantes y galeones cargados de especias.',
    masas: [[5200, 1500, 420], [5500, 2500, 330], [4900, 2300, 260], [4300, 5300, 420], [5300, 5400, 380], [2300, 1500, 150], [2100, 2000, 140]],
    islas: 16, radio: [50, 140], arrecifes: 14, remolinos: 7, reglas: { facciones: ['portugueses', 'holandeses', 'espanoles', 'chinos'], comercio: 2.2, convoy: 0.6 } },
  noryang: { nombre: 'Estrecho de Noryang', lugar: 'Corea, 1598', tema: TEMPLADO, semilla: 1598,
    desc: 'La última batalla del almirante Yi Sun-sin: la flota coreana cerró el paso a las naves japonesas en retirada.',
    rasgo: 'Laberinto de islas con barcos tortuga coreanos, juncos chinos y naves japonesas.',
    masas: [...N, [1900, 1700, 360], [4300, 1600, 330]],
    islas: 22, radio: [60, 170], remolinos: 8, reglas: { facciones: ['coreanos', 'japoneses', 'chinos'], guerra: 1.8, comercio: 0.5 } },
  nagasaki: { nombre: 'Bahía de Nagasaki', lugar: 'Japón, 1571', tema: TEMPLADO, semilla: 1572,
    desc: 'El puerto que Japón abrió a los barcos europeos, y casi el único que dejó abierto después.',
    rasgo: 'Bahía cerrada por tres lados, con una sola salida al sur. Naves japonesas y mercantes de ultramar.',
    masas: [...N, ...O, ...E, [3650, 2150, 90]],
    islas: 5, radio: [50, 120], remolinos: 4, reglas: { facciones: ['japoneses', 'japoneses', 'portugueses', 'holandeses', 'chinos'], comercio: 1.6 } },
  kealakekua: { nombre: 'Bahía de Kealakekua', lugar: 'Hawái', tema: VOLCANICO, semilla: 1650,
    desc: 'Una bahía sagrada al pie de los volcanes, en las islas que poblaron los navegantes polinesios.',
    rasgo: 'Costas de arena negra volcánica, pocos barcos de guerra y aguas llenas de tritones.',
    masas: [[5300, 900, 650], [5700, 2100, 620], [5500, 3300, 520], [5800, 4400, 560], [4600, 700, 460]],
    islas: 5, radio: [60, 150], arrecifes: 8, remolinos: 8, reglas: { tritones: 1.9, guerra: 0.5, comercio: 1.2 } },
  nuevazembla: { nombre: 'Nueva Zembla', lugar: 'Mar de Barents, 1596', tema: HIELO, semilla: 1596,
    desc: 'Buscando un paso a Asia por el norte, el barco de Willem Barents quedó atrapado en el hielo todo un invierno.',
    rasgo: 'Mar helado sembrado de icebergs: chocarlos duele el doble y no sirven para reparar.',
    masas: [...N, [5700, 1700, 560], [5900, 2900, 480]],
    islas: 8, radio: [80, 200], icebergs: 60, remolinos: 6, reglas: { facciones: ['holandeses', 'rusos', 'britanicos'], comercio: 0.7 } },
  riodelaplata: { nombre: 'Río de la Plata', lugar: 'Sudamérica, 1516', tema: ESTUARIO, semilla: 1516,
    desc: 'El "Mar Dulce" de Solís: un estuario marrón y enorme, disputado durante siglos por españoles y portugueses.',
    rasgo: 'Aguas marrones poco profundas, llenas de bancos de arena donde es fácil encallar.',
    masas: [...N, ...S, [300, 2300, 700], [300, 4100, 700]],
    islas: 6, radio: [50, 130], arrecifes: 18, remolinos: 5, reglas: { facciones: ['espanoles', 'portugueses'], piratas: 1.3 } },
};

export function mapaAlAzar() {
  const ids = Object.keys(MAPAS);
  return ids[Math.floor(Math.random() * ids.length)];
}
