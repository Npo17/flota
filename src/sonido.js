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

let gRemolino = null, giroRemolino = [], filtroRemolino = null;
let gLluvia = null; // la tormenta del Kraken: lluvia y un ventarrón grave
let ctx = null, salida = null, gSonido = null, gMusica = null, gMar = null, gViento = null, filtroViento = null, gMusicaModo = null, eco = null;
let modoActual = 'nada', fuerzaViento = 0, relojMusica = null, proximoCompas = 0, compas = 0, ultimoAjuste = 0;
const BOTONES = 'button, [role="button"], a[href], .chip, .tarjeta, .opcion, select';
let sonando = 0; // cañonazos que suenan ahora (para no apilar cien en una andanada)

export const volumen = (cual) => vol[cual];
export const estado = () => (ctx ? ctx.state : 'sin arrancar'); // para probar
export const grabaciones = () => ({ canones: grab.canones.length, gritos: grab.gritos.length, espadas: grab.espadas.length }); // para probar: cuántas cargaron
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

  // --- El remolino: agua que gira y traga. Un fondo grave que late y da vueltas de un oído al otro; cuanto más cerca
  // del centro, más fuerte, más rápido gira y más abierto suena, y aparece el gorgoteo del agua yéndose hacia abajo ---
  gRemolino = c.createGain(); gRemolino.gain.value = 0; gRemolino.connect(gSonido);
  const ronda = c.createStereoPanner ? c.createStereoPanner() : null;
  const late = c.createGain(); late.gain.value = 0.62;
  if (ronda) { late.connect(ronda); ronda.connect(gRemolino); } else late.connect(gRemolino);
  const hondo = c.createBufferSource(); hondo.buffer = bufMarron; hondo.loop = true; hondo.playbackRate.value = 0.7;
  filtroRemolino = c.createBiquadFilter(); filtroRemolino.type = 'lowpass'; filtroRemolino.frequency.value = 240; filtroRemolino.Q.value = 1.2;
  hondo.connect(filtroRemolino); filtroRemolino.connect(late); hondo.start();
  const gorgoteo = c.createBufferSource(); gorgoteo.buffer = bufBlanco; gorgoteo.loop = true; gorgoteo.playbackRate.value = 0.5;
  const fGor = c.createBiquadFilter(); fGor.type = 'bandpass'; fGor.frequency.value = 620; fGor.Q.value = 3.5;
  const gGor = c.createGain(); gGor.gain.value = 0.10;
  gorgoteo.connect(fGor); fGor.connect(gGor); gGor.connect(late); gorgoteo.start();
  // tres vaivenes a la misma velocidad: el latido, la ronda de un oído al otro (a destiempo) y el tono del gorgoteo
  giroRemolino = [];
  for (const [destino, hondura, desfase] of [[late.gain, 0.30, 0], [ronda ? ronda.pan : null, 0.55, 0.25], [fGor.frequency, 260, 0.5]]) {
    if (!destino) continue;
    const o = c.createOscillator(); o.frequency.value = 0.6;
    const g = c.createGain(); g.gain.value = hondura;
    o.connect(g); g.connect(destino); o.start(c.currentTime + desfase);
    giroRemolino.push(o);
  }

  // --- La tormenta del Kraken: lluvia (ruido agudo, parejo) y un ventarrón grave que va y viene ---
  gLluvia = c.createGain(); gLluvia.gain.value = 0; gLluvia.connect(gSonido);
  const lluvia = c.createBufferSource(); lluvia.buffer = bufBlanco; lluvia.loop = true;
  const fLl = c.createBiquadFilter(); fLl.type = 'highpass'; fLl.frequency.value = 1900;
  const fLl2 = c.createBiquadFilter(); fLl2.type = 'lowpass'; fLl2.frequency.value = 7500;
  const gLl = c.createGain(); gLl.gain.value = 0.32;
  lluvia.connect(fLl); fLl.connect(fLl2); fLl2.connect(gLl); gLl.connect(gLluvia); lluvia.start();
  const ventarron = c.createBufferSource(); ventarron.buffer = bufMarron; ventarron.loop = true; ventarron.playbackRate.value = 0.8;
  const fVen = c.createBiquadFilter(); fVen.type = 'lowpass'; fVen.frequency.value = 260;
  const gVen = c.createGain(); gVen.gain.value = 0.5;
  const vaivenVen = c.createOscillator(); vaivenVen.frequency.value = 0.09; const gVaivenVen = c.createGain(); gVaivenVen.gain.value = 0.3;
  vaivenVen.connect(gVaivenVen); gVaivenVen.connect(gVen.gain);
  ventarron.connect(fVen); fVen.connect(gVen); gVen.connect(gLluvia); ventarron.start(); vaivenVen.start();

  // --- La pelea de un abordaje: el tumulto de fondo (voces y pasos sobre la cubierta, todo junto); los golpes sueltos se le suman ---
  gPelea = c.createGain(); gPelea.gain.value = 0; gPelea.connect(gSonido);
  const tumulto = c.createBufferSource(); tumulto.buffer = bufMarron; tumulto.loop = true; tumulto.playbackRate.value = 1.9;
  const fTum = c.createBiquadFilter(); fTum.type = 'bandpass'; fTum.frequency.value = 520; fTum.Q.value = 0.9;
  const gTum = c.createGain(); gTum.gain.value = 0.22; gTumulto = gTum;
  const sube = c.createOscillator(); sube.frequency.value = 1.7; const gSube = c.createGain(); gSube.gain.value = 0.10;
  sube.connect(gSube); gSube.connect(gTum.gain);
  tumulto.connect(fTum); fTum.connect(gTum); gTum.connect(gPelea); tumulto.start(); sube.start();

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
// ---------- Avisos del mar ----------
// La brisa que agarra tu barco: un soplo que crece y la lona que se hincha de golpe (un golpe sordo de tela).
export function brisa() {
  if (!ctx || ctx.state !== 'running' || modoActual !== 'mar') return;
  const ahora = ctx.currentTime;
  const r = ctx.createBufferSource(); r.buffer = bufBlanco; r.playbackRate.value = 0.9;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1;
  f.frequency.setValueAtTime(350, ahora); f.frequency.exponentialRampToValueAtTime(1500, ahora + 0.55); f.frequency.exponentialRampToValueAtTime(700, ahora + 1.3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ahora); g.gain.exponentialRampToValueAtTime(0.34, ahora + 0.5); g.gain.exponentialRampToValueAtTime(0.001, ahora + 1.4);
  r.connect(f); f.connect(g); g.connect(gSonido); r.start(ahora, Math.random() * 1.5, 1.5);
  // la vela que se hincha
  const t = ctx.createBufferSource(); t.buffer = bufMarron; t.playbackRate.value = 2.2;
  const ft = ctx.createBiquadFilter(); ft.type = 'lowpass'; ft.frequency.value = 520;
  const gt = ctx.createGain(); gt.gain.setValueAtTime(0.0001, ahora + 0.42); gt.gain.exponentialRampToValueAtTime(0.9, ahora + 0.46); gt.gain.exponentialRampToValueAtTime(0.001, ahora + 0.75);
  t.connect(ft); ft.connect(gt); gt.connect(gSonido); t.start(ahora + 0.4, Math.random() * 2, 0.5);
}
function campana(cuando, nivel, base) { // la campana de a bordo: una nota clara con sus armónicos de bronce, que queda sonando
  const fin = ctx.createGain(); fin.gain.value = nivel; fin.connect(gSonido);
  for (const [mult, peso, dura] of [[1, 1, 1.9], [2.0, 0.55, 1.4], [2.76, 0.38, 1.0], [4.07, 0.22, 0.7], [5.4, 0.12, 0.45]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * mult;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(peso, cuando + 0.004); g.gain.exponentialRampToValueAtTime(0.0006, cuando + dura);
    o.connect(g); g.connect(fin); o.start(cuando); o.stop(cuando + dura + 0.05);
  }
}
// Sale el galeón del tesoro: la campana de a bordo, dos toques dobles, como cuando el vigía canta una vela.
export function tesoro() {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime + 0.05;
  for (const [cuando, nivel] of [[0, 0.30], [0.22, 0.26], [0.75, 0.30], [0.97, 0.26]]) campana(ahora + cuando, nivel, 880);
}
// El viento cambia de rumbo: una ráfaga larga que barre de un oído al otro y un toque grave de campana.
export function vientoCambio() {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const r = ctx.createBufferSource(); r.buffer = bufBlanco; r.playbackRate.value = 0.8;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(300, ahora); f.frequency.exponentialRampToValueAtTime(1300, ahora + 1.1); f.frequency.exponentialRampToValueAtTime(380, ahora + 2.6);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ahora); g.gain.exponentialRampToValueAtTime(0.5, ahora + 0.9); g.gain.exponentialRampToValueAtTime(0.001, ahora + 2.8);
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  r.connect(f); f.connect(g);
  if (pan) { pan.pan.setValueAtTime(-0.8, ahora); pan.pan.linearRampToValueAtTime(0.8, ahora + 2.6); g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
  r.start(ahora, Math.random() * 0.5, 2.9);
  campana(ahora + 0.15, 0.22, 440);
}

// ---------- Abordaje ----------
// Tres momentos: la soga que sale (un silbido de aire y el cabo desenrollándose), el gancho que muerde la borda (golpe de madera
// y hierro) y la pelea entre las dos tripulaciones mientras dure: choques de sables, golpes en la madera, gritos y el tumulto de fondo.
let faseAbordaje = 'nada', relojPelea = null, gPelea = null, gTumulto = null, fuenteGritos = null, gGritos = null;
function espada(cuando, nivel, lado, velocidad) { // un choque de espadas grabado
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const f = ctx.createBufferSource(); f.buffer = alAzar(grab.espadas); f.playbackRate.value = velocidad || 0.85 + Math.random() * 0.4;
  const g = ctx.createGain(); g.gain.value = nivel;
  f.connect(g);
  if (pan) { pan.pan.value = lado; g.connect(pan); pan.connect(gPelea); } else g.connect(gPelea);
  f.start(cuando);
}
function metal(cuando, nivel, lado, base, dura) { // hierro contra hierro: varias notas agudas que no afinan entre sí y se apagan rápido
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const fin = ctx.createGain(); fin.gain.value = nivel;
  if (pan) { pan.pan.value = lado; fin.connect(pan); pan.connect(gPelea || gSonido); } else fin.connect(gPelea || gSonido);
  for (const [mult, peso] of [[1, 1], [1.47, 0.7], [2.09, 0.5], [2.83, 0.35], [3.91, 0.2]]) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = base * mult * (0.985 + Math.random() * 0.03);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(peso, cuando + 0.002); g.gain.exponentialRampToValueAtTime(0.0008, cuando + dura * (0.5 + 0.5 / mult));
    o.connect(g); g.connect(fin); o.start(cuando); o.stop(cuando + dura + 0.02);
  }
  const r = ctx.createBufferSource(); r.buffer = bufBlanco; // el raspón del filo
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(0.5, cuando + 0.002); g.gain.exponentialRampToValueAtTime(0.001, cuando + 0.05);
  r.connect(f); f.connect(g); g.connect(fin); r.start(cuando, Math.random() * 2, 0.07);
}
function grito(cuando, nivel, lado) { // una voz de hombre, corta: un tono grave que sube o baja, pasado por dos resonancias como una vocal
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const fin = ctx.createGain(); fin.gain.value = nivel;
  if (pan) { pan.pan.value = lado; fin.connect(pan); pan.connect(gPelea); } else fin.connect(gPelea);
  const dura = 0.18 + Math.random() * 0.22, tono = 105 + Math.random() * 70;
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(tono, cuando); o.frequency.linearRampToValueAtTime(tono * (Math.random() < 0.5 ? 1.35 : 0.75), cuando + dura);
  const aspero = ctx.createBufferSource(); aspero.buffer = bufBlanco;
  const ga = ctx.createGain(); ga.gain.value = 0.25;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(1, cuando + 0.03); g.gain.exponentialRampToValueAtTime(0.001, cuando + dura);
  const vocal = [[700, 1150], [550, 900], [450, 1500]][Math.floor(Math.random() * 3)];
  aspero.connect(ga);
  for (const hz of vocal) {
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = 6;
    o.connect(f); ga.connect(f); f.connect(g);
  }
  g.connect(fin); o.start(cuando); o.stop(cuando + dura + 0.02); aspero.start(cuando, Math.random() * 2, dura + 0.02);
}
function golpeSordo(cuando, nivel, lado) { // un golpe en la cubierta
  const viejo = gSonido; gSonido = gPelea;
  estallido(cuando, nivel, lado, { grave: 120 + Math.random() * 60, cola: 0.14, brillo: 700 });
  gSonido = viejo;
}
function programarPelea() { // cada rato corto, uno o dos sonidos de la pelea, al azar y repartidos a los costados
  if (!ctx || ctx.state !== 'running' || faseAbordaje !== 'pelea') return;
  const ahora = ctx.currentTime, lado = () => Math.random() * 1.2 - 0.6;
  const q = Math.random();
  if (grab.espadas.length) { // con grabaciones: espadas de verdad, a ritmo desparejo (los gritos van aparte, de fondo)
    if (q < 0.42) {
      espada(ahora + 0.01, 0.30 + Math.random() * 0.30, lado());
      if (Math.random() < 0.35) espada(ahora + 0.12 + Math.random() * 0.12, 0.25 + Math.random() * 0.2, lado());
    } else if (q < 0.55) golpeSordo(ahora + 0.01, 0.22, lado());
    return;
  }
  if (q < 0.55) { // sables
    metal(ahora + 0.01, 0.20 + Math.random() * 0.14, lado(), 1500 + Math.random() * 1500, 0.14 + Math.random() * 0.16);
    if (Math.random() < 0.4) metal(ahora + 0.09 + Math.random() * 0.08, 0.16, lado(), 1700 + Math.random() * 1500, 0.12);
  } else if (q < 0.80) grito(ahora + 0.01, 0.20 + Math.random() * 0.12, lado());
  else golpeSordo(ahora + 0.01, 0.22, lado());
}
// fase: 'nada', 'vuelo' (el gancho en el aire) o 'pelea' (enganchado, o te están abordando). Se llama en cada cuadro.
export function abordaje(fase) {
  if (fase === faseAbordaje) return;
  const antes = faseAbordaje; faseAbordaje = fase;
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  if (fase === 'vuelo') { // la soga sale: el aire que corta y el cabo que se desenrolla (un zumbido que tiembla)
    const r = ctx.createBufferSource(); r.buffer = bufBlanco;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2;
    f.frequency.setValueAtTime(500, ahora); f.frequency.exponentialRampToValueAtTime(2400, ahora + 0.16); f.frequency.exponentialRampToValueAtTime(800, ahora + 0.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ahora); g.gain.exponentialRampToValueAtTime(0.55, ahora + 0.06); g.gain.exponentialRampToValueAtTime(0.001, ahora + 0.55);
    const tiembla = ctx.createOscillator(); tiembla.frequency.value = 34; const gt = ctx.createGain(); gt.gain.value = 0.22;
    tiembla.connect(gt); gt.connect(g.gain);
    r.connect(f); f.connect(g); g.connect(gSonido); r.start(ahora, Math.random() * 2, 0.6); tiembla.start(ahora); tiembla.stop(ahora + 0.6);
  }
  if (fase === 'pelea') {
    if (antes === 'vuelo') { // el gancho muerde la borda
      estallido(ahora + 0.005, 0.55, 0, { grave: 170, cola: 0.16, brillo: 1100 });
      if (grab.espadas.length) espada(ahora + 0.012, 0.45, 0, 0.6); else metal(ahora + 0.012, 0.30, 0, 900, 0.22);
    }
    if (grab.gritos.length && !fuenteGritos) { // los gritos de las dos tripulaciones, grabados, de fondo y en bucle mientras dure la pelea
      fuenteGritos = ctx.createBufferSource(); fuenteGritos.buffer = grab.gritos[0]; fuenteGritos.loop = true;
      gGritos = ctx.createGain(); gGritos.gain.setValueAtTime(0, ahora); gGritos.gain.linearRampToValueAtTime(0.85, ahora + 0.5);
      fuenteGritos.connect(gGritos); gGritos.connect(gPelea);
      fuenteGritos.start(ahora, Math.random() * Math.max(0, grab.gritos[0].duration - 1));
      if (gTumulto) gTumulto.gain.setTargetAtTime(0, ahora, 0.2); // el tumulto armado a mano no hace falta
    }
    gPelea.gain.setTargetAtTime(1, ahora, 0.25);
    clearInterval(relojPelea); relojPelea = setInterval(programarPelea, 170);
  } else {
    gPelea.gain.setTargetAtTime(0, ahora, 0.3);
    clearInterval(relojPelea); relojPelea = null;
    if (fuenteGritos) { const f = fuenteGritos; fuenteGritos = null; gGritos.gain.setTargetAtTime(0, ahora, 0.35); try { f.stop(ahora + 1.8); } catch {} }
    if (antes === 'vuelo' && fase === 'nada') chasquido(ahora + 0.02, 0.22, 0, 2400, 0.25); // erró: el gancho cae al agua
  }
}

// Las grabaciones (ver sonido/LEEME.md): cañonazos, gritos de combate y choques de espadas, todos de verdad.
// Se bajan una sola vez, cuando arranca el sonido. Lo que no llegue a cargar se reemplaza por el sonido armado a mano.
const GRABACIONES = { canones: ['canon-1.mp3', 'canon-2.mp3'], gritos: ['pelea-gritos.mp3'], espadas: ['espada-1.mp3', 'espada-2.mp3'] };
const grab = { canones: [], gritos: [], espadas: [] };
let pidiendoGrabaciones = false;
const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];
function cargarGrabaciones() {
  if (pidiendoGrabaciones || !ctx || typeof fetch === 'undefined') return;
  pidiendoGrabaciones = true;
  for (const [grupo, archivos] of Object.entries(GRABACIONES)) for (const archivo of archivos) {
    fetch(new URL('../sonido/' + archivo, import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((datos) => ctx.decodeAudioData(datos)).then((b) => { grab[grupo].push(b); }).catch(() => {});
  }
}
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
    const gc = ctx.createGain(); gc.gain.setValueAtTime(0.0001, cuando); gc.gain.exponentialRampToValueAtTime(0.75 * (cerca - 0.2) * carga.chasquido * (grab.canones.length ? 0.3 : 1), cuando + 0.002); // la grabación ya trae su chasquido gc.gain.exponentialRampToValueAtTime(0.001, cuando + 0.055);
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
  // Con la grabación de un cañón de verdad cargada (sonido/canon.mp3), el estampido es esa grabación: más lenta y grave en las
  // piezas grandes, más rápida en las chicas; apagada por la distancia; y con su eco. El chasquido y el silbido de la metralla
  // de arriba se le suman, porque la grabación es puro grave. Si no cargó (sin red, navegador viejo), sigue el estampido armado a mano.
  const bufCanon = grab.canones.length ? alAzar(grab.canones) : null; // hay dos disparos grabados: no suena siempre el mismo
  if (bufCanon) {
    const g = ctx.createBufferSource(); g.buffer = bufCanon; g.playbackRate.value = Math.pow(tono, 0.65);
    const fg = ctx.createBiquadFilter(); fg.type = 'lowpass'; fg.frequency.value = 500 + 9000 * cerca * cerca;
    const gg = ctx.createGain(); gg.gain.value = 1.15;
    g.connect(fg); fg.connect(gg); gg.connect(fin); g.start(cuando);
    const vuelve = ctx.createDelay(1.0); vuelve.delayTime.value = 0.33 + Math.random() * 0.12;
    const fv = ctx.createBiquadFilter(); fv.type = 'lowpass'; fv.frequency.value = 380;
    const gv = ctx.createGain(); gv.gain.value = carga.eco * (1.1 - 0.4 * cerca);
    fg.connect(vuelve); vuelve.connect(fv); fv.connect(gv); gv.connect(fin);
    return;
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

// Un evento del mar (los mismos que dibujan el humo y las astillas): 'c' cañonazo, 'g' golpe en un casco, 'h' un barco se hunde, 's' salpicón, 'm' mosquete.
// oyente: dónde está el barco del jugador. Lo lejano suena más bajo, más apagado y un instante después.
// de: para un cañonazo, { casco, municion } del barco que disparó (si se sabe)
export function evento(ev, oyente, de) {
  if (!ctx || ctx.state !== 'running' || modoActual !== 'mar' || !oyente) return;
  if (ev.k && ev.k[0] === 'k' && ev.k.length === 2) return eventoKraken(ev, oyente);
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
  else if (ev.k === 'm' && cerca > 0.5) chasquido(cuando, 0.3 * nivel, lado, 3200, 0.06); // tiro de mosquete contra un tritón: un chasquido seco
  else if (ev.k === 'mo') { campana(cuando, 0.26, 392); campana(cuando + 0.2, 0.22, 370); campana(cuando + 0.45, 0.2, 262); } // la moneda maldita: tres toques que desafinan
}
// Un cañonazo de muestra, para oír el volumen al mover la barra en Ajustes
export function muestra(casco, municion, nivel = 0.7) { if (ctx && ctx.state === 'running') canonazo(ctx.currentTime + 0.02, nivel, 0, 0.9, casco, municion); }

// En qué pantalla está el jugador: 'lobby' (música y un mar lejano), 'mar' (mar y viento, sin música) o 'nada'.
// viento: de 0 a 1, cuánto sopla donde está el barco. remolino: de 0 a 1, cuán adentro de un remolino está (0 = lejos, 1 = en el centro).
// Se puede llamar en cada cuadro: solo ajusta cada tanto.
let cercaRemolino = 0;
export function ambiente(modo, viento = 0, remolino = 0, tormenta = 0) {
  modoActual = modo; fuerzaViento = viento; cercaRemolino = remolino;
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  if (ahora - ultimoAjuste < 0.15) return;
  ultimoAjuste = ahora;
  gMar.gain.setTargetAtTime(modo === 'mar' ? 0.95 : modo === 'lobby' ? 0.30 : 0, ahora, 0.6);
  gViento.gain.setTargetAtTime(modo === 'mar' ? 0.025 + 0.15 * viento : 0, ahora, 0.7); // bajo: es un fondo (Nicolás lo pidió más bajo, 12/11/2026)
  filtroViento.frequency.setTargetAtTime(380 + 520 * viento, ahora, 0.9);
  // el remolino: de lejos apenas un rumor (para que avise sin molestar); adentro crece rápido
  const r = modo === 'mar' ? remolino : 0;
  gRemolino.gain.setTargetAtTime(0.12 * r + 1.6 * r * r * r, ahora, 0.35);
  filtroRemolino.frequency.setTargetAtTime(200 + 620 * r * r, ahora, 0.4);
  for (const o of giroRemolino) o.frequency.setTargetAtTime(0.55 + 2.6 * r * r, ahora, 0.5);
  gLluvia.gain.setTargetAtTime(modo === 'mar' ? 0.75 * tormenta : 0, ahora, 0.8);
  gMusicaModo.gain.setTargetAtTime(modo === 'lobby' ? 2.8 : 0, ahora, modo === 'lobby' ? 1.2 : 0.5);
  if (modo === 'lobby') arrancarMusica(); else if (relojMusica && gMusicaModo.gain.value < 0.01) pararMusica();
}

// Arranca con el primer gesto (el navegador no deja antes). En la app de escritorio suena desde el principio.
function despertar() {
  try {
    if (!ctx) armar(new (window.AudioContext || window.webkitAudioContext)());
    cargarGrabaciones();
    if (ctx.state === 'suspended') ctx.resume().then(() => { ultimoAjuste = 0; ambiente(modoActual, fuerzaViento, cercaRemolino); });
    else { ultimoAjuste = 0; ambiente(modoActual, fuerzaViento, cercaRemolino); }
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
  const guardado = [gLluvia, gTumulto, gPelea, gRemolino, giroRemolino, filtroRemolino, ctx, salida, gSonido, gMusica, gMar, gViento, filtroViento, gMusicaModo, eco, bufBlanco, bufMarron, relojMusica, modoActual, proximoCompas, compas];
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
  for (const [nombre, f] of [['remolinoLejos', 0.3], ['remolinoBorde', 0.6], ['remolinoCentro', 1]]) r[nombre] = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0; gRemolino.gain.value = 0.12 * f + 1.6 * f * f * f; filtroRemolino.frequency.value = 200 + 620 * f * f; for (const o of giroRemolino) o.frequency.value = 0.55 + 2.6 * f * f; });
  r.gancho = await medir(1, () => { modoActual = 'mar'; estallido(0.05, 0.55, 0, { grave: 170, cola: 0.16, brillo: 1100 }); metal(0.06, 0.30, 0, 900, 0.22); });
  r.pelea = await medir(3, () => { modoActual = 'mar'; gPelea.gain.value = 1; if (grab.gritos.length) { gTumulto.gain.value = 0; const f = ctx.createBufferSource(); f.buffer = grab.gritos[0]; const g = ctx.createGain(); g.gain.value = 0.85; f.connect(g); g.connect(gPelea); f.start(0, 2); } for (let i = 0; i < 12; i++) { if (grab.espadas.length) { if (i % 2 === 0) espada(0.1 + i * 0.22, 0.45, 0); } else { metal(0.1 + i * 0.22, 0.27, 0, 1500 + i * 110, 0.2); if (i % 3 === 0) grito(0.2 + i * 0.22, 0.26, 0); } } });
  r.campana = await medir(2, () => { modoActual = 'mar'; campana(0.05, 0.30, 880); });
  r.clic = await medir(1, () => { modoActual = 'lobby'; ultimoClic = -1; clic(); });
  r.silencio = await medir(2, () => { modoActual = 'nada'; });
  // el Kraken: despierta (sin el trueno de después, que va con un reloj), golpe cerca, le pegan, muere, y la tormenta
  r.krakenDespierta = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0; estallido(0.05, 0.7, 0, { grave: 40, cola: 2.4, brillo: 500 }); burbujas(0.05, 0.12, 0, 26, 2.2); rugido(1.2, 0.95, 0, { dura: 3.2, grave: 46, cae: 0.62 }); });
  r.krakenGolpe = await medir(3, () => { modoActual = 'mar'; gMar.gain.value = 0; eventoKraken({ k: 'kg', x: 0, y: 0 }, { x: 0, y: 0 }); });
  r.krakenZona = await medir(2, () => { modoActual = 'mar'; gMar.gain.value = 0; eventoKraken({ k: 'kz', x: 0, y: 0 }, { x: 0, y: 0 }); });
  r.krakenHerido = await medir(1, () => { modoActual = 'mar'; gMar.gain.value = 0; ultimoChillido = -9; eventoKraken({ k: 'kh', x: 0, y: 0 }, { x: 0, y: 0 }); });
  r.krakenMuere = await medir(6, () => { modoActual = 'mar'; gMar.gain.value = 0; eventoKraken({ k: 'km', x: 0, y: 0 }, { x: 0, y: 0 }); });
  r.trueno = await medir(4, () => { modoActual = 'mar'; gMar.gain.value = 0; trueno(); });
  r.lluvia = await medir(4, () => { modoActual = 'mar'; gMar.gain.value = 0; gLluvia.gain.value = 0.75; });
  ultimoChillido = 0;
  [gLluvia, gTumulto, gPelea, gRemolino, giroRemolino, filtroRemolino, ctx, salida, gSonido, gMusica, gMar, gViento, filtroViento, gMusicaModo, eco, bufBlanco, bufMarron, relojMusica, modoActual, proximoCompas, compas] = guardado;
  ultimoAjuste = 0;
  return r;
}

// ---------- El Kraken ----------
// Todo generado, como el resto: un rugido es una onda grave y áspera (diente de sierra) que tiembla, pasada por dos resonancias
// como una garganta enorme, más ruido grave de agua revuelta. Lo importante del Kraken se oye aunque esté lejos (más bajo).
function rugido(cuando, nivel, lado, { dura = 2.2, grave = 52, cae = 0.7, aspero = 1 } = {}) {
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const fin = ctx.createGain(); fin.gain.value = nivel;
  if (pan) { pan.pan.value = lado; fin.connect(pan); pan.connect(gSonido); } else fin.connect(gSonido);
  const env = ctx.createGain(); env.connect(fin);
  env.gain.setValueAtTime(0.0001, cuando); env.gain.exponentialRampToValueAtTime(1, cuando + dura * 0.18); env.gain.setTargetAtTime(0.0001, cuando + dura * 0.55, dura * 0.18);
  for (const [mult, peso] of [[1, 0.55], [1.5, 0.25], [2.02, 0.18]]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(grave * mult * 1.1, cuando); o.frequency.exponentialRampToValueAtTime(grave * mult * cae, cuando + dura);
    const tiembla = ctx.createOscillator(); tiembla.frequency.value = 7 + Math.random() * 4; const gT = ctx.createGain(); gT.gain.value = grave * mult * 0.06 * aspero;
    tiembla.connect(gT); gT.connect(o.frequency);
    const g = ctx.createGain(); g.gain.value = peso;
    o.connect(g);
    for (const [hz, q] of [[260, 2.2], [620, 3.5]]) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = q; g.connect(f); f.connect(env); }
    o.start(cuando); o.stop(cuando + dura + 0.2); tiembla.start(cuando); tiembla.stop(cuando + dura + 0.2);
  }
  const agua = ctx.createBufferSource(); agua.buffer = bufMarron; agua.playbackRate.value = 0.6;
  const fa = ctx.createBiquadFilter(); fa.type = 'lowpass'; fa.frequency.value = 340;
  const ga = ctx.createGain(); ga.gain.value = 0.9; agua.connect(fa); fa.connect(ga); ga.connect(env);
  agua.start(cuando, Math.random() * 2, dura + 0.2);
}
// El trueno de la tormenta: un chasquido seco y después el retumbo largo que rueda
export function trueno() {
  if (!ctx || ctx.state !== 'running' || modoActual !== 'mar') return;
  const ahora = ctx.currentTime + 0.05 + Math.random() * 0.4, lado = Math.random() * 1.2 - 0.6;
  chasquido(ahora, 0.35, lado, 3200, 0.18);
  const r = ctx.createBufferSource(); r.buffer = bufMarron; r.playbackRate.value = 0.5;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, ahora); f.frequency.exponentialRampToValueAtTime(120, ahora + 3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ahora); g.gain.exponentialRampToValueAtTime(1.3, ahora + 0.08); g.gain.exponentialRampToValueAtTime(0.5, ahora + 0.9); g.gain.exponentialRampToValueAtTime(0.001, ahora + 3.4);
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  r.connect(f); f.connect(g);
  if (pan) { pan.pan.value = lado; g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
  r.start(ahora, Math.random() * 2, 3.5);
}
// Burbujas: golpecitos de agua que suben de tono (al marcar una zona, al hundirse)
function burbujas(cuando, nivel, lado, cuantas, dura) {
  for (let i = 0; i < cuantas; i++) {
    const c = cuando + Math.random() * dura, hz = 160 + Math.random() * 260;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(hz, c); o.frequency.exponentialRampToValueAtTime(hz * 2.4, c + 0.07);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, c); g.gain.exponentialRampToValueAtTime(nivel * (0.5 + Math.random() * 0.5), c + 0.01); g.gain.exponentialRampToValueAtTime(0.001, c + 0.09);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.connect(g);
    if (pan) { pan.pan.value = lado + (Math.random() - 0.5) * 0.4; g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
    o.start(c); o.stop(c + 0.12);
  }
}
// Un latigazo: el aire que corta el tentáculo al caer
function latigazo(cuando, nivel, lado) {
  const r = ctx.createBufferSource(); r.buffer = bufBlanco;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(900, cuando); f.frequency.exponentialRampToValueAtTime(4200, cuando + 0.1); f.frequency.exponentialRampToValueAtTime(700, cuando + 0.22);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(nivel, cuando + 0.08); g.gain.exponentialRampToValueAtTime(0.001, cuando + 0.24);
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  r.connect(f); f.connect(g);
  if (pan) { pan.pan.value = lado; g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
  r.start(cuando, Math.random() * 2, 0.3);
}
// El chillido cuando le pegan: corto y agudo, que sube y baja
function chillido(cuando, nivel, lado) {
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  const base = 520 + Math.random() * 160;
  o.frequency.setValueAtTime(base, cuando); o.frequency.exponentialRampToValueAtTime(base * 2, cuando + 0.12); o.frequency.exponentialRampToValueAtTime(base * 0.7, cuando + 0.38);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 3;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(nivel, cuando + 0.04); g.gain.exponentialRampToValueAtTime(0.001, cuando + 0.42);
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  o.connect(f); f.connect(g);
  if (pan) { pan.pan.value = lado; g.connect(pan); pan.connect(gSonido); } else g.connect(gSonido);
  o.start(cuando); o.stop(cuando + 0.45);
}
let ultimoChillido = 0;
// kd despierta, kz marca una zona, kg golpe de tentáculo, kh le pegaron, km muere, ks vuelve a lo profundo
function eventoKraken(ev, oyente) {
  const dx = ev.x - oyente.x, d = Math.hypot(dx, ev.y - oyente.y);
  const cerca = Math.max(0, 1 - d / 2600), lado = Math.max(-0.8, Math.min(0.8, dx / 900)), ahora = ctx.currentTime + 0.02;
  if (ev.k === 'kd') { // despierta: se oye en todo el mar, más fuerte si está cerca
    const n = 0.45 + 0.55 * cerca;
    estallido(ahora, 0.7 * n, lado, { grave: 40, cola: 2.4, brillo: 500 });
    burbujas(ahora, 0.12 * n, lado, 26, 2.2);
    rugido(ahora + 1.2, 0.95 * n, lado, { dura: 3.2, grave: 46, cae: 0.62 });
    setTimeout(trueno, 900);
  } else if (ev.k === 'km') { // muere: un rugido largo que se apaga y el agua que se lo traga
    const n = 0.45 + 0.55 * cerca;
    rugido(ahora, 1.0 * n, lado, { dura: 4.2, grave: 60, cae: 0.38, aspero: 1.6 });
    burbujas(ahora + 1.5, 0.16 * n, lado, 60, 3.2);
    estallido(ahora + 2.6, 0.6 * n, lado, { grave: 38, cola: 2.2, brillo: 420 });
  } else if (ev.k === 'ks') { // se va: un gemido grave y las burbujas
    rugido(ahora, 0.6 * (0.3 + 0.7 * cerca), lado, { dura: 2.6, grave: 44, cae: 0.55 });
    burbujas(ahora + 0.6, 0.1 * cerca, lado, 30, 2);
  } else if (cerca <= 0) return;
  else if (ev.k === 'kz') { // marca una zona: un gruñido corto y el agua que empieza a hervir donde va a golpear
    rugido(ahora, 0.38 * cerca, lado, { dura: 0.9, grave: 70, cae: 0.85 });
    burbujas(ahora + 0.1, 0.14 * cerca, lado, 14, 1.1);
  } else if (ev.k === 'kg') { // el golpe: latigazo, impacto sordo, madera que cruje, salpicón y un gruñido
    const n = cerca * cerca;
    latigazo(ahora, 0.5 * n, lado);
    estallido(ahora + 0.1, 1.0 * n, lado, { grave: 48, cola: 1.1, brillo: 650 });
    chasquido(ahora + 0.12, 0.6 * n, lado, 520, 0.5);
    chasquido(ahora + 0.18, 0.35 * n, lado, 1800, 0.12);
    chasquido(ahora + 0.15, 0.3 * n, lado, 2600, 0.6);
    rugido(ahora + 0.25, 0.4 * n, lado, { dura: 1.0, grave: 64, cae: 0.75 });
  } else if (ev.k === 'kh') { // le pegaron: un chillido corto (no más de uno cada tanto, una andanada son muchas balas)
    if (ctx.currentTime - ultimoChillido < 0.6) return;
    ultimoChillido = ctx.currentTime;
    chillido(ahora, 0.16 * cerca, lado);
  }
}
