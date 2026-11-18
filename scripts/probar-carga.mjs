// Prueba de carga del servidor (16/11/2026): un mar lleno, N jugadores con su flota, repartidos por el mar (REPARTIR=1) o
// saliendo todos del puerto. Mide cuánto tarda cada paso (el presupuesto es 50 ms) y cuánto se le manda a cada jugador.
// Uso: node scripts/probar-carga.mjs [carpeta del juego] [jugadores] [barcos de flota]   (CV=0: navegador anterior, foto entera)
globalThis.WebSocketPair = class {};
const raiz = (process.argv[2] && process.argv[2] !== '.') ? process.argv[2] : new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1').replace(/\/$/, '');
const { Mar } = await import('file:///' + raiz + '/servidor/worker.js');
const { crearBarco, disenoEnemigo } = await import('file:///' + raiz + '/src/barcos.js');
const N = +process.argv[3] || 24, FLOTA = +process.argv[4] || 4;
const mar = new Mar({ storage: {} }, { MAR: null });
const civs = ['espanoles', 'britanicos', 'franceses', 'portugueses', 'holandeses', 'suecos', 'otomanos', 'japoneses'];
const socks = [];
for (let i = 0; i < N; i++) {
  const ws = { bytes: 0, n: 0, send(d) { this.bytes += d.length; this.n++; }, addEventListener() {}, close() {} };
  const c = { cap: null, entrada: {}, conocidos: new Map(), finEn: 0 };
  mar.clientes.set(ws, c);
  mar.entrar(ws, c, { t: 'entrar', cv: +(process.env.CV || 2), nombre: 'Cap' + i, diseno: { faccion: civs[i % civs.length], casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', habilidad: 'andanada' } });
  socks.push([ws, c]);
}
await new Promise((r) => setTimeout(r, 30)); // entrar espera la verificación de la sesión
clearInterval(mar.reloj);
const j = mar.j;
let semilla = 7; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
for (const [, c] of socks) {
  c.cap.escoltasMax = 6;
  if (process.env.REPARTIR) { c.cap.barco.x = 500 + azar() * 6000; c.cap.barco.y = 500 + azar() * 6000; }
  for (let k = 0; k < FLOTA; k++) {
    const b = c.cap.barco, e = crearBarco(disenoEnemigo('corsario', 1, [b.diseno.faccion]), 'escolta', b.x + 80 * k, b.y + 120, { a: 0, velas: 1 });
    e.cap = c.cap; e.ia = { estado: 'sigue' }; e.equipo = null; j.barcos.push(e);
  }
  c.entrada = { objetivo: { x: Math.random() * 7000, y: Math.random() * 7000 }, velas: 3 };
}
const tiempos = [];
let t0 = Date.now();
for (let p = 0; p < 400; p++) {
  mar.ultimo = Date.now() - 50;
  const a = performance.now(); mar.paso(); tiempos.push(performance.now() - a);
  if (p % 20 === 0) for (const [, c] of socks) if (c.cap && !c.cap.fin) c.entrada.fuegoTodo = true;
}
const ws0 = socks[0][0];
tiempos.sort((x, y) => x - y);
const med = tiempos[200], p95 = tiempos[380], max = tiempos[399];
const porMsg = ws0.bytes / ws0.n;
console.log(JSON.stringify({ jugadores: N, barcos: j.barcos.length, pasoMediana_ms: +med.toFixed(2), paso95_ms: +p95.toFixed(2), pasoMax_ms: +max.toFixed(1), presupuesto_ms: 50,
  kBporMensaje: +(porMsg / 1024).toFixed(1), kBporSegundoPorJugador: +(porMsg * 20 / 1024).toFixed(0), MBporSegundoTotal: +(porMsg * 20 * N / 1048576).toFixed(2) }));
