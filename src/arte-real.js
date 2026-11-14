// Acabado realista de los barcos, común a todas las civilizaciones. No cambia ningún diseño: cada archivo de arte sigue
// dibujando su casco, sus velas, sus emblemas y sus tallas, y llama a estas piezas para sumarles el acabado:
// tela con luz, sombra y pliegues, cubierta tabla por tabla, casco redondeado, cañones de metal y la sombra del aparejo.
// REAL.on = false deja los barcos con el acabado plano de antes (lo decide dibujo.js con 'barcosReal' de aon-graficos).
export const REAL = { on: true };
const TAU = Math.PI * 2;
function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const escalaDe = (ctx) => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; };

// La forma de una vela cuadra vista desde arriba, hinchada: la verga de banda a banda y el paño lleno hacia proa.
export function formaReal(ctx, mx, h, bul) {
  ctx.beginPath();
  ctx.moveTo(mx - .3, -h); ctx.bezierCurveTo(mx + bul * .9, -h * .86, mx + bul * 1.12, -h * .3, mx + bul * 1.12, 0);
  ctx.bezierCurveTo(mx + bul * 1.12, h * .3, mx + bul * .9, h * .86, mx - .3, h);
  ctx.quadraticCurveTo(mx + bul * .16, 0, mx - .3, -h); ctx.closePath();
}
// Antes de pintar una vela: la sombra blanda que echa sobre lo que tiene debajo. forma() traza su contorno.
export function velaAntes(ctx, forma) {
  const e = escalaDe(ctx);
  ctx.save(); ctx.shadowColor = 'rgba(8,10,16,.55)'; ctx.shadowBlur = 1.5 * e; ctx.shadowOffsetX = .8 * e; ctx.shadowOffsetY = 1.15 * e;
  forma(); ctx.fillStyle = '#d8d0b8'; ctx.fill(); ctx.restore();
}
// Después de pintar una vela cuadra (con su color, rayas y emblema): la luz de la tela, las costuras, los pliegues y la verga.
// o.sinVerga: la vela no cuelga de una verga en mx (junco). o.palo: color de la madera.
export function velaDespues(ctx, forma, mx, h, bul, o = {}) {
  const r = azar(Math.round(mx * 7 + h * 13 + bul * 29) + 5);
  ctx.save(); forma(); ctx.clip();
  // en sombra junto a la verga, luz en la panza, algo apagada en el borde
  let g = ctx.createLinearGradient(mx, 0, mx + bul * 1.12, 0);
  g.addColorStop(0, 'rgba(34,24,10,.42)'); g.addColorStop(.3, 'rgba(34,24,10,.12)'); g.addColorStop(.62, 'rgba(255,252,240,.14)'); g.addColorStop(.9, 'rgba(34,24,10,.04)'); g.addColorStop(1, 'rgba(34,24,10,.22)');
  ctx.fillStyle = g; ctx.fillRect(mx - 2, -h - 2, bul * 1.2 + 4, 2 * h + 4);
  // de banda a banda: más oscura hacia los puños
  g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, 'rgba(40,30,14,.36)'); g.addColorStop(.2, 'rgba(40,30,14,0)'); g.addColorStop(.5, 'rgba(255,250,235,.10)'); g.addColorStop(.8, 'rgba(40,30,14,0)'); g.addColorStop(1, 'rgba(40,30,14,.36)');
  ctx.fillStyle = g; ctx.fillRect(mx - 2, -h - 2, bul * 1.2 + 4, 2 * h + 4);
  // paños cosidos
  ctx.lineWidth = .28; ctx.strokeStyle = 'rgba(86,68,40,.34)';
  for (let k = -.86; k <= .87; k += .172) { const f = Math.sqrt(Math.max(0, 1 - k * k)); ctx.beginPath(); ctx.moveTo(mx + bul * .12 * f, k * h); ctx.quadraticCurveTo(mx + bul * .5, k * h * 1.02, mx + bul * f, k * h * .98); ctx.stroke(); }
  // pliegues blandos
  for (let k = 0; k < 7; k++) {
    const y = (r() * 2 - 1) * h * .8, x = mx + bul * (.2 + r() * .45);
    ctx.fillStyle = k % 2 ? 'rgba(255,252,240,.10)' : 'rgba(52,40,20,.10)';
    ctx.beginPath(); ctx.ellipse(x, y, bul * (.18 + r() * .22), h * (.03 + r() * .04), (r() - .5) * .5, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if (o.sinVerga) return;
  const gr = Math.max(1.1, Math.min(2, h * .09));
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e1208'; ctx.lineWidth = gr; ctx.beginPath(); ctx.moveTo(mx, -h - 1.4); ctx.lineTo(mx, h + 1.4); ctx.stroke();
  ctx.strokeStyle = o.palo || '#6b4526'; ctx.lineWidth = gr * .62; ctx.beginPath(); ctx.moveTo(mx, -h - 1.2); ctx.lineTo(mx, h + 1.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(214,170,112,.7)'; ctx.lineWidth = gr * .18; ctx.beginPath(); ctx.moveTo(mx + gr * .14, -h); ctx.lineTo(mx + gr * .14, h); ctx.stroke();
}
// Lo mismo para una vela de cuchillo (foque, cangreja): borde recto sobre el eje entre x0 y x1 y la panza hacia +y.
export function lateralDespues(ctx, x0, x1, panza) {
  const xm = (x0 + x1) / 2, r = azar(Math.round(x0 * 5 + x1 * 11 + panza * 17) + 9);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(xm, panza, x1, 0); ctx.closePath(); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, panza * .5);
  g.addColorStop(0, 'rgba(34,24,10,.40)'); g.addColorStop(.45, 'rgba(34,24,10,.08)'); g.addColorStop(.8, 'rgba(255,252,240,.14)'); g.addColorStop(1, 'rgba(34,24,10,.18)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1) - 2, Math.min(0, panza) - 2, Math.abs(x1 - x0) + 4, Math.abs(panza) + 4);
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,252,240,.10)' : 'rgba(52,40,20,.10)'; ctx.beginPath(); ctx.ellipse(x0 + (x1 - x0) * (.25 + r() * .5), panza * (.08 + r() * .3), Math.abs(x1 - x0) * .14, Math.abs(panza) * .05 + .3, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// La cubierta ya pintada: cada tabla con su tono, desgaste, y la sombra de la borda todo alrededor. Y el casco, redondeado
// hacia la línea de agua. trazarCubierta() y trazarCasco() trazan esos contornos.
export function cubiertaReal(ctx, trazarCubierta, trazarCasco, L, W) {
  const r = azar(Math.round(L * 31 + W * 17));
  ctx.save(); trazarCubierta(); ctx.clip();
  const paso = W * .075;
  for (let y = -W * .5; y < W * .5; y += paso) {
    const v = r();
    ctx.fillStyle = v < .5 ? `rgba(40,22,8,${(.5 - v) * .32})` : `rgba(255,236,196,${(v - .5) * .26})`;
    // cada hilada va en dos o tres tablas de largo distinto
    let x = -L * .5;
    while (x < L * .5) { const largo = L * (.18 + r() * .3); ctx.globalAlpha = .55 + r() * .45; ctx.fillRect(x, y, largo - .25, paso); x += largo; }
  }
  ctx.globalAlpha = 1;
  for (let k = 0; k < 30; k++) { // desgaste a lo largo de la veta
    ctx.fillStyle = r() < .5 ? 'rgba(255,236,196,.07)' : 'rgba(40,22,8,.09)';
    ctx.beginPath(); ctx.ellipse((r() - .5) * L, (r() - .5) * W * .8, L * (.03 + r() * .09), .5 + r() * 1.2, 0, 0, TAU); ctx.fill();
  }
  const e = escalaDe(ctx);
  ctx.shadowColor = 'rgba(10,6,2,.8)'; ctx.shadowBlur = 1.3 * e; ctx.lineWidth = W * .05; ctx.strokeStyle = 'rgba(10,6,2,.85)';
  trazarCubierta(); ctx.stroke();
  ctx.restore();
  // el casco: más oscuro hacia el agua de cada banda, con un filo de luz arriba
  ctx.save(); trazarCasco(); ctx.clip(); ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, -W * .5, 0, W * .5);
  g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(.07, 'rgba(0,0,0,.12)'); g.addColorStop(.13, 'rgba(0,0,0,0)'); g.addColorStop(.87, 'rgba(0,0,0,0)'); g.addColorStop(.93, 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = g; ctx.fillRect(-L, -W, 2 * L, 2 * W);
  ctx.restore();
}

// Un cañón: la cureña de madera en cubierta y el tubo de metal que asoma por la borda. yb: la borda a esa altura (con su signo).
export function canonReal(ctx, x, yb, s, W, L) {
  const gr = Math.max(1.6, Math.min(3.4, L * .03)), e = escalaDe(ctx);
  ctx.save(); ctx.shadowColor = 'rgba(8,5,2,.7)'; ctx.shadowBlur = .5 * e; ctx.shadowOffsetX = .25 * e; ctx.shadowOffsetY = .35 * e;
  ctx.fillStyle = '#5c3c1e'; ctx.fillRect(x - gr * .75, yb * .56, gr * 1.5, yb * .22); ctx.restore();
  const y0 = yb * .58, y1 = yb + s * W * .075, g = ctx.createLinearGradient(x - gr / 2, 0, x + gr / 2, 0);
  g.addColorStop(0, '#0d0d0f'); g.addColorStop(.45, '#4c4c52'); g.addColorStop(.6, '#2a2a2e'); g.addColorStop(1, '#09090a');
  ctx.fillStyle = g; ctx.fillRect(x - gr * .42, Math.min(y0, y1), gr * .84, Math.abs(y1 - y0));
  ctx.fillRect(x - gr * .52, y1 - (s > 0 ? 1.1 : 0), gr * 1.04, 1.1);
  ctx.fillStyle = '#050505'; ctx.fillRect(x - gr * .2, y1 - (s > 0 ? .45 : 0), gr * .4, .45);
}

// La sombra de todo el aparejo (velas y palos, que están en la capa aparte) sobre la cubierta. Va justo antes de pegar esa capa.
export function sombraAparejo(ctx, capa, trazarCasco) {
  const e = escalaDe(ctx);
  ctx.save(); trazarCasco(); ctx.clip();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .32;
  try { ctx.filter = `blur(${Math.max(1, .8 * e)}px) brightness(0)`; } catch {}
  ctx.drawImage(capa, 1.4 * e, 2 * e);
  ctx.restore(); ctx.filter = 'none';
}
