// La tierra con relieve: arena mojada y seca, vegetación, bosque, roca, nieve y hielo, con la luz del escenario.
// Solo dibujo: usa las mismas costas que el juego (las formas de mundo.js), así lo que se ve es donde se choca.
// El mundo se pinta por baldosas (pedazos cuadrados), una sola vez cada una, y después solo se estampan. Una baldosa se arma
// en un cuadro; mientras falta alguna a la vista, dibujo.js muestra la tierra lisa de siempre.
import { hash2 } from './rng.js';

const LADO = 400; // lo que mide una baldosa en el mundo
const TAU = Math.PI * 2;
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const entre = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ruido suave y repetible (el mismo punto del mundo da siempre lo mismo, así las baldosas empalman)
function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const nubes = (x, y) => ruido(x, y) * 0.5 + ruido(x * 2.03 + 11.3, y * 2.03 - 7.1) * 0.27 + ruido(x * 4.1 - 3.7, y * 4.1 + 19.9) * 0.15 + ruido(x * 8.3 + 5.5, y * 8.3 + 2.2) * 0.08;
// copas de árboles: un bulto redondo por celda
function copas(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let m = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i + 0.2 + 0.6 * hash2(xi + i, yi + j), cy = yi + j + 0.2 + 0.6 * hash2(yi + j + 57, xi + i - 31);
    const r = 0.42 + 0.3 * hash2(xi + i + 9, yi + j + 9), d = Math.hypot(x - cx, y - cy) / r;
    if (d < 1) m = Math.max(m, Math.sqrt(1 - d * d) * (0.6 + 0.4 * r));
  }
  return m;
}

// Hielo quebrado en caras: de cada punto, a qué cara pertenece (la del centro más cercano), qué tan cerca está de la
// grieta con la cara vecina, y la inclinación propia de esa cara (cada una mira para un lado distinto).
function caras(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9, cx = 0, cy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const px = xi + i + 0.15 + 0.7 * hash2(xi + i, yi + j), py = yi + j + 0.15 + 0.7 * hash2(yi + j + 41, xi + i - 23), d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; cx = xi + i; cy = yi + j; } else if (d < d2) d2 = d;
  }
  return [d2 - d1, hash2(cx + 3, cy - 5) - 0.5, hash2(cy + 9, cx + 2) - 0.5, hash2(cx - 11, cy + 17)];
}

// cuánto hay de tierra adentro en un punto: distancia a la costa de esa tierra (positivo = adentro)
function adentro(isla, x, y) {
  const dx = x - isla.x, dy = y - isla.y, dist = Math.hypot(dx, dy);
  if (dist > isla.r * 1.3) return -1e9;
  const p = isla.puntos, n = p.length;
  let a = Math.atan2(dy, dx); if (a < 0) a += TAU;
  const q = (a / TAU) * n, k = Math.floor(q) % n, f = q - Math.floor(q);
  const u = f * f * (3 - 2 * f);
  return isla.r * (p[k].f + (p[(k + 1) % n].f - p[k].f) * u) - dist;
}

function trazar(ctx, isla, escala, recto) {
  const p = isla.puntos, n = p.length;
  const pt = (k) => { const q = p[(k + n) % n]; return [isla.x + Math.cos(q.ang) * isla.r * q.f * escala, isla.y + Math.sin(q.ang) * isla.r * q.f * escala]; };
  ctx.beginPath();
  if (recto) { for (let k = 0; k < n; k++) { const [x, y] = pt(k); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); return; }
  const [x0, y0] = pt(0), [x1, y1] = pt(1);
  ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
  for (let k = 1; k <= n; k++) { const [cx, cy] = pt(k), [nx, ny] = pt(k + 1); ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2); }
  ctx.closePath();
}

// Los materiales de cada clima, sacados de los colores del mapa (src/mapas.js)
function materiales(tema) {
  const a0 = hex(tema.arena[0]), a1 = hex(tema.arena[1]), p0 = hex(tema.pasto[0]), p1 = hex(tema.pasto[1]);
  const hielo = tema.arbol === 'ninguno', oscuro = a0[0] + a0[1] + a0[2] < 330; // arena negra: isla volcánica
  return {
    hielo, mojada: entre(a1, [70, 96, 104], hielo ? 0.25 : 0.38), arena: a0, arena2: a1,
    pasto: hielo ? [246, 250, 253] : entre(p0, [150, 160, 90], 0.12), pasto2: hielo ? [222, 234, 243] : p1,
    bosque: hielo ? [205, 222, 236] : entre(p1, [16, 44, 26], tema.arbol === 'palmera' ? 0.5 : 0.62),
    roca: hielo ? [112, 122, 134] : oscuro ? [58, 52, 48] : [134, 124, 108], roca2: hielo ? [70, 80, 94] : oscuro ? [36, 32, 30] : [96, 88, 78],
    cumbre: hielo ? [255, 255, 255] : oscuro ? [84, 70, 62] : [178, 170, 150],
    arboles: hielo ? 0 : tema.arbol === 'palmera' ? 1 : 0.85,
  };
}

// calidad: 0 = apagado, y si no, cuántos puntos de imagen por unidad de mundo (0,6 a 1)
export function crearTerreno(mundo) {
  const mat = materiales(mundo.tema), baldosas = new Map(), islas = mundo.islas;
  let reloj = 0, claveLuz = '', px = 0;
  const cerca = (tx, ty, m) => islas.filter((i) => i.x + i.r * 1.3 + m > tx && i.x - i.r * 1.3 - m < tx + LADO && i.y + i.r * 1.3 + m > ty && i.y - i.r * 1.3 - m < ty + LADO);

  // Arma una baldosa de a poco: es un generador que se pausa (yield) cada unas filas, así el cuadro sigue fluido.
  function* armar(tx, ty, rumbo) {
    const lista = cerca(tx, ty, 8);
    if (!lista.length) return null;
    const P = Math.round(LADO * px), N = P + 2, s = px; // un punto de margen de cada lado, para empalmar
    const lienzo = document.createElement('canvas'); lienzo.width = lienzo.height = N;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(s, 0, 0, s, 1 - tx * s, 1 - ty * s);
    // la forma exacta de cada costa, un color por tipo: rojo tierra, azul banco de arena, verde hielo
    ctx.fillStyle = '#f00'; for (const i of lista) if (i.tipo !== 'iceberg' && i.tipo !== 'arrecife') { trazar(ctx, i, 1); ctx.fill(); }
    ctx.fillStyle = '#00f'; for (const i of lista) if (i.tipo === 'arrecife') { trazar(ctx, i, 0.98); ctx.fill(); }
    ctx.fillStyle = '#0f0'; for (const i of lista) if (i.tipo === 'iceberg') { trazar(ctx, i, 1.05, true); ctx.fill(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const img = ctx.getImageData(0, 0, N, N), d = img.data;
    let algo = false;
    for (let k = 3; k < d.length; k += 4) if (d[k]) { algo = true; break; }
    if (!algo) return null;
    const tierras = lista.filter((i) => i.tipo !== 'iceberg' && i.tipo !== 'arrecife'), hielos = lista.filter((i) => i.tipo === 'iceberg'), bancos = lista.filter((i) => i.tipo === 'arrecife');
    const H = new Float32Array(N * N), D = new Float32Array(N * N), G = new Float32Array(N * N), B = new Float32Array(N * N), M = new Uint8Array(N * N);
    // 1) altura de cada punto
    for (let py = 0; py < N; py++) { if ((py & 3) === 3) yield; for (let qx = 0; qx < N; qx++) {
      const k = py * N + qx, o = k * 4;
      if (!d[o + 3]) continue;
      const x = tx + (qx - 1) / s, y = ty + (py - 1) / s;
      const tipo = d[o] > 127 ? 1 : d[o + 1] > 127 ? 2 : 3;
      let dd = 0, grande = 0;
      for (const i of tipo === 1 ? tierras : tipo === 2 ? hielos : bancos) { const v = adentro(i, x, y); if (v > dd) { dd = v; grande = i.r; } }
      M[k] = tipo; D[k] = dd; G[k] = grande;
      if (tipo === 1) {
        const lomas = nubes(x / 190, y / 190), fino = nubes(x / 34 + 40, y / 34 - 12);
        const monte = suave(120, 420, dd) * Math.pow(Math.abs(nubes(x / 300 + 7, y / 300 + 3) - 0.5) * 2, 0.8); // sierras tierra adentro, solo en tierras grandes
        let h = 5 * (1 - Math.exp(-dd / 26)) + suave(14, 110, dd) * (22 * lomas + 6 * fino) + monte * 46;
        // bosque: copas que sobresalen
        const b = mat.arboles * suave(0.46, 0.60, nubes(x / 120 - 20, y / 120 + 31)) * suave(30, 62, dd) * (1 - suave(0.55, 0.8, monte));
        if (b > 0.02) { const c = copas(x / 11, y / 11); h += b * c * 5.5; B[k] = b * (0.35 + 0.65 * Math.min(1, c * 1.6)); }
        H[k] = h;
      } else if (tipo === 2) {
        // hielo: caras planas, como bloques quebrados
        // un domo bajo que cae hacia el agua; las caras se pintan aparte, con su luz propia
        H[k] = 9 * (1 - Math.exp(-dd / 9)) + nubes(x / 16, y / 16) * 2.2;
      } else {
        H[k] = Math.min(dd, 10) * 0.12 + nubes(x / 9, y / 9) * 1.2;
      }
    } }
    // 2) color: material según la altura y la distancia a la costa, y luz según la pendiente
    const lx = Math.cos(rumbo) * 0.62, ly = Math.sin(rumbo) * 0.62, lz = 0.5, ln = Math.hypot(lx, ly, lz);
    for (let py = 1; py < N - 1; py++) { if ((py & 3) === 3) yield; for (let qx = 1; qx < N - 1; qx++) {
      const k = py * N + qx, o = k * 4, tipo = M[k];
      if (!tipo) continue;
      const x = tx + (qx - 1) / s, y = ty + (py - 1) / s, dd = D[k], h = H[k];
      const alt = (q) => (M[q] ? H[q] : -1.5);
      const gx = (alt(k + 1) - alt(k - 1)) * s * 0.5, gy = (alt(k + N) - alt(k - N)) * s * 0.5;
      const nn = Math.hypot(gx, gy, 1), luz = (-gx * lx - gy * ly + lz) / (nn * ln), cuesta = 1 - 1 / nn;
      let c, a = d[o + 3];
      const grano = hash2(qx + tx, py + ty) - 0.5;
      if (tipo === 1) {
        const playa = (G[k] > 300 ? 30 : 13) + 30 * nubes(x / 80 + 3, y / 80 + 8);
        c = entre(mat.arena, mat.arena2, suave(0.3, 0.7, nubes(x / 40, y / 40)));
        c = entre(mat.mojada, c, suave(1.5, 9, dd));
        const verde = suave(playa - 7, playa + 7, dd + (nubes(x / 13, y / 13) - 0.5) * 16);
        if (verde > 0) {
          let v = entre(mat.pasto, mat.pasto2, suave(0.32, 0.68, nubes(x / 150 + 50, y / 150 - 9)));
          v = entre(v, mat.bosque, Math.min(1, B[k] * 1.25));
          v = entre(v, entre(mat.roca, mat.roca2, suave(0.3, 0.7, nubes(x / 22, y / 22))), suave(0.30, 0.52, cuesta) * (mat.hielo ? 0.8 : 0.9) * (1 - B[k]));
          v = entre(v, mat.cumbre, suave(36, 52, h) * 0.8);
          if (mat.hielo) {
            // nieve con vida: ventisqueros estirados por el viento, charcos de hielo azulado y piedra que asoma
            v = entre(v, [206, 224, 240], suave(0.50, 0.72, ruido(x / 64 + 9, y / 11 - 4)) * 0.55);
            v = entre(v, [168, 208, 228], suave(0.66, 0.74, nubes(x / 70 + 21, y / 70 - 33)) * 0.8);
            v = entre(v, mat.roca2, suave(0.70, 0.76, nubes(x / 9 + 5, y / 9 + 5)) * suave(playa + 6, playa + 30, dd) * 0.85);
          } else {
            // pasto con vida: manchones secos, flores claras y piedras sueltas
            v = entre(v, [176, 160, 92], suave(0.60, 0.78, nubes(x / 46 - 13, y / 46 + 27)) * 0.38 * (1 - B[k]));
            v = entre(v, [226, 214, 150], suave(0.74, 0.80, nubes(x / 5 + 40, y / 5 - 40)) * 0.5 * (1 - B[k]));
            v = entre(v, mat.roca, suave(0.72, 0.77, nubes(x / 8 + 5, y / 8 + 5)) * 0.8 * (1 - B[k]));
          }
          c = entre(c, v, verde);
        }
        // la playa: una franja húmeda más oscura, algas que dejó la marea y cantos rodados
        if (verde < 1) {
          const playaK = 1 - verde;
          c = entre(c, mat.mojada, suave(0.62, 0.74, nubes(x / 14 + 3, y / 14 - 8)) * (1 - suave(6, 15, dd)) * 0.5 * playaK);
          if (!mat.hielo) c = entre(c, [92, 104, 70], suave(0.71, 0.76, nubes(x / 7 - 20, y / 7 + 12)) * suave(7, 10, dd) * (1 - suave(11, 15, dd)) * 0.7 * playaK);
          c = entre(c, mat.roca, suave(0.76, 0.80, nubes(x / 4 + 60, y / 4 + 60)) * 0.75 * playaK);
        }
        const sombra = (mat.hielo ? 0.50 : 0.58) + (mat.hielo ? 0.74 : 0.66) * Math.max(0, luz) + grano * 0.05;
        // la sombra tira a azul (más en la nieve), la luz queda neutra
        const az = mat.hielo ? 0.30 : 0.07, os = Math.max(0, 1 - sombra);
        c = [c[0] * sombra * (1 - az * os), c[1] * sombra, c[2] * sombra * (1 + az * os * 1.6)];
      } else if (tipo === 2) {
        // cada cara del hielo recibe la luz según hacia dónde mira; entre cara y cara, una grieta azul
        const [borde, tx2, ty2, alto] = caras(x / 15 + ruido(x / 26, y / 26) * 0.6, y / 15 + ruido(x / 26 + 7, y / 26 + 3) * 0.6);
        const luzCara = luz + (tx2 * lx + ty2 * ly) * 1.5 + (alto - 0.5) * 0.14;
        let hielo = entre([118, 172, 206], [226, 240, 248], suave(0.30, 0.78, luzCara));
        hielo = entre(hielo, [255, 255, 255], suave(0.80, 1.02, luzCara) * 0.9); // nieve en lo que mira a la luz
        hielo = entre(hielo, [84, 142, 184], (1 - suave(0.0, 0.07, borde)) * 0.75 * suave(2, 6, dd)); // grietas
        c = entre([150, 214, 226], hielo, suave(0.5, 4.5, dd)); // el borde, mojado y más turquesa
        c = entre(c, [240, 248, 252], suave(0.62, 0.74, nubes(x / 9 + 30, y / 9 - 30)) * 0.35); // manchones de nieve vieja
        c = [c[0] + grano * 5, c[1] + grano * 5, c[2] + grano * 3];
      } else {
        c = entre(mat.mojada, mat.arena, suave(3, 16, dd) * 0.8);
        const piedra = suave(0.63, 0.70, nubes(x / 6 + 70, y / 6 + 70)) * suave(4, 10, dd);
        c = entre(c, entre(mat.roca2, mat.roca, 0.4 + 0.6 * Math.max(0, luz)), piedra);
        const sombra = 0.86 + 0.2 * luz + grano * 0.05;
        c = [c[0] * sombra, c[1] * sombra, c[2] * sombra];
        a = a * (0.55 + 0.45 * suave(1, 12, dd)) * (0.75 + 0.25 * piedra); // un banco apenas bajo el agua: se transparenta hacia el borde
      }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = a;
    } }
    // el margen copia a su vecino de adentro
    for (let q = 0; q < N; q++) for (const [k, de] of [[q, q + N], [(N - 1) * N + q, (N - 2) * N + q], [q * N, q * N + 1], [q * N + N - 1, q * N + N - 2]]) { d[k * 4] = d[de * 4]; d[k * 4 + 1] = d[de * 4 + 1]; d[k * 4 + 2] = d[de * 4 + 2]; }
    ctx.putImageData(img, 0, 0);
    return lienzo;
  }

  let trabajo = null; // la baldosa que se está armando: { clave, tx, ty, gen }
  let ultimo = 0; // cuándo se dibujó el cuadro anterior: si el equipo viene justo, ese cuadro se arma menos
  const clavesDe = (x0, y0, x1, y1) => {
    const lista = [];
    for (let ty = Math.floor(y0 / LADO) * LADO; ty < y1; ty += LADO) for (let tx = Math.floor(x0 / LADO) * LADO; tx < x1; tx += LADO) {
      if (tx < -LADO || ty < -LADO || tx > mundo.ancho || ty > mundo.alto) continue;
      lista.push([tx, ty]);
    }
    return lista;
  };
  return {
    // Dibuja las baldosas a la vista. Arma las que faltan de a poco (unos milisegundos por cuadro, nunca una entera de golpe),
    // primero las que se ven y después las de alrededor, para que estén listas antes de llegar.
    // Devuelve true si están todas las que se ven; dibujo.js pinta la tierra lisa solo de las islas que todavía no tienen relieve.
    listo(x0, y0, vw, vh, nombreLuz, rumbo, calidad) {
      if (claveLuz !== nombreLuz + '|' + calidad) { baldosas.clear(); trabajo = null; claveLuz = nombreLuz + '|' + calidad; px = calidad; }
      this.vista = [];
      let faltan = 0;
      const pendientes = [];
      for (const [tx, ty] of clavesDe(x0, y0, x0 + vw, y0 + vh)) {
        const b = baldosas.get(tx + ',' + ty);
        if (b) { b.uso = ++reloj; if (b.img) this.vista.push(b); } else { faltan++; pendientes.push([tx, ty]); }
      }
      // las de alrededor (una baldosa de margen), cuando ya están todas las que se ven
      if (!pendientes.length) for (const [tx, ty] of clavesDe(x0 - LADO, y0 - LADO, x0 + vw + LADO, y0 + vh + LADO)) if (!baldosas.has(tx + ',' + ty)) { pendientes.push([tx, ty]); if (pendientes.length > 3) break; }
      const t0 = performance.now(), entre = t0 - ultimo; ultimo = t0;
      // pocos milisegundos por cuadro: si el cuadro anterior ya vino lento, casi nada (las que se ven, igual avanzan un poco)
      const presupuesto = entre > 20 ? (faltan ? 1 : 0) : 1.8;
      while (performance.now() - t0 < presupuesto) {
        if (!trabajo) {
          const sig = pendientes.shift();
          if (!sig) break;
          if (baldosas.has(sig[0] + ',' + sig[1])) continue;
          trabajo = { clave: sig[0] + ',' + sig[1], tx: sig[0], ty: sig[1], gen: armar(sig[0], sig[1], rumbo) };
        }
        const r = trabajo.gen.next();
        if (r.done) {
          const b = { img: r.value || null, tx: trabajo.tx, ty: trabajo.ty, uso: ++reloj };
          baldosas.set(trabajo.clave, b);
          if (b.img && b.tx < x0 + vw && b.tx + LADO > x0 && b.ty < y0 + vh && b.ty + LADO > y0) { this.vista.push(b); faltan--; }
          else if (b.tx < x0 + vw && b.tx + LADO > x0 && b.ty < y0 + vh && b.ty + LADO > y0) faltan--;
          trabajo = null;
        }
      }
      if (baldosas.size > 150) { // se sueltan las que hace más que no se ven
        const viejas = [...baldosas.entries()].sort((a, b) => a[1].uso - b[1].uso).slice(0, 40);
        for (const [k] of viejas) baldosas.delete(k);
      }
      return faltan <= 0;
    },
    // ¿Ya tiene relieve toda esta isla? (todas las baldosas que toca están armadas)
    cubierta(isla) {
      const m = isla.r * 1.3;
      for (const [tx, ty] of clavesDe(isla.x - m, isla.y - m, isla.x + m, isla.y + m)) if (!baldosas.has(tx + ',' + ty)) return false;
      return true;
    },
    dibujar(ctx) {
      const m = 0.4, e = m / px;
      for (const b of this.vista) {
        const P = b.img.width - 2;
        ctx.drawImage(b.img, 1 - m, 1 - m, P + 2 * m, P + 2 * m, b.tx - e, b.ty - e, LADO + 2 * e, LADO + 2 * e);
      }
    },
  };
}
