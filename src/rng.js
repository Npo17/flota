// Generador con semilla: el mismo número arma siempre el mismo mar.
export function crearRng(semilla) {
  let s = semilla >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    rango: (a, b) => a + (b - a) * next(),
    entero: (a, b) => Math.floor(a + (b - a + 1) * next()),
    elegir: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

// Aleatorio común para el juego en vivo (no hace falta que sea repetible)
export const azar = {
  rango: (a, b) => a + (b - a) * Math.random(),
  entero: (a, b) => Math.floor(a + (b - a + 1) * Math.random()),
  elegir: (arr) => arr[Math.floor(Math.random() * arr.length)],
};

export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
