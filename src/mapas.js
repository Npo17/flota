// Mapas del juego. Cada uno tiene su clima (colores, árboles, hielo) y sus tierras grandes,
// armadas con manchas [x, y, radio] sobre un mundo de 6400 x 6400. El puerto siempre está en el centro.

const TROPICAL = {
  mar: [[0, 47, 159, 184], [0.38, 35, 124, 158], [0.68, 24, 88, 124], [1, 15, 51, 80]],
  bajos: ['rgba(120,225,215,0.28)', 'rgba(150,235,220,0.3)'],
  arena: ['#ecd9a0', '#d9c488'], pasto: ['#5aa552', '#458a44'], arbol: 'palmera', mini: '#d9c488',
};
const SELVA = { ...TROPICAL, pasto: ['#3f9a4a', '#2c7a3a'] };
const TEMPLADO = {
  mar: [[0, 58, 132, 160], [0.4, 40, 104, 138], [0.7, 28, 76, 110], [1, 18, 48, 78]],
  bajos: ['rgba(140,205,215,0.24)', 'rgba(160,215,220,0.26)'],
  arena: ['#d8cfa8', '#c2b78c'], pasto: ['#6a9a4e', '#4f7f3f'], arbol: 'pino', mini: '#b9b48c',
};
const HIELO = {
  mar: [[0, 70, 140, 170], [0.4, 44, 104, 140], [0.7, 28, 72, 108], [1, 16, 44, 74]],
  bajos: ['rgba(190,235,245,0.26)', 'rgba(210,242,250,0.3)'],
  arena: ['#eef6fa', '#d6e8f0'], pasto: ['#ffffff', '#e3eef5'], arbol: 'ninguno', mini: '#eef6fa',
};

export const MAPAS = {
  caribe: { nombre: 'Mar de islas', desc: 'El mapa clásico: islas tropicales por todos lados.', semilla: 1717, tema: TROPICAL,
    masas: [], islas: 33, radio: [70, 260], icebergs: 0, remolinos: 8 },
  indonesia: { nombre: 'Indonesia', desc: 'Cadenas de islas selváticas y estrechos angostos.', semilla: 2101, tema: SELVA,
    masas: [[700, 1500, 330], [1150, 2000, 300], [1600, 2500, 260], [1500, 4700, 240], [2100, 4850, 230], [2700, 4950, 220], [3300, 5000, 200], [3900, 5050, 200],
      [3300, 900, 520], [4700, 1700, 260], [5000, 2300, 200], [4500, 2400, 180], [5700, 3800, 480], [5500, 4700, 330]],
    islas: 16, radio: [60, 150], icebergs: 0, remolinos: 7 },
  oceania: { nombre: 'Oceanía', desc: 'Un continente al sur y cientos de islitas perdidas.', semilla: 3102, tema: TROPICAL,
    masas: [[1200, 5300, 700], [2300, 5700, 540], [600, 4300, 420], [5300, 5200, 260], [5550, 5750, 220]],
    islas: 34, radio: [40, 115], icebergs: 0, remolinos: 9 },
  sudamerica: { nombre: 'América del Sur', desc: 'La costa del continente, de la selva al cabo del sur.', semilla: 4103, tema: SELVA,
    masas: [[900, 700, 650], [1700, 1100, 480], [1000, 1500, 600], [1100, 2300, 520], [1200, 3100, 440], [1300, 3900, 380], [1400, 4600, 320], [1500, 5200, 260], [1550, 5700, 200],
      [2600, 5500, 160], [2850, 5400, 120]],
    islas: 12, radio: [60, 170], icebergs: 0, remolinos: 8 },
  centroamerica: { nombre: 'Centroamérica', desc: 'El istmo con su canal y las islas del Caribe.', semilla: 5104, tema: TROPICAL,
    masas: [[600, 600, 560], [900, 1500, 420], [1100, 2300, 330], [1250, 3000, 250], [1500, 3950, 270], [1900, 4650, 320], [2500, 5250, 390], [3300, 5750, 460], [4300, 5950, 500],
      [4200, 1500, 300], [4750, 1650, 220], [5300, 2100, 200]],
    islas: 14, radio: [50, 150], icebergs: 0, remolinos: 7 },
  norteamerica: { nombre: 'América del Norte', desc: 'Costas largas, bahías frías y una península al sur.', semilla: 6105, tema: TEMPLADO,
    masas: [[700, 700, 650], [1700, 500, 520], [2700, 450, 420], [3800, 400, 380], [4900, 500, 460], [600, 1800, 520], [650, 2800, 430], [800, 3700, 360],
      [5300, 1300, 300], [5550, 1900, 200]],
    islas: 12, radio: [60, 180], icebergs: 0, remolinos: 8 },
  europa: { nombre: 'Europa', desc: 'El viejo continente, sus penínsulas y las islas del oeste.', semilla: 7106, tema: TEMPLADO,
    masas: [[5600, 900, 650], [5700, 1900, 600], [5500, 2900, 480], [5800, 3800, 520], [5300, 4700, 420], [4700, 5100, 260], [4500, 5600, 200],
      [1500, 1300, 330], [1450, 700, 240], [900, 1500, 220], [3600, 500, 330], [4300, 450, 380]],
    islas: 9, radio: [60, 160], icebergs: 0, remolinos: 7 },
  polonorte: { nombre: 'Polo Norte', desc: 'La banquisa al norte y el mar sembrado de icebergs.', semilla: 8107, tema: HIELO,
    masas: [[1000, 400, 560], [2200, 300, 520], [3400, 250, 520], [4600, 300, 520], [5600, 450, 560]],
    islas: 11, radio: [80, 210], icebergs: 55, remolinos: 6 },
  antartida: { nombre: 'Antártida', desc: 'El continente blanco, su península y témpanos a la deriva.', semilla: 9108, tema: HIELO,
    masas: [[800, 5900, 700], [1900, 6000, 650], [3200, 6100, 650], [4500, 6000, 650], [5600, 5900, 700], [1500, 5000, 300], [1350, 4450, 220]],
    islas: 6, radio: [80, 200], icebergs: 48, remolinos: 7 },
  pearlharbor: { nombre: 'Pearl Harbor', desc: 'Una isla grande con su bahía y la cadena hawaiana.', semilla: 1941, tema: TROPICAL,
    masas: [[2500, 900, 420], [3300, 700, 430], [4100, 900, 420], [2300, 1700, 300], [4300, 1700, 300],
      [5200, 3300, 300], [5600, 4200, 340], [5900, 5300, 400], [900, 2200, 220], [500, 1300, 180]],
    islas: 9, radio: [50, 140], icebergs: 0, remolinos: 7 },
};

export function mapaAlAzar() {
  const ids = Object.keys(MAPAS);
  return ids[Math.floor(Math.random() * ids.length)];
}
