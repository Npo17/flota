// PRUEBA de estilo realista: el galeón español redibujado con madera, tela y sombras, para comparar con el dibujo actual.
// Respeta el diseño que ya tiene (src/arte-espanol.js): mismas medidas, tres palos, cruz de Borgoña en las velas mayores,
// latina en el palo de popa, cebadera en el bauprés, franja roja, dorados y galería de popa. Cambia el acabado, no el barco.
// Vista cenital, proa hacia +x. Se pinta una sola vez en la imagen guardada de dibujo.js.
// Si el estilo se aprueba, de acá sale el pintor común para el resto; si no, se borra este archivo y la línea que lo usa.
const TAU = Math.PI * 2;
const G = { tr: .66, px: [-.14, .24], baupres: .13, popaAlta: -.2, proaAlta: .31, mastiles: [-.28, -.02, .2], principal: 1,
  velas: [[], [[.76, .44], [.55, .36], [.36, .28]], [[.68, .4], [.5, .33], [.33, .25]]] };

function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = (c, k = 1, a = 1) => `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${a})`;
const deHex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0xf5f1e4; return [n >> 16, (n >> 8) & 255, n & 255]; };

function perfil(L, W, tr) {
  const bz = (p, t) => { const u = 1 - t; const f = (i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]; return [f(0), f(1)]; };
  const a = [[L * .5, 0], [L * .36, W * .2], [L * .2, W * .5], [-L * .08, W * .5]];
  const b = [[-L * .08, W * .5], [-L * .3, W * .5], [-L * .5, W * (tr * .5 + .06)], [-L * .5, W * tr * .5]];
  const pts = [];
  for (let i = 0; i <= 30; i++) pts.push(bz(a, i / 30));
  for (let i = 1; i <= 30; i++) pts.push(bz(b, i / 30));
  return pts;
}
function casco(ctx, p, kx = 1, ky = 1) {
  ctx.beginPath();
  p.forEach(([x, y], i) => (i ? ctx.lineTo(x * kx, y * ky) : ctx.moveTo(x * kx, y * ky)));
  for (let i = p.length - 1; i >= 0; i--) ctx.lineTo(p[i][0] * kx, -p[i][1] * ky);
  ctx.closePath();
}
function mitad(p, x) {
  if (x >= p[0][0]) return 0;
  for (let i = 1; i < p.length; i++) if (p[i][0] <= x) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 || 1)); }
  return p[p.length - 1][1];
}

// tablas: cada una con su tono, juntas oscuras y alguna cabeza de tabla
function tablas(ctx, x0, x1, y0, y1, base, r, ancho = 1.7) {
  for (let y = y0; y < y1; y += ancho) {
    ctx.fillStyle = rgb(base, .86 + r() * .26);
    ctx.fillRect(x0, y, x1 - x0, ancho + .1);
  }
  ctx.strokeStyle = 'rgba(38,22,8,.42)'; ctx.lineWidth = .28;
  ctx.beginPath();
  for (let y = y0; y < y1; y += ancho) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  for (let k = 0; k < (x1 - x0) * (y1 - y0) / 34; k++) { const x = x0 + r() * (x1 - x0), y = y0 + Math.floor(r() * ((y1 - y0) / ancho)) * ancho; ctx.moveTo(x, y); ctx.lineTo(x, y + ancho); }
  ctx.stroke();
  // desgaste: manchas largas, claras y oscuras, a lo largo de la veta
  for (let k = 0; k < 26; k++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), w = 4 + r() * 12;
    ctx.fillStyle = r() < .5 ? 'rgba(255,236,196,.07)' : 'rgba(40,22,8,.08)';
    ctx.beginPath(); ctx.ellipse(x, y, w, .7 + r() * 1.1, 0, 0, TAU); ctx.fill();
  }
}

// la forma de una vela cuadra vista desde arriba: la verga de banda a banda y el paño hinchado hacia proa
function formaVela(ctx, mx, h, bul) {
  ctx.beginPath();
  ctx.moveTo(mx - .3, -h); ctx.bezierCurveTo(mx + bul * .9, -h * .86, mx + bul * 1.12, -h * .3, mx + bul * 1.12, 0);
  ctx.bezierCurveTo(mx + bul * 1.12, h * .3, mx + bul * .9, h * .86, mx - .3, h);
  ctx.quadraticCurveTo(mx + bul * .16, 0, mx - .3, -h); ctx.closePath();
}
function vela(ctx, mx, h, bul, tela, r, cruz) {
  // sombra que la vela echa sobre lo que tiene debajo
  ctx.save(); ctx.shadowColor = 'rgba(8,10,16,.55)'; ctx.shadowBlur = 9; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7;
  formaVela(ctx, mx, h, bul); ctx.fillStyle = rgb(tela); ctx.fill(); ctx.restore();
  ctx.save(); formaVela(ctx, mx, h, bul); ctx.clip();
  // la tela: en sombra junto a la verga, luz en la panza, algo más apagada en el borde
  let g = ctx.createLinearGradient(mx, 0, mx + bul * 1.12, 0);
  g.addColorStop(0, rgb(tela, .62)); g.addColorStop(.28, rgb(tela, .86)); g.addColorStop(.62, rgb(tela, 1.04)); g.addColorStop(.9, rgb(tela, .96)); g.addColorStop(1, rgb(tela, .8));
  ctx.fillStyle = g; ctx.fillRect(mx - 2, -h - 1, bul * 1.3 + 4, 2 * h + 2);
  // de banda a banda: más oscura hacia los puños
  g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, 'rgba(40,30,14,.38)'); g.addColorStop(.2, 'rgba(40,30,14,0)'); g.addColorStop(.5, 'rgba(255,250,235,.10)'); g.addColorStop(.8, 'rgba(40,30,14,0)'); g.addColorStop(1, 'rgba(40,30,14,.38)');
  ctx.fillStyle = g; ctx.fillRect(mx - 2, -h - 1, bul * 1.3 + 4, 2 * h + 2);
  // paños cosidos y pliegues
  ctx.lineWidth = .3; ctx.strokeStyle = 'rgba(96,78,48,.42)';
  for (let k = -.86; k <= .87; k += .172) { const f = Math.sqrt(Math.max(0, 1 - k * k)); ctx.beginPath(); ctx.moveTo(mx + bul * .14 * f, k * h); ctx.quadraticCurveTo(mx + bul * .6, k * h * 1.02, mx + bul * 1.1 * f, k * h * .98); ctx.stroke(); }
  for (let k = 0; k < 7; k++) { // pliegues blandos
    const y = (r() * 2 - 1) * h * .8, x = mx + bul * (.2 + r() * .5);
    ctx.fillStyle = k % 2 ? 'rgba(255,252,240,.10)' : 'rgba(52,40,20,.10)';
    ctx.beginPath(); ctx.ellipse(x, y, bul * (.2 + r() * .25), h * (.03 + r() * .04), (r() - .5) * .5, 0, TAU); ctx.fill();
  }
  // fajas de rizos
  ctx.strokeStyle = 'rgba(90,70,40,.35)'; ctx.lineWidth = .35;
  ctx.beginPath(); ctx.moveTo(mx + bul * .42, -h * .9); ctx.quadraticCurveTo(mx + bul * .56, 0, mx + bul * .42, h * .9); ctx.stroke();
  if (cruz) { // cruz de Borgoña, teñida en la tela (toma su luz y sus pliegues)
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = 'rgba(172,34,30,.9)'; ctx.lineWidth = Math.max(1.3, bul * .13); ctx.lineCap = 'butt';
    const xa = mx + bul * .22, xb = mx + bul * .98, ya = h * .56;
    ctx.beginPath(); ctx.moveTo(xa, -ya); ctx.lineTo(xb, ya); ctx.moveTo(xa, ya); ctx.lineTo(xb, -ya); ctx.stroke();
    ctx.lineWidth = Math.max(.7, bul * .06); // los nudos del tronco
    ctx.beginPath();
    for (let k = .2; k < .9; k += .2) for (const s of [-1, 1]) { const x = xa + (xb - xa) * k, y = s * (-ya + 2 * ya * k); ctx.moveTo(x, y); ctx.lineTo(x + bul * .08, y - s * h * .1); }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  // relinga
  formaVela(ctx, mx, h, bul); ctx.strokeStyle = 'rgba(70,52,28,.7)'; ctx.lineWidth = .45; ctx.stroke();
}
function verga(ctx, mx, h, grosor) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e1208'; ctx.lineWidth = grosor; ctx.beginPath(); ctx.moveTo(mx, -h - 1.4); ctx.lineTo(mx, h + 1.4); ctx.stroke();
  ctx.strokeStyle = '#6b4526'; ctx.lineWidth = grosor * .62; ctx.beginPath(); ctx.moveTo(mx, -h - 1.2); ctx.lineTo(mx, h + 1.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(214,170,112,.75)'; ctx.lineWidth = grosor * .18; ctx.beginPath(); ctx.moveTo(mx + grosor * .14, -h); ctx.lineTo(mx + grosor * .14, h); ctx.stroke();
}
function velaAferrada(ctx, mx, h, tela) { // el paño recogido sobre la verga
  ctx.lineCap = 'round'; ctx.strokeStyle = rgb(tela, .9); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(mx + .9, -h * .94); ctx.lineTo(mx + .9, h * .94); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,52,28,.6)'; ctx.lineWidth = .35;
  for (let k = -.8; k <= .81; k += .2) { ctx.beginPath(); ctx.moveTo(mx - .4, k * h); ctx.lineTo(mx + 2.2, k * h); ctx.stroke(); }
}
// vela de cuchillo (foque, latina): triángulo hinchado hacia una banda
function cuchillo(ctx, x0, x1, panza, tela, r, conVerga) {
  const f = () => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.bezierCurveTo(x0 + (x1 - x0) * .25, panza * 1.25, x0 + (x1 - x0) * .7, panza * 1.1, x1, conVerga ? panza : 0); ctx.lineTo(x1, conVerga ? panza * .0 : 0); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(8,10,16,.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6; f(); ctx.fillStyle = rgb(tela); ctx.fill(); ctx.restore();
  ctx.save(); f(); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, panza * 1.1);
  g.addColorStop(0, rgb(tela, .66)); g.addColorStop(.45, rgb(tela, .94)); g.addColorStop(.8, rgb(tela, 1.03)); g.addColorStop(1, rgb(tela, .84));
  ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1) - 2, -2, Math.abs(x1 - x0) + 4, Math.abs(panza) * 1.4 + 4);
  ctx.strokeStyle = 'rgba(96,78,48,.4)'; ctx.lineWidth = .3;
  for (let k = .14; k < .95; k += .13) { const x = x0 + (x1 - x0) * k; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (x1 - x0) * .04, panza * 1.3); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,252,240,.10)' : 'rgba(52,40,20,.10)'; ctx.beginPath(); ctx.ellipse(x0 + (x1 - x0) * (.25 + r() * .5), panza * (.3 + r() * .5), Math.abs(x1 - x0) * .14, Math.abs(panza) * .08, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  f(); ctx.strokeStyle = 'rgba(70,52,28,.7)'; ctx.lineWidth = .45; ctx.stroke();
}

// o: lo mismo que recibe pintarEspanol. aguila: el mascarón actual, para no cambiarlo.
export function pintarGaleonRealista(ctx, o, aguila) {
  const L = o.L, W = o.W * 1.12, d = o.d || 0, AB = Math.max(0, Math.min(1, o.abiertas)), r = azar(1588);
  const p = perfil(L, W, G.tr), pos = G.mastiles.map((f) => f * L);
  const tela = deHex(o.colorVela), tela2 = tela.map((v) => v * .93), tela3 = tela.map((v) => Math.min(255, v * 1.03));
  const madera = [150, 110, 66], maderaAlta = [168, 128, 80];
  ctx.save(); ctx.lineJoin = 'round';

  // ---- casco: tablazón oscura, redondeada hacia la línea de agua
  casco(ctx, p); ctx.fillStyle = '#2a1a0d'; ctx.fill();
  ctx.save(); casco(ctx, p); ctx.clip();
  let g = ctx.createLinearGradient(0, -W * .5, 0, W * .5);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.12, 'rgba(120,78,40,.35)'); g.addColorStop(.2, 'rgba(0,0,0,0)'); g.addColorStop(.8, 'rgba(0,0,0,0)'); g.addColorStop(.88, 'rgba(120,78,40,.35)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = g; ctx.fillRect(-L * .5, -W * .5, L, W);
  ctx.restore();
  // cintas y franja roja con filete dorado
  casco(ctx, p, .985, .95); ctx.strokeStyle = '#7d1a18'; ctx.lineWidth = W * .045; ctx.stroke();
  casco(ctx, p, .975, .915); ctx.strokeStyle = '#c79a36'; ctx.lineWidth = .45; ctx.stroke();
  casco(ctx, p, .995, .985); ctx.strokeStyle = 'rgba(214,170,112,.35)'; ctx.lineWidth = .35; ctx.stroke();
  // borda (la tapa de regala): madera más clara, con su luz
  casco(ctx, p, .94, .84); ctx.fillStyle = '#5a3a1e'; ctx.fill();

  // ---- cubierta
  ctx.save(); casco(ctx, p, .9, .76); ctx.clip();
  tablas(ctx, -L * .5, L * .5, -W * .4, W * .4, madera, r);
  // cubiertas altas de popa y de proa: más claras (más arriba, más luz) y con su sombra sobre el combés
  const xa = G.popaAlta * L, xb = G.proaAlta * L;
  tablas(ctx, -L * .5, xa, -W * .4, W * .4, maderaAlta, r);
  tablas(ctx, xb, L * .5, -W * .4, W * .4, maderaAlta, r);
  g = ctx.createLinearGradient(xa, 0, xa + W * .2, 0); g.addColorStop(0, 'rgba(10,6,2,.6)'); g.addColorStop(1, 'rgba(10,6,2,0)'); ctx.fillStyle = g; ctx.fillRect(xa, -W * .4, W * .2, W * .8);
  g = ctx.createLinearGradient(xb, 0, xb - W * .1, 0); g.addColorStop(0, 'rgba(10,6,2,.4)'); g.addColorStop(1, 'rgba(10,6,2,0)'); ctx.fillStyle = g; ctx.fillRect(xb - W * .1, -W * .4, W * .1, W * .8);
  // sombra de la borda sobre la cubierta, todo alrededor
  ctx.shadowColor = 'rgba(10,6,2,.85)'; ctx.shadowBlur = 7; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,6,2,.9)'; casco(ctx, p, .92, .8); ctx.stroke();
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  // barandas de los castillos
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(xa, -W * .4); ctx.lineTo(xa, W * .4); ctx.moveTo(xb, -W * .4); ctx.lineTo(xb, W * .4); ctx.stroke();
  ctx.fillStyle = '#c9a15e'; for (let y = -W * .34; y <= W * .341; y += W * .068) { ctx.fillRect(xa - .5, y - .35, 1, .7); ctx.fillRect(xb - .5, y - .35, 1, .7); }
  ctx.restore();

  // ---- cosas de cubierta, cada una con su sombra
  const conSombra = (f) => { ctx.save(); ctx.shadowColor = 'rgba(8,5,2,.7)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; f(); ctx.restore(); };
  // escotilla con enjaretado
  const ex = -L * .12, ew = L * .1, eh = W * .16;
  conSombra(() => { ctx.fillStyle = '#4c3018'; ctx.fillRect(ex - ew, -eh, ew * 2, eh * 2); });
  ctx.fillStyle = '#150d06'; ctx.fillRect(ex - ew + 1, -eh + 1, ew * 2 - 2, eh * 2 - 2);
  ctx.strokeStyle = '#9a7442'; ctx.lineWidth = .5; ctx.beginPath();
  for (let x = ex - ew + 2; x < ex + ew - 1; x += 1.7) { ctx.moveTo(x, -eh + 1); ctx.lineTo(x, eh - 1); }
  for (let y = -eh + 2; y < eh - 1; y += 1.7) { ctx.moveTo(ex - ew + 1, y); ctx.lineTo(ex + ew - 1, y); }
  ctx.stroke();
  // bote
  const bx = L * .11, bl = L * .075, bw = W * .1;
  conSombra(() => { ctx.fillStyle = '#3a2412'; ctx.beginPath(); ctx.ellipse(bx, 0, bl, bw, 0, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#7a5630'; ctx.beginPath(); ctx.ellipse(bx, 0, bl * .86, bw * .74, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2c1a0c'; ctx.lineWidth = .7; ctx.beginPath(); for (const k of [-.45, 0, .45]) { ctx.moveTo(bx + bl * k, -bw * .68); ctx.lineTo(bx + bl * k, bw * .68); } ctx.stroke();
  // cabrestante
  conSombra(() => { ctx.fillStyle = '#4c3018'; ctx.beginPath(); ctx.arc(L * .26, 0, W * .06, 0, TAU); ctx.fill(); });
  ctx.strokeStyle = '#b08a52'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.moveTo(L * .26, 0); ctx.lineTo(L * .26 + Math.cos(k * TAU / 6) * W * .055, Math.sin(k * TAU / 6) * W * .055); } ctx.stroke();
  // claraboya de la cámara y rueda del timón
  conSombra(() => { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-L * .41, -W * .07, L * .06, W * .14); });
  ctx.fillStyle = '#8fb3c2'; ctx.fillRect(-L * .405, -W * .055, L * .05, W * .11);
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(-L * .38, -W * .055); ctx.lineTo(-L * .38, W * .055); ctx.moveTo(-L * .405, 0); ctx.lineTo(-L * .355, 0); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-L * .402, -W * .05, L * .012, W * .04);

  // ---- cañones: cureña de madera y tubo de bronce oscuro que asoma por la borda
  const n = Math.max(1, Math.round(o.canones)), rq = azar(11);
  for (let i = 0; i < n; i++) {
    const x = L * (G.px[0] + (G.px[1] - G.px[0]) * (n === 1 ? .5 : i / (n - 1)));
    for (const s of [-1, 1]) {
      const yb = s * mitad(p, x), roto = rq() < [0, .12, .28, .45][d];
      if (roto) { ctx.fillStyle = '#0c0805'; ctx.beginPath(); ctx.ellipse(x, yb * .8, o.grosor * .9, W * .07, 0, 0, TAU); ctx.fill(); continue; }
      ctx.save(); ctx.shadowColor = 'rgba(8,5,2,.7)'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#5c3c1e'; ctx.fillRect(x - o.grosor * .75, yb * .56, o.grosor * 1.5, yb * .22); ctx.restore();
      const y0 = yb * .58, y1 = yb + s * 3.2, gr = ctx.createLinearGradient(x - o.grosor / 2, 0, x + o.grosor / 2, 0);
      gr.addColorStop(0, '#0d0d0f'); gr.addColorStop(.45, '#4c4c52'); gr.addColorStop(.6, '#2a2a2e'); gr.addColorStop(1, '#09090a');
      ctx.fillStyle = gr; ctx.fillRect(x - o.grosor * .42, Math.min(y0, y1), o.grosor * .84, Math.abs(y1 - y0));
      ctx.fillRect(x - o.grosor * .52, y1 - (s > 0 ? 1.3 : 0), o.grosor * 1.04, 1.3);
      ctx.fillStyle = '#050505'; ctx.fillRect(x - o.grosor * .2, y1 - (s > 0 ? .5 : 0), o.grosor * .4, .5);
    }
  }

  // ---- galería de popa: balcón con ventanas doradas
  const hw = W * G.tr * .45, pg = W * .11;
  ctx.beginPath(); ctx.moveTo(-L * .5 + .5, -hw); ctx.lineTo(-L * .5 - pg, -hw * .84); ctx.lineTo(-L * .5 - pg, hw * .84); ctx.lineTo(-L * .5 + .5, hw); ctx.closePath();
  g = ctx.createLinearGradient(-L * .5 - pg, 0, -L * .5, 0); g.addColorStop(0, '#1c1108'); g.addColorStop(1, '#3c2612'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#c79a36'; ctx.lineWidth = W * .022; ctx.stroke();
  for (let i = 0; i < 5; i++) { const y = -hw * .64 + (hw * 1.28 * i) / 4; ctx.fillStyle = '#f2cc66'; ctx.fillRect(-L * .5 - pg * .78, y - W * .024, pg * .5, W * .048); ctx.fillStyle = 'rgba(255,255,230,.6)'; ctx.fillRect(-L * .5 - pg * .78, y - W * .024, pg * .16, W * .048); }

  // ---- daño: quemaduras y boquetes en la cubierta
  if (d >= 1) {
    const q = azar(10);
    ctx.save(); casco(ctx, p, .9, .76); ctx.clip();
    for (let i = 0; i < [0, 3, 6, 9][d]; i++) { const x = (q() - .5) * L * .8, y = (q() - .5) * W * .6, rr = W * (.12 + q() * .1); const gg = ctx.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(8,4,2,.7)'); gg.addColorStop(1, 'rgba(8,4,2,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
    for (let i = 0; i < [0, 1, 3, 5][d]; i++) { const x = (-.3 + q() * .6) * L, y = (q() - .5) * W * .4, rr = W * (.05 + q() * .04); ctx.fillStyle = '#060403'; ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, z = rr * (.6 + q() * .8); k ? ctx.lineTo(x + Math.cos(a) * z, y + Math.sin(a) * z) : ctx.moveTo(x + Math.cos(a) * z, y + Math.sin(a) * z); } ctx.fill(); ctx.strokeStyle = '#d9b27a'; ctx.lineWidth = .4; ctx.stroke(); }
    ctx.restore();
  }

  // ---- jarcia firme: obenques de cada palo a las mesas de guarnición y estays por crujía
  ctx.strokeStyle = 'rgba(24,16,8,.62)'; ctx.lineWidth = .4; ctx.beginPath();
  pos.forEach((mx) => { for (const s of [-1, 1]) for (let k = -2; k <= 1; k++) { const x = mx - W * .04 + k * W * .06; ctx.moveTo(mx, 0); ctx.lineTo(x, s * mitad(p, x) * .93); } });
  ctx.moveTo(pos[2], 0); ctx.lineTo(L * (.5 + G.baupres), 0); ctx.moveTo(pos[1], 0); ctx.lineTo(pos[2], 0); ctx.moveTo(pos[0], 0); ctx.lineTo(pos[1], 0);
  ctx.stroke();
  ctx.fillStyle = '#2a1a0d'; pos.forEach((mx) => { for (const s of [-1, 1]) ctx.fillRect(mx - W * .19, s * mitad(p, mx) * .93 - .7, W * .26, 1.4); });

  // ---- bauprés
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e1208'; ctx.lineWidth = W * .062; ctx.beginPath(); ctx.moveTo(L * .34, 0); ctx.lineTo(L * (.5 + G.baupres), 0); ctx.stroke();
  ctx.strokeStyle = '#6b4526'; ctx.lineWidth = W * .04; ctx.beginPath(); ctx.moveTo(L * .34, 0); ctx.lineTo(L * (.5 + G.baupres), 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(214,170,112,.7)'; ctx.lineWidth = W * .01; ctx.beginPath(); ctx.moveTo(L * .34, -W * .008); ctx.lineTo(L * (.5 + G.baupres), -W * .008); ctx.stroke();

  // ---- velas (en una capa aparte, para poder rasgarlas)
  const capa = document.createElement('canvas'); capa.width = ctx.canvas.width; capa.height = ctx.canvas.height;
  const tc = capa.getContext('2d'); tc.setTransform(ctx.getTransform()); tc.lineJoin = 'round';
  const q = azar(13), rasgar = (cx, cy, rad, cuantos) => {
    tc.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < cuantos; i++) { const x = cx + (q() - .3) * rad * 2, y = cy + (q() * 2 - 1) * rad * 3, rr = W * (.05 + q() * .08); tc.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, z = rr * (.5 + q() * .9); k ? tc.lineTo(x + Math.cos(a) * z, y + Math.sin(a) * z) : tc.moveTo(x + Math.cos(a) * z, y + Math.sin(a) * z); } tc.fill(); }
    tc.globalCompositeOperation = 'source-over';
  };
  const cortes = [0, 0, 2, 4][d], paloRoto = d >= 3;
  if (AB > 0) {
    // foque y cebadera
    cuchillo(tc, pos[2] + W * .05, L * (.5 + G.baupres), W * .3 * (.3 + .7 * AB), tela2, r, false);
    vela(tc, L * .57, W * .27, W * .2 * (.3 + .7 * AB), tela2, r, false);
    verga(tc, L * .57, W * .27, 1.3);
    // latina del palo de popa: la entena en diagonal y el paño a sotavento
    if (!paloRoto) {
      const cola = -L * .5 - W * .12;
      tc.save(); tc.translate(pos[0] + W * .18, 0); cuchillo(tc, 0, cola - pos[0] - W * .18, W * .34 * (.3 + .7 * AB), tela2, r, true); tc.restore();
      tc.lineCap = 'round'; tc.strokeStyle = '#1e1208'; tc.lineWidth = 1.7; tc.beginPath(); tc.moveTo(pos[0] + W * .3, -W * .05); tc.lineTo(cola, W * .34 * (.3 + .7 * AB)); tc.stroke();
      tc.strokeStyle = '#6b4526'; tc.lineWidth = 1; tc.beginPath(); tc.moveTo(pos[0] + W * .3, -W * .05); tc.lineTo(cola, W * .34 * (.3 + .7 * AB)); tc.stroke();
      if (cortes) rasgar((pos[0] + cola) / 2, W * .1, W * .08, 1);
    }
  }
  pos.forEach((mx, m) => {
    if (paloRoto && m === 0) { // palo quebrado: el tocón astillado
      tc.fillStyle = '#3a2412'; tc.beginPath(); tc.arc(mx, 0, W * .06, 0, TAU); tc.fill();
      tc.strokeStyle = '#e2c08a'; tc.lineWidth = .8; for (let i = 0; i < 6; i++) { const a = q() * TAU; tc.beginPath(); tc.moveTo(mx, 0); tc.lineTo(mx + Math.cos(a) * W * .11, Math.sin(a) * W * .11); tc.stroke(); }
      return;
    }
    const capas = G.velas[m];
    capas.forEach(([hf, bf], i) => {
      const h = W * hf, bul = W * bf * (.3 + .7 * AB);
      if (AB <= 0) { verga(tc, mx, h, 1.9 - i * .35); velaAferrada(tc, mx, h, tela); return; }
      vela(tc, mx, h, bul, [tela2, tela, tela3][i], r, i === capas.length - 1);
      if (i === 0 && cortes) { rasgar(mx + bul * .4, 0, bul * .3, cortes); }
      verga(tc, mx, h, 1.9 - i * .35);
    });
    // el palo: la cofa (plataforma) en mayor y trinquete, y el tope
    if (capas.length) { tc.save(); tc.shadowColor = 'rgba(8,5,2,.7)'; tc.shadowBlur = 4; tc.shadowOffsetX = 2; tc.shadowOffsetY = 3; tc.fillStyle = '#4c3018'; tc.beginPath(); tc.arc(mx, 0, W * .1, 0, TAU); tc.fill(); tc.restore(); tc.fillStyle = '#8a6238'; tc.beginPath(); tc.arc(mx, 0, W * .078, 0, TAU); tc.fill(); }
    const gp = tc.createRadialGradient(mx - W * .015, -W * .015, 0, mx, 0, W * .055); gp.addColorStop(0, '#a87c4a'); gp.addColorStop(1, '#2a190b');
    tc.fillStyle = gp; tc.beginPath(); tc.arc(mx, 0, W * .052, 0, TAU); tc.fill();
  });
  // la sombra de todo el aparejo sobre la cubierta, y encima el aparejo
  ctx.save(); casco(ctx, p, .99, .98); ctx.clip();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .34; ctx.filter = 'blur(5px) brightness(0)'; ctx.drawImage(capa, 9, 13);
  ctx.restore(); ctx.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(capa, 0, 0); ctx.restore();

  // ---- mascarón: el águila bicéfala de siempre, sobre su tajamar
  const rl = W * .17;
  ctx.save(); ctx.translate(L * .5 - rl * .8, 0);
  ctx.fillStyle = '#2a1a0d'; ctx.strokeStyle = '#c79a36'; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(rl * .2, 0, rl * 1.25, rl * 1.05, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (aguila) aguila(ctx, rl);
  ctx.restore();
  ctx.restore();
  return pos[G.principal];
}
