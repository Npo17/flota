// Cuarta tanda de tallas, hechas con las mismas reglas que el león británico y el dragón portugués (los que Cristian aprobó):
// madera dorada o pintada en dos o tres tonos, contorno fino y oscuro, ojos chicos y rasgados con su ceja, sin blancos brillantes,
// sin bigotes enrulados ni colores de dibujito. Todas miran a proa (+x).
const TAU = Math.PI * 2;
const OSC = '#5a3a10';

// Tigre tallado, echado sobre la proa como el león británico: cabeza ancha, orejas, lomo largo con rayas finas,
// patas delanteras estiradas y la cola a un costado. Todo en tonos de madera dorada.
export function tigreSerio(lomo = '#c48a2c', cara = '#e3b55a', raya = '#4a2c12') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // cola, apoyada a estribor
    ctx.strokeStyle = OSC; ctx.lineWidth = r * .2; ctx.beginPath(); ctx.moveTo(-r * 1.5, r * .1); ctx.quadraticCurveTo(-r * 2.1, r * .2, -r * 2.0, r * .62); ctx.stroke();
    ctx.strokeStyle = lomo; ctx.lineWidth = r * .13; ctx.stroke();
    // lomo
    ctx.fillStyle = lomo; ctx.strokeStyle = OSC; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.ellipse(-r * .75, 0, r * .95, r * .44, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(-r * .75, 0, r * .95, r * .44, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = raya; ctx.lineWidth = r * .055;
    for (let i = 0; i < 7; i++) { const x = -r * (1.55 - i * .24); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, s * r * .46); ctx.quadraticCurveTo(x + r * .09, s * r * .26, x + r * .02, s * r * .1); ctx.stroke(); } }
    ctx.strokeStyle = 'rgba(74,44,18,.55)'; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(-r * 1.6, 0); ctx.lineTo(r * .1, 0); ctx.stroke(); // espinazo
    ctx.restore();
    // patas delanteras estiradas, con los dedos marcados
    for (const s of [-1, 1]) {
      ctx.fillStyle = cara; ctx.strokeStyle = OSC; ctx.lineWidth = .4; ctx.beginPath(); ctx.ellipse(r * .98, s * r * .5, r * .38, r * .16, s * .12, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = raya; ctx.lineWidth = .35; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(r * 1.2, s * r * .5 + k * r * .07); ctx.lineTo(r * 1.33, s * r * .5 + k * r * .09); ctx.stroke(); }
      ctx.lineWidth = r * .05; for (const k of [.72, .9]) { ctx.beginPath(); ctx.moveTo(r * k, s * r * .37); ctx.lineTo(r * (k + .03), s * r * .62); ctx.stroke(); }
    }
    // orejas
    for (const s of [-1, 1]) { ctx.fillStyle = lomo; ctx.strokeStyle = OSC; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(-r * .02, s * r * .46, r * .16, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = raya; ctx.beginPath(); ctx.arc(r * .0, s * r * .46, r * .07, 0, TAU); ctx.fill(); }
    // cabeza
    ctx.fillStyle = cara; ctx.strokeStyle = OSC; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.ellipse(r * .36, 0, r * .6, r * .52, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = raya; ctx.lineWidth = r * .055;
    for (const k of [-.15, 0, .15]) { ctx.beginPath(); ctx.moveTo(-r * .12, k * r); ctx.lineTo(r * .16, k * r * .75); ctx.stroke(); } // frente
    for (const s of [-1, 1]) for (const k of [0, .16]) { ctx.beginPath(); ctx.moveTo(r * (.2 + k), s * r * .5); ctx.lineTo(r * (.3 + k), s * r * .36); ctx.stroke(); } // mejillas
    for (const s of [-1, 1]) {
      ctx.strokeStyle = raya; ctx.lineWidth = r * .06; ctx.beginPath(); ctx.moveTo(r * .3, s * r * .3); ctx.lineTo(r * .62, s * r * .16); ctx.stroke(); // ceja
      ctx.fillStyle = '#1a0c05'; ctx.beginPath(); ctx.ellipse(r * .5, s * r * .26, r * .08, r * .045, s * -.4, 0, TAU); ctx.fill(); // ojo rasgado
      ctx.fillStyle = mezcla(cara); ctx.strokeStyle = OSC; ctx.lineWidth = .35; ctx.beginPath(); ctx.ellipse(r * .86, s * r * .1, r * .2, r * .16, 0, 0, TAU); ctx.fill(); ctx.stroke(); // belfos
    }
    ctx.fillStyle = '#2a1608'; ctx.beginPath(); ctx.moveTo(r * .92, -r * .1); ctx.lineTo(r * 1.12, 0); ctx.lineTo(r * .92, r * .1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OSC; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(r * .2, 0); ctx.lineTo(r * .92, 0); ctx.stroke();
  };
}
const mezcla = (hex) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(v + (255 - v) * .22); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };

// Dragón chino tallado, con las reglas del dragón portugués pero sin alas: cuerpo de serpiente en dos tonos con el lomo fileteado
// en oro, cuatro garras cortas, cabeza en cuña con dos cuernos echados hacia atrás y ojos chicos.
export function dragonSerio(piel = '#1f7a4a', oscuro = '#124a2b', oro = '#e0b83e') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const cuerpo = () => { ctx.beginPath(); ctx.moveTo(r * .2, 0); ctx.bezierCurveTo(-r * .4, -r * .62, -r * .9, r * .62, -r * 1.5, 0); ctx.bezierCurveTo(-r * 1.85, -r * .36, -r * 2.15, r * .1, -r * 2.4, -r * .12); };
    // garras, debajo del cuerpo
    ctx.strokeStyle = oscuro; ctx.lineWidth = r * .13;
    for (const [x, y] of [[-.15, -.36], [-.2, .2], [-1.25, .26], [-1.3, -.2]]) { const s = Math.sign(y); ctx.beginPath(); ctx.moveTo(r * x, r * y); ctx.lineTo(r * (x + .16), r * (y + s * .34)); ctx.stroke(); }
    ctx.strokeStyle = oro; ctx.lineWidth = r * .045;
    for (const [x, y] of [[-.15, -.36], [-.2, .2], [-1.25, .26], [-1.3, -.2]]) { const s = Math.sign(y); for (const k of [-.09, 0, .09]) { ctx.beginPath(); ctx.moveTo(r * (x + .16), r * (y + s * .34)); ctx.lineTo(r * (x + .3 + k), r * (y + s * (.42 - Math.abs(k)))); ctx.stroke(); } }
    ctx.strokeStyle = oscuro; ctx.lineWidth = r * .42; cuerpo(); ctx.stroke();
    ctx.strokeStyle = piel; ctx.lineWidth = r * .32; cuerpo(); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = r * .06; cuerpo(); ctx.stroke(); // lomo fileteado
    // punta de la cola
    ctx.fillStyle = oro; ctx.beginPath(); ctx.moveTo(-r * 2.36, -r * .3); ctx.lineTo(-r * 2.72, -r * .16); ctx.lineTo(-r * 2.4, r * .05); ctx.closePath(); ctx.fill();
    // cuernos echados hacia atrás
    for (const s of [-1, 1]) { ctx.strokeStyle = oscuro; ctx.lineWidth = r * .13; ctx.beginPath(); ctx.moveTo(r * .5, s * r * .16); ctx.quadraticCurveTo(r * .1, s * r * .42, -r * .3, s * r * .56); ctx.stroke(); ctx.strokeStyle = oro; ctx.lineWidth = r * .07; ctx.stroke(); }
    // cabeza en cuña
    ctx.fillStyle = piel; ctx.strokeStyle = oscuro; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.moveTo(r * .25, -r * .27); ctx.quadraticCurveTo(r * .85, -r * .3, r * 1.4, -r * .1); ctx.lineTo(r * 1.4, r * .1); ctx.quadraticCurveTo(r * .85, r * .3, r * .25, r * .27); ctx.quadraticCurveTo(r * .1, 0, r * .25, -r * .27); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = oro; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.moveTo(r * .3, 0); ctx.lineTo(r * 1.25, 0); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.strokeStyle = oscuro; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.moveTo(r * .6, s * r * .22); ctx.lineTo(r * .92, s * r * .14); ctx.stroke(); // ceja
      ctx.fillStyle = '#e9b13a'; ctx.beginPath(); ctx.ellipse(r * .78, s * r * .14, r * .08, r * .045, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#100604'; ctx.beginPath(); ctx.arc(r * .8, s * r * .14, r * .025, 0, TAU); ctx.fill();
      ctx.fillStyle = oscuro; ctx.beginPath(); ctx.arc(r * 1.3, s * r * .05, r * .025, 0, TAU); ctx.fill(); // ollares
      ctx.strokeStyle = oro; ctx.lineWidth = r * .04; ctx.beginPath(); ctx.moveTo(r * 1.32, s * r * .1); ctx.quadraticCurveTo(r * 1.5, s * r * .3, r * 1.25, s * r * .46); ctx.stroke(); // barbas, cortas
    }
  };
}

// Sirena tallada. Desde arriba, lo que la hace mujer es el pelo largo que le cae por la espalda, los hombros angostos,
// la cintura y los brazos pegados al cuerpo (no abiertos, que era lo que la hacía parecer un nadador).
export function sirenaSeria(piel = '#e3b55a', pelo = '#8a5a1c', cola = '#2f7a6a', colaOsc = '#184a40') {
  return (ctx, r) => {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // cola larga con escamas y aleta partida
    ctx.fillStyle = cola; ctx.strokeStyle = colaOsc; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(-r * .55, -r * .26); ctx.bezierCurveTo(-r * 1.2, -r * .34, -r * 1.7, -r * .02, -r * 2.2, -r * .1); ctx.lineTo(-r * 2.2, r * .1); ctx.bezierCurveTo(-r * 1.7, r * .22, -r * 1.2, r * .3, -r * .55, r * .26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 2.15, 0); ctx.quadraticCurveTo(-r * 2.5, -r * .2, -r * 2.75, -r * .52); ctx.quadraticCurveTo(-r * 2.5, -r * .06, -r * 2.45, 0); ctx.quadraticCurveTo(-r * 2.5, r * .06, -r * 2.75, r * .52); ctx.quadraticCurveTo(-r * 2.5, r * .2, -r * 2.15, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = colaOsc; ctx.lineWidth = .3;
    for (let i = 0; i < 6; i++) { const x = -r * (.75 + i * .24), h = r * (.24 - i * .025); ctx.beginPath(); ctx.arc(x, 0, h, -1.25, 1.25); ctx.stroke(); }
    // torso: hombros angostos, cintura, cadera
    ctx.fillStyle = piel; ctx.strokeStyle = OSC; ctx.lineWidth = .4;
    ctx.beginPath(); ctx.moveTo(r * .3, -r * .24); ctx.quadraticCurveTo(-r * .1, -r * .3, -r * .3, -r * .15); ctx.quadraticCurveTo(-r * .45, -r * .22, -r * .6, -r * .27); ctx.lineTo(-r * .6, r * .27); ctx.quadraticCurveTo(-r * .45, r * .22, -r * .3, r * .15); ctx.quadraticCurveTo(-r * .1, r * .3, r * .3, r * .24); ctx.closePath(); ctx.fill(); ctx.stroke();
    // brazos pegados al cuerpo, con las manos juntas adelante
    for (const s of [-1, 1]) { ctx.strokeStyle = OSC; ctx.lineWidth = r * .15; ctx.beginPath(); ctx.moveTo(r * .2, s * r * .26); ctx.quadraticCurveTo(r * .55, s * r * .3, r * .8, s * r * .08); ctx.stroke(); ctx.strokeStyle = piel; ctx.lineWidth = r * .1; ctx.stroke(); }
    // cabeza y melena: el pelo cubre la nuca y cae en punta por la espalda hasta la cintura, dejando ver hombros y brazos
    ctx.fillStyle = piel; ctx.strokeStyle = OSC; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(r * .52, 0, r * .2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = pelo; ctx.strokeStyle = '#4a2c0c'; ctx.lineWidth = .35;
    ctx.beginPath(); ctx.moveTo(r * .58, -r * .2); ctx.bezierCurveTo(r * .3, -r * .3, r * .05, -r * .2, -r * .15, -r * .16); ctx.quadraticCurveTo(-r * .5, -r * .12, -r * .8, 0); ctx.quadraticCurveTo(-r * .5, r * .12, -r * .15, r * .16); ctx.bezierCurveTo(r * .05, r * .2, r * .3, r * .3, r * .58, r * .2); ctx.quadraticCurveTo(r * .42, 0, r * .58, -r * .2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9962e'; ctx.lineWidth = .3;
    for (const q of [-.1, 0, .1]) { ctx.beginPath(); ctx.moveTo(r * .4, q * r * 1.4); ctx.quadraticCurveTo(-r * .1, q * r * 1.2, -r * .62, q * r * .4); ctx.stroke(); }
    ctx.fillStyle = '#e8c24a'; ctx.beginPath(); ctx.arc(r * .42, 0, r * .05, 0, TAU); ctx.fill(); // peineta dorada
    ctx.fillStyle = '#1a0c05'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(r * .64, s * r * .08, r * .035, r * .02, 0, 0, TAU); ctx.fill(); }
  };
}

// Remate de proa japonés, sin figura: el tajamar negro con su herraje dorado
export function tajamar(negro = '#15151a', oro = '#e0b83e') {
  return (ctx, r) => {
    ctx.fillStyle = negro; ctx.strokeStyle = '#000'; ctx.lineWidth = .35;
    ctx.beginPath(); ctx.moveTo(-r * .4, -r * .2); ctx.lineTo(r * 1.5, -r * .09); ctx.lineTo(r * 1.5, r * .09); ctx.lineTo(-r * .4, r * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = oro; ctx.fillRect(r * .15, -r * .19, r * .14, r * .38); ctx.fillRect(r * 1.25, -r * .12, r * .25, r * .24);
  };
}
