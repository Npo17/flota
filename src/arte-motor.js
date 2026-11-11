// Motor de arte por piezas, usado en el juego por src/arte-elegidos.js y en la galería propuestas/. Es el mismo estilo de src/arte-frances.js y src/arte-portugues.js (vista 100 % cenital, proa hacia +x,
// cuatro estados de daño), pero armado por piezas para poder probar muchos diseños. Lo que se elija pasa después a su src/arte-<civilización>.js.
export const TAU = Math.PI * 2;

const E0 = {
  casco: '#3a2a1a', borda: '#4a3524', franja: '#d4af37', oro: '#e0b83e', cubierta: '#b98a52', cubiertaAlta: '#c99d62',
  palo: '#4a2c12', relinga: 'rgba(110,80,40,.5)', porta: '#e0b83e', ventana: '#f0c75a', filo: '#0e0905',
};
let E = E0, AB = 1, SIN_REMOS = false;

export function mezclar(hex, con, f) {
  const p = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h); const n = m ? parseInt(m[1], 16) : 0xf5f1e4; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const a = p(hex), b = p(con);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join('');
}
const escalaVela = (col) => [mezclar(col || '#f5f1e4', '#6b5a3a', .1), col || '#f5f1e4', mezclar(col || '#f5f1e4', '#ffffff', .4)];
export function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- Casco ----------
// forma: u = proa llena (0 fina, 1 roma), bw = ancho de la proa chata (juncos), xm = dónde va la manga máxima,
// pl y pr = qué tan llena y redonda es la popa. tr = ancho del espejo de popa.
function perfil(c) {
  if (c._p) return c._p;
  const { L, W, tr } = c, f = c.forma || {};
  const u = f.u || 0, bw = f.bw || 0, xm = f.xm ?? -.08, pr = f.pr ?? .06, pl = f.pl ?? .3;
  const bz = (p, t) => { const v = 1 - t; const g = (i) => v * v * v * p[0][i] + 3 * v * v * t * p[1][i] + 3 * v * t * t * p[2][i] + t * t * t * p[3][i]; return [g(0), g(1)]; };
  const a = [[L * .5, W * bw * .5], [L * Math.min(.5, .36 + .13 * u), W * Math.max(bw * .5 + .03, .2 + .26 * u)], [L * (xm + .28 + .1 * u), W * .5], [L * xm, W * .5]];
  const b = [[L * xm, W * .5], [-L * pl, W * .5], [-L * .5, W * (tr * .5 + pr)], [-L * .5, W * tr * .5]];
  const pts = [];
  for (let i = 0; i <= 30; i++) pts.push(bz(a, i / 30));
  for (let i = 1; i <= 30; i++) pts.push(bz(b, i / 30));
  return (c._p = pts);
}
export function mitad(c, x) {
  const p = perfil(c);
  if (x >= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) if (p[i][0] <= x) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 || 1)); }
  return p[p.length - 1][1];
}
export function casco(ctx, c, kx = 1, ky = 1) {
  const p = perfil(c);
  ctx.beginPath(); ctx.moveTo(p[0][0] * kx, p[0][1] * ky);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0] * kx, p[i][1] * ky);
  for (let i = p.length - 1; i >= 0; i--) ctx.lineTo(p[i][0] * kx, -p[i][1] * ky);
  ctx.closePath();
}
const kd = (c) => c.kd || [.9, .76];
export function recorteCubierta(ctx, c) { casco(ctx, c, ...kd(c)); ctx.clip(); }

function tablones(ctx, L, W) {
  ctx.strokeStyle = 'rgba(70,40,15,.35)'; ctx.lineWidth = .45;
  for (let y = -W * .4; y < W * .4; y += W * .075) { ctx.beginPath(); ctx.moveTo(-L / 2, y); ctx.lineTo(L / 2, y); ctx.stroke(); }
  ctx.lineWidth = .35;
  for (let y = -W * .4, f = 0; y < W * .4; y += W * .075, f++) for (let x = -L * .45 + (f % 3) * L * .11; x < L * .45; x += L * .33) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + W * .075); ctx.stroke(); }
}

// Cubierta elevada (castillo de proa o de popa): más clara, con un escalón sombreado y baranda.
function alto(ctx, c, xe, dir) {
  const { L, W } = c;
  ctx.save(); recorteCubierta(ctx, c);
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
  const { L, W } = c, [kx, ky] = kd(c);
  casco(ctx, c); ctx.fillStyle = E.casco; ctx.fill();
  if (c.tingladillo) { // tablas solapadas, como en las cocas y los barcos del Báltico
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .45;
    for (const k of [.97, .94]) { casco(ctx, c, .995, k); ctx.stroke(); }
  }
  casco(ctx, c, .985, Math.min(.9, ky + .14)); ctx.fillStyle = E.borda; ctx.fill();
  if (E.franja) { casco(ctx, c, .985, Math.min(.94, ky + .18)); ctx.strokeStyle = E.franja; ctx.lineWidth = W * (c.franjaAncha || .055); ctx.stroke(); }
  if (E.franja2) { casco(ctx, c, .985, Math.min(.985, ky + .225)); ctx.strokeStyle = E.franja2; ctx.lineWidth = W * .03; ctx.stroke(); }
  casco(ctx, c, .985, Math.min(.905, ky + .145)); ctx.strokeStyle = E.oro; ctx.lineWidth = .4; ctx.stroke();
  casco(ctx, c); ctx.strokeStyle = E.filo; ctx.lineWidth = .7; ctx.stroke();
  casco(ctx, c, kx, ky);
  const sombra = mezclar(E.cubierta, '#4a2a08', .28);
  const g = ctx.createLinearGradient(0, -W * .4, 0, W * .4);
  g.addColorStop(0, sombra); g.addColorStop(.5, E.cubierta); g.addColorStop(1, sombra);
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); recorteCubierta(ctx, c); tablones(ctx, L, W); ctx.restore();
  if (c.popaAlta !== undefined) alto(ctx, c, c.popaAlta * L, -1);
  if (c.popaAlta2 !== undefined) alto(ctx, c, c.popaAlta2 * L, -1);
  if (c.proaAlta !== undefined) alto(ctx, c, c.proaAlta * L, 1);
}

function itemsCubierta(ctx, c) {
  const { L, W } = c;
  ctx.save(); recorteCubierta(ctx, c);
  for (const it of c.items || []) {
    ctx.save(); ctx.translate(it.x * L, (it.y || 0) * W);
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
    } else if (it.t === 'fardos') { // carga a la vista: fardos y toneles
      for (const [fx, fy, col] of [[-.03, -.08, '#a8824a'], [.0, .07, '#8a6a3a'], [.035, -.02, '#b8925a']]) { ctx.fillStyle = col; ctx.fillRect(fx * L - W * .07, fy * W - W * .06, W * .14, W * .12); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = .35; ctx.strokeRect(fx * L - W * .07, fy * W - W * .06, W * .14, W * .12); }
      ctx.fillStyle = '#6b4a22'; ctx.beginPath(); ctx.arc(-.07 * L, .06 * W, W * .055, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .4; ctx.stroke();
    }
    ctx.restore();
  }
  if (c.timon) { ctx.strokeStyle = '#4a2c12'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-L * .5 + 1, 0); ctx.lineTo(-L * .5 + W * .42, 0); ctx.stroke(); ctx.fillStyle = E.oro; ctx.beginPath(); ctx.arc(-L * .5 + W * .42, 0, .9, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Portas de cañón en ambas bandas, con la boca negra asomando.
function puertos(ctx, c, d, r) {
  const { L, W, cañones: n } = c;
  if (n < 1) return;
  const pRoto = [0, .12, .28, .45][d], ky = c.portaY || .83;
  for (let i = 0; i < n; i++) {
    const x = L * (c.px[0] + ((c.px[1] - c.px[0]) * (n === 1 ? .5 : i / (n - 1))));
    for (const s of [-1, 1]) {
      const y = s * mitad(c, x) * ky, roto = r() < pRoto;
      ctx.fillStyle = '#0a0604'; ctx.fillRect(x - L * .016, y - W * .033, L * .032, W * .066);
      ctx.strokeStyle = E.porta; ctx.lineWidth = .5; ctx.strokeRect(x - L * .016, y - W * .033, L * .032, W * .066);
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

// Balcón de popa, que sobresale del espejo.
function galeria(ctx, c) {
  if (!c.galeria) return;
  const { L, W, tr } = c, hw = W * tr * .5 * .9, p = W * (c.galeria === 2 ? .11 : .07), n = c.galeria === 2 ? 5 : 3;
  ctx.beginPath(); ctx.moveTo(-L * .5 + .5, -hw); ctx.lineTo(-L * .5 - p, -hw * .84); ctx.lineTo(-L * .5 - p, hw * .84); ctx.lineTo(-L * .5 + .5, hw); ctx.closePath();
  ctx.fillStyle = E.galeria || E.casco; ctx.fill(); ctx.strokeStyle = E.oro; ctx.lineWidth = W * .025; ctx.stroke();
  for (let i = 0; i < n; i++) {
    const y = -hw * .64 + (hw * 1.28 * i) / (n - 1);
    ctx.fillStyle = E.ventana; ctx.fillRect(-L * .5 - p * .78, y - W * .024, p * .5, W * .048); ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = .3; ctx.strokeRect(-L * .5 - p * .78, y - W * .024, p * .5, W * .048);
  }
}

function baupres(ctx, c) {
  if (!c.bauprés) return;
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

// ---------- Velas ----------
function velaForma(ctx, mx, h, bul) {
  ctx.beginPath(); ctx.moveTo(mx, -h); ctx.quadraticCurveTo(mx + bul, 0, mx, h); ctx.quadraticCurveTo(mx + bul * .28, 0, mx, -h); ctx.closePath();
}
// op: { emb(ctx, x, y, s) emblema, rayas: [color, cantidad] paños de color, relinga }
function pano(ctx, mx, h, bul, col, op = {}) {
  if (AB <= 0) { ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, -h); ctx.lineTo(mx, h); ctx.stroke(); ctx.strokeStyle = E.palo; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, -h - 1.5); ctx.lineTo(mx, h + 1.5); ctx.stroke(); return; }
  bul *= .25 + .75 * AB;
  ctx.save(); ctx.translate(2.4, 3.2); velaForma(ctx, mx, h, bul); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  velaForma(ctx, mx, h, bul); ctx.fillStyle = col; ctx.fill();
  ctx.save(); velaForma(ctx, mx, h, bul); ctx.clip();
  if (op.rayas) { const [rc, n] = op.rayas; ctx.fillStyle = rc; ctx.globalAlpha = .88; for (let k = 0; k < n; k += 2) ctx.fillRect(mx - 1, -h + (2 * h * k) / n, bul + 2, (2 * h) / n); ctx.globalAlpha = 1; }
  const g = ctx.createLinearGradient(mx, 0, mx + bul * .5, 0); g.addColorStop(0, 'rgba(60,40,15,.28)'); g.addColorStop(.6, 'rgba(60,40,15,0)'); g.addColorStop(1, 'rgba(255,255,255,.1)');
  ctx.fillStyle = g; ctx.fillRect(mx - 1, -h, bul, 2 * h);
  ctx.strokeStyle = 'rgba(90,70,40,.28)'; ctx.lineWidth = .4;
  for (let k = -.8; k <= .81; k += .27) { const f = 1 - k * k; ctx.beginPath(); ctx.moveTo(mx + .14 * bul * f, k * h); ctx.lineTo(mx + .5 * bul * f, k * h); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,95,55,.26)'; ctx.lineWidth = .9;
  for (const o of [.3, .62]) { ctx.beginPath(); for (let k = -.92; k <= .921; k += .08) { const x = mx + bul * (.14 + .36 * o) * (1 - k * k), y = k * h; k < -.9 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,95,55,.16)';
  for (const [ux, uy] of [[.55, -.55], [.4, .62], [.7, .3]]) ctx.fillRect(mx + bul * .5 * ux * (1 - uy * uy) - 1.6, uy * h - 1.2, 3.2, 2.4);
  if (op.emb) op.emb(ctx, mx + bul * .37, 0, Math.min(bul * .27, h * .34));
  ctx.strokeStyle = op.relinga || E.relinga; ctx.lineWidth = 1.4; velaForma(ctx, mx, h, bul); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; velaForma(ctx, mx, h, bul); ctx.stroke();
  ctx.strokeStyle = E.palo; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, -h - 1.5); ctx.lineTo(mx, h + 1.5); ctx.stroke();
}
// vela de junco: tendida más a lo largo del barco, con sables de bambú que la cruzan de lado a lado
function junco(ctx, mx, h, bul, col, ang, op = {}) {
  ctx.save(); ctx.translate(mx, 0); ctx.rotate(ang); ctx.translate(0, h * .18);
  if (AB <= 0) { // arriada: los sables apilados sobre la botavara
    ctx.lineCap = 'round'; ctx.strokeStyle = mezclar(col, '#2a1608', .35); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke();
    ctx.restore(); return;
  }
  bul *= 1.3 * (.3 + .7 * AB);
  // la vela de junco es un abanico ancho: el borde de adentro casi recto y el de afuera bien panzón
  const velaForma = (c2, mx, hh, b) => { c2.beginPath(); c2.moveTo(mx, -hh); c2.quadraticCurveTo(mx + b, 0, mx, hh); c2.quadraticCurveTo(mx + b * .04, 0, mx, -hh); c2.closePath(); };
  ctx.save(); ctx.translate(2.4, 3.2); velaForma(ctx, 0, h, bul); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  velaForma(ctx, 0, h, bul); ctx.fillStyle = col; ctx.fill();
  ctx.save(); velaForma(ctx, 0, h, bul); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, bul * .5, 0); g.addColorStop(0, 'rgba(40,20,5,.3)'); g.addColorStop(.7, 'rgba(40,20,5,0)'); g.addColorStop(1, 'rgba(255,240,200,.12)');
  ctx.fillStyle = g; ctx.fillRect(-1, -h, bul + 2, 2 * h);
  // esteras cosidas en tiras
  ctx.strokeStyle = 'rgba(40,20,5,.16)'; ctx.lineWidth = .35;
  for (let k = -.85; k <= .86; k += .17) { const f = 1 - k * k; ctx.beginPath(); ctx.moveTo(.03 * bul * f, k * h); ctx.lineTo(.5 * bul * f, k * h); ctx.stroke(); }
  if (op.emb) op.emb(ctx, bul * .27, 0, Math.min(bul * .2, h * .3));
  ctx.restore();
  // sables
  const n = op.sables || 5;
  ctx.lineCap = 'round';
  for (let i = 0; i <= n; i++) {
    const t = .04 + (.96 * i) / n;
    ctx.strokeStyle = op.sable || mezclar(col, '#2a1608', .5); ctx.lineWidth = i === 0 || i === n ? 1.3 : .6;
    ctx.beginPath(); ctx.moveTo(0, -h - (i === 0 ? 1.5 : .6)); ctx.quadraticCurveTo(bul * t, 0, 0, h + (i === 0 ? 1.5 : .6)); ctx.stroke();
  }
  ctx.restore();
}
// vela latina: triángulo grande con la entena en diagonal. lado = 1 o -1 según a qué banda se carga
function latina(ctx, mx, W, k, lado, col, op = {}) {
  const x0 = mx + W * .45 * k, x1 = mx - W * .66 * k, ancho = W * .4 * k;
  if (AB <= 0) { ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, lado * ancho * .8); ctx.stroke(); ctx.strokeStyle = E.palo; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, lado * ancho * .8); ctx.stroke(); return; }
  ctx.save(); ctx.scale(1, lado);
  const f = () => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, ancho * .75 * (.4 + .6 * AB), x1, ancho); ctx.lineTo(x1, -ancho * .05); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 3 * lado); f(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  f(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); f(); ctx.clip();
  if (op.rayas) { const [rc, n] = op.rayas; ctx.fillStyle = rc; ctx.globalAlpha = .88; for (let q = 0; q < n; q += 2) ctx.fillRect(x1 + ((x0 - x1) * q) / n, -ancho, (x0 - x1) / n, ancho * 3); ctx.globalAlpha = 1; }
  const g = ctx.createLinearGradient(x0, 0, x1, ancho); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.5, 'rgba(60,40,15,0)'); g.addColorStop(1, 'rgba(60,40,15,.1)');
  ctx.fillStyle = g; ctx.fillRect(x1, -ancho, x0 - x1, ancho * 3);
  ctx.strokeStyle = 'rgba(90,70,40,.2)'; ctx.lineWidth = .35;
  for (let q = .1; q < 1; q += .1) { const x = x1 + (x0 - x1) * q; ctx.beginPath(); ctx.moveTo(x, -ancho * .05); ctx.lineTo(x, ancho * .9 * (1 - q)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,95,55,.26)'; ctx.lineWidth = .9;
  for (const o of [.18, .34]) { ctx.beginPath(); ctx.moveTo(x1, ancho * (1 - o * 1.9)); ctx.lineTo(x0 - (x0 - x1) * o * .5, 0); ctx.stroke(); }
  if (op.emb) { ctx.save(); ctx.scale(1, lado); op.emb(ctx, x0 + (x1 - x0) * .5, lado * ancho * .24, Math.min(ancho * .22, 6)); ctx.restore(); }
  ctx.strokeStyle = op.relinga || E.relinga; ctx.lineWidth = 1.4; f(); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(60,40,15,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x1, ancho); ctx.lineTo(x1 + W * .12 * k, ancho * .55); ctx.stroke();
  ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; f(); ctx.stroke();
  ctx.strokeStyle = E.palo; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo((x0 + x1) / 2, ancho * .22, x1, ancho); ctx.stroke();
  ctx.restore();
}
// vela de un solo lado (foque, cangreja o vela de abanico): borde recto sobre el eje y panza hacia +y
function velaLateral(ctx, x0, x1, panza, col) {
  if (AB <= 0) return;
  panza *= .25 + .75 * AB;
  const xm = (x0 + x1) / 2;
  const f = () => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(xm, panza, x1, 0); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 3); f(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore();
  f(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(50,35,15,.75)'; ctx.lineWidth = .5; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,70,40,.28)'; ctx.lineWidth = .35;
  for (let k = .2; k < .95; k += .22) { const x = x0 + (x1 - x0) * k; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, panza * .5 * (1 - Math.pow(2 * k - 1, 2))); ctx.stroke(); }
}
// vela cangreja o de abanico: botavara desde el palo hacia popa, con la tela abierta a una banda
function cangreja(ctx, mx, W, len, lado, col) {
  const x1 = mx - W * len;
  ctx.save(); ctx.scale(1, lado); ctx.translate(mx, 0); ctx.rotate(-.16); ctx.translate(-mx, 0);
  velaLateral(ctx, x1, mx, W * len * .42, col);
  if (AB <= 0) { ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(mx, 0); ctx.stroke(); }
  ctx.strokeStyle = E.palo; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1 - 1, 0); ctx.lineTo(mx, 0); ctx.stroke();
  ctx.restore();
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

// ---------- Piezas sueltas que usan los diseños (van en c.bajo y c.sobre) ----------
// remos quietos (en el juego los pone y los mueve dibujo.js; acá son para ver el conjunto)
export function remos(ctx, c, n, largo = .5, x0 = -.3, x1 = .28) {
  if (SIN_REMOS) return; // en el juego, los remos de estas civilizaciones los pone dibujo.js
  const { L, W } = c;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = L * (x0 + ((x1 - x0) * i) / (n - 1));
    for (const s of [-1, 1]) {
      const y0 = s * mitad(c, x) * .95, y1 = s * (mitad(c, x) + W * largo);
      ctx.strokeStyle = '#6e4a24'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - W * .1, y1); ctx.stroke();
      ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - W * .08, y1 - s * W * .1); ctx.lineTo(x - W * .1, y1); ctx.stroke();
    }
  }
  ctx.restore();
}
// espolón de galera: la punta larga que sale de la proa
export function espolon(ctx, c, largo = .1, col) {
  const { L, W } = c;
  ctx.beginPath(); ctx.moveTo(L * .46, -W * .07); ctx.lineTo(L * (.5 + largo), 0); ctx.lineTo(L * .46, W * .07); ctx.closePath();
  ctx.fillStyle = col || E.casco; ctx.fill(); ctx.strokeStyle = E.oro; ctx.lineWidth = .5; ctx.stroke();
}
// postiza: el marco que sobresale del casco de una galera y sostiene los remos
export function postiza(ctx, c, x0 = -.34, x1 = .3, vuelo = .1) {
  const { L, W } = c;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(L * x0, s * mitad(c, L * x0) * .9); ctx.lineTo(L * x0, s * (W * .5 + W * vuelo)); ctx.lineTo(L * x1, s * (W * .5 + W * vuelo)); ctx.lineTo(L * x1, s * mitad(c, L * x1) * .9); ctx.closePath();
    ctx.fillStyle = mezclar(E.casco, '#000000', .2); ctx.fill(); ctx.strokeStyle = E.franja || E.oro; ctx.lineWidth = .6; ctx.stroke();
  }
}
// crujía y bancos de boga de una galera
export function bancos(ctx, c, x0 = -.3, x1 = .28, n = 12) {
  const { L, W } = c;
  ctx.save(); recorteCubierta(ctx, c);
  ctx.strokeStyle = 'rgba(40,22,8,.75)'; ctx.lineWidth = .8;
  for (let i = 0; i < n; i++) { const x = L * (x0 + ((x1 - x0) * i) / (n - 1)); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, s * W * .07); ctx.lineTo(x - W * .07, s * W * .4); ctx.stroke(); } }
  ctx.fillStyle = mezclar(E.cubierta, '#ffffff', .18); ctx.fillRect(L * x0 - 2, -W * .06, L * (x1 - x0) + 4, W * .12);
  ctx.strokeStyle = '#3a2614'; ctx.lineWidth = .5; ctx.strokeRect(L * x0 - 2, -W * .06, L * (x1 - x0) + 4, W * .12);
  ctx.restore();
}
// toldo de popa a rayas (carroza de una galera) con el borde de popa redondeado
export function toldo(ctx, c, x0, x1, hw, cols, borde) {
  const { L, W } = c, a = L * x0, b = L * x1, h = W * hw;
  const f = () => { ctx.beginPath(); ctx.moveTo(b, -h); ctx.lineTo(a + h * .6, -h); ctx.quadraticCurveTo(a - h * .3, 0, a + h * .6, h); ctx.lineTo(b, h); ctx.closePath(); };
  ctx.save(); ctx.translate(1.5, 2); f(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); ctx.restore();
  ctx.save(); f(); ctx.clip();
  const n = 7; for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(a - h, -h + (2 * h * i) / n, b - a + 2 * h, (2 * h) / n + .3); }
  const g = ctx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = g; ctx.fillRect(a - h, -h, b - a + 2 * h, 2 * h);
  ctx.restore();
  f(); ctx.strokeStyle = borde || E.oro; ctx.lineWidth = .8; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(b, 0); ctx.stroke();
}
// castillo almenado (cocas y carracas): una plataforma cuadrada sobre la cubierta
export function castillo(ctx, c, x0, x1, hw, col, almena) {
  const { L, W } = c, a = L * x0, b = L * x1, h = W * hw;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(a + 1.2, -h + 1.8, b - a, 2 * h);
  ctx.fillStyle = col || E.cubiertaAlta; ctx.fillRect(a, -h, b - a, 2 * h);
  ctx.save(); ctx.beginPath(); ctx.rect(a, -h, b - a, 2 * h); ctx.clip(); tablones(ctx, L, W); ctx.restore();
  ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .8; ctx.strokeRect(a, -h, b - a, 2 * h);
  ctx.fillStyle = almena || E.casco; const m = W * .05;
  for (let x = a; x < b - m * .5; x += m * 2) for (const y of [-h - m * .3, h - m * .7]) ctx.fillRect(x, y, m, m);
  for (let y = -h; y < h - m * .5; y += m * 2) for (const x of [a - m * .3, b - m * .7]) ctx.fillRect(x, y, m, m);
}
// caseta con tejado a dos aguas (juncos y barcos japoneses). op: { pared, techo, tejas, alero }
export function caseta(ctx, c, x0, x1, hw, op = {}) {
  const { L, W } = c, a = L * x0, b = L * x1, h = W * hw;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(a + 1.4, -h + 2, b - a, 2 * h);
  ctx.fillStyle = op.pared || '#e8dcc0'; ctx.fillRect(a, -h, b - a, 2 * h);
  const k = op.alero ?? .82;
  const g = ctx.createLinearGradient(0, -h * k, 0, h * k); const t = op.techo || '#5a5f66';
  g.addColorStop(0, mezclar(t, '#000000', .3)); g.addColorStop(.49, mezclar(t, '#ffffff', .12)); g.addColorStop(.51, mezclar(t, '#000000', .1)); g.addColorStop(1, mezclar(t, '#000000', .38));
  ctx.fillStyle = g; ctx.fillRect(a + (b - a) * .04, -h * k, (b - a) * .92, 2 * h * k);
  if (op.tejas !== false) { ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = .35; for (let x = a + (b - a) * .1; x < b - 1; x += Math.max(1.6, (b - a) / 9)) { ctx.beginPath(); ctx.moveTo(x, -h * k); ctx.lineTo(x, h * k); ctx.stroke(); } }
  ctx.strokeStyle = op.cumbrera || '#1c1c1c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a + (b - a) * .02, 0); ctx.lineTo(b - (b - a) * .02, 0); ctx.stroke();
  ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .6; ctx.strokeRect(a, -h, b - a, 2 * h);
}
// orzas de deriva: las tablas ovaladas que cuelgan a los costados de los barcos holandeses
export function orzas(ctx, c, x = .02, col) {
  const { L, W } = c;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(L * x, s * (mitad(c, L * x) + W * .05)); ctx.rotate(s * .12);
    ctx.beginPath(); ctx.moveTo(L * .08, 0); ctx.quadraticCurveTo(L * .02, s * W * .2, -L * .1, s * W * .14); ctx.quadraticCurveTo(-L * .12, 0, L * .08, 0); ctx.closePath();
    ctx.fillStyle = col || '#6e4521'; ctx.fill(); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = .5; ctx.stroke();
    ctx.restore();
  }
}
// escudos colgados de la borda
export function pavesada(ctx, c, n, cols, x0 = -.3, x1 = .3) {
  const { L, W } = c;
  for (let i = 0; i < n; i++) {
    const x = L * (x0 + ((x1 - x0) * i) / (n - 1));
    for (const s of [-1, 1]) {
      const y = s * mitad(c, x) * .93, col = cols[i % cols.length];
      ctx.beginPath(); ctx.arc(x, y, W * .055, 0, TAU);
      if (Array.isArray(col)) { ctx.fillStyle = col[0]; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = col[1]; ctx.fillRect(x - W, y, 2 * W, W); ctx.restore(); ctx.beginPath(); ctx.arc(x, y, W * .055, 0, TAU); } else { ctx.fillStyle = col; ctx.fill(); }
      ctx.strokeStyle = '#1a1008'; ctx.lineWidth = .4; ctx.stroke();
    }
  }
}
// pala de timón grande asomando por la popa (juncos, cocas, barcos japoneses)
export function timonPopa(ctx, c, largo = .08, col) {
  const { L, W } = c;
  ctx.fillStyle = col || '#5b3a1a'; ctx.strokeStyle = '#1a1008'; ctx.lineWidth = .5;
  ctx.beginPath(); ctx.moveTo(-L * .5 + 1, -W * .035); ctx.lineTo(-L * (.5 + largo), -W * .05); ctx.lineTo(-L * (.5 + largo), W * .05); ctx.lineTo(-L * .5 + 1, W * .035); ctx.closePath(); ctx.fill(); ctx.stroke();
}
// ojos pintados a los lados de la proa, para que el barco "vea" el camino
export function ojos(ctx, c, x = .36, r = .06) {
  const { L, W } = c;
  for (const s of [-1, 1]) {
    const y = s * mitad(c, L * x) * .86;
    ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.ellipse(L * x, y, W * r * 1.25, W * r * .8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1a1008'; ctx.lineWidth = .4; ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(L * x + W * r * .3, y, W * r * .5, 0, TAU); ctx.fill();
  }
}
// caja de tablas que cubre la cubierta (el "yagura" de los barcos de guerra japoneses), con troneras a los lados
export function caja(ctx, c, x0, x1, hw, col, borde = '#15100a') {
  const { L, W } = c, a = L * x0, b = L * x1, h = W * hw;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(a + 1.4, -h + 2, b - a, 2 * h);
  const g = ctx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, mezclar(col, '#000000', .28)); g.addColorStop(.5, mezclar(col, '#ffffff', .1)); g.addColorStop(1, mezclar(col, '#000000', .32));
  ctx.fillStyle = g; ctx.fillRect(a, -h, b - a, 2 * h);
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = .35;
  for (let x = a + 3; x < b - 1; x += 3.2) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, h); ctx.stroke(); }
  ctx.strokeStyle = borde; ctx.lineWidth = .8; ctx.strokeRect(a, -h, b - a, 2 * h);
  ctx.lineWidth = .5; ctx.strokeRect(a + W * .05, -h + W * .05, b - a - W * .1, 2 * h - W * .1);
  ctx.fillStyle = '#0c0805';
  for (let x = a + 3; x < b - 2; x += 4.4) for (const s of [-1, 1]) ctx.fillRect(x, s * (h - W * .025) - W * .02, 1.5, W * .04);
}
// baranda de tablas con troneras a lo largo de la borda (barcos de guerra japoneses)
export function empalizada(ctx, c, x0, x1, col, tronera = true) {
  const { L, W } = c;
  for (const s of [-1, 1]) {
    ctx.strokeStyle = col; ctx.lineWidth = W * .1; ctx.lineCap = 'butt'; ctx.beginPath();
    for (let x = x0; x <= x1 + .001; x += .02) { const px = L * x, py = s * mitad(c, px) * .84; x === x0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
    ctx.stroke();
    if (tronera) { ctx.fillStyle = '#16100a'; for (let x = x0 + .03; x < x1; x += .055) ctx.fillRect(L * x - .8, s * mitad(c, L * x) * .84 - W * .028, 1.6, W * .056); }
  }
}

// ---------- Pintor ----------
// o: { L, W (los del casco del juego), canones (por lado), abiertas (0 a 1), colorVela, d (daño 0 sano a 3 crítico) }
export function pintar(ctx, c0, o) {
  const d = o.d || 0, seed = c0.seed || 7;
  const c = { ...c0, L: o.L, W: o.W * (c0.ancho || 1.12), cañones: o.canones, _p: null };
  const { L, W } = c;
  E = { ...E0, ...c0.E };
  AB = o.abiertas;
  SIN_REMOS = !!o.sinRemos;
  const tonos = escalaVela(o.velaForzada || c0.vela || o.colorVela); // velaForzada: velas doradas del galeón del tesoro
  const pos = c.palos.map((p) => p.x * L), nPalos = c.palos.length;
  ctx.save(); ctx.lineJoin = 'round';
  // sombra en el agua
  ctx.save(); ctx.translate(4, 6); casco(ctx, c, 1.05, 1.12); ctx.fillStyle = 'rgba(0,20,40,.3)'; ctx.fill(); ctx.restore();
  if (c.bajo) c.bajo(ctx, c, d);
  cubierta(ctx, c);
  itemsCubierta(ctx, c);
  if (c.sobre) c.sobre(ctx, c, d);
  // daño sobre cubierta
  if (d >= 1) {
    const q = azar(seed + 3), hoyos = [0, 1, 3, 5][d], grietas = [0, 3, 6, 10][d];
    ctx.save(); recorteCubierta(ctx, c);
    for (let i = 0; i < [0, 3, 5, 8][d]; i++) { const x = (q() - .5) * L * .8, y = (q() - .5) * W * .6; const g = ctx.createRadialGradient(x, y, 0, x, y, W * .18); g.addColorStop(0, 'rgba(10,5,2,.55)'); g.addColorStop(1, 'rgba(10,5,2,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, W * .18, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(25,12,4,.9)'; ctx.lineWidth = .7;
    for (let i = 0; i < grietas; i++) { let x = (q() - .5) * L * .8, y = (q() - .5) * W * .5; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (q() - .3) * W * .22; y += (q() - .5) * W * .18; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < hoyos; i++) { const x = (-.3 + q() * .6) * L, y = (q() - .5) * W * .4; agujero(ctx, x, y, W * (.07 + q() * .05), q); }
    ctx.restore();
  }
  puertos(ctx, c, d, azar(seed + 4));
  galeria(ctx, c);
  if (c.popa) c.popa(ctx, c, d);
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
  const proaPalo = pos[pos.length - 1];
  const telaProa = !c.mascaron || c.telaProa; // con una talla en la proa no se ponen velas debajo, para que se vea limpia
  if (c.bauprés && c.foques && telaProa) {
    velaLateral(tc, proaPalo + W * .05, L * (.5 + c.bauprés), W * .3, tonos[1]);
    if (c.foques > 1) { tc.save(); tc.scale(1, -1); velaLateral(tc, proaPalo + W * .3, L * (.5 + c.bauprés) * .94, W * .22, tonos[2]); tc.restore(); }
    if (d >= 2) cortes((proaPalo + L * .5) / 2, W * .12, 0, 1);
  }
  if (c.spritsail && telaProa) { pano(tc, L * (.5 + .07), W * .27, W * .2, tonos[1], { emb: c.emblemaSprit }); if (d >= 2) cortes(L * .57, W * .2, W * .2, 1); }
  const roto0 = d >= 3 && nPalos > 1;
  c.palos.forEach((p, m) => {
    const mx = pos[m], op = { emb: p.emb === false ? null : (p.emb || c.emblema), rayas: p.rayas || c.rayas, relinga: c.relinga, sables: p.sables, sable: c.sable };
    const col = p.col ? escalaVela(p.col) : tonos;
    if (roto0 && m === 0) {
      // palo quebrado: tocón y tela caída sobre la borda
      tc.fillStyle = E.palo; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
      tc.strokeStyle = '#e2c08a'; tc.lineWidth = .8; for (let i = 0; i < 5; i++) { const a = q() * TAU; tc.beginPath(); tc.moveTo(mx, 0); tc.lineTo(mx + Math.cos(a) * W * .1, Math.sin(a) * W * .1); tc.stroke(); }
      tc.save(); tc.translate(mx - W * .05, W * .22); tc.rotate(.35);
      for (let i = 0; i < 6; i++) { tc.fillStyle = i % 2 ? col[1] : mezclar(col[1], '#3a2a10', .18); tc.beginPath(); tc.moveTo(0, i * W * .09 - W * .1); tc.lineTo(W * .5 + q() * W * .15, i * W * .09 - W * .1 + q() * 3); tc.lineTo(W * .45 + q() * W * .15, i * W * .09 - W * .01); tc.lineTo(0, i * W * .09); tc.fill(); }
      tc.strokeStyle = E.palo; tc.lineWidth = 1.6; tc.beginPath(); tc.moveTo(0, -W * .12); tc.lineTo(W * .6, -W * .05); tc.stroke();
      tc.restore();
      return;
    }
    let zona = null; // [x, alto, panza] de la vela más grande del palo, para rasgarla
    if (p.t === 'latina') {
      latina(tc, mx, W, p.k, p.lado || 1, col[1], op);
      zona = [mx - W * .5 * p.k, W * .16 * p.k, W * .5 * p.k, (p.lado || 1) * W * .16 * p.k];
    } else if (p.t === 'junco') {
      junco(tc, mx, W * p.h, W * p.b, col[1], p.ang || 0, op);
      zona = [mx, W * p.h * .8, W * p.b];
    } else if (p.t === 'cangreja') {
      cangreja(tc, mx, W, p.len, p.lado || 1, col[1]);
      if (p.gavia) pano(tc, mx, W * p.gavia[0], W * p.gavia[1], col[2], op);
      zona = [mx - W * p.len * .6, W * .1, W * .2, (p.lado || 1) * W * p.len * .14];
    } else {
      const capas = p.capas || [];
      capas.forEach(([hf, bf], i) => pano(tc, mx, W * hf, W * bf, col[Math.min(i, 2)], i === capas.length - 1 ? op : { rayas: op.rayas, relinga: op.relinga }));
      if (capas.length) zona = [mx, W * capas[0][0], W * capas[0][1]];
    }
    if (zona && AB > 0) {
      tc.save(); if (zona[3]) tc.translate(0, zona[3]);
      cortes(zona[0], zona[1], zona[2], nCortes);
      if (d >= 3) { const [zx, zh, zb] = zona; tc.globalCompositeOperation = 'destination-out'; tc.beginPath(); tc.moveTo(zx + zb * .4, zh * .9); tc.lineTo(zx + zb * .1, zh * .1); tc.lineTo(zx + zb * .38, zh * .3); tc.lineTo(zx + zb * .55, zh * .7); tc.fill(); tc.globalCompositeOperation = 'source-over'; }
      tc.restore();
    }
    tc.fillStyle = E.palo; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
    if (m === c.principal) { tc.strokeStyle = '#8a5a2b'; tc.lineWidth = 1; tc.beginPath(); tc.arc(mx, 0, W * .1, 0, TAU); tc.stroke(); }
  });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tmp, 0, 0); ctx.restore();
  if (c.encima) c.encima(ctx, c, d);
  // bauprés y mascarón encima de la tela, para que se vea
  baupres(ctx, c);
  if (c.mascaron) {
    const rl = W * (c.rm || .16), mo = c.mo ?? .5;
    ctx.save(); ctx.translate(1, 1.6); ctx.globalAlpha = .25; ctx.translate(L * .5 - W * .06, 0); ctx.fillStyle = '#001428'; ctx.beginPath(); ctx.arc(0, 0, W * .12, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(L * .5 - rl * mo, 0);
    if (Array.isArray(c.plataforma)) { // disco oscuro bajo el mascarón: solo si el diseño lo pide (a Cristian no le gustan)
      const [pw, ph] = c.plataforma;
      ctx.fillStyle = E.casco; ctx.strokeStyle = E.oro; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(rl * .2, 0, rl * pw, rl * ph, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
    c.mascaron(ctx, rl); ctx.restore();
  }
  ctx.restore();
  return pos[c.principal ?? 0]; // x del palo principal, donde dibujo.js cuelga la bandera de la civilización
}

// ---------- Bases por casco (lo que no cambie un diseño sale de acá) ----------
export const cu = (x, ...capas) => ({ x, t: 'cuadra', capas });
export const la = (x, k = 1, lado = 1, extra) => ({ x, t: 'latina', k, lado, ...extra });
export const ju = (x, h, b, ang = 0, extra) => ({ x, t: 'junco', h, b, ang, ...extra });
export const ca = (x, len, lado = 1, extra) => ({ x, t: 'cangreja', len, lado, ...extra });
const ESC = (x, w = .2, h = .15) => ({ t: 'escotilla', x, w, h });
export const BASE = {
  balandra: {
    tr: .5, px: [-.2, .14], bauprés: .1, foques: 1, rm: .14, timon: true, principal: 0,
    palos: [cu(.04, [.7, .42], [.5, .34])], items: [ESC(-.2)],
  },
  bergantin: {
    tr: .6, px: [-.14, .26], bauprés: .12, foques: 2, rm: .2, galeria: 1, popaAlta: -.24, principal: 0,
    palos: [cu(-.12, [.7, .42], [.52, .35], [.34, .27]), cu(.16, [.64, .38], [.46, .31])],
    items: [ESC(.02, .22, .17), { t: 'cabrestante', x: .3 }, { t: 'claraboya', x: -.36 }],
  },
  galeon: {
    tr: .68, px: [-.14, .24], bauprés: .14, foques: 2, rm: .18, galeria: 2, spritsail: true, popaAlta: -.2, proaAlta: .31, catheads: true, principal: 1, ancho: 1.18,
    palos: [cu(-.28, [.6, .38], [.42, .3]), cu(-.02, [.78, .45], [.58, .37], [.4, .29]), cu(.2, [.7, .41], [.52, .34], [.35, .26])],
    items: [ESC(-.12, .2, .16), { t: 'bote', x: .11 }, { t: 'cabrestante', x: .26 }, { t: 'claraboya', x: -.38 }],
  },
};
// arma un diseño: la base del casco más lo propio
export const dis = (tipo, nombre, ref, propio) => ({ ...BASE[tipo], tipo, nombre, ref, ...propio });
