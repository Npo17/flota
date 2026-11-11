// Tercera tanda: tallas de proa (sin discos ni medallones debajo) y adornos de borda.
// Todas las tallas miran a proa (+x) y se dibujan como madera dorada o pintada, con sombra propia, no como íconos.
import { mitad, mezclar } from './motor.js';
const TAU = Math.PI * 2;
const disco = (ctx, x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); };

// corona real tallada, vista desde arriba: aro con ocho florones, cuatro diademas que suben al centro y el orbe
export function coronaTalla(oro = '#e8c24a', sombra = '#8a6410', forro = '#8f1d1d') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    disco(ctx, 0, 0, r * .98, sombra);
    disco(ctx, 0, 0, r * .9, forro);
    for (let i = 0; i < 8; i++) { // florones
      const a = (i / 8) * TAU;
      ctx.save(); ctx.rotate(a); ctx.fillStyle = oro; ctx.strokeStyle = sombra; ctx.lineWidth = .35;
      ctx.beginPath(); ctx.moveTo(r * .78, -r * .16); ctx.lineTo(r * 1.22, 0); ctx.lineTo(r * .78, r * .16); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (i % 2) disco(ctx, r * 1.02, 0, r * .07, '#f4f1e8');
      ctx.restore();
    }
    ctx.strokeStyle = sombra; ctx.lineWidth = r * .3; ctx.beginPath(); ctx.arc(0, 0, r * .84, 0, TAU); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = r * .2; ctx.beginPath(); ctx.arc(0, 0, r * .84, 0, TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) { // diademas
      const a = (i / 4) * TAU + TAU / 8;
      ctx.strokeStyle = sombra; ctx.lineWidth = r * .2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); ctx.lineTo(0, 0); ctx.stroke();
      ctx.strokeStyle = oro; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); ctx.lineTo(0, 0); ctx.stroke();
    }
    disco(ctx, 0, 0, r * .26, sombra); disco(ctx, 0, 0, r * .2, oro); disco(ctx, -r * .06, -r * .06, r * .07, '#fff3b0');
  };
}
// cisne tallado: cuerpo blanco con las alas plegadas y el cuello largo curvado hacia adelante
export function cisneProa(pluma = '#f6f3ea', sombra = '#b9b3a2', pico = '#e07b1a') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = pluma; ctx.strokeStyle = '#6e6857'; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(-r * 1.9, 0); ctx.quadraticCurveTo(-r * 1.2, -r * .7, -r * .1, -r * .5); ctx.quadraticCurveTo(r * .45, 0, -r * .1, r * .5); ctx.quadraticCurveTo(-r * 1.2, r * .7, -r * 1.9, 0); ctx.fill(); ctx.stroke(); // cuerpo
    for (const s of [-1, 1]) { // alas plegadas, con plumas
      ctx.fillStyle = pluma; ctx.beginPath(); ctx.moveTo(-r * .15, s * r * .2); ctx.quadraticCurveTo(-r * .7, s * r * .85, -r * 2.05, s * r * .5); ctx.quadraticCurveTo(-r * 1.2, s * r * .25, -r * .15, s * r * .2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = sombra; ctx.lineWidth = .35;
      for (const k of [.5, .85, 1.2, 1.55]) { ctx.beginPath(); ctx.moveTo(-r * k, s * r * .28); ctx.quadraticCurveTo(-r * (k + .2), s * r * .5, -r * (k + .42), s * r * .52); ctx.stroke(); }
      ctx.strokeStyle = '#6e6857'; ctx.lineWidth = .4;
    }
    // cuello en S y cabeza
    const cuello = () => { ctx.beginPath(); ctx.moveTo(-r * .05, 0); ctx.bezierCurveTo(r * .5, -r * .5, r * .9, r * .45, r * 1.35, 0); };
    ctx.strokeStyle = '#6e6857'; ctx.lineWidth = r * .3; cuello(); ctx.stroke();
    ctx.strokeStyle = pluma; ctx.lineWidth = r * .22; cuello(); ctx.stroke();
    ctx.fillStyle = pluma; ctx.strokeStyle = '#6e6857'; ctx.lineWidth = .4; ctx.beginPath(); ctx.ellipse(r * 1.45, 0, r * .22, r * .17, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = pico; ctx.beginPath(); ctx.moveTo(r * 1.6, -r * .09); ctx.lineTo(r * 1.98, 0); ctx.lineTo(r * 1.6, r * .09); ctx.closePath(); ctx.fill(); ctx.stroke();
    disco(ctx, r * 1.6, 0, r * .07, '#15151a');
    for (const s of [-1, 1]) disco(ctx, r * 1.5, s * r * .1, r * .035, '#15151a');
  };
}
// águila tallada con las alas abiertas hacia atrás y plumas marcadas; dos = águila imperial de dos cabezas, con su corona
export function aguilaTalla(pluma = '#1b1b1f', pico = '#e8b830', dos = false, brillo = null) {
  const luz = brillo || mezclar(pluma, '#ffffff', .22);
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.fillStyle = pluma; ctx.strokeStyle = '#000'; ctx.lineWidth = .4;
      ctx.beginPath(); ctx.moveTo(r * .35, s * r * .18);
      ctx.quadraticCurveTo(r * .5, s * r * 1.05, -r * .5, s * r * 1.5);
      ctx.lineTo(-r * .62, s * r * 1.22); ctx.lineTo(-r * .98, s * r * 1.3); ctx.lineTo(-r * .98, s * r * 1.02); ctx.lineTo(-r * 1.3, s * r * 1.02); ctx.lineTo(-r * 1.2, s * r * .74); ctx.lineTo(-r * 1.5, s * r * .66);
      ctx.quadraticCurveTo(-r * .9, s * r * .4, -r * .6, s * r * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = luz; ctx.lineWidth = .4; // plumas
      for (const [x0, y0, x1, y1] of [[.1, .35, -.45, 1.3], [-.1, .35, -.85, 1.15], [-.3, .33, -1.15, .92], [-.5, .28, -1.35, .7]]) { ctx.beginPath(); ctx.moveTo(r * x0, s * r * y0); ctx.lineTo(r * x1, s * r * y1); ctx.stroke(); }
    }
    ctx.fillStyle = pluma; ctx.strokeStyle = '#000'; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(-r * .85, 0); ctx.lineTo(-r * 1.75, -r * .32); ctx.lineTo(-r * 1.55, -r * .1); ctx.lineTo(-r * 1.85, 0); ctx.lineTo(-r * 1.55, r * .1); ctx.lineTo(-r * 1.75, r * .32); ctx.closePath(); ctx.fill(); ctx.stroke(); // cola
    ctx.beginPath(); ctx.ellipse(-r * .2, 0, r * .72, r * .34, 0, 0, TAU); ctx.fill(); ctx.stroke(); // cuerpo
    ctx.strokeStyle = luz; ctx.lineWidth = .35; for (const k of [-.55, -.25, .05]) { ctx.beginPath(); ctx.arc(r * k, 0, r * .22, -1.1, 1.1); ctx.stroke(); } // plumón del pecho
    for (const s of dos ? [-1, 1] : [0]) {
      ctx.save(); ctx.translate(r * .55, s * r * .22); ctx.rotate(s * .42);
      ctx.fillStyle = pluma; ctx.strokeStyle = '#000'; ctx.lineWidth = .4;
      ctx.beginPath(); ctx.ellipse(r * .12, 0, r * .34, r * .2, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pico; ctx.beginPath(); ctx.moveTo(r * .38, -r * .1); ctx.quadraticCurveTo(r * .8, -r * .06, r * .86, r * .1); ctx.lineTo(r * .4, r * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
      disco(ctx, r * .25, -r * .07, r * .05, '#f4f1e8'); disco(ctx, r * .26, -r * .07, r * .025, '#000');
      ctx.restore();
    }
    if (dos) { ctx.fillStyle = pico; ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(r * .2, -r * .16); ctx.lineTo(r * .5, -r * .2); ctx.lineTo(r * .42, 0); ctx.lineTo(r * .5, r * .2); ctx.lineTo(r * .2, r * .16); ctx.closePath(); ctx.fill(); ctx.stroke(); disco(ctx, r * .3, 0, r * .05, '#c8102e'); } // corona imperial entre las dos cabezas
  };
}
// Zulfikar acostado sobre la proa, como la espada del bergantín francés: hoja de dos puntas hacia adelante
export function zulfikarProa(hoja = '#e6e9ee', oro = '#e8c24a') {
  return (ctx, r) => {
    ctx.lineJoin = 'round';
    ctx.fillStyle = hoja; ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(r * .2, -r * .24); ctx.lineTo(r * 1.5, -r * .3); ctx.lineTo(r * 2.35, -r * .62); ctx.lineTo(r * 1.85, -r * .08); ctx.lineTo(r * 1.6, 0); ctx.lineTo(r * 1.85, r * .08); ctx.lineTo(r * 2.35, r * .62); ctx.lineTo(r * 1.5, r * .3); ctx.lineTo(r * .2, r * .24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a909c'; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.moveTo(r * .3, 0); ctx.lineTo(r * 1.5, 0); ctx.stroke();
    ctx.fillStyle = oro; ctx.strokeStyle = '#7a5514'; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(r * .22, -r * .8); ctx.quadraticCurveTo(r * .02, 0, r * .22, r * .8); ctx.lineTo(r * .0, r * .8); ctx.quadraticCurveTo(-r * .2, 0, r * .0, -r * .8); ctx.closePath(); ctx.fill(); ctx.stroke(); // guarda curva
    ctx.fillStyle = '#1f6f5c'; ctx.fillRect(-r * .8, -r * .13, r * .8, r * .26); ctx.strokeRect(-r * .8, -r * .13, r * .8, r * .26);
    ctx.fillStyle = oro; ctx.beginPath(); ctx.arc(-r * .92, 0, r * .22, 0, TAU); ctx.fill(); ctx.stroke();
  };
}
// media luna tallada y dorada, abierta hacia proa, con la estrella en el medio
export function lunaTalla(oro = '#e8c24a', sombra = '#8a6410') {
  return (ctx, r) => {
    const f = (k) => { ctx.beginPath(); ctx.arc(0, 0, r * k, .75, TAU - .75); ctx.arc(r * .42, 0, r * k * .78, TAU - 1.05, 1.05, true); ctx.closePath(); };
    ctx.fillStyle = sombra; f(1.08); ctx.fill(); ctx.fillStyle = oro; f(1); ctx.fill();
    ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(0, 0, r * .86, 1.6, TAU - 1.6); ctx.stroke();
    ctx.fillStyle = oro; ctx.strokeStyle = sombra; ctx.lineWidth = .35; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, q = r * (i % 2 ? .16 : .38); i ? ctx.lineTo(r * .75 + Math.cos(a) * q, Math.sin(a) * q) : ctx.moveTo(r * .75 + Math.cos(a) * q, Math.sin(a) * q); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  };
}
// caballo marino tallado: cabeza y cuello de caballo con crin, y la cola de pez enroscada
export function caballoProa(piel = '#e8c24a', sombra = '#8a6410', crin = '#f4f1e8') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = sombra; ctx.lineWidth = r * .34; ctx.beginPath(); ctx.moveTo(-r * .2, 0); ctx.bezierCurveTo(-r * 1.0, -r * .6, -r * 1.6, r * .5, -r * 1.1, r * .55); ctx.stroke();
    ctx.strokeStyle = piel; ctx.lineWidth = r * .24; ctx.beginPath(); ctx.moveTo(-r * .2, 0); ctx.bezierCurveTo(-r * 1.0, -r * .6, -r * 1.6, r * .5, -r * 1.1, r * .55); ctx.stroke();
    ctx.fillStyle = crin; for (let i = 0; i < 5; i++) { const x = -r * .5 + i * r * .26; ctx.beginPath(); ctx.moveTo(x - r * .12, -r * .1); ctx.lineTo(x - r * .1, -r * .55); ctx.lineTo(x + r * .12, -r * .12); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = piel; ctx.strokeStyle = sombra; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.ellipse(-r * .05, 0, r * .6, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke(); // cuello
    ctx.beginPath(); ctx.moveTo(r * .3, -r * .3); ctx.quadraticCurveTo(r * 1.0, -r * .3, r * 1.45, -r * .13); ctx.quadraticCurveTo(r * 1.6, 0, r * 1.45, r * .13); ctx.quadraticCurveTo(r * 1.0, r * .3, r * .3, r * .3); ctx.closePath(); ctx.fill(); ctx.stroke(); // cabeza
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .4, s * r * .26); ctx.lineTo(r * .22, s * r * .56); ctx.lineTo(r * .62, s * r * .28); ctx.closePath(); ctx.fill(); ctx.stroke(); disco(ctx, r * .85, s * r * .17, r * .05, '#15151a'); disco(ctx, r * 1.42, s * r * .06, r * .03, '#15151a'); }
  };
}
// cabeza de dragón japonesa (la del Atakemaru): más sobria, de madera lacada con detalles dorados
export function ryuProa(laca = '#7a1f1f', oro = '#e0b83e') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = oro; ctx.lineWidth = r * .1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .1, s * r * .3); ctx.quadraticCurveTo(-r * .5, s * r * .6, -r * 1.0, s * r * .42); ctx.stroke(); }
    ctx.fillStyle = laca; ctx.strokeStyle = '#15100a'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.ellipse(-r * .6, 0, r * .7, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .1, -r * .4); ctx.quadraticCurveTo(r * .7, -r * .42, r * 1.3, -r * .18); ctx.lineTo(r * 1.45, 0); ctx.lineTo(r * 1.3, r * .18); ctx.quadraticCurveTo(r * .7, r * .42, -r * .1, r * .4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(r * .0, 0); ctx.lineTo(r * 1.2, 0); ctx.stroke();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .2, s * r * .2); ctx.lineTo(r * 1.0, s * r * .14); ctx.stroke(); disco(ctx, r * .5, s * r * .25, r * .09, oro); disco(ctx, r * .52, s * r * .25, r * .04, '#15100a'); }
  };
}

// ---------- Adornos de borda ----------
// cortina de guerra (jinmaku): la tela blanca con el mon repetido que cuelga de la borda de los barcos japoneses
export function jinmaku(ctx, c, x0, x1, tela = '#f4f1e8', mon = '#15151a', franja = '#15151a') {
  const { L, W } = c;
  for (const s of [-1, 1]) {
    ctx.lineCap = 'butt';
    ctx.strokeStyle = franja; ctx.lineWidth = W * .13; ctx.beginPath();
    for (let x = x0; x <= x1 + .001; x += .02) { const px = L * x, py = s * mitad(c, px) * .9; x === x0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
    ctx.stroke();
    ctx.strokeStyle = tela; ctx.lineWidth = W * .085; ctx.stroke();
    ctx.strokeStyle = franja; ctx.lineWidth = W * .012; ctx.stroke();
    for (let x = x0 + .09; x < x1 - .03; x += .17) disco(ctx, L * x, s * mitad(c, L * x) * .9, W * .024, mon);
  }
}
// hilera de banderines triangulares a lo largo de la borda
export function banderines(ctx, c, x0, x1, cols) {
  const { L, W } = c; let i = 0;
  for (let x = x0; x <= x1 + .001; x += .075, i++) for (const s of [-1, 1]) {
    const px = L * x, py = s * mitad(c, px) * .97;
    ctx.fillStyle = cols[i % cols.length]; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = .3;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - W * .2, py + s * W * .05); ctx.lineTo(px - W * .02, py + s * W * .13); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
// faroles de papel rojos colgados en la popa
export function farolesRojos(ctx, c, n = 3) {
  const { L, W } = c;
  for (let i = 0; i < n; i++) { const y = (i - (n - 1) / 2) * W * .2; disco(ctx, -L * .5 - W * .05, y, W * .06, '#15100a'); disco(ctx, -L * .5 - W * .05, y, W * .048, '#c8102e'); disco(ctx, -L * .5 - W * .06, y - W * .012, W * .018, '#ffb38a'); }
}

// grifo tallado (Stralsund, Greifswald): cabeza y alas de águila, cuerpo y cola de león, garras hacia adelante
export function grifoProa(oro = '#e8c24a', sombra = '#8a6410') {
  const aguila = aguilaTalla(oro, '#c8102e', false, '#fff3b0');
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = sombra; ctx.lineWidth = r * .2; ctx.beginPath(); ctx.moveTo(-r * 1.4, 0); ctx.bezierCurveTo(-r * 2.1, -r * .2, -r * 2.0, r * .7, -r * 2.4, r * .55); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = r * .13; ctx.beginPath(); ctx.moveTo(-r * 1.4, 0); ctx.bezierCurveTo(-r * 2.1, -r * .2, -r * 2.0, r * .7, -r * 2.4, r * .55); ctx.stroke();
    disco(ctx, -r * 2.45, r * .55, r * .14, sombra);
    for (const s of [-1, 1]) { ctx.fillStyle = oro; ctx.strokeStyle = sombra; ctx.lineWidth = .4; ctx.beginPath(); ctx.ellipse(r * .7, s * r * .42, r * .45, r * .13, s * -.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = r * .05; for (const k of [-.1, 0, .1]) { ctx.beginPath(); ctx.moveTo(r * 1.1, s * r * (.34 + k)); ctx.lineTo(r * 1.28, s * r * (.3 + k * 1.3)); ctx.stroke(); } }
    aguila(ctx, r);
  };
}
// llave de Bremen tallada, acostada sobre la proa como la espada del bergantín francés: paletón hacia adelante
export function llaveProa(metal = '#e6e9ee', sombra = '#4a4f5a', oro = '#e8c24a') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = sombra; ctx.lineWidth = r * .34; ctx.beginPath(); ctx.moveTo(-r * .4, 0); ctx.lineTo(r * 1.9, 0); ctx.stroke();
    ctx.strokeStyle = metal; ctx.lineWidth = r * .24; ctx.beginPath(); ctx.moveTo(-r * .4, 0); ctx.lineTo(r * 1.9, 0); ctx.stroke();
    ctx.fillStyle = metal; ctx.strokeStyle = sombra; ctx.lineWidth = .5; // paletón
    ctx.beginPath(); ctx.moveTo(r * 1.3, -r * .1); ctx.lineTo(r * 1.3, -r * .62); ctx.lineTo(r * 1.5, -r * .62); ctx.lineTo(r * 1.5, -r * .38); ctx.lineTo(r * 1.66, -r * .38); ctx.lineTo(r * 1.66, -r * .62); ctx.lineTo(r * 1.92, -r * .62); ctx.lineTo(r * 1.92, -r * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = oro; ctx.strokeStyle = '#7a5514'; ctx.fillRect(-r * .15, -r * .3, r * .22, r * .6); ctx.strokeRect(-r * .15, -r * .3, r * .22, r * .6); // collar
    ctx.strokeStyle = sombra; ctx.lineWidth = r * .3; ctx.beginPath(); ctx.arc(-r * .85, 0, r * .45, 0, TAU); ctx.stroke(); // ojo
    ctx.strokeStyle = metal; ctx.lineWidth = r * .2; ctx.beginPath(); ctx.arc(-r * .85, 0, r * .45, 0, TAU); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.arc(-r * .85, 0, r * .3, 0, TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + .78; disco(ctx, -r * .85 + Math.cos(a) * r * .45, Math.sin(a) * r * .45, r * .1, oro); }
  };
}
