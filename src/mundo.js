// El mapa: islas, puerto y remolinos. Se genera con semilla.
import { MUNDO } from './config.js';
import { crearRng } from './rng.js';

export function crearMundo(semilla = 1717) {
  const rng = crearRng(semilla);
  const puerto = { x: MUNDO.ancho / 2, y: MUNDO.alto / 2, radio: 240 };
  const islas = [];

  // Isla del puerto: el muelle queda en su borde sur
  const islaPuerto = crearIsla(rng, puerto.x, puerto.y - 230, 170, true);
  islas.push(islaPuerto);
  puerto.y = puerto.y + 40;

  let intentos = 0;
  while (islas.length < 34 && intentos < 2000) {
    intentos++;
    const r = rng.rango(70, 260);
    const x = rng.rango(300, MUNDO.ancho - 300);
    const y = rng.rango(300, MUNDO.alto - 300);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 650 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 260)) continue;
    islas.push(crearIsla(rng, x, y, r, false));
  }

  const remolinos = [];
  intentos = 0;
  while (remolinos.length < 8 && intentos < 2000) {
    intentos++;
    const x = rng.rango(500, MUNDO.ancho - 500);
    const y = rng.rango(500, MUNDO.alto - 500);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 1500) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + 320)) continue;
    if (remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < 900)) continue;
    remolinos.push({ x, y, radio: rng.rango(150, 210), giro: rng.next() < 0.5 ? 1 : -1 });
  }

  return { puerto, islas, remolinos, ancho: MUNDO.ancho, alto: MUNDO.alto };
}

function crearIsla(rng, x, y, r, esPuerto) {
  const n = rng.entero(9, 14);
  const puntos = [];
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2;
    puntos.push({ ang, f: rng.rango(0.78, 1.12) });
  }
  const palmeras = [];
  const cant = Math.round(r / 35);
  for (let k = 0; k < cant; k++) {
    const ang = rng.rango(0, Math.PI * 2), d = rng.rango(0.1, 0.6) * r;
    palmeras.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d, s: rng.rango(0.8, 1.3) });
  }
  const rocas = [];
  for (let k = 0; k < rng.entero(0, 3); k++) {
    const ang = rng.rango(0, Math.PI * 2);
    rocas.push({ x: Math.cos(ang) * r * 1.05, y: Math.sin(ang) * r * 1.05, s: rng.rango(6, 13) });
  }
  return { x, y, r, puntos, palmeras, rocas, esPuerto };
}

// Zona del mar según la distancia al puerto: 0 calma, 1 abierto, 2 profundo
export function nivelZona(mundo, x, y) {
  const d = Math.hypot(x - mundo.puerto.x, y - mundo.puerto.y);
  if (d < 1300) return 0;
  if (d < 2300) return 1;
  return 2;
}

export function nombreZona(n) {
  return ['Aguas calmas', 'Mar abierto', 'Aguas profundas'][n];
}
