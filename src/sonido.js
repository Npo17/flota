// Sonido del juego: música del lobby, mar, viento y cañones.
// No hay archivos de audio: todo se genera con Web Audio (ruido filtrado para el mar y el viento, un golpe grave
// más un estallido de ruido para el cañón, y una música tranquila armada con notas). Así es original y no pesa nada.
// Dos volúmenes aparte, que se guardan en el navegador: 'sonido' (efectos y ambiente) y 'musica'.
// El navegador no deja sonar nada hasta el primer clic o tecla: recién ahí se arranca.

const GUARDADO = { sonido: 'aon-vol-sonido', musica: 'aon-vol-musica' };
const vol = { sonido: 0.7, musica: 0.45 };
for (const k of Object.keys(vol)) {
  try { const v = localStorage.getItem(GUARDADO[k]); if (v !== null && v !== '' && isFinite(+v)) vol[k] = Math.max(0, Math.min(1, +v)); } catch {}
}

let ctx = null, salida = null, gSonido = null, gMusica = null, gMar = null, gViento = null, filtroViento = null, gMusicaModo = null, eco = null;
let modoActual = 'nada', fuerzaViento = 0, relojMusica = null, proximoCompas = 0, compas = 0, ultimoAjuste = 0;
const BOTONES = 'button, [role="button"], a[href], .chip, .tarjeta, .opcion, select';
let sonando = 0; // cañonazos que suenan ahora (para no apilar cien en una andanada)

export const volumen = (cual) => vol[cual];
export const estado = () => (ctx ? ctx.state : 'sin arrancar'); // para probar
export function ponerVolumen(cual, v) {
  vol[cual] = Math.max(0, Math.min(1, v));
  try { localStorage.setItem(GUARDADO[cual], String(vol[cual])); } catch {}
  if (!ctx) return;
  (cual === 'musica' ? gMusica : gSonido).gain.setTargetAtTime(curva(vol[cual]), ctx.currentTime, 0.03);
}
const curva = (v) => v * v; // el oído no es lineal: con el cuadrado, la mitad de la barra suena a la mitad

function ruido(c, segundos, marron) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * segundos), c.sampleRate), d = b.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < d.length; i++) {
    const blanco = Math.random() * 2 - 1;
    if (marron) { ultimo = (ultimo + 0.02 * blanco) / 1.02; d[i] = ultimo * 3.5; } else d[i] = blanco;
  }
  return b;
}
let bufBlanco = null, bufMarron = null;

// Arma todo sobre un contexto de audio (el de verdad, o uno "sin parlantes" para probar)
function armar(c) {
  ctx = c;
  salida = c.createDynamicsCompressor(); // para que una andanada entera no sature
  salida.threshold.value = -14; salida.ratio.value = 6; salida.attack.value = 0.004; salida.release.value = 0.25;
  salida.connect(c.destination);
  gSonido = c.createGain(); gSonido.gain.value = curva(vol.sonido); gSonido.connect(salida);
  gMusica = c.createGain(); gMusica.gain.value = curva(vol.musica); gMusica.connect(salida);
  bufBlanco = ruido(c, 3, false); bufMarron = ruido(c, 5, true);

  // --- El mar: un fondo grave continuo y, encima, olas que rompen y se van ---
  gMar = c.createGain(); gMar.gain.value = 0; gMar.connect(gSonido);
  const fondo = c.createBufferSource(); fondo.buffer = bufMarron; fondo.loop = true;
  const fFondo = c.createBiquadFilter(); fFondo.type = 'lowpass'; fFondo.frequency.value = 420;
  const gFondo = c.createGain(); gFondo.gain.value = 0.55;
  fondo.connect(fFondo); fFondo.connect(gFondo); gFondo.connect(gMar); fondo.start();
  for (const [hz, periodo, nivel, desfase] of [[900, 7.3, 0.20, 0], [1700, 11.1, 0.11, 3.0], [600, 5.2, 0.14, 1.4]]) {
    const ola = c.createBufferSource(); ola.buffer = bufBlanco; ola.loop = true; ola.playbackRate.value = 0.6 + Math.random() * 0.3;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = nivel * 0.5;
    const lfo = c.createOscillator(); lfo.frequency.value = 1 / periodo;
    const gLfo = c.createGain(); gLfo.gain.value = nivel * 0.5;
    lfo.connect(gLfo); gLfo.connect(g.gain);
    ola.connect(f); f.connect(g); g.connect(gMar);
    ola.start(0, desfase); lfo.start();
  }

  // --- El viento: ruido que silba, más fuerte y más agudo cuando sopla ---
  gViento = c.createGain(); gViento.gain.value = 0; gViento.connect(gSonido);
  const aire = c.createBufferSource(); aire.buffer = bufBlanco; aire.loop = true; aire.playbackRate.value = 0.8;
  filtroViento = c.createBiquadFilter(); filtroViento.type = 'bandpass'; filtroViento.frequency.value = 420; filtroViento.Q.value = 1.6;
  const vaiven = c.createOscillator(); vaiven.frequency.value = 0.13;
  const gVaiven = c.createGain(); gVaiven.gain.value = 110;
  vaiven.connect(gVaiven); gVaiven.connect(filtroViento.frequency);
  aire.connect(filtroViento); filtroViento.connect(gViento); aire.start(); vaiven.start();

  // --- La música: pasa por un eco suave ---
  gMusicaModo = c.createGain(); gMusicaModo.gain.value = 0; gMusicaModo.connect(gMusica);
  eco = c.createDelay(1.5); eco.delayTime.value = 0.42;
  const vuelta = c.createGain(); vuelta.gain.value = 0.32;
  const fEco = c.createBiquadFilter(); fEco.type = 'lowpass'; fEco.frequency.value = 1800;
  eco.connect(fEco); fEco.connect(vuelta); vuelta.connect(eco); fEco.connect(gMusicaModo);
}

// ---------- Música del lobby ----------
// En re menor, lenta, en compás de 6/8 (el vaivén de un barco). Cuatro acordes que se repiten y una melodía
// escrita (no al azar) de dos vueltas, tocada con un sonido de cuerda pulsada sobre un colchón de notas largas.
const NOTA = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI a hercios
const ACORDES = [[38, 57, 62, 65], [34, 58, 62, 65], [41, 57, 60, 65], [36, 55, 60, 64]]; // Rem, Sib, Fa, Do (el bajo primero)
// la melodía, por compás: [tiempo dentro del compás (0 a 6 corcheas), nota, duración en corcheas]
const MELODIA = [
  [[0, 69, 3], [3, 72, 2], [5, 74, 1]], [[0, 74, 4], [4, 70, 2]], [[0, 72, 3], [3, 69, 2], [5, 65, 1]], [[0, 67, 5]],
  [[0, 69, 2], [2, 72, 1], [3, 74, 2], [5, 77, 1]], [[0, 77, 3], [3, 74, 3]], [[0, 72, 2], [2, 69, 1], [3, 72, 3]], [[0, 67, 3], [3, 64, 3]],
];
const CORCHEA = 0.46, COMPAS = CORCHEA * 6;

function notaLarga(hz, cuando, dura, nivel) { // el colchón: dos ondas apenas desafinadas, que entran y salen despacio
  for (const desafino of [-5, 6]) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz; o.detune.value = desafino;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(nivel, cuando + 0.9);
    g.gain.setValueAtTime(nivel, cuando + dura - 0.7); g.gain.linearRampToValueAtTime(0, cuando + dura + 0.5);
    o.connect(g); g.connect(gMusicaModo);
    o.start(cuando); o.stop(cuando + dura + 0.6);
  }
}
function pulsada(hz, cuando, dura, nivel) { // la melodía: como una cuerda pulsada, con brillo al principio que se apaga
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(hz * 6, cuando); f.frequency.exponentialRampToValueAtTime(hz * 1.4, cuando + 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(nivel, cuando + 0.012);
  g.gain.exponentialRampToValueAtTime(nivel * 0.25, cuando + 0.5); g.gain.exponentialRampToValueAtTime(0.0008, cuando + Math.max(0.9, dura * 1.5));
  o.connect(f); f.connect(g); g.connect(gMusicaModo); g.connect(eco);
  o.start(cuando); o.stop(cuando + Math.max(1.0, dura * 1.5) + 0.05);
}
function programarCompas(n, cuando) {
  const [bajo, ...resto] = ACORDES[n % 4];
  notaLarga(NOTA(bajo), cuando, COMPAS, 0.085);
  for (const x of resto) notaLarga(NOTA(x), cuando, COMPAS, 0.030);
  // un arpegio quedo que marca el vaivén
  [0, 2, 3, 5].forEach((c, i) => pulsada(NOTA(resto[i % resto.length]), cuando + c * CORCHEA, 1, 0.022));
  // la melodía entra después de una vuelta de acordes, y descansa una vuelta de cada tres
  const vuelta = Math.floor(n / 8);
  if (n >= 4 && vuelta % 3 !== 2) for (const [c, nota, dura] of MELODIA[n % 8]) pulsada(NOTA(nota), cuando + c * CORCHEA, dura * CORCHEA, 0.075);
}
function programarMusica(hasta) { while (proximoCompas < hasta) { programarCompas(compas++, proximoCompas); proximoCompas += COMPAS; } }
function arrancarMusica() {
  if (relojMusica) return;
  proximoCompas = ctx.currentTime + 0.15; compas = 0;
  programarMusica(ctx.currentTime + 1.5);
  relojMusica = setInterval(() => { if (ctx.state === 'running') programarMusica(ctx.currentTime + 1.5); }, 400);
}
function pararMusica() { clearInterval(relojMusica); relojMusica = null; }

// ---------- Efectos ----------
function estallido(cuando, nivel, lado, { grave = 95, cola = 0.55, brillo = 1400 } = {}) {
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const fin = ctx.createGain(); fin.gain.value = nivel;
  if (pan) { pan.pan.value = lado; fin.connect(pan); pan.connect(gSonido); } else fin.connect(gSonido);
  // el golpe grave
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(grave, cuando); o.frequency.exponentialRampToValueAtTime(grave * 0.4, cuando + cola * 0.6);
  const go = ctx.createGain(); go.gain.setValueAtTime(0.0001, cuando); go.gain.exponentialRampToValueAtTime(1, cuando + 0.006); go.gain.exponentialRampToValueAtTime(0.001, cuando + cola * 0.7);
  o.connect(go); go.connect(fin); o.start(cuando); o.stop(cuando + cola);
  // el estallido: ruido que empieza abierto y se cierra
  const r = ctx.createBufferSource(); r.buffer = bufBlanco;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(brillo, cuando); f.frequency.exponentialRampToValueAtTime(140, cuando + cola);
  const gr = ctx.createGain(); gr.gain.setValueAtTime(0.0001, cuando); gr.gain.exponentialRampToValueAtTime(0.9, cuando + 0.004); gr.gain.exponentialRampToValueAtTime(0.001, cuando + cola);
  r.connect(f); f.connect(gr); gr.connect(fin); r.start(cuando, Math.random() * 2, cola + 0.1);
}
// Un cañón naval del 1600: hierro fundido y pólvora negra. No es un "pum" seco: primero el chasquido del fogonazo,
// enseguida un estampido grave y ronco que empuja el aire, y después un trueno largo que rueda sobre el agua y vuelve en eco.
// cerca: de 0 a 1. De lejos se pierde el chasquido y queda el trueno, más largo y apagado.
// No todos suenan igual. El tamaño de la pieza va con el casco: la balandra lleva cañones chicos (más agudos, secos y cortos),
// el bergantín medianos y el galeón los más grandes (más graves, con un trueno más largo). Y la munición cambia el disparo:
// la bala redonda es el estampido de siempre; la metralla suena más abierta y rasgada, con el silbido de las bolitas saliendo
// en abanico y poco trueno; la bala pesada lleva más pólvora: el golpe más grave y fuerte de todos, y el eco que más dura.
const PIEZA = { balandra: { tono: 1.38, peso: 0.80, cola: 0.70 }, bergantin: { tono: 1.0, peso: 1.0, cola: 1.0 }, galeon: { tono: 0.76, peso: 1.15, cola: 1.30 } };
const CARGA = {
  redonda: { tono: 1.0, peso: 1.0, cola: 1.0, chasquido: 1.0, rasgado: 0, eco: 0.34 },
  metralla: { tono: 1.22, peso: 0.82, cola: 0.60, chasquido: 1.5, rasgado: 1, eco: 0.20 },
  pesada: { tono: 0.80, peso: 1.22, cola: 1.45, chasquido: 0.8, rasgado: 0, eco: 0.48 },
};
let ronco = null;
function canonazo(cuando, nivel, lado, cerca, casco, municion) {
  const pieza = PIEZA[casco] || PIEZA.bergantin, carga = CARGA[municion] || CARGA.redonda;
  if (!ronco) { // una curva que aplasta los picos: le da al estampido la aspereza de la pólvora
    ronco = new Float32Array(1024);
    for (let k = 0; k < 1024; k++) { const x = k / 511.5 - 1; ronco[k] = Math.tanh(3.2 * x); }
  }
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const fin = ctx.createGain(); fin.gain.value = nivel * pieza.peso * carga.peso;
  if (pan) { pan.pan.value = lado; fin.connect(pan); pan.connect(gSonido); } else fin.connect(gSonido);
  const cola = (1.3 + 1.1 * (1 - cerca) + Math.random() * 0.3) * pieza.cola * carga.cola;
  const tono = (0.92 + Math.random() * 0.16) * pieza.tono * carga.tono; // y dentro del mismo barco, cada cañón suena apenas distinto

  // 1. el chasquido del fogonazo: seco y agudo, solo de cerca
  if (cerca > 0.35) {
    const c = ctx.createBufferSource(); c.buffer = bufBlanco;
    const fc = ctx.createBiquadFilter(); fc.type = 'highpass'; fc.frequency.value = 1800;
    const gc = ctx.createGain(); gc.gain.setValueAtTime(0.0001, cuando); gc.gain.exponentialRampToValueAtTime(0.75 * (cerca - 0.2) * carga.chasquido, cuando + 0.002); gc.gain.exponentialRampToValueAtTime(0.001, cuando + 0.055);
    c.connect(fc); fc.connect(gc); gc.connect(fin); c.start(cuando, Math.random() * 2, 0.08);
  }
  // la metralla: las bolitas salen rasgando el aire, un silbido áspero que baja enseguida
  if (carga.rasgado && cerca > 0.2) {
    const m = ctx.createBufferSource(); m.buffer = bufBlanco; m.playbackRate.value = 1.3;
    const fm = ctx.createBiquadFilter(); fm.type = 'bandpass'; fm.Q.value = 1.1;
    fm.frequency.setValueAtTime(5200, cuando); fm.frequency.exponentialRampToValueAtTime(1500, cuando + 0.32);
    const gm = ctx.createGain(); gm.gain.setValueAtTime(0.0001, cuando + 0.004); gm.gain.exponentialRampToValueAtTime(0.55 * cerca, cuando + 0.02); gm.gain.exponentialRampToValueAtTime(0.001, cuando + 0.36);
    m.connect(fm); fm.connect(gm); gm.connect(fin); m.start(cuando, Math.random() * 2, 0.45);
  }
  // 2. el estampido: un golpe muy grave que cae, pasado por la curva ronca
  const o = ctx.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(110 * tono, cuando); o.frequency.exponentialRampToValueAtTime(34 * tono, cuando + 0.22); o.frequency.exponentialRampToValueAtTime(24 * tono, cuando + 0.8);
  const go = ctx.createGain(); go.gain.setValueAtTime(0.0001, cuando); go.gain.exponentialRampToValueAtTime(1.0, cuando + 0.008); go.gain.exponentialRampToValueAtTime(0.25, cuando + 0.28); go.gain.exponentialRampToValueAtTime(0.001, cuando + 0.95);
  const r = ctx.createBufferSource(); r.buffer = bufMarron; r.playbackRate.value = 1.6 * tono;
  const gr = ctx.createGain(); gr.gain.setValueAtTime(0.0001, cuando); gr.gain.exponentialRampToValueAtTime(1.6, cuando + 0.006); gr.gain.exponentialRampToValueAtTime(0.30, cuando + 0.30); gr.gain.exponentialRampToValueAtTime(0.001, cuando + 0.9);
  const curva = ctx.createWaveShaper(); curva.curve = ronco;
  const fb = ctx.createBiquadFilter(); fb.type = 'lowpass'; fb.frequency.setValueAtTime(900 + 1600 * cerca, cuando); fb.frequency.exponentialRampToValueAtTime(160, cuando + 0.7);
  const gb = ctx.createGain(); gb.gain.value = 0.62;
  o.connect(go); go.connect(curva); r.connect(gr); gr.connect(curva); curva.connect(fb); fb.connect(gb); gb.connect(fin);
  o.start(cuando); o.stop(cuando + 1.0); r.start(cuando, Math.random() * 3, 1.0);
  // 3. el trueno que rueda: ruido grave que se apaga despacio, con altibajos, y un eco que vuelve del agua
  const t = ctx.createBufferSource(); t.buffer = bufMarron; t.playbackRate.value = 0.75 * tono;
  const ft = ctx.createBiquadFilter(); ft.type = 'lowpass'; ft.frequency.setValueAtTime(520, cuando); ft.frequency.exponentialRampToValueAtTime(110, cuando + cola);
  const gt = ctx.createGain();
  gt.gain.setValueAtTime(0.0001, cuando + 0.03); gt.gain.exponentialRampToValueAtTime(0.85, cuando + 0.12);
  gt.gain.exponentialRampToValueAtTime(0.30, cuando + 0.12 + cola * 0.30); gt.gain.exponentialRampToValueAtTime(0.42, cuando + 0.12 + cola * 0.42); // vuelve a crecer un poco: el retumbo
  gt.gain.exponentialRampToValueAtTime(0.001, cuando + 0.12 + cola);
  t.connect(ft); ft.connect(gt); gt.connect(fin); t.start(cuando, Math.random() * 3, cola + 0.3);
  const vuelve = ctx.createDelay(1.0); vuelve.delayTime.value = 0.31 + Math.random() * 0.12;
  const gv = ctx.createGain(); gv.gain.value = carga.eco;
  const fv = ctx.createBiquadFilter(); fv.type = 'lowpass'; fv.frequency.value = 420;
  fb.connect(vuelve); vuelve.connect(fv); fv.connect(gv); gv.connect(fin);
}

// Botones: un golpe seco de madera, como apoyar una ficha sobre la mesa de cartas. Suena aunque no haya partida.
let ultimoClic = 0;
export function clic() {
  if (!ctx || ctx.state !== 'running' || ctx.currentTime - ultimoClic < 0.04) return;
  const cuando = ctx.currentTime + 0.003; ultimoClic = ctx.currentTime;
  const fin = ctx.createGain(); fin.gain.value = 0.9; fin.connect(gSonido);
  // la madera suena a dos o tres notas cortas y sordas, que se apagan enseguida
  for (const [hz, nivel, dura] of [[410, 0.9, 0.060], [760, 0.55, 0.040], [1280, 0.28, 0.025]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(hz * (0.97 + Math.random() * 0.06), cuando); o.frequency.exponentialRampToValueAtTime(hz * 0.86, cuando + dura);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(nivel, cuando + 0.0015); g.gain.exponentialRampToValueAtTime(0.0008, cuando + dura);
    o.connect(g); g.connect(fin); o.start(cuando); o.stop(cuando + dura + 0.01);
  }
  // y el toque: un soplo de ruido muy corto
  const r = ctx.createBufferSource(); r.buffer = bufBlanco;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 1.2;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(0.5, cuando + 0.001); g.gain.exponentialRampToValueAtTime(0.001, cuando + 0.014);
  r.connect(f); f.connect(g); g.connect(fin); r.start(cuando, Math.random() * 2, 0.03);
}

function chasquido(cuando, nivel, lado, hz, dura) { // golpes en la madera y salpicones
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const r = ctx.createBufferSource(); r.buffer = bufBlanco;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = 0.9;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(nivel, cuando + 0.005); g.gain.exponentialRampToValueAtTime(0.001, cuando + dura);
  r.connect(f); f.connect(g);
  if (pan) { pan.pan.value = lado; g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
  r.start(cuando, Math.random() * 2, dura + 0.05);
}

// Un evento del mar (los mismos que dibujan el humo y las astillas): 'c' cañonazo, 'g' golpe en un casco, 'h' un barco se hunde, 's' salpicón.
// oyente: dónde está el barco del jugador. Lo lejano suena más bajo, más apagado y un instante después.
// de: para un cañonazo, { casco, municion } del barco que disparó (si se sabe)
export function evento(ev, oyente, de) {
  if (!ctx || ctx.state !== 'running' || modoActual !== 'mar' || !oyente) return;
  const dx = ev.x - oyente.x, d = Math.hypot(dx, ev.y - oyente.y);
  const cerca = Math.max(0, 1 - d / 1700);
  if (cerca <= 0) return;
  const nivel = cerca * cerca, lado = Math.max(-0.8, Math.min(0.8, dx / 700)), cuando = ctx.currentTime + d / 4500 + Math.random() * 0.03;
  if (ev.k === 'c') {
    if (sonando >= 9) return;
    sonando++; setTimeout(() => { sonando--; }, 320);
    canonazo(cuando + Math.random() * 0.05, 0.62 * nivel, lado, cerca, de && de.casco, de && de.municion); // los cañones de un costado no salen todos a la vez
  } else if (ev.k === 'g') {
    chasquido(cuando, 0.5 * nivel, lado, 1500 + Math.random() * 900, 0.09);
    estallido(cuando, 0.28 * nivel, lado, { grave: 150, cola: 0.16, brillo: 900 });
  } else if (ev.k === 'h') {
    estallido(cuando, 0.9 * nivel, lado, { grave: 60, cola: 1.5, brillo: 700 });
    chasquido(cuando + 0.25, 0.35 * nivel, lado, 500, 1.2);
  } else if (ev.k === 's' && cerca > 0.45) chasquido(cuando, 0.16 * nivel, lado, 2600, 0.22);
}
// Un cañonazo de muestra, para oír el volumen al mover la barra en Ajustes
export function muestra(casco, municion, nivel = 0.7) { if (ctx && ctx.state === 'running') canonazo(ctx.currentTime + 0.02, nivel, 0, 0.9, casco, municion); }

// En qué pantalla está el jugador: 'lobby' (música y un mar lejano), 'mar' (mar y viento, sin música) o 'nada'.
// viento: de 0 a 1, cuánto sopla donde está el barco. Se puede llamar en cada cuadro: solo ajusta cada tanto.
export function ambiente(modo, viento = 0) {
  modoActual = modo; fuerzaViento = viento;
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  if (ahora - ultimoAjuste < 0.15) return;
  ultimoAjuste = ahora;
  gMar.gain.setTargetAtTime(modo === 'mar' ? 0.95 : modo === 'lobby' ? 0.30 : 0, ahora, 0.6);
  gViento.gain.setTargetAtTime(modo === 'mar' ? 0.025 + 0.15 * viento : 0, ahora, 0.7); // bajo: es un fondo (Nicolás lo pidió más bajo, 12/11/2026)
  filtroViento.frequency.setTargetAtTime(380 + 520 * viento, ahora, 0.9);
  gMusicaModo.gain.setTargetAtTime(modo === 'lobby' ? 2.8 : 0, ahora, modo === 'lobby' ? 1.2 : 0.5);
  if (modo === 'lobby') arrancarMusica(); else if (relojMusica && gMusicaModo.gain.value < 0.01) pararMusica();
}

// Arranca con el primer gesto (el navegador no deja antes). En la app de escritorio suena desde el principio.
function despertar() {
  try {
    if (!ctx) armar(new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') ctx.resume().then(() => { ultimoAjuste = 0; ambiente(modoActual, fuerzaViento); });
    else { ultimoAjuste = 0; ambiente(modoActual, fuerzaViento); }
  } catch {} // sin audio en este navegador: el juego sigue igual, mudo
}
if (typeof window !== 'undefined') {
  for (const gesto of ['pointerdown', 'keydown', 'touchstart']) addEventListener(gesto, despertar, { passive: true });
  // todo lo que se toca como un botón hace el clic de madera (también los del menú de la app de escritorio)
  addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest(BOTONES)) clic(); }, true);
  addEventListener('load', () => { try { despertar(); } catch {} }); // donde el navegador lo permita sin gesto (la app de escritorio)
  document.addEventListener('visibilitychange', () => { if (ctx) (document.hidden ? ctx.suspend() : ctx.resume()).catch(() => {}); });
}

// Para probar sin parlantes: arma todo en un contexto que no suena, toca unos segundos de cada cosa y devuelve cuánto se oyó.
export async function probar() {
  const guardado = [ctx, salida, gSonido, gMusica, gMar, gViento, filtroViento, gMusicaModo, eco, bufBlanco, bufMarron, relojMusica, modoActual, proximoCompas, compas];
  const medir = async (segundos, preparar) => {
    const c = new OfflineAudioContext(2, 44100 * segundos, 44100);
    armar(c); relojMusica = null; proximoCompas = 0; compas = 0; ultimoAjuste = -1;
    Object.defineProperty(c, 'state', { value: 'running' });
    preparar(c);
    const b = await c.startRendering();
    let pico = 0, suma = 0; const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pico) pico = v; suma += v * v; }
    return { pico: +pico.toFixed(3), medio: +Math.sqrt(suma / d.length).toFixed(4) };
  };
  const r = {};
  r.musica = await medir(12, () => { modoActual = 'lobby'; gMusicaModo.gain.value = 2.8; gMar.gain.value = 0; programarMusica(12); });
  r.mar = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0.95; gViento.gain.value = 0.05; });
  r.viento = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0; gViento.gain.value = 0.175; filtroViento.frequency.value = 900; });
  r.canon = await medir(4, () => { modoActual = 'mar'; canonazo(0.1, 0.80, 0, 0.95); });
  for (const [c, m] of [['balandra', 'redonda'], ['galeon', 'redonda'], ['bergantin', 'metralla'], ['galeon', 'pesada']]) r[c + '-' + m] = await medir(5, () => { modoActual = 'mar'; canonazo(0.1, 0.62, 0, 0.95, c, m); });
  r.canonLejos = await medir(4, () => { modoActual = 'mar'; canonazo(0.1, 0.80 * 0.25, 0, 0.5); });
  r.andanada = await medir(4, () => { modoActual = 'mar'; for (let i = 0; i < 9; i++) canonazo(0.1 + i * 0.04, 0.62, 0, 0.95); });
  r.clic = await medir(1, () => { modoActual = 'lobby'; ultimoClic = -1; clic(); });
  r.silencio = await medir(2, () => { modoActual = 'nada'; });
  [ctx, salida, gSonido, gMusica, gMar, gViento, filtroViento, gMusicaModo, eco, bufBlanco, bufMarron, relojMusica, modoActual, proximoCompas, compas] = guardado;
  ultimoAjuste = 0;
  return r;
}
