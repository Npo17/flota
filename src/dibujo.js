// Todo lo que se pinta en el canvas.
import { hash2 } from './rng.js';
import { FACCIONES } from './config.js';
import { dibujarBandera } from './banderas.js';
import { candidatoAbordaje, difAng, ALCANCE_GANCHO } from './juego.js';
import { t as tx } from './idioma.js';
import { pintarBritanico } from './arte-britanico.js';
import { pintarVikingo } from './arte-vikingo.js';
import { pintarEspanol } from './arte-espanol.js';
import { pintarPortugues } from './arte-portugues.js';

const TAU = Math.PI * 2;
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
const ARTE = { britanicos: pintarBritanico, vikingos: pintarVikingo, espanoles: pintarEspanol, portugueses: pintarPortugues };
function nivelDano(b) {
  const f = b.vida / b.stats.vidaMax;
  return !(f < 1) ? 0 : f > 0.75 ? 0 : f > 0.5 ? 1 : f > 0.25 ? 2 : 3;
}
function imagenBarco(b, e) {
  const d = b.diseno;
  const pintar = ARTE[d.faccion], dano = pintar ? nivelDano(b) : 0;
  const clave = `${d.faccion}|${d.casco}|${d.canones}|${d.municion}|${b.velas}|${b.colorVela || ''}|${dano}`;
  let img = imagenes.get(clave);
  if (img) return img;
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
      colorVela: b.colorVela || e.vela, colorRayas: e.colorPatron, escudos: e.escudos, d: dano,
    });
    if (b.velas > 0) { // bandera de la civilización, flameando hacia popa
      ctx.save();
      ctx.translate(mx - 15, -4.5);
      dibujarBandera(ctx, d.faccion, 13, 9);
      ctx.restore();
    }
    if (imagenes.size > 400) imagenes.clear();
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
    if (principal) { // bandera de la civilización, flameando hacia popa
      ctx.save();
      ctx.translate(mx - 15, -4.5);
      dibujarBandera(ctx, b.diseno.faccion, 13, 9);
      ctx.restore();
    }
    if (principal) { // cofa
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(mx, 0, 4.2, 0, TAU); ctx.stroke();
    }
  }

  if (imagenes.size > 400) imagenes.clear();
  imagenes.set(clave, img);
  return img;
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
  const img = imagenBarco(b, e);
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

  // farol y bandera del bando, flameando en popa
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath(); ctx.arc(-L * 0.47, 0, 1.6, 0, TAU); ctx.fill();
  const onda = Math.sin(T * 6 + b.id) * 2.2;
  ctx.fillStyle = b.bandera;
  ctx.beginPath();
  ctx.moveTo(-L * 0.5, -1);
  ctx.quadraticCurveTo(-L * 0.5 - 6, -5 + onda, -L * 0.5 - 13, -4 - onda);
  ctx.lineTo(-L * 0.5 - 13, 4 - onda);
  ctx.quadraticCurveTo(-L * 0.5 - 6, 3 + onda, -L * 0.5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  if (opciones.sinBarra || b.hundiendo) return;
  // barras de vida y tripulación
  const ancho = Math.max(36, L * 0.7), x = b.x - ancho / 2, y = b.y - L * 0.5 - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 1, y - 1, ancho + 2, 10);
  const fv = Math.max(0, b.vida / s.vidaMax);
  ctx.fillStyle = b.bando === 'enemigo' ? '#e5484d' : '#3ecf5e';
  ctx.fillRect(x, y, ancho * fv, 5);
  ctx.fillStyle = '#e8c16a';
  ctx.fillRect(x, y + 6, ancho * Math.max(0, Math.min(1, b.trip / s.tripMax)), 2);
  if (b.bando === 'enemigo' && opciones.etiqueta) {
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
    dibujarBandera(ctx, b.diseno.faccion, 12, 8.5);
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

export function dibujarEscena(ctx, j, vista) {
  const { ancho, alto, raton } = vista;
  const yo = j.jugador;
  const zoom = vista.zoom;
  const sx = (Math.random() - 0.5) * (j.sacudon || 0), sy = (Math.random() - 0.5) * (j.sacudon || 0);
  const camX = yo.x + sx, camY = yo.y + sy;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(zoom, 0, 0, zoom, ancho / 2 - camX * zoom, alto / 2 - camY * zoom);
  const vw = ancho / zoom, vh = alto / zoom;
  const x0 = camX - vw / 2, y0 = camY - vh / 2;
  const visible = (x, y, m) => x > x0 - m && x < x0 + vw + m && y > y0 - m && y < y0 + vh + m;

  // mar: más claro cerca del puerto, más oscuro mar adentro (un solo color por cuadro, según dónde estás)
  const p = j.mundo.puerto;
  ctx.fillStyle = colorMar(j.mundo.tema.mar, Math.hypot(camX - p.x, camY - p.y) / 3400);
  ctx.fillRect(x0 - 10, y0 - 10, vw + 20, vh + 20);

  // olitas: agrupadas en tres trazos según su brillo
  const C = 110;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const grupos = [[], [], []];
  for (let gx = Math.floor(x0 / C); gx <= Math.floor((x0 + vw) / C); gx++) {
    for (let gy = Math.floor(y0 / C); gy <= Math.floor((y0 + vh) / C); gy++) {
      const h = hash2(gx, gy), h2 = hash2(gy + 91, gx - 17);
      const brillo = 0.5 + 0.5 * Math.sin(j.t * 1.3 + h * 20);
      grupos[Math.min(2, Math.floor(brillo * 3))].push(gx * C + h * C + Math.sin(j.t * 0.6 + h * 9) * 8, gy * C + h2 * C);
    }
  }
  for (let g = 0; g < 3; g++) {
    const pts = grupos[g];
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + g * 0.05})`;
    ctx.beginPath();
    for (let q = 0; q < pts.length; q += 2) {
      const wx = pts[q], wy = pts[q + 1];
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 8, wy - 5, wx + 16, wy);
      ctx.quadraticCurveTo(wx + 24, wy + 5, wx + 32, wy);
    }
    ctx.stroke();
  }

  // borde del mundo
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, j.mundo.ancho - 80, j.mundo.alto - 80);
  ctx.setLineDash([]);

  // remolinos
  for (const w of j.mundo.remolinos) {
    if (!visible(w.x, w.y, w.radio + 20)) continue;
    const gr = ctx.createRadialGradient(w.x, w.y, 5, w.x, w.y, w.radio);
    gr.addColorStop(0, 'rgba(3,18,35,0.9)');
    gr.addColorStop(0.35, 'rgba(8,45,75,0.55)');
    gr.addColorStop(1, 'rgba(8,45,75,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.radio, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.2;
    for (let brazo = 0; brazo < 4; brazo++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const f = k / 30;
        const ang = brazo * (TAU / 4) + f * 4.2 * w.giro - j.t * 1.6 * w.giro;
        const r = 12 + f * (w.radio - 20);
        const x = w.x + Math.cos(ang) * r, y = w.y + Math.sin(ang) * r;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // tierras, por capas: así las manchas que se tocan forman una sola costa
  const tema = j.mundo.tema;
  const aLaVista = j.mundo.islas.filter((isla) => visible(isla.x, isla.y, isla.r * 1.6));
  const capa = (escala, color, soloTierra) => {
    ctx.fillStyle = color;
    for (const isla of aLaVista) {
      if (soloTierra && ESCOLLO[isla.tipo]) continue;
      trazarIsla(ctx, isla, isla.r > 300 ? 1 + (escala - 1) * (300 / isla.r) : escala);
      ctx.fill();
    }
  };
  capa(1.42, tema.bajos[0]);
  capa(1.24, tema.bajos[1]);
  capa(1.1, tema.arena[0], true);
  capa(1.0, tema.arena[1], true);
  // pasto o nieve: en las tierras grandes llega casi hasta la costa
  ctx.fillStyle = tema.pasto[0];
  for (const isla of aLaVista) { if (!ESCOLLO[isla.tipo]) { trazarIsla(ctx, isla, isla.r > 300 ? 1 - 60 / isla.r : 0.8); ctx.fill(); } }
  ctx.fillStyle = tema.pasto[1];
  for (const isla of aLaVista) { if (!ESCOLLO[isla.tipo]) { trazarIsla(ctx, isla, isla.r > 300 ? 1 - 150 / isla.r : 0.52); ctx.fill(); } }
  // arrecifes y bancos: arena a flor de agua con algunas piedras
  for (const isla of aLaVista) {
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
  for (const isla of aLaVista) {
    if (isla.tipo !== 'iceberg') continue;
    ctx.fillStyle = '#cfe6f2';
    trazarIsla(ctx, isla, 1.05, true); ctx.fill();
    ctx.fillStyle = '#f6fcff';
    ctx.save(); ctx.translate(-isla.r * 0.08, -isla.r * 0.1); trazarIsla(ctx, isla, 0.82, true); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(120,170,200,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(isla.x - isla.r * 0.3, isla.y - isla.r * 0.2); ctx.lineTo(isla.x + isla.r * 0.1, isla.y + isla.r * 0.05); ctx.lineTo(isla.x + isla.r * 0.05, isla.y + isla.r * 0.4); ctx.stroke();
  }
  for (const isla of aLaVista) {
    if (ESCOLLO[isla.tipo]) continue;
    for (const r of isla.rocas) {
      ctx.fillStyle = '#6f6a63';
      ctx.beginPath(); ctx.arc(isla.x + r.x, isla.y + r.y, r.s, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8d877f';
      ctx.beginPath(); ctx.arc(isla.x + r.x - 2, isla.y + r.y - 2, r.s * 0.6, 0, TAU); ctx.fill();
    }
    if (tema.arbol !== 'ninguno') {
      for (const pa of isla.palmeras) {
        const px = isla.x + pa.x, py = isla.y + pa.y;
        if (!visible(px, py, 20)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.arc(px + 4, py + 5, 9 * pa.s, 0, TAU); ctx.fill();
        if (tema.arbol === 'pino') {
          ctx.fillStyle = '#2f5f3a';
          ctx.beginPath(); ctx.arc(px, py, 9 * pa.s, 0, TAU); ctx.fill();
          ctx.fillStyle = '#3f7a48';
          ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, 5.5 * pa.s, 0, TAU); ctx.fill();
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
    if (isla.esPuerto) dibujarPuerto(ctx, j, isla);
  }

  // zona segura del puerto
  ctx.strokeStyle = 'rgba(255,236,170,0.5)';
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);

  // partículas bajo los barcos
  for (const pt of j.particulas) {
    if (pt.tipo !== 'estela' && pt.tipo !== 'salpicon') continue;
    if (!visible(pt.x, pt.y, 30)) continue;
    const f = pt.t / pt.vida;
    if (pt.tipo === 'estela') {
      ctx.fillStyle = `rgba(255,255,255,${0.32 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (1 + f * 1.6), 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - f)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * (0.4 + f * 1.6), 0, TAU); ctx.stroke();
    }
  }

  // cofres
  for (const c of j.cofres) {
    const sube = Math.sin(j.t * 3 + c.x) * 2;
    ctx.fillStyle = 'rgba(255,220,120,0.25)';
    ctx.beginPath(); ctx.arc(c.x, c.y, 16 + Math.sin(j.t * 4 + c.y) * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b3f1a';
    ctx.fillRect(c.x - 8, c.y - 6 + sube, 16, 12);
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(c.x - 8, c.y - 2 + sube, 16, 3);
    ctx.fillRect(c.x - 1.5, c.y - 6 + sube, 3, 12);
  }

  // abanicos de puntería: uno por costado
  if (!yo.hundiendo && yo.diseno.canones >= 2) {
    const ab = yo.stats.perdigones > 1 ? 0.3 : 0.2;
    for (const lado of [-1, 1]) {
      const centro = yo.a + lado * Math.PI / 2;
      const listo = yo.recarga[lado] <= 0;
      ctx.fillStyle = listo ? 'rgba(255,240,170,0.11)' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = listo ? 'rgba(255,240,170,0.45)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(yo.x, yo.y);
      ctx.arc(yo.x, yo.y, yo.stats.alcance + yo.stats.ancho / 2, centro - ab, centro + ab);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // hasta dónde llega el gancho, hacia el cursor
    if (!j.gancho && j.cdAbordaje <= 0 && candidatoAbordaje(j)) {
      const ag = Math.atan2(raton.y - yo.y, raton.x - yo.x);
      ctx.strokeStyle = 'rgba(217,192,138,0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.beginPath(); ctx.moveTo(yo.x, yo.y); ctx.lineTo(yo.x + Math.cos(ag) * ALCANCE_GANCHO, yo.y + Math.sin(ag) * ALCANCE_GANCHO); ctx.stroke();
      ctx.setLineDash([]);
    }
    // marca de rumbo donde está el cursor
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(raton.x, raton.y, 9, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(raton.x, raton.y, 2, 0, TAU); ctx.stroke();
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
    dibujarBarco(ctx, b, { etiqueta: true });
    if (b === yo && j.nombreJugador && !b.hundiendo) {
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const ny = b.y - b.stats.largo * 0.5 - 27;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(j.nombreJugador, b.x + 1, ny + 1);
      ctx.fillStyle = '#b8ffcb';
      ctx.fillText(j.nombreJugador, b.x, ny);
    }
  }

  // gancho de abordaje
  if (j.gancho) {
    const g = j.gancho, hx = g.fase === 'vuelo' ? g.x : g.obj.x, hy = g.fase === 'vuelo' ? g.y : g.obj.y;
    ctx.strokeStyle = '#d9c08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(yo.x, yo.y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#3a3a40';
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, TAU); ctx.fill();
  }

  // tritones
  for (const tr of j.tritones) {
    ctx.save();
    ctx.translate(tr.x, tr.y);
    ctx.rotate(tr.a);
    ctx.fillStyle = '#1d7f73';
    ctx.beginPath(); ctx.ellipse(-4, 0, 11, 5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-22, -6 + Math.sin(tr.t * 12) * 3); ctx.lineTo(-22, 6 + Math.sin(tr.t * 12) * 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7fe0c2';
    ctx.beginPath(); ctx.arc(7, 0, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f2e6b0';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(2, 7); ctx.lineTo(20, 7); ctx.moveTo(16, 4); ctx.lineTo(21, 4); ctx.moveTo(16, 10); ctx.lineTo(21, 10); ctx.moveTo(16, 4); ctx.lineTo(16, 10); ctx.stroke();
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

function dibujarPuerto(ctx, j, isla) {
  const p = j.mundo.puerto;
  // muelle
  ctx.fillStyle = '#7a5630';
  ctx.fillRect(p.x - 9, isla.y + isla.r * 0.6, 18, p.y - isla.y - isla.r * 0.6 - 30);
  ctx.fillRect(p.x - 34, p.y - 44, 68, 14);
  ctx.strokeStyle = 'rgba(40,25,10,0.5)';
  ctx.lineWidth = 1;
  for (let y = isla.y + isla.r * 0.6; y < p.y - 34; y += 8) { ctx.beginPath(); ctx.moveTo(p.x - 9, y); ctx.lineTo(p.x + 9, y); ctx.stroke(); }
  // casitas
  const casas = [[-50, -20, '#c0563a'], [-10, -40, '#d9a441'], [34, -16, '#b94a4a'], [8, 10, '#8a5fb0']];
  for (const [dx, dy, color] of casas) {
    const x = isla.x + dx, y = isla.y + dy;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x - 12, y - 9, 30, 24);
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(x - 14, y - 12, 28, 22);
    ctx.fillStyle = color;
    ctx.fillRect(x - 14, y - 12, 28, 11);
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
    if (b.bando === 'enemigo' && !b.esJugador && Math.hypot(b.x - yo.x, b.y - yo.y) > 1500) continue;
    ctx.fillStyle = b.esJugador ? '#ffd166' : b.bando === 'enemigo' ? '#ff6b6b' : '#7dff9b';
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
