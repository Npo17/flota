// El mundo de una partida: tierras, islas, icebergs, puerto y remolinos, según el mapa elegido.
import { MUNDO } from './config.js';
import { crearRng } from './rng.js';
import { MAPAS } from './mapas.js';

// opciones.callejones: deja los islotes pegados como en la primera versión (para jugar en línea contra un servidor anterior)
// opciones.relleno: false deja las tierras grandes como círculos sueltos, con rincones entre uno y otro (ídem, servidor anterior)
export function crearMundo(idMapa, opciones = {}) {
  if (!MAPAS[idMapa]) idMapa = Object.keys(MAPAS)[0];
  const mapa = MAPAS[idMapa];
  const rng = crearRng(mapa.semilla);
  const puerto = { x: MUNDO.ancho / 2, y: MUNDO.alto / 2, radio: 240 };
  const islas = [];

  // Isla del puerto: el muelle queda en su borde sur
  islas.push(crearIsla(rng, puerto.x, puerto.y - 230, 170, 'puerto'));
  puerto.y = puerto.y + 40;

  // Tierras grandes del mapa (continentes, penínsulas, islas mayores)
  for (const [x, y, r] of mapa.masas) islas.push(crearIsla(rng, x, y, r, 'tierra'));

  // Un solo cuerpo: las tierras grandes son círculos, y donde dos se tocan quedaba un rincón en punta entre uno y otro
  // en el que los barcos (sobre todo los bots) se metían y quedaban trabados. Se rellena el tramo entre los dos centros
  // con más círculos, de radio intermedio, así la costa pasa derecha de una tierra a la otra.
  if (opciones.relleno !== false && !opciones.callejones) {
    const rng2 = crearRng(mapa.semilla + 7919); // aparte, para no cambiar el resto del mapa
    const base = islas.slice(1), relleno = []; // sin la isla del puerto: su costa queda como está
    for (let a = 0; a < base.length; a++) for (let b = a + 1; b < base.length; b++) {
      const A = base[a], B = base[b], d = Math.hypot(B.x - A.x, B.y - A.y);
      if (d - A.r - B.r > 80 || d <= Math.abs(A.r - B.r)) continue; // lejos una de otra, o una adentro de la otra
      const n = Math.ceil(d / (0.42 * Math.min(A.r, B.r)));
      for (let k = 1; k < n; k++) {
        const f = k / n, x = A.x + (B.x - A.x) * f, y = A.y + (B.y - A.y) * f, r = A.r + (B.r - A.r) * f;
        if (Math.hypot(x - puerto.x, y - puerto.y) < r + 520) continue; // las aguas del puerto no se tocan
        if (base.concat(relleno).some((o) => Math.hypot(o.x - x, o.y - y) + r <= o.r + 4)) continue; // ya está cubierto
        relleno.push(crearIsla(rng2, x, y, r, 'tierra'));
      }
    }
    islas.push(...relleno);
  }

  // Islas sueltas
  const [rMin, rMax] = mapa.radio;
  let intentos = 0, puestas = 0;
  while (puestas < mapa.islas && intentos < 4000) {
    intentos++;
    const r = rng.rango(rMin, rMax);
    const x = rng.rango(300, MUNDO.ancho - 300);
    const y = rng.rango(300, MUNDO.alto - 300);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 650 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 240)) continue;
    islas.push(crearIsla(rng, x, y, r, 'isla'));
    puestas++;
  }

  // Icebergs: chicos, filosos y por todos lados
  intentos = 0; puestas = 0;
  while (puestas < (mapa.icebergs || 0) && intentos < 6000) {
    intentos++;
    const r = rng.rango(22, 58);
    const x = rng.rango(200, MUNDO.ancho - 200);
    const y = rng.rango(200, MUNDO.alto - 200);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 520 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 130)) continue;
    islas.push(crearIsla(rng, x, y, r, 'iceberg'));
    puestas++;
  }

  // Arrecifes y bancos de arena: escollos chicos donde se encalla
  intentos = 0; puestas = 0;
  while (puestas < (mapa.arrecifes || 0) && intentos < 6000) {
    intentos++;
    const r = rng.rango(20, 42);
    const x = rng.rango(250, MUNDO.ancho - 250);
    const y = rng.rango(250, MUNDO.alto - 250);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 560 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 110)) continue;
    islas.push(crearIsla(rng, x, y, r, 'arrecife'));
    puestas++;
  }

  // Sin callejones: se sacan los islotes y escollos que dejan un paso de menos de 280 con otra tierra,
  // porque ahí los barcos (sobre todo los bots) quedaban trabados.
  if (!opciones.callejones) {
    const quedan = [];
    for (const i of islas) {
      const chico = i.tipo === 'isla' || i.tipo === 'iceberg' || i.tipo === 'arrecife';
      if (chico && quedan.some((o) => Math.hypot(o.x - i.x, o.y - i.y) - o.r - i.r < 280)) continue;
      quedan.push(i);
    }
    islas.length = 0; islas.push(...quedan);
  }

  const remolinos = [];
  intentos = 0;
  while (remolinos.length < mapa.remolinos && intentos < 4000) {
    intentos++;
    const x = rng.rango(500, MUNDO.ancho - 500);
    const y = rng.rango(500, MUNDO.alto - 500);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 1500) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + 320)) continue;
    if (remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < 900)) continue;
    remolinos.push({ x, y, radio: rng.rango(150, 210), giro: rng.next() < 0.5 ? 1 : -1 });
  }

  return { id: idMapa, nombre: mapa.nombre, lugar: mapa.lugar, tema: mapa.tema, reglas: mapa.reglas || {}, puerto, islas, remolinos, ancho: MUNDO.ancho, alto: MUNDO.alto };
}

function crearIsla(rng, x, y, r, tipo) {
  const iceberg = tipo === 'iceberg' || tipo === 'arrecife'; // escollos: chicos, sin árboles
  const n = iceberg ? rng.entero(6, 8) : Math.min(22, rng.entero(9, 14) + Math.floor(r / 120));
  const amp = Math.min(0.15, 45 / r); // las tierras grandes tienen la costa más pareja, para que coincida con donde chocás
  const puntos = [];
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2;
    puntos.push({ ang, f: iceberg ? rng.rango(0.7, 1.15) : rng.rango(1 - amp * 1.3, 1 + amp * 0.7) });
  }
  const palmeras = [];
  const cant = iceberg ? 0 : Math.min(26, Math.round(r / 35));
  for (let k = 0; k < cant; k++) {
    const ang = rng.rango(0, Math.PI * 2), d = rng.rango(0.1, 0.6) * r;
    palmeras.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d, s: rng.rango(0.8, 1.3) });
  }
  const rocas = [];
  if (!iceberg) {
    for (let k = 0; k < rng.entero(0, 3); k++) {
      const ang = rng.rango(0, Math.PI * 2);
      rocas.push({ x: Math.cos(ang) * r * 1.05, y: Math.sin(ang) * r * 1.05, s: rng.rango(6, 13) });
    }
  }
  return { x, y, r, puntos, palmeras, rocas, tipo, esPuerto: tipo === 'puerto' };
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
