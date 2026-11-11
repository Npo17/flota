// Emblemas para las velas y mascarones de proa de las propuestas.
// Los emblemas se dibujan en un cuadro de -1 a 1 con "arriba" en -y; enVela() y enProa() los giran para que miren a proa.
const TAU = Math.PI * 2;
const ORO = '#e0b83e', ORO2 = '#9c721a';

// emblema para una vela: devuelve la función que espera el motor
export const enVela = (fn, ...a) => (ctx, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2); ctx.scale(s, s); ctx.lineJoin = 'round'; fn(ctx, ...a); ctx.restore(); };
// emblema usado como mascarón (medallón): k agranda o achica
export const enProa = (fn, k = 1, ...a) => (ctx, r) => { ctx.save(); ctx.rotate(Math.PI / 2); ctx.scale(r * k, r * k); ctx.lineJoin = 'round'; fn(ctx, ...a); ctx.restore(); };

const disco = (ctx, x, y, r, col, borde, lw = .06) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); if (col) { ctx.fillStyle = col; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = lw; ctx.stroke(); } };
const poli = (ctx, pts, col, borde, lw = .06) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); if (col) { ctx.fillStyle = col; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = lw; ctx.stroke(); } };

// ---------- Emblemas ----------
export function corona(ctx, col = ORO, borde = ORO2) {
  poli(ctx, [[-.8, .55], [-.9, -.35], [-.45, .05], [-.25, -.6], [0, .0], [.25, -.6], [.45, .05], [.9, -.35], [.8, .55]], col, borde);
  ctx.fillStyle = col; ctx.fillRect(-.8, .5, 1.6, .28); ctx.strokeStyle = borde; ctx.lineWidth = .06; ctx.strokeRect(-.8, .5, 1.6, .28);
  for (const [x, y] of [[-.9, -.38], [-.25, -.66], [.25, -.66], [.9, -.38]]) disco(ctx, x, y, .11, col, borde, .04);
  disco(ctx, 0, .64, .09, '#c8102e'); disco(ctx, -.45, .64, .07, '#1d3a78'); disco(ctx, .45, .64, .07, '#1d3a78');
}
export function tresCoronas(ctx, col = ORO) {
  for (const [x, y] of [[-.5, -.42], [.5, -.42], [0, .48]]) { ctx.save(); ctx.translate(x, y); ctx.scale(.5, .5); corona(ctx, col); ctx.restore(); }
}
// gavilla de los Vasa: un haz de trigo atado al medio
export function gavilla(ctx, col = ORO, borde = ORO2) {
  poli(ctx, [[-.12, 0], [-.75, -.95], [.75, -.95], [.12, 0], [.6, .95], [-.6, .95]], col, borde);
  ctx.strokeStyle = borde; ctx.lineWidth = .05;
  for (const k of [-.45, -.15, .15, .45]) { ctx.beginPath(); ctx.moveTo(k, -.92); ctx.lineTo(0, 0); ctx.lineTo(k * .8, .92); ctx.stroke(); }
  ctx.fillStyle = '#c8102e'; ctx.fillRect(-.42, -.13, .84, .26); ctx.strokeRect(-.42, -.13, .84, .26);
}
// león rampante heráldico, mirando a la izquierda del escudo
export function leonRampante(ctx, col = ORO, borde = ORO2, lengua = '#c8102e') {
  ctx.fillStyle = col; ctx.strokeStyle = borde; ctx.lineWidth = .06;
  ctx.beginPath(); ctx.moveTo(.55, .2); ctx.bezierCurveTo(1.05, -.1, .9, -.85, .5, -.7); ctx.bezierCurveTo(.75, -.55, .8, -.2, .45, .05); ctx.closePath(); ctx.fill(); ctx.stroke(); // cola
  ctx.beginPath(); ctx.ellipse(.05, .12, .34, .6, .35, 0, TAU); ctx.fill(); ctx.stroke(); // cuerpo
  for (const [x0, y0, x1, y1] of [[-.1, -.25, -.8, -.5], [-.05, .0, -.85, -.05], [.2, .55, -.35, .9], [.38, .5, .55, .95]]) { ctx.lineWidth = .2; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  disco(ctx, -.22, -.55, .36, col, borde); // melena
  disco(ctx, -.42, -.62, .2, col, borde); // cabeza
  poli(ctx, [[-.6, -.52], [-.86, -.44], [-.62, -.4]], lengua);
  disco(ctx, -.46, -.68, .04, '#111');
}
// águila de dos cabezas del Sacro Imperio
export function aguilaBicefala(ctx, col = '#15151a', pico = '#d8a020', lengua = '#c8102e') {
  ctx.fillStyle = col;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.scale(s, 1);
    poli(ctx, [[.12, -.3], [.95, -.72], [.82, -.38], [.98, -.2], [.78, -.02], [.92, .2], [.68, .22], [.72, .46], [.2, .25]], col);
    poli(ctx, [[.05, -.3], [.14, -.72], [.4, -.82], [.5, -.62], [.3, -.6], [.24, -.35]], col); // cuello y cabeza
    poli(ctx, [[.45, -.74], [.72, -.66], [.47, -.6]], pico);
    poli(ctx, [[.18, .45], [.5, .92], [.3, .86], [.26, .98], [.12, .6]], pico); // garra
    disco(ctx, .33, -.71, .035, '#fff');
    ctx.restore();
  }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, .1, .24, .46, 0, 0, TAU); ctx.fill();
  poli(ctx, [[-.2, .45], [0, 1], [.2, .45]], col);
  disco(ctx, 0, -.86, .1, pico); // corona imperial resumida
}
// águila de una cabeza (Brandeburgo, Lübeck antes del águila doble)
export function aguila(ctx, col = '#c8102e', pico = '#d8a020') {
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); poli(ctx, [[.12, -.3], [.95, -.72], [.82, -.38], [.98, -.2], [.78, -.02], [.92, .2], [.68, .22], [.72, .46], [.2, .25]], col); poli(ctx, [[.18, .45], [.5, .92], [.3, .86], [.26, .98], [.12, .6]], pico); ctx.restore(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, .1, .24, .46, 0, 0, TAU); ctx.fill();
  poli(ctx, [[-.2, .45], [0, 1], [.2, .45]], col);
  poli(ctx, [[-.12, -.3], [-.16, -.7], [-.42, -.84], [-.5, -.62], [-.3, -.6], [.12, -.3]], col);
  poli(ctx, [[-.46, -.76], [-.74, -.66], [-.48, -.6]], pico);
}
// llave de Bremen
export function llave(ctx, col = '#e8e8ee', borde = '#555') {
  ctx.strokeStyle = borde; ctx.lineWidth = .34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -.25); ctx.lineTo(0, .9); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = .24; ctx.beginPath(); ctx.moveTo(0, -.25); ctx.lineTo(0, .9); ctx.stroke();
  disco(ctx, 0, -.58, .32, null, borde, .32); disco(ctx, 0, -.58, .32, null, col, .22);
  poli(ctx, [[.08, .45], [.5, .45], [.5, .62], [.3, .62], [.3, .72], [.5, .72], [.5, .9], [.08, .9]], col, borde, .05);
}
// castillo de tres torres de Hamburgo
export function castilloHamburgo(ctx, col = '#f4f1e8', borde = '#7a1010') {
  ctx.fillStyle = col; ctx.strokeStyle = borde; ctx.lineWidth = .05;
  const torre = (x, w, y) => { poli(ctx, [[x - w, .8], [x - w, y], [x - w * 1.3, y], [x - w * 1.3, y - .22], [x - w * .5, y - .22], [x - w * .5, y - .08], [x + w * .5, y - .08], [x + w * .5, y - .22], [x + w * 1.3, y - .22], [x + w * 1.3, y], [x + w, y], [x + w, .8]], col, borde, .05); };
  ctx.fillRect(-.85, .1, 1.7, .7); ctx.strokeRect(-.85, .1, 1.7, .7);
  torre(-.62, .2, -.35); torre(.62, .2, -.35); torre(0, .24, -.6);
  ctx.fillStyle = borde; ctx.beginPath(); ctx.moveTo(-.2, .8); ctx.lineTo(-.2, .45); ctx.arc(0, .45, .2, Math.PI, 0); ctx.lineTo(.2, .8); ctx.closePath(); ctx.fill();
  poli(ctx, [[-.06, -.82], [-.06, -1], [.06, -1], [.06, -.82]], borde);
}
// escudo cortado en dos colores (Lübeck: blanco arriba, rojo abajo)
export function escudoCortado(ctx, arriba = '#f4f1e8', abajo = '#c8102e', borde = '#3a2a10') {
  const f = () => { ctx.beginPath(); ctx.moveTo(-.75, -.85); ctx.lineTo(.75, -.85); ctx.lineTo(.75, .1); ctx.quadraticCurveTo(.7, .7, 0, 1); ctx.quadraticCurveTo(-.7, .7, -.75, .1); ctx.closePath(); };
  f(); ctx.fillStyle = arriba; ctx.fill(); ctx.save(); f(); ctx.clip(); ctx.fillStyle = abajo; ctx.fillRect(-1, 0, 2, 1.2); ctx.restore();
  f(); ctx.strokeStyle = borde; ctx.lineWidth = .08; ctx.stroke();
}
// dos cruces y una corona: armas de Danzig
export function danzig(ctx) {
  for (const y of [-.05, .6]) { ctx.fillStyle = '#f4f1e8'; ctx.fillRect(-.09, y - .3, .18, .6); ctx.fillRect(-.3, y - .09, .6, .18); }
  ctx.save(); ctx.translate(0, -.68); ctx.scale(.36, .36); corona(ctx); ctx.restore();
}
// media luna y estrella
export function mediaLuna(ctx, col = '#f4f1e8', estrella = true) {
  ctx.save(); ctx.beginPath(); ctx.arc(-.12, 0, .78, 0, TAU); ctx.arc(.16, 0, .62, 0, TAU, true); ctx.fillStyle = col; ctx.fill('evenodd'); ctx.restore();
  if (estrella) { const p = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? .12 : .3; p.push([.5 + Math.cos(a) * r, Math.sin(a) * r]); } poli(ctx, p, col); }
}
// tres medias lunas en triángulo (estandarte naval otomano)
export function tresLunas(ctx, col = '#f2c230') {
  for (const [x, y] of [[-.48, -.4], [.48, -.4], [0, .5]]) { ctx.save(); ctx.translate(x, y); ctx.scale(.46, .46); ctx.rotate(-Math.PI / 2); mediaLuna(ctx, col, false); ctx.restore(); }
}
// Zulfikar: el sable de dos puntas de los estandartes de la marina otomana
export function zulfikar(ctx, hoja = '#f4f1e8', puno = ORO) {
  poli(ctx, [[-.12, .45], [-.16, -.35], [-.5, -.95], [-.08, -.5], [0, -.62], [.08, -.5], [.5, -.95], [.16, -.35], [.12, .45]], hoja, '#555', .04);
  ctx.fillStyle = puno; ctx.fillRect(-.42, .42, .84, .13); ctx.fillRect(-.08, .5, .16, .4);
  disco(ctx, 0, .92, .11, puno);
}
// monograma de la Compañía de las Indias Orientales: una V con la O y la C en los brazos
export function voc(ctx, col = '#1d2f55') {
  ctx.strokeStyle = col; ctx.lineWidth = .2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-.6, -.75); ctx.lineTo(0, .8); ctx.lineTo(.6, -.75); ctx.stroke();
  ctx.lineWidth = .15; ctx.beginPath(); ctx.arc(-.38, -.1, .27, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(.4, -.1, .27, .7, TAU - .7); ctx.stroke();
}
// haz de siete flechas de las Provincias Unidas
export function flechas(ctx, col = ORO, borde = ORO2) {
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    ctx.save(); ctx.rotate(i * .2); ctx.strokeStyle = col; ctx.lineWidth = .08; ctx.beginPath(); ctx.moveTo(0, .9); ctx.lineTo(0, -.75); ctx.stroke();
    poli(ctx, [[-.1, -.68], [0, -.98], [.1, -.68]], col, borde, .03); ctx.restore();
  }
  ctx.fillStyle = '#e07b1a'; ctx.fillRect(-.22, .1, .44, .2);
}
// sol rojo
export const solRojo = (ctx, col = '#c8102e') => disco(ctx, 0, 0, .8, col);
// mon de nueve estrellas (kuyō), el de los Date y los Hosokawa
export function monKuyo(ctx, col = '#15151a') {
  disco(ctx, 0, 0, .34, col);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; disco(ctx, Math.cos(a) * .68, Math.sin(a) * .68, .2, col); }
}
// mon de la cruz en el círculo (maru ni jūji), el de los Shimazu
export function monCruz(ctx, col = '#15151a') {
  disco(ctx, 0, 0, .78, null, col, .2);
  ctx.fillStyle = col; ctx.fillRect(-.1, -.78, .2, 1.56); ctx.fillRect(-.78, -.1, 1.56, .2);
}
// mon de la flor de membrillo (mokkō), el de los Oda
export function monMokko(ctx, col = '#15151a', fondo = null) {
  if (fondo) disco(ctx, 0, 0, .95, fondo);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; disco(ctx, Math.cos(a) * .5, Math.sin(a) * .5, .34, null, col, .14); }
  disco(ctx, 0, 0, .2, col);
}
// mon de las tres hojas de malva (mitsuba aoi), el de los Tokugawa
export function monAoi(ctx, col = '#15151a', fondo = null) {
  if (fondo) disco(ctx, 0, 0, .95, fondo);
  disco(ctx, 0, 0, .88, null, col, .12);
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate((i / 3) * TAU);
    ctx.beginPath(); ctx.moveTo(0, -.1); ctx.bezierCurveTo(-.55, -.25, -.45, -.8, 0, -.72); ctx.bezierCurveTo(.45, -.8, .55, -.25, 0, -.1); ctx.fillStyle = col; ctx.fill();
    ctx.restore();
  }
}
// mon de las tres comas (mitsudomoe), muy usado por las flotas de guerra
export function monTomoe(ctx, col = '#15151a') {
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate((i / 3) * TAU);
    ctx.beginPath(); ctx.arc(0, -.45, .33, 0, TAU); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.moveTo(.33, -.45); ctx.quadraticCurveTo(.5, .2, -.5, .62); ctx.quadraticCurveTo(.05, .15, -.1, -.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
// "上" en un círculo: la marca de los Murakami, los señores del mar Interior
export function monMurakami(ctx, col = '#15151a') {
  disco(ctx, 0, 0, .82, null, col, .14);
  ctx.fillStyle = col; ctx.fillRect(-.5, .34, 1, .15); ctx.fillRect(-.08, -.5, .16, .9); ctx.fillRect(0, -.14, .38, .14);
}
// yin y yang con los ocho trigramas alrededor
export function taiji(ctx, a = '#15151a', b = '#f4f1e8') {
  disco(ctx, 0, 0, .62, b, a, .05);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, .62, -Math.PI / 2, Math.PI / 2); ctx.arc(0, .31, .31, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -.31, .31, Math.PI / 2, -Math.PI / 2); ctx.fill();
  disco(ctx, 0, -.31, .09, b); disco(ctx, 0, .31, .09, a);
  ctx.strokeStyle = a; ctx.lineWidth = .07;
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i / 8) * TAU); for (const r of [.74, .84, .94]) { ctx.beginPath(); ctx.moveTo(-.16, -r); ctx.lineTo(.16, -r); ctx.stroke(); } ctx.restore(); }
}
// carácter 明 (Ming) resumido: sol y luna
export function ming(ctx, col = '#f2c230') {
  ctx.strokeStyle = col; ctx.lineWidth = .14; ctx.lineJoin = 'miter';
  ctx.strokeRect(-.75, -.5, .5, .95); ctx.beginPath(); ctx.moveTo(-.75, -.02); ctx.lineTo(-.25, -.02); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(.05, .85); ctx.quadraticCurveTo(.2, .5, .2, -.75); ctx.lineTo(.75, -.75); ctx.lineTo(.75, .8); ctx.lineTo(.55, .7); ctx.stroke();
  for (const y of [-.3, .12]) { ctx.beginPath(); ctx.moveTo(.2, y); ctx.lineTo(.75, y); ctx.stroke(); }
}
// cara de tigre o de león pintada en la proa de los juncos de guerra
export function caraTigre(ctx, piel = '#e08a1e', raya = '#1a1008') {
  for (const s of [-1, 1]) poli(ctx, [[s * .45, -.6], [s * .85, -.98], [s * .82, -.4]], piel, raya, .05);
  disco(ctx, 0, 0, .8, piel, raya, .06);
  ctx.strokeStyle = raya; ctx.lineWidth = .1; ctx.lineCap = 'round';
  for (const s of [-1, 1]) for (const [y0, y1] of [[-.35, -.2], [0, .05], [.32, .25]]) { ctx.beginPath(); ctx.moveTo(s * .78, y0); ctx.lineTo(s * .45, y1); ctx.stroke(); }
  for (const x of [-.14, 0, .14]) { ctx.beginPath(); ctx.moveTo(x, -.78); ctx.lineTo(x * .6, -.48); ctx.stroke(); }
  ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.ellipse(0, .38, .42, .3, 0, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) { disco(ctx, s * .32, -.18, .15, '#f2e24a', raya, .04); disco(ctx, s * .32, -.18, .06, raya); poli(ctx, [[s * .16, .5], [s * .22, .78], [s * .3, .5]], '#fff', raya, .03); }
  poli(ctx, [[-.12, .18], [.12, .18], [0, .34]], raya);
  ctx.strokeStyle = '#c8102e'; ctx.lineWidth = .08; ctx.beginPath(); ctx.moveTo(-.26, .52); ctx.quadraticCurveTo(0, .62, .26, .52); ctx.stroke();
}
// fénix con las alas abiertas, para los espejos de popa de los juncos
export function fenix(ctx, col = '#c8102e', oro = ORO) {
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); ctx.beginPath(); ctx.moveTo(.08, -.1); ctx.bezierCurveTo(.5, -.9, .95, -.6, .95, -.2); ctx.bezierCurveTo(.7, -.35, .5, -.1, .15, .2); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = oro; ctx.lineWidth = .1; ctx.lineCap = 'round';
  for (const k of [-.5, 0, .5]) { ctx.beginPath(); ctx.moveTo(0, .2); ctx.quadraticCurveTo(k * .6, .6, k, .95); ctx.stroke(); }
  ctx.fillStyle = oro; ctx.beginPath(); ctx.ellipse(0, .05, .16, .32, 0, 0, TAU); ctx.fill();
  disco(ctx, 0, -.4, .14, oro); poli(ctx, [[-.05, -.5], [0, -.75], [.05, -.5]], col);
}

// ---------- Mascarones vistos desde arriba (proa hacia +x) ----------
// león echado hacia adelante: melena, hocico y garras
export function leonProa(cuerpo = ORO, melena = '#c9962e', borde = ORO2) {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.strokeStyle = borde; ctx.lineWidth = .5;
    ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.ellipse(-r * .55, 0, r * .75, r * .42, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(r * .75, s * r * .42, r * .5, r * .15, s * -.25, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.2, s * r * .34, r * .14, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = melena; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, q = r * (i % 2 ? .62 : .46); i ? ctx.lineTo(r * .2 + Math.cos(a) * q, Math.sin(a) * q) : ctx.moveTo(r * .2 + Math.cos(a) * q, Math.sin(a) * q); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.ellipse(r * .45, 0, r * .36, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * .78, 0, r * .2, r * .16, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.arc(r * .95, 0, r * .06, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(r * .55, s * r * .14, r * .045, 0, TAU); ctx.fill(); ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.arc(r * .25, s * r * .28, r * .1, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1008'; }
    ctx.strokeStyle = cuerpo; ctx.lineWidth = r * .1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 1.2, 0); ctx.quadraticCurveTo(-r * 1.7, r * .5, -r * 1.3, r * .6); ctx.stroke();
  };
}
// cabeza de dragón: hocico largo, cuernos hacia atrás, bigotes y crin
export function dragonProa(piel = '#2f7a4a', cresta = '#e0b83e', ojo = '#c8102e') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = cresta; for (let i = 0; i < 5; i++) { const x = -r * (1.1 - i * .32); ctx.beginPath(); ctx.moveTo(x - r * .14, 0); ctx.lineTo(x, -r * .5); ctx.lineTo(x + r * .14, 0); ctx.lineTo(x, r * .5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = piel; ctx.strokeStyle = '#12260f'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.ellipse(-r * .5, 0, r * .8, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke(); // cuello
    ctx.beginPath(); ctx.moveTo(-r * .1, -r * .42); ctx.quadraticCurveTo(r * .6, -r * .5, r * 1.25, -r * .2); ctx.quadraticCurveTo(r * 1.45, 0, r * 1.25, r * .2); ctx.quadraticCurveTo(r * .6, r * .5, -r * .1, r * .42); ctx.quadraticCurveTo(-r * .3, 0, -r * .1, -r * .42); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = cresta; ctx.lineWidth = r * .1;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .05, s * r * .3); ctx.quadraticCurveTo(-r * .5, s * r * .75, -r * .95, s * r * .62); ctx.stroke(); } // cuernos
    ctx.strokeStyle = '#f4f1e8'; ctx.lineWidth = r * .05;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * 1.15, s * r * .2); ctx.quadraticCurveTo(r * 1.5, s * r * .7, r * .9, s * r * .95); ctx.stroke(); } // bigotes
    for (const s of [-1, 1]) { ctx.fillStyle = '#f2e24a'; ctx.beginPath(); ctx.arc(r * .35, s * r * .26, r * .11, 0, TAU); ctx.fill(); ctx.fillStyle = ojo; ctx.beginPath(); ctx.arc(r * .38, s * r * .26, r * .055, 0, TAU); ctx.fill(); ctx.fillStyle = '#12260f'; ctx.beginPath(); ctx.arc(r * 1.15, s * r * .1, r * .04, 0, TAU); ctx.fill(); }
  };
}
// águila con las alas echadas hacia atrás; dos = águila de dos cabezas
export function aguilaProa(col = '#15151a', pico = '#d8a020', dos = false) {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = .4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .3, s * r * .15); ctx.quadraticCurveTo(r * .2, s * r * .9, -r * 1.3, s * r * 1.05); ctx.lineTo(-r * .95, s * r * .75); ctx.lineTo(-r * 1.2, s * r * .6); ctx.lineTo(-r * .8, s * r * .42); ctx.lineTo(-r * 1.0, s * r * .2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(-r * .2, 0, r * .75, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .9, 0); ctx.lineTo(-r * 1.5, -r * .28); ctx.lineTo(-r * 1.4, 0); ctx.lineTo(-r * 1.5, r * .28); ctx.closePath(); ctx.fill();
    for (const s of dos ? [-1, 1] : [0]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(r * .65, s * r * .24, r * .3, r * .2, s * .5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pico; ctx.beginPath(); ctx.moveTo(r * .88, s * r * .28 - r * .1); ctx.lineTo(r * 1.3, s * r * .46); ctx.lineTo(r * .88, s * r * .28 + r * .1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r * .72, s * r * .2, r * .05, 0, TAU); ctx.fill();
    }
  };
}
// sirena o tritón tallado: torso, brazos abiertos y cola
export function sirenaProa(piel = '#e0b83e', cola = '#2f7a6a') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = .4;
    ctx.fillStyle = cola; ctx.beginPath(); ctx.moveTo(-r * .2, -r * .25); ctx.quadraticCurveTo(-r * .9, -r * .2, -r * 1.2, 0); ctx.quadraticCurveTo(-r * .9, r * .2, -r * .2, r * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 1.15, 0); ctx.lineTo(-r * 1.6, -r * .4); ctx.lineTo(-r * 1.4, 0); ctx.lineTo(-r * 1.6, r * .4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = piel; ctx.beginPath(); ctx.ellipse(r * .1, 0, r * .42, r * .3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = piel; ctx.lineWidth = r * .14; ctx.lineCap = 'round'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(r * .2, s * r * .25); ctx.lineTo(r * .75, s * r * .6); ctx.stroke(); }
    ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = .4; ctx.fillStyle = piel; ctx.beginPath(); ctx.arc(r * .7, 0, r * .24, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a4a1a'; ctx.beginPath(); ctx.arc(r * .62, 0, r * .22, Math.PI * .5, Math.PI * 1.5); ctx.fill();
  };
}
// farol de popa o de proa, visto desde arriba
export function farol(ctx, x, y, r) {
  ctx.fillStyle = '#e0b83e'; ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = .4; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(x, y, r * .45, 0, TAU); ctx.fill();
}
