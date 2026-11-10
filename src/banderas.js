// Banderas de cada civilización: insignias históricas de la era de la vela, dibujadas a mano
// y simplificadas para que se lean tanto en una tarjeta como en el palo de un barco.
const ROJO = '#c8102e', BLANCO = '#ffffff', AZUL = '#1f3f8a', ORO = '#f2c230', NEGRO = '#1b1b1f';
const TAU = Math.PI * 2;

const BANDERAS = {
  espanoles: [['fondo', '#f4f0e6'], ['borgona', '#b3261e']], // cruz de Borgoña
  britanicos: [['fondo', AZUL], ['aspa', BLANCO, 1.5], ['cruz', BLANCO, 1.9], ['cruz', ROJO, 1.1]], // bandera de la Unión de 1606
  franceses: [['fondo', '#1f3f9a'], ['lises', ORO]], // azul sembrado de flores de lis
  portugueses: [['fondo', BLANCO], ['escudo', ROJO, BLANCO, AZUL]], // armas reales
  holandeses: [['franjas', ['#e8731a', BLANCO, AZUL]]], // bandera del Príncipe
  suecos: [['fondo', '#1f5fa8'], ['nordica', ORO]],
  daneses: [['fondo', ROJO], ['nordica', BLANCO]], // Dannebrog
  rusos: [['franjas', [BLANCO, '#1f4fa8', ROJO]]], // tricolor del zar, 1693
  hanseaticos: [['fondo', '#f2c230'], ['aguila', NEGRO, true]], // águila bicéfala del Sacro Imperio
  polacos: [['fondo', ROJO], ['aguila', BLANCO, false]], // águila blanca
  venecianos: [['fondo', '#a3161a'], ['borde', ORO], ['leon', ORO]], // león de San Marcos
  otomanos: [['fondo', ROJO], ['luna', BLANCO]],
  vikingos: [['fondo', '#b3261e'], ['cuervo', NEGRO]], // estandarte del cuervo
  chinos: [['fondo', '#c8102e'], ['borde', ORO], ['disco', ORO, 0.25]], // estandarte rojo y oro de los Ming
  japoneses: [['fondo', '#1b1b1f'], ['mon', '#d9a441']], // emblema de los Tokugawa
  coreanos: [['fondo', BLANCO], ['taegeuk', ROJO, AZUL]],
  mogoles: [['fondo', '#1f7a4a'], ['sol', ORO]], // estandarte verde con el sol
  omanies: [['fondo', ROJO], ['borde', BLANCO]],
  mexicas: [['fondo', '#1fa0a0'], ['borde', '#b3261e'], ['sol', ORO]],
  incas: [['fondo', '#e0a82e'], ['sol', '#b3261e']], // el sol, Inti
};

function aguila(ctx, w, h, color, dosCabezas) {
  const cx = w / 2, cy = h * 0.52, u = h * 0.5;
  ctx.fillStyle = color;
  // alas
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - u * 0.25);
    ctx.lineTo(cx + lado * u * 0.95, cy - u * 0.7);
    ctx.lineTo(cx + lado * u * 0.8, cy - u * 0.2);
    ctx.lineTo(cx + lado * u * 0.9, cy + u * 0.15);
    ctx.lineTo(cx + lado * u * 0.55, cy + u * 0.05);
    ctx.lineTo(cx, cy + u * 0.3);
    ctx.closePath();
    ctx.fill();
    // patas
    ctx.fillRect(cx + lado * u * 0.32 - u * 0.06, cy + u * 0.3, u * 0.12, u * 0.38);
  }
  // cuerpo y cola
  ctx.beginPath(); ctx.ellipse(cx, cy, u * 0.24, u * 0.48, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - u * 0.22, cy + u * 0.4); ctx.lineTo(cx, cy + u * 0.85); ctx.lineTo(cx + u * 0.22, cy + u * 0.4); ctx.fill();
  // cabezas
  const cabezas = dosCabezas ? [-1, 1] : [-1];
  for (const lado of cabezas) {
    const hx = cx + lado * u * (dosCabezas ? 0.24 : 0.1), hy = cy - u * 0.62;
    ctx.beginPath(); ctx.arc(hx, hy, u * 0.17, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + lado * u * 0.12, hy - u * 0.08); ctx.lineTo(hx + lado * u * 0.4, hy); ctx.lineTo(hx + lado * u * 0.12, hy + u * 0.1); ctx.fill();
  }
}

function lis(ctx, x, y, t, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y - t * 0.15, t * 0.2, t * 0.6, 0, 0, TAU); ctx.fill();
  for (const lado of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + lado * t * 0.38, y, t * 0.17, t * 0.42, lado * 0.6, 0, TAU); ctx.fill(); }
  ctx.fillRect(x - t * 0.5, y + t * 0.18, t, t * 0.16);
}

// Dibuja la bandera en el rectángulo (0, 0, w, h)
export function dibujarBandera(ctx, id, w, h) {
  const ops = BANDERAS[id] || BANDERAS.espanoles;
  const g = Math.max(1, h * 0.2);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  for (const [op, a, b, c] of ops) {
    if (op === 'fondo') { ctx.fillStyle = a; ctx.fillRect(0, 0, w, h); }
    else if (op === 'franjas') a.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, (h * i) / a.length, w, h / a.length + 0.5); });
    else if (op === 'cruz') { const t = g * (b || 1); ctx.fillStyle = a; ctx.fillRect(w / 2 - t / 2, 0, t, h); ctx.fillRect(0, h / 2 - t / 2, w, t); }
    else if (op === 'nordica') { ctx.fillStyle = a; ctx.fillRect(w * 0.36 - g / 2, 0, g, h); ctx.fillRect(0, h / 2 - g / 2, w, g); }
    else if (op === 'aspa') {
      ctx.strokeStyle = a; ctx.lineWidth = g * (b || 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
    } else if (op === 'borgona') {
      // aspa de troncos con nudos
      ctx.strokeStyle = a; ctx.lineWidth = g * 0.9;
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.06); ctx.lineTo(w * 0.94, h * 0.94); ctx.moveTo(w * 0.94, h * 0.06); ctx.lineTo(w * 0.06, h * 0.94); ctx.stroke();
      if (h >= 16) {
        ctx.fillStyle = a;
        for (const f of [0.22, 0.38, 0.62, 0.78]) for (const inv of [0, 1]) {
          const x = w * f, y = inv ? h * (1 - f) : h * f;
          ctx.beginPath(); ctx.arc(x + g * 0.5, y - g * 0.5 * (inv ? -1 : 1), g * 0.42, 0, TAU); ctx.fill();
        }
      }
    } else if (op === 'disco') { ctx.fillStyle = a; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * b, 0, TAU); ctx.fill(); }
    else if (op === 'sol') {
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = a; ctx.lineWidth = Math.max(0.8, h * 0.07);
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU;
        ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(ang) * h * 0.26, h / 2 + Math.sin(ang) * h * 0.26); ctx.lineTo(w / 2 + Math.cos(ang) * h * 0.4, h / 2 + Math.sin(ang) * h * 0.4); ctx.stroke();
      }
    } else if (op === 'luna') {
      ctx.fillStyle = a; ctx.beginPath(); ctx.arc(w * 0.46, h / 2, h * 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = ops[0][1]; ctx.beginPath(); ctx.arc(w * 0.54, h / 2, h * 0.24, 0, TAU); ctx.fill();
    } else if (op === 'lises') {
      const t = h * 0.3;
      lis(ctx, w * 0.27, h * 0.3, t, a); lis(ctx, w * 0.73, h * 0.3, t, a); lis(ctx, w * 0.5, h * 0.7, t, a);
    } else if (op === 'escudo') {
      // corona, borde rojo y escudo blanco con cinco escudetes azules
      ctx.fillStyle = ORO; ctx.fillRect(w * 0.4, h * 0.1, w * 0.2, h * 0.12);
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.moveTo(w * 0.34, h * 0.22); ctx.lineTo(w * 0.66, h * 0.22); ctx.lineTo(w * 0.66, h * 0.6); ctx.quadraticCurveTo(w * 0.66, h * 0.86, w * 0.5, h * 0.92); ctx.quadraticCurveTo(w * 0.34, h * 0.86, w * 0.34, h * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.3); ctx.lineTo(w * 0.6, h * 0.3); ctx.lineTo(w * 0.6, h * 0.6); ctx.quadraticCurveTo(w * 0.6, h * 0.76, w * 0.5, h * 0.82); ctx.quadraticCurveTo(w * 0.4, h * 0.76, w * 0.4, h * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c;
      for (const [px, py] of [[0.5, 0.38], [0.44, 0.52], [0.56, 0.52], [0.5, 0.52], [0.5, 0.66]]) ctx.fillRect(w * px - w * 0.02, h * py - h * 0.04, w * 0.04, h * 0.08);
    } else if (op === 'aguila') aguila(ctx, w, h, a, b);
    else if (op === 'leon') {
      // león alado, de perfil
      const u = h * 0.5, cx = w * 0.5, cy = h * 0.56;
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.ellipse(cx, cy, u * 0.6, u * 0.26, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - u * 0.62, cy - u * 0.2, u * 0.27, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - u * 0.2, cy - u * 0.15); ctx.lineTo(cx + u * 0.5, cy - u * 0.85); ctx.lineTo(cx + u * 0.4, cy - u * 0.1); ctx.fill();
      for (const px of [-0.4, -0.15, 0.25, 0.48]) ctx.fillRect(cx + u * px - u * 0.06, cy + u * 0.15, u * 0.12, u * 0.42);
      ctx.strokeStyle = a; ctx.lineWidth = u * 0.1;
      ctx.beginPath(); ctx.moveTo(cx + u * 0.55, cy); ctx.quadraticCurveTo(cx + u * 1.0, cy - u * 0.1, cx + u * 0.85, cy - u * 0.5); ctx.stroke();
    } else if (op === 'cuervo') {
      const u = h * 0.5, cx = w * 0.5, cy = h * 0.5;
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.ellipse(cx, cy, u * 0.5, u * 0.26, -0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - u * 0.1, cy - u * 0.1); ctx.lineTo(cx + u * 0.3, cy - u * 0.8); ctx.lineTo(cx + u * 0.5, cy - u * 0.05); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - u * 0.35, cy - u * 0.1); ctx.lineTo(cx - u * 0.85, cy - u * 0.05); ctx.lineTo(cx - u * 0.4, cy + u * 0.15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + u * 0.35, cy + u * 0.05); ctx.lineTo(cx + u * 0.9, cy + u * 0.45); ctx.lineTo(cx + u * 0.3, cy + u * 0.3); ctx.fill();
    } else if (op === 'mon') {
      // círculo dorado con tres hojas
      ctx.strokeStyle = a; ctx.lineWidth = Math.max(1, h * 0.08);
      ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.34, 0, TAU); ctx.stroke();
      ctx.fillStyle = a;
      for (let k = 0; k < 3; k++) {
        const ang = -Math.PI / 2 + (k / 3) * TAU;
        ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(ang) * h * 0.15, h / 2 + Math.sin(ang) * h * 0.15, h * 0.13, h * 0.1, ang, 0, TAU); ctx.fill();
      }
    } else if (op === 'borde') { ctx.strokeStyle = a; ctx.lineWidth = g * 1.2; ctx.strokeRect(0, 0, w, h); }
    else if (op === 'taegeuk') {
      ctx.fillStyle = a; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.3, Math.PI, 0); ctx.fill();
      ctx.fillStyle = b; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.3, 0, Math.PI); ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(0.6, h * 0.06);
  ctx.strokeRect(0, 0, w, h);
}
