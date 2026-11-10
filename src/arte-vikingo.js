// Arte de los barcos vikingos, vista 100 % cenital, proa hacia +x. Balandra con proa de voluta (estilo Oseberg),
// bergantín con dragón sin cuernos y galeón con dragón con cuernos enroscados.
// Se pinta una sola vez en la imagen cacheada de dibujo.js; la bandera del bando, el farol, los remos y el humo los pone dibujo.js.
const TAU = Math.PI * 2;
let ABIERTAS = 1; // 0 (velas aferradas) a 1 (todo desplegado)
let CANONES = { n: 0, grosor: 3.2 };
const TIPOS = {
  balandra: { L: 58, W: 24, palos: 1, cañones: 4 },
  bergantin: { L: 78, W: 32, palos: 2, cañones: 8 },
  galeon: { L: 104, W: 44, palos: 3, cañones: 12 },
};
const ESTILO = {
  casco: '#3b2210', borda: '#6a4122', madera: '#b9843f', maderaOscura: '#8a5c2a',
  vela1: '#b3261e', vela2: '#f1e8d2', oro: '#d9a82e', oroOscuro: '#9c721a',
  escudos: ['#b3261e', '#e0b23c', '#2d5d8a', '#2f7a4a'],
};

function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mitad = (L, W, x) => { const u = Math.abs(x / (L / 2)); return (W / 2) * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.55); };

function ruta(ctx, L, W, kx = 1, ky = 1) {
  ctx.beginPath();
  ctx.save(); ctx.scale(kx, ky);
  ctx.moveTo(L * .5, 0);
  ctx.bezierCurveTo(L * .32, W * .28, L * .18, W * .5, -L * .05, W * .5);
  ctx.bezierCurveTo(-L * .28, W * .5, -L * .42, W * .28, -L * .5, W * .06);
  ctx.lineTo(-L * .5, -W * .06);
  ctx.bezierCurveTo(-L * .42, -W * .28, -L * .28, -W * .5, -L * .05, -W * .5);
  ctx.bezierCurveTo(L * .18, -W * .5, L * .32, -W * .28, L * .5, 0);
  ctx.closePath();
  ctx.restore();
}

function escudos(ctx, L, W, d, r) {
  const n = Math.round(L / 6.4), rad = W * 0.085;
  const pFalta = [0, .1, .28, .5][d];
  for (let i = 0; i < n; i++) {
    const x = -L * .36 + (L * .72 * i) / (n - 1);
    for (const s of [-1, 1]) {
      if (r() < pFalta) continue;
      const y = s * mitad(L, W, x) * .93;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + .8, y + .9, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = ESTILO.escudos[(i + (s > 0 ? 1 : 0)) % 4]; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .6; ctx.stroke();
      ctx.fillStyle = '#d8d2c0'; ctx.beginPath(); ctx.arc(x, y, rad * .32, 0, TAU); ctx.fill();
      if (d >= 2 && r() < .35) { ctx.strokeStyle = 'rgba(30,15,5,.8)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x - rad * .8, y - rad * .3); ctx.lineTo(x + rad * .2, y + rad * .2); ctx.lineTo(x + rad * .7, y + rad * .8); ctx.stroke(); }
    }
  }
}

function canones(ctx, L, W) {
  // tubos oscuros con la boca más clara, como en el resto de los barcos
  const n = CANONES.n, g = CANONES.grosor;
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (-0.32 + (0.64 * i) / (n - 1)) * L;
    for (const lado of [-1, 1]) {
      const y0 = lado * W * 0.3, y1 = lado * (W * 0.5 + 3.5);
      ctx.fillStyle = '#6b4320'; ctx.fillRect(off - g / 2 - 1, Math.min(y0, lado * W * 0.38), g + 2, W * 0.08);
      ctx.fillStyle = '#1b1b1f'; ctx.fillRect(off - g / 2, Math.min(y0, y1), g, Math.abs(y1 - y0));
      ctx.fillStyle = '#55555c'; ctx.fillRect(off - g / 2, y1 - (lado > 0 ? 1.6 : 0), g, 1.6);
    }
  }
}

function cubierta(ctx, L, W, d, r, mastiles) {
  // tablazón: anillos de borda y cubierta con vetas
  ruta(ctx, L, W, 1, 1); ctx.fillStyle = ESTILO.casco; ctx.fill();
  ruta(ctx, L, W, .97, .93); ctx.fillStyle = ESTILO.borda; ctx.fill();
  ctx.save(); ruta(ctx, L, W, .97, .93); ctx.clip();
  ctx.strokeStyle = 'rgba(20,10,4,.45)'; ctx.lineWidth = .5;
  for (const k of [.96, .9, .84]) { ruta(ctx, L, W, .97 * k, .93 * k); ctx.stroke(); }
  ctx.restore();
  ruta(ctx, L, W, .9, .76);
  const g = ctx.createLinearGradient(0, -W * .4, 0, W * .4);
  g.addColorStop(0, '#9a6a30'); g.addColorStop(.5, ESTILO.madera); g.addColorStop(1, '#9a6a30');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ruta(ctx, L, W, .9, .76); ctx.clip();
  ctx.strokeStyle = 'rgba(70,40,15,.35)'; ctx.lineWidth = .45;
  for (let y = -W * .4; y < W * .4; y += W * .075) { ctx.beginPath(); ctx.moveTo(-L / 2, y); ctx.lineTo(L / 2, y); ctx.stroke(); }
  // juntas cortas entre tablones
  ctx.lineWidth = .35;
  for (let y = -W * .4, f = 0; y < W * .4; y += W * .075, f++) for (let x = -L * .45 + (f % 3) * L * .11; x < L * .45; x += L * .33) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + W * .075); ctx.stroke(); }
  // carga y accesorios entre los palos
  const n = Math.floor(L / 24);
  for (let i = 0; i < n; i++) {
    const x = -L * .36 + (L * .72 * (i + .5)) / n;
    if (mastiles.some((m) => Math.abs(x - m) < W * .32)) continue;
    const s = i % 2 ? 1 : -1, y = s * W * .2, tipo = (i + Math.floor(r() * 3)) % 4;
    ctx.save(); ctx.translate(x, y);
    if (tipo === 0) { ctx.fillStyle = '#3a2410'; ctx.fillRect(-W * .09, -W * .07, W * .18, W * .14); ctx.strokeStyle = '#d9b27a'; ctx.lineWidth = .4; ctx.strokeRect(-W * .09, -W * .07, W * .18, W * .14); ctx.beginPath(); ctx.moveTo(-W * .09, 0); ctx.lineTo(W * .09, 0); ctx.stroke(); }
    else if (tipo === 1) { ctx.fillStyle = '#7a5226'; ctx.fillRect(-W * .07, -W * .07, W * .14, W * .14); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = .5; ctx.strokeRect(-W * .07, -W * .07, W * .14, W * .14); ctx.beginPath(); ctx.moveTo(-W * .07, -W * .07); ctx.lineTo(W * .07, W * .07); ctx.moveTo(W * .07, -W * .07); ctx.lineTo(-W * .07, W * .07); ctx.stroke(); }
    else if (tipo === 2) { ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(0, 0, W * .075, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .5; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, W * .045, 0, TAU); ctx.stroke(); }
    else { ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = .8; for (const k of [.08, .055, .03]) { ctx.beginPath(); ctx.arc(0, 0, W * k, 0, TAU); ctx.stroke(); } }
    ctx.restore();
  }
  ctx.restore();
}

// Proa tallada: la cabeza de dragón es de madera oscura con vetas doradas, como las de los barcos de Oseberg.
const MADERA_T = '#4a2b14', MADERA_T2 = '#6e4521', ORO_T = '#d9a82e';
function trazoAfilado(ctx, pts, w0, w1, color) {
  ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 1; i < pts.length; i++) { const f = i / (pts.length - 1); ctx.lineWidth = w0 + (w1 - w0) * f; ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke(); }
}
function voluta(cx, cy, r0, r1, a0, giro, vueltas, pasos = 40) {
  const pts = [];
  for (let k = 0; k <= pasos; k++) { const f = k / pasos, a = a0 + giro * f * vueltas * TAU, r = r0 + (r1 - r0) * f; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
function cabezaDragon(ctx, s, nivel) {
  const dos = (fn) => { fn(1); ctx.save(); ctx.scale(1, -1); fn(-1); ctx.restore(); };
  const madera = ctx.createLinearGradient(0, -.5 * s, 0, .5 * s);
  madera.addColorStop(0, MADERA_T); madera.addColorStop(.5, MADERA_T2); madera.addColorStop(1, MADERA_T);
  if (nivel >= 2) {
    // cuernos enroscados, como de carnero
    dos(() => {
      const pts = voluta(1.45 * s, .88 * s, .5 * s, .09 * s, -Math.PI / 2, -1, 1.55);
      trazoAfilado(ctx, pts, .2 * s, .06 * s, '#2a190b');
      trazoAfilado(ctx, pts, .13 * s, .03 * s, '#8a5a2b');
      trazoAfilado(ctx, pts, .035 * s, .01 * s, ORO_T);
    });
    // espinas de la melena a lo largo de la mejilla
    dos(() => { for (const [x, l] of [[1.35, .3], [1.6, .36], [1.85, .3]]) { ctx.fillStyle = '#2a190b'; ctx.beginPath(); ctx.moveTo((x - .08) * s, .38 * s); ctx.lineTo((x - .3) * s, (.38 + l) * s); ctx.lineTo((x + .1) * s, .42 * s); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ORO_T; ctx.lineWidth = .35; ctx.stroke(); } });
  } else {
    // orejas puntiagudas hacia atrás, sin cuernos enroscados
    dos(() => {
      for (const [x0, y0, x1, y1, w] of [[1.55, .36, .85, .85, .34], [1.75, .4, 1.25, .9, .22]]) {
        trazoAfilado(ctx, [[x0 * s, y0 * s], [((x0 + x1) / 2 + .05) * s, ((y0 + y1) / 2 - .05) * s], [x1 * s, y1 * s]], w * s, .03 * s, '#2a190b');
        trazoAfilado(ctx, [[x0 * s, y0 * s], [((x0 + x1) / 2 + .05) * s, ((y0 + y1) / 2 - .05) * s], [x1 * s, y1 * s]], w * .55 * s, .015 * s, MADERA_T2);
      }
    });
  }
  // cuello: poste tallado
  ctx.beginPath(); ctx.moveTo(-.3 * s, 0); ctx.bezierCurveTo(.1 * s, -.3 * s, .5 * s, -.2 * s, 1.2 * s, -.2 * s); ctx.lineTo(1.2 * s, .2 * s); ctx.bezierCurveTo(.5 * s, .2 * s, .1 * s, .3 * s, -.3 * s, 0); ctx.closePath();
  ctx.fillStyle = madera; ctx.fill(); ctx.strokeStyle = '#2a190b'; ctx.lineWidth = .7; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = ORO_T; ctx.lineWidth = .45;
  if (nivel >= 2) {
    ctx.lineWidth = .55;
    for (let x = -.15 * s; x < 1.2 * s; x += .26 * s) for (const y of [-.1, .1]) { ctx.beginPath(); ctx.ellipse(x, y * s, .19 * s, .12 * s, y > 0 ? .5 : -.5, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = ORO_T; ctx.fillRect(1.05 * s, -.3 * s, .1 * s, .6 * s);
  } else {
    for (let x = -.1 * s; x < 1.2 * s; x += .24 * s) { ctx.beginPath(); ctx.moveTo(x - .14 * s, -.32 * s); ctx.lineTo(x + .06 * s, 0); ctx.lineTo(x - .14 * s, .32 * s); ctx.stroke(); }
  }
  ctx.restore();
  // cabeza
  const cabeza = () => {
    ctx.beginPath(); ctx.moveTo(1.1 * s, .17 * s);
    ctx.bezierCurveTo(1.3 * s, .3 * s, 1.45 * s, .46 * s, 1.8 * s, .42 * s);   // nuca y mejilla
    ctx.bezierCurveTo(2.1 * s, .38 * s, 2.2 * s, .27 * s, 2.45 * s, .24 * s);  // frente a hocico
    ctx.bezierCurveTo(2.62 * s, .3 * s, 2.82 * s, .3 * s, 2.9 * s, .16 * s);   // aletas de la nariz
    ctx.lineTo(2.92 * s, 0);
    ctx.lineTo(2.92 * s, 0);
    ctx.bezierCurveTo(2.9 * s, -.16 * s, 2.62 * s, -.3 * s, 2.45 * s, -.24 * s);
    ctx.bezierCurveTo(2.2 * s, -.27 * s, 2.1 * s, -.38 * s, 1.8 * s, -.42 * s);
    ctx.bezierCurveTo(1.45 * s, -.46 * s, 1.3 * s, -.3 * s, 1.1 * s, -.17 * s);
    ctx.closePath();
  };
  cabeza(); ctx.fillStyle = madera; ctx.fill(); ctx.strokeStyle = '#2a190b'; ctx.lineWidth = .8; ctx.stroke();
  cabeza(); ctx.strokeStyle = ORO_T; ctx.lineWidth = .35; ctx.stroke();
  // boca entreabierta: se ve una línea oscura y los colmillos asomando por las comisuras
  ctx.fillStyle = '#1a0c05'; ctx.beginPath(); ctx.moveTo(2.2 * s, -.045 * s); ctx.lineTo(2.88 * s, -.03 * s); ctx.lineTo(2.88 * s, .03 * s); ctx.lineTo(2.2 * s, .045 * s); ctx.closePath(); ctx.fill();
  dos(() => {
    // fosa nasal
    ctx.fillStyle = '#120a04'; ctx.beginPath(); ctx.ellipse(2.74 * s, .2 * s, .05 * s, .03 * s, -.3, 0, TAU); ctx.fill();
    // ceja y ojo
    ctx.strokeStyle = '#1a0c05'; ctx.lineWidth = Math.max(.7, .05 * s); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1.55 * s, .4 * s); ctx.quadraticCurveTo(1.9 * s, .38 * s, 2.15 * s, .27 * s); ctx.stroke();
    ctx.save(); ctx.translate(1.95 * s, .27 * s); ctx.rotate(.35);
    ctx.fillStyle = '#e9b13a'; ctx.beginPath(); ctx.ellipse(0, 0, .12 * s, .07 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#100604'; ctx.beginPath(); ctx.ellipse(.01 * s, 0, .03 * s, .06 * s, 0, 0, TAU); ctx.fill();
    ctx.restore();
  });
  // detalle de oro en el hocico y la frente
  ctx.strokeStyle = ORO_T; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(1.6 * s, 0); ctx.lineTo(2.3 * s, 0); ctx.stroke();
  if (nivel >= 2) { ctx.fillStyle = ORO_T; ctx.beginPath(); ctx.moveTo(1.5 * s, 0); ctx.lineTo(1.65 * s, -.07 * s); ctx.lineTo(1.8 * s, 0); ctx.lineTo(1.65 * s, .07 * s); ctx.closePath(); ctx.fill(); }
}
function espiral(ctx, W) {
  // el tajamar de Oseberg visto desde arriba: un poste angosto que sube de la proa y termina en una cabeza enroscada
  // (de arriba se ve como una cabeza ovalada con un rizo apenas insinuado)
  const poste = [[-W * .32, 0], [W * .05, 0], [W * .2, 0]];
  trazoAfilado(ctx, poste, W * .08, W * .1, '#2a190b');
  trazoAfilado(ctx, poste, W * .05, W * .07, MADERA_T2);
  trazoAfilado(ctx, poste, W * .014, W * .014, ORO_T);
  const cx = W * .27;
  ctx.fillStyle = '#2a190b'; ctx.beginPath(); ctx.ellipse(cx, 0, W * .115, W * .085, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = MADERA_T2; ctx.beginPath(); ctx.ellipse(cx, 0, W * .09, W * .062, 0, 0, TAU); ctx.fill();
  const rizo = voluta(cx - W * .01, 0, W * .05, W * .012, Math.PI, -1, 1.3, 24);
  trazoAfilado(ctx, rizo, W * .02, W * .008, ORO_T);
}
function proa(ctx, tipo, L, W) {
  ctx.save();
  if (tipo === 'balandra') { ctx.translate(L * .47, 0); espiral(ctx, W); ctx.restore(); return; }
  const nivel = tipo === 'galeon' ? 2 : 1, s = W * (nivel === 2 ? .21 : .19); // proporción real: la cabeza mide cerca de un décimo del casco
  ctx.translate(L * .5 - s * 1.5, 0);
  ctx.save(); ctx.translate(1.2, 1.8); ctx.fillStyle = 'rgba(0,10,25,.25)'; ctx.beginPath(); ctx.ellipse(1.5 * s, 0, 1.6 * s, .5 * s, 0, 0, TAU); ctx.fill(); ctx.restore();
  cabezaDragon(ctx, s, nivel);
  ctx.restore();
}
function popa(ctx, L, W) {
  // remate de popa: una voluta chica, a juego con la proa
  ctx.save(); ctx.translate(-L * .5, 0); ctx.scale(-1, 1);
  ctx.scale(.7, .7); espiral(ctx, W);
  ctx.restore();
}
function velaForma(ctx, mx, h, bul) {
  ctx.beginPath(); ctx.moveTo(mx, -h); ctx.quadraticCurveTo(mx + bul, 0, mx, h); ctx.quadraticCurveTo(mx + bul * .28, 0, mx, -h); ctx.closePath();
}
function vela(ctx, mx, h, bul, d, r) {
  if (ABIERTAS <= 0) { ctx.strokeStyle = ESTILO.vela2; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, -h); ctx.lineTo(mx, h); ctx.stroke(); ctx.strokeStyle = '#4a2c12'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx, -h - 2); ctx.lineTo(mx, h + 2); ctx.stroke(); return; }
  bul *= .25 + .75 * ABIERTAS;
  const sombra = () => { ctx.save(); ctx.translate(3, 4); velaForma(ctx, mx, h, bul); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill(); ctx.restore(); };
  sombra();
  velaForma(ctx, mx, h, bul);
  ctx.save(); ctx.clip();
  const bandas = 7, bh = (2 * h) / bandas;
  for (let i = 0; i < bandas; i++) { ctx.fillStyle = i % 2 ? ESTILO.vela2 : ESTILO.vela1; ctx.fillRect(mx - 1, -h + i * bh, bul * 1.3, bh + .3); }
  const g = ctx.createLinearGradient(mx, 0, mx + bul * .8, 0); g.addColorStop(0, 'rgba(40,20,5,.35)'); g.addColorStop(.5, 'rgba(40,20,5,0)'); g.addColorStop(1, 'rgba(255,255,255,.12)');
  ctx.fillStyle = g; ctx.fillRect(mx - 1, -h, bul * 1.3, 2 * h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,20,5,.7)'; ctx.lineWidth = .6; velaForma(ctx, mx, h, bul); ctx.stroke();
  // verga
  ctx.strokeStyle = '#4a2c12'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(mx, -h - 2); ctx.lineTo(mx, h + 2); ctx.stroke();
}

function agujero(ctx, x, y, rad, r) {
  ctx.beginPath();
  const n = 9; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, q = rad * (.65 + r() * .6); const px = x + Math.cos(a) * q * 1.3, py = y + Math.sin(a) * q; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fillStyle = '#08141f'; ctx.fill(); ctx.strokeStyle = '#2a1608'; ctx.lineWidth = .8; ctx.stroke();
  ctx.strokeStyle = '#e2c08a'; ctx.lineWidth = .6;
  for (let i = 0; i < 6; i++) { const a = r() * TAU, q = rad * (1.1 + r() * .5); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rad * .9 * 1.2, y + Math.sin(a) * rad * .9); ctx.lineTo(x + Math.cos(a) * q * 1.3, y + Math.sin(a) * q); ctx.stroke(); }
}

const cache = new WeakMap();
function capa(ctx) {
  let c = cache.get(ctx.canvas);
  if (!c) { c = document.createElement('canvas'); cache.set(ctx.canvas, c); }
  if (c.width !== ctx.canvas.width || c.height !== ctx.canvas.height) { c.width = ctx.canvas.width; c.height = ctx.canvas.height; }
  return c;
}

// o: { L, W (los del casco del juego), canones (por lado), grosor (del cañón), abiertas (0 a 1), colorVela, colorRayas, escudos, d (daño 0 sano a 3 crítico) }
export function pintarVikingo(ctx, tipo, o) {
  const d = o.d || 0, seed = 7;
  const { palos } = TIPOS[tipo], L = o.L, W = o.W * 1.2;
  ABIERTAS = o.abiertas; CANONES = { n: o.canones, grosor: o.grosor };
  ESTILO.vela2 = o.colorVela || '#f1e8d2'; ESTILO.vela1 = o.colorRayas || '#b3261e';
  if (o.escudos) ESTILO.escudos = o.escudos;
  const r = azar(seed + palos * 31);
  const posiciones = palos === 1 ? [L * .06] : Array.from({ length: palos }, (_, m) => (-.24 + (.48 * m) / (palos - 1)) * L);
  ctx.save(); ctx.lineJoin = 'round';
  // sombra en el agua
  ctx.save(); ctx.translate(4, 6); ruta(ctx, L, W, 1.05, 1.12); ctx.fillStyle = 'rgba(0,20,40,.3)'; ctx.fill(); ctx.restore();
  cubierta(ctx, L, W, d, azar(seed + 2), posiciones);
  // daño sobre cubierta
  if (d >= 1) {
    const q = azar(seed + 3), hoyos = [0, 1, 3, 5][d], grietas = [0, 3, 6, 10][d];
    ctx.save(); ruta(ctx, L, W, .9, .76); ctx.clip();
    for (let i = 0; i < [0, 3, 5, 8][d]; i++) { const x = (q() - .5) * L * .8, y = (q() - .5) * W * .6; const g = ctx.createRadialGradient(x, y, 0, x, y, W * .18); g.addColorStop(0, 'rgba(10,5,2,.55)'); g.addColorStop(1, 'rgba(10,5,2,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, W * .18, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(25,12,4,.9)'; ctx.lineWidth = .7;
    for (let i = 0; i < grietas; i++) { let x = (q() - .5) * L * .8, y = (q() - .5) * W * .5; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (q() - .3) * W * .22; y += (q() - .5) * W * .18; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < hoyos; i++) { const x = (-.3 + q() * .6) * L, y = (q() - .5) * W * .4; agujero(ctx, x, y, W * (.07 + q() * .05), q); }
    ctx.restore();
  }
  escudos(ctx, L, W, d, azar(seed + 4));
  canones(ctx, L, W);
  // brecha en el casco (crítico)
  if (d >= 3) {
    const q = azar(seed + 5), x = -L * .08, y = mitad(L, W, x) * .78;
    ctx.save(); agujero(ctx, x, y, W * .17, q); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .9;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + (i - 1.5) * W * .09, mitad(L, W, x) + 2, 2.2 + i * .4, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = 'rgba(10,40,80,.16)'; ruta(ctx, L, W, 1, 1); ctx.fill();
  }
  proa(ctx, tipo, L, W);
  popa(ctx, L, W);
  // palos y velas (en una capa aparte para poder rasgar la tela)
  const tmp = capa(ctx), tc = tmp.getContext('2d');
  tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, tmp.width, tmp.height); tc.setTransform(ctx.getTransform()); tc.lineJoin = 'round';
  const q = azar(seed + 6);
  posiciones.forEach((mx, m) => {
    const principal = m === Math.floor(palos / 2), h = W * (principal ? .7 : .58), bul = W * (principal ? .42 : .34);
    const roto = d >= 3 && m === 0 && palos > 1;
    if (roto) {
      // palo quebrado: tocón y tela caída sobre la borda
      tc.fillStyle = '#4a2c12'; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
      tc.strokeStyle = '#e2c08a'; tc.lineWidth = .8; for (let i = 0; i < 5; i++) { const a = q() * TAU; tc.beginPath(); tc.moveTo(mx, 0); tc.lineTo(mx + Math.cos(a) * W * .1, Math.sin(a) * W * .1); tc.stroke(); }
      tc.save(); tc.translate(mx - W * .05, W * .22); tc.rotate(.35);
      for (let i = 0; i < 6; i++) { tc.fillStyle = i % 2 ? ESTILO.vela2 : ESTILO.vela1; tc.beginPath(); tc.moveTo(0, i * W * .09 - W * .1); tc.lineTo(W * .5 + q() * W * .15, i * W * .09 - W * .1 + q() * 3); tc.lineTo(W * .45 + q() * W * .15, i * W * .09 - W * .01); tc.lineTo(0, i * W * .09); tc.fill(); }
      tc.strokeStyle = '#4a2c12'; tc.lineWidth = 1.6; tc.beginPath(); tc.moveTo(0, -W * .12); tc.lineTo(W * .6, -W * .05); tc.stroke();
      tc.restore();
    } else {
      vela(tc, mx, h, bul, d, q);
      // rasgones: se recortan trozos irregulares de la tela
      const cortes = [0, 0, 3, 6][d];
      tc.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < cortes; i++) {
        const cx = mx + q() * bul * .55, cy = (q() * 2 - 1) * h * .8, rad = W * (.05 + q() * .08);
        tc.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = rad * (.5 + q() * .9); k ? tc.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : tc.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } tc.fill();
      }
      if (d >= 3) { tc.beginPath(); tc.moveTo(mx + bul * .8, h * .9); tc.lineTo(mx + bul * .2, h * .1); tc.lineTo(mx + bul * .75, h * .3); tc.lineTo(mx + bul * 1.1, h * .7); tc.fill(); }
      tc.globalCompositeOperation = 'source-over';
    }
    tc.fillStyle = '#4a2c12'; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
    if (principal && !roto) { tc.strokeStyle = '#8a5a2b'; tc.lineWidth = 1; tc.beginPath(); tc.arc(mx, 0, W * .1, 0, TAU); tc.stroke(); }
  });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tmp, 0, 0); ctx.restore();
  ctx.restore();
  return posiciones[Math.floor(palos / 2)]; // x del palo principal, donde dibujo.js cuelga la bandera de la civilización
}
