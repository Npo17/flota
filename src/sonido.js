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
export function evento(ev, oyente) {
  if (!ctx || ctx.state !== 'running' || modoActual !== 'mar' || !oyente) return;
  const dx = ev.x - oyente.x, d = Math.hypot(dx, ev.y - oyente.y);
  const cerca = Math.max(0, 1 - d / 1700);
  if (cerca <= 0) return;
  const nivel = cerca * cerca, lado = Math.max(-0.8, Math.min(0.8, dx / 700)), cuando = ctx.currentTime + d / 4500 + Math.random() * 0.03;
  if (ev.k === 'c') {
    if (sonando >= 9) return;
    sonando++; setTimeout(() => { sonando--; }, 260);
    estallido(cuando, 0.85 * nivel, lado, { grave: 80 + Math.random() * 30, cola: 0.45 + 0.35 * (1 - cerca), brillo: 500 + 1500 * cerca });
  } else if (ev.k === 'g') {
    chasquido(cuando, 0.5 * nivel, lado, 1500 + Math.random() * 900, 0.09);
    estallido(cuando, 0.28 * nivel, lado, { grave: 150, cola: 0.16, brillo: 900 });
  } else if (ev.k === 'h') {
    estallido(cuando, 0.9 * nivel, lado, { grave: 60, cola: 1.5, brillo: 700 });
    chasquido(cuando + 0.25, 0.35 * nivel, lado, 500, 1.2);
  } else if (ev.k === 's' && cerca > 0.45) chasquido(cuando, 0.16 * nivel, lado, 2600, 0.22);
}
// Un cañonazo de muestra, para oír el volumen al mover la barra en Ajustes
export function muestra() { if (ctx && ctx.state === 'running') estallido(ctx.currentTime + 0.02, 0.8, 0, {}); }

// En qué pantalla está el jugador: 'lobby' (música y un mar lejano), 'mar' (mar y viento, sin música) o 'nada'.
// viento: de 0 a 1, cuánto sopla donde está el barco. Se puede llamar en cada cuadro: solo ajusta cada tanto.
export function ambiente(modo, viento = 0) {
  modoActual = modo; fuerzaViento = viento;
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  if (ahora - ultimoAjuste < 0.15) return;
  ultimoAjuste = ahora;
  gMar.gain.setTargetAtTime(modo === 'mar' ? 0.95 : modo === 'lobby' ? 0.30 : 0, ahora, 0.6);
  gViento.gain.setTargetAtTime(modo === 'mar' ? 0.05 + 0.34 * viento : 0, ahora, 0.7);
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
  r.viento = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0; gViento.gain.value = 0.39; filtroViento.frequency.value = 900; });
  r.canon = await medir(2, () => { modoActual = 'mar'; estallido(0.1, 0.85, 0, {}); });
  r.andanada = await medir(2, () => { modoActual = 'mar'; for (let i = 0; i < 9; i++) estallido(0.1 + i * 0.03, 0.85, 0, {}); });
  r.silencio = await medir(2, () => { modoActual = 'nada'; });
  [ctx, salida, gSonido, gMusica, gMar, gViento, filtroViento, gMusicaModo, eco, bufBlanco, bufMarron, relojMusica, modoActual, proximoCompas, compas] = guardado;
  ultimoAjuste = 0;
  return r;
}
