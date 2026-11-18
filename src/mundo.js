// El mundo de una partida: tierras, islas, icebergs, puerto y remolinos, según el mapa elegido.
import { MUNDO } from './config.js';
import { crearRng } from './rng.js';
import { MAPAS } from './mapas.js';

// opciones.callejones: deja los islotes pegados como en la primera versión (para jugar en línea contra un servidor anterior)
// opciones.relleno: false deja las tierras grandes como círculos sueltos; 1 une solo las que se tocan (para un servidor anterior); sin decir nada, une también las que dejan un paso angosto
// opciones.bandos: mar de guerra, con un puerto por bando (ver más abajo)
// opciones.tam: el lado del mar (por defecto MUNDO.ancho; 6400 para un servidor anterior al 15/11/2026). Las costas de mapas.js
// están dibujadas sobre MUNDO.base y se escalan; las islas sueltas, escollos, icebergs y remolinos se suman en proporción a la superficie.
export function crearMundo(idMapa, opciones = {}) {
  if (!MAPAS[idMapa]) idMapa = Object.keys(MAPAS)[0];
  const mapa = MAPAS[idMapa];
  const rng = crearRng(mapa.semilla);
  const W = opciones.tam || MUNDO.ancho, H = W, k = W / MUNDO.base;
  const cuantas = (n) => Math.round((n || 0) * k * k); // misma densidad que en el mapa original
  const puerto = { x: W / 2, y: H / 2, radio: 240 };
  const islas = [];

  // Isla del puerto: el muelle queda en su borde sur
  islas.push(crearIsla(rng, puerto.x, puerto.y - 230, 170, 'puerto'));
  puerto.y = puerto.y + 40;

  // Tierras grandes del mapa (continentes, penínsulas, islas mayores)
  for (const [x, y, r] of mapa.masas) islas.push(crearIsla(rng, x * k, y * k, r * k, 'tierra'));

  // Un solo cuerpo: las tierras grandes son círculos, y entre dos vecinas quedaba un rincón en punta (si se tocan) o un
  // paso angosto (si casi se tocan) en el que los barcos, sobre todo los bots, se metían y quedaban trabados.
  // Se rellena el tramo entre los dos centros con más círculos, de radio intermedio, así la costa pasa derecha de una
  // tierra a la otra. Nivel 1: solo las que se tocan. Nivel 2 (el de ahora): también las separadas por menos de 280,
  // salvo que cerrar ese paso deje una parte del mar sin salida.
  const nivel = opciones.callejones ? 0 : opciones.relleno === false ? 0 : opciones.relleno === 1 ? 1 : 2;
  if (nivel) {
    const rng2 = crearRng(mapa.semilla + 7919); // aparte, para no cambiar el resto del mapa
    const base = islas.slice(1), relleno = []; // sin la isla del puerto: su costa queda como está
    const tramo = (A, B, d, hechas) => {
      const nuevas = [], n = Math.ceil(d / (0.42 * Math.min(A.r, B.r)));
      for (let k = 1; k < n; k++) {
        const f = k / n, x = A.x + (B.x - A.x) * f, y = A.y + (B.y - A.y) * f, r = A.r + (B.r - A.r) * f;
        if (Math.hypot(x - puerto.x, y - puerto.y) < r + 520) continue; // las aguas del puerto no se tocan
        if (base.concat(hechas, nuevas).some((o) => Math.hypot(o.x - x, o.y - y) + r <= o.r + 4)) continue; // ya está cubierto
        nuevas.push({ x, y, r });
      }
      return nuevas;
    };
    const pares = [];
    for (let a = 0; a < base.length; a++) for (let b = a + 1; b < base.length; b++) {
      const A = base[a], B = base[b], d = Math.hypot(B.x - A.x, B.y - A.y), hueco = d - A.r - B.r;
      if (hueco > (nivel === 2 ? 280 : 80) || d <= Math.abs(A.r - B.r)) continue; // lejos una de otra, o una adentro de la otra
      pares.push({ A, B, d, hueco });
    }
    // primero las que se tocan (ahí no hay paso que cuidar)
    for (const p of pares) if (p.hueco <= 80) relleno.push(...tramo(p.A, p.B, p.d, relleno));
    // después los pasos angostos: se cierran solo si el mar sigue siendo uno solo
    const angostos = pares.filter((p) => p.hueco > 80);
    if (angostos.length) {
      const C = 80, N = Math.ceil(W / C), M = Math.ceil(H / C);
      const alcanzable = (tierras) => { // cuántas celdas de mar se alcanzan navegando desde el puerto
        const libre = new Uint8Array(N * M);
        for (let cy = 0; cy < M; cy++) for (let cx = 0; cx < N; cx++) {
          const x = cx * C + C / 2, y = cy * C + C / 2;
          libre[cy * N + cx] = tierras.some((o) => Math.abs(o.x - x) < o.r + 40 && Math.hypot(o.x - x, o.y - y) < o.r + 40) ? 0 : 1;
        }
        const cola = [Math.floor((puerto.y + 200) / C) * N + Math.floor(puerto.x / C)];
        libre[cola[0]] = 2;
        let n = 0;
        while (cola.length) {
          const q = cola.pop(), cx = q % N, cy = (q - cx) / N;
          n++;
          if (cx > 0 && libre[q - 1] === 1) { libre[q - 1] = 2; cola.push(q - 1); }
          if (cx < N - 1 && libre[q + 1] === 1) { libre[q + 1] = 2; cola.push(q + 1); }
          if (cy > 0 && libre[q - N] === 1) { libre[q - N] = 2; cola.push(q - N); }
          if (cy < M - 1 && libre[q + N] === 1) { libre[q + N] = 2; cola.push(q + N); }
        }
        let mar = 0;
        for (let k = 0; k < libre.length; k++) if (libre[k]) mar++;
        return { n, encerradas: mar - n };
      };
      const fijas = [islas[0], ...base];
      let antes = alcanzable(fijas.concat(relleno));
      for (const p of angostos.sort((a, b) => a.hueco - b.hueco)) {
        const nuevas = tramo(p.A, p.B, p.d, relleno);
        if (!nuevas.length) continue;
        const ahora = alcanzable(fijas.concat(relleno, nuevas));
        if (ahora.encerradas > antes.encerradas + 2) continue; // ese paso era la única entrada a una parte del mar: queda abierto
        relleno.push(...nuevas);
        antes = ahora;
      }
    }
    for (const q of relleno) islas.push(crearIsla(rng2, q.x, q.y, q.r, 'tierra'));
  }

  // Islas sueltas
  const [rMin, rMax] = mapa.radio;
  let intentos = 0, puestas = 0;
  while (puestas < cuantas(mapa.islas) && intentos < 4000) {
    intentos++;
    const r = rng.rango(rMin, rMax);
    const x = rng.rango(300, W - 300);
    const y = rng.rango(300, H - 300);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 650 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 240)) continue;
    islas.push(crearIsla(rng, x, y, r, 'isla'));
    puestas++;
  }

  // Icebergs: chicos, filosos y por todos lados
  intentos = 0; puestas = 0;
  while (puestas < cuantas(mapa.icebergs) && intentos < 6000) {
    intentos++;
    const r = rng.rango(22, 58);
    const x = rng.rango(200, W - 200);
    const y = rng.rango(200, H - 200);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 520 + r) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r + 130)) continue;
    islas.push(crearIsla(rng, x, y, r, 'iceberg'));
    puestas++;
  }

  // Arrecifes y bancos de arena: escollos chicos donde se encalla
  intentos = 0; puestas = 0;
  while (puestas < cuantas(mapa.arrecifes) && intentos < 6000) {
    intentos++;
    const r = rng.rango(20, 42);
    const x = rng.rango(250, W - 250);
    const y = rng.rango(250, H - 250);
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
  while (remolinos.length < cuantas(mapa.remolinos) && intentos < 4000) {
    intentos++;
    const x = rng.rango(500, W - 500);
    const y = rng.rango(500, H - 500);
    if (Math.hypot(x - puerto.x, y - puerto.y) < 1500) continue;
    if (islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + 320)) continue;
    if (remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < 900)) continue;
    remolinos.push({ x, y, radio: rng.rango(150, 210), giro: rng.next() < 0.5 ? 1 : -1 });
  }

  // Guerra (opciones.bandos): un puerto por bando, en lados opuestos del mar (el B, en espejo del A), con su islita y sin
  // islotes ni remolinos cerca. El puerto del centro queda como zona neutral (ahí sale el galeón del tesoro).
  let puertos = null;
  if (opciones.bandos) {
    const libre = (x, y, r) => !islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + r && i.tipo === 'tierra');
    let x = W * 0.12;
    while (x < W * 0.4 && !(libre(x, H / 2, 520) && libre(W - x, H / 2, 520))) x += 60; // se corre hacia el centro hasta que haya agua
    puertos = [{ x, y: H / 2, radio: 240, bando: 'A' }, { x: W - x, y: H / 2, radio: 240, bando: 'B' }];
    for (let k = islas.length - 1; k >= 0; k--) {
      const i = islas[k];
      if (i.tipo !== 'tierra' && i.tipo !== 'puerto' && puertos.some((p) => Math.hypot(i.x - p.x, i.y - p.y) < i.r + 520)) islas.splice(k, 1);
    }
    for (let k = remolinos.length - 1; k >= 0; k--) if (puertos.some((p) => Math.hypot(remolinos[k].x - p.x, remolinos[k].y - p.y) < 1200)) remolinos.splice(k, 1);
    const rngP = crearRng(mapa.semilla + 31337);
    for (const p of puertos) islas.push(crearIsla(rngP, p.x + (p.bando === 'A' ? -260 : 260), p.y, 150, 'puerto'));
  }

  return { id: idMapa, nombre: mapa.nombre, lugar: mapa.lugar, tema: mapa.tema, reglas: mapa.reglas || {}, puerto, puertos, islas, remolinos, ancho: W, alto: H };
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
