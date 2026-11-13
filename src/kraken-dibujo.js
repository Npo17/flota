// El dibujo del Kraken (el diseño que aprobaron Nicolás y Cristian el 15/11/2026): una criatura vieja de las profundidades,
// no un monstruo de caricatura. Tentáculos gordos que se afinan, con dos filas de ventosas del lado de adentro, lomo oscuro y
// cara pálida; percebes, algas y cicatrices distintos en cada tentáculo; dos ojos enormes, turbios y vidriosos, que siguen a
// los barcos y parpadean con una membrana lenta. También la zona marcada, el golpe, la muerte y la noche con tormenta.
// Solo dibuja: lo que pasa (dónde está, su vida, sus zonas) lo decide la simulación (src/juego.js) o el servidor.
import { KRAKEN } from './config.js';

const TAU = Math.PI * 2;
const TAM = 1.0; // escala del dibujo en el mar (con 1 el cuerpo mide unos 250 de largo y los tentáculos llegan a 300: tres o cuatro barcos)
const PIEL = { borde: '#1c1418', lomo: '#57404a', sombra: '#3d2c35', panza: '#a8958c', ventosa: '#d9cbbd', percebe: '#cfc8b4', alga: '#4d5a35', cicatriz: '#c2aaa6', herido: '#9c8a8c' };
const azar = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const entre = (v) => Math.max(0, Math.min(1, v));
const suave = (v) => { v = entre(v); return v * v * (3 - 2 * v); };

// El estado de este cuadro (se arma al principio de cada dibujo)
let x = null, t = 0, K = null, agonia = 0, hunde = 0, alfaK = 1, mira = { x: 0, y: 0 };

function espuma(px, py, r, alfa) {
  if (alfa <= 0 || r <= 0) return;
  x.strokeStyle = `rgba(255,255,255,${alfa})`; x.lineWidth = 3;
  x.beginPath(); x.ellipse(px, py, r, r * 0.8, 0, 0, TAU); x.stroke();
  x.fillStyle = `rgba(255,255,255,${alfa * 0.35})`; x.beginPath(); x.ellipse(px, py, r * 0.8, r * 0.62, 0, 0, TAU); x.fill();
}
function burbujas(cx, cy, radio, cuanto, n = 40) {
  if (cuanto <= 0.01) return;
  x.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const f = (t * (0.7 + azar(i + 2) * 0.8) + azar(i + 50)) % 1, a = azar(i + 60) * TAU, r = azar(i + 70) * radio;
    x.strokeStyle = `rgba(255,255,255,${0.85 * (1 - f) * cuanto})`; x.fillStyle = `rgba(255,255,255,${0.25 * (1 - f) * cuanto})`;
    x.beginPath(); x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75 - f * 14, 3 + f * 13, 0, TAU); x.fill(); x.stroke();
  }
}
function percebes(px, py, tam, semilla, n = 4) {
  for (let q = 0; q < n; q++) {
    const a = azar(semilla + q) * TAU, d = azar(semilla + q + 9) * tam * 1.3, r = tam * (0.45 + azar(semilla + q + 5) * 0.5);
    x.fillStyle = PIEL.percebe; x.strokeStyle = '#6f6a58'; x.lineWidth = 1;
    x.beginPath(); x.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, r, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#3b382c'; x.beginPath(); x.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, r * 0.38, 0, TAU); x.fill();
  }
}
function alga(px, py, ang, largo, semilla) {
  x.strokeStyle = PIEL.alga; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py);
  for (let q = 1; q <= 5; q++) { const f = q / 5, lado = Math.sin(t * 1.3 + semilla + q * 1.2) * 4 * f; x.lineTo(px + Math.cos(ang) * largo * f + Math.cos(ang + 1.57) * lado, py + Math.sin(ang) * largo * f + Math.sin(ang + 1.57) * lado); }
  x.stroke();
}

// Un tentáculo: una cadena de 30 puntos que ondea en S; la punta va con retraso (látigo). Base muy gruesa que se afina.
// vis (0 a 1): cuánto asoma del agua. Sale primero la punta; lo sumergido se ve apagado y donde corta el agua hay espuma.
function cadena(semilla, ox, oy, ang, largo, grosor, o = {}) {
  const n = 30, pts = [], lado = (o.curva || 0) >= 0 ? 1 : -1; // las ventosas van del lado hacia el que se enrosca
  const prisa = (o.prisa || 1) * (1 + agonia * 3), fuerza = (o.fuerza ?? 1) * (1 + agonia * 2.4);
  let a = ang, px = ox, py = oy;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    a += (Math.sin(t * 1.1 * prisa + semilla * 1.7 - f * 5.2) * 0.06 + Math.sin(t * 0.47 * prisa + semilla * 3.1 - f * 9) * 0.035) * fuerza * (0.35 + f * 1.5) + (o.curva || 0) * f * 0.1;
    px += Math.cos(a) * largo / n; py += Math.sin(a) * largo / n;
    pts.push([px, py, 3.5 + grosor * Math.pow(1 - f, 1.15), a]);
  }
  const vis = o.vis ?? 1, alfa = o.alfa ?? 1;
  if (vis <= 0.03 || alfa <= 0.01) return pts;
  const sale = Math.max(o.base ?? 4, Math.round((1 - vis) * (n - 3)));
  const al = (p, d) => [p[0] + Math.cos(p[3] + 1.57) * d * lado, p[1] + Math.sin(p[3] + 1.57) * d * lado]; // corrido hacia adentro (d > 0) o hacia el lomo (d < 0)
  const tramo = (desde, hasta, color, ancho, corr) => {
    x.strokeStyle = color;
    for (let k = desde; k < hasta; k++) { const p = pts[k], q = pts[k + 1], A = al(p, corr(p[2])), B = al(q, corr(q[2])); x.lineWidth = ancho(p[2]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); }
  };
  x.lineCap = 'round';
  x.globalAlpha = 0.26 * alfa; tramo(0, sale, PIEL.sombra, (w) => w, () => 0);            // lo que va bajo el agua
  x.globalAlpha = alfa;
  tramo(sale, n, PIEL.borde, (w) => w + 6, () => 0);                                       // borde
  tramo(sale, n, o.herido ? PIEL.herido : PIEL.lomo, (w) => w, () => 0);                   // lomo oscuro
  tramo(sale, n, 'rgba(28, 20, 24, 0.4)', (w) => w * 0.3, (w) => -w * 0.34);               // sombra del canto
  tramo(sale, n, PIEL.panza, (w) => w * 0.46, (w) => w * 0.25);                            // cara pálida, la de las ventosas
  x.fillStyle = 'rgba(38, 26, 32, 0.5)';                                                   // manchas de la piel
  for (let k = sale + 1; k < n - 2; k += 2) if (azar(semilla * 31 + k) > 0.4) { const p = pts[k], m = al(p, -p[2] * (0.05 + azar(semilla + k) * 0.3)); x.beginPath(); x.ellipse(m[0], m[1], p[2] * 0.2, p[2] * 0.11, p[3] + azar(k) * 2, 0, TAU); x.fill(); }
  x.strokeStyle = 'rgba(235, 240, 245, 0.2)'; x.lineWidth = 2.5; x.beginPath();            // reflejo mojado, suave
  for (let k = sale; k <= n - 4; k++) { const m = al(pts[k], -pts[k][2] * 0.14); k === sale ? x.moveTo(m[0], m[1]) : x.lineTo(m[0], m[1]); }
  x.stroke();
  for (let k = sale + 1; k < n; k++) {                                                     // ventosas: dos filas, grandes en la base y chicas en la punta
    const p = pts[k], r = p[2] * 0.125; if (r < 1.1) continue;
    for (const d of r > 2.2 ? [0.14, 0.37] : [0.25]) {
      const m = al(p, p[2] * d);
      x.fillStyle = PIEL.ventosa; x.strokeStyle = '#6b5560'; x.lineWidth = 1; x.beginPath(); x.arc(m[0], m[1], r, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#7d6668'; x.beginPath(); x.arc(m[0], m[1], r * 0.42, 0, TAU); x.fill();
    }
  }
  for (let q = 0; q < 1 + Math.floor(azar(semilla * 7) * 4); q++) {                        // percebes: racimos cerca de la base, distintos en cada tentáculo
    const k = 5 + Math.floor(azar(semilla * 11 + q) * 13); if (k <= sale) continue;
    const p = pts[k], m = al(p, -p[2] * (0.12 + azar(semilla + q) * 0.25)); percebes(m[0], m[1], Math.max(2, p[2] * 0.09), semilla * 3 + q, 3 + Math.floor(azar(semilla + q * 5) * 3));
  }
  for (let q = 0; q < Math.floor(azar(semilla * 13) * 3); q++) {                           // algas colgando del lomo
    const k = 6 + Math.floor(azar(semilla * 17 + q) * 14); if (k <= sale) continue;
    const p = pts[k], m = al(p, -p[2] * 0.5); alga(m[0], m[1], p[3] - 1.57 * lado + 0.5, 14 + azar(semilla + q * 3) * 16, semilla + q);
  }
  for (let q = 0; q < Math.floor(azar(semilla * 19) * 3); q++) {                           // cicatrices viejas
    const k = 7 + Math.floor(azar(semilla * 23 + q) * 15); if (k <= sale) continue;
    const p = pts[k], A = al(p, -p[2] * 0.4), B = al(pts[k + 2], p[2] * 0.02); x.strokeStyle = PIEL.cicatriz; x.lineWidth = 2; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
  }
  // donde el tentáculo corta el agua, espuma: fuerte mientras sale, apenas un borde cuando ya está afuera
  const plena = sale <= (o.base ?? 4);
  if (sale < n - 2) espuma(pts[sale][0], pts[sale][1], (pts[sale][2] * 0.72 + 6 + Math.sin(t * 3 + semilla) * 2) * (plena ? 0.7 : 1), (plena ? 0.25 : 0.75) * alfa);
  x.globalAlpha = alfa;
  return pts;
}

// La cabeza: manto, pico apenas visible y dos ojos enormes
function cabeza(claro, asoma, ojosAbre) {
  const late = 1 + Math.sin(t * 1.4) * 0.02;
  x.save(); x.translate(K.x, K.y); x.rotate(K.a); x.scale(late, 2 - late);
  x.fillStyle = 'rgba(30, 14, 30, 0.34)'; x.beginPath(); x.ellipse(-30, 0, 190, 108, 0, 0, TAU); x.fill(); // el cuerpo bajo el agua
  x.restore();
  if (asoma <= 0.01) return;
  espuma(K.x, K.y, 126 + Math.sin(t * 2) * 4, 0.55 * asoma * alfaK);
  x.save(); x.translate(K.x, K.y); x.rotate(K.a); x.scale(late, 2 - late); x.globalAlpha = asoma * alfaK;
  x.strokeStyle = PIEL.borde; x.lineWidth = 5; x.lineJoin = 'round';
  x.fillStyle = '#4a3640'; // aletas redondeadas
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(-66, s * 36); x.bezierCurveTo(-96, s * 96, -150, s * 86, -156, s * 34); x.quadraticCurveTo(-130, s * 22, -108, s * 24); x.closePath(); x.fill(); x.stroke(); }
  const g = x.createLinearGradient(90, 0, -170, 0); g.addColorStop(0, claro ? PIEL.herido : '#60474f'); g.addColorStop(1, claro ? '#7d6a6e' : PIEL.sombra);
  x.fillStyle = g; // manto: ancho adelante, en punta atrás
  x.beginPath(); x.moveTo(84, 0); x.bezierCurveTo(84, -70, -20, -74, -90, -40); x.quadraticCurveTo(-150, -14, -168, 0); x.quadraticCurveTo(-150, 14, -90, 40); x.bezierCurveTo(-20, 74, 84, 70, 84, 0); x.closePath(); x.fill(); x.stroke();
  x.save(); x.clip();
  x.fillStyle = 'rgba(28, 18, 26, 0.45)'; x.beginPath(); x.ellipse(-60, 30, 130, 30, 0.08, 0, TAU); x.fill();           // sombra
  for (let i = 0; i < 12; i++) {                                                                                          // manchas: oscuras y algunas gris verdoso
    x.fillStyle = i % 3 ? 'rgba(34, 22, 30, 0.5)' : 'rgba(112, 120, 96, 0.28)';
    x.beginPath(); x.ellipse(-150 + azar(i + 61) * 215, (azar(i + 71) - 0.5) * 104, 8 + azar(i + 81) * 17, 5 + azar(i + 91) * 9, azar(i) * 3, 0, TAU); x.fill();
  }
  x.strokeStyle = 'rgba(28, 18, 26, 0.5)'; x.lineWidth = 1.6;                                                             // arrugas de piel vieja
  for (let i = 0; i < 9; i++) { const y0 = -52 + i * 13; x.beginPath(); x.moveTo(40 - azar(i) * 30, y0); x.quadraticCurveTo(-30, y0 + (azar(i + 5) - 0.5) * 18, -120 + azar(i + 9) * 30, y0 * 0.45); x.stroke(); }
  x.strokeStyle = 'rgba(235, 240, 245, 0.2)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(52, -42); x.bezierCurveTo(8, -58, -50, -50, -96, -30); x.stroke(); // reflejo mojado
  x.restore();
  for (const [px, py, tam, n] of [[-34, -18, 5, 6], [-96, 8, 4.5, 5], [-58, 34, 3.5, 4], [-128, -8, 3.5, 4], [6, 20, 3, 3]]) percebes(px, py, tam, px + py, n); // percebes en racimos
  x.strokeStyle = PIEL.cicatriz; x.lineWidth = 2.6; x.lineCap = 'round';                                                  // cicatrices
  for (const [ax, ay, bx, by] of [[-22, -40, 10, -12], [-14, -44, 16, -18], [-112, 16, -84, 34]]) { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
  alga(-100, -38, -2.2, 26, 3); alga(-70, 44, 2.1, 22, 8); alga(-134, 20, 2.6, 18, 5);
  x.fillStyle = '#241a14'; x.strokeStyle = PIEL.borde; x.lineWidth = 2;                                                   // el pico, apenas asomando
  x.beginPath(); x.moveTo(80, -11); x.quadraticCurveTo(104, -6, 100, 4); x.quadraticCurveTo(92, 2, 80, 11); x.closePath(); x.fill(); x.stroke();
  // los ojos: enormes, a los costados, turbios y vidriosos; siguen lo que miran y parpadean con una membrana lenta
  const haciaL = Math.atan2(mira.y - K.y, mira.x - K.x) - K.a;
  for (const s of [-1, 1]) {
    const ex = 24, ey = s * 62, R = 27;
    x.fillStyle = '#44323b'; x.strokeStyle = PIEL.borde; x.lineWidth = 4; x.beginPath(); x.arc(ex, ey, R + 9, 0, TAU); x.fill(); x.stroke(); // párpado abultado
    for (let q = 0; q < 5; q++) { const a = (s > 0 ? 0.6 : 3.4) + q * 0.62 + azar(q + s * 3 + 9) * 0.3; percebes(ex + Math.cos(a) * (R + 5), ey + Math.sin(a) * (R + 5), 2.4, q + s * 7 + 40, 2); } // costras
    const ojo = x.createRadialGradient(ex - 5, ey - 6, 3, ex, ey, R); ojo.addColorStop(0, '#9a8a45'); ojo.addColorStop(0.6, '#5e5a2c'); ojo.addColorStop(1, '#2a2816');
    x.fillStyle = ojo; x.strokeStyle = '#14100c'; x.lineWidth = 3; x.beginPath(); x.arc(ex, ey, R, 0, TAU); x.fill(); x.stroke();
    x.save(); x.beginPath(); x.arc(ex, ey, R - 1, 0, TAU); x.clip();
    const pxo = ex + Math.cos(haciaL) * 10, pyo = ey + Math.sin(haciaL) * 10;
    x.fillStyle = '#0c0a08'; x.beginPath(); x.ellipse(pxo, pyo, 12 + agonia * 5, 14 + agonia * 5, 0, 0, TAU); x.fill();           // pupila
    x.fillStyle = 'rgba(205, 205, 175, 0.14)'; x.beginPath(); x.ellipse(ex + 6, ey + 8, R * 0.9, R * 0.6, 0.5, 0, TAU); x.fill(); // velo vidrioso
    x.fillStyle = 'rgba(255, 255, 255, 0.75)'; x.beginPath(); x.ellipse(ex - 9, ey - 11, 5.5, 3.2, -0.6, 0, TAU); x.fill();       // reflejo húmedo
    x.fillStyle = 'rgba(255, 255, 255, 0.4)'; x.beginPath(); x.arc(ex + 8, ey + 10, 1.8, 0, TAU); x.fill();
    const bl = (t * 0.15 + (s > 0 ? 0 : 0.03)) % 1, cierra = Math.max(bl < 0.1 ? Math.sin((bl / 0.1) * Math.PI) : 0, 1 - ojosAbre, hunde);
    if (cierra > 0.01) { // la membrana que pasa de costado
      x.fillStyle = 'rgba(150, 138, 126, 0.93)'; x.fillRect(ex - R, ey - R, 2 * R * cierra, 2 * R);
      x.strokeStyle = 'rgba(60, 46, 50, 0.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(ex - R + 2 * R * cierra, ey - R); x.lineTo(ex - R + 2 * R * cierra, ey + R); x.stroke();
    }
    x.restore();
  }
  x.restore();
}

// El cuerpo con sus ocho tentáculos
function cuerpo(claro, emerge) {
  const tam = TAM * (1 - hunde * 0.45), kx = K.x, ky = K.y, ka = K.a;
  K.x += Math.sin(t * 41) * agonia * 9; K.y += Math.cos(t * 37) * agonia * 7; K.a += Math.sin(t * 7) * agonia * 0.16 + hunde * hunde * 1.5; // se retuerce y gira al hundirse
  x.save(); x.translate(K.x, K.y); x.scale(tam, tam); x.translate(-K.x, -K.y);
  [-0.42, 0.42, -1.0, 1.0, -1.6, 1.6, -2.25, 2.25].forEach((d, i) => {
    const b = K.a + d, adelante = i < 2, s = i % 2 ? 1 : -1;
    const sale = suave((emerge - 0.18 - i * 0.03) / 0.42);                                     // al emerger salen de a uno, la punta primero
    const idle = i === 3 || i === 4 || i === 6 ? suave(0.55 + 0.8 * Math.sin(t * 0.23 + i * 2.1)) : 1; // algunos se hunden y vuelven a salir
    cadena(i + 1, K.x + Math.cos(b) * 58, K.y + Math.sin(b) * 46, b, (adelante ? 300 : 250 + (i % 3) * 22) * (1 - hunde * 0.62), adelante ? 46 : 40,
      { curva: s * (adelante ? 0.42 : 1.1) + hunde * s * 2.2, vis: sale * idle, alfa: alfaK, herido: claro });
  });
  x.globalAlpha = alfaK;
  cabeza(claro, suave((emerge - 0.55) / 0.3), suave((emerge - 0.86) / 0.14));
  x.restore(); x.globalAlpha = 1; K.x = kx; K.y = ky; K.a = ka;
}

// La zona marcada. Se lee por forma además de color: borde claro y nítido, rayas en lo que ya se llenó, anillo de rayitas que gira,
// cuatro flechas hacia adentro y un anillo interior que marca dónde el golpe saca más.
function marcador(z, f, alfa) {
  const R = KRAKEN.radio;
  x.save(); x.translate(z.x, z.y); x.globalAlpha = alfa;
  x.fillStyle = 'rgba(40, 8, 8, 0.3)'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
  x.save(); x.beginPath(); x.arc(0, 0, R * f, 0, TAU); x.clip();                               // el llenado, del centro hacia afuera
  x.fillStyle = 'rgba(232, 92, 40, 0.5)'; x.fillRect(-R, -R, 2 * R, 2 * R);
  x.strokeStyle = 'rgba(255, 244, 214, 0.42)'; x.lineWidth = 3; x.beginPath();
  for (let d = -2 * R; d <= 2 * R; d += 15) { x.moveTo(d, -R); x.lineTo(d + R, R); }
  x.stroke();
  x.restore();
  x.setLineDash([6, 6]); x.strokeStyle = 'rgba(255, 244, 214, 0.9)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R * KRAKEN.nucleo, 0, TAU); x.stroke(); x.setLineDash([]);
  x.strokeStyle = '#1a0d08'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke();
  x.strokeStyle = '#fff3d6'; x.lineWidth = 3.5; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke();
  x.setLineDash([16, 12]); x.lineDashOffset = -t * 46; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R + 11 + Math.sin(t * 9) * 2 * f, 0, TAU); x.stroke(); x.setLineDash([]); x.lineDashOffset = 0;
  x.fillStyle = '#fff3d6'; x.strokeStyle = '#1a0d08'; x.lineWidth = 2;
  for (let q = 0; q < 4; q++) { x.save(); x.rotate(q * TAU / 4 + 0.785); x.beginPath(); x.moveTo(R - 8, 0); x.lineTo(R + 14, -9); x.lineTo(R + 14, 9); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  x.restore(); x.globalAlpha = 1;
}

// El golpe: el tentáculo sale de abajo del agua en el borde de la zona que da al Kraken y cae atravesado sobre ella
function golpe(z) {
  const s = z.t - z.aviso; if (s < 0) return;
  const R = KRAKEN.radio, u = Math.atan2(z.y - K.y, z.x - K.x);
  const cae = entre(s / 0.16), fuera = entre((s - 0.16 - KRAKEN.queda) / 0.55);
  cadena(23 + (z.id % 7), z.x - Math.cos(u) * R * 1.25, z.y - Math.sin(u) * R * 1.25, u + (1 - cae) * 0.9, R * 2.5 * (0.25 + 0.75 * cae) * (1 - fuera * 0.5), 50,
    { curva: 0.35 + (1 - cae) * 2.2, fuerza: 0.55, base: 2, vis: 1 - fuera * 0.9, alfa: 1 - fuera * fuera });
  x.globalAlpha = 1;
  if (s > 0.12 && s < 1.1) {
    const f = (s - 0.12) / 0.98;
    espuma(z.x, z.y, R * (0.5 + f * 1.3), 0.9 * (1 - f)); espuma(z.x, z.y, R * (0.2 + f * 0.9), 0.7 * (1 - f));
    x.fillStyle = '#6b4320'; // astillas
    for (let q = 0; q < 9; q++) { const a = q * 0.7 + 0.3, d = 20 + f * (70 + azar(q) * 80); x.globalAlpha = 1 - f; x.save(); x.translate(z.x + Math.cos(a) * d, z.y + Math.sin(a) * d * 0.8); x.rotate(a + f * 5); x.fillRect(-7, -2, 14, 4); x.restore(); }
    x.globalAlpha = 1;
  }
}

function preparar(ctx, j, k) {
  x = ctx; t = j.t; K = { x: k.x, y: k.y, a: k.a };
  const fm = k.muerte ? entre(k.muerte / 5) : 0; // la muerte dura unos 5 segundos: se retuerce, larga tinta, gira y se hunde
  agonia = fm > 0 && fm < 0.4 ? Math.min(1, fm / 0.08) * (fm < 0.32 ? 1 : (0.4 - fm) / 0.08) : 0;
  hunde = k.muerte ? entre((fm - 0.36) / 0.44) : k.sumerge ? entre(k.sumerge / 3) : 0;
  alfaK = 1 - hunde * hunde;
  // los ojos siguen a su blanco: la zona que marcó o, si no hay, el barco del jugador; giran despacio hacia él
  const z = k.zonas && k.zonas[0], yo = j.jugador, quiere = z ? z : yo ? yo : K;
  if (k.mx === undefined) { k.mx = quiere.x; k.my = quiere.y; }
  k.mx += (quiere.x - k.mx) * 0.06; k.my += (quiere.y - k.my) * 0.06;
  mira = { x: k.mx, y: k.my };
}

// Lo que va debajo de los barcos: el agua que se oscurece al emerger, la tinta al morir, las zonas marcadas y el Kraken
export function dibujarKrakenAbajo(ctx, j, visible) {
  const k = j.kraken;
  if (!k) return;
  preparar(ctx, j, k);
  const emerge = k.emerge ?? 1;
  if (emerge < 0.6 && visible(K.x, K.y, 400)) { // antes de salir: el agua se oscurece y burbujea
    const f = Math.sin(entre(emerge / 0.6) * Math.PI);
    x.fillStyle = `rgba(10, 30, 46, ${0.5 * f})`; x.beginPath(); x.ellipse(K.x, K.y, 330, 210, 0, 0, TAU); x.fill();
    burbujas(K.x, K.y, 260, f, 34);
  }
  for (const z of k.zonas || []) if (z.t < z.aviso + 0.3 && visible(z.x, z.y, KRAKEN.radio + 30)) marcador(z, entre(z.t / z.aviso), z.t < z.aviso ? 1 : 1 - (z.t - z.aviso) / 0.3);
  if (k.muerte) { // la tinta: una mancha oscura que crece y después se disuelve
    const fm = entre(k.muerte / 5), crece = Math.min(1, fm / 0.6), queda = 1 - Math.max(0, (fm - 0.78) / 0.22);
    for (let i = 0; i < 11; i++) {
      const a = i * 0.57 + azar(i) * 2, r = (70 + azar(i + 4) * 150) * crece;
      x.fillStyle = `rgba(18, 8, 26, ${0.36 * queda})`; x.beginPath(); x.ellipse(K.x + Math.cos(a) * r * 0.9, K.y + Math.sin(a) * r * 0.6, (90 + azar(i + 8) * 110) * crece, (60 + azar(i + 12) * 70) * crece, a, 0, TAU); x.fill();
    }
  }
  if (hunde < 1 && visible(K.x, K.y, 420)) cuerpo(j.t - (j.krakenHerido ?? -9) < 0.12 || (agonia > 0 && Math.sin(t * 34) > 0.55), emerge);
  x.globalAlpha = 1;
}

// Lo que va encima de los barcos: el tentáculo que golpea, y las burbujas y el oleaje cuando se hunde
export function dibujarKrakenArriba(ctx, j, visible) {
  const k = j.kraken;
  if (!k) return;
  x = ctx;
  for (const z of k.zonas || []) if (z.t >= z.aviso && visible(z.x, z.y, KRAKEN.radio * 3)) golpe(z);
  if ((k.muerte || k.sumerge) && hunde < 1 && visible(K.x, K.y, 500)) {
    const cuanto = k.muerte ? Math.sin(Math.min(1, entre(k.muerte / 5) / 0.9) * Math.PI) : 1 - hunde;
    burbujas(K.x, K.y, 250 * (1 - hunde * 0.5), cuanto, 46);
    if (hunde > 0.25) { const f = (hunde - 0.25) / 0.75; for (const d of [0, 0.22, 0.44]) { const g = f - d; if (g > 0) espuma(K.x, K.y, 60 + g * 420, 0.85 * (1 - g)); } }
  }
  x.globalAlpha = 1;
}

// La noche con tormenta mientras el Kraken está despierto (en la pantalla, no en el mar): se oscurece, llueve y caen relámpagos.
// fuerza va de 0 a 1 (la pantalla la sube y la baja despacio, para que anochezca y amanezca de a poco).
let rayo = -9, proxRayo = 3;
export function dibujarTormenta(ctx, j, ancho, alto, fuerza) {
  if (fuerza <= 0.01) return;
  x = ctx; t = j.t;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fuerza;
  const g = ctx.createRadialGradient(ancho / 2, alto / 2, Math.min(ancho, alto) * 0.15, ancho / 2, alto / 2, Math.max(ancho, alto) * 0.75);
  g.addColorStop(0, 'rgba(8, 10, 34, 0.42)'); g.addColorStop(1, 'rgba(4, 6, 22, 0.8)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, ancho, alto);
  ctx.strokeStyle = 'rgba(190, 215, 240, 0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); // la lluvia
  const gotas = Math.round(Math.min(260, ancho * alto / 6000));
  for (let i = 0; i < gotas; i++) {
    const px = (azar(i + 300) * (ancho + 300) - 150 - t * 240) % (ancho + 300), py = (azar(i + 500) * alto + t * (760 + azar(i) * 300)) % alto, qx = px < -150 ? px + ancho + 300 : px;
    ctx.moveTo(qx, py); ctx.lineTo(qx - 9, py + 26);
  }
  ctx.stroke();
  if (t > proxRayo || proxRayo - t > 20) { rayo = t; proxRayo = t + 3 + Math.random() * 6; }
  const fr = t - rayo;
  if (fr >= 0 && fr < 0.5) { // el relámpago: un fogonazo doble y el rayo
    ctx.fillStyle = `rgba(225, 235, 255, ${0.45 * Math.max(0, 1 - fr / 0.5) * (fr < 0.08 || (fr > 0.16 && fr < 0.24) ? 1 : 0.35)})`; ctx.fillRect(0, 0, ancho, alto);
    if (fr < 0.26) {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4; ctx.lineJoin = 'miter'; ctx.beginPath();
      let px = ancho * (0.12 + azar(Math.floor(rayo * 10)) * 0.76), py = 0; ctx.moveTo(px, py);
      for (let k = 1; k <= 9; k++) { px += (azar(k + Math.floor(rayo * 10) * 13) - 0.5) * 120; py += alto * 0.085; ctx.lineTo(px, py); }
      ctx.stroke();
    }
  }
  ctx.restore();
  return fr >= 0 && fr < 0.05; // recién cayó un rayo (para el trueno)
}
