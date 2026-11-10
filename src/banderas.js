// Banderas de cada civilización, dibujadas a mano y simplificadas para que se lean en chiquito.
// Son insignias de la época (o lo más parecido que se puede reconocer en pocos píxeles), no las banderas modernas.
const ROJO = '#c8102e', BLANCO = '#ffffff', AZUL = '#1f3f8a', ORO = '#f2c230', NEGRO = '#1b1b1f';

const BANDERAS = {
  espanoles: [['fondo', '#f4f0e6'], ['aspa', '#b3261e']], // cruz de Borgoña
  britanicos: [['fondo', BLANCO], ['cruz', ROJO]], // cruz de San Jorge
  franceses: [['fondo', AZUL], ['puntos', ORO]], // azul con flores de lis
  portugueses: [['fondo', BLANCO], ['escudo', AZUL, ROJO]],
  holandeses: [['franjas', ['#e8731a', BLANCO, AZUL]]], // bandera del Príncipe
  suecos: [['fondo', '#1f5fa8'], ['nordica', ORO]],
  daneses: [['fondo', ROJO], ['nordica', BLANCO]],
  rusos: [['fondo', BLANCO], ['aspa', AZUL]], // cruz de San Andrés
  hanseaticos: [['franjas', [BLANCO, ROJO]]],
  polacos: [['fondo', ROJO], ['disco', BLANCO, 0.26]], // águila blanca
  venecianos: [['fondo', '#a3161a'], ['borde', ORO], ['disco', ORO, 0.24]], // león de San Marcos
  otomanos: [['fondo', ROJO], ['luna', BLANCO]],
  vikingos: [['fondo', '#b3261e'], ['disco', NEGRO, 0.28]], // estandarte del cuervo
  chinos: [['fondo', ROJO], ['disco', ORO, 0.27]],
  japoneses: [['fondo', BLANCO], ['disco', ROJO, 0.3]],
  coreanos: [['fondo', BLANCO], ['taegeuk', ROJO, AZUL]],
  mogoles: [['fondo', '#1f7a4a'], ['disco', ORO, 0.26]],
  omanies: [['fondo', ROJO], ['asta', BLANCO]],
  mexicas: [['fondo', '#1fa0a0'], ['borde', '#b3261e'], ['disco', ORO, 0.24]],
  incas: [['fondo', '#e0a82e'], ['disco', '#b3261e', 0.27]], // el sol
};

// Dibuja la bandera en el rectángulo (0, 0, w, h)
export function dibujarBandera(ctx, id, w, h) {
  const ops = BANDERAS[id] || BANDERAS.espanoles;
  const g = Math.max(1, h * 0.2);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  for (const [op, a, b] of ops) {
    if (op === 'fondo') { ctx.fillStyle = a; ctx.fillRect(0, 0, w, h); }
    else if (op === 'franjas') a.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (h * i) / a.length, w, h / a.length + 0.5); });
    else if (op === 'cruz') { ctx.fillStyle = a; ctx.fillRect(w / 2 - g / 2, 0, g, h); ctx.fillRect(0, h / 2 - g / 2, w, g); }
    else if (op === 'nordica') { ctx.fillStyle = a; ctx.fillRect(w * 0.36 - g / 2, 0, g, h); ctx.fillRect(0, h / 2 - g / 2, w, g); }
    else if (op === 'aspa') {
      ctx.strokeStyle = a; ctx.lineWidth = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
    } else if (op === 'disco') { ctx.fillStyle = a; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * b, 0, Math.PI * 2); ctx.fill(); }
    else if (op === 'luna') {
      ctx.fillStyle = a; ctx.beginPath(); ctx.arc(w * 0.46, h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ops[0][1]; ctx.beginPath(); ctx.arc(w * 0.54, h / 2, h * 0.24, 0, Math.PI * 2); ctx.fill();
    } else if (op === 'puntos') {
      ctx.fillStyle = a;
      for (const [px, py] of [[0.28, 0.32], [0.72, 0.32], [0.5, 0.7]]) { ctx.beginPath(); ctx.arc(w * px, h * py, h * 0.12, 0, Math.PI * 2); ctx.fill(); }
    } else if (op === 'escudo') {
      ctx.fillStyle = b; ctx.fillRect(w * 0.33, h * 0.18, w * 0.34, h * 0.64);
      ctx.fillStyle = a; ctx.fillRect(w * 0.39, h * 0.27, w * 0.22, h * 0.46);
    } else if (op === 'borde') { ctx.strokeStyle = a; ctx.lineWidth = g * 1.2; ctx.strokeRect(0, 0, w, h); }
    else if (op === 'asta') { ctx.fillStyle = a; ctx.fillRect(0, 0, w * 0.26, h); }
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
