// Segunda tanda de emblemas y mascarones (después de la primera devolución de Cristian).
import { escudoCortado, leonRampante } from './emblemas.js';
const TAU = Math.PI * 2;
const ORO = '#e0b83e', ORO2 = '#9c721a';
const disco = (ctx, x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); };
const poli = (ctx, pts, col) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };

// tigre tallado en la proa, visto desde arriba: cabeza ancha con rayas, hocico blanco, orejas redondas y garras hacia adelante
export function tigreProa(piel = '#e8891c', raya = '#1a1008', claro = '#f6efe0') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // cola
    ctx.strokeStyle = raya; ctx.lineWidth = r * .22; ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.quadraticCurveTo(-r * 1.8, -r * .5, -r * 1.45, -r * .78); ctx.stroke();
    ctx.strokeStyle = piel; ctx.lineWidth = r * .14; ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.quadraticCurveTo(-r * 1.8, -r * .5, -r * 1.45, -r * .78); ctx.stroke();
    // lomo rayado
    ctx.fillStyle = piel; ctx.strokeStyle = raya; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.ellipse(-r * .6, 0, r * .8, r * .46, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(-r * .6, 0, r * .8, r * .46, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = raya; ctx.lineWidth = r * .11;
    for (let i = 0; i < 5; i++) { const x = -r * (1.2 - i * .26); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, s * r * .5); ctx.quadraticCurveTo(x + r * .1, s * r * .25, x - r * .02, s * r * .08); ctx.stroke(); } }
    ctx.restore();
    // garras
    for (const s of [-1, 1]) {
      ctx.fillStyle = piel; ctx.strokeStyle = raya; ctx.lineWidth = .45;
      ctx.beginPath(); ctx.ellipse(r * .8, s * r * .52, r * .5, r * .17, s * -.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = claro; ctx.beginPath(); ctx.arc(r * 1.26, s * r * .44, r * .16, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = raya; ctx.lineWidth = r * .07; for (const k of [.5, .72, .94]) { ctx.beginPath(); ctx.moveTo(r * k, s * r * .42); ctx.lineTo(r * (k + .04), s * r * .66); ctx.stroke(); }
    }
    // orejas
    for (const s of [-1, 1]) { ctx.fillStyle = piel; ctx.strokeStyle = raya; ctx.lineWidth = .45; ctx.beginPath(); ctx.arc(r * .12, s * r * .46, r * .17, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = claro; ctx.beginPath(); ctx.arc(r * .14, s * r * .46, r * .08, 0, TAU); ctx.fill(); }
    // cabeza
    ctx.fillStyle = piel; ctx.strokeStyle = raya; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.ellipse(r * .42, 0, r * .5, r * .52, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = raya; ctx.lineWidth = r * .09;
    for (const k of [-.17, 0, .17]) { ctx.beginPath(); ctx.moveTo(r * .0, k * r); ctx.lineTo(r * .3, k * r * .7); ctx.stroke(); } // las rayas de la frente
    for (const s of [-1, 1]) for (const k of [.28, .46]) { ctx.beginPath(); ctx.moveTo(r * (.2 + k * .5), s * r * .5); ctx.lineTo(r * (.3 + k * .5), s * r * .33); ctx.stroke(); }
    // hocico, nariz, ojos y bigotes
    ctx.fillStyle = claro; ctx.strokeStyle = raya; ctx.lineWidth = .4; ctx.beginPath(); ctx.ellipse(r * .82, 0, r * .26, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    poli(ctx, [[r * 1.02, -r * .1], [r * 1.12, 0], [r * 1.02, r * .1]], '#c0392b');
    for (const s of [-1, 1]) { ctx.fillStyle = '#f2e24a'; ctx.beginPath(); ctx.ellipse(r * .52, s * r * .22, r * .1, r * .08, 0, 0, TAU); ctx.fill(); ctx.stroke(); disco(ctx, r * .55, s * r * .22, r * .04, raya); }
    ctx.strokeStyle = claro; ctx.lineWidth = r * .035; for (const s of [-1, 1]) for (const k of [.2, .45]) { ctx.beginPath(); ctx.moveTo(r * .9, s * r * .2); ctx.lineTo(r * 1.15, s * r * (.4 + k)); ctx.stroke(); }
  };
}
// dragón chino entero asomado por la proa: cabeza con cuernos de ciervo, melena, garras y la perla
export function dragonChino(piel = '#2f8a57', cresta = '#e0b83e', vientre = '#f2e24a') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // cuerpo ondulado hacia popa
    const cuerpo = () => { ctx.beginPath(); ctx.moveTo(r * .1, 0); ctx.bezierCurveTo(-r * .5, -r * .7, -r * .9, r * .7, -r * 1.5, 0); ctx.bezierCurveTo(-r * 1.8, -r * .35, -r * 2.0, r * .2, -r * 2.2, 0); };
    ctx.strokeStyle = '#12260f'; ctx.lineWidth = r * .46; cuerpo(); ctx.stroke();
    ctx.strokeStyle = piel; ctx.lineWidth = r * .36; cuerpo(); ctx.stroke();
    ctx.strokeStyle = cresta; ctx.lineWidth = r * .1; ctx.setLineDash([r * .12, r * .14]); cuerpo(); ctx.stroke(); ctx.setLineDash([]);
    // garras
    for (const s of [-1, 1]) { ctx.strokeStyle = piel; ctx.lineWidth = r * .16; ctx.beginPath(); ctx.moveTo(-r * .1, s * r * .2); ctx.lineTo(r * .5, s * r * .75); ctx.stroke(); ctx.strokeStyle = vientre; ctx.lineWidth = r * .06; for (const k of [-.14, 0, .14]) { ctx.beginPath(); ctx.moveTo(r * .5, s * r * .75); ctx.lineTo(r * (.72 + k), s * r * (.86 - k * .5)); ctx.stroke(); } }
    // melena
    ctx.fillStyle = cresta; for (let i = 0; i < 7; i++) { const a = Math.PI * .5 + (i / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(r * .3 + Math.cos(a - .22) * r * .4, Math.sin(a - .22) * r * .4); ctx.lineTo(r * .3 + Math.cos(a) * r * .78, Math.sin(a) * r * .78); ctx.lineTo(r * .3 + Math.cos(a + .22) * r * .4, Math.sin(a + .22) * r * .4); ctx.closePath(); ctx.fill(); }
    // cuernos de ciervo
    ctx.strokeStyle = vientre; ctx.lineWidth = r * .09;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .3, s * r * .28); ctx.quadraticCurveTo(-r * .2, s * r * .7, -r * .65, s * r * .62); ctx.moveTo(-r * .1, s * r * .6); ctx.lineTo(-r * .2, s * r * .9); ctx.stroke(); }
    // cabeza
    ctx.fillStyle = piel; ctx.strokeStyle = '#12260f'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(r * .05, -r * .42); ctx.quadraticCurveTo(r * .7, -r * .48, r * 1.3, -r * .22); ctx.quadraticCurveTo(r * 1.5, 0, r * 1.3, r * .22); ctx.quadraticCurveTo(r * .7, r * .48, r * .05, r * .42); ctx.quadraticCurveTo(-r * .15, 0, r * .05, -r * .42); ctx.fill(); ctx.stroke();
    ctx.fillStyle = vientre; ctx.beginPath(); ctx.ellipse(r * 1.12, 0, r * .22, r * .2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f4f1e8'; ctx.lineWidth = r * .05;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * 1.2, s * r * .18); ctx.bezierCurveTo(r * 1.7, s * r * .4, r * 1.5, s * r * 1.0, r * 1.0, s * r * 1.05); ctx.stroke(); } // bigotes
    for (const s of [-1, 1]) { disco(ctx, r * .5, s * r * .24, r * .12, '#f4f1e8'); disco(ctx, r * .54, s * r * .24, r * .06, '#c8102e'); disco(ctx, r * 1.2, s * r * .09, r * .04, '#12260f'); }
    // la perla
    disco(ctx, r * 1.78, 0, r * .17, '#f4f1e8'); ctx.strokeStyle = '#c8102e'; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.arc(r * 1.78, 0, r * .17, 0, TAU); ctx.stroke();
  };
}
// cabeza de vaca manchada, con cuernos: la "Bunte Kuh" de Hamburgo
export function vacaProa(piel = '#f4f1e8', mancha = '#3a2416', cuerno = '#e0b83e') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = r * .24; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r * .05, s * r * .42); ctx.quadraticCurveTo(r * .1, s * r * 1.0, r * .75, s * r * .9); ctx.stroke(); }
    ctx.strokeStyle = cuerno; ctx.lineWidth = r * .15; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r * .05, s * r * .42); ctx.quadraticCurveTo(r * .1, s * r * 1.0, r * .75, s * r * .9); ctx.stroke(); }
    ctx.fillStyle = mancha; ctx.strokeStyle = '#1a1008'; ctx.lineWidth = .45;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-r * .25, s * r * .62, r * .3, r * .13, s * .5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = piel; ctx.beginPath(); ctx.ellipse(-r * .7, 0, r * .6, r * .4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const cabeza = () => { ctx.beginPath(); ctx.moveTo(-r * .35, -r * .5); ctx.quadraticCurveTo(r * .5, -r * .5, r * 1.0, -r * .28); ctx.quadraticCurveTo(r * 1.2, 0, r * 1.0, r * .28); ctx.quadraticCurveTo(r * .5, r * .5, -r * .35, r * .5); ctx.quadraticCurveTo(-r * .55, 0, -r * .35, -r * .5); };
    cabeza(); ctx.fill(); ctx.stroke();
    ctx.save(); cabeza(); ctx.clip(); ctx.fillStyle = mancha;
    ctx.beginPath(); ctx.ellipse(-r * .05, -r * .28, r * .32, r * .22, .3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(r * .3, r * .32, r * .24, r * .17, -.2, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e8a8a0'; ctx.beginPath(); ctx.ellipse(r * .95, 0, r * .2, r * .26, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { disco(ctx, r * 1.0, s * r * .1, r * .045, '#1a1008'); disco(ctx, r * .5, s * r * .3, r * .06, '#1a1008'); }
  };
}
// delfín tallado, arqueado hacia adelante
export function delfinProa(col = ORO, borde = '#7a5514') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.strokeStyle = borde; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.lineTo(-r * 1.7, -r * .45); ctx.lineTo(-r * 1.45, 0); ctx.lineTo(-r * 1.7, r * .45); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 1.4, 0); ctx.quadraticCurveTo(-r * .4, -r * .55, r * .7, -r * .3); ctx.quadraticCurveTo(r * 1.35, -r * .08, r * 1.5, 0); ctx.quadraticCurveTo(r * 1.35, r * .08, r * .7, r * .3); ctx.quadraticCurveTo(-r * .4, r * .55, -r * 1.4, 0); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .2, s * r * .34); ctx.lineTo(-r * .3, s * r * .8); ctx.lineTo(-r * .2, s * r * .38); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = borde; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.lineTo(r * .3, 0); ctx.stroke();
    for (const s of [-1, 1]) disco(ctx, r * .85, s * r * .16, r * .05, '#111');
  };
}

// ---------- Emblemas (cuadro de -1 a 1, arriba en -y) ----------
// dos anclas cruzadas: la marca de los almirantazgos holandeses
export function anclas(ctx, col = ORO) {
  for (const s of [-1, 1]) {
    ctx.save(); ctx.rotate(s * .6); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = .14;
    ctx.beginPath(); ctx.moveTo(0, -.8); ctx.lineTo(0, .75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-.3, -.55); ctx.lineTo(.3, -.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, .3, .48, .15, Math.PI - .15); ctx.stroke();
    ctx.lineWidth = .07; ctx.beginPath(); ctx.arc(0, -.9, .1, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}
// tridente de Neptuno
export function tridente(ctx, col = ORO) {
  ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = .15;
  ctx.beginPath(); ctx.moveTo(0, .95); ctx.lineTo(0, -.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-.55, -.85); ctx.lineTo(-.55, -.25); ctx.quadraticCurveTo(-.55, 0, 0, 0); ctx.quadraticCurveTo(.55, 0, .55, -.25); ctx.lineTo(.55, -.85); ctx.stroke();
  for (const x of [-.55, 0, .55]) poli(ctx, [[x - .14, -.78], [x, -1.02], [x + .14, -.78]], col);
}
// tulipán: la flor de la fiebre de 1637
export function tulipan(ctx, flor = '#e07b1a', hoja = '#2f6a45') {
  ctx.strokeStyle = hoja; ctx.lineWidth = .14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, .95); ctx.lineTo(0, -.1); ctx.stroke();
  for (const s of [-1, 1]) { ctx.fillStyle = hoja; ctx.beginPath(); ctx.moveTo(0, .8); ctx.quadraticCurveTo(s * .7, .5, s * .55, -.1); ctx.quadraticCurveTo(s * .25, .35, 0, .8); ctx.fill(); }
  ctx.fillStyle = flor; ctx.strokeStyle = '#7a3a08'; ctx.lineWidth = .05;
  ctx.beginPath(); ctx.moveTo(-.42, -.2); ctx.quadraticCurveTo(-.5, -.75, -.3, -.98); ctx.lineTo(-.12, -.7); ctx.lineTo(0, -1); ctx.lineTo(.12, -.7); ctx.lineTo(.3, -.98); ctx.quadraticCurveTo(.5, -.75, .42, -.2); ctx.quadraticCurveTo(0, .12, -.42, -.2); ctx.fill(); ctx.stroke();
}
// arenque: el pescado que hizo rica a Holanda
export function arenque(ctx, col = '#c9d3dc', borde = '#3a4a5a') {
  ctx.fillStyle = col; ctx.strokeStyle = borde; ctx.lineWidth = .06;
  ctx.beginPath(); ctx.moveTo(0, -.95); ctx.quadraticCurveTo(.42, -.4, .22, .45); ctx.lineTo(.45, .95); ctx.lineTo(0, .72); ctx.lineTo(-.45, .95); ctx.lineTo(-.22, .45); ctx.quadraticCurveTo(-.42, -.4, 0, -.95); ctx.fill(); ctx.stroke();
  disco(ctx, .1, -.6, .06, '#111');
  ctx.beginPath(); ctx.moveTo(-.22, -.35); ctx.quadraticCurveTo(0, -.25, .22, -.35); ctx.stroke();
}
// escudo dorado con el león rojo de Holanda (heráldico, plano: no es una talla)
export function escudoHolanda(ctx) {
  escudoCortado(ctx, '#f2c230', '#f2c230', '#7a5514');
  ctx.save(); ctx.translate(.04, .05); ctx.scale(.7, .7); leonRampante(ctx, '#c8102e', '#7a0a14', '#1d3a78'); ctx.restore();
}
// cúpula dorada sobre un tambor: el quiosco de popa de las naves del sultán, visto desde arriba
export function cupula(ctx, x, y, r, col = '#e0b83e', base = '#1f6f5c') {
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(x + r * .15, y + r * .22, r * 1.08, 0, TAU); ctx.fill();
  ctx.fillStyle = base; ctx.strokeStyle = '#15100a'; ctx.lineWidth = .5; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + TAU / 16; i ? ctx.lineTo(x + Math.cos(a) * r * 1.12, y + Math.sin(a) * r * 1.12) : ctx.moveTo(x + Math.cos(a) * r * 1.12, y + Math.sin(a) * r * 1.12); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#fff3b0'); g.addColorStop(.5, col); g.addColorStop(1, '#8a6410');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * .86, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(90,60,10,.5)'; ctx.lineWidth = .35; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86); ctx.stroke(); }
  disco(ctx, x, y, r * .16, '#fff3b0');
}
