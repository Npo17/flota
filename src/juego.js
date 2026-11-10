// Simulación del mar: barcos, balas, bots, abordajes, remolinos y tritones.
// Maneja varios capitanes a la vez. El modo solo es el caso de un único capitán; en línea, esta misma
// simulación corre en el servidor. No toca pantalla ni teclado: recibe entradas y avanza un paso.
import { ENEMIGOS, ESCOLTAS_INICIALES } from './config.js';
import { crearBarco, disenoEnemigo } from './barcos.js';
import { nivelZona } from './mundo.js';
import { azar } from './rng.js';

const TAU = Math.PI * 2;
const VERDE = '#1f7a3f';

export function difAng(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// ---------- Armado ----------
// opciones.servidor: en vez de crear partículas, junta "eventos" para mandarles a los jugadores.
export function crearMar(mundo, opciones = {}) {
  const j = {
    mundo,
    t: 0,
    barcos: [],
    capitanes: [],
    balas: [],
    pendientes: [], // cañonazos escalonados de una andanada
    particulas: [],
    cofres: [],
    tritones: [],
    textos: [],
    eventos: opciones.servidor ? [] : null,
    enemigosVivos: opciones.enemigos ?? 18,
    proxConvoy: azar.rango(70, 100) * (mundo.reglas.convoy || 1),
    proxCofre: 1,
    yo: null,
  };
  for (let i = 0; i < j.enemigosVivos; i++) spawnEnemigo(j, true);
  return j;
}

export function agregarCapitan(j, { id, nombre, diseno, oro = 0 }) {
  const p = j.mundo.puerto;
  const n = j.capitanes.length;
  // cada uno sale de un punto distinto del puerto
  const ang = Math.PI / 2 + (n % 7 - 3) * 0.42, d = 60 + (Math.floor(n / 7) % 3) * 55;
  const barco = crearBarco(diseno, 'jugador', p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, { a: ang, velas: 0, bandera: VERDE, nombre: nombre || 'Tu barco' });
  const cap = {
    id, nombre: nombre || 'Capitán', barco,
    oroBodega: 0, oroPuerto: oro, escoltasMax: ESCOLTAS_INICIALES,
    stats: { hundidos: 0, capturados: 0, eliminados: 0, saqueado: 0, tiempo: 0 },
    proxTritones: azar.rango(25, 45), cdAbordaje: 0, gancho: null, ordenFlota: 'formacion',
    avisos: [], sacudon: 0, fin: false, finEn: 0,
  };
  barco.cap = cap;
  j.capitanes.push(cap);
  j.barcos.push(barco);
  return cap;
}

// Un capitán se va (se desconectó): desaparecen sus barcos y su oro en bodega queda flotando
export function quitarCapitan(j, cap) {
  if (cap.oroBodega > 0 && !cap.barco.hundiendo) soltarOro(j, cap.barco.x, cap.barco.y, cap.oroBodega, 40);
  j.barcos = j.barcos.filter((b) => b.cap !== cap);
  j.capitanes = j.capitanes.filter((c) => c !== cap);
  for (const c of j.capitanes) if (c.gancho && c.gancho.obj && c.gancho.obj.cap === cap) c.gancho = null;
}

// Modo solo: un mar con un único capitán. El objeto expone los datos del capitán directamente
// (partida.jugador, partida.oroBodega…) para las pantallas.
export function crearPartida(mundo, diseno, oroInicial) {
  const j = crearMar(mundo);
  j.yo = agregarCapitan(j, { id: 'yo', nombre: 'Tu barco', diseno, oro: oroInicial });
  Object.defineProperty(j, 'jugador', { get: () => j.yo.barco, enumerable: true });
  for (const k of ['oroBodega', 'oroPuerto', 'escoltasMax', 'stats', 'cdAbordaje', 'gancho', 'ordenFlota', 'avisos', 'sacudon', 'fin', 'finEn']) {
    Object.defineProperty(j, k, { get: () => j.yo[k], set: (v) => { j.yo[k] = v; }, enumerable: true });
  }
  return j;
}

// Aviso para un capitán, o para todos si se pasa el mar entero
// El texto va en español y puede llevar huecos {así}; los datos van aparte en p. La pantalla lo traduce.
export function aviso(quien, texto, tipo = 'info', p) {
  if (quien.capitanes) { for (const c of quien.capitanes) aviso(c, texto, tipo, p); return; }
  quien.avisos.push({ texto, tipo, p, t: 3.2 });
  if (quien.avisos.length > 4) quien.avisos.shift();
}

export function equipoDe(b) {
  return b.cap ? b.cap.id : 'enemigo';
}

const esInsignia = (b) => !!b.cap && b.cap.barco === b;
const enPuerto = (j, b) => Math.hypot(b.x - j.mundo.puerto.x, b.y - j.mundo.puerto.y) < j.mundo.puerto.radio;

function lejosDeCapitanes(j, x, y, d) {
  return j.capitanes.every((c) => c.fin || Math.hypot(x - c.barco.x, y - c.barco.y) >= d);
}

// ---------- Efectos (humo, astillas, textos) ----------
// En el servidor se guardan como eventos; en el navegador se convierten en partículas.
function emitir(j, ev) {
  if (j.eventos) j.eventos.push(ev);
  else efecto(j, ev);
}

export function efecto(j, ev) {
  const P = j.particulas;
  if (ev.k === 'c') { // cañonazo: humo y fogonazo en la boca del cañón
    for (let k = 0; k < 4; k++) {
      P.push({ tipo: 'humo', x: ev.x + ev.nx * 6, y: ev.y + ev.ny * 6, vx: ev.nx * azar.rango(20, 60) + azar.rango(-10, 10), vy: ev.ny * azar.rango(20, 60) + azar.rango(-10, 10), t: 0, vida: azar.rango(0.8, 1.4), r: azar.rango(5, 9) });
    }
    P.push({ tipo: 'fogonazo', x: ev.x + ev.nx * 4, y: ev.y + ev.ny * 4, t: 0, vida: 0.12, r: 9 });
  } else if (ev.k === 'g') { // golpe en un casco
    for (let k = 0; k < 4; k++) P.push({ tipo: 'astilla', x: ev.x, y: ev.y, vx: azar.rango(-90, 90), vy: azar.rango(-90, 90), t: 0, vida: 0.5, r: 2 });
    P.push({ tipo: 'humo', x: ev.x, y: ev.y, vx: 0, vy: -10, t: 0, vida: 0.7, r: 6 });
  } else if (ev.k === 'h') { // un barco se hunde
    for (let k = 0; k < 14; k++) {
      P.push({ tipo: k % 2 ? 'astilla' : 'humoNegro', x: ev.x + azar.rango(-20, 20), y: ev.y + azar.rango(-10, 10), vx: azar.rango(-60, 60), vy: azar.rango(-60, 60), t: 0, vida: azar.rango(0.6, 1.6), r: azar.rango(2, 8) });
    }
  } else if (ev.k === 's') P.push({ tipo: 'salpicon', x: ev.x, y: ev.y, t: 0, vida: 0.7, r: ev.r });
  else if (ev.k === 'p') P.push({ tipo: 'polvo', x: ev.x, y: ev.y, t: 0, vida: 0.6, r: 8 });
  else if (ev.k === 't') j.textos.push({ x: ev.x, y: ev.y, texto: ev.s, datos: ev.q, color: ev.c, t: 1.6 });
}

// Texto flotante. Con "para" solo lo ve ese capitán.
function textoFlotante(j, x, y, texto, color, para, datos) {
  emitir(j, { k: 't', x: Math.round(x), y: Math.round(y), s: texto, q: datos, c: color, p: para ? para.id : undefined });
}

// Estela y humo de un barco en movimiento (solo cosmético)
export function estela(j, b, dt) {
  const s = b.stats;
  if (b.v > 30 && Math.random() < dt * 22) {
    const ca = Math.cos(b.a), sa = Math.sin(b.a);
    j.particulas.push({ tipo: 'estela', x: b.x - ca * s.largo * 0.5 + azar.rango(-4, 4), y: b.y - sa * s.largo * 0.5 + azar.rango(-4, 4), t: 0, vida: 1.6, r: s.ancho * 0.25 });
  }
  if (b.vida < s.vidaMax * 0.45 && Math.random() < dt * 6) {
    j.particulas.push({ tipo: 'humoNegro', x: b.x + azar.rango(-10, 10), y: b.y + azar.rango(-6, 6), vx: azar.rango(-8, 8), vy: azar.rango(-18, -6), t: 0, vida: 1.8, r: azar.rango(4, 8) });
  }
}

export function actualizarParticulas(j, dt) {
  for (const p of j.particulas) {
    p.t += dt;
    if (p.vx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; }
  }
  j.particulas = j.particulas.filter((p) => p.t < p.vida);
  if (j.particulas.length > 900) j.particulas.splice(0, j.particulas.length - 900);
  for (const t of j.textos) { t.t -= dt; t.y -= 22 * dt; }
  j.textos = j.textos.filter((t) => t.t > 0);
}

// ---------- Enemigos ----------
function spawnEnemigo(j, inicial) {
  const { mundo } = j;
  for (let intento = 0; intento < 60; intento++) {
    const x = azar.rango(250, mundo.ancho - 250), y = azar.rango(250, mundo.alto - 250);
    if (Math.hypot(x - mundo.puerto.x, y - mundo.puerto.y) < 900) continue;
    if (!lejosDeCapitanes(j, x, y, inicial ? 1100 : 1300)) continue;
    if (mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.2 + 80)) continue;
    const nivel = nivelZona(mundo, x, y);
    const tipo = elegirTipo(nivel, mundo.reglas);
    const e = ENEMIGOS[tipo];
    const b = crearBarco(disenoEnemigo(tipo, nivel, mundo.reglas.facciones), 'enemigo', x, y, {
      a: azar.rango(0, TAU), velas: 1, bandera: e.color, color: tipo === 'tesoro' ? '#f6e7b0' : '#e9e1cc',
      nombre: e.nombre, tipo, colorVela: tipo === 'tesoro' ? '#f3d98b' : null, oro: Math.round(azar.rango(e.oro[0], e.oro[1]) * (1 + nivel * 0.25)),
    });
    b.nivel = nivel;
    j.barcos.push(b);
    return;
  }
}

function elegirTipo(nivel, reglas = {}) {
  const pesos = nivel === 0
    ? { mercante: 6, balandro: 4 }
    : nivel === 1
      ? { mercante: 3, balandro: 3, corsario: 4, tesoro: 1 }
      : { balandro: 1, corsario: 3, cazador: 3, galeonGuerra: 3, tesoro: 1.5 };
  // cada mapa inclina la balanza: más comercio, más guerra o más piratas
  const mult = { mercante: reglas.comercio, tesoro: reglas.comercio, balandro: reglas.piratas, corsario: reglas.guerra, cazador: reglas.guerra, galeonGuerra: reglas.guerra };
  for (const k of Object.keys(pesos)) pesos[k] *= mult[k] ?? 1;
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(pesos)) { r -= w; if (r <= 0) return k; }
  return 'mercante';
}

// ---------- Disparos ----------
export function disparar(j, b, lado) {
  if (b.hundiendo || b.recarga[lado] > 0 || b.diseno.canones < 2) return false;
  if (b.cap && enPuerto(j, b)) return false; // en el puerto no se pelea
  const s = b.stats;
  const porLado = b.diseno.canones / 2;
  // con todo el trapo arriba la gente está en las velas y recarga más lento (velas de combate = pocas velas)
  const porVelas = b.velas >= 3 ? 0.75 : b.velas === 2 ? 0.92 : 1.1;
  const factor = Math.max(0.45, Math.min(1.35, b.trip / s.tripNecesaria)) * porVelas;
  b.recarga[lado] = s.recarga / factor;
  b.recargaTotal = b.recargaTotal || {};
  b.recargaTotal[lado] = b.recarga[lado];
  for (let i = 0; i < porLado; i++) {
    const off = porLado === 1 ? 0 : (-0.32 + (0.64 * i) / (porLado - 1)) * s.largo;
    j.pendientes.push({ b, lado, off, t: i * 0.06 + azar.rango(0, 0.03) });
  }
  return true;
}

function salirBala(j, { b, lado, off }) {
  if (b.hundiendo) return;
  const s = b.stats;
  const ca = Math.cos(b.a), sa = Math.sin(b.a);
  const nx = -sa * lado, ny = ca * lado; // normal del costado
  const x = b.x + ca * off + nx * s.ancho * 0.5;
  const y = b.y + sa * off + ny * s.ancho * 0.5;
  const base = b.a + lado * Math.PI / 2;
  const abierto = s.perdigones > 1 ? 0.16 : 0.035;
  for (let k = 0; k < s.perdigones; k++) {
    const ang = base + azar.rango(-abierto, abierto);
    const vel = s.velBala * azar.rango(0.92, 1.05);
    const vida = (s.alcance / s.velBala) * azar.rango(0.93, 1.05);
    const bala = {
      x, y, vx: Math.cos(ang) * vel + ca * b.v * 0.5, vy: Math.sin(ang) * vel + sa * b.v * 0.5,
      vida, vidaTotal: vida, dano: s.dano, tripu: s.tripu, radio: s.radioBala,
      equipo: equipoDe(b), dueno: b,
    };
    j.balas.push(bala);
    // a los jugadores en línea se les manda la bala para que la dibujen; el daño lo decide el servidor
    if (j.eventos) j.eventos.push({ k: 'b', x: Math.round(x), y: Math.round(y), vx: Math.round(bala.vx), vy: Math.round(bala.vy), v: +vida.toFixed(2), r: s.radioBala, e: bala.equipo });
  }
  emitir(j, { k: 'c', x: Math.round(x), y: Math.round(y), nx: +nx.toFixed(2), ny: +ny.toFixed(2) });
  if (esInsignia(b)) b.cap.sacudon = Math.max(b.cap.sacudon, 2.5);
}

export function dentroDelCasco(b, x, y, margen = 0) {
  const dx = x - b.x, dy = y - b.y;
  const ca = Math.cos(b.a), sa = Math.sin(b.a);
  const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
  const A = b.stats.largo / 2 + margen, B = b.stats.ancho / 2 + margen;
  return (lx * lx) / (A * A) + (ly * ly) / (B * B) <= 1;
}

// ---------- Paso de simulación ----------
// Modo solo: una sola entrada, la del jugador.
export function actualizar(j, dt, entrada) {
  if (j.yo.fin) {
    j.t += dt;
    actualizarHundidos(j, dt);
    actualizarParticulas(j, dt);
    return;
  }
  avanzar(j, dt, { [j.yo.id]: entrada });
}

// entradas: { idDeCapitan: entrada }
export function avanzar(j, dt, entradas) {
  j.t += dt;
  for (const cap of j.capitanes) {
    if (cap.fin) continue;
    cap.stats.tiempo += dt;
    cap.cdAbordaje = Math.max(0, cap.cdAbordaje - dt);
    cap.sacudon = Math.max(0, cap.sacudon - dt * 12);
    controlarCapitan(j, cap, entradas[cap.id] || {});
  }
  for (const b of j.barcos) {
    if (b.bando === 'enemigo') iaEnemigo(j, b, dt);
    else if (b.bando === 'escolta') iaEscolta(j, b, dt);
  }
  for (const b of j.barcos) moverBarco(j, b, dt);
  separarBarcos(j);

  // andanadas escalonadas
  for (const p of j.pendientes) p.t -= dt;
  const listos = j.pendientes.filter((p) => p.t <= 0);
  j.pendientes = j.pendientes.filter((p) => p.t > 0);
  for (const p of listos) salirBala(j, p);

  for (const cap of j.capitanes) if (!cap.fin) actualizarGancho(j, cap, dt);
  moverBalas(j, dt);
  actualizarConvoy(j, dt);
  actualizarTritones(j, dt);
  actualizarCofres(j, dt);
  actualizarHundidos(j, dt);
  if (!j.eventos) actualizarParticulas(j, dt);

  for (const cap of j.capitanes) {
    for (const a of cap.avisos) a.t -= dt;
    cap.avisos = cap.avisos.filter((a) => a.t > 0);
  }

  const vivos = j.barcos.filter((b) => b.bando === 'enemigo' && !b.hundiendo).length;
  if (vivos < j.enemigosVivos && Math.random() < dt * 0.5) spawnEnemigo(j, false);
}

function controlarCapitan(j, cap, e) {
  const b = cap.barco;
  if (b.hundiendo) return;
  if (e.objetivo) {
    // el barco navega hacia el cursor: cuanto más lejos, más velas
    const d = Math.hypot(e.objetivo.x - b.x, e.objetivo.y - b.y);
    const cerca = b.stats.largo * 0.6 + 15;
    if (d > cerca) b.timon = Math.max(-1, Math.min(1, difAng(Math.atan2(e.objetivo.y - b.y, e.objetivo.x - b.x), b.a) * 2.5));
    else b.timon = 0;
    b.velas = d <= cerca ? 0 : d < 150 ? 1 : d < 280 ? 2 : 3;
  } else if (e.quieto) { b.timon = 0; b.velas = 0; }
  if (e.fuegoTodo) { disparar(j, b, -1); disparar(j, b, 1); }
  if (e.fuego) disparar(j, b, e.fuego);
  if (e.abordar) lanzarGancho(j, cap, e.objetivo);
  if (e.ordenFlota) {
    cap.ordenFlota = cap.ordenFlota === 'formacion' ? 'ataque' : 'formacion';
    aviso(cap, cap.ordenFlota === 'ataque' ? 'Flota: ¡al ataque!' : 'Flota: en formación, a tu lado', 'info');
  }
}

function moverBarco(j, b, dt) {
  if (b.hundiendo) { b.v *= 1 - dt; b.x += Math.cos(b.a) * b.v * dt; b.y += Math.sin(b.a) * b.v * dt; return; }
  const s = b.stats;
  const insignia = esInsignia(b);
  for (const k of ['-1', '1']) b.recarga[k] = Math.max(0, b.recarga[k] - dt);
  const pocaGente = b.trip < s.tripMax * 0.25 ? 0.65 : 1;
  // casco roto = barco lento: por debajo del 70 % de vida va perdiendo hasta la mitad de velocidad
  const averia = 0.5 + 0.5 * Math.min(1, b.vida / (s.vidaMax * 0.7));
  const objetivo = (s.velMax * b.velas) / 3 * pocaGente * averia * (b.frenoGancho || 1);
  b.frenoGancho = 1;
  b.v += (objetivo - b.v) * Math.min(1, dt * (objetivo > b.v ? 0.7 : 1.1));
  const agarre = 0.3 + 0.7 * Math.min(1, b.v / (s.velMax * 0.45));
  b.a += b.timon * s.giro * agarre * dt;
  let vx = Math.cos(b.a) * b.v, vy = Math.sin(b.a) * b.v;

  // remolinos: te chupan y te hacen girar
  let enRemolino = false;
  for (const w of j.mundo.remolinos) {
    const dx = w.x - b.x, dy = w.y - b.y, d = Math.hypot(dx, dy);
    if (d >= w.radio) continue;
    enRemolino = true;
    const f = 1 - d / w.radio;
    const nx = dx / (d || 1), ny = dy / (d || 1);
    vx += nx * 95 * f + -ny * 85 * f * w.giro;
    vy += ny * 95 * f + nx * 85 * f * w.giro;
    b.a += 0.9 * f * dt * w.giro;
    if (d < 55) {
      b.vida -= 16 * dt;
      if (Math.random() < dt * 0.6 && b.trip > 1) b.trip -= 1;
      if (insignia && Math.random() < dt) aviso(b.cap, '¡El remolino te está tragando!', 'malo');
    }
    if (insignia && !b.enRemolino) aviso(b.cap, '¡Remolino! Alejá el cursor y salí de costado', 'malo');
  }
  b.enRemolino = enRemolino;
  b.x += vx * dt;
  b.y += vy * dt;

  // islas
  b.golpeIsla = Math.max(0, b.golpeIsla - dt);
  for (const i of j.mundo.islas) {
    const dx = b.x - i.x, dy = b.y - i.y, d = Math.hypot(dx, dy);
    const lim = i.r * 1.0 + s.ancho * 0.6;
    if (d < lim) {
      b.x = i.x + (dx / d) * lim;
      b.y = i.y + (dy / d) * lim;
      if (b.v > s.velMax * 0.4 && b.golpeIsla <= 0) {
        b.vida -= i.tipo === 'iceberg' ? 10 : 5;
        b.golpeIsla = 1;
        if (insignia) aviso(b.cap, i.tipo === 'iceberg' ? '¡Chocaste un iceberg!' : i.tipo === 'arrecife' ? '¡Encallaste en un banco!' : '¡Encallaste contra la costa!', 'malo');
      }
      b.v = Math.min(b.v, s.velMax * 0.45); // roza la costa y sigue, sin quedar clavado
    }
  }
  // carenar: parado junto a una isla y sin recibir golpes, la tripulación repara (hasta el 75 %)
  b.reparando = false;
  if (b.cap && b.v < 22 && b.vida < s.vidaMax * 0.75 && j.t - (b.ultimoGolpe ?? -99) > 4) {
    if (j.mundo.islas.some((i) => i.tipo !== 'iceberg' && i.tipo !== 'arrecife' && Math.hypot(b.x - i.x, b.y - i.y) < i.r + 130)) {
      b.vida = Math.min(s.vidaMax * 0.75, b.vida + 4 * dt);
      b.reparando = true;
    }
  }
  b.x = Math.max(60, Math.min(j.mundo.ancho - 60, b.x));
  b.y = Math.max(60, Math.min(j.mundo.alto - 60, b.y));

  // estela y humo, solo cerca de la cámara (en el servidor no hace falta: los dibuja cada jugador)
  if (!j.eventos && j.yo && Math.abs(b.x - j.yo.barco.x) < 1300 && Math.abs(b.y - j.yo.barco.y) < 1000) estela(j, b, dt);
  if (b.vida <= 0) hundir(j, b);
}

function separarBarcos(j) {
  const bs = j.barcos;
  for (let a = 0; a < bs.length; a++) {
    for (let c = a + 1; c < bs.length; c++) {
      const A = bs[a], B = bs[c];
      const dx = B.x - A.x, dy = B.y - A.y;
      if (Math.abs(dx) > 160 || Math.abs(dy) > 160) continue;
      const d = Math.hypot(dx, dy) || 1;
      const min = (A.stats.ancho + B.stats.ancho) * 0.5 + 8;
      if (d < min + 30 && dentroDelCasco(A, B.x, B.y, B.stats.ancho * 0.5)) {
        const empuje = (min + 30 - d) * 0.05;
        A.x -= (dx / d) * empuje; A.y -= (dy / d) * empuje;
        B.x += (dx / d) * empuje; B.y += (dy / d) * empuje;
      }
    }
  }
}

function moverBalas(j, dt) {
  const quedan = [];
  for (const bl of j.balas) {
    bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.vida -= dt;
    let pego = false;
    for (const b of j.barcos) {
      if (b.hundiendo || equipoDe(b) === bl.equipo) continue;
      if (Math.abs(b.x - bl.x) > b.stats.largo || Math.abs(b.y - bl.y) > b.stats.largo) continue;
      if (b.cap && enPuerto(j, b)) continue; // el puerto es zona segura
      if (dentroDelCasco(b, bl.x, bl.y, bl.radio)) {
        golpear(j, b, bl);
        pego = true;
        break;
      }
    }
    if (!pego && bl.equipo !== 'enemigo') {
      for (const tr of j.tritones) {
        if (!tr.muerto && Math.hypot(tr.x - bl.x, tr.y - bl.y) < 14 + bl.radio) {
          tr.muerto = true; pego = true;
          textoFlotante(j, tr.x, tr.y, '¡Tritón abatido!', '#9be7c4');
          emitir(j, { k: 's', x: Math.round(tr.x), y: Math.round(tr.y), r: 10 });
          break;
        }
      }
    }
    if (pego) continue;
    if (bl.vida <= 0) { if (!j.eventos) efecto(j, { k: 's', x: bl.x, y: bl.y, r: 6 + bl.radio }); continue; }
    if (j.mundo.islas.some((i) => Math.hypot(i.x - bl.x, i.y - bl.y) < i.r * 0.95)) {
      if (!j.eventos) efecto(j, { k: 'p', x: bl.x, y: bl.y }); // la bala termina en la arena
      continue;
    }
    quedan.push(bl);
  }
  j.balas = quedan;
}

function golpear(j, b, bl) {
  b.vida -= bl.dano;
  b.ultimoGolpe = j.t;
  const agresor = bl.dueno && bl.dueno.cap ? bl.dueno.cap : null;
  if (agresor) b.ultimoAgresor = agresor;
  if (Math.random() < bl.tripu && b.trip > 0) b.trip -= 1;
  emitir(j, { k: 'g', x: Math.round(bl.x), y: Math.round(bl.y) });
  if (esInsignia(b)) b.cap.sacudon = Math.max(b.cap.sacudon, 5);
  if (agresor && bl.dano >= 5) textoFlotante(j, bl.x, bl.y - 8, `-${Math.round(bl.dano)}`, '#ffd166', agresor);
  if (b.bando === 'enemigo') b.ia.provocado = 8;
}

function soltarOro(j, x, y, oro, abre, partes) {
  oro = Math.round(oro);
  if (oro <= 0) return;
  const n = partes || (oro > 600 ? 5 : oro > 200 ? 3 : oro > 90 ? 2 : 1);
  for (let k = 0; k < n; k++) j.cofres.push({ id: j.proxCofre++, x: x + azar.rango(-abre, abre), y: y + azar.rango(-abre, abre), oro: Math.round(oro / n), t: 0 });
}

function hundir(j, b) {
  if (b.hundiendo) return;
  b.hundiendo = 0.0001;
  b.vida = 0;
  emitir(j, { k: 'h', x: Math.round(b.x), y: Math.round(b.y) });
  const agresor = b.ultimoAgresor && !b.ultimoAgresor.fin && b.ultimoAgresor !== b.cap ? b.ultimoAgresor : null;
  if (b.bando === 'enemigo') {
    if (agresor) agresor.stats.hundidos++;
    soltarOro(j, b.x, b.y, b.oro, b.convoy ? 110 : 25, b.convoy ? 9 : 0);
    if (b.convoy) aviso(j, '¡Cayó el galeón del tesoro! El oro quedó flotando por todos lados', 'bueno');
    else if (agresor && b.oro > 0) aviso(agresor, '¡Hundiste un {barco}! Juntá el botín', 'bueno', { barco: b.nombre });
  } else if (!esInsignia(b)) {
    if (agresor) agresor.stats.hundidos++;
    aviso(b.cap, 'Perdiste tu {barco}', 'malo', { barco: b.nombre });
  } else {
    perderInsignia(j, b.cap, agresor, true);
  }
}

// El capitán se queda sin su barco insignia: toma el mando de una escolta o termina su partida.
function perderInsignia(j, cap, agresor, hundido) {
  const viejo = cap.barco;
  const relevo = j.barcos.find((x) => x.cap === cap && x !== viejo && x.bando === 'escolta' && !x.hundiendo);
  if (cap.gancho) cap.gancho = null;
  if (relevo) {
    const perdido = Math.round(cap.oroBodega / 2);
    cap.oroBodega -= perdido;
    if (hundido) soltarOro(j, viejo.x, viejo.y, perdido, 35);
    else if (agresor) ganarOro(j, agresor, perdido, viejo.x, viejo.y);
    relevo.bando = 'jugador';
    relevo.bandera = VERDE;
    if (hundido) viejo.bando = 'escolta';
    cap.barco = relevo;
    aviso(cap, hundido ? '¡Te hundieron! Tomás el mando del {barco}. Se perdieron {oro} de oro' : '¡Te capturaron el barco! Tomás el mando del {barco}. Se perdieron {oro} de oro', 'malo', { barco: relevo.nombre, oro: perdido });
    if (agresor) { agresor.stats.hundidos++; aviso(agresor, hundido ? '¡Le hundiste el barco insignia a {nombre}!' : '¡Le capturaste el barco insignia a {nombre}!', 'bueno', { nombre: cap.nombre }); }
  } else {
    if (hundido) soltarOro(j, viejo.x, viejo.y, cap.oroBodega, 45);
    else if (agresor) ganarOro(j, agresor, cap.oroBodega, viejo.x, viejo.y);
    cap.oroBodega = 0;
    cap.fin = true;
    cap.finEn = j.t;
    cap.causa = agresor ? agresor.nombre : null;
    if (agresor) { agresor.stats.eliminados++; aviso(agresor, '¡Eliminaste a {nombre}!', 'bueno', { nombre: cap.nombre }); }
  }
}

function ganarOro(j, cap, base, x, y) {
  const oro = Math.round(base * cap.barco.stats.oro);
  if (oro <= 0) return;
  cap.oroBodega += oro;
  cap.stats.saqueado += oro;
  textoFlotante(j, x, y, '+{n} oro', '#ffd166', cap, { n: oro });
}

function actualizarHundidos(j, dt) {
  for (const b of j.barcos) if (b.hundiendo) b.hundiendo += dt;
  j.barcos = j.barcos.filter((b) => !b.hundiendo || b.hundiendo < 3);
}

function actualizarCofres(j, dt) {
  const quedan = [];
  for (const c of j.cofres) {
    c.t += dt;
    const juntador = j.barcos.find((b) => b.cap && !b.cap.fin && !b.hundiendo && Math.abs(b.x - c.x) < 90 && Math.hypot(b.x - c.x, b.y - c.y) < b.stats.largo * 0.5 + 22);
    if (juntador) { ganarOro(j, juntador.cap, c.oro, c.x, c.y); continue; }
    if (c.t < 75) quedan.push(c);
  }
  j.cofres = quedan;
}

// Entrar al puerto: el oro de la bodega queda a salvo. Devuelve false si el barco no está en el puerto.
export function atracar(j, cap) {
  if (cap.fin || cap.barco.hundiendo || !enPuerto(j, cap.barco)) return false;
  cap.oroPuerto += cap.oroBodega;
  cap.oroBodega = 0;
  cap.barco.velas = 0;
  return true;
}

// ---------- Abordaje con gancho ----------
export const ALCANCE_GANCHO = 250;

// Para la pantalla: el rival más cercano al que le llega el gancho, con una idea de cómo viene la pelea
export function candidatoAbordaje(j) {
  const yo = j.jugador;
  if (!yo || yo.hundiendo) return null;
  let mejor = null, mejorD = ALCANCE_GANCHO + 60;
  for (const b of j.barcos) {
    if (b.bando !== 'enemigo' || b.hundiendo) continue;
    const d = Math.hypot(b.x - yo.x, b.y - yo.y);
    if (d < mejorD) { mejor = b; mejorD = d; }
  }
  if (!mejor) return null;
  const r = (yo.trip * yo.stats.abordaje) / Math.max(1, mejor.trip * mejor.stats.abordaje * 1.1);
  return { b: mejor, debil: true, ventaja: r > 1.3 ? 'ventaja' : r > 0.8 ? 'parejo' : 'desventaja' };
}

// El gancho sale recto hacia el cursor: hay que apuntarle al casco
function lanzarGancho(j, cap, objetivo) {
  if (cap.gancho || cap.cdAbordaje > 0 || !objetivo) return;
  const yo = cap.barco;
  if (enPuerto(j, yo)) return;
  const a = Math.atan2(objetivo.y - yo.y, objetivo.x - yo.x);
  cap.gancho = { fase: 'vuelo', x: yo.x, y: yo.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, lejos: 0, obj: null, t: 0 };
}

function soltarGancho(cap, espera, texto) {
  cap.gancho = null;
  cap.cdAbordaje = espera;
  if (texto) aviso(cap, texto, 'info');
}

function actualizarGancho(j, cap, dt) {
  const g = cap.gancho;
  if (!g) return;
  const yo = cap.barco;
  g.t += dt;
  if (g.fase === 'vuelo') {
    if (yo.hundiendo) return soltarGancho(cap, 2);
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.lejos += 520 * dt;
    for (const b of j.barcos) {
      if (b.cap === cap || b.hundiendo || (b.cap && enPuerto(j, b)) || !dentroDelCasco(b, g.x, g.y, 5)) continue;
      g.fase = 'enganchado';
      g.obj = b;
      g.t = 0;
      aviso(cap, '¡Enganchado! Tu gente tira de la soga del {barco}', 'bueno', { barco: b.nombre });
      if (esInsignia(b)) aviso(b.cap, '¡{nombre} te enganchó! Alejate o bajale gente a cañonazos', 'malo', { nombre: cap.nombre });
      return;
    }
    if (g.lejos > ALCANCE_GANCHO || j.mundo.islas.some((i) => Math.hypot(i.x - g.x, i.y - g.y) < i.r)) soltarGancho(cap, 4, 'Erraste el gancho');
    return;
  }
  const e = g.obj;
  if (yo.hundiendo || e.hundiendo || e.cap === cap || !j.barcos.includes(e)) return soltarGancho(cap, 2);
  const d = Math.hypot(e.x - yo.x, e.y - yo.y);
  if (d > 400 || g.t > 14) return soltarGancho(cap, 6, 'Se cortó la soga: el barco estaba muy entero y se soltó');
  // la soga acerca los dos barcos; el más chico se mueve más. Un barco entero se resiste.
  const mYo = yo.stats.largo ** 2, mEl = e.stats.largo ** 2;
  const entero = Math.max(0, Math.min(1, e.vida / e.stats.vidaMax));
  e.frenoGancho = 0.3 + 0.55 * entero;
  const tiron = (95 - 55 * entero) * dt, nx = (e.x - yo.x) / (d || 1), ny = (e.y - yo.y) / (d || 1);
  e.x -= nx * tiron * (mYo / (mYo + mEl));
  e.y -= ny * tiron * (mYo / (mYo + mEl));
  yo.x += nx * tiron * (mEl / (mYo + mEl));
  yo.y += ny * tiron * (mEl / (mYo + mEl));
  if (d < (yo.stats.ancho + e.stats.ancho) * 0.5 + 48) {
    cap.gancho = null;
    cap.cdAbordaje = 5;
    resolverAbordaje(j, cap, e);
  }
}

function resolverAbordaje(j, cap, e) {
  const yo = cap.barco;
  const mio = yo.trip * yo.stats.abordaje * azar.rango(0.75, 1.25);
  const suyo = e.trip * e.stats.abordaje * azar.rango(0.75, 1.25) * 1.1;
  const dueno = e.cap; // null si es un bot
  if (mio <= suyo) {
    const bajas = Math.max(0, Math.min(yo.trip - 1, Math.round(yo.trip * azar.rango(0.35, 0.55))));
    yo.trip -= bajas;
    e.trip = Math.max(1, e.trip - Math.round(e.trip * 0.3));
    aviso(cap, '¡Abordaje rechazado! Perdiste {n} marineros. Bajales gente a cañonazos y probá de nuevo', 'malo', { n: bajas });
    if (dueno) aviso(dueno, '¡Rechazaste el abordaje de {nombre}!', 'bueno', { nombre: cap.nombre });
    return;
  }
  const bajas = Math.max(0, Math.min(yo.trip - 1, Math.round(e.trip * azar.rango(0.3, 0.6))));
  yo.trip -= bajas;
  ganarOro(j, cap, e.oro, e.x, e.y);
  e.oro = 0;
  const escoltas = j.barcos.filter((b) => b.cap === cap && b.bando === 'escolta' && !b.hundiendo).length;
  if (escoltas < cap.escoltasMax) {
    // el barco cambia de dueño
    if (dueno && esInsignia(e)) perderInsignia(j, dueno, cap, false);
    else if (dueno) aviso(dueno, '{nombre} te capturó el {barco}', 'malo', { nombre: cap.nombre, barco: e.nombre });
    e.cap = cap;
    e.bando = 'escolta';
    e.convoy = false;
    e.vida = Math.max(e.vida, e.stats.vidaMax * 0.4);
    e.trip = Math.max(4, Math.round(e.stats.tripMax * 0.4));
    e.bandera = VERDE;
    e.ia = { estado: 'sigue' };
    e.ultimoAgresor = null;
    cap.stats.capturados++;
    aviso(cap, '¡Abordaje ganado! El {barco} se suma a tu flota (−{n} marineros)', 'bueno', { barco: e.nombre, n: bajas });
  } else {
    e.ultimoAgresor = cap;
    hundir(j, e);
    aviso(cap, '¡Abordaje ganado! Flota llena: lo saqueaste y lo hundiste (−{n} marineros)', 'bueno', { n: bajas });
  }
}

// ---------- IA ----------
function timonHacia(b, angulo) {
  b.timon = Math.max(-1, Math.min(1, difAng(angulo, b.a) * 2.2));
}

function esquivarIslas(j, b) {
  const mira = 90 + b.v * 0.8;
  const px = b.x + Math.cos(b.a) * mira, py = b.y + Math.sin(b.a) * mira;
  for (const i of j.mundo.islas) {
    if (Math.hypot(i.x - px, i.y - py) < i.r + 60) {
      const ang = Math.atan2(i.y - b.y, i.x - b.x);
      b.timon = difAng(ang, b.a) > 0 ? -1 : 1;
      return true;
    }
  }
  for (const w of j.mundo.remolinos) {
    if (Math.hypot(w.x - px, w.y - py) < w.radio + 40) {
      const ang = Math.atan2(w.y - b.y, w.x - b.x);
      b.timon = difAng(ang, b.a) > 0 ? -1 : 1;
      return true;
    }
  }
  return false;
}

function combatir(j, b, obj, dist) {
  const s = b.stats;
  const rumbo = Math.atan2(obj.y - b.y, obj.x - b.x);
  if (dist > s.alcance * 0.85) {
    timonHacia(b, rumbo);
    b.velas = 3;
  } else {
    // ponerse de costado para la andanada
    const a1 = rumbo + Math.PI / 2, a2 = rumbo - Math.PI / 2;
    timonHacia(b, Math.abs(difAng(a1, b.a)) < Math.abs(difAng(a2, b.a)) ? a1 : a2);
    b.velas = dist < s.alcance * 0.4 ? 1 : 2;
  }
  // ¿lo tengo de costado y a tiro?
  const rel = difAng(rumbo, b.a);
  if (dist < s.alcance * 0.95) {
    if (Math.abs(rel - Math.PI / 2) < 0.4) disparar(j, b, 1);
    if (Math.abs(rel + Math.PI / 2) < 0.4) disparar(j, b, -1);
  }
}

// El barco rival más cercano. soloBots: para las escoltas en formación que no deben provocar a otros jugadores.
function masCercano(j, b, radio) {
  const mio = equipoDe(b);
  const p = j.mundo.puerto;
  let mejor = null, mejorD = radio;
  for (const o of j.barcos) {
    if (o.hundiendo || equipoDe(o) === mio) continue;
    if (Math.abs(o.x - b.x) > radio || Math.abs(o.y - b.y) > radio) continue;
    if (Math.hypot(o.x - p.x, o.y - p.y) < p.radio + 60) continue; // el puerto es zona segura
    const d = Math.hypot(o.x - b.x, o.y - b.y);
    if (d < mejorD) { mejor = o; mejorD = d; }
  }
  return mejor ? { o: mejor, d: mejorD } : null;
}

function iaEnemigo(j, b, dt) {
  if (b.hundiendo) return;
  const ia = b.ia;
  ia.t -= dt;
  ia.provocado = Math.max(0, (ia.provocado || 0) - dt);
  const conducta = ENEMIGOS[b.tipo].conducta;
  const radioVista = 560 + (b.nivel || 0) * 120 + (ia.provocado ? 500 : 0);
  const cerca = masCercano(j, b, radioVista);
  const debil = b.vida < b.stats.vidaMax * 0.25;
  if (ia.lider && !ia.lider.hundiendo && ia.lider.bando === 'enemigo') {
    const L = ia.lider;
    const amenaza = masCercano(j, L, 560) || masCercano(j, b, 420);
    if (amenaza) combatir(j, b, amenaza.o, Math.hypot(amenaza.o.x - b.x, amenaza.o.y - b.y));
    else {
      const tx = L.x - Math.sin(L.a) * 115 * ia.lado, ty = L.y + Math.cos(L.a) * 115 * ia.lado;
      const d = Math.hypot(tx - b.x, ty - b.y);
      timonHacia(b, d > 40 ? Math.atan2(ty - b.y, tx - b.x) : L.a);
      b.velas = d > 200 ? 3 : d > 70 ? 2 : L.velas;
    }
    esquivarIslas(j, b);
    return;
  }

  if (cerca && (conducta === 'huye' || debil)) {
    const lejos = Math.atan2(b.y - cerca.o.y, b.x - cerca.o.x);
    timonHacia(b, lejos);
    b.velas = 3;
    const rel = difAng(Math.atan2(cerca.o.y - b.y, cerca.o.x - b.x), b.a);
    if (cerca.d < b.stats.alcance) {
      if (Math.abs(rel - Math.PI / 2) < 0.5) disparar(j, b, 1);
      if (Math.abs(rel + Math.PI / 2) < 0.5) disparar(j, b, -1);
    }
  } else if (cerca) {
    combatir(j, b, cerca.o, cerca.d);
  } else {
    // pasear
    if (!ia.destino || ia.t <= 0 || Math.hypot(ia.destino.x - b.x, ia.destino.y - b.y) < 120) {
      ia.destino = { x: b.x + azar.rango(-900, 900), y: b.y + azar.rango(-900, 900) };
      ia.t = azar.rango(12, 25);
    }
    const p = j.mundo.puerto;
    if (Math.hypot(b.x - p.x, b.y - p.y) < 1000) ia.destino = { x: b.x + (b.x - p.x), y: b.y + (b.y - p.y) };
    timonHacia(b, Math.atan2(ia.destino.y - b.y, ia.destino.x - b.x));
    b.velas = conducta === 'huye' ? 1 : 2;
  }
  // los enemigos no entran al puerto
  const p = j.mundo.puerto;
  if (Math.hypot(b.x - p.x, b.y - p.y) < p.radio + 380) timonHacia(b, Math.atan2(b.y - p.y, b.x - p.x));
  esquivarIslas(j, b);
}

// Dispara si justo tiene un rival de costado y a tiro, sin maniobrar
function fuegoOportunista(j, b) {
  const en = masCercano(j, b, b.stats.alcance * 0.95);
  if (!en) return;
  const rel = difAng(Math.atan2(en.o.y - b.y, en.o.x - b.x), b.a);
  if (Math.abs(rel - Math.PI / 2) < 0.45) disparar(j, b, 1);
  if (Math.abs(rel + Math.PI / 2) < 0.45) disparar(j, b, -1);
}

function iaEscolta(j, b, dt) {
  if (b.hundiendo) return;
  const cap = b.cap, lider = cap.barco;
  const sana = b.vida > b.stats.vidaMax * 0.3;
  const enemigo = cap.ordenFlota === 'ataque' && sana ? masCercano(j, b, 520) : null;
  if (enemigo && Math.hypot(enemigo.o.x - lider.x, enemigo.o.y - lider.y) < 700) {
    combatir(j, b, enemigo.o, enemigo.d);
  } else {
    // en formación: a la par del jefe, una de cada lado
    const escoltas = j.barcos.filter((x) => x.cap === cap && x.bando === 'escolta' && !x.hundiendo);
    const k = escoltas.indexOf(b);
    const fila = Math.floor(k / 2), costado = k % 2 ? 1 : -1;
    const ca = Math.cos(lider.a), sa = Math.sin(lider.a);
    const atras = -25 - fila * 95, lateral = costado * 90;
    const tx = lider.x + ca * atras - sa * lateral, ty = lider.y + sa * atras + ca * lateral;
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (d > 40) timonHacia(b, Math.atan2(ty - b.y, tx - b.x));
    else timonHacia(b, lider.a);
    b.velas = d > 260 ? 3 : d > 90 ? Math.max(2, lider.velas) : lider.velas;
    fuegoOportunista(j, b);
  }
  esquivarIslas(j, b);
}

// ---------- Flota del tesoro ----------
function actualizarConvoy(j, dt) {
  if (j.barcos.some((b) => b.convoy && !b.hundiendo && b.bando === 'enemigo')) return;
  j.proxConvoy -= dt;
  if (j.proxConvoy > 0) return;
  j.proxConvoy = azar.rango(200, 260) * (j.mundo.reglas.convoy || 1);
  const { mundo } = j;
  for (let intento = 0; intento < 80; intento++) {
    const x = azar.rango(500, mundo.ancho - 500), y = azar.rango(500, mundo.alto - 500);
    const nivel = nivelZona(mundo, x, y);
    if (nivel < 1 || !lejosDeCapitanes(j, x, y, 1300)) continue;
    if (mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.2 + 200)) continue;
    const a = azar.rango(0, TAU);
    const d = disenoEnemigo('tesoro', nivel, mundo.reglas.facciones);
    d.refuerzo = 160;
    const tesoro = crearBarco(d, 'enemigo', x, y, { a, velas: 1, bandera: '#c9a227', color: '#f6e7b0', nombre: 'Galeón del tesoro', tipo: 'tesoro', colorVela: '#f3d98b', oro: Math.round(azar.rango(1000, 1400)) });
    tesoro.nivel = nivel;
    tesoro.convoy = true;
    j.barcos.push(tesoro);
    const guardia = nivel >= 2 ? 'galeonGuerra' : 'corsario';
    for (const lado of [-1, 1]) {
      const g = crearBarco(disenoEnemigo(guardia, nivel, mundo.reglas.facciones), 'enemigo', x - Math.sin(a) * 110 * lado, y + Math.cos(a) * 110 * lado, {
        a, velas: 1, bandera: ENEMIGOS[guardia].color, color: '#e9e1cc', nombre: 'Guardia del tesoro', tipo: guardia,
        oro: Math.round(azar.rango(ENEMIGOS[guardia].oro[0], ENEMIGOS[guardia].oro[1])),
      });
      g.nivel = nivel;
      g.ia.lider = tesoro;
      g.ia.lado = lado;
      j.barcos.push(g);
    }
    aviso(j, '¡Flota del tesoro avistada! Un galeón cargado de oro con dos guardias. Mirá el minimapa', 'bueno');
    return;
  }
}

// ---------- Tritones ----------
function actualizarTritones(j, dt) {
  for (const cap of j.capitanes) {
    if (cap.fin) continue;
    const yo = cap.barco;
    const zona = nivelZona(j.mundo, yo.x, yo.y);
    if (zona >= 1) cap.proxTritones -= dt * (zona === 2 ? 1 : 0.35) * (j.mundo.reglas.tritones || 1);
    if (cap.proxTritones > 0 || yo.hundiendo || j.tritones.length > 40) continue;
    cap.proxTritones = azar.rango(40, 70);
    const n = 3 + zona + Math.min(4, Math.floor(cap.stats.tiempo / 240));
    for (let k = 0; k < n; k++) {
      const ang = azar.rango(0, TAU), d = azar.rango(420, 560);
      j.tritones.push({ x: yo.x + Math.cos(ang) * d, y: yo.y + Math.sin(ang) * d, a: 0, t: azar.rango(0, 3), muerto: false });
    }
    aviso(cap, '¡Tritones! {n} vienen a abordarte. Bajalos a cañonazos', 'malo', { n });
  }
  const quedan = [];
  for (const tr of j.tritones) {
    if (tr.muerto) continue;
    tr.t += dt;
    // van al barco de jugador más cercano
    let obj = null, od = Infinity;
    for (const b of j.barcos) {
      if (!b.cap || b.hundiendo) continue;
      const d = Math.hypot(b.x - tr.x, b.y - tr.y);
      if (d < od) { obj = b; od = d; }
    }
    if (!obj || od > 1400) continue; // se pierden en el mar
    const ang = Math.atan2(obj.y - tr.y, obj.x - tr.x) + Math.sin(tr.t * 3) * 0.5;
    tr.a = ang;
    const vel = 178;
    tr.x += Math.cos(ang) * vel * dt;
    tr.y += Math.sin(ang) * vel * dt;
    if (!j.eventos && Math.random() < dt * 8) j.particulas.push({ tipo: 'estela', x: tr.x, y: tr.y, t: 0, vida: 0.8, r: 4 });
    if (dentroDelCasco(obj, tr.x, tr.y, 6)) {
      const bajas = Math.max(0, Math.min(obj.trip - 1, azar.entero(1, 3)));
      obj.trip -= bajas;
      textoFlotante(j, tr.x, tr.y, '-{n} marineros', '#ff6b6b', obj.cap, { n: bajas });
      if (esInsignia(obj)) obj.cap.sacudon = 4;
      continue;
    }
    quedan.push(tr);
  }
  j.tritones = quedan;
}
