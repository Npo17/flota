// Todo lo que se pinta en el canvas.
import { hash2 } from './rng.js';
import { FACCIONES } from './config.js';
import { dibujarBandera } from './banderas.js';
import { candidatoAbordaje, difAng, equipoDe, vientoEn } from './juego.js';
import { t as tx } from './idioma.js';
import { pintarBritanico } from './arte-britanico.js';
import { pintarVikingo } from './arte-vikingo.js';
import { pintarEspanol, aguila } from './arte-espanol.js';
import { pintarGaleonRealista } from './arte-realista.js';
import { REAL } from './arte-real.js';
import { pintarPortugues } from './arte-portugues.js';
import { pintarFrances } from './arte-frances.js';
import { ARTE_ELEGIDO } from './arte-elegidos.js';
import { escenaElegida, escenaPara, entreEscenas, graficos } from './escenarios.js';
import { crearTerreno } from './terreno.js';
import { lucesDe, COLOR_FAROL, COLOR_FOGONAZO } from './luces.js';
import { dibujarKrakenAbajo, dibujarKrakenArriba, dibujarKrakenLuz, dibujarTormenta, dibujarMonedas } from './kraken-dibujo.js';

const TAU = Math.PI * 2;
const terrenos = new WeakMap(); // el relieve de cada mundo
const ESCOLLO = { iceberg: true, arrecife: true }; // obstáculos chicos que no son tierra

// ---------- Barcos ----------
// Cada facción tiene su forma de casco, sus velas y sus detalles. El barco se dibuja mirando hacia +x.
function rutaCasco(ctx, L, W, forma) {
  ctx.beginPath();
  if (forma === 'drakkar') { // dos puntas, fino
    ctx.moveTo(L * 0.54, 0);
    ctx.bezierCurveTo(L * 0.25, W * 0.6, -L * 0.25, W * 0.6, -L * 0.54, 0);
    ctx.bezierCurveTo(-L * 0.25, -W * 0.6, L * 0.25, -W * 0.6, L * 0.54, 0);
  } else if (forma === 'galera') { // larga, con espolón
    ctx.moveTo(L * 0.58, 0);
    ctx.lineTo(L * 0.3, W * 0.4);
    ctx.lineTo(-L * 0.4, W * 0.42);
    ctx.quadraticCurveTo(-L * 0.52, W * 0.3, -L * 0.52, 0);
    ctx.quadraticCurveTo(-L * 0.52, -W * 0.3, -L * 0.4, -W * 0.42);
    ctx.lineTo(L * 0.3, -W * 0.4);
  } else if (forma === 'caja') { // casco recto con proa corta
    ctx.moveTo(L * 0.52, 0);
    ctx.lineTo(L * 0.3, W * 0.5);
    ctx.lineTo(-L * 0.5, W * 0.5);
    ctx.lineTo(-L * 0.5, -W * 0.5);
    ctx.lineTo(L * 0.3, -W * 0.5);
  } else if (forma === 'tortuga') { // ovalado y ancho
    ctx.ellipse(0, 0, L * 0.5, W * 0.54, 0, 0, TAU);
  } else { // galeón
    ctx.moveTo(L / 2, 0);
    ctx.quadraticCurveTo(L * 0.3, W / 2, L * 0.05, W / 2);
    ctx.lineTo(-L * 0.42, W * 0.44);
    ctx.quadraticCurveTo(-L / 2, W * 0.3, -L / 2, 0);
    ctx.quadraticCurveTo(-L / 2, -W * 0.3, -L * 0.42, -W * 0.44);
    ctx.lineTo(L * 0.05, -W / 2);
    ctx.quadraticCurveTo(L * 0.3, -W / 2, L / 2, 0);
  }
  ctx.closePath();
}

function cascoEscalado(ctx, L, W, forma, kx, ky, color) {
  ctx.save();
  ctx.scale(kx, ky);
  rutaCasco(ctx, L, W, forma);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fill();
}

function dibujarVela(ctx, e, mx, alto, abiertas, color, principal) {
  const g = 3 + abiertas * 9; // cuánto se infla
  ctx.save();
  if (e.tipoVela === 'latina') {
    // vela triangular que se abre hacia un costado
    const abre = 4 + abiertas * alto * 0.42;
    ctx.beginPath();
    ctx.moveTo(mx + alto * 0.42, -1);
    ctx.quadraticCurveTo(mx + alto * 0.1, abre * 1.15, mx - alto * 0.4, 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.translate(3, 3); ctx.fill(); ctx.translate(-3, -3);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.clip();
    if (e.patron === 'rayas') {
      ctx.fillStyle = e.colorPatron;
      for (let x = mx - alto * 0.4; x < mx + alto * 0.45; x += alto * 0.24) ctx.fillRect(x, -2, alto * 0.11, abre * 1.3);
    } else if (e.patron === 'cruzRecta' && abiertas > 0.3) {
      ctx.fillStyle = e.colorPatron;
      const cx = mx + alto * 0.03, cy = abre * 0.42, t = Math.max(1.6, alto * 0.05), l = Math.min(abre * 0.3, alto * 0.16);
      ctx.fillRect(cx - t / 2, cy - l, t, l * 2);
      ctx.fillRect(cx - l, cy - t / 2, l * 2, t);
    }
    ctx.restore();
    ctx.strokeStyle = '#3d2310';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(mx + alto * 0.44, -1.5); ctx.lineTo(mx - alto * 0.42, 1.5); ctx.stroke();
    return;
  }
  const h = alto;
  const ruta = () => {
    ctx.beginPath();
    ctx.moveTo(mx, -h / 2);
    ctx.quadraticCurveTo(mx + g * 2.1, 0, mx, h / 2);
    ctx.quadraticCurveTo(mx + g * 0.35, 0, mx, -h / 2);
    ctx.closePath();
  };
  ctx.translate(3, 3); ruta(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill(); ctx.translate(-3, -3);
  ruta();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  if (e.patron === 'rayas') {
    ctx.fillStyle = e.colorPatron;
    for (let y = -h / 2; y < h / 2; y += h / 3.5) ctx.fillRect(mx - 2, y, g * 2.4, h / 7);
  } else if (e.patron === 'sol' && principal) {
    ctx.fillStyle = e.colorPatron;
    ctx.beginPath(); ctx.arc(mx + g * 0.62, 0, Math.min(h * 0.2, g * 0.55), 0, TAU); ctx.fill();
  } else if (e.patron === 'cruz' && principal) {
    ctx.strokeStyle = e.colorPatron;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(mx, -h * 0.26); ctx.lineTo(mx + g * 1.4, h * 0.26);
    ctx.moveTo(mx, h * 0.26); ctx.lineTo(mx + g * 1.4, -h * 0.26);
    ctx.stroke();
  } else if (e.patron === 'banda') {
    ctx.fillStyle = e.colorPatron;
    ctx.fillRect(mx - 2, -h * 0.11, g * 2.4, h * 0.22);
  } else if (e.patron === 'puntos') {
    ctx.fillStyle = e.colorPatron;
    for (const py of [-0.27, 0, 0.27]) { ctx.beginPath(); ctx.arc(mx + g * 0.6, h * py, Math.min(1.9, g * 0.22), 0, TAU); ctx.fill(); }
  } else if (e.patron === 'sables') {
    ctx.strokeStyle = e.colorPatron;
    ctx.lineWidth = 1.1;
    for (let y = -h / 2 + h / 8; y < h / 2; y += h / 6) { ctx.beginPath(); ctx.moveTo(mx - 2, y); ctx.lineTo(mx + g * 2.4, y); ctx.stroke(); }
  }
  // sombra suave hacia el mástil para dar volumen
  const sombra = ctx.createLinearGradient(mx, 0, mx + g * 1.3, 0);
  sombra.addColorStop(0, 'rgba(60,40,20,0.28)');
  sombra.addColorStop(1, 'rgba(60,40,20,0)');
  ctx.fillStyle = sombra;
  ctx.fillRect(mx - 2, -h / 2, g * 2.4, h);
  ctx.restore();
  // verga
  ctx.strokeStyle = '#3d2310';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(mx, -h / 2 - 1); ctx.lineTo(mx, h / 2 + 1); ctx.stroke();
}

// La parte fija del barco (casco, cubierta, cañones, palos y velas) se pinta una vez y se reutiliza.
const ESCALA_IMG = 2.5;
const imagenes = new Map();
// Civilizaciones con arte propio (ver src/arte-*.js): casco, cubierta, velas y mascarón se dibujan allí, en cuatro estados de daño.
const ARTE = { britanicos: pintarBritanico, vikingos: pintarVikingo, espanoles: pintarEspanol, portugueses: pintarPortugues, franceses: pintarFrances, ...ARTE_ELEGIDO };
function nivelDano(b) {
  const f = b.vida / b.stats.vidaMax;
  return !(f < 1) ? 0 : f > 0.75 ? 0 : f > 0.5 ? 1 : f > 0.25 ? 2 : 3;
}
function imagenBarco(b, e) {
  const d = b.diseno;
  // PRUEBA de estilo: el galeón español redibujado con acabado realista (src/arte-realista.js). barcoPrueba: false lo apaga.
  REAL.on = graficos().barcosReal !== false; // el acabado realista de todos los barcos (src/arte-real.js)
  const prueba = REAL.on && d.faccion === 'espanoles' && d.casco === 'galeon'; // el galeón español tiene su versión entera en src/arte-realista.js
  const pintar = prueba ? (c, casco, o) => pintarGaleonRealista(c, o, aguila) : ARTE[d.faccion], dano = pintar ? nivelDano(b) : 0;
  const clave = `${REAL.on ? 'R' : ''}${d.faccion}|${d.casco}|${d.canones}|${d.municion}|${b.velas}|${b.colorVela || ''}|${dano}`;
  let img = imagenes.get(clave);
  if (img) { imagenes.delete(clave); imagenes.set(clave, img); return img; } // al final: es de las recién usadas
  const s = b.stats, L = s.largo, W = s.ancho;
  img = document.createElement('canvas');
  img.width = Math.ceil((L * 1.5 + 24) * ESCALA_IMG);
  img.height = Math.ceil((W * 2.2 + 24) * ESCALA_IMG);
  const ctx = img.getContext('2d');
  ctx.translate(img.width / 2, img.height / 2);
  ctx.scale(ESCALA_IMG, ESCALA_IMG);
  ctx.lineJoin = 'round';

  if (pintar) {
    const mx = pintar(ctx, d.casco, {
      L, W, canones: d.canones / 2, grosor: d.municion === 'pesada' ? 4.6 : 3.2, abiertas: b.velas / 3,
      colorVela: b.colorVela || e.vela, velaForzada: b.colorVela, colorRayas: e.colorPatron, escudos: e.escudos, d: dano, sinSombra: true, // la sombra la pone dibujarBarco o el escenario
    });
    if (imagenes.size > 160) for (const k of [...imagenes.keys()].slice(0, 20)) imagenes.delete(k); // las más viejas primero
    imagenes.set(clave, img);
    return img;
  }

  // sombra en el agua
  ctx.save();
  ctx.translate(4, 5);
  cascoEscalado(ctx, L, W, e.forma, 1.04, 1.12, 'rgba(0,20,40,0.26)');
  ctx.restore();

  // casco: tablazón oscura, franja de color y cubierta
  cascoEscalado(ctx, L, W, e.forma, 1, 1, e.casco);
  cascoEscalado(ctx, L, W, e.forma, 0.95, 0.88, e.franja);
  cascoEscalado(ctx, L, W, e.forma, 0.91, 0.76, e.cubierta);
  // tablas de la cubierta, a lo largo
  ctx.save();
  ctx.scale(0.91, 0.76);
  rutaCasco(ctx, L, W, e.forma);
  ctx.restore();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(70,40,15,0.3)';
  ctx.lineWidth = 0.8;
  for (let y = -W * 0.36; y < W * 0.38; y += 3.4) { ctx.beginPath(); ctx.moveTo(-L / 2, y); ctx.lineTo(L / 2, y); ctx.stroke(); }
  // castillo de popa y de proa: cubiertas más altas
  if (e.forma === 'galeon' || e.forma === 'galera') {
    ctx.fillStyle = 'rgba(60,32,10,0.33)';
    ctx.fillRect(-L / 2, -W / 2, L * 0.2, W);
    ctx.fillRect(L * 0.3, -W / 2, L * 0.25, W);
    ctx.strokeStyle = 'rgba(40,22,8,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-L * 0.3, -W / 2); ctx.lineTo(-L * 0.3, W / 2); ctx.moveTo(L * 0.3, -W / 2); ctx.lineTo(L * 0.3, W / 2); ctx.stroke();
  }
  ctx.restore();

  if (e.techo) {
    // barco tortuga: techo blindado con púas
    cascoEscalado(ctx, L, W, e.forma, 0.86, 0.72, e.techo);
    ctx.fillStyle = 'rgba(15,25,15,0.75)';
    for (let x = -L * 0.34; x <= L * 0.34; x += 7.5) {
      const fila = Math.round(x / 7.5);
      for (let y = -W * 0.26 + (fila % 2 ? 3 : 0); y <= W * 0.27; y += 6) {
        if ((x * x) / (L * L * 0.17) + (y * y) / (W * W * 0.11) > 1) continue;
        ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(20,35,20,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-L * 0.4, 0); ctx.lineTo(L * 0.4, 0); ctx.stroke();
  } else if (e.torre) {
    // castillo de madera en el centro
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-L * 0.3 + 2, -W * 0.33 + 2, L * 0.56, W * 0.66);
    ctx.fillStyle = e.torre;
    ctx.fillRect(-L * 0.3, -W * 0.33, L * 0.56, W * 0.66);
    ctx.strokeStyle = '#2a1c12';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-L * 0.3, -W * 0.33, L * 0.56, W * 0.66);
    ctx.lineWidth = 0.8;
    for (let x = -L * 0.3 + 6; x < L * 0.26; x += 6) { ctx.beginPath(); ctx.moveTo(x, -W * 0.33); ctx.lineTo(x, -W * 0.33 + 3); ctx.moveTo(x, W * 0.33); ctx.lineTo(x, W * 0.33 - 3); ctx.stroke(); }
  } else {
    // escotilla con enjaretado y cabrestante
    const ex = -L * 0.08;
    ctx.fillStyle = '#4a2e14';
    ctx.fillRect(ex - 6, -4, 12, 8);
    ctx.strokeStyle = 'rgba(210,170,110,0.55)';
    ctx.lineWidth = 0.7;
    for (let k = -4; k <= 4; k += 4) { ctx.beginPath(); ctx.moveTo(ex + k, -4); ctx.lineTo(ex + k, 4); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(ex - 6, 0); ctx.lineTo(ex + 6, 0); ctx.stroke();
    ctx.fillStyle = '#6b4320';
    ctx.beginPath(); ctx.arc(L * 0.36, 0, 2.6, 0, TAU); ctx.fill();
  }

  // escudos en las bordas
  if (e.escudos) {
    const n = Math.max(4, Math.round(L / 9));
    for (let i = 0; i < n; i++) {
      const f = -0.36 + (0.72 * i) / (n - 1), x = f * L;
      const y = W * 0.5 * Math.sqrt(Math.max(0, 1 - (f / 0.56) ** 2)) * 0.98;
      for (const lado of [-1, 1]) {
        ctx.fillStyle = e.escudos[i % e.escudos.length];
        ctx.beginPath(); ctx.arc(x, lado * y, 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d9d2c0';
        ctx.beginPath(); ctx.arc(x, lado * y, 1, 0, TAU); ctx.fill();
      }
    }
  }

  // cañones: tubo oscuro con boca más clara
  const porLado = b.diseno.canones / 2;
  const grosor = b.diseno.municion === 'pesada' ? 4.6 : 3.2;
  for (let i = 0; i < porLado; i++) {
    const off = porLado === 1 ? 0 : (-0.32 + (0.64 * i) / (porLado - 1)) * L;
    for (const lado of [-1, 1]) {
      const y0 = lado * W * 0.3, y1 = lado * (W * 0.5 + 3.5);
      ctx.fillStyle = '#6b4320';
      ctx.fillRect(off - grosor / 2 - 1, Math.min(y0, lado * W * 0.38), grosor + 2, W * 0.08);
      ctx.fillStyle = '#1b1b1f';
      ctx.fillRect(off - grosor / 2, Math.min(y0, y1), grosor, Math.abs(y1 - y0));
      ctx.fillStyle = '#55555c';
      ctx.fillRect(off - grosor / 2, y1 - (lado > 0 ? 1.6 : 0), grosor, 1.6);
    }
  }

  // bauprés y foque
  const abiertas = b.velas / 3;
  if (e.forma === 'galeon') {
    ctx.strokeStyle = '#3d2310';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L * 0.4, 0); ctx.lineTo(L * 0.66, 0); ctx.stroke();
    if (b.velas > 0) {
      ctx.fillStyle = e.vela;
      ctx.beginPath(); ctx.moveTo(L * 0.64, 0); ctx.lineTo(L * 0.36, 0); ctx.quadraticCurveTo(L * 0.46, W * 0.22 * abiertas + 2, L * 0.64, 0); ctx.fill();
    }
  }
  // mascarón: cabeza de dragón
  if (e.dragon) {
    ctx.fillStyle = e.dragon;
    ctx.beginPath(); ctx.ellipse(L * 0.55, 0, 5, 3.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(L * 0.56, -1.6, 0.9, 0, TAU); ctx.arc(L * 0.56, 1.6, 0.9, 0, TAU); ctx.fill();
  }

  // jarcia: cabos del palo a proa y popa
  const n = s.mastiles;
  const posMastil = (m) => (n === 1 ? L * 0.05 : (-0.26 + (0.5 * m) / (n - 1)) * L);
  ctx.strokeStyle = 'rgba(40,25,10,0.35)';
  ctx.lineWidth = 0.7;
  for (let m = 0; m < n; m++) {
    const mx = posMastil(m);
    ctx.beginPath();
    ctx.moveTo(mx, 0); ctx.lineTo(L * 0.46, 0);
    ctx.moveTo(mx, 0); ctx.lineTo(-L * 0.44, -W * 0.3);
    ctx.moveTo(mx, 0); ctx.lineTo(-L * 0.44, W * 0.3);
    ctx.stroke();
  }

  // palos y velas
  const colorVela = b.colorVela || e.vela;
  for (let m = 0; m < n; m++) {
    const mx = posMastil(m);
    const principal = m === Math.floor(n / 2);
    const alto = W * (principal ? 1.55 : 1.28);
    dibujarVela(ctx, e, mx, alto, abiertas, colorVela, principal);
    ctx.fillStyle = '#3d2310';
    ctx.beginPath(); ctx.arc(mx, 0, 2.8, 0, TAU); ctx.fill();
    if (principal) { // cofa
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(mx, 0, 4.2, 0, TAU); ctx.stroke();
    }
  }

  if (imagenes.size > 160) for (const k of [...imagenes.keys()].slice(0, 20)) imagenes.delete(k); // las más viejas primero
  imagenes.set(clave, img);
  return img;
}

// El barco con volumen: se toma su dibujo tal cual está y se lo ilumina como si tuviera relieve. La altura sale del propio dibujo
// (el casco se redondea hacia la borda y lo claro, como las velas, queda más alto), y la luz es la del escenario. Como el barco
// gira y la luz no, hay una versión por cada dirección de luz (24), armada la primera vez que hace falta.
const relieves = new WeakMap(), CUBOS = 12, presupuestoLuz = { t: 0, n: 0 }; // 12 direcciones de luz: de a 30°, no se nota el salto y gasta la mitad de memoria
function imagenLuz(img, rel) {
  let r = relieves.get(img);
  if (!r) relieves.set(img, r = { v: [] });
  const cubo = ((Math.round((rel / TAU) * CUBOS) % CUBOS) + CUBOS) % CUBOS;
  if (r.v[cubo]) return r.v[cubo];
  // armar una dirección cuesta unos milisegundos: se arman pocas por cuadro y, mientras, se usa la más cercana que ya esté
  const ahora = performance.now();
  if (ahora - presupuestoLuz.t > 12) { presupuestoLuz.t = ahora; presupuestoLuz.n = 0; }
  if (presupuestoLuz.n >= 2) {
    for (let d = 1; d <= CUBOS / 2; d++) { const a = r.v[(cubo + d) % CUBOS] || r.v[(cubo - d + CUBOS) % CUBOS]; if (a) return a; }
    return img;
  }
  presupuestoLuz.n++;
  const w = img.width, h = img.height, n = w * h;
  let datos;
  try { datos = img.getContext('2d').getImageData(0, 0, w, h); } catch { return img; }
  const d = datos.data;
  if (!r.alt) {
    // alto de cada punto: la silueta desenfocada (casco redondeado) más lo claro del dibujo
    const A = new Float32Array(n), B = new Float32Array(n), Lm = new Float32Array(n);
    for (let k = 0; k < n; k++) { A[k] = d[k * 4 + 3] / 255; Lm[k] = ((d[k * 4] * 0.3 + d[k * 4 + 1] * 0.55 + d[k * 4 + 2] * 0.15) / 255) * A[k]; }
    const pasada = (S, Dn, R, paso) => { // desenfoque parejo en una dirección
      const largo = paso === 1 ? w : h, otros = paso === 1 ? h : w;
      for (let o = 0; o < otros; o++) {
        let suma = 0;
        const en = (q) => S[paso === 1 ? o * w + q : q * w + o];
        for (let q = -R; q <= R; q++) suma += q >= 0 && q < largo ? en(q) : 0;
        for (let q = 0; q < largo; q++) {
          Dn[paso === 1 ? o * w + q : q * w + o] = suma / (2 * R + 1);
          suma += (q + R + 1 < largo ? en(q + R + 1) : 0) - (q - R >= 0 ? en(q - R) : 0);
        }
      }
    };
    const R = Math.max(3, Math.round(h * 0.045));
    pasada(A, B, R, 1); pasada(B, A, R, 2); pasada(A, B, R, 1); pasada(B, A, R, 2);
    const L2 = new Float32Array(n); pasada(Lm, B, 1, 1); pasada(B, L2, 1, 2);
    r.alt = new Float32Array(n); r.borde = A;
    for (let k = 0; k < n; k++) r.alt[k] = A[k] * R * 1.5 + L2[k] * 3.4;
  }
  const H = r.alt, lx = Math.cos(cubo / CUBOS * TAU), ly = Math.sin(cubo / CUBOS * TAU);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const k = y * w + x, o = k * 4;
    if (!d[o + 3]) continue;
    const gx = (H[k + 1] - H[k - 1]) * 0.5, gy = (H[k + w] - H[k - w]) * 0.5;
    let luz = 1 - 1.05 * (gx * lx + gy * ly);
    luz = Math.max(0.46, Math.min(1.5, luz)) * (0.70 + 0.30 * Math.min(1, r.borde[k] * 1.5));
    luz *= 0.95 + 0.10 * hash2(x >> 4, y >> 1) + 0.05 * hash2(x, y); // veta de la madera y grano de la tela
    const cal = luz > 1 ? (luz - 1) * 26 : 0; // lo que da la luz tira a cálido
    const gris = d[o] * 0.3 + d[o + 1] * 0.55 + d[o + 2] * 0.15, sat = 0.80; // colores un poco menos chillones
    d[o] = gris + (d[o] - gris) * sat; d[o + 1] = gris + (d[o + 1] - gris) * sat; d[o + 2] = gris + (d[o + 2] - gris) * sat;
    d[o] = Math.min(255, d[o] * luz + cal); d[o + 1] = Math.min(255, d[o + 1] * luz + cal * 0.6); d[o + 2] = Math.min(255, d[o + 2] * (luz > 1 ? luz : 0.94 * luz + 0.06));
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').putImageData(datos, 0, 0);
  return (r.v[cubo] = c);
}

export function dibujarBarco(ctx, b, opciones = {}) {
  const s = b.stats, L = s.largo, W = s.ancho;
  const e = (FACCIONES[b.diseno.faccion] || FACCIONES.espanoles).estilo;
  const T = performance.now() / 1000;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  if (b.hundiendo) {
    const f = Math.min(1, b.hundiendo / 3);
    ctx.globalAlpha = 1 - f;
    ctx.scale(1 - f * 0.35, 1 - f * 0.35);
    ctx.rotate(f * 0.6);
  }
  let img = imagenBarco(b, e);
  if (!opciones.sinSombra && ARTE[b.diseno.faccion]) { // fuera del mar (astillero, puerto): la sombra de siempre, abajo a la derecha
    const so = sombraDe(img);
    ctx.save(); ctx.globalAlpha *= 0.5; ctx.drawImage(so, -so.width / (2 * ESCALA_IMG) + 4, -so.height / (2 * ESCALA_IMG) + 6, so.width / ESCALA_IMG, so.height / ESCALA_IMG); ctx.restore();
  }
  if (opciones.vaiven) ctx.scale(1 + 0.010 * Math.sin(T * 1.15 + b.id * 2.1), 1 + 0.022 * Math.sin(T * 0.85 + b.id * 1.3)); // cabeceo y rolido, apenas
  if (opciones.luz != null) img = imagenLuz(img, opciones.luz - b.a);
  // remos
  if (e.remos) {
    const n = Math.max(4, Math.round(L / 11));
    const rema = b.v > 12 ? Math.sin(T * 5 + b.id) * 0.32 : 0.1;
    ctx.strokeStyle = '#c8a877';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < n; i++) {
      const x = -L * 0.34 + (L * 0.6 * i) / (n - 1);
      for (const lado of [-1, 1]) {
        ctx.beginPath();
        const corto = ARTE[b.diseno.faccion] ? 1 : 0; // arte propio: remos cortos y perpendiculares al casco
        ctx.moveTo(x, lado * W * (corto ? 0.5 : 0.36));
        ctx.lineTo(x - Math.sin(rema) * W * (corto ? 0.3 : 0.5), lado * (W * (corto ? 0.5 : 0.36) + Math.cos(rema) * W * (corto ? 0.36 : 0.55)));
        ctx.stroke();
      }
    }
  }

  ctx.drawImage(img, -img.width / (2 * ESCALA_IMG), -img.height / (2 * ESCALA_IMG), img.width / ESCALA_IMG, img.height / ESCALA_IMG);

  // farol y, en el asta de popa, la bandera entera de la civilización de su equipo (un barco capturado lleva la tuya).
  // Se dibuja en tiras verticales que suben y bajan un poco para que flamee. Amigo o enemigo lo dice el color de la barra de vida.
  if (!opciones.sinFarol) { ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(-L * 0.47, 0, 1.6, 0, TAU); ctx.fill(); } // en el mar, los faroles los pone dibujarLuces
  const fac = faccionDe(b), BW = 24, BH = 16, TIRAS = 6, x0 = -L * 0.5 - BW - 1;
  ctx.fillStyle = '#3a2614'; ctx.fillRect(-L * 0.5 - 1.5, -BH / 2 - 1.5, 2, BH + 3); // asta
  for (let i = 0; i < TIRAS; i++) {
    const w = BW / TIRAS, k = (i + 1) / TIRAS, dy = Math.sin(T * 6 + b.id - i * 0.9) * 1.6 * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 + (TIRAS - 1 - i) * w - 0.15, -BH / 2 + dy, w + 0.3, BH); ctx.clip();
    ctx.translate(x0, -BH / 2 + dy);
    dibujarBandera(ctx, fac, BW, BH);
    ctx.restore();
  }
  ctx.restore();

  if (opciones.sinBarra || b.hundiendo) return;
  dibujarRotulo(ctx, b, opciones);
}

// Las barras de vida y tripulación y el nombre. Van aparte del barco para pintarlas después del velo de color del escenario:
// así de noche o con tormenta se leen igual que de día.
export function dibujarRotulo(ctx, b, opciones = {}) {
  const s = b.stats, L = s.largo;
  // barras de vida y tripulación
  const ancho = Math.max(36, L * 0.7), x = b.x - ancho / 2, y = b.y - L * 0.5 - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 1, y - 1, ancho + 2, 10);
  const fv = Math.max(0, b.vida / s.vidaMax);
  ctx.fillStyle = b.rival ? '#e5484d' : '#3ecf5e';
  ctx.fillRect(x, y, ancho * fv, 5);
  ctx.fillStyle = '#e8c16a';
  ctx.fillRect(x, y + 6, ancho * Math.max(0, Math.min(1, b.trip / s.tripMax)), 2);
  if (graficos().formas) { // amigo o enemigo también por la forma: rombo rojo con cruz = enemigo, círculo verde = de los tuyos
    const mx = x + ancho + 8, my = y + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.strokeStyle = b.rival ? '#ff8b8f' : '#8df0a5'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (b.rival) { ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath(); }
    else ctx.arc(mx, my, 5, 0, TAU);
    ctx.fill(); ctx.stroke();
    if (b.rival) { ctx.beginPath(); ctx.moveTo(mx - 2.4, my - 2.4); ctx.lineTo(mx + 2.4, my + 2.4); ctx.moveTo(mx + 2.4, my - 2.4); ctx.lineTo(mx - 2.4, my + 2.4); ctx.stroke(); }
  }
  if ((b.rival || b.bando === 'enemigo') && opciones.etiqueta) {
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const rotulo = tx(b.nombre);
    ctx.fillText(rotulo, b.x + 1, y - 4);
    ctx.fillStyle = b.esJugador ? '#ffd166' : '#fff';
    ctx.fillText(rotulo, b.x, y - 5);
    const mitad = ctx.measureText(rotulo).width / 2;
    ctx.save();
    ctx.translate(b.x - mitad - 16, y - 13.5);
    dibujarBandera(ctx, faccionDe(b), 12, 8.5);
    ctx.restore();
  }
}

function trazarIsla(ctx, isla, escala, recto) {
  const p = isla.puntos, n = p.length;
  const pt = (k) => {
    const q = p[(k + n) % n];
    return [isla.x + Math.cos(q.ang) * isla.r * q.f * escala, isla.y + Math.sin(q.ang) * isla.r * q.f * escala];
  };
  ctx.beginPath();
  if (recto) {
    for (let k = 0; k < n; k++) { const [x, y] = pt(k); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath();
    return;
  }
  let [x0, y0] = pt(0), [x1, y1] = pt(1);
  ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
  for (let k = 1; k <= n; k++) {
    const [cx, cy] = pt(k), [nx, ny] = pt(k + 1);
    ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
  }
  ctx.closePath();
}

function colorMar(TONOS_MAR, f) {
  f = Math.max(0, Math.min(1, f));
  for (let k = 1; k < TONOS_MAR.length; k++) {
    const a = TONOS_MAR[k - 1], b = TONOS_MAR[k];
    if (f <= b[0]) {
      const u = (f - a[0]) / (b[0] - a[0]);
      return `rgb(${Math.round(a[1] + (b[1] - a[1]) * u)},${Math.round(a[2] + (b[2] - a[2]) * u)},${Math.round(a[3] + (b[3] - a[3]) * u)})`;
    }
  }
  const u = TONOS_MAR[TONOS_MAR.length - 1];
  return `rgb(${u[1]},${u[2]},${u[3]})`;
}

// Equipo de un barco: en línea lo dice el servidor; en modo solo, la simulación
const equipoEn = (b) => b.equipoSrv || equipoDe(b);
// Civilización cuya bandera lleva un barco: la de su equipo (un barco capturado pasa a llevar la tuya)
function faccionDe(b) {
  const eq = equipoEn(b);
  return FACCIONES[eq] ? eq : b.diseno.faccion;
}

// Viento: rayas blancas que corren hacia donde sopla. Fuera de las ráfagas son pocas y tenues;
// adentro son muchas, largas y brillantes, y el agua se ve un poco más clara.
function dibujarViento(ctx, j, x0, y0, vw, vh, tAgua, espumaColor, conAgua) {
  const v = j.viento, C = 150, RECORRIDO = 420;
  ctx.fillStyle = conAgua ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.045)'; // con el agua nueva la ráfaga ya se ve rizada: acá queda apenas el contorno
  for (const g of v.rafagas) {
    if (g.x + g.r < x0 || g.x - g.r > x0 + vw || g.y + g.r < y0 || g.y - g.r > y0 + vh) continue;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r * 0.7, 0, TAU); ctx.fill();
  }
  // rachas: un soplo corto, bien visible, con flechas hacia donde empuja; se apaga cuando se termina
  for (const k of v.rachas || []) {
    if (k.x + k.r < x0 || k.x - k.r > x0 + vw || k.y + k.r < y0 || k.y - k.r > y0 + vh) continue;
    const vida = Math.min(1, k.t / 1.2), kx = Math.cos(k.a), ky = Math.sin(k.a);
    ctx.globalAlpha = 0.1 * vida; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.55 * vida; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 9]); ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    for (let q = 0; q < 7; q++) {
      const lado = (q - 3) * k.r * 0.24, fase = (j.t * 0.9 + q * 0.37) % 1, largo = Math.sqrt(Math.max(0, k.r * k.r - lado * lado)) * 0.9;
      const px = k.x - ky * lado + kx * (fase * 2 - 1) * largo, py = k.y + kx * lado + ky * (fase * 2 - 1) * largo;
      ctx.globalAlpha = Math.sin(fase * Math.PI) * 0.85 * vida;
      ctx.strokeStyle = '#ffe9a8';
      ctx.beginPath(); ctx.moveTo(px - kx * 34, py - ky * 34); ctx.lineTo(px, py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - kx * 11 - ky * 8, py - ky * 11 + kx * 8); ctx.lineTo(px, py); ctx.lineTo(px - kx * 11 + ky * 8, py - ky * 11 - kx * 8); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // Hilos de espuma que el viento arrastra: curvos, irregulares, y se deshacen. Cada uno sigue el viento de su zona, así se ven las
  // curvas. Fuera de las ráfagas son pocos y tenues; adentro, más, más largos y más claros (es la pista para leer la ráfaga).
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = espumaColor;
  for (let gx = Math.floor((x0 - RECORRIDO) / C); gx <= Math.floor((x0 + vw + RECORRIDO) / C); gx++) {
    for (let gy = Math.floor((y0 - RECORRIDO) / C); gy <= Math.floor((y0 + vh + RECORRIDO) / C); gy++) {
      const h = hash2(gx + 7, gy - 3), h2 = hash2(gy + 31, gx + 57);
      const fase = (tAgua * 0.22 + h * 7) % 1;
      const al = vientoEn(j, gx * C, gy * C), cx = Math.cos(al), cy = Math.sin(al);
      const px = gx * C + h2 * C + cx * (fase - 0.5) * RECORRIDO, py = gy * C + h * C + cy * (fase - 0.5) * RECORRIDO;
      if (px < x0 - 90 || px > x0 + vw + 90 || py < y0 - 90 || py > y0 + vh + 90) continue;
      let enRafaga = false;
      for (const g of v.rafagas) if (Math.abs(g.x - px) < g.r && Math.hypot(g.x - px, g.y - py) < g.r) { enRafaga = true; break; }
      if (h2 > (enRafaga ? 0.62 : 0.30)) continue;
      const largo = (enRafaga ? 60 : 36) * (0.7 + h * 0.6), comba = (h * 2 - 1) * (enRafaga ? 30 : 20), vida = Math.sin(fase * Math.PI);
      // tres tramos, cada vez más finos y más tenues hacia la cola
      const en = (u) => { const lado = Math.sin(u * 3.1 + h * 6.28 + tAgua * 0.5) * comba * 0.5 + comba * u * u; return [px - cx * largo * u - cy * lado, py - cy * largo * u + cx * lado]; };
      for (let k = 0; k < 3; k++) {
        const u0 = k / 3, u1 = (k + 1) / 3;
        const [ax, ay] = en(u0), [mx, my] = en((u0 + u1) / 2), [bx, by] = en(u1);
        ctx.globalAlpha = vida * (enRafaga ? 0.34 : 0.22) * (1 - u0 * 0.75);
        ctx.lineWidth = (enRafaga ? 2.4 : 1.6) * (1 - u0 * 0.55);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx * 2 - (ax + bx) / 2, my * 2 - (ay + by) / 2, bx, by); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

// Estelas. Son solo dibujo y se arman acá, en cada pantalla, con el camino que va dejando cada barco (la simulación no las conoce,
// así que en línea no viaja nada). Cada barco deja: espuma revuelta detrás de la popa, que se ensancha y se disuelve; dos brazos
// en V que nacen en la proa y se abren como una ola; y el bigote de espuma en la proa. Todo crece con la velocidad y con el
// tamaño del casco, y un barco quieto no deja nada.
const caminos = new WeakMap();
const DURA_ESTELA = 4.4, BANDAS = 4;
function dibujarEstelas(ctx, j, visible, color) {
  const ahora = j.t;
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of j.barcos) {
    let c = caminos.get(b);
    if (!c) caminos.set(b, c = { pts: [], t: ahora });
    const pts = c.pts, L = b.stats.largo, W = b.stats.ancho, ca = Math.cos(b.a), sa = Math.sin(b.a);
    const u = pts[pts.length - 1];
    if (ahora < c.t || (u && Math.hypot(b.x - u.x, b.y - u.y) > 300)) pts.length = 0; // otra partida, o el barco reapareció lejos
    c.t = ahora;
    if (!b.hundiendo && (!pts.length || Math.hypot(b.x - pts[pts.length - 1].x, b.y - pts[pts.length - 1].y) > 7)) {
      pts.push({ x: b.x, y: b.y, t: ahora, f: Math.max(0, Math.min(1, (Math.abs(b.v) - 14) / 105)), nx: -sa, ny: ca, ca, sa });
    }
    while (pts.length && ahora - pts[0].t > DURA_ESTELA) pts.shift();
    if (pts.length < 2 || !visible(b.x, b.y, 460)) continue;
    const n = pts.length, abre = 0.20 * Math.max(40, Math.abs(b.v)) * DURA_ESTELA; // cuánto se abre la V en toda su vida

    // espuma revuelta detrás de la popa: tramo por tramo, así se disuelve sin escalones
    for (let i = 0; i < n - 1; i++) {
      const p = pts[i], q = pts[i + 1], e = (ahora - p.t) / DURA_ESTELA, eq = (ahora - q.t) / DURA_ESTELA;
      if (p.f + q.f < 0.04) continue;
      const wp = (W * 0.24 + e * W * 0.62) * (0.45 + 0.55 * p.f) * (1 + 0.16 * Math.sin(i * 1.9 + b.id)), wq = (W * 0.24 + eq * W * 0.62) * (0.45 + 0.55 * q.f) * (1 + 0.16 * Math.sin((i + 1) * 1.9 + b.id));
      const px = p.x - p.ca * L * 0.44, py = p.y - p.sa * L * 0.44, qx = q.x - q.ca * L * 0.44, qy = q.y - q.sa * L * 0.44;
      ctx.globalAlpha = Math.pow(1 - e, 1.5) * 0.46 * Math.min(1, (p.f + q.f) * 1.5);
      ctx.beginPath();
      ctx.moveTo(px + p.nx * wp, py + p.ny * wp); ctx.lineTo(qx + q.nx * wq, qy + q.ny * wq);
      ctx.lineTo(qx - q.nx * wq, qy - q.ny * wq); ctx.lineTo(px - p.nx * wp, py - p.ny * wp); ctx.closePath();
      ctx.fill();
    }
    for (let banda = 0; banda < BANDAS; banda++) {
      const e0 = banda / BANDAS, e1 = (banda + 1) / BANDAS, em = (e0 + e1) / 2;
      // los brazos de la V (uno ancho y, más adentro, otro fino), que nacen en la proa
      for (const [parte, grosor, fuerza] of [[1, 2.4, 0.56], [0.45, 1.4, 0.30]]) {
        ctx.globalAlpha = Math.pow(1 - em, 1.35) * fuerza;
        ctx.lineWidth = grosor * (1 + em * 1.4);
        ctx.beginPath();
        let hay = false;
        for (const lado of [-1, 1]) {
          let sigue = false;
          for (let i = 0; i < n; i++) {
            const p = pts[i], e = (ahora - p.t) / DURA_ESTELA;
            if (e < e0 - 0.02 || e >= e1 + 0.02 || p.f < 0.03) { sigue = false; continue; }
            const d = lado * (W * 0.42 + e * abre * parte * (0.5 + 0.5 * p.f) + Math.sin(i * 1.3 + b.id * 2.1 + lado) * 1.6 * e * 3);
            const x = p.x + p.ca * L * 0.40 + p.nx * d, y = p.y + p.sa * L * 0.40 + p.ny * d;
            if (sigue) ctx.lineTo(x, y); else ctx.moveTo(x, y);
            sigue = true; hay = true;
          }
        }
        if (hay) ctx.stroke();
      }
    }
    // el bigote: la espuma que levanta la proa, pegada al casco
    const f = b.hundiendo ? 0 : Math.max(0, Math.min(1, (Math.abs(b.v) - 14) / 105));
    if (f > 0.03) {
      const bx = b.x + ca * L * 0.49, by = b.y + sa * L * 0.49;
      ctx.globalAlpha = 0.25 + 0.45 * f;
      ctx.lineWidth = 1.6 + 1.6 * f;
      ctx.beginPath();
      for (const lado of [-1, 1]) {
        ctx.moveTo(bx + ca * 2, by + sa * 2);
        ctx.quadraticCurveTo(bx - ca * L * 0.05 - sa * lado * W * 0.36, by - sa * L * 0.05 + ca * lado * W * 0.36, bx - ca * L * (0.16 + 0.10 * f) - sa * lado * W * (0.60 + 0.25 * f), by - sa * L * (0.16 + 0.10 * f) + ca * lado * W * (0.60 + 0.25 * f));
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// La sombra de un barco: su propia imagen, toda oscura y con el borde blando. Se arma una vez por imagen.
const sombras = new WeakMap();
function sombraDe(img) {
  let so = sombras.get(img);
  if (so) return so;
  so = document.createElement('canvas');
  so.width = img.width; so.height = img.height;
  const x = so.getContext('2d');
  x.filter = 'blur(5px)'; // donde el navegador no lo tenga, la sombra sale con el borde neto
  x.drawImage(img, 0, 0);
  x.filter = 'none';
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#020a12';
  x.fillRect(0, 0, so.width, so.height);
  sombras.set(img, so);
  return so;
}

// Un resplandor: mancha redonda que se apaga hacia el borde. Se arma una vez por color y después solo se estampa.
const resplandores = new Map();
function resplandor(color) {
  let c = resplandores.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  const n = parseInt(color.slice(1), 16), rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.12, `rgba(${rgb},0.62)`); g.addColorStop(0.38, `rgba(${rgb},0.20)`); g.addColorStop(0.70, `rgba(${rgb},0.05)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  resplandores.set(color, c);
  return c;
}

// Las luces cálidas del mar. Van sumadas (aclaran lo que tienen debajo) y encima del velo del escenario, así de noche son lo
// que más se ve: sirven para ubicar barcos en lo oscuro. esc.faroles dice cuánto se notan (casi nada de mañana, mucho de noche).
// Cada barco trae sus puntos de luz de src/luces.js. Un cañonazo ilumina un momento el agua y los barcos de alrededor.
const vistos = new WeakSet();
function dibujarLuces(ctx, j, visible, esc) {
  const T = performance.now() / 1000, F = esc.faroles;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const fuerza = Math.min(1, 0.10 + 0.20 * F), radio = 34 + 9 * Math.min(4, F);
  if (F > 0.05) {
    for (const b of j.barcos) {
      if (b.hundiendo || !visible(b.x, b.y, 200)) continue;
      const L = b.stats.largo, W = b.stats.ancho, ca = Math.cos(b.a), sa = Math.sin(b.a);
      const luces = lucesDe(b.diseno.faccion, b.diseno.casco);
      for (let k = 0; k < luces.length; k++) {
        const l = luces[k], x = b.x + ca * l.x * L - sa * l.y * W, y = b.y + sa * l.x * L + ca * l.y * W;
        const llama = 1 + 0.07 * Math.sin(T * 9.1 + b.id * 1.7 + k * 2.3) + 0.05 * Math.sin(T * 23 + b.id + k); // parpadeo muy leve
        const r = radio * l.r * (0.96 + 0.04 * llama), img = resplandor(l.color || COLOR_FAROL);
        ctx.globalAlpha = Math.min(1, fuerza * l.i * llama);
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = Math.min(1, 0.55 + 0.12 * F); // el farol en sí: un punto chico y vivo
        ctx.drawImage(img, x - 3.2, y - 3.2, 6.4, 6.4);
      }
    }
    // el puerto: los faroles del muelle
    const p = j.mundo.puerto;
    if (visible(p.x, p.y, 200)) {
      const img = resplandor(COLOR_FAROL);
      for (const [dx, dy] of [[-30, -37], [30, -37], [0, -80]]) {
        const llama = 1 + 0.06 * Math.sin(T * 8 + dx);
        ctx.globalAlpha = Math.min(1, fuerza * 1.1 * llama);
        ctx.drawImage(img, p.x + dx - radio * 1.2, p.y + dy - radio * 1.2, radio * 2.4, radio * 2.4);
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, p.x + dx - 3.5, p.y + dy - 3.5, 7, 7);
      }
    }
    // el oro que flota brilla un poco
    const oro = resplandor('#ffd166');
    ctx.globalAlpha = Math.min(0.5, 0.06 + 0.07 * F);
    for (const c of j.cofres) if (visible(c.x, c.y, 60)) ctx.drawImage(oro, c.x - 30, c.y - 30, 60, 60);
  }
  // las balas en vuelo: salen al rojo del cañón, así que de noche llevan un resplandor chico (de día casi no se nota)
  if (F > 0.6) {
    const brasa = resplandor('#ffb070');
    ctx.globalAlpha = Math.min(0.6, 0.10 + 0.11 * F);
    let nb = 0;
    for (const bl of j.balas) {
      if (!visible(bl.x, bl.y, 30) || ++nb > 80) continue;
      const fb = 1 - bl.vida / bl.vidaTotal, alt = Math.sin(fb * Math.PI) * 14, rb = 5 + bl.radio * 1.6;
      ctx.drawImage(brasa, bl.x - rb, bl.y - alt - rb, rb * 2, rb * 2);
    }
  }
  // cañonazos: un destello cálido que ilumina el agua y los barcos cercanos, y se apaga enseguida
  // (el fogonazo de la simulación dura un instante: acá se lo recuerda un poco más, para que la luz se llegue a ver)
  const fogon = resplandor(COLOR_FOGONAZO), destellos = j.destellos || (j.destellos = []);
  for (const pt of j.particulas) {
    if (pt.tipo !== 'fogonazo' || vistos.has(pt)) continue;
    vistos.add(pt);
    if (destellos.length < 60) destellos.push({ x: pt.x, y: pt.y, t: j.t });
  }
  for (let k = destellos.length - 1; k >= 0; k--) {
    const d = destellos[k], f = (j.t - d.t) / 0.38;
    if (f >= 1 || f < 0) { destellos.splice(k, 1); continue; }
    if (!visible(d.x, d.y, 160)) continue;
    const r = 70 + 90 * f;
    ctx.globalAlpha = Math.min(1, (1 - f) * (1 - f) * (0.42 + 0.10 * Math.min(3, F)));
    ctx.drawImage(fogon, d.x - r, d.y - r, r * 2, r * 2);
  }
  ctx.restore();
}

let remolinoListo = null;
function estampasRemolino() {
  if (remolinoListo) return remolinoListo;
  const N = 320, ru = (px, py) => { const xi = Math.floor(px), yi = Math.floor(py), fx = px - xi, fy = py - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const sua = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hacer = (interior) => {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), im = x.createImageData(N, N), d = im.data;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const dx = (px - N / 2) / (N / 2), dy = (py - N / 2) / (N / 2), r = Math.hypot(dx, dy);
      if (r >= 1) continue;
      const a = Math.atan2(dy, dx), brazos = interior ? 5 : 3, vuelta = interior ? 5.2 : 3.4;
      // la espiral: el ángulo se corre con la distancia al centro; el ruido la rompe en manchones de espuma
      const fase = (a / TAU) * brazos - Math.pow(r, 0.75) * vuelta, f = fase - Math.floor(fase);
      const cresta = 1 - Math.abs(f - 0.5) * 2, lx = Math.cos(a - r * 4) * (2 + r * 9), ly = Math.sin(a - r * 4) * (2 + r * 9);
      const rota = 0.45 + 0.75 * ru(lx * 1.5 + 30, ly * 1.5 + r * 7), grano = ru(px / 3.1, py / 3.1);
      let espuma, oscuro;
      if (interior) {
        espuma = sua(0.80, 0.97, cresta * rota) * sua(0.06, 0.2, r) * (1 - sua(0.55, 1, r)) * (0.65 + 0.5 * grano) * 0.95;
        oscuro = Math.pow(1 - sua(0, 0.36, r), 1.5) * 0.55; // el ojo, bien hondo
      } else {
        espuma = sua(0.52, 0.95, cresta * rota) * sua(0.16, 0.42, r) * (1 - sua(0.62, 1, r)) * (0.55 + 0.6 * grano) * 0.62;
        espuma += sua(0.86, 0.95, cresta) * sua(0.35, 0.6, r) * (1 - sua(0.7, 0.98, r)) * 0.22; // el filo de cada banda
        oscuro = Math.pow(1 - r, 1.35) * 0.80 * (0.86 + 0.14 * cresta);
      }
      espuma = Math.min(1, espuma);
      const alfa = 1 - (1 - oscuro) * (1 - espuma), ke = alfa > 0 ? espuma / (espuma + oscuro * (1 - espuma) + 1e-6) : 0, o = (py * N + px) * 4;
      d[o] = 4 + (236 - 4) * ke; d[o + 1] = 20 + (244 - 20) * ke; d[o + 2] = 34 + (246 - 34) * ke; d[o + 3] = alfa * 255;
    }
    x.putImageData(im, 0, 0);
    return c;
  };
  return (remolinoListo = [hacer(false), hacer(true)]);
}

let olaLista = null;
function estampaOla() {
  if (olaLista) return olaLista;
  olaLista = document.createElement('canvas'); olaLista.width = 108; olaLista.height = 48;
  const x = olaLista.getContext('2d');
  x.scale(3, 3); x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.lineCap = 'round';
  x.beginPath(); x.moveTo(2, 8); x.quadraticCurveTo(10, 3, 18, 8); x.quadraticCurveTo(26, 13, 34, 8); x.stroke();
  return olaLista;
}

// Nubes y niebla: una mancha blanda hecha una sola vez, que después se estampa grande y casi transparente.
let manchaBase = null;
const manchas = new Map();
function mancha(color) {
  let c = manchas.get(color);
  if (c) return c;
  if (!manchaBase) {
    manchaBase = document.createElement('canvas'); manchaBase.width = manchaBase.height = 128;
    const x = manchaBase.getContext('2d'), im = x.createImageData(128, 128);
    const r2 = (px, py) => { const xi = Math.floor(px), yi = Math.floor(py), fx = px - xi, fy = py - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi), b = hash2(xi + 1, yi), cc = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v; };
    for (let py = 0; py < 128; py++) for (let px = 0; px < 128; px++) {
      const n = r2(px / 30 + 3, py / 30 + 9) * 0.55 + r2(px / 13, py / 13) * 0.3 + r2(px / 6, py / 6) * 0.15;
      const borde = Math.max(0, 1 - Math.hypot(px - 64, py - 64) / 64), a = Math.max(0, Math.min(1, (n - 0.30) * 2.2)) * borde * borde * (3 - 2 * borde);
      const o = (py * 128 + px) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = 255; im.data[o + 3] = a * 255;
    }
    x.putImageData(im, 0, 0);
  }
  c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.drawImage(manchaBase, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, 128, 128);
  if (manchas.size > 24) manchas.clear();
  manchas.set(color, c);
  return c;
}
// Una capa de manchas que el viento arrastra. paralaje > 1: está más alta que el mar y se corre más que él cuando avanzás.
function capaManchas(ctx, img, x0, y0, vw, vh, camX, camY, t, viento, o) {
  const C = o.celda, px = o.paralaje - 1;
  const dx = Math.cos(viento) * t * o.vel - camX * px, dy = Math.sin(viento) * t * o.vel - camY * px;
  const ax = x0 - dx, ay = y0 - dy; // la capa vive en su propio sistema: punto de mundo = punto de capa + corrimiento
  for (let gy = Math.floor(ay / C) - 1; gy <= Math.floor((ay + vh) / C) + 1; gy++) for (let gx = Math.floor(ax / C) - 1; gx <= Math.floor((ax + vw) / C) + 1; gx++) {
    const h = hash2(gx + o.semilla, gy - o.semilla);
    if (h > o.cuantas) continue;
    const h2 = hash2(gy + 31 + o.semilla, gx + 17), tam = C * (0.9 + 0.9 * h2);
    const x = gx * C + hash2(gx, gy + 5) * C + dx, y = gy * C + hash2(gx + 5, gy) * C + dy;
    ctx.globalAlpha = o.fuerza * (0.55 + 0.45 * h2);
    ctx.drawImage(img, x - tam / 2, y - tam * 0.36, tam, tam * 0.72);
  }
  ctx.globalAlpha = 1;
}
// Gaviotas: viven alrededor del puerto, dando vueltas sobre el muelle y la costa. Cada una con cuerpo, cola, pico y alas de
// punta negra que baten; planean un rato y aletean otro. Abajo, su sombra sobre el agua.
function dibujarGaviotas(ctx, puerto, visible, t, fuerza) {
  if (!visible(puerto.x, puerto.y - 120, 520)) return;
  ctx.save();
  for (let k = 0; k < 9; k++) {
    const h = hash2(k, 77), h2 = hash2(77, k), giro = k % 2 ? 1 : -1;
    const cx = puerto.x + (h - 0.5) * 300, cy = puerto.y - 150 + (h2 - 0.5) * 260, radio = 70 + h * 190;
    const a = giro * t * (0.20 + h2 * 0.16) + k * 2.4, x = cx + Math.cos(a) * radio, y = cy + Math.sin(a) * radio * 0.72;
    const rumbo = Math.atan2(Math.cos(a) * 0.72 * giro, -Math.sin(a) * giro);
    const ciclo = (t * 0.22 + h * 5) % 1, bate = ciclo < 0.55 ? Math.sin(t * (9 + h * 3) + k) : 0.25; // aletea un rato y planea otro
    const tam = 0.85 + h2 * 0.45, ala = 9.5 * tam * (0.80 + 0.20 * bate), codo = 2.2 * tam * bate;
    const pintar = (sombra) => {
      const gris = sombra ? 'rgba(2,12,22,0.20)' : '#c9cfd6', blanco = sombra ? 'rgba(2,12,22,0.20)' : '#f7f8f6', negro = sombra ? 'rgba(2,12,22,0.20)' : '#23272c';
      for (const s of [-1, 1]) { // alas: brazo gris, punta negra, con el codo adelantado
        ctx.fillStyle = gris;
        ctx.beginPath(); ctx.moveTo(1.6 * tam, s * 0.8 * tam); ctx.quadraticCurveTo(3.2 * tam + codo, s * ala * 0.5, 0.4 * tam, s * ala);
        ctx.quadraticCurveTo(-0.6 * tam + codo * 0.4, s * ala * 0.55, -1.8 * tam, s * 0.8 * tam); ctx.closePath(); ctx.fill();
        ctx.fillStyle = negro;
        ctx.beginPath(); ctx.moveTo(1.5 * tam + codo * 0.5, s * ala * 0.74); ctx.quadraticCurveTo(1.3 * tam, s * ala * 0.9, 0.4 * tam, s * ala); ctx.quadraticCurveTo(-0.1 * tam, s * ala * 0.86, -0.2 * tam + codo * 0.3, s * ala * 0.72); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = blanco;
      ctx.beginPath(); ctx.moveTo(-2.2 * tam, 0); ctx.lineTo(-5.2 * tam, -1.5 * tam); ctx.lineTo(-4.6 * tam, 0); ctx.lineTo(-5.2 * tam, 1.5 * tam); ctx.closePath(); ctx.fill(); // cola
      ctx.beginPath(); ctx.ellipse(0, 0, 3.4 * tam, 1.35 * tam, 0, 0, TAU); ctx.fill(); // cuerpo
      ctx.beginPath(); ctx.arc(3.3 * tam, 0, 1.15 * tam, 0, TAU); ctx.fill(); // cabeza
      if (!sombra) { ctx.fillStyle = '#e8a23a'; ctx.beginPath(); ctx.moveTo(4.2 * tam, -0.45 * tam); ctx.lineTo(5.9 * tam, 0); ctx.lineTo(4.2 * tam, 0.45 * tam); ctx.closePath(); ctx.fill(); } // pico
    };
    ctx.globalAlpha = fuerza;
    ctx.save(); ctx.translate(x + 9, y + 13); ctx.rotate(rumbo); ctx.scale(0.9, 0.9); pintar(true); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(rumbo); pintar(false); ctx.restore();
  }
  ctx.restore();
}

export function dibujarEscena(ctx, j, vista) {
  const { ancho, alto, raton } = vista;
  const yo = j.jugador;
  const miEquipo = equipoEn(yo);
  for (const b of j.barcos) b.rival = equipoEn(b) !== miEquipo; // barra roja = otro equipo, verde = el tuyo
  // la llegada desde el menú: la imagen sale de lo oscuro y la cámara, que arranca cerca del barco, se abre hasta su lugar
  if (j.entradaVista == null) j.entradaVista = performance.now();
  const kEntrada = Math.min(1, (performance.now() - j.entradaVista) / 2400), abre = 1 - Math.pow(1 - kEntrada, 3);
  const zoom = vista.zoom * (graficos().calma ? 1 : 1.30 - 0.30 * abre);
  vista.zoomDibujo = zoom; // main.js lo usa para pasar el ratón al mundo
  const sx = (Math.random() - 0.5) * (j.sacudon || 0), sy = (Math.random() - 0.5) * (j.sacudon || 0);
  const camX = yo.x + sx, camY = yo.y + sy;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(zoom, 0, 0, zoom, ancho / 2 - camX * zoom, alto / 2 - camY * zoom);
  const vw = ancho / zoom, vh = alto / zoom;
  const x0 = camX - vw / 2, y0 = camY - vh / 2;
  const visible = (x, y, m) => x > x0 - m && x < x0 + vw + m && y > y0 - m && y < y0 + vh + m;

  // El escenario (la luz, el color y el clima del inicio) y las preferencias de dibujo
  const pref = graficos();
  if (!j.escenaVista) j.escenaVista = escenaElegida();
  // la tormenta del Kraken: mientras está despierto el escenario se va corriendo al suyo, y cuando se va, vuelve de a poco
  const dtT = Math.max(0, Math.min(0.1, j.t - (j.tTormenta ?? j.t))); j.tTormenta = j.t;
  const kr = j.kraken, quiere = kr && !kr.muerte && !kr.sumerge ? 1 : 0;
  j.tormenta = (j.tormenta || 0) + (quiere - (j.tormenta || 0)) * Math.min(1, dtT * (quiere ? 0.5 : 0.35));
  const esc = entreEscenas(escenaPara(vista.escena || j.escenaVista, j.mundo.tema), escenaPara('kraken', j.mundo.tema), j.tormenta < 0.01 ? 0 : j.tormenta);
  j.lluviaVista = esc.lluvia; // para el sonido de la lluvia
  const luzX = Math.cos(esc.rumbo), luzY = Math.sin(esc.rumbo);
  const css = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
  const claro = Math.max(esc.luz[0], esc.luz[1], esc.luz[2]);
  const espumaColor = css([0.50 + 0.50 * esc.luz[0] / claro, 0.52 + 0.48 * esc.luz[1] / claro, 0.54 + 0.46 * esc.luz[2] / claro]);
  const tAgua = pref.calma ? j.t * 0.25 : j.t; // con "menos movimiento" el agua va cuatro veces más lenta

  // mar: más claro cerca del puerto, más oscuro mar adentro
  const p = j.mundo.puerto;
  // el oleaje sigue al viento, pero gira muy de a poco: si no, cada cambio de rumbo barrería todo el dibujo del agua
  const va = j.viento ? j.viento.a : -0.6;
  if (j.vientoAgua == null) j.vientoAgua = va;
  else j.vientoAgua += Math.max(-0.00012, Math.min(0.00012, difAng(va, j.vientoAgua))); // difAng(a, b) = a - b: hacia el viento
  const agua = pref.agua !== false && vista.agua && vista.agua.ok ? vista.agua : null;
  let conAgua = false;
  if (agua) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ancho, alto); ctx.restore();
    conAgua = agua.dibujar({ camX, camY, zoom, t: tAgua, puerto: p, viento: j.vientoAgua, escena: esc, lluvia: esc.lluvia, real: pref.aguaReal === true, islas: j.mundo.islas, rafagas: j.viento ? j.viento.rafagas : null });
  }
  if (vista.agua) vista.agua.lienzo.style.visibility = conAgua ? 'visible' : 'hidden';
  if (!conAgua) {
    // sin WebGL: el mar liso de siempre, con la paleta del escenario (un solo color por cuadro, según dónde estás)
    const f = Math.min(1, Math.hypot(camX - p.x, camY - p.y) / 3400);
    ctx.fillStyle = css([0, 1, 2].map((q) => (esc.medio[q] + (esc.hondo[q] - esc.medio[q]) * f) * 1.05));
    ctx.fillRect(x0 - 10, y0 - 10, vw + 20, vh + 20);
  }
  // olitas dibujadas: con el mar liso siempre, y también sobre el agua nueva cuando va en su versión dibujada
  if (!conAgua || pref.aguaReal !== true) {
    const olas = conAgua ? 0.6 : 1;
    // olitas: agrupadas en tres trazos según su brillo
    const C = 110;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    const grupos = [[], [], []];
    for (let gx = Math.floor(x0 / C); gx <= Math.floor((x0 + vw) / C); gx++) {
      for (let gy = Math.floor(y0 / C); gy <= Math.floor((y0 + vh) / C); gy++) {
        const h = hash2(gx, gy), h2 = hash2(gy + 91, gx - 17);
        const brillo = 0.5 + 0.5 * Math.sin(tAgua * 1.3 + h * 20);
        grupos[Math.min(2, Math.floor(brillo * 3))].push(gx * C + h * C + Math.sin(tAgua * 0.6 + h * 9) * 8, gy * C + h2 * C);
      }
    }
    // cada olita es una estampa hecha una sola vez (trazarlas una por una en cada cuadro costaba muchos cuadros por segundo)
    const ola = estampaOla();
    for (let g = 0; g < 3; g++) {
      const pts = grupos[g];
      ctx.globalAlpha = Math.min(1, (0.04 + g * 0.035) * olas * 1.15);
      for (let q = 0; q < pts.length; q += 2) ctx.drawImage(ola, pts[q] - 2, pts[q + 1] - 8, 36, 16);
    }
    ctx.globalAlpha = 1;
  }

  if (j.viento) dibujarViento(ctx, j, x0, y0, vw, vh, tAgua, espumaColor, conAgua);

  // borde del mundo
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, j.mundo.ancho - 80, j.mundo.alto - 80);
  ctx.setLineDash([]);

  // remolinos: un embudo oscuro con espuma que gira en espiral. Dos estampas hechas una sola vez: la de afuera (el embudo y
  // las bandas anchas) gira despacio y la de adentro (hilos finos de espuma) más rápido, como el agua de verdad
  for (const w of j.mundo.remolinos) {
    if (!visible(w.x, w.y, w.radio + 20)) continue;
    const [afuera, adentro] = estampasRemolino(), R = w.radio * 1.08, lento = pref.calma ? 0.3 : 1;
    for (const [img, vel, k] of [[afuera, 0.42, 1], [adentro, 1.15, 0.62]]) {
      ctx.save(); ctx.translate(w.x, w.y); ctx.scale(1, w.giro); ctx.rotate(-j.t * vel * lento);
      ctx.drawImage(img, -R * k, -R * k, 2 * R * k, 2 * R * k);
      ctx.restore();
    }
  }

  // tierras, por capas: así las manchas que se tocan forman una sola costa
  const tema = j.mundo.tema;
  const aLaVista = j.mundo.islas.filter((isla) => visible(isla.x, isla.y, isla.r * 1.6));
  let lisas = aLaVista; // las que se pintan lisas: todas sin relieve, o solo las que todavía no lo tienen armado
  const capa = (escala, color, soloTierra) => {
    ctx.fillStyle = color;
    for (const isla of lisas) {
      if (soloTierra && ESCOLLO[isla.tipo]) continue;
      trazarIsla(ctx, isla, isla.r > 300 ? 1 + (escala - 1) * (300 / isla.r) : escala);
      ctx.fill();
    }
  };
  if (conAgua) ctx.globalAlpha = 0.45; // con el agua nueva los bajíos ya los pinta ella: acá queda solo un refuerzo suave
  if (!conAgua) { capa(1.42, tema.bajos[0]); capa(1.24, tema.bajos[1]); } // con el agua nueva los bajíos los pinta ella, esfumados: sin bandas de borde duro
  ctx.globalAlpha = 1;
  // rompiente: dos líneas de espuma que llegan a la costa y se retiran, cada tierra a su ritmo
  ctx.lineJoin = 'round';
  ctx.strokeStyle = espumaColor;
  for (const isla of aLaVista) {
    if (isla.tipo === 'iceberg') { // al témpano el agua le lame el borde: un hilo de espuma fino y cortado
      ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.setLineDash([12, 7, 5, 9]); ctx.lineDashOffset = isla.x + tAgua * 1.5;
      trazarIsla(ctx, isla, 1.09, true); ctx.stroke();
      continue;
    }
    // la espuma llega en tramos cortados, no en un anillo entero: cada ola con sus huecos, que se corren de a poco
    const semilla = (isla.x * 0.0013 + isla.y * 0.0007) % 1;
    for (let q = 0; q < 2; q++) {
      const fase = (tAgua * 0.11 + q * 0.5 + semilla) % 1;
      const lejos = (1 - fase) * (isla.r > 300 ? 22 : 15) + 2; // de afuera hacia la arena
      ctx.globalAlpha = Math.sin(fase * Math.PI) * (0.16 + 0.30 * fase);
      ctx.lineWidth = 1.0 + fase * 2.2;
      ctx.setLineDash(q ? [26, 14, 9, 22, 40, 18] : [14, 20, 34, 12, 20, 30]);
      ctx.lineDashOffset = semilla * 300 + q * 47 + tAgua * (q ? 2.2 : -1.6);
      trazarIsla(ctx, isla, 1.02 + lejos / isla.r);
      ctx.stroke();
    }
    // y el borde mismo del agua: un hilo de espuma fino, también cortado, pegado a la arena
    ctx.globalAlpha = 0.34 + 0.10 * Math.sin(tAgua * 0.7 + semilla * 9);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([30, 8, 16, 12, 44, 10]); ctx.lineDashOffset = semilla * 200 + tAgua * 0.8;
    trazarIsla(ctx, isla, 1.012);
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.lineCap = 'round';
  ctx.globalAlpha = 1;
  // témpanos: la mayor parte está bajo el agua. Se ve como una mancha turquesa esfumada, más grande que el hielo, que
  // sube y baja apenas con el oleaje
  for (const isla of aLaVista) {
    if (isla.tipo !== 'iceberg') continue;
    const r = isla.r * (1.75 + 0.05 * Math.sin(tAgua * 0.8 + isla.x)), g = ctx.createRadialGradient(isla.x, isla.y, isla.r * 0.5, isla.x, isla.y, r);
    g.addColorStop(0, css([esc.bajo[0] * 0.9 + 0.25, esc.bajo[1] * 0.9 + 0.25, esc.bajo[2] * 0.9 + 0.25], 0.62)); g.addColorStop(0.55, css(esc.bajo, 0.30)); g.addColorStop(1, css(esc.bajo, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(isla.x, isla.y, r, 0, TAU); ctx.fill();
  }
  // la tierra con relieve (src/terreno.js). Mientras se arma lo que falta, o si está apagada, va la tierra lisa de siempre.
  const calTerreno = pref.terreno ?? 0.8;
  let tr = null, relieve = false;
  if (calTerreno > 0) {
    if (!terrenos.has(j.mundo)) terrenos.set(j.mundo, crearTerreno(j.mundo));
    tr = terrenos.get(j.mundo);
    const nombre = vista.escena || j.escenaVista;
    relieve = tr.listo(x0, y0, vw, vh, nombre, escenaPara(nombre, tema).rumbo, calTerreno);
  }
  if (tr) lisas = relieve ? [] : aLaVista.filter((isla) => !tr.cubierta(isla));
  if (lisas.length) {
    capa(tr ? 1.0 : 1.1, tema.arena[0], true); // con relieve en camino, sin el borde de arena de más (asomaba como una línea amarilla)
    capa(1.0, tema.arena[1], true);
    // pasto o nieve: en las tierras grandes llega casi hasta la costa
    ctx.fillStyle = tema.pasto[0];
    for (const isla of lisas) { if (!ESCOLLO[isla.tipo]) { trazarIsla(ctx, isla, isla.r > 300 ? 1 - 60 / isla.r : 0.8); ctx.fill(); } }
    ctx.fillStyle = tema.pasto[1];
    for (const isla of lisas) { if (!ESCOLLO[isla.tipo]) { trazarIsla(ctx, isla, isla.r > 300 ? 1 - 150 / isla.r : 0.52); ctx.fill(); } }
    // arrecifes y bancos: arena a flor de agua con algunas piedras
    for (const isla of lisas) {
      if (isla.tipo !== 'arrecife') continue;
      ctx.fillStyle = tema.arena[0];
      trazarIsla(ctx, isla, 0.95); ctx.fill();
      ctx.fillStyle = tema.arena[1];
      trazarIsla(ctx, isla, 0.6); ctx.fill();
      ctx.fillStyle = '#6f6a63';
      for (let q = 0; q < 3; q++) {
        const ang = isla.puntos[q].ang + q * 2.1, d = isla.r * 0.45;
        ctx.beginPath(); ctx.arc(isla.x + Math.cos(ang) * d, isla.y + Math.sin(ang) * d, 3 + isla.r * 0.08, 0, TAU); ctx.fill();
      }
    }
    // icebergs: bloque blanco con una cara en sombra
    for (const isla of lisas) {
      if (isla.tipo !== 'iceberg') continue;
      ctx.fillStyle = '#cfe6f2';
      trazarIsla(ctx, isla, 1.05, true); ctx.fill();
      ctx.fillStyle = '#f6fcff';
      ctx.save(); ctx.translate(-isla.r * 0.08, -isla.r * 0.1); trazarIsla(ctx, isla, 0.82, true); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(120,170,200,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(isla.x - isla.r * 0.3, isla.y - isla.r * 0.2); ctx.lineTo(isla.x + isla.r * 0.1, isla.y + isla.r * 0.05); ctx.lineTo(isla.x + isla.r * 0.05, isla.y + isla.r * 0.4); ctx.stroke();
    }
  }
  if (tr) tr.dibujar(ctx);
  for (const isla of aLaVista) {
    if (ESCOLLO[isla.tipo]) continue;
    for (const r of isla.rocas) {
      ctx.fillStyle = '#6f6a63';
      ctx.beginPath(); ctx.arc(isla.x + r.x, isla.y + r.y, r.s, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8d877f';
      ctx.beginPath(); ctx.arc(isla.x + r.x + luzX * r.s * 0.3, isla.y + r.y + luzY * r.s * 0.3, r.s * 0.6, 0, TAU); ctx.fill();
    }
    if (tema.arbol !== 'ninguno') {
      for (const pa of isla.palmeras) {
        const px = isla.x + pa.x, py = isla.y + pa.y;
        if (!visible(px, py, 20)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.arc(px - luzX * 6, py - luzY * 6, 9 * pa.s, 0, TAU); ctx.fill();
        if (tema.arbol === 'pino') {
          ctx.fillStyle = '#23492d';
          ctx.beginPath(); ctx.arc(px, py, 9 * pa.s, 0, TAU); ctx.fill();
          ctx.fillStyle = '#35693e';
          ctx.beginPath(); ctx.arc(px + luzX * 2.2 * pa.s, py + luzY * 2.2 * pa.s, 5.5 * pa.s, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = '#2f6f35';
          for (let h = 0; h < 6; h++) {
            const ang = (h / 6) * TAU + pa.s;
            ctx.beginPath();
            ctx.ellipse(px + Math.cos(ang) * 6 * pa.s, py + Math.sin(ang) * 6 * pa.s, 8 * pa.s, 3.2 * pa.s, ang, 0, TAU);
            ctx.fill();
          }
          ctx.fillStyle = '#3f8f45';
          ctx.beginPath(); ctx.arc(px, py, 3 * pa.s, 0, TAU); ctx.fill();
        }
      }
    }
    if (isla.esPuerto) { const rb = escenaPara(vista.escena || j.escenaVista, tema).rumbo; dibujarPuerto(ctx, j, isla, Math.cos(rb), Math.sin(rb)); } // con la luz del escenario base: no se rearma mientras el Kraken lo oscurece
  }

  // zona segura del puerto
  ctx.strokeStyle = 'rgba(255,236,170,0.5)';
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);

  // estelas (solo dibujo: se arman acá, con el camino de cada barco) y salpicones
  dibujarEstelas(ctx, j, visible, espumaColor);
  ctx.strokeStyle = espumaColor;
  ctx.lineWidth = 2;
  for (const pt of j.particulas) {
    if (pt.tipo !== 'salpicon' || !visible(pt.x, pt.y, 30)) continue;
    const f = pt.t / pt.vida;
    ctx.globalAlpha = 0.8 * (1 - f);
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (0.4 + f * 1.6), 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // cofres: el botín que quedó flotando. Un arcón de madera con zunchos de hierro y la tapa entreabierta (se ve el oro),
  // medio hundido, cada uno girado a su manera, que se mece con el agua; alrededor, el anillo de espuma que deja al subir y bajar
  for (const c of j.cofres) {
    if (!visible(c.x, c.y, 40)) continue;
    const h = hash2(Math.round(c.x), Math.round(c.y)), mece = Math.sin(j.t * 1.7 + h * 9), sube = 1 + 0.05 * mece;
    ctx.save(); ctx.translate(c.x, c.y);
    ctx.strokeStyle = espumaColor; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.09 + 0.07 * mece; // el agua alrededor
    ctx.beginPath(); ctx.ellipse(0, 0, 15 + mece * 1.5, 12 + mece * 1.2, h * 3, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.30; ctx.fillStyle = '#03101a'; ctx.beginPath(); ctx.ellipse(-luzX * 3, -luzY * 3, 12, 9, h * TAU, 0, TAU); ctx.fill(); // sombra
    ctx.globalAlpha = 1;
    ctx.rotate(h * TAU + mece * 0.07); ctx.scale(sube, sube);
    ctx.fillStyle = '#2a190c'; ctx.fillRect(-10.5, -7.5, 21, 15);                         // el arcón
    for (let q = 0; q < 5; q++) { ctx.fillStyle = q % 2 ? '#6e4824' : '#7d5530'; ctx.fillRect(-9.5, -6.5 + q * 2.6, 19, 2.4); } // tablas de la tapa
    const lz = ctx.createLinearGradient(0, -6.5, 0, 6.5); lz.addColorStop(0, 'rgba(255,230,180,0.22)'); lz.addColorStop(0.5, 'rgba(0,0,0,0)'); lz.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = lz; ctx.fillRect(-9.5, -6.5, 19, 13);                                 // la tapa es curva: luz arriba, sombra abajo
    ctx.fillStyle = '#3b3d42'; for (const zx of [-6.4, 4.2]) ctx.fillRect(zx, -7.5, 2.2, 15); // zunchos de hierro
    ctx.fillStyle = '#6c7078'; for (const zx of [-6.4, 4.2]) ctx.fillRect(zx, -7.5, 0.7, 15);
    ctx.fillStyle = '#1a0f06'; ctx.fillRect(-9.5, 4.6, 19, 1.9);                          // la rendija de la tapa entreabierta
    ctx.fillStyle = '#e8b93a'; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(-7.5 + q * 3 + (q % 2) * 0.6, 5.5, 1.05, 0, TAU); ctx.fill(); } // el oro que asoma
    ctx.fillStyle = '#c9a23a'; ctx.fillRect(-1.3, 2.6, 2.6, 3.2); ctx.fillStyle = '#2a190c'; ctx.fillRect(-0.45, 3.6, 0.9, 1.3); // cerradura
    const chispa = Math.max(0, Math.sin(j.t * 2.3 + h * 40) - 0.86) / 0.14;                // un destello cada tanto
    if (chispa > 0) { ctx.globalAlpha = chispa; ctx.strokeStyle = '#fff6cf'; ctx.lineWidth = 0.9; const cx2 = -5 + h * 10; ctx.beginPath(); ctx.moveTo(cx2 - 3.5, 5.5); ctx.lineTo(cx2 + 3.5, 5.5); ctx.moveTo(cx2, 2); ctx.lineTo(cx2, 9); ctx.stroke(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // la marca de la práctica guiada: un círculo dorado que late donde hay que ir y, si queda fuera de la pantalla, una flecha que apunta hacia ahí
  if (j.marca) {
    const m = j.marca, late = 0.5 + 0.5 * Math.sin(j.t * 4);
    ctx.setLineDash([16, 10]);
    ctx.lineDashOffset = -j.t * 30;
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(255,209,102,${0.65 + 0.3 * late})`;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r + late * 6, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    if (!m.suave) { ctx.fillStyle = `rgba(255,209,102,${0.10 + 0.08 * late})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill(); }
    const dm = Math.hypot(m.x - yo.x, m.y - yo.y), borde = Math.min(vw, vh) * 0.36;
    if (dm > borde + m.r) {
      const am = Math.atan2(m.y - yo.y, m.x - yo.x), d = borde + late * 10;
      ctx.save(); ctx.translate(yo.x + Math.cos(am) * d, yo.y + Math.sin(am) * d); ctx.rotate(am);
      ctx.fillStyle = '#ffd166'; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-2, -17); ctx.lineTo(-2, -7); ctx.lineTo(-26, -7); ctx.lineTo(-26, 7); ctx.lineTo(-2, 7); ctx.lineTo(-2, 17); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // abanicos de puntería: uno por costado
  if (!yo.hundiendo && yo.diseno.canones >= 2) {
    const ab = yo.stats.perdigones > 1 ? 0.3 : 0.2;
    for (const lado of [-1, 1]) {
      const centro = yo.a + lado * Math.PI / 2;
      // El abanico también es la barra de recarga de ese costado (antes había dos barritas en el panel de abajo): al disparar
      // queda vacío, apenas el contorno, y se va llenando desde el barco hacia afuera; lleno = cañones listos.
      const total = (yo.recargaTotal && yo.recargaTotal[lado]) || yo.stats.recarga || 1;
      const carga = Math.max(0, Math.min(1, 1 - yo.recarga[lado] / total));
      const listo = yo.recarga[lado] <= 0;
      const radio = yo.stats.alcance + yo.stats.ancho / 2;
      const sector = (r) => { ctx.beginPath(); ctx.moveTo(yo.x, yo.y); ctx.arc(yo.x, yo.y, r, centro - ab, centro + ab); ctx.closePath(); };
      ctx.lineWidth = 1.5;
      sector(radio); // el contorno entero: tenue mientras recarga
      ctx.fillStyle = listo ? 'rgba(255,240,170,0.13)' : 'rgba(255,255,255,0.025)';
      ctx.strokeStyle = listo ? 'rgba(255,240,170,0.50)' : 'rgba(255,255,255,0.16)';
      ctx.fill(); ctx.stroke();
      if (!listo && carga > 0.01) { // lo ya cargado, con un filo más claro en el frente que avanza
        sector(radio * carga);
        ctx.fillStyle = 'rgba(255,240,170,0.16)';
        ctx.fill();
        ctx.beginPath(); ctx.arc(yo.x, yo.y, radio * carga, centro - ab, centro + ab);
        ctx.strokeStyle = 'rgba(255,240,170,0.75)'; ctx.lineWidth = 2.2; ctx.stroke();
      }
    }
    // abordaje: el barco que tenés bajo el cursor se marca en dorado si le llega el gancho, o punteado si falta arrimarse
    if (!j.gancho && j.cdAbordaje <= 0) {
      const cand = candidatoAbordaje(j, raton);
      if (cand) {
        ctx.strokeStyle = cand.cerca ? 'rgba(255,209,102,0.95)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash(cand.cerca ? [] : [6, 7]);
        ctx.beginPath(); ctx.arc(cand.b.x, cand.b.y, cand.b.stats.largo * 0.62, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // marca de rumbo donde está el cursor
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(raton.x, raton.y, 9, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(raton.x, raton.y, 2, 0, TAU); ctx.stroke();
  }

  // el Kraken: las zonas marcadas y su cuerpo van debajo de los barcos
  dibujarKrakenAbajo(ctx, j, visible);

  // sombras: la forma de cada casco, corrida hacia el lado contrario a la luz del escenario
  if (esc.sombras > 0.01 && pref.sombras !== false) {
    for (const b of j.barcos) {
      if (b.hundiendo || !visible(b.x, b.y, 160)) continue;
      const e = (FACCIONES[b.diseno.faccion] || FACCIONES.espanoles).estilo, so = sombraDe(imagenBarco(b, e)), largo = 5 + b.stats.ancho * 0.34;
      ctx.save();
      ctx.translate(b.x - luzX * largo, b.y - luzY * largo);
      ctx.rotate(b.a);
      ctx.globalAlpha = Math.min(0.6, esc.sombras * 1.5);
      ctx.drawImage(so, -so.width / (2 * ESCALA_IMG), -so.height / (2 * ESCALA_IMG), so.width / ESCALA_IMG, so.height / ESCALA_IMG);
      ctx.restore();
    }
  }

  // barcos
  const cand = candidatoAbordaje(j);
  for (const b of j.barcos) {
    if (!visible(b.x, b.y, 160)) continue;
    if (cand && cand.b === b) {
      ctx.strokeStyle = cand.debil ? 'rgba(120,255,150,0.9)' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.stats.largo * 0.62, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    dibujarBarco(ctx, b, { sinBarra: true, sinFarol: true, sinSombra: true, luz: pref.relieve !== false ? esc.rumbo : null, vaiven: !pref.calma });
  }

  // el tentáculo que golpea cae encima de los barcos
  dibujarKrakenArriba(ctx, j, visible);
  dibujarMonedas(ctx, j, visible); // la moneda del tesoro maldito que vuela al barco

  // el gancho en el aire: la soga desde el barco y el garfio en la punta
  if (j.gancho && j.gancho.fase === 'vuelo') {
    const g = j.gancho;
    ctx.strokeStyle = '#d9c08a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(yo.x, yo.y); ctx.lineTo(g.x, g.y); ctx.stroke();
    ctx.fillStyle = '#3b3b3b';
    ctx.beginPath(); ctx.arc(g.x, g.y, 4, 0, TAU); ctx.fill();
  }
  // abordaje en curso: las sogas entre los dos barcos y, arriba, cuánta gente le queda a cada uno
  if (j.gancho && j.gancho.obj) {
    const e = j.gancho.obj;
    ctx.strokeStyle = '#d9c08a';
    ctx.lineWidth = 1.8;
    for (const q of [-0.3, 0, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(yo.x + Math.cos(yo.a) * yo.stats.largo * q, yo.y + Math.sin(yo.a) * yo.stats.largo * q);
      ctx.lineTo(e.x + Math.cos(e.a) * e.stats.largo * q, e.y + Math.sin(e.a) * e.stats.largo * q);
      ctx.stroke();
    }
    const mx = (yo.x + e.x) / 2, my = Math.min(yo.y, e.y) - 70, total = Math.max(1, yo.trip + e.trip), w = 130, mio = (w * yo.trip) / total;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(mx - w / 2 - 2, my - 2, w + 4, 13);
    ctx.fillStyle = '#4cc38a'; ctx.fillRect(mx - w / 2, my, mio, 9);
    ctx.fillStyle = '#e63946'; ctx.fillRect(mx - w / 2 + mio, my, w - mio, 9);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`${yo.trip}  ⚔  ${e.trip}`, mx, my - 6);
  }

  // tritones: nadan a flor de agua. Lo que va sumergido (la cola larga de escamas, que ondula) se ve velado por el agua;
  // asoman los hombros y la cabeza, de piel verdosa, con el pelo oscuro tirado hacia atrás y el tridente de bronce en la mano
  for (const tr of j.tritones) {
    if (!visible(tr.x, tr.y, 50)) continue;
    const onda = (q) => Math.sin(tr.t * 7 - q * 0.9) * (0.6 + q * 0.55);
    ctx.save(); ctx.translate(tr.x, tr.y); ctx.rotate(tr.a);
    ctx.strokeStyle = espumaColor; ctx.lineCap = 'round';                                   // la estela que abre al nadar
    ctx.globalAlpha = 0.13; ctx.lineWidth = 1.6; ctx.beginPath(); for (const sg of [-1, 1]) { ctx.moveTo(2, sg * 6); ctx.quadraticCurveTo(-8, sg * 9, -20, sg * (10 + Math.sin(tr.t * 3) * 1.5)); } ctx.stroke();
    ctx.globalAlpha = 0.72;                                                                 // la cola, bajo el agua
    for (let q = 0; q < 7; q++) { // tramos que se afinan y ondulan
      const x0 = -2 - q * 3.6, w = 5.4 - q * 0.62;
      ctx.fillStyle = q % 2 ? '#1c5a58' : '#236b66';
      ctx.beginPath(); ctx.ellipse(x0, onda(q), 2.9, w, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(150, 214, 200, 0.5)';                                            // escamas que brillan en el lomo
    for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(-3 - q * 3.6, onda(q) - 0.6, 0.8, 0, TAU); ctx.fill(); }
    const fy = onda(7);                                                                     // la aleta, translúcida
    ctx.fillStyle = 'rgba(64, 156, 146, 0.55)'; ctx.strokeStyle = 'rgba(20, 70, 68, 0.7)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-26, fy); ctx.quadraticCurveTo(-33, fy - 3, -37, fy - 9); ctx.quadraticCurveTo(-33, fy, -37, fy + 9); ctx.quadraticCurveTo(-33, fy + 3, -26, fy); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.22; ctx.fillStyle = espumaColor; ctx.beginPath(); ctx.ellipse(-1, 0, 8, 7.5, 0, 0, TAU); ctx.fill(); // donde corta el agua
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#6f8f80'; ctx.lineWidth = 2.4;                                       // el brazo que lleva el tridente
    ctx.beginPath(); ctx.moveTo(2.5, 5); ctx.quadraticCurveTo(7, 9.5, 11, 8); ctx.stroke();
    ctx.strokeStyle = '#2f2416'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(24, 8); ctx.stroke(); // el tridente: sombra, asta y puntas
    ctx.strokeStyle = '#b8924a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(19, 8); ctx.moveTo(19, 4.6); ctx.lineTo(19, 11.4); ctx.moveTo(19, 4.6); ctx.lineTo(25, 4.6); ctx.moveTo(19, 8); ctx.lineTo(26.5, 8); ctx.moveTo(19, 11.4); ctx.lineTo(25, 11.4); ctx.stroke();
    ctx.strokeStyle = '#f0dc9a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, 7.6); ctx.lineTo(18, 7.6); ctx.stroke();
    const piel = ctx.createLinearGradient(0, -7, 0, 7); piel.addColorStop(0, '#93b59f'); piel.addColorStop(1, '#4f7466');   // hombros y espalda
    ctx.fillStyle = piel; ctx.strokeStyle = '#21332c'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(2, 0, 4.2, 6.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(28, 60, 54, 0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(4.5, 0); ctx.stroke(); // la columna
    ctx.fillStyle = '#16211d';                                                              // el pelo, mojado, hacia atrás
    ctx.beginPath(); ctx.moveTo(9, -3.6); ctx.quadraticCurveTo(2, -5.5, -5, -2.4 + Math.sin(tr.t * 5) * 1.2); ctx.quadraticCurveTo(0, 0, -5, 2.4 + Math.sin(tr.t * 5 + 1) * 1.2); ctx.quadraticCurveTo(2, 5.5, 9, 3.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#86a892'; ctx.beginPath(); ctx.ellipse(9.4, 0, 3.4, 3.2, 0, 0, TAU); ctx.fill(); ctx.stroke();         // la cabeza
    ctx.fillStyle = '#16211d'; ctx.beginPath(); ctx.ellipse(8.2, 0, 2.6, 3.1, 0, 0, TAU); ctx.fill();                     // la coronilla
    ctx.fillStyle = 'rgba(235, 245, 240, 0.5)'; ctx.beginPath(); ctx.ellipse(3 + luzX * 1.5, luzY * 3, 1.6, 2.6, 0, 0, TAU); ctx.fill(); // el agua que le brilla en la espalda
    ctx.restore();
  }

  // balas
  for (const bl of j.balas) {
    if (!visible(bl.x, bl.y, 20)) continue;
    const f = 1 - bl.vida / bl.vidaTotal;
    const altura = Math.sin(f * Math.PI) * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(bl.x + 2, bl.y + 3, bl.radio, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16161a';
    ctx.beginPath(); ctx.arc(bl.x, bl.y - altura, bl.radio, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(214, 224, 236, 0.75)'; // el brillo del hierro: un punto claro del lado de la luz
    ctx.beginPath(); ctx.arc(bl.x + luzX * bl.radio * 0.4, bl.y - altura + luzY * bl.radio * 0.4, bl.radio * 0.38, 0, TAU); ctx.fill();
  }

  // partículas sobre los barcos
  for (const pt of j.particulas) {
    if (pt.tipo === 'estela' || pt.tipo === 'salpicon' || !visible(pt.x, pt.y, 30)) continue;
    const f = pt.t / pt.vida;
    if (pt.tipo === 'humo') {
      ctx.fillStyle = `rgba(235,235,235,${0.55 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (1 + f * 1.8), 0, TAU); ctx.fill();
    } else if (pt.tipo === 'humoNegro') {
      ctx.fillStyle = `rgba(40,40,45,${0.5 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (1 + f * 2), 0, TAU); ctx.fill();
    } else if (pt.tipo === 'fogonazo') {
      ctx.fillStyle = `rgba(255,200,80,${1 - f})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, TAU); ctx.fill();
    } else if (pt.tipo === 'astilla') {
      ctx.fillStyle = `rgba(120,75,35,${1 - f})`;
      ctx.fillRect(pt.x - 2, pt.y - 1, 5, 2);
    } else if (pt.tipo === 'polvo') {
      ctx.fillStyle = `rgba(230,210,150,${0.7 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (1 + f), 0, TAU); ctx.fill();
    }
  }

  // sombras de nubes que pasan sobre el mar y la tierra
  const ambiente = pref.ambiente !== false, tAire = pref.calma ? j.t * 0.3 : j.t;
  if (ambiente && esc.nubes > 0.02) capaManchas(ctx, mancha('#04121c'), x0, y0, vw, vh, camX, camY, tAire, j.vientoAgua, { celda: 760, paralaje: 1, vel: 13, cuantas: 0.55, fuerza: 0.30 * esc.nubes, semilla: 3 });

  // El velo del escenario: tiñe la tierra, los barcos y el humo con la luz del lugar (lo ya pintado; el agua trae su color propio)
  // y oscurece los bordes de la pantalla. Lo que hay que leer sí o sí (barras, nombres, avisos) se pinta después, sin velo.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (esc.fuerza > 0.005) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = css(esc.tinte, esc.fuerza);
    ctx.fillRect(0, 0, ancho, alto);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (esc.vineta > 0.005) {
    const R = Math.hypot(ancho, alto) / 2, vi = ctx.createRadialGradient(ancho / 2, alto / 2, R * 0.50, ancho / 2, alto / 2, R * 1.02);
    const osc = [esc.hondo[0] * 0.25, esc.hondo[1] * 0.25, esc.hondo[2] * 0.30];
    vi.addColorStop(0, css(osc, 0)); vi.addColorStop(0.55, css(osc, esc.vineta * 0.38)); vi.addColorStop(1, css(osc, esc.vineta));
    ctx.fillStyle = vi;
    ctx.fillRect(0, 0, ancho, alto);
  }
  ctx.restore();

  // bruma: bancos claros, más altos que el mar (se corren un poco más que él), y de día, gaviotas
  if (ambiente && esc.niebla > 0.02) {
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, ancho / 2 - camX * zoom, alto / 2 - camY * zoom);
    const q = (v) => Math.round(Math.min(1, v) * 15) * 17, tono = `rgb(${q(esc.cielo[0] * 0.6 + esc.luz[0] * 0.35 + 0.12)},${q(esc.cielo[1] * 0.6 + esc.luz[1] * 0.35 + 0.14)},${q(esc.cielo[2] * 0.6 + esc.luz[2] * 0.35 + 0.16)})`;
    capaManchas(ctx, mancha(tono), x0, y0, vw, vh, camX, camY, tAire, j.vientoAgua, { celda: 620, paralaje: 1.12, vel: 9, cuantas: 0.7, fuerza: 0.34 * esc.niebla, semilla: 11 });
    capaManchas(ctx, mancha(tono), x0, y0, vw, vh, camX, camY, tAire, j.vientoAgua + 0.3, { celda: 980, paralaje: 1.25, vel: 16, cuantas: 0.5, fuerza: 0.26 * esc.niebla, semilla: 23 });
    ctx.restore();
  }
  if (ambiente && esc.aves > 0.05) {
    ctx.save(); ctx.setTransform(zoom, 0, 0, zoom, ancho / 2 - camX * zoom, alto / 2 - camY * zoom);
    dibujarGaviotas(ctx, j.mundo.puerto, visible, tAire, Math.min(1, esc.aves));
    ctx.restore();
  }

  // las luces cálidas, encima del velo: faroles de los barcos y del puerto, cañonazos y el oro que flota
  if (pref.luces !== false) dibujarLuces(ctx, j, visible, esc);
  dibujarKrakenLuz(ctx, j, visible); // los ojos y el agua revuelta del Kraken se ven en lo oscuro

  // barras de vida, nombres y banderas: arriba del velo
  for (const b of j.barcos) {
    if (b.hundiendo || !visible(b.x, b.y, 160)) continue;
    dibujarRotulo(ctx, b, { etiqueta: true });
    if (b === yo && j.nombreJugador) {
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const ny = b.y - b.stats.largo * 0.5 - 27;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(j.nombreJugador, b.x + 1, ny + 1);
      ctx.fillStyle = '#b8ffcb';
      ctx.fillText(j.nombreJugador, b.x, ny);
    }
  }

  // la lluvia y los relámpagos del escenario (la tormenta, o la que trae el Kraken); lo oscuro ya lo puso el escenario
  j.rayo = (esc.lluvia > 0.01 && dibujarTormenta(ctx, j, ancho, alto, Math.min(1, esc.lluvia), { sinOscuro: true, rayos: esc.rayos, calma: pref.calma, zoom, camX, camY, viento: j.vientoAgua })) || false;

  if (kEntrada < 1) { // la llegada: sale de lo oscuro
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = css([esc.hondo[0] * 0.35, esc.hondo[1] * 0.35, esc.hondo[2] * 0.4], Math.pow(1 - Math.min(1, kEntrada * 1.5), 2));
    ctx.fillRect(0, 0, ancho, alto); ctx.restore();
  }

  // textos flotantes
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const t of j.textos) {
    ctx.globalAlpha = Math.min(1, t.t);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const escrito = tx(t.texto, t.datos);
    ctx.fillText(escrito, t.x + 1, t.y + 1);
    ctx.fillStyle = t.color;
    ctx.fillText(escrito, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // flecha al puerto cuando queda fuera de pantalla
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!visible(p.x, p.y, -40)) {
    const ang = Math.atan2(p.y - yo.y, p.x - yo.x);
    const r = Math.min(ancho, alto) / 2 - 70;
    const fx = ancho / 2 + Math.cos(ang) * r, fy = alto / 2 + Math.sin(ang) * r;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(255,236,170,0.9)';
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,236,170,0.95)';
    ctx.fillText(tx('Puerto {n} m', { n: Math.round(Math.hypot(p.x - yo.x, p.y - yo.y) / 10) }), fx - Math.cos(ang) * 34, fy - Math.sin(ang) * 34 + 4);
  }
}

// El puerto: un pueblo chico sobre la isla (casas con techo a dos aguas, iglesia, depósito y faro), el muelle de madera con
// sus pilotes, carga y botes amarrados. La luz y las sombras son las del escenario (luzX, luzY: hacia dónde está la luz).
const puertoListo = { clave: '', img: null };
function dibujarPuerto(ctx, j, isla, luzX = -0.6, luzY = -0.7) {
  // lo que no se mueve (pueblo, faro, muelle, carga) se pinta una sola vez por escenario y después se estampa
  const p0 = j.mundo.puerto, clave = `${j.mundo.id}|${luzX.toFixed(2)}|${luzY.toFixed(2)}`, E = 2.5, ox = isla.x - 150, oy = isla.y - 130, w = 300, h = p0.y + 20 - oy;
  if (puertoListo.clave !== clave) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w * E); c.height = Math.ceil(h * E);
    const x = c.getContext('2d'); x.setTransform(E, 0, 0, E, -ox * E, -oy * E);
    pintarPuerto(x, j, isla, luzX, luzY, true);
    puertoListo.clave = clave; puertoListo.img = c;
  }
  ctx.drawImage(puertoListo.img, ox, oy, w, puertoListo.img.height / E);
  pintarPuerto(ctx, j, isla, luzX, luzY, false);
}
function pintarPuerto(ctx, j, isla, luzX, luzY, fijo) {
  const p = j.mundo.puerto, sx = -luzX, sy = -luzY; // hacia dónde caen las sombras
  const sombra = (f, largo = 5) => { ctx.save(); ctx.translate(sx * largo, sy * largo); ctx.fillStyle = 'rgba(8,14,10,0.34)'; f(); ctx.restore(); };
  // un techo a dos aguas visto desde arriba: la falda que mira a la luz, clara; la otra, en sombra; cumbrera y chimenea
  const casa = (x, y, w, h, a, teja, alto = 5) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const ca = Math.cos(-a), sa = Math.sin(-a), lx = luzX * ca - luzY * sa, ly = luzX * sa + luzY * ca; // la luz, vista desde la casa
    ctx.save(); ctx.translate(-lx * alto, -ly * alto); ctx.fillStyle = 'rgba(8,14,10,0.36)'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
    ctx.fillStyle = '#e9dfc6'; ctx.fillRect(-w / 2 - 0.8, -h / 2 - 0.8, w + 1.6, h + 1.6); // el muro que asoma
    const n = parseInt(teja.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255], tono = (k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
    ctx.fillStyle = tono(1 + 0.24 * -ly); ctx.fillRect(-w / 2, -h / 2, w, h / 2);
    ctx.fillStyle = tono(1 + 0.24 * ly); ctx.fillRect(-w / 2, 0, w, h / 2);
    ctx.strokeStyle = 'rgba(40,16,8,0.28)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let q = -w / 2 + 2.4; q < w / 2; q += 2.4) { ctx.moveTo(q, -h / 2); ctx.lineTo(q, h / 2); } // hileras de tejas
    ctx.stroke();
    ctx.strokeStyle = tono(0.62); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
    if (j.mundo.tema.arbol === 'ninguno') { ctx.fillStyle = 'rgba(250,252,255,0.72)'; ctx.fillRect(-w / 2, ly < 0 ? -h / 2 : h * 0.12, w, h * 0.38); } // nieve en la falda que mira a la luz
    ctx.fillStyle = '#6d6259'; ctx.fillRect(w * 0.22, -h * 0.34, 2.6, 2.6); ctx.fillStyle = '#2a2420'; ctx.fillRect(w * 0.22 + 0.7, -h * 0.34 + 0.7, 1.2, 1.2);
    ctx.restore();
  };

  if (fijo) {
  const nieve = j.mundo.tema.arbol === 'ninguno', R = isla.r;
  const az = (k, s) => hash2(k * 7 + s, k * 13 - s); // siempre lo mismo para el mismo detalle
  // ---- alrededor del pueblo: sembrados con sus cercos (o leñeras y trineos en la nieve), huerta, pozo, rocas y árboles sueltos
  if (!nieve) {
    for (const [dx, dy, w, h, a, c1, c2] of [[-70, 40, 44, 26, 0.35, '#8fae4c', '#7a9a40'], [62, 50, 40, 24, -0.4, '#c8b05a', '#b39a48'], [72, -52, 34, 22, 0.25, '#7fa84a', '#6c9440'], [-62, -66, 30, 20, -0.5, '#b9a552', '#a38f42']]) {
      ctx.save(); ctx.translate(isla.x + dx, isla.y + dy); ctx.rotate(a);
      ctx.fillStyle = c1; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = c2; for (let q = -h / 2; q < h / 2; q += 4) ctx.fillRect(-w / 2, q, w, 2); // surcos
      ctx.strokeStyle = 'rgba(70,48,24,0.75)'; ctx.lineWidth = 0.9; ctx.strokeRect(-w / 2 - 1.2, -h / 2 - 1.2, w + 2.4, h + 2.4); // cerco
      ctx.fillStyle = '#4a321a'; for (let q = -w / 2 - 1.2; q <= w / 2 + 1.3; q += 5.5) { ctx.fillRect(q - 0.6, -h / 2 - 1.8, 1.2, 1.2); ctx.fillRect(q - 0.6, h / 2 + 0.6, 1.2, 1.2); }
      ctx.restore();
    }
    for (const [dx, dy] of [[-82, 30], [-90, 44], [50, 70], [84, 40]]) { // parvas de heno
      sombra(() => { ctx.beginPath(); ctx.arc(isla.x + dx, isla.y + dy, 4.2, 0, TAU); ctx.fill(); }, 3);
      ctx.fillStyle = '#d6b85a'; ctx.beginPath(); ctx.arc(isla.x + dx, isla.y + dy, 4.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#eccf74'; ctx.beginPath(); ctx.arc(isla.x + dx + luzX * 1.3, isla.y + dy + luzY * 1.3, 2.2, 0, TAU); ctx.fill();
    }
  } else {
    for (const [dx, dy, a] of [[-74, 34, 0.3], [64, 44, -0.4], [70, -50, 0.2]]) { // leñeras
      ctx.save(); ctx.translate(isla.x + dx, isla.y + dy); ctx.rotate(a);
      ctx.fillStyle = 'rgba(40,60,80,0.3)'; ctx.fillRect(-9 + sx * 3, -4 + sy * 3, 18, 8);
      for (let q = 0; q < 6; q++) { ctx.fillStyle = q % 2 ? '#7a5632' : '#93693c'; ctx.fillRect(-9 + q * 3, -4, 2.8, 8); }
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-9, -4, 18, 2.4);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(150,178,200,0.6)'; ctx.lineWidth = 0.8; // huellas de trineo
    for (const s of [-1.6, 1.6]) { ctx.beginPath(); ctx.moveTo(isla.x + 40, isla.y + 30 + s); ctx.quadraticCurveTo(isla.x + 80, isla.y + 10 + s, isla.x + 96, isla.y - 30 + s); ctx.stroke(); }
  }
  // rocas y árboles sueltos (pinos o palmeras según el clima; en la nieve, solo rocas y algún abeto oscuro)
  for (let k = 0; k < 26; k++) {
    const ang = az(k, 1) * TAU, d = (0.42 + az(k, 2) * 0.42) * R, x = isla.x + Math.cos(ang) * d, y = isla.y + Math.sin(ang) * d * 0.92;
    if (Math.hypot(x - (isla.x - 4), y - (isla.y - 8)) < 66 || (Math.abs(x - p.x) < 26 && y > isla.y)) continue; // ni en la plaza ni sobre el sendero al muelle
    const t = 2.6 + az(k, 3) * 3.4;
    if (k % 3 === 0) {
      sombra(() => { ctx.beginPath(); ctx.ellipse(x, y, t * 1.1, t * 0.8, ang, 0, TAU); ctx.fill(); }, 2.5);
      ctx.fillStyle = nieve ? '#5b6672' : '#74706a'; ctx.beginPath(); ctx.ellipse(x, y, t * 1.1, t * 0.8, ang, 0, TAU); ctx.fill();
      ctx.fillStyle = nieve ? '#f2f7fb' : '#9a958c'; ctx.beginPath(); ctx.ellipse(x + luzX * t * 0.35, y + luzY * t * 0.35, t * 0.6, t * 0.4, ang, 0, TAU); ctx.fill();
    } else if (!nieve || k % 2) {
      sombra(() => { ctx.beginPath(); ctx.arc(x, y, t * 1.5, 0, TAU); ctx.fill(); }, 4);
      ctx.fillStyle = nieve ? '#22402e' : '#255a31'; ctx.beginPath(); ctx.arc(x, y, t * 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = nieve ? '#3b6248' : '#3b8044'; ctx.beginPath(); ctx.arc(x + luzX * t * 0.5, y + luzY * t * 0.5, t * 0.9, 0, TAU); ctx.fill();
      if (nieve) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x + luzX * t * 0.6, y + luzY * t * 0.6, t * 0.5, 0, TAU); ctx.fill(); }
    }
  }
  // en la playa: botes varados y redes tendidas a secar
  for (const [ang, k] of [[2.2, 0], [2.55, 1], [0.75, 2], [0.45, 3]]) {
    const x = isla.x + Math.cos(ang) * R * 0.9, y = isla.y + Math.sin(ang) * R * 0.88;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + 0.3 + k);
    ctx.fillStyle = 'rgba(8,14,10,0.3)'; ctx.beginPath(); ctx.ellipse(sx * 2, sy * 2, 8, 3.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a321a'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(3.5, 3.8, -7.5, 2.9); ctx.lineTo(-7.5, -2.9); ctx.quadraticCurveTo(3.5, -3.8, 9, 0); ctx.fill();
    ctx.fillStyle = k % 2 ? '#b08a56' : '#8f6a3c'; ctx.beginPath(); ctx.moveTo(7.2, 0); ctx.quadraticCurveTo(3, 2.7, -6.2, 2); ctx.lineTo(-6.2, -2); ctx.quadraticCurveTo(3, -2.7, 7.2, 0); ctx.fill();
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-2, -2.3); ctx.lineTo(-2, 2.3); ctx.moveTo(2.4, -2.1); ctx.lineTo(2.4, 2.1); ctx.stroke();
    ctx.restore();
  }
  for (const ang of [2.38, 0.6]) {
    const x = isla.x + Math.cos(ang) * R * 0.8, y = isla.y + Math.sin(ang) * R * 0.78;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(60,44,26,0.8)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,170,130,0.75)'; ctx.lineWidth = 0.45; ctx.beginPath(); for (let q = -8; q <= 8; q += 2) { ctx.moveTo(q, 0); ctx.lineTo(q + 1.2, 5.5); } for (const q of [1.8, 3.6]) { ctx.moveTo(-8, q); ctx.lineTo(9, q); } ctx.stroke();
    ctx.fillStyle = '#3a2614'; ctx.fillRect(-9.8, -1, 1.6, 2); ctx.fillRect(8.2, -1, 1.6, 2);
    ctx.restore();
  }
  // ---- el pueblo: plaza, senderos y casas
  ctx.fillStyle = nieve ? 'rgba(176,196,214,0.6)' : 'rgba(214,190,140,0.55)';
  ctx.beginPath(); ctx.ellipse(isla.x - 4, isla.y - 8, 62, 44, 0.1, 0, TAU); ctx.fill();
  // el pozo de la plaza
  sombra(() => { ctx.beginPath(); ctx.arc(isla.x - 14, isla.y - 8, 4, 0, TAU); ctx.fill(); }, 3);
  ctx.fillStyle = '#8d877d'; ctx.beginPath(); ctx.arc(isla.x - 14, isla.y - 8, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1d3440'; ctx.beginPath(); ctx.arc(isla.x - 14, isla.y - 8, 2.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = nieve ? 'rgba(160,184,204,0.8)' : 'rgba(206,180,128,0.75)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(isla.x, isla.y + 20); ctx.quadraticCurveTo(p.x - 14, isla.y + isla.r * 0.4, p.x, isla.y + isla.r * 0.62); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(isla.x - 30, isla.y - 6); ctx.quadraticCurveTo(isla.x - 70, isla.y - 30, isla.x - 96, isla.y - 62); ctx.stroke();
  for (const [dx, dy, w, h, a, teja] of [[-52, -22, 26, 17, 0.12, '#b5503a'], [-12, -44, 30, 18, -0.08, '#c8823a'], [34, -18, 26, 17, 0.2, '#a8443c'], [10, 12, 24, 16, -0.15, '#8f5a44'],
    [-44, 18, 22, 15, 0.3, '#b86a3c'], [50, 16, 20, 14, -0.3, '#9c4a3a'], [-78, -8, 18, 13, 0.5, '#b5503a']]) casa(isla.x + dx, isla.y + dy, w, h, a, teja);
  // iglesia: nave larga y torre con chapitel
  casa(isla.x + 18, isla.y - 50, 38, 16, 0.02, '#7d4a3a', 7);
  sombra(() => ctx.fillRect(isla.x + 38, isla.y - 59, 13, 13), 11);
  ctx.fillStyle = '#d8cfba'; ctx.fillRect(isla.x + 38, isla.y - 59, 13, 13);
  ctx.fillStyle = luzY < 0 ? '#5d6b78' : '#46525e'; ctx.beginPath(); ctx.moveTo(isla.x + 38, isla.y - 59); ctx.lineTo(isla.x + 51, isla.y - 59); ctx.lineTo(isla.x + 44.5, isla.y - 52.5); ctx.fill();
  ctx.fillStyle = luzY < 0 ? '#46525e' : '#5d6b78'; ctx.beginPath(); ctx.moveTo(isla.x + 38, isla.y - 46); ctx.lineTo(isla.x + 51, isla.y - 46); ctx.lineTo(isla.x + 44.5, isla.y - 52.5); ctx.fill();
  ctx.fillStyle = luzX < 0 ? '#66747f' : '#3c4852'; ctx.beginPath(); ctx.moveTo(isla.x + 38, isla.y - 59); ctx.lineTo(isla.x + 38, isla.y - 46); ctx.lineTo(isla.x + 44.5, isla.y - 52.5); ctx.fill();
  ctx.fillStyle = luzX < 0 ? '#3c4852' : '#66747f'; ctx.beginPath(); ctx.moveTo(isla.x + 51, isla.y - 59); ctx.lineTo(isla.x + 51, isla.y - 46); ctx.lineTo(isla.x + 44.5, isla.y - 52.5); ctx.fill();
  ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.arc(isla.x + 44.5, isla.y - 52.5, 1.2, 0, TAU); ctx.fill();
  // faro en la punta oeste: torre de piedra con linterna
  const fx = isla.x - 104, fy = isla.y - 70;
  sombra(() => { ctx.beginPath(); ctx.arc(fx, fy, 9, 0, TAU); ctx.fill(); }, 14);
  ctx.fillStyle = '#8d877d'; ctx.beginPath(); ctx.arc(fx, fy, 10.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e7e2d6'; ctx.beginPath(); ctx.arc(fx, fy, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b3352c'; ctx.beginPath(); ctx.arc(fx, fy, 5.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(fx, fy, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(fx + luzX * 3, fy + luzY * 3, 2.4, 0, TAU); ctx.fill();

  // ---- depósito del muelle, al pie de la isla
  casa(p.x - 30, isla.y + isla.r * 0.5, 30, 15, 0.05, '#6b5a48', 6);
  casa(p.x + 30, isla.y + isla.r * 0.46, 22, 14, -0.1, '#7a6048', 5);

  // ---- el muelle: sombra sobre el agua, pilotes, tablas una por una
  const y0 = isla.y + isla.r * 0.6, y1 = p.y - 30;
  sombra(() => { ctx.fillRect(p.x - 10, y0 + 30, 20, y1 - y0 - 30); ctx.fillRect(p.x - 36, p.y - 46, 72, 18); }, 6);
  ctx.fillStyle = '#3d2a17';
  for (let y = y0 + 8; y < y1; y += 15) for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(p.x + s * 10.5, y, 2.3, 0, TAU); ctx.fill(); }
  for (const s of [-1, 1]) for (const q of [-34, -17, 17, 34]) { ctx.beginPath(); ctx.arc(p.x + q, p.y - 37 + s * 8, 2.3, 0, TAU); ctx.fill(); }
  const tabla = (x, y, w, h, k) => { const v = 0.84 + 0.3 * hash2(k, 31); ctx.fillStyle = `rgb(${(132 * v) | 0},${(96 * v) | 0},${(58 * v) | 0})`; ctx.fillRect(x, y, w, h); };
  for (let y = y0, k = 0; y < y1; y += 3.4, k++) tabla(p.x - 9, y, 18, 3.1, k);
  for (let x = -34, k = 0; x < 34; x += 3.4, k++) tabla(p.x + x, p.y - 44, 3.1, 14, k + 99);
  ctx.strokeStyle = 'rgba(36,22,10,0.5)'; ctx.lineWidth = 0.6; ctx.strokeRect(p.x - 9, y0, 18, y1 - y0); ctx.strokeRect(p.x - 34, p.y - 44, 68, 14);
  // carga: cajones, toneles y un rollo de cabo
  for (const [dx, dy, w] of [[-27, -41, 7], [-19, -40, 6], [-25, -34, 6], [22, -41, 7]]) {
    sombra(() => ctx.fillRect(p.x + dx, p.y + dy, w, w), 2);
    ctx.fillStyle = '#a07a48'; ctx.fillRect(p.x + dx, p.y + dy, w, w);
    ctx.strokeStyle = '#4a3218'; ctx.lineWidth = 0.6; ctx.strokeRect(p.x + dx, p.y + dy, w, w);
    ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy); ctx.lineTo(p.x + dx + w, p.y + dy + w); ctx.stroke();
  }
  for (const [dx, dy] of [[13, -38], [18, -34], [-3, y0 - p.y + 14], [4, y0 - p.y + 26]]) {
    sombra(() => { ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 3, 0, TAU); ctx.fill(); }, 2);
    ctx.fillStyle = '#7a5630'; ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2f2010'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = '#a57c4a'; ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 1.5, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = '#c9b88a'; ctx.lineWidth = 0.9; for (const r of [1.2, 2.4, 3.6]) { ctx.beginPath(); ctx.arc(p.x + 29, p.y - 34, r, 0, TAU); ctx.stroke(); }
  return; }
  // botes amarrados, que se mecen apenas
  const T = performance.now() / 1000;
  for (const [dx, dy, a, k] of [[-20, -66, 1.45, 0], [21, -92, 1.7, 1], [-48, -30, 0.1, 2]]) {
    ctx.save(); ctx.translate(p.x + dx + Math.sin(T * 0.9 + k * 2) * 0.9, p.y + dy + Math.cos(T * 0.7 + k) * 0.7); ctx.rotate(a + Math.sin(T * 0.6 + k) * 0.05);
    ctx.fillStyle = 'rgba(4,16,26,0.3)'; ctx.beginPath(); ctx.ellipse(sx * 2.5, sy * 2.5, 9, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a321a'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(4, 4.2, -8, 3.2); ctx.lineTo(-8, -3.2); ctx.quadraticCurveTo(4, -4.2, 10, 0); ctx.fill();
    ctx.fillStyle = '#9a7444'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(3.5, 3, -6.6, 2.2); ctx.lineTo(-6.6, -2.2); ctx.quadraticCurveTo(3.5, -3, 8, 0); ctx.fill();
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-2.5, -2.6); ctx.lineTo(-2.5, 2.6); ctx.moveTo(2.5, -2.4); ctx.lineTo(2.5, 2.4); ctx.stroke();
    ctx.restore();
  }
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(tx('PUERTO'), p.x + 1, p.y - 52);
  ctx.fillStyle = '#fff3c4';
  ctx.fillText(tx('PUERTO'), p.x, p.y - 53);
}

export function dibujarMinimapa(ctx, j, lado) {
  const m = j.mundo, k = lado / m.ancho;
  ctx.clearRect(0, 0, lado, lado);
  ctx.fillStyle = 'rgba(10,40,62,0.85)';
  ctx.fillRect(0, 0, lado, lado);
  if (j.viento) { // ráfagas
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (const g of j.viento.rafagas) { ctx.beginPath(); ctx.arc(g.x * k, g.y * k, g.r * k, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = m.tema.mini;
  for (const i of m.islas) { ctx.beginPath(); ctx.arc(i.x * k, i.y * k, Math.max(2, i.r * k), 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  for (const w of m.remolinos) { ctx.beginPath(); ctx.arc(w.x * k, w.y * k, 3.5, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#ffe89a';
  ctx.fillRect(m.puerto.x * k - 3, m.puerto.y * k - 3, 6, 6);
  const yo = j.jugador;
  for (const b of j.barcos) {
    if (b.hundiendo || b === yo) continue;
    // los bots solo se ven de cerca; los otros jugadores, siempre
    if (b.tipo === 'mercante' && b.rival && b.bando === 'enemigo') { // los mercantes se ven siempre: son la forma fácil de hacer oro
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(b.x * k, b.y * k - 4); ctx.lineTo(b.x * k + 4, b.y * k); ctx.lineTo(b.x * k, b.y * k + 4); ctx.lineTo(b.x * k - 4, b.y * k); ctx.closePath(); ctx.fill();
      continue;
    }
    if (b.bando === 'enemigo' && !b.esJugador && Math.hypot(b.x - yo.x, b.y - yo.y) > 1500) continue;
    ctx.fillStyle = b.esJugador ? (b.rival ? '#ffd166' : '#b8ffcb') : b.rival ? '#ff6b6b' : '#7dff9b';
    const t = b.esJugador ? 4 : 3;
    ctx.fillRect(b.x * k - t / 2, b.y * k - t / 2, t, t);
  }
  for (const b of j.barcos) {
    if (!b.convoy || b.hundiendo || b.bando !== 'enemigo') continue;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(b.x * k, b.y * k, 3.5 + 1.5 * Math.sin(j.t * 5), 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(yo.x * k, yo.y * k);
  ctx.rotate(yo.a);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.strokeRect(0.5, 0.5, lado - 1, lado - 1);
}

// Vista previa redonda de un mapa, para el menú de mapas. Si no hay mundo, dibuja el "aleatorio".
export function dibujarVistaMapa(ctx, mundo, lado) {
  const r = lado / 2;
  ctx.clearRect(0, 0, lado, lado);
  ctx.save();
  ctx.beginPath(); ctx.arc(r, r, r - 5, 0, TAU); ctx.clip();
  if (!mundo) {
    const g = ctx.createRadialGradient(r, r, 4, r, r, r);
    g.addColorStop(0, '#2f9fb8'); g.addColorStop(1, '#12405e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = `800 ${lado * 0.5}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', r, r + lado * 0.03);
  } else {
    const t = mundo.tema, k = lado / mundo.ancho;
    const g = ctx.createRadialGradient(r, r, 4, r, r, r);
    const c = (q) => `rgb(${q[1]},${q[2]},${q[3]})`;
    g.addColorStop(0, c(t.mar[0])); g.addColorStop(1, c(t.mar[t.mar.length - 1]));
    ctx.fillStyle = g; ctx.fillRect(0, 0, lado, lado);
    // el mundo es cuadrado y la vista redonda: se achica un poco para que las costas de los bordes entren
    const E = 0.8;
    ctx.save();
    ctx.translate(r * (1 - E), r * (1 - E));
    ctx.scale(k * E, k * E);
    const tierras = mundo.islas.filter((i) => !ESCOLLO[i.tipo]);
    const capa = (escala, color, px) => { ctx.fillStyle = color; for (const i of tierras) { trazarIsla(ctx, i, px ? Math.max(0.3, 1 - px / i.r) : escala); ctx.fill(); } };
    capa(1.2, t.bajos[1]);
    capa(1.04, t.arena[0]);
    capa(0, t.pasto[0], 55);
    capa(0, t.pasto[1], 260);
    for (const i of mundo.islas) {
      if (!ESCOLLO[i.tipo]) continue;
      ctx.fillStyle = i.tipo === 'iceberg' ? '#f6fcff' : t.arena[0];
      ctx.beginPath(); ctx.arc(i.x, i.y, Math.max(i.r, 1.4 / k), 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2 / k;
    for (const w of mundo.remolinos) { ctx.beginPath(); ctx.arc(w.x, w.y, 2.6 / k, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // el puerto
    ctx.fillStyle = '#ffe89a'; ctx.strokeStyle = '#3d2310'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(r + (mundo.puerto.x * k - r) * E, r + (mundo.puerto.y * k - r) * E, Math.max(2.5, lado * 0.028), 0, TAU); ctx.fill(); ctx.stroke();
  }
  // sombra interior para dar profundidad
  const som = ctx.createRadialGradient(r, r, r * 0.6, r, r, r);
  som.addColorStop(0, 'rgba(0,0,0,0)'); som.addColorStop(1, 'rgba(0,10,25,0.32)');
  ctx.fillStyle = som; ctx.fillRect(0, 0, lado, lado);
  ctx.restore();
  // aro de bronce con los cuatro rumbos
  const aro = ctx.createLinearGradient(0, 0, lado, lado);
  aro.addColorStop(0, '#f3d98b'); aro.addColorStop(0.5, '#a67c2e'); aro.addColorStop(1, '#e8c770');
  ctx.strokeStyle = aro; ctx.lineWidth = Math.max(3, lado * 0.045);
  ctx.beginPath(); ctx.arc(r, r, r - 4, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,25,5,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(r, r, r - 4 - Math.max(1.5, lado * 0.022), 0, TAU); ctx.stroke();
  ctx.fillStyle = '#f3d98b';
  for (let q = 0; q < 4; q++) {
    const ang = -Math.PI / 2 + (q * Math.PI) / 2, t = Math.max(3, lado * 0.045) * (q === 0 ? 1.5 : 1);
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(ang) * (r - 0.5), r + Math.sin(ang) * (r - 0.5));
    ctx.lineTo(r + Math.cos(ang + 0.09) * (r - 4 - t), r + Math.sin(ang + 0.09) * (r - 4 - t));
    ctx.lineTo(r + Math.cos(ang - 0.09) * (r - 4 - t), r + Math.sin(ang - 0.09) * (r - 4 - t));
    ctx.fill();
  }
}
