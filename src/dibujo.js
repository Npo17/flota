// Todo lo que se pinta en el canvas.
import { hash2 } from './rng.js';
import { candidatoAbordaje, difAng } from './juego.js';

const TAU = Math.PI * 2;

export function dibujarBarco(ctx, b, opciones = {}) {
  const s = b.stats, L = s.largo, W = s.ancho;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  if (b.hundiendo) {
    const f = Math.min(1, b.hundiendo / 3);
    ctx.globalAlpha = 1 - f;
    ctx.scale(1 - f * 0.35, 1 - f * 0.35);
    ctx.rotate(f * 0.6);
  }
  // sombra en el agua
  ctx.fillStyle = 'rgba(0,20,40,0.25)';
  casco(ctx, L * 1.04, W * 1.15, 4, 5);
  ctx.fill();
  // casco
  ctx.fillStyle = '#5b3518';
  casco(ctx, L, W, 0, 0);
  ctx.fill();
  ctx.fillStyle = '#b07a44';
  casco(ctx, L * 0.9, W * 0.74, 0, 0);
  ctx.fill();
  // tablas de cubierta
  ctx.strokeStyle = 'rgba(70,40,15,0.35)';
  ctx.lineWidth = 1;
  for (let x = -L * 0.36; x < L * 0.3; x += 7) {
    ctx.beginPath(); ctx.moveTo(x, -W * 0.3); ctx.lineTo(x, W * 0.3); ctx.stroke();
  }
  // cañones
  const porLado = b.diseno.canones / 2;
  ctx.fillStyle = '#1d1d1f';
  for (let i = 0; i < porLado; i++) {
    const off = porLado === 1 ? 0 : (-0.32 + (0.64 * i) / (porLado - 1)) * L;
    const grosor = b.diseno.municion === 'pesada' ? 4.4 : 3;
    ctx.fillRect(off - grosor / 2, -W * 0.5 - 3, grosor, 7);
    ctx.fillRect(off - grosor / 2, W * 0.5 - 4, grosor, 7);
  }
  // mástiles y velas
  const n = s.mastiles;
  const abiertas = b.velas / 3;
  for (let m = 0; m < n; m++) {
    const mx = n === 1 ? L * 0.05 : (-0.26 + (0.5 * m) / (n - 1)) * L;
    const alto = W * (m === Math.floor(n / 2) ? 1.5 : 1.25);
    const grosor = 3 + abiertas * 7;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(mx - grosor / 2 + 3, -alto / 2 + 3, grosor, alto);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(mx - grosor / 2, -alto / 2);
    ctx.quadraticCurveTo(mx + grosor * 0.9, 0, mx - grosor / 2, alto / 2);
    ctx.lineTo(mx - grosor / 2 - 2, alto / 2);
    ctx.lineTo(mx - grosor / 2 - 2, -alto / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,20,0.5)';
    ctx.stroke();
    ctx.fillStyle = '#3d2310';
    ctx.beginPath(); ctx.arc(mx, 0, 2.6, 0, TAU); ctx.fill();
  }
  // bandera en popa
  ctx.fillStyle = b.bandera;
  ctx.fillRect(-L * 0.5 - 2, -4, 9, 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeRect(-L * 0.5 - 2, -4, 9, 8);
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
    ctx.fillText(b.nombre, b.x + 1, y - 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(b.nombre, b.x, y - 5);
  }
}

function casco(ctx, L, W, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(L / 2 + dx, dy);
  ctx.quadraticCurveTo(L * 0.3 + dx, W / 2 + dy, L * 0.05 + dx, W / 2 + dy);
  ctx.lineTo(-L * 0.42 + dx, W * 0.44 + dy);
  ctx.quadraticCurveTo(-L / 2 + dx, W * 0.3 + dy, -L / 2 + dx, dy);
  ctx.quadraticCurveTo(-L / 2 + dx, -W * 0.3 + dy, -L * 0.42 + dx, -W * 0.44 + dy);
  ctx.lineTo(L * 0.05 + dx, -W / 2 + dy);
  ctx.quadraticCurveTo(L * 0.3 + dx, -W / 2 + dy, L / 2 + dx, dy);
  ctx.closePath();
}

function trazarIsla(ctx, isla, escala) {
  const p = isla.puntos, n = p.length;
  const pt = (k) => {
    const q = p[(k + n) % n];
    return [isla.x + Math.cos(q.ang) * isla.r * q.f * escala, isla.y + Math.sin(q.ang) * isla.r * q.f * escala];
  };
  ctx.beginPath();
  let [x0, y0] = pt(0), [x1, y1] = pt(1);
  ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
  for (let k = 1; k <= n; k++) {
    const [cx, cy] = pt(k), [nx, ny] = pt(k + 1);
    ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
  }
  ctx.closePath();
}

export function dibujarEscena(ctx, j, vista) {
  const { ancho, alto, raton } = vista;
  const yo = j.jugador;
  const zoom = vista.zoom;
  const sx = (Math.random() - 0.5) * (j.sacudon || 0), sy = (Math.random() - 0.5) * (j.sacudon || 0);
  const camX = yo.x + sx, camY = yo.y + sy;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#12405e';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.setTransform(zoom, 0, 0, zoom, ancho / 2 - camX * zoom, alto / 2 - camY * zoom);
  const vw = ancho / zoom, vh = alto / zoom;
  const x0 = camX - vw / 2, y0 = camY - vh / 2;
  const visible = (x, y, m) => x > x0 - m && x < x0 + vw + m && y > y0 - m && y < y0 + vh + m;

  // mar: más claro cerca del puerto, más oscuro mar adentro
  const p = j.mundo.puerto;
  const g = ctx.createRadialGradient(p.x, p.y, 100, p.x, p.y, 3400);
  g.addColorStop(0, '#2f9fb8');
  g.addColorStop(0.38, '#237c9e');
  g.addColorStop(0.68, '#18587c');
  g.addColorStop(1, '#0f3350');
  ctx.fillStyle = g;
  ctx.fillRect(x0 - 10, y0 - 10, vw + 20, vh + 20);

  // olitas
  const C = 110;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let gx = Math.floor(x0 / C); gx <= Math.floor((x0 + vw) / C); gx++) {
    for (let gy = Math.floor(y0 / C); gy <= Math.floor((y0 + vh) / C); gy++) {
      const h = hash2(gx, gy), h2 = hash2(gy + 91, gx - 17);
      const a = 0.05 + 0.12 * (0.5 + 0.5 * Math.sin(j.t * 1.3 + h * 20));
      const wx = gx * C + h * C + Math.sin(j.t * 0.6 + h * 9) * 8, wy = gy * C + h2 * C;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 8, wy - 5, wx + 16, wy);
      ctx.quadraticCurveTo(wx + 24, wy + 5, wx + 32, wy);
      ctx.stroke();
    }
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

  // islas
  for (const isla of j.mundo.islas) {
    if (!visible(isla.x, isla.y, isla.r * 1.6)) continue;
    ctx.fillStyle = 'rgba(120,225,215,0.28)';
    trazarIsla(ctx, isla, 1.42); ctx.fill();
    ctx.fillStyle = 'rgba(150,235,220,0.3)';
    trazarIsla(ctx, isla, 1.24); ctx.fill();
    ctx.fillStyle = '#ecd9a0';
    trazarIsla(ctx, isla, 1.1); ctx.fill();
    ctx.fillStyle = '#d9c488';
    trazarIsla(ctx, isla, 1.0); ctx.fill();
    ctx.fillStyle = '#5aa552';
    trazarIsla(ctx, isla, 0.8); ctx.fill();
    ctx.fillStyle = '#458a44';
    trazarIsla(ctx, isla, 0.52); ctx.fill();
    for (const r of isla.rocas) {
      ctx.fillStyle = '#6f6a63';
      ctx.beginPath(); ctx.arc(isla.x + r.x, isla.y + r.y, r.s, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8d877f';
      ctx.beginPath(); ctx.arc(isla.x + r.x - 2, isla.y + r.y - 2, r.s * 0.6, 0, TAU); ctx.fill();
    }
    for (const pa of isla.palmeras) {
      const px = isla.x + pa.x, py = isla.y + pa.y;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.arc(px + 4, py + 5, 9 * pa.s, 0, TAU); ctx.fill();
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

  // abanico de puntería del jugador
  if (!yo.hundiendo && yo.diseno.canones >= 2) {
    const rel = difAng(Math.atan2(raton.y - yo.y, raton.x - yo.x), yo.a);
    const lado = rel >= 0 ? 1 : -1;
    const centro = yo.a + lado * Math.PI / 2;
    const listo = yo.recarga[lado] <= 0;
    ctx.fillStyle = listo ? 'rgba(255,240,170,0.13)' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = listo ? 'rgba(255,240,170,0.5)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    const ab = yo.stats.perdigones > 1 ? 0.3 : 0.2;
    ctx.beginPath();
    ctx.moveTo(yo.x, yo.y);
    ctx.arc(yo.x, yo.y, yo.stats.alcance + yo.stats.ancho / 2, centro - ab, centro + ab);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    vista.ladoRaton = lado;
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
    const f = 1 - bl.vida / bl.vidaTotal;
    const altura = Math.sin(f * Math.PI) * 14;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(bl.x + 2, bl.y + 3, bl.radio, 0, TAU); ctx.fill();
    ctx.fillStyle = '#16161a';
    ctx.beginPath(); ctx.arc(bl.x, bl.y - altura, bl.radio, 0, TAU); ctx.fill();
  }

  // partículas sobre los barcos
  for (const pt of j.particulas) {
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
    ctx.fillText(t.texto, t.x + 1, t.y + 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.texto, t.x, t.y);
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
    ctx.fillText(`Puerto ${Math.round(Math.hypot(p.x - yo.x, p.y - yo.y) / 10)} m`, fx - Math.cos(ang) * 34, fy - Math.sin(ang) * 34 + 4);
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
  ctx.fillText('PUERTO', p.x + 1, p.y - 52);
  ctx.fillStyle = '#fff3c4';
  ctx.fillText('PUERTO', p.x, p.y - 53);
}

export function dibujarMinimapa(ctx, j, lado) {
  const m = j.mundo, k = lado / m.ancho;
  ctx.clearRect(0, 0, lado, lado);
  ctx.fillStyle = 'rgba(10,40,62,0.85)';
  ctx.fillRect(0, 0, lado, lado);
  ctx.fillStyle = '#d9c488';
  for (const i of m.islas) { ctx.beginPath(); ctx.arc(i.x * k, i.y * k, Math.max(2, i.r * k), 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  for (const w of m.remolinos) { ctx.beginPath(); ctx.arc(w.x * k, w.y * k, 3.5, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#ffe89a';
  ctx.fillRect(m.puerto.x * k - 3, m.puerto.y * k - 3, 6, 6);
  const yo = j.jugador;
  for (const b of j.barcos) {
    if (b.hundiendo || b === yo) continue;
    if (b.bando === 'enemigo' && Math.hypot(b.x - yo.x, b.y - yo.y) > 1500) continue;
    ctx.fillStyle = b.bando === 'enemigo' ? '#ff6b6b' : '#7dff9b';
    ctx.fillRect(b.x * k - 1.5, b.y * k - 1.5, 3, 3);
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
