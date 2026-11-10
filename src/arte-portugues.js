// Arte de los barcos portugueses (carabelas y naos de la ruta de la India), vista 100 % cenital, proa hacia +x. Un diseño propio por casco:
// balandra (carabela latina, esfera armilar), bergantín (carabela de dos latinas, gallo de Barcelos) y galeón (nao con castillo de popa alto, dragón alado).
// Todas las velas llevan la cruz de la Orden de Cristo, la de las naves de Vasco da Gama.
const TAU = Math.PI * 2;
const TIPOS = {
  balandra: {
    L: 58, W: 21, palos: 1, cañones: 2, tr: .52, px: [-.2, .14], bauprés: .08, mascaron: 0, galeria: 0, timon: true, spritsail: false,
    mastiles: [.04], principal: 0, velas: ['L'],
    items: [{ t: 'escotilla', x: -.2, w: .2, h: .15 }],
  },
  bergantin: {
    L: 78, W: 28, palos: 2, cañones: 4, tr: .6, px: [-.14, .26], bauprés: .1, mascaron: 1, galeria: 1, timon: false, spritsail: false, popaAlta: -.26,
    mastiles: [-.14, .14], principal: 0, velas: ['L', 'L'],
    items: [{ t: 'escotilla', x: .0, w: .22, h: .17 }, { t: 'cabrestante', x: .3 }, { t: 'claraboya', x: -.36 }],
  },
  galeon: {
    L: 104, W: 40, palos: 3, cañones: 6, tr: .74, px: [-.1, .26], bauprés: .12, mascaron: 2, galeria: 2, timon: false, spritsail: true, popaAlta: -.12, proaAlta: .37, catheads: true,
    mastiles: [-.3, -.02, .2], principal: 1, velas: ['L', [[.76, .44], [.55, .36], [.36, .28]], [[.68, .4], [.5, .33], [.33, .25]]],
    items: [{ t: 'escotilla', x: -.05, w: .2, h: .16 }, { t: 'bote', x: .14 }, { t: 'cabrestante', x: .28 }, { t: 'claraboya', x: -.4 }],
  },
};
const ESTILO = {
  casco: '#4a2f18', borda: '#6a4424', franja: '#1f5f3a', oro: '#d8a93a', oroOscuro: '#9c721a', cubierta: '#b88a55', cubiertaAlta: '#c99d62',
  palo: '#4a2c12', azul: '#1d3a78', rojo: '#c8102e', blanco: '#f4f1e8', velas: ['#e9e2cc', '#f5f1e4', '#fbf8ee'],
};
const E = ESTILO;
let ABIERTAS = 1; // 0 (velas aferradas) a 1 (todo desplegado)

function mezclar(hex, con, f) {
  const p = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h); const n = m ? parseInt(m[1], 16) : 0xf5f1e4; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const a = p(hex), b = p(con);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join('');
}
// tres tonos de vela a partir del color del barco: la capa baja es más oscura y la alta más clara
const escalaVela = (col) => [mezclar(col || '#f5f1e4', '#6b5a3a', .1), col || '#f5f1e4', mezclar(col || '#f5f1e4', '#ffffff', .4)];
function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Casco: proa fina, el punto más ancho un poco a popa del centro y espejo de popa recto.
const perfiles = new Map();
function perfil(L, W, tr) {
  const k = `${L}|${W}|${tr}`;
  if (perfiles.has(k)) return perfiles.get(k);
  const bz = (p, t) => { const u = 1 - t; const f = (i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]; return [f(0), f(1)]; };
  const a = [[L * .5, 0], [L * .36, W * .2], [L * .2, W * .5], [-L * .08, W * .5]];
  const b = [[-L * .08, W * .5], [-L * .3, W * .5], [-L * .5, W * (tr * .5 + .06)], [-L * .5, W * tr * .5]];
  const pts = [];
  for (let i = 0; i <= 30; i++) pts.push(bz(a, i / 30));
  for (let i = 1; i <= 30; i++) pts.push(bz(b, i / 30));
  perfiles.set(k, pts);
  return pts;
}
function mitad(c, x) {
  const p = perfil(c.L, c.W, c.tr);
  if (x >= p[0][0]) return 0;
  for (let i = 1; i < p.length; i++) if (p[i][0] <= x) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 || 1)); }
  return p[p.length - 1][1];
}
function casco(ctx, c, kx = 1, ky = 1) {
  const { L, W, tr } = c;
  ctx.beginPath(); ctx.save(); ctx.scale(kx, ky);
  ctx.moveTo(L * .5, 0);
  ctx.bezierCurveTo(L * .36, W * .2, L * .2, W * .5, -L * .08, W * .5);
  ctx.bezierCurveTo(-L * .3, W * .5, -L * .5, W * (tr * .5 + .06), -L * .5, W * tr * .5);
  ctx.lineTo(-L * .5, -W * tr * .5);
  ctx.bezierCurveTo(-L * .5, -W * (tr * .5 + .06), -L * .3, -W * .5, -L * .08, -W * .5);
  ctx.bezierCurveTo(L * .2, -W * .5, L * .36, -W * .2, L * .5, 0);
  ctx.closePath(); ctx.restore();
}

function tablones(ctx, L, W) {
  ctx.strokeStyle = 'rgba(70,40,15,.35)'; ctx.lineWidth = .45;
  for (let y = -W * .4; y < W * .4; y += W * .075) { ctx.beginPath(); ctx.moveTo(-L / 2, y); ctx.lineTo(L / 2, y); ctx.stroke(); }
  ctx.lineWidth = .35;
  for (let y = -W * .4, f = 0; y < W * .4; y += W * .075, f++) for (let x = -L * .45 + (f % 3) * L * .11; x < L * .45; x += L * .33) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + W * .075); ctx.stroke(); }
}

// Cubierta elevada (castillo de proa o de popa): más clara, con un escalón sombreado y baranda.
function alto(ctx, c, xe, dir) {
  const { L, W } = c;
  ctx.save(); casco(ctx, c, .9, .76); ctx.clip();
  const x0 = dir > 0 ? xe : -L, x1 = dir > 0 ? L : xe;
  ctx.fillStyle = E.cubiertaAlta; ctx.fillRect(x0, -W, x1 - x0, 2 * W);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, -W, x1 - x0, 2 * W); ctx.clip(); tablones(ctx, L, W); ctx.restore();
  const g = ctx.createLinearGradient(xe, 0, xe - dir * W * .12, 0); g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(xe, xe - dir * W * .12), -W, W * .12, 2 * W);
  ctx.strokeStyle = '#3a2614'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(xe, -W); ctx.lineTo(xe, W); ctx.stroke();
  ctx.fillStyle = '#3a2614'; for (let y = -W * .36; y <= W * .36; y += W * .06) { ctx.beginPath(); ctx.arc(xe, y, .55, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function cubierta(ctx, c) {
  const { L, W } = c;
  casco(ctx, c); ctx.fillStyle = E.casco; ctx.fill();
  casco(ctx, c, .985, .9); ctx.fillStyle = E.borda; ctx.fill();
  casco(ctx, c, .985, .94); ctx.strokeStyle = E.franja; ctx.lineWidth = W * .04; ctx.stroke();
  casco(ctx, c, .985, .905); ctx.strokeStyle = E.oro; ctx.lineWidth = .4; ctx.stroke();
  casco(ctx, c); ctx.strokeStyle = '#0e0905'; ctx.lineWidth = .7; ctx.stroke();
  casco(ctx, c, .9, .76);
  const g = ctx.createLinearGradient(0, -W * .4, 0, W * .4);
  g.addColorStop(0, '#9a6a30'); g.addColorStop(.5, E.cubierta); g.addColorStop(1, '#9a6a30');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); casco(ctx, c, .9, .76); ctx.clip(); tablones(ctx, L, W); ctx.restore();
  if (c.popaAlta !== undefined) alto(ctx, c, c.popaAlta * L, -1);
  if (c.proaAlta !== undefined) alto(ctx, c, c.proaAlta * L, 1);
}

function itemsCubierta(ctx, c) {
  const { L, W } = c;
  ctx.save(); casco(ctx, c, .9, .76); ctx.clip();
  for (const it of c.items) {
    ctx.save(); ctx.translate(it.x * L, 0);
    if (it.t === 'escotilla') {
      const w = it.w * W * 2.4, h = it.h * W * 2.4;
      ctx.fillStyle = '#3a2410'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = '#d9b27a'; ctx.lineWidth = .4; ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.lineWidth = .3; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + (w * k) / 4, -h / 2); ctx.lineTo(-w / 2 + (w * k) / 4, h / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + (h * k) / 4); ctx.lineTo(w / 2, -h / 2 + (h * k) / 4); ctx.stroke(); }
    } else if (it.t === 'cabrestante') {
      ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(0, 0, W * .065, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .5; ctx.stroke();
      ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = .7; for (let k = 0; k < 4; k++) { const a = (k * TAU) / 4 + .4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * W * .12, Math.sin(a) * W * .12); ctx.stroke(); }
    } else if (it.t === 'bote') {
      ctx.fillStyle = '#7a5226'; ctx.beginPath(); ctx.ellipse(0, 0, L * .055, W * .075, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .5; ctx.stroke();
      ctx.fillStyle = '#4a2c12'; ctx.beginPath(); ctx.ellipse(0, 0, L * .042, W * .052, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9b6e3c'; ctx.lineWidth = .5; for (const k of [-.02, .0, .02]) { ctx.beginPath(); ctx.moveTo(L * k, -W * .045); ctx.lineTo(L * k, W * .045); ctx.stroke(); }
    } else if (it.t === 'claraboya') {
      ctx.fillStyle = '#3a2410'; ctx.fillRect(-W * .09, -W * .075, W * .18, W * .15); ctx.strokeStyle = E.oro; ctx.lineWidth = .6; ctx.strokeRect(-W * .09, -W * .075, W * .18, W * .15);
      ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(0, -W * .075); ctx.lineTo(0, W * .075); ctx.moveTo(-W * .09, 0); ctx.lineTo(W * .09, 0); ctx.stroke();
    }
    ctx.restore();
  }
  // caña del timón en el barco chico
  if (c.timon) { ctx.strokeStyle = '#4a2c12'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-L * .5 + 1, 0); ctx.lineTo(-L * .5 + W * .42, 0); ctx.stroke(); ctx.fillStyle = E.oro; ctx.beginPath(); ctx.arc(-L * .5 + W * .42, 0, .9, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Portas de cañón en ambas bandas, con la boca negra asomando.
function puertos(ctx, c, d, r) {
  const { L, W, cañones: n } = c;
  if (n < 1) return;
  const pRoto = [0, .12, .28, .45][d];
  for (let i = 0; i < n; i++) {
    const x = L * (c.px[0] + ((c.px[1] - c.px[0]) * (n === 1 ? .5 : i / (n - 1))));
    for (const s of [-1, 1]) {
      const y = s * mitad(c, x) * .83, roto = r() < pRoto;
      ctx.fillStyle = '#0a0604'; ctx.fillRect(x - L * .016, y - W * .033, L * .032, W * .066);
      ctx.strokeStyle = E.oroOscuro; ctx.lineWidth = .35; ctx.strokeRect(x - L * .016, y - W * .033, L * .032, W * .066);
      if (roto) {
        ctx.fillStyle = '#08141f'; ctx.beginPath();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, q = W * (.045 + r() * .045); const px = x + Math.cos(a) * q * 1.4, py = y + Math.sin(a) * q; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#e2c08a'; ctx.lineWidth = .5; for (let k = 0; k < 4; k++) { const a = r() * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * W * .12, y + Math.sin(a) * W * .1); ctx.stroke(); }
      } else {
        ctx.fillStyle = '#1c1c1c'; ctx.beginPath(); ctx.arc(x, y + s * W * .055, W * .024, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = .3; ctx.stroke();
      }
    }
  }
}

// Balcón de popa dorado, que sobresale del espejo.
function galeria(ctx, c) {
  if (!c.galeria) return;
  const { L, W, tr } = c, hw = W * tr * .5 * .9, p = W * (c.galeria === 2 ? .11 : .07), n = c.galeria === 2 ? 5 : 3;
  ctx.beginPath(); ctx.moveTo(-L * .5 + .5, -hw); ctx.lineTo(-L * .5 - p, -hw * .84); ctx.lineTo(-L * .5 - p, hw * .84); ctx.lineTo(-L * .5 + .5, hw); ctx.closePath();
  ctx.fillStyle = E.casco; ctx.fill(); ctx.strokeStyle = E.oro; ctx.lineWidth = W * .025; ctx.stroke();
  for (let i = 0; i < n; i++) {
    const y = -hw * .64 + (hw * 1.28 * i) / (n - 1);
    ctx.fillStyle = '#f0c75a'; ctx.fillRect(-L * .5 - p * .78, y - W * .024, p * .5, W * .048); ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = .3; ctx.strokeRect(-L * .5 - p * .78, y - W * .024, p * .5, W * .048);
  }
}

// Mascarones de proa vistos desde arriba, uno propio por tamaño: esfera armilar (balandra), gallo de Barcelos (bergantín) y dragón alado (galeón).
const OSC = '#7a5514';
function esfera(ctx, r) {
  // esfera armilar de Manuel I: aros dorados cruzados
  ctx.strokeStyle = OSC; ctx.fillStyle = '#c9962e';
  ctx.lineWidth = r * .22; ctx.beginPath(); ctx.arc(0, 0, r * .95, 0, TAU); ctx.stroke();
  ctx.strokeStyle = E.oro; ctx.lineWidth = r * .14; ctx.beginPath(); ctx.arc(0, 0, r * .95, 0, TAU); ctx.stroke();
  for (const [rx, ry] of [[.5, .95], [.95, .5]]) { ctx.strokeStyle = OSC; ctx.lineWidth = r * .15; ctx.beginPath(); ctx.ellipse(0, 0, r * rx, r * ry, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = E.oro; ctx.lineWidth = r * .08; ctx.stroke(); }
  ctx.strokeStyle = E.oro; ctx.lineWidth = r * .1; ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.lineTo(r * 1.1, 0); ctx.stroke();
  ctx.fillStyle = '#c8102e'; ctx.strokeStyle = OSC; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(0, 0, r * .26, 0, TAU); ctx.fill(); ctx.stroke();
}
function galo(ctx, r) {
  // gallo de Barcelos visto desde arriba: cuerpo negro, cola en abanico, cresta roja y florcitas pintadas
  const NEGRO = '#1a1a1d', ROJO = '#c8102e', VERDE = '#1f7a4a';
  ctx.strokeStyle = OSC; ctx.lineWidth = .35;
  for (let k = -2; k <= 2; k++) { // cola
    ctx.fillStyle = k % 2 ? NEGRO : '#2b2b30'; ctx.beginPath(); ctx.ellipse(-r * 1.0, k * r * .26, r * .6, r * .12, k * .35, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = k % 2 ? ROJO : VERDE; ctx.beginPath(); ctx.arc(-r * 1.5 + Math.abs(k) * r * .12, k * r * .42, r * .08, 0, TAU); ctx.fill();
  }
  for (const s of [-1, 1]) { // alas plegadas
    ctx.fillStyle = NEGRO; ctx.beginPath(); ctx.ellipse(-r * .15, s * r * .38, r * .55, r * .22, s * .25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ROJO; ctx.beginPath(); ctx.arc(-r * .3, s * r * .4, r * .07, 0, TAU); ctx.fill();
    ctx.fillStyle = E.oro; ctx.beginPath(); ctx.arc(-r * .05, s * r * .36, r * .06, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = NEGRO; ctx.beginPath(); ctx.ellipse(0, 0, r * .62, r * .34, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = VERDE; ctx.beginPath(); ctx.arc(-r * .1, 0, r * .09, 0, TAU); ctx.fill();
  ctx.fillStyle = NEGRO; ctx.beginPath(); ctx.ellipse(r * .72, 0, r * .26, r * .2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = E.oro; ctx.beginPath(); ctx.moveTo(r * .92, -r * .09); ctx.lineTo(r * 1.3, 0); ctx.lineTo(r * .92, r * .09); ctx.closePath(); ctx.fill();
  ctx.fillStyle = ROJO; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(r * (.62 - Math.abs(k) * .05), k * r * .11, r * .1, 0, TAU); ctx.fill(); } // cresta
  ctx.fillStyle = '#e9b13a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(r * .8, s * r * .13, r * .04, 0, TAU); ctx.fill(); }
}
function dragon(ctx, r) {
  // dragón alado de la casa de Avís, visto desde arriba: alas abiertas hacia atrás, cuerpo y cola, cabeza con cuernos
  const verde = '#1f7a4a', oscuro = '#124a2b';
  for (const s of [-1, 1]) {
    const puntas = [[-r * 1.15, s * r * 1.25], [-r * .55, s * r * 1.45], [r * .1, s * r * 1.2]];
    ctx.fillStyle = verde; ctx.strokeStyle = oscuro; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(r * .15, s * r * .12); for (const [x, y] of puntas) ctx.lineTo(x, y); ctx.lineTo(-r * .6, s * r * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = E.oro; ctx.lineWidth = r * .07; ctx.lineCap = 'round';
    for (const [x, y] of puntas) { ctx.beginPath(); ctx.moveTo(r * .15, s * r * .12); ctx.lineTo(x, y); ctx.stroke(); }
  }
  // cola con una punta en flecha
  ctx.strokeStyle = oscuro; ctx.lineWidth = r * .3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * .2, 0); ctx.quadraticCurveTo(-r * 1.1, r * .35, -r * 1.7, 0); ctx.stroke();
  ctx.strokeStyle = verde; ctx.lineWidth = r * .18; ctx.stroke();
  ctx.fillStyle = E.oro; ctx.beginPath(); ctx.moveTo(-r * 1.65, -r * .18); ctx.lineTo(-r * 2.0, 0); ctx.lineTo(-r * 1.65, r * .18); ctx.closePath(); ctx.fill();
  // cuerpo y cabeza
  ctx.fillStyle = verde; ctx.strokeStyle = oscuro; ctx.lineWidth = .45;
  ctx.beginPath(); ctx.ellipse(-r * .05, 0, r * .62, r * .26, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = E.oro; ctx.lineWidth = r * .06; ctx.beginPath(); ctx.moveTo(-r * .6, 0); ctx.lineTo(r * .5, 0); ctx.stroke();
  ctx.fillStyle = verde; ctx.strokeStyle = oscuro; ctx.lineWidth = .45;
  ctx.beginPath(); ctx.moveTo(r * .35, -r * .2); ctx.quadraticCurveTo(r * .9, -r * .22, r * 1.35, -r * .08); ctx.lineTo(r * 1.35, r * .08); ctx.quadraticCurveTo(r * .9, r * .22, r * .35, r * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.strokeStyle = E.oro; ctx.lineWidth = r * .09; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * .55, s * r * .16); ctx.lineTo(r * .2, s * r * .5); ctx.stroke();
    ctx.fillStyle = '#e9b13a'; ctx.beginPath(); ctx.ellipse(r * .78, s * r * .12, r * .08, r * .05, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#100604'; ctx.beginPath(); ctx.arc(r * .8, s * r * .12, r * .025, 0, TAU); ctx.fill();
  }
}
function bauprés(ctx, c) {
  const { L, W } = c, x0 = L * (c.proaAlta !== undefined ? .34 : .36), x1 = L * (.5 + c.bauprés);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = '#2a190b'; ctx.lineWidth = W * .06; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
  ctx.strokeStyle = '#6e4521'; ctx.lineWidth = W * .035; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
  ctx.strokeStyle = E.oro; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(L * .5, 0); ctx.lineTo(x1, 0); ctx.stroke();
  ctx.restore();
  if (c.catheads) {
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(L * .38, s * W * .3); ctx.lineTo(L * .4, s * W * .44); ctx.stroke(); ctx.fillStyle = '#6e4521'; ctx.beginPath(); ctx.arc(L * .4, s * W * .44, 1.2, 0, TAU); ctx.fill(); }
  }
}

// vela latina: triángulo grande con la entena en diagonal. lado = 1 o -1 según a qué banda se carga
function latina(ctx, mx, W, k, lado, col) {
  const x0 = mx + W * .45 * k, x1 = mx - W * .66 * k, ancho = W * .4 * k;
  if (ABIERTAS <= 0) { ctx.strokeStyle = E.palo; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, lado * ancho * .8); ctx.stroke(); return; }
  ctx.save(); ctx.scale(1, lado);
  const f = () => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, ancho * .75 * (.4 + .6 * ABIERTAS), x1, ancho); ctx.lineTo(x1, -ancho * .05); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 3 * lado); f(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  f(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); f(); ctx.clip();
  const g = ctx.createLinearGradient(x0, 0, x1, ancho); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.5, 'rgba(60,40,15,0)'); g.addColorStop(1, 'rgba(60,40,15,.1)');
  ctx.fillStyle = g; ctx.fillRect(x1, -ancho, x0 - x1, ancho * 3);
  // paños cosidos y fajas de rizos
  ctx.strokeStyle = 'rgba(90,70,40,.2)'; ctx.lineWidth = .35;
  for (let k = .1; k < 1; k += .1) { const x = x1 + (x0 - x1) * k; ctx.beginPath(); ctx.moveTo(x, -ancho * .05); ctx.lineTo(x, ancho * .9 * (1 - k)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,95,55,.26)'; ctx.lineWidth = .9;
  for (const o of [.18, .34]) { ctx.beginPath(); ctx.moveTo(x1, ancho * (1 - o * 1.9)); ctx.lineTo(x0 - (x0 - x1) * o * .5, 0); ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,95,55,.16)'; for (const [ux, uy] of [[.35, .12], [.6, .08], [.22, .3]]) ctx.fillRect(x1 + (x0 - x1) * ux - 1.6, ancho * uy - 1.2, 3.2, 2.4);
  cruzCristo(ctx, x0 + (x1 - x0) * .45, ancho * .26, Math.min(ancho * .3, 8), Math.min(ancho * .17, 4.5));
  ctx.strokeStyle = 'rgba(110,80,40,.4)'; ctx.lineWidth = 1.4; f(); ctx.stroke();
  ctx.restore();
  // escota: el cabo que sale de la punta baja de la vela hacia la borda
  ctx.strokeStyle = 'rgba(60,40,15,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x1, ancho); ctx.lineTo(x1 + W * .12 * k, ancho * .55); ctx.stroke();
  ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; f(); ctx.stroke();
  ctx.strokeStyle = E.palo; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, ancho * .22, x1, ancho); ctx.stroke();
  ctx.restore();
}
// cruz de la Orden de Cristo: roja, con los brazos que se ensanchan y una cruz blanca fina adentro
function cruzCristo(ctx, cx, cy, ay, ax) {
  const rojo = '#c8102e', gy = ay * .28;
  ctx.fillStyle = rojo;
  ctx.fillRect(cx - ax, cy - gy, ax * 2, gy * 2);
  ctx.fillRect(cx - ax * .42, cy - ay, ax * .84, ay * 2);
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx - ax * .42, cy + sy * ay * .7); ctx.lineTo(cx - ax * .8, cy + sy * ay); ctx.lineTo(cx + ax * .8, cy + sy * ay); ctx.lineTo(cx + ax * .42, cy + sy * ay * .7); ctx.closePath(); ctx.fill(); }
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * ax * .7, cy - gy); ctx.lineTo(cx + sx * ax, cy - gy * 1.5); ctx.lineTo(cx + sx * ax, cy + gy * 1.5); ctx.lineTo(cx + sx * ax * .7, cy + gy); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#f4f1e8'; ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(cx - ax * .75, cy); ctx.lineTo(cx + ax * .75, cy); ctx.moveTo(cx, cy - ay * .8); ctx.lineTo(cx, cy + ay * .8); ctx.stroke();
}
function velaForma(ctx, mx, h, bul) {
  ctx.beginPath(); ctx.moveTo(mx, -h); ctx.quadraticCurveTo(mx + bul, 0, mx, h); ctx.quadraticCurveTo(mx + bul * .28, 0, mx, -h); ctx.closePath();
}
function pano(ctx, mx, h, bul, col, cruz) {
  if (ABIERTAS <= 0) { ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, -h); ctx.lineTo(mx, h); ctx.stroke(); ctx.strokeStyle = E.palo; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, -h - 1.5); ctx.lineTo(mx, h + 1.5); ctx.stroke(); return; }
  bul *= .25 + .75 * ABIERTAS;
  ctx.save(); ctx.translate(2.4, 3.2); velaForma(ctx, mx, h, bul); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  velaForma(ctx, mx, h, bul); ctx.fillStyle = col; ctx.fill();
  ctx.save(); velaForma(ctx, mx, h, bul); ctx.clip();
  const g = ctx.createLinearGradient(mx, 0, mx + bul * .5, 0); g.addColorStop(0, 'rgba(60,40,15,.28)'); g.addColorStop(.6, 'rgba(60,40,15,0)'); g.addColorStop(1, 'rgba(255,255,255,.1)');
  ctx.fillStyle = g; ctx.fillRect(mx - 1, -h, bul, 2 * h);
  // costuras del paño
  ctx.strokeStyle = 'rgba(90,70,40,.28)'; ctx.lineWidth = .4;
  for (let k = -.8; k <= .81; k += .27) { const f = 1 - k * k; ctx.beginPath(); ctx.moveTo(mx + .14 * bul * f, k * h); ctx.lineTo(mx + .5 * bul * f, k * h); ctx.stroke(); }
  // fajas de rizos (más oscuras, paralelas a la verga) y remiendos de lienzo
  ctx.strokeStyle = 'rgba(120,95,55,.26)'; ctx.lineWidth = .9;
  for (const o of [.3, .62]) { ctx.beginPath(); for (let k = -.92; k <= .921; k += .08) { const x = mx + bul * (.14 + .36 * o) * (1 - k * k), y = k * h; k < -.9 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,95,55,.16)';
  for (const [ux, uy] of [[.55, -.55], [.4, .62], [.7, .3]]) ctx.fillRect(mx + bul * .5 * ux * (1 - uy * uy) - 1.6, uy * h - 1.2, 3.2, 2.4);
  if (cruz) cruzCristo(ctx, mx + bul * .24, 0, Math.min(h * .5, 9), Math.min(bul * .2, 5));
  // relinga: el cabo cosido al borde de la vela
  ctx.strokeStyle = 'rgba(110,80,40,.4)'; ctx.lineWidth = 1.4; velaForma(ctx, mx, h, bul); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; velaForma(ctx, mx, h, bul); ctx.stroke();
  ctx.strokeStyle = E.palo; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, -h - 1.5); ctx.lineTo(mx, h + 1.5); ctx.stroke();
}
// vela de un solo lado (foque o cangreja): borde recto sobre el eje y panza hacia +y
function velaLateral(ctx, x0, x1, panza, col) {
  if (ABIERTAS <= 0) return;
  panza *= .25 + .75 * ABIERTAS;
  const xm = (x0 + x1) / 2;
  const f = () => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(xm, panza, x1, 0); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 3); f(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  f(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,70,40,.28)'; ctx.lineWidth = .35;
  for (let k = .2; k < .95; k += .22) { const x = x0 + (x1 - x0) * k; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, panza * .5 * (1 - Math.pow(2 * k - 1, 2))); ctx.stroke(); }
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
  let k = cache.get(ctx.canvas);
  if (!k) { k = document.createElement('canvas'); cache.set(ctx.canvas, k); }
  if (k.width !== ctx.canvas.width || k.height !== ctx.canvas.height) { k.width = ctx.canvas.width; k.height = ctx.canvas.height; }
  return k;
}

// o: { L, W (los del casco del juego), canones (por lado), abiertas (0 a 1), colorVela, d (daño 0 sano a 3 crítico) }
export function pintarPortugues(ctx, tipo, o) {
  const d = o.d || 0, seed = 7;
  const c = { ...TIPOS[tipo], L: o.L, W: o.W * 1.12, cañones: o.canones };
  const { L, W, palos } = c;
  ABIERTAS = o.abiertas;
  E.velas = escalaVela(o.colorVela);
  const pos = c.mastiles.map((f) => f * L);
  ctx.save(); ctx.lineJoin = 'round';
  // sombra en el agua
  ctx.save(); ctx.translate(4, 6); casco(ctx, c, 1.05, 1.12); ctx.fillStyle = 'rgba(0,20,40,.3)'; ctx.fill(); ctx.restore();
  cubierta(ctx, c);
  itemsCubierta(ctx, c);
  // daño sobre cubierta
  if (d >= 1) {
    const q = azar(seed + 3), hoyos = [0, 1, 3, 5][d], grietas = [0, 3, 6, 10][d];
    ctx.save(); casco(ctx, c, .9, .76); ctx.clip();
    for (let i = 0; i < [0, 3, 5, 8][d]; i++) { const x = (q() - .5) * L * .8, y = (q() - .5) * W * .6; const g = ctx.createRadialGradient(x, y, 0, x, y, W * .18); g.addColorStop(0, 'rgba(10,5,2,.55)'); g.addColorStop(1, 'rgba(10,5,2,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, W * .18, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(25,12,4,.9)'; ctx.lineWidth = .7;
    for (let i = 0; i < grietas; i++) { let x = (q() - .5) * L * .8, y = (q() - .5) * W * .5; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (q() - .3) * W * .22; y += (q() - .5) * W * .18; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < hoyos; i++) { const x = (-.3 + q() * .6) * L, y = (q() - .5) * W * .4; agujero(ctx, x, y, W * (.07 + q() * .05), q); }
    ctx.restore();
  }
  puertos(ctx, c, d, azar(seed + 4));
  galeria(ctx, c);
  // brecha en el casco (crítico)
  if (d >= 3) {
    const q = azar(seed + 5), x = -L * .08, y = mitad(c, x) * .78;
    agujero(ctx, x, y, W * .17, q);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .9;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + (i - 1.5) * W * .09, mitad(c, x) + 2, 2.2 + i * .4, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = 'rgba(10,40,80,.16)'; casco(ctx, c); ctx.fill();
  }
  // velas y palos en una capa aparte para poder rasgar la tela
  const tmp = capa(ctx), tc = tmp.getContext('2d');
  tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, tmp.width, tmp.height); tc.setTransform(ctx.getTransform()); tc.lineJoin = 'round';
  const q = azar(seed + 6);
  const cortes = (mx, h, bul, n) => {
    tc.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) {
      const cx = mx + q() * bul * .4, cy = (q() * 2 - 1) * h * .8, rad = W * (.05 + q() * .08);
      tc.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = rad * (.5 + q() * .9); k ? tc.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : tc.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } tc.fill();
    }
    tc.globalCompositeOperation = 'source-over';
  };
  const nCortes = [0, 0, 2, 4][d];
  // foque entre la proa y el palo de proa
  const proaPalo = pos[pos.length - 1];
  velaLateral(tc, proaPalo + W * .05, L * (.5 + c.bauprés), W * .3, E.velas[1]);
  if (d >= 2) cortes((proaPalo + L * .5) / 2, W * .12, 0, 1);
  if (c.spritsail) { pano(tc, L * (.5 + .07), W * .27, W * .2, E.velas[1], true); if (d >= 2) cortes(L * .57, W * .2, W * .2, 1); }
  const roto0 = d >= 3 && palos > 1;
  pos.forEach((mx, m) => {
    const roto = roto0 && m === 0;
    if (roto) {
      // palo quebrado: tocón y tela caída sobre la borda
      tc.fillStyle = E.palo; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
      tc.strokeStyle = '#e2c08a'; tc.lineWidth = .8; for (let i = 0; i < 5; i++) { const a = q() * TAU; tc.beginPath(); tc.moveTo(mx, 0); tc.lineTo(mx + Math.cos(a) * W * .1, Math.sin(a) * W * .1); tc.stroke(); }
      tc.save(); tc.translate(mx - W * .05, W * .22); tc.rotate(.35);
      for (let i = 0; i < 6; i++) { tc.fillStyle = i % 2 ? '#f5f1e4' : '#d9d2bd'; tc.beginPath(); tc.moveTo(0, i * W * .09 - W * .1); tc.lineTo(W * .5 + q() * W * .15, i * W * .09 - W * .1 + q() * 3); tc.lineTo(W * .45 + q() * W * .15, i * W * .09 - W * .01); tc.lineTo(0, i * W * .09); tc.fill(); }
      tc.strokeStyle = E.palo; tc.lineWidth = 1.6; tc.beginPath(); tc.moveTo(0, -W * .12); tc.lineTo(W * .6, -W * .05); tc.stroke();
      tc.restore();
      return;
    }
    const capas = c.velas[m] === 'L' ? [] : c.velas[m] || [];
    if (c.velas[m] === 'L') {
      latina(tc, mx, W, palos === 3 ? 1.05 : 1, m % 2 ? -1 : 1, E.velas[1]);
      cortes(mx - W * .1, W * .3, W * .3, nCortes);
    }
    capas.forEach(([hf, bf], i) => pano(tc, mx, W * hf, W * bf, E.velas[i], i === capas.length - 1));
    if (capas.length) {
      const [hf, bf] = capas[0];
      cortes(mx, W * hf, W * bf, nCortes);
      if (d >= 3) { tc.globalCompositeOperation = 'destination-out'; tc.beginPath(); tc.moveTo(mx + W * bf * .4, W * hf * .9); tc.lineTo(mx + W * bf * .1, W * hf * .1); tc.lineTo(mx + W * bf * .38, W * hf * .3); tc.lineTo(mx + W * bf * .55, W * hf * .7); tc.fill(); tc.globalCompositeOperation = 'source-over'; }
    }
    tc.fillStyle = E.palo; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
    if (m === c.principal) { tc.strokeStyle = '#8a5a2b'; tc.lineWidth = 1; tc.beginPath(); tc.arc(mx, 0, W * .1, 0, TAU); tc.stroke(); }
  });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tmp, 0, 0); ctx.restore();
  // bauprés y mascarón encima de la tela, para que el león se vea
  ctx.save(); ctx.translate(1, 1.6); ctx.globalAlpha = .25; ctx.translate(L * .5 - W * .06, 0); ctx.fillStyle = '#001428'; ctx.beginPath(); ctx.arc(0, 0, W * .12, 0, TAU); ctx.fill(); ctx.restore();
  bauprés(ctx, c);
  const rl = W * [.12, .17, .17][c.mascaron];
  ctx.save(); ctx.translate(L * .5 - rl * (c.mascaron === 2 ? .8 : .5), 0);
  // plataforma oscura bajo el mascarón, para que no se pierda contra la vela
  ctx.fillStyle = E.casco; ctx.strokeStyle = E.oro; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(rl * .2, 0, rl * (c.mascaron === 2 ? 1.25 : 1.05), rl * (c.mascaron === 2 ? 1.05 : .62), 0, 0, TAU); ctx.fill(); ctx.stroke();
  [esfera, galo, dragon][c.mascaron](ctx, rl); ctx.restore();
  ctx.restore();
  return pos[c.principal]; // x del palo principal, donde dibujo.js cuelga la bandera de la civilización
}
