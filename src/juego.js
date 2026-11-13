// Simulación del mar: barcos, balas, bots, abordajes, remolinos, tritones y el Kraken.
// Maneja varios capitanes a la vez. El modo solo es el caso de un único capitán; en línea, esta misma
// simulación corre en el servidor. No toca pantalla ni teclado: recibe entradas y avanza un paso.
import { ENEMIGOS, ESCOLTAS_INICIALES, VIENTO, HABILIDADES, KRAKEN } from './config.js';
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
    kraken: null, // el jefe del mar: despierta cuando un capitán junta KRAKEN.marcas galeones del tesoro
    proxZona: 1,
    textos: [],
    eventos: opciones.servidor ? [] : null,
    enemigosVivos: opciones.enemigos ?? 18,
    proxConvoy: azar.rango(70, 100) * (mundo.reglas.convoy || 1),
    proxCofre: 1,
    yo: null,
    // Reglas que se eligen al crear la partida (modo solo o sala): sin viento no hay ráfagas ni rachas; sin abordajes, F no hace nada
    reglas: { viento: !(opciones.reglas && opciones.reglas.viento === false), abordajes: !(opciones.reglas && opciones.reglas.abordajes === false) },
    viento: null,
  };
  if (j.reglas.viento) j.viento = crearViento(mundo);
  for (let i = 0; i < j.enemigosVivos; i++) spawnEnemigo(j, true);
  return j;
}

// ---------- Viento ----------
// a = hacia dónde sopla. Rota despacio alrededor de su rumbo base. Las ráfagas son manchas redondas que viajan con el viento
// y, al salir del mapa, entran por el borde contrario.
function crearViento(mundo) {
  const base = azar.rango(0, TAU);
  const rafagas = [];
  for (let i = 0; i < VIENTO.rafagas; i++) rafagas.push({ x: azar.rango(0, mundo.ancho), y: azar.rango(0, mundo.alto), r: azar.rango(VIENTO.radioRafaga[0], VIENTO.radioRafaga[1]) });
  return { a: base, base, baseMeta: base, rafagas, rachas: [], curvo: true, f1: azar.rango(0, TAU), f2: azar.rango(0, TAU), cambios: 0, proxCambio: azar.rango(VIENTO.cadaCambio[0], VIENTO.cadaCambio[1]) };
}

// Hacia dónde sopla el viento en un punto del mar. El rumbo general se curva según la zona, como en un mapa del pronóstico.
// (curvo es falso jugando contra un servidor anterior, que tenía un solo rumbo para todo el mar.)
export function vientoEn(j, x, y) {
  const v = j.viento;
  if (!v) return 0;
  if (!v.curvo) return v.a;
  const K = VIENTO.escala;
  return v.a + VIENTO.curva * (0.7 * Math.sin(x * K + v.f1) * Math.cos(y * K + v.f2) + 0.4 * Math.sin((x + y) * K * 0.6 + v.f2 * 1.3));
}

function actualizarViento(j, dt) {
  const v = j.viento, m = j.mundo;
  if (!v) return;
  // las curvas se corren despacio, y muy cada tanto el viento cambia de rumbo: gira en unos segundos hasta soplar casi al revés
  v.f1 += dt * 0.011; v.f2 += dt * 0.007;
  v.proxCambio -= dt;
  if (v.proxCambio <= 0) {
    v.proxCambio = azar.rango(VIENTO.cadaCambio[0], VIENTO.cadaCambio[1]);
    v.baseMeta = v.base + Math.PI + azar.rango(-0.7, 0.7);
    v.cambios++;
    aviso(j, '¡El viento cambió de rumbo!', 'info');
  }
  const falta = difAng(v.baseMeta, v.base);
  v.base += Math.max(-VIENTO.giroCambio * dt, Math.min(VIENTO.giroCambio * dt, falta));
  v.a = v.base + VIENTO.vaiven * Math.sin(j.t * 0.015) + VIENTO.vaiven * 0.4 * Math.sin(j.t * 0.041 + 1.7);
  for (const g of v.rafagas) { // cada ráfaga viaja con el viento del lugar donde está
    const ag = vientoEn(j, g.x, g.y);
    g.x += Math.cos(ag) * VIENTO.velRafaga * dt; g.y += Math.sin(ag) * VIENTO.velRafaga * dt;
    if (g.x > m.ancho + g.r) g.x = -g.r; else if (g.x < -g.r) g.x = m.ancho + g.r;
    if (g.y > m.alto + g.r) g.y = -g.r; else if (g.y < -g.r) g.y = m.alto + g.r;
  }
  // Las rachas (el círculo con flechitas que aparecía cerca de cada capitán) se sacaron: Nicolás pidió dejar un solo tipo de
  // brisa, la mancha que se va moviendo (13/11/2026). Ya no se crea ninguna; lo que las dibuja y las cuenta queda por si
  // se juega contra un servidor anterior que todavía las mande.
}

// Cuánto rinde el barco con el viento de ahora (1 = sin efecto). Deja anotado en el barco si está en una ráfaga.
// La usan la simulación y la pantalla (para el indicador).
export function rindeViento(j, b) {
  const v = j.viento;
  if (!v) return b.cap && b.cap.habilidad && b.cap.habilidad.id === 'trapo' && b.cap.barco === b ? 1.6 : 1; // sin viento solo cuenta la habilidad
  const rel = Math.abs(difAng(b.a, vientoEn(j, b.x, b.y))) * 180 / Math.PI;
  const tabla = VIENTO.rinde[b.diseno.velas] || VIENTO.rinde.mixtas;
  const i = Math.min(3, Math.floor(rel / 45)), f = (rel - i * 45) / 45;
  let r = tabla[i] + (tabla[i + 1] - tabla[i]) * f;
  b.enRafaga = false;
  if (rel < VIENTO.anguloRafaga) for (const g of v.rafagas) {
    if (Math.abs(g.x - b.x) < g.r && Math.hypot(g.x - b.x, g.y - b.y) < g.r) { r *= VIENTO.rafaga; b.enRafaga = true; break; }
  }
  // una racha tomada con la proa hacia donde sopla empuja aunque el viento general esté en contra
  for (const k of v.rachas || []) {
    if (Math.abs(k.x - b.x) < k.r && Math.hypot(k.x - b.x, k.y - b.y) < k.r && Math.abs(difAng(b.a, k.a)) * 180 / Math.PI < VIENTO.anguloRacha) { r = Math.max(r, 1) * VIENTO.racha; b.enRafaga = true; break; }
  }
  if (b.cap && b.cap.habilidad && b.cap.habilidad.id === 'trapo' && b.cap.barco === b) r = Math.max(r, 1.6); // no se suma a una racha: vale el mayor
  return r;
}

export function agregarCapitan(j, { id, nombre, diseno, oro = 0, equipo }) {
  const p = j.mundo.puerto;
  const n = j.capitanes.length;
  // cada uno sale de un punto distinto del puerto
  const ang = Math.PI / 2 + (n % 7 - 3) * 0.42, d = 60 + (Math.floor(n / 7) % 3) * 55;
  const barco = crearBarco(diseno, 'jugador', p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, { a: ang, velas: 0, bandera: VERDE, nombre: nombre || 'Tu barco' });
  const cap = {
    id, nombre: nombre || 'Capitán', barco, equipo: equipo || diseno.faccion,
    oroBodega: 0, oroPuerto: oro, escoltasMax: ESCOLTAS_INICIALES,
    stats: { hundidos: 0, capturados: 0, eliminados: 0, saqueado: 0, tiempo: 0 },
    proxTritones: azar.rango(25, 45), cdAbordaje: 0, gancho: null, ordenFlota: 'formacion', formacion: 0,
    avisos: [], sacudon: 0, fin: false, finEn: 0,
    cdHabilidad: 0, habilidad: null, // habilidad en uso: { id, t (segundos que le quedan) }
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
export function crearPartida(mundo, diseno, oroInicial, reglas) {
  const j = crearMar(mundo, { reglas });
  j.yo = agregarCapitan(j, { id: 'yo', nombre: 'Tu barco', diseno, oro: oroInicial });
  Object.defineProperty(j, 'jugador', { get: () => j.yo.barco, enumerable: true });
  for (const k of ['oroBodega', 'oroPuerto', 'escoltasMax', 'stats', 'cdAbordaje', 'gancho', 'ordenFlota', 'formacion', 'avisos', 'sacudon', 'fin', 'finEn', 'cdHabilidad', 'habilidad']) {
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

// Equipos: cada civilización es un bando. Tus barcos (insignia y capturados) son de tu civilización; los bots, de la suya.
// Mismo equipo = no se dañan ni se abordan. Bots de civilizaciones distintas se pelean entre ellos.
// El galeón del tesoro y sus guardias son un equipo aparte ('tesoro'), enemigo de todos los capitanes.
export function equipoDe(b) {
  if (b.cap) return b.cap.equipo || b.cap.id;
  return b.equipo || b.diseno.faccion;
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
  if (j.alEfecto) j.alEfecto(ev); // la pantalla lo usa para el sonido (el servidor no pasa por acá)
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
  else if (ev.k === 'm') { // tiro de mosquete: humito en la borda y un salpicón chico donde estaba el tritón
    const a = Math.atan2(ev.ty - ev.y, ev.tx - ev.x);
    P.push({ tipo: 'humo', x: ev.x + Math.cos(a) * 12, y: ev.y + Math.sin(a) * 12, vx: Math.cos(a) * 25, vy: Math.sin(a) * 25, t: 0, vida: 0.6, r: 3 });
    P.push({ tipo: 'salpicon', x: ev.tx, y: ev.ty, t: 0, vida: 0.4, r: 4 });
  }
  else if (ev.k === 't') j.textos.push({ x: ev.x, y: ev.y, texto: ev.s, datos: ev.q, color: ev.c, t: 1.6 });
  else if (ev.k === 'kh') j.krakenHerido = j.t; // le pegaron al Kraken: su piel destella un instante
  else if (ev.k === 'kg') { // el golpe de un tentáculo: salpicón grande y astillas
    P.push({ tipo: 'salpicon', x: ev.x, y: ev.y, t: 0, vida: 0.9, r: 40 });
    for (let k = 0; k < 10; k++) P.push({ tipo: 'astilla', x: ev.x + azar.rango(-30, 30), y: ev.y + azar.rango(-30, 30), vx: azar.rango(-140, 140), vy: azar.rango(-140, 140), t: 0, vida: 0.8, r: 3 });
  }
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
      ? { mercante: 3, balandro: 3, corsario: 4 }
      : { balandro: 1, corsario: 3, cazador: 3, galeonGuerra: 3 }; // el galeón del tesoro no sale suelto: es un evento (ver actualizarConvoy)
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
  // un barco abordado tampoco dispara por el costado donde tiene trabado al que lo aborda
  for (const c of j.capitanes) if (c.gancho && c.gancho.obj === b && (difAng(Math.atan2(c.barco.y - b.y, c.barco.x - b.x), b.a) > 0 ? 1 : -1) === lado) return;
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
  actualizarViento(j, dt);
  for (const cap of j.capitanes) {
    if (cap.fin) continue;
    cap.stats.tiempo += dt;
    cap.cdAbordaje = Math.max(0, cap.cdAbordaje - dt);
    cap.sacudon = Math.max(0, cap.sacudon - dt * 12);
    cap.cdHabilidad = Math.max(0, cap.cdHabilidad - dt);
    if (cap.habilidad) {
      const h = cap.habilidad, b = cap.barco;
      if (h.id === 'carpinteros' && !b.hundiendo) b.vida = Math.min(b.stats.vidaMax, b.vida + (b.stats.vidaMax * 0.25 / HABILIDADES.carpinteros.dura) * dt);
      h.t -= dt;
      if (h.t <= 0) cap.habilidad = null;
    }
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
  mosquetes(j, dt);
  actualizarKraken(j, dt);
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
    // el barco pone la proa hacia el cursor; las velas las elige el capitán (e.velas, de 0 a 3)
    const d = Math.hypot(e.objetivo.x - b.x, e.objetivo.y - b.y);
    const cerca = b.stats.largo * 0.6 + 15;
    if (d > cerca) b.timon = Math.max(-1, Math.min(1, difAng(Math.atan2(e.objetivo.y - b.y, e.objetivo.x - b.x), b.a) * 2.5));
    else b.timon = 0;
    // una entrada sin "velas" es de una versión anterior del juego: ahí las velas salían de la distancia al cursor
    if (Number.isFinite(e.velas)) b.velas = Math.max(0, Math.min(3, Math.round(e.velas)));
    else b.velas = d <= cerca ? 0 : d < 150 ? 1 : d < 280 ? 2 : 3;
  } else if (e.quieto) { b.timon = 0; b.velas = 0; }
  else if (Number.isFinite(e.velas)) b.velas = Math.max(0, Math.min(3, Math.round(e.velas)));
  // durante un abordaje, el costado trabado contra el otro barco no dispara
  const trabado = cap.gancho && cap.gancho.obj ? (difAng(Math.atan2(cap.gancho.obj.y - b.y, cap.gancho.obj.x - b.x), b.a) > 0 ? 1 : -1) : 0;
  if (e.fuegoTodo) { if (trabado !== -1) disparar(j, b, -1); if (trabado !== 1) disparar(j, b, 1); }
  if (e.fuego && e.fuego !== trabado) disparar(j, b, e.fuego);
  if (e.abordar) { // F: tirar los garfios o, si ya hay pelea, cortar las sogas (las propias o las del que te aborda)
    const meAborda = j.capitanes.find((c) => c.gancho && c.gancho.obj === b);
    if (cap.gancho) { if (cap.gancho.obj && cap.gancho.t > 0.6) cortarSogas(j, cap, false); }
    else if (meAborda) { if (meAborda.gancho.t > 0.6) cortarSogas(j, meAborda, true); }
    else intentarAbordaje(j, cap, e.objetivo);
  }
  if (e.habilidad && cap.cdHabilidad <= 0 && !enPuerto(j, b)) { // R: la habilidad que el capitán eligió en el astillero
    const id = HABILIDADES[b.diseno.habilidad] ? b.diseno.habilidad : 'andanada', h = HABILIDADES[id];
    cap.cdHabilidad = h.espera;
    cap.habilidad = h.dura > 0 ? { id, t: h.dura } : null;
    if (id === 'andanada') { b.recarga['-1'] = 0; b.recarga['1'] = 0; }
    aviso(cap, h.nombre, 'bueno');
  }
  if (e.ordenFlota) {
    cap.ordenFlota = cap.ordenFlota === 'formacion' ? 'ataque' : 'formacion';
    aviso(cap, cap.ordenFlota === 'ataque' ? 'Flota: ¡al ataque!' : 'Flota: en formación, a tu lado', 'info');
  }
  if (e.formacion) { // cambia cómo se ordenan los barcos de tu flota alrededor del tuyo
    cap.formacion = ((cap.formacion || 0) + 1) % FORMACIONES.length;
    aviso(cap, FORMACIONES[cap.formacion].aviso, 'info');
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
  const anclado = b.cap && b.cap.habilidad && b.cap.habilidad.id === 'ancla' && b.cap.barco === b; // ancla de combate: casi quieto y girando rápido
  // velFija: el galeón del tesoro navega a la velocidad justa para llegar al puerto en el tiempo que dura el evento, sople como sople
  const objetivo = b.velFija ? b.velFija * (b.frenoGancho || 1) * (anclado ? 0.12 : 1)
    : (s.velMax * b.velas) / 3 * pocaGente * averia * (b.frenoGancho || 1) * rindeViento(j, b) * (anclado ? 0.12 : 1) * (b.apuro || 1);
  b.frenoGancho = 1; b.apuro = 1;
  b.v += (objetivo - b.v) * Math.min(1, dt * (objetivo > b.v ? 0.7 : 1.1));
  const agarre = 0.3 + 0.7 * Math.min(1, b.v / (s.velMax * 0.45));
  b.a += b.timon * s.giro * (anclado ? 3 : agarre) * dt;
  if (anclado) b.v *= Math.max(0, 1 - 3 * dt);
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
      // los barcos de tu flota no se lastiman contra la costa: es error del timonel de la máquina, no tuyo
      if (b.v > s.velMax * 0.4 && b.golpeIsla <= 0 && b.bando !== 'escolta') {
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

// ¿Es b el barco que está abordando el jefe de esta escolta? Mientras el gancho lo tiene agarrado, la flota no le tira:
// lo querés capturar, no hundir (Nicolás, 15/11/2026: su flota le hundió el barco que estaba abordando).
function abordandoMiJefe(escolta, b) {
  return !!(escolta && escolta.bando === 'escolta' && escolta.cap && escolta.cap.gancho && escolta.cap.gancho.obj === b);
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
      if (abordandoMiJefe(bl.dueno, b)) continue; // tu flota no le pega al barco que estás abordando: pasa de largo
      if (dentroDelCasco(b, bl.x, bl.y, bl.radio)) {
        golpear(j, b, bl);
        pego = true;
        break;
      }
    }
    if (!pego && bl.dueno && bl.dueno.cap) { // los tritones solo los bajan los capitanes
      for (const tr of j.tritones) {
        if (!tr.muerto && Math.hypot(tr.x - bl.x, tr.y - bl.y) < 30 + bl.radio) {
          tr.muerto = true; pego = true;
          textoFlotante(j, tr.x, tr.y, '¡Tritón abatido!', '#9be7c4');
          emitir(j, { k: 's', x: Math.round(tr.x), y: Math.round(tr.y), r: 10 });
          break;
        }
      }
    }
    if (!pego && bl.dueno && bl.dueno.cap && krakenAlAlcance(j, bl.x, bl.y, bl.radio)) { golpearKraken(j, bl); pego = true; } // al Kraken solo le pegan los capitanes y sus flotas
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

const BAJAS_CASCO = 0.75; // parte de la tripulación de un bot que cae a lo largo de todo su casco (a cero de casco le queda un cuarto)

function golpear(j, b, bl) {
  // mientras le quede un guardia, el galeón del tesoro no recibe daño: primero hay que hundirlos
  if (b.convoy && b.bando === 'enemigo' && guardiasDe(j, b) > 0) {
    emitir(j, { k: 'g', x: Math.round(bl.x), y: Math.round(bl.y) });
    const quien = bl.dueno && bl.dueno.cap ? bl.dueno.cap : null;
    if (quien && Math.random() < 0.35) textoFlotante(j, bl.x, bl.y - 8, 'Primero los guardias', '#ffd166', quien);
    return;
  }
  b.vida -= bl.dano;
  b.ultimoGolpe = j.t;
  const agresor = bl.dueno && bl.dueno.cap ? bl.dueno.cap : null;
  if (agresor) b.ultimoAgresor = agresor;
  if (Math.random() < bl.tripu && b.trip > 0) b.trip -= 1;
  // A los bots el casco castigado también les baja la gente (Cristian, 13/11/2026): cada punto de casco que pierden se lleva
  // su parte de la tripulación, así un bot medio hundido ya no tiene la cubierta llena y abordarlo vale la pena.
  if (!b.cap && b.trip > 1) {
    b.bajasCasco = (b.bajasCasco || 0) + (bl.dano / b.stats.vidaMax) * b.stats.tripMax * BAJAS_CASCO;
    while (b.bajasCasco >= 1 && b.trip > 1) { b.bajasCasco--; b.trip--; }
  }
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
    if (b.convoy) { aviso(j, '¡Cayó el galeón del tesoro! El oro quedó flotando por todos lados', 'bueno'); marcaTesoro(j, agresor); }
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
// Con F el gancho sale volando recto hacia el cursor: hay que apuntarle al casco del otro barco y estar a tiro
// (ABORDAJE.alcance). Si le pega, lo engancha. Después viene la pelea, que dura varios segundos: las dos tripulaciones pierden gente según
// su fuerza, ese costado no puede disparar y cualquiera de los dos puede cortar las sogas con F.
export const ABORDAJE = {
  alcance: 210, // hasta dónde vuela el gancho (antes de la pelea por tripulación llegaba a 250 y se podía tirar de muy lejos)
  vuelo: 520, // velocidad del gancho
  bajasRival: 0.09, bajasPropias: 0.07, // parte de la tripulación inicial que cae por segundo en una pelea pareja
  rendicion: 0.25, // el rival se rinde cuando le queda esta parte de su gente
  retirada: 0.3, // y tu gente se retira cuando le queda esta
  cortar: 0.1, // gente que pierde el que corta las sogas
};
export const ALCANCE_GANCHO = ABORDAJE.alcance;

const entreCascos = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) - (a.stats.ancho + b.stats.ancho) / 2;

// Para la ayuda en pantalla: el rival que está bajo el cursor (con margen generoso) o, si el cursor no está sobre
// ninguno, el rival a tiro de gancho más cercano al cursor.
function barcoBajo(j, cap, p) {
  if (!p) return null;
  const yo = cap.barco, mio = equipoDe(yo);
  let bajo = null, bajoD = Infinity, aTiro = null, aTiroD = Infinity;
  for (const b of j.barcos) {
    if (b.hundiendo || b.cap === cap || equipoDe(b) === mio || b.convoy) continue; // el galeón del tesoro no se aborda
    const dc = Math.hypot(b.x - p.x, b.y - p.y);
    if (dc < b.stats.largo * 0.75 && dc < bajoD) { bajo = b; bajoD = dc; }
    if (entreCascos(yo, b) <= ABORDAJE.alcance && dc < aTiroD) { aTiro = b; aTiroD = dc; }
  }
  return bajo || aTiro;
}

// Para la pantalla: a qué barco irían los garfios, si está a tiro y cómo viene la mano
export function candidatoAbordaje(j, p) {
  const yo = j.jugador;
  if (!yo || yo.hundiendo || (j.reglas && j.reglas.abordajes === false)) return null;
  const b = barcoBajo(j, j.yo, p);
  if (!b) return null;
  const r = (yo.trip * yo.stats.abordaje) / Math.max(1, b.trip * b.stats.abordaje * 1.1);
  return { b, cerca: entreCascos(yo, b) <= ABORDAJE.alcance, ventaja: r > 1.3 ? 'ventaja' : r > 0.8 ? 'parejo' : 'desventaja' };
}

// El gancho sale recto hacia el cursor: hay que apuntarle al casco
function intentarAbordaje(j, cap, objetivo) {
  if (cap.gancho || cap.cdAbordaje > 0 || !objetivo) return;
  if (j.reglas && j.reglas.abordajes === false) return aviso(cap, 'En esta partida no hay abordajes', 'info');
  const yo = cap.barco;
  if (enPuerto(j, yo)) return;
  const a = Math.atan2(objetivo.y - yo.y, objetivo.x - yo.x);
  cap.gancho = { fase: 'vuelo', x: yo.x, y: yo.y, vx: Math.cos(a) * ABORDAJE.vuelo, vy: Math.sin(a) * ABORDAJE.vuelo, lejos: 0, obj: null, t: 0 };
}

function soltarGancho(cap, espera, texto) {
  cap.gancho = null;
  cap.cdAbordaje = espera;
  if (texto) aviso(cap, texto, 'info');
}

// El que corta las sogas se suelta, pero deja gente en el intento
function cortarSogas(j, cap, porRival) {
  const e = cap.gancho.obj, corta = porRival ? e : cap.barco;
  corta.trip = Math.max(1, corta.trip - Math.max(1, Math.round(corta.trip * ABORDAJE.cortar)));
  soltarGancho(cap, 5, porRival ? 'Te cortaron las sogas' : 'Cortaste las sogas y te soltaste');
  if (porRival && e.cap) aviso(e.cap, 'Cortaste las sogas y te soltaste', 'info');
}

function actualizarGancho(j, cap, dt) {
  const g = cap.gancho;
  if (!g) return;
  const yo = cap.barco;
  if (g.fase === 'vuelo') { // todavía en el aire: engancha al primer rival que toca
    if (yo.hundiendo) return soltarGancho(cap, 2);
    g.t += dt;
    g.x += g.vx * dt; g.y += g.vy * dt; g.lejos += ABORDAJE.vuelo * dt;
    const mio = equipoDe(yo);
    for (const b of j.barcos) {
      if (b.cap === cap || b.hundiendo || equipoDe(b) === mio || (b.cap && enPuerto(j, b)) || !dentroDelCasco(b, g.x, g.y, 8)) continue;
      // el galeón del tesoro no se aborda nunca: se lo hunde a cañonazos (Cristian, 13/11/2026)
      if (b.convoy) return soltarGancho(cap, 2, 'El galeón del tesoro no se aborda: hundilo a cañonazos');
      cap.gancho = { fase: 'enganchado', obj: b, t: 0, x: b.x, y: b.y, yo0: yo.trip, el0: b.trip, acYo: 0, acEl: 0, bajas: 0 };
      aviso(cap, '¡Garfios al {barco}! Empieza el abordaje', 'bueno', { barco: b.nombre });
      if (esInsignia(b)) aviso(b.cap, '¡{nombre} te aborda! Peleá o cortá las sogas con F', 'malo', { nombre: cap.nombre });
      return;
    }
    if (g.lejos > ABORDAJE.alcance || j.mundo.islas.some((i) => Math.hypot(i.x - g.x, i.y - g.y) < i.r)) soltarGancho(cap, 3, 'Erraste el gancho');
    return;
  }
  const e = g.obj;
  if (yo.hundiendo || e.hundiendo || e.cap === cap || !j.barcos.includes(e)) return soltarGancho(cap, 2);
  g.t += dt; g.x = e.x; g.y = e.y;
  // las sogas traban a los dos barcos y los van arrimando; el más chico se mueve más
  yo.frenoGancho = 0.2; e.frenoGancho = 0.2;
  const d = Math.hypot(e.x - yo.x, e.y - yo.y), junto = (yo.stats.ancho + e.stats.ancho) * 0.5 + 14;
  if (d > junto + 220) return soltarGancho(cap, 4, 'Se cortaron las sogas');
  if (d > junto) {
    const mYo = yo.stats.largo ** 2, mEl = e.stats.largo ** 2, tiron = 45 * dt, nx = (e.x - yo.x) / (d || 1), ny = (e.y - yo.y) / (d || 1);
    e.x -= nx * tiron * (mYo / (mYo + mEl)); e.y -= ny * tiron * (mYo / (mYo + mEl));
    yo.x += nx * tiron * (mEl / (mYo + mEl)); yo.y += ny * tiron * (mEl / (mYo + mEl));
  }
  // la pelea: cada bando pierde gente según la fuerza del otro
  const fYo = yo.trip * yo.stats.abordaje, fEl = e.trip * e.stats.abordaje * 1.1, parte = fYo / Math.max(1, fYo + fEl);
  g.acEl += g.el0 * ABORDAJE.bajasRival * 2 * parte * dt;
  g.acYo += g.yo0 * ABORDAJE.bajasPropias * 2 * (1 - parte) * dt;
  while (g.acEl >= 1 && e.trip > 0) { g.acEl--; e.trip--; }
  while (g.acYo >= 1 && yo.trip > 1) { g.acYo--; yo.trip--; g.bajas++; }
  if (e.trip <= Math.max(1, g.el0 * ABORDAJE.rendicion)) { cap.gancho = null; cap.cdAbordaje = 5; return resolverAbordaje(j, cap, e, true, g.bajas); }
  if (yo.trip <= Math.max(1, g.yo0 * ABORDAJE.retirada) || g.t > 30) { cap.gancho = null; cap.cdAbordaje = 6; return resolverAbordaje(j, cap, e, false, g.bajas); }
}

// Fin de la pelea. gano: el rival se rindió. bajas: la gente que perdiste peleando.
function resolverAbordaje(j, cap, e, gano, bajas) {
  const dueno = e.cap; // null si es un bot
  if (!gano) {
    aviso(cap, '¡Abordaje rechazado! Perdiste {n} marineros. Bajales gente a cañonazos y probá de nuevo', 'malo', { n: bajas });
    if (dueno) aviso(dueno, '¡Rechazaste el abordaje de {nombre}!', 'bueno', { nombre: cap.nombre });
    return;
  }
  ganarOro(j, cap, e.oro, e.x, e.y);
  e.oro = 0;
  const escoltas = j.barcos.filter((b) => b.cap === cap && b.bando === 'escolta' && !b.hundiendo).length;
  if (escoltas < cap.escoltasMax) {
    // el barco cambia de dueño
    if (dueno && esInsignia(e)) perderInsignia(j, dueno, cap, false);
    else if (dueno) aviso(dueno, '{nombre} te capturó el {barco}', 'malo', { nombre: cap.nombre, barco: e.nombre });
    if (e.convoy) marcaTesoro(j, cap); // capturar el galeón del tesoro también cuenta para la maldición
    e.cap = cap;
    e.bando = 'escolta';
    e.convoy = false;
    e.vida = Math.max(e.vida, e.stats.vidaMax * 0.4);
    e.trip = Math.max(4, Math.round(e.stats.tripMax * 0.4));
    e.bandera = VERDE;
    e.ia = { estado: 'sigue' };
    e.ultimoAgresor = null;
    e.equipo = null;
    e.ver = (e.ver || 0) + 1; // cambió de equipo: en línea hay que volver a mandarlo
    cap.stats.capturados++;
    aviso(cap, '¡Abordaje ganado! El {barco} se suma a tu flota (−{n} marineros)', 'bueno', { barco: e.nombre, n: bajas });
  } else {
    e.ultimoAgresor = cap;
    hundir(j, e);
    aviso(cap, '¡Abordaje ganado! Flota llena: lo saqueaste y lo hundiste (−{n} marineros)', 'bueno', { n: bajas });
  }
}

// ---------- IA ----------
// Un bot que quiere andar y no avanza está trabado contra una costa u otro barco: durante unos segundos
// deja lo que estaba haciendo y sale derecho hacia el lado contrario a la tierra más cercana.
function bloqueado(j, b, dt) {
  if (b.escape > 0) {
    b.escape -= dt;
    timonHacia(b, b.rumboEscape);
    b.velas = 3;
    return true;
  }
  const trabado = b.velas > 0 && b.v < 14 && !(b.frenoGancho < 1);
  b.atasco = trabado ? (b.atasco || 0) + dt : 0;
  if (b.atasco > 2.2) {
    let cerca = null, cd = Infinity;
    for (const i of j.mundo.islas) { const d = Math.hypot(i.x - b.x, i.y - b.y) - i.r; if (d < cd) { cd = d; cerca = i; } }
    b.rumboEscape = cerca && cd < 260 ? Math.atan2(b.y - cerca.y, b.x - cerca.x) + azar.rango(-0.5, 0.5) : b.a + Math.PI * 0.6;
    b.escape = 3.5; b.atasco = 0;
  }
  return false;
}

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
    if (o.hundiendo || equipoDe(o) === mio || abordandoMiJefe(b, o)) continue;
    if (!b.cap && !o.cap && (mio === 'tesoro' || equipoDe(o) === 'tesoro')) continue; // el tesoro es asunto de los capitanes
    if (Math.abs(o.x - b.x) > radio || Math.abs(o.y - b.y) > radio) continue;
    if (Math.hypot(o.x - p.x, o.y - p.y) < p.radio + 60) continue; // el puerto es zona segura
    const d = Math.hypot(o.x - b.x, o.y - b.y);
    if (d < mejorD) { mejor = o; mejorD = d; }
  }
  return mejor ? { o: mejor, d: mejorD } : null;
}

function iaEnemigo(j, b, dt) {
  if (b.hundiendo) return;
  if (b.quieto) { b.velas = 0; b.timon = 0; return; } // los barcos de la práctica guiada: anclados, no navegan ni disparan
  const ia = b.ia;
  ia.t -= dt;
  ia.provocado = Math.max(0, (ia.provocado || 0) - dt);
  if (b.convoy) { // el galeón del tesoro no pelea ni huye: lleva el oro al puerto
    const p = j.mundo.puerto;
    if (Math.hypot(b.x - p.x, b.y - p.y) < p.radio + 470) { // llegó: el oro quedó a salvo y los guardias se dispersan
      j.barcos = j.barcos.filter((x) => x !== b && !(x.bando === 'enemigo' && x.ia && x.ia.lider === b)); // entra al puerto con sus guardias
        aviso(j, 'El galeón del tesoro llegó al puerto con todo el oro. Ya zarpará otro', 'info');
      return;
    }
    timonHacia(b, Math.atan2(p.y - b.y, p.x - b.x));
    b.velas = 1;
    // el viaje dura lo que dura el evento (entre 2 y 2 minutos y medio): se ajusta la velocidad a lo que falta, así los rodeos por las islas no lo atrasan
    const falta = Math.hypot(b.x - p.x, b.y - p.y) - p.radio - 470;
    b.velFija = Math.max(14, Math.min(95, falta / Math.max(4, (ia.llega || 0) - j.t)));
    fuegoOportunista(j, b);
    esquivarIslas(j, b);
    return;
  }
  // guardias del tesoro: cuando el galeón cae o lo capturan, se terminó el evento: se retiran y desaparecen
  if (ia.lider && (ia.lider.hundiendo || ia.lider.bando !== 'enemigo')) { ia.lider = null; ia.retirada = 14; }
  if (ia.retirada) {
    ia.retirada -= dt;
    const c = masCercano(j, b, 1600);
    if (ia.retirada <= 0 || !c) { j.barcos = j.barcos.filter((x) => x !== b); return; }
    timonHacia(b, Math.atan2(b.y - c.o.y, b.x - c.o.x));
    b.velas = 3;
    esquivarIslas(j, b);
    return;
  }
  if (bloqueado(j, b, dt)) return;
  const conducta = ENEMIGOS[b.tipo].conducta;
  const radioVista = 560 + (b.nivel || 0) * 120 + (ia.provocado ? 500 : 0);
  const cerca = masCercano(j, b, radioVista);
  const debil = b.vida < b.stats.vidaMax * 0.25;
  if (ia.lider && !ia.lider.hundiendo && ia.lider.bando === 'enemigo') {
    const L = ia.lider;
    // no abandonan al galeón: solo pelean con lo que se le acerca, y si se alejaron de él vuelven a su puesto
    const amenaza = masCercano(j, L, 430), lejos = Math.hypot(b.x - L.x, b.y - L.y) > 330;
    if (amenaza && !lejos) combatir(j, b, amenaza.o, Math.hypot(amenaza.o.x - b.x, amenaza.o.y - b.y));
    else {
      fuegoOportunista(j, b);
      const atras = ia.atras || 0; // los guardias del tesoro van en dos filas
      const tx = L.x - Math.sin(L.a) * 115 * ia.lado - Math.cos(L.a) * atras, ty = L.y + Math.cos(L.a) * 115 * ia.lado - Math.sin(L.a) * atras;
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

// Formaciones de la flota (los barcos que capturaste): dónde va cada uno respecto del tuyo. k = 0, 1, 2… es el número del barco;
// lugar() devuelve [cuánto adelante (negativo = atrás), cuánto al costado (positivo = estribor)].
export const FORMACIONES = [
  { id: 'lado', nombre: 'A tu lado', aviso: 'Formación: a tu lado', lugar: (k) => [-25 - Math.floor(k / 2) * 95, (k % 2 ? 1 : -1) * 90] },
  { id: 'linea', nombre: 'En línea', aviso: 'Formación: en línea, detrás tuyo', lugar: (k) => [-105 * (k + 1), 0] },
  { id: 'cuna', nombre: 'En cuña', aviso: 'Formación: en cuña', lugar: (k) => [-70 * (Math.floor(k / 2) + 1), (k % 2 ? 1 : -1) * 85 * (Math.floor(k / 2) + 1)] },
  { id: 'frente', nombre: 'En frente', aviso: 'Formación: en frente, abriendo paso', lugar: (k) => [110 + Math.floor(k / 2) * 40, (k % 2 ? 1 : -1) * (70 + Math.floor(k / 2) * 95)] },
];

// La flota junta el oro que está a la vista (Cristian, 13/11/2026): si hay cofres flotando cerca tuyo, cada barco va al más
// cercano que no tenga otro barco tuyo más cerca, lo levanta y vuelve a su lugar. Es lo que hace siempre que no está peleando.
export const VISTA_ORO = 650;
function cofreParaEscolta(j, b, lider, escoltas) {
  let mejor = null, mejorD = Infinity;
  for (const c of j.cofres) {
    if (Math.abs(c.x - lider.x) > VISTA_ORO || Math.hypot(c.x - lider.x, c.y - lider.y) > VISTA_ORO) continue;
    if (enTierra(j, c.x, c.y, b.stats.ancho)) continue;
    const d = Math.hypot(c.x - b.x, c.y - b.y);
    if (d >= mejorD) continue;
    if (escoltas.some((o) => o !== b && Math.hypot(c.x - o.x, c.y - o.y) < d)) continue;
    mejor = c; mejorD = d;
  }
  return mejor ? { c: mejor, d: mejorD } : null;
}

function iaEscolta(j, b, dt) {
  if (b.hundiendo) return;
  if (bloqueado(j, b, dt)) return;
  const cap = b.cap, lider = cap.barco;
  const sana = b.vida > b.stats.vidaMax * 0.3;
  const enemigo = cap.ordenFlota === 'ataque' && sana ? masCercano(j, b, 520) : null;
  if (enemigo && Math.hypot(enemigo.o.x - lider.x, enemigo.o.y - lider.y) < 700) {
    combatir(j, b, enemigo.o, enemigo.d);
  } else {
    const escoltas = j.barcos.filter((x) => x.cap === cap && x.bando === 'escolta' && !x.hundiendo);
    const oro = cofreParaEscolta(j, b, lider, escoltas);
    if (oro) {
      // va derecho al cofre y afloja al llegar para no pasarlo de largo
      timonHacia(b, Math.atan2(oro.c.y - b.y, oro.c.x - b.x));
      b.velas = oro.d > 220 ? 3 : oro.d > 90 ? 2 : 1;
      b.apuro = oro.d > 220 ? 1.25 : 1;
      fuegoOportunista(j, b);
      esquivarIslas(j, b);
      return;
    }
    // en formación: a la par del jefe, una de cada lado
    const k = escoltas.indexOf(b);
    // La formación se arma según el rumbo con el que venías navegando, no según la proa del momento: si estás quieto y solo
    // girás, los lugares no dan vueltas alrededor tuyo y la flota se queda donde está (Nicolás, 15/11/2026: parado al lado
    // de una isla giraba y la flota salía a dar vueltas y se estrellaba contra la costa).
    const quieto = lider.v < 30;
    if (!quieto || cap.rumboFlota === undefined) cap.rumboFlota = lider.a;
    const rumbo = cap.rumboFlota, ca = Math.cos(rumbo), sa = Math.sin(rumbo);
    const [atras, lateral] = FORMACIONES[cap.formacion || 0].lugar(k);
    let tx = lider.x + ca * atras - sa * lateral, ty = lider.y + sa * atras + ca * lateral;
    // si el lugar cae sobre una isla (o pegado a la costa), se corre al agua, del lado de afuera
    for (const i of j.mundo.islas) {
      const dx = tx - i.x, dy = ty - i.y, di = Math.hypot(dx, dy) || 1, lim = i.r + b.stats.ancho + 45;
      if (di < lim) { tx = i.x + (dx / di) * lim; ty = i.y + (dy / di) * lim; }
    }
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (quieto) {
      // con el jefe parado: se acercan despacio a su lugar y ahí arrían velas, mirando hacia donde mira él
      timonHacia(b, d > 50 ? Math.atan2(ty - b.y, tx - b.x) : lider.a);
      b.velas = d > 260 ? 3 : d > 120 ? 2 : d > 50 ? 1 : 0;
      b.apuro = d > 420 ? 1.35 : 1;
    } else {
      if (d > 40) timonHacia(b, Math.atan2(ty - b.y, tx - b.x));
      else timonHacia(b, lider.a);
      b.velas = d > 160 ? 3 : d > 90 ? Math.max(2, lider.velas) : lider.velas;
      // Que la flota obedezca enseguida (Nicolás, 14/11/2026): lejos de su lugar, el barco aprieta el paso hasta alcanzarlo.
      // Sin esto un galeón capturado nunca llegaba a formar detrás de una balandra y parecía que no hacía caso.
      b.apuro = d > 420 ? 1.6 : d > 140 ? 1.35 : 1;
    }
    fuegoOportunista(j, b);
    // ya casi en su lugar (que siempre queda en el agua): no da volantazos por la costa de al lado, que lo hacían girar en redondo
    if (d < 140) return;
  }
  esquivarIslas(j, b);
}

// ---------- Flota del tesoro ----------
// cuántos guardias le quedan a un galeón del tesoro (un guardia capturado deja de serlo)
function guardiasDe(j, tesoro) {
  let n = 0;
  for (const g of j.barcos) if (g.bando === 'enemigo' && !g.hundiendo && g.ia && g.ia.lider === tesoro) n++;
  return n;
}

// Evento: cada tanto zarpa UN galeón cargado de oro desde mar adentro hacia el puerto, con cuatro guardias en formación.
// Mientras quede un guardia no se lo puede dañar ni abordar. Si llega al puerto, el oro se pierde hasta el próximo.
function actualizarConvoy(j, dt) {
  if (j.barcos.some((b) => b.convoy && !b.hundiendo && b.bando === 'enemigo')) return;
  j.proxConvoy -= dt;
  if (j.proxConvoy > 0) return;
  j.proxConvoy = azar.rango(200, 260) * (j.mundo.reglas.convoy || 1);
  const { mundo } = j;
  // Zarpa de una de las cuatro puntas del mapa (Nicolás, 13/11/2026: que salga bien de una punta y el viaje dure entre 2 y 2:30).
  // Se prueban las puntas en orden al azar y, en cada una, cada vez más adentro, hasta dar con agua libre.
  const puntas = [[0, 0], [1, 0], [0, 1], [1, 1]].sort(() => azar.rango(-1, 1));
  const lugares = [];
  for (const exigirLejos of [true, false]) for (const margen of [420, 600, 800, 1000]) for (const [px, py] of puntas) {
    lugares.push([px ? mundo.ancho - margen : margen, py ? mundo.alto - margen : margen, exigirLejos]);
  }
  // En los mapas de estrechos las cuatro puntas son tierra: ahí zarpa del borde del mapa, del agua más alejada del puerto.
  const borde = [];
  for (const margen of [420, 700, 1000]) for (let q = margen; q <= mundo.ancho - margen; q += 380) {
    borde.push([q, margen], [q, mundo.alto - margen], [margen, q], [mundo.ancho - margen, q]);
  }
  const alPuerto = ([x, y]) => Math.hypot(x - mundo.puerto.x, y - mundo.puerto.y);
  borde.sort((a, b) => alPuerto(b) - alPuerto(a) + azar.rango(-250, 250));
  for (const exigirLejos of [true, false]) for (const [x, y] of borde) lugares.push([x, y, exigirLejos]);
  for (const [x, y, exigirLejos] of lugares) {
    const nivel = Math.max(2, nivelZona(mundo, x, y));
    if (exigirLejos && !lejosDeCapitanes(j, x, y, 1300)) continue; // mejor que no le aparezca encima a nadie; si no hay otra, igual sale
    if (mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.2 + 200)) continue;
    // ni al lado de un remolino: en Malta y Lepanto hay uno justo en una punta, y el galeón zarpaba, lo chupaba y se hundía solo a los 30 segundos
    if (mundo.remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < w.radio * 2 + 320)) continue;
    const a = Math.atan2(mundo.puerto.y - y, mundo.puerto.x - x); // sale apuntando al puerto
    const d = disenoEnemigo('tesoro', nivel, mundo.reglas.facciones);
    d.refuerzo = 160;
    const tesoro = crearBarco(d, 'enemigo', x, y, { a, velas: 1, bandera: '#c9a227', color: '#f6e7b0', nombre: 'Galeón del tesoro', tipo: 'tesoro', colorVela: '#f3d98b', oro: Math.round(azar.rango(1600, 2200)) });
    tesoro.nivel = nivel;
    tesoro.convoy = true;
    tesoro.ia.llega = j.t + azar.rango(120, 150); // cuándo tiene que estar entrando al puerto
    tesoro.equipo = 'tesoro';
    j.barcos.push(tesoro);
    // guardias sin mejoras de zona: dos corsarios adelante y dos balandros atrás (los galeones de guerra eran imposibles)
    for (const [lado, atras, guardia] of [[-1, -90, 'corsario'], [1, -90, 'corsario'], [-1, 130, 'balandro'], [1, 130, 'balandro']]) {
      const g = crearBarco(disenoEnemigo(guardia, ENEMIGOS[guardia].minNivel, mundo.reglas.facciones), 'enemigo', x - Math.sin(a) * 110 * lado - Math.cos(a) * atras, y + Math.cos(a) * 110 * lado - Math.sin(a) * atras, {
        a, velas: 1, bandera: ENEMIGOS[guardia].color, color: '#e9e1cc', nombre: 'Guardia del tesoro', tipo: guardia,
        oro: Math.round(azar.rango(ENEMIGOS[guardia].oro[0], ENEMIGOS[guardia].oro[1])),
      });
      g.nivel = nivel;
      g.ia.lider = tesoro;
      g.ia.lado = lado;
      g.ia.atras = atras;
      g.equipo = 'tesoro';
      j.barcos.push(g);
    }
    aviso(j, '¡Flota del tesoro! Un galeón lleva el oro al puerto con cuatro guardias. Hundí primero a los guardias. Mirá el minimapa', 'bueno');
    return;
  }
}

// ---------- Tritones ----------
// La tripulación les tira con mosquetes a los tritones que se acercan (Cristian, 13/11/2026): tu barco y los de tu flota,
// solos, sin apuntar. Con más gente en cubierta tiran más seguido. Los cañonazos siguen bajándolos como antes.
export const MOSQUETES = { alcance: 280, cadencia: 0.8, acierto: 0.65 };
function mosquetes(j, dt) {
  if (!j.tritones.length) return;
  for (const b of j.barcos) {
    if (!b.cap || b.hundiendo || b.trip < 2) continue;
    b.mosquete = (b.mosquete || 0) - dt;
    if (b.mosquete > 0) continue;
    let obj = null, od = MOSQUETES.alcance + b.stats.largo * 0.5;
    for (const tr of j.tritones) {
      if (tr.muerto) continue;
      const d = Math.hypot(tr.x - b.x, tr.y - b.y);
      if (d < od) { obj = tr; od = d; }
    }
    if (!obj) { b.mosquete = 0.3; continue; }
    b.mosquete = MOSQUETES.cadencia * Math.max(0.5, Math.min(2.5, b.stats.tripNecesaria / Math.max(1, b.trip))) * azar.rango(0.8, 1.2);
    emitir(j, { k: 'm', x: Math.round(b.x), y: Math.round(b.y), tx: Math.round(obj.x), ty: Math.round(obj.y) });
    if (Math.random() < MOSQUETES.acierto) {
      obj.muerto = true;
      textoFlotante(j, obj.x, obj.y, '¡Tritón abatido!', '#9be7c4');
    }
  }
}

function enTierra(j, x, y, margen = 0) {
  return j.mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r + margen);
}

function actualizarTritones(j, dt) {
  for (const cap of j.capitanes) {
    if (cap.fin) continue;
    const yo = cap.barco;
    const zona = nivelZona(j.mundo, yo.x, yo.y);
    if (zona >= 1) cap.proxTritones -= dt * (zona === 2 ? 1 : 0.35) * (j.mundo.reglas.tritones || 1);
    if (cap.proxTritones > 0 || yo.hundiendo || j.tritones.length > 40) continue;
    cap.proxTritones = azar.rango(40, 70);
    const n = 2 + zona + Math.min(2, Math.floor(cap.stats.tiempo / 360));
    for (let k = 0; k < n; k++) {
      // salen del agua, nunca de adentro de una isla (si no hay lugar en este intento, ese tritón no sale)
      for (let intento = 0; intento < 12; intento++) {
        const ang = azar.rango(0, TAU), d = azar.rango(420, 560);
        const x = yo.x + Math.cos(ang) * d, y = yo.y + Math.sin(ang) * d;
        if (enTierra(j, x, y, 40)) continue;
        j.tritones.push({ x, y, a: 0, t: azar.rango(0, 3), muerto: false });
        break;
      }
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
    const vel = 120, px = tr.x, py = tr.y;
    tr.x += Math.cos(ang) * vel * dt;
    tr.y += Math.sin(ang) * vel * dt;
    // Nadan, no caminan (Nicolás, 15/11/2026: los vio cruzar la tierra): si se meten en la costa, quedan en la orilla
    // y la bordean hacia el lado del barco, como los barcos que rozan una isla.
    let roza = false;
    for (const i of j.mundo.islas) {
      const dx = tr.x - i.x, dy = tr.y - i.y, d = Math.hypot(dx, dy) || 1, lim = i.r + 14;
      if (d >= lim) continue;
      const nx = dx / d, ny = dy / d;
      // la tangente a la costa que apunta hacia el barco
      const s = -ny * (obj.x - tr.x) + nx * (obj.y - tr.y) >= 0 ? 1 : -1, tx = -ny * s, ty = nx * s;
      tr.x = i.x + nx * lim + tx * vel * dt;
      tr.y = i.y + ny * lim + ty * vel * dt;
      tr.a = Math.atan2(ty, tx);
      roza = true;
    }
    // entre dos tierras pegadas el empujón de una puede meterlo en la otra: entonces se queda donde estaba
    if (enTierra(j, tr.x, tr.y)) { tr.x = px; tr.y = py; }
    // trabado contra la costa (una caleta sin salida hacia el barco): al rato se sumerge y se va
    tr.costa = roza ? (tr.costa || 0) + dt : Math.max(0, (tr.costa || 0) - dt);
    if (tr.costa > 10) continue;
    if (!j.eventos && Math.random() < dt * 8) j.particulas.push({ tipo: 'estela', x: tr.x, y: tr.y, t: 0, vida: 0.8, r: 4 });
    if (dentroDelCasco(obj, tr.x, tr.y, 6)) {
      const bajas = Math.max(0, Math.min(obj.trip - 1, azar.entero(1, 2)));
      obj.trip -= bajas;
      textoFlotante(j, tr.x, tr.y, '-{n} marineros', '#ff6b6b', obj.cap, { n: bajas });
      if (esInsignia(obj)) obj.cap.sacudon = 4;
      continue;
    }
    quedan.push(tr);
  }
  j.tritones = quedan;
}

// ---------- El Kraken ----------
// La maldición del tesoro: cada galeón del tesoro que un capitán hunde le deja una marca (desde el 13/11 el galeón ya no se aborda;
// si algún día vuelve a abordarse, capturarlo también cuenta). Con una menos de las que hacen
// falta se le avisa; con la última despierta el Kraken cerca suyo, se hace de noche y hay tormenta (eso lo dibuja la pantalla).
// Es el desafío para el que ya está muy fuerte: mucha vida, pega a todos los barcos que se le cruzan y, si lo hunden, deja muchísimo oro.
// Su ataque principal es la zona marcada: elige un barco a su alcance, marca un círculo en el agua donde está y, cuando el aviso
// se llena, un tentáculo sale de abajo y golpea. Saca más en el centro que en el borde. Los números están en KRAKEN (config.js).
function marcaTesoro(j, cap) {
  if (!cap || cap.fin) return;
  cap.marcasTesoro = (cap.marcasTesoro || 0) + 1;
  if (cap.marcasTesoro === KRAKEN.marcas - 1) avisoLargo(cap, 'Hundiste {n} galeones del tesoro. Si hundís 1 más, cuidado: puede despertar el Kraken', 'malo', { n: cap.marcasTesoro });
  // la última marca lo despierta en actualizarKraken (si ya hay uno en el mar, espera a que ese se vaya)
}

function avisoLargo(quien, texto, tipo, p) {
  aviso(quien, texto, tipo, p);
  for (const c of quien.capitanes || [quien]) { const a = c.avisos[c.avisos.length - 1]; if (a) a.t = 7; }
}

function despertarKraken(j, cap) {
  const m = j.mundo, yo = cap.barco;
  const libre = (x, y) => x > 450 && y > 450 && x < m.ancho - 450 && y < m.alto - 450 && !enTierra(j, x, y, KRAKEN.cuerpo + 180)
    && Math.hypot(x - m.puerto.x, y - m.puerto.y) > m.puerto.radio + 700 && !m.remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < w.radio + 300);
  let x = 0, y = 0, ok = false;
  for (let k = 0; k < 60 && !ok; k++) { // cerca del que lo despertó, pero no encima
    const a = azar.rango(0, TAU), d = azar.rango(600, 900) + k * 12;
    x = yo.x + Math.cos(a) * d; y = yo.y + Math.sin(a) * d; ok = libre(x, y);
  }
  for (let k = 0; k < 300 && !ok; k++) { x = azar.rango(500, m.ancho - 500); y = azar.rango(500, m.alto - 500); ok = libre(x, y); }
  if (!ok) return false;
  const vivos = j.capitanes.filter((c) => !c.fin).length;
  const vidaMax = Math.round(KRAKEN.vida * (1 + KRAKEN.porJugador * Math.max(0, vivos - 1)));
  j.kraken = { x, y, a: Math.atan2(yo.y - y, yo.x - x), vida: vidaMax, vidaMax, t: 0, emerge: 0, zonas: [], prox: KRAKEN.primerAtaque, muerte: 0, sumerge: 0, lejos: 0, furia: false };
  avisoLargo(j, '¡{nombre} despertó al Kraken! Se hace de noche y se larga la tormenta', 'malo', { nombre: cap.nombre });
  emitir(j, { k: 'kd', x: Math.round(x), y: Math.round(y) });
  return true;
}

// ¿Un punto le pega al Kraken? Solo cuando ya asomó y mientras está vivo.
function krakenAlAlcance(j, x, y, margen = 0) {
  const k = j.kraken;
  if (!k || k.muerte || k.sumerge || k.emerge < 0.6) return false;
  return Math.abs(k.x - x) < KRAKEN.cuerpo + margen + 10 && Math.hypot(k.x - x, k.y - y) < KRAKEN.cuerpo + margen;
}

function golpearKraken(j, bl) {
  const k = j.kraken, quien = bl.dueno.cap;
  k.vida -= bl.dano;
  emitir(j, { k: 'kh', x: Math.round(bl.x), y: Math.round(bl.y) });
  if (bl.dano >= 5) textoFlotante(j, bl.x, bl.y - 8, `-${Math.round(bl.dano)}`, '#f0c4d0', quien);
  if (k.vida <= 0) {
    k.vida = 0; k.muerte = 0.0001; k.zonas = [];
    quien.stats.hundidos++;
    aviso(j, '¡El Kraken se hunde! {nombre} le dio el último cañonazo', 'bueno', { nombre: quien.nombre });
    emitir(j, { k: 'km', x: Math.round(k.x), y: Math.round(k.y) });
  }
}

// El daño de un golpe de tentáculo: según el barco (fracción de su vida máxima) y si quedó en el centro o en el borde de la zona
export function danoKraken(b, enCentro) {
  return Math.round(Math.max(KRAKEN.danoMin * (enCentro ? 2 : 1), b.stats.vidaMax * (enCentro ? KRAKEN.danoCentro : KRAKEN.danoBorde)));
}

function actualizarKraken(j, dt) {
  const k = j.kraken;
  if (!k) { // ¿alguien juntó todas las marcas? (si había otro Kraken en el mar, despierta recién ahora)
    const cap = j.capitanes.find((c) => !c.fin && !c.barco.hundiendo && (c.marcasTesoro || 0) >= KRAKEN.marcas);
    if (cap && despertarKraken(j, cap)) cap.marcasTesoro = 0;
    return;
  }
  k.t += dt;
  if (k.muerte) { // la animación de muerte la hace la pantalla; acá, el oro y el final
    k.muerte += dt;
    if (!k.oroSuelto && k.muerte >= KRAKEN.muerteOro) {
      k.oroSuelto = true;
      soltarOro(j, k.x, k.y, KRAKEN.oro, 230, 16);
      avisoLargo(j, '¡Cayó el Kraken! Su oro quedó flotando: es de quien lo junte', 'bueno');
    }
    if (k.muerte >= KRAKEN.muerteDura) j.kraken = null;
    return;
  }
  if (k.sumerge) { k.sumerge += dt; if (k.sumerge >= 3) j.kraken = null; return; }
  k.emerge = Math.min(1, k.emerge + dt / KRAKEN.emerger);

  // a quién persigue: el capitán más cercano que no esté en el puerto
  let obj = null, od = Infinity;
  for (const b of j.barcos) {
    if (!b.cap || b.hundiendo || b.cap.fin || enPuerto(j, b)) continue;
    const d = Math.hypot(b.x - k.x, b.y - k.y);
    if (d < od) { obj = b; od = d; }
  }
  if (!obj || od > KRAKEN.olvida) {
    k.lejos += dt;
    if (k.lejos > KRAKEN.seVa) { k.sumerge = 0.0001; k.zonas = []; aviso(j, 'El Kraken volvió a lo profundo. Por ahora', 'info'); emitir(j, { k: 'ks', x: Math.round(k.x), y: Math.round(k.y) }); return; }
  } else k.lejos = 0;
  if (obj && k.emerge >= 1) { // gira hacia él y se arrima despacio hasta quedar a distancia de golpe, sin meterse en tierra
    const ang = Math.atan2(obj.y - k.y, obj.x - k.x);
    k.a += difAng(ang, k.a) * Math.min(1, dt * 0.8);
    const falta = od - KRAKEN.distancia;
    if (Math.abs(falta) > 30) {
      const paso = Math.sign(falta) * Math.min(Math.abs(falta), KRAKEN.vel * dt);
      const nx = k.x + Math.cos(ang) * paso, ny = k.y + Math.sin(ang) * paso;
      if (nx > 300 && ny > 300 && nx < j.mundo.ancho - 300 && ny < j.mundo.alto - 300 && !enTierra(j, nx, ny, KRAKEN.cuerpo + 40)) { k.x = nx; k.y = ny; }
    }
  }
  // su cuerpo no se atraviesa: empuja a los barcos hacia afuera
  if (k.emerge > 0.6) for (const b of j.barcos) {
    if (b.hundiendo) continue;
    const dx = b.x - k.x, dy = b.y - k.y, d = Math.hypot(dx, dy) || 1, lim = KRAKEN.cuerpo + b.stats.ancho * 0.6;
    if (d < lim) { b.x = k.x + (dx / d) * lim; b.y = k.y + (dy / d) * lim; b.v = Math.min(b.v, b.stats.velMax * 0.45); }
  }

  // la furia: por debajo de cierto resto de vida, más zonas, aviso más corto y ataques más seguidos
  if (!k.furia && k.vida < k.vidaMax * KRAKEN.furia) { k.furia = true; avisoLargo(j, '¡El Kraken está furioso! Ahora marca dos zonas a la vez', 'malo'); }
  k.prox -= dt;
  if (k.emerge >= 1 && k.prox <= 0 && k.zonas.length < (k.furia ? KRAKEN.zonasFuria : KRAKEN.zonas)) {
    // a quién: cualquier barco a su alcance (capitanes, flotas y bots), pero prefiere a los capitanes y sus flotas
    const cerca = j.barcos.filter((b) => !b.hundiendo && !(b.cap && enPuerto(j, b)) && Math.hypot(b.x - k.x, b.y - k.y) < KRAKEN.alcance
      && !k.zonas.some((z) => Math.hypot(z.x - b.x, z.y - b.y) < KRAKEN.radio * 1.5));
    const deCapitanes = cerca.filter((b) => b.cap);
    const lista = deCapitanes.length ? deCapitanes : cerca;
    if (lista.length) {
      const b = lista[azar.entero(0, lista.length - 1)];
      const casco = b.diseno.casco, extra = casco === 'galeon' ? KRAKEN.extraGaleon : casco === 'bergantin' ? KRAKEN.extraBergantin : 0;
      const z = { id: j.proxZona++, x: Math.round(b.x), y: Math.round(b.y), t: 0, aviso: +((KRAKEN.aviso + extra) * (k.furia ? KRAKEN.avisoFuria : 1)).toFixed(2), golpe: false };
      k.zonas.push(z);
      emitir(j, { k: 'kz', x: z.x, y: z.y });
      if (b.cap && esInsignia(b)) aviso(b.cap, '¡El Kraken marcó una zona! Salí del círculo antes de que se llene', 'malo');
      k.prox = azar.rango(KRAKEN.cada[0], KRAKEN.cada[1]) * (k.furia ? KRAKEN.cadaFuria : 1);
    } else k.prox = 0.6;
  }
  for (const z of k.zonas) {
    z.t += dt;
    if (!z.golpe && z.t >= z.aviso) { // el golpe: pega a todo barco que quedó adentro, más en el centro que en el borde
      z.golpe = true;
      emitir(j, { k: 'kg', x: z.x, y: z.y });
      for (const b of j.barcos) {
        if (b.hundiendo || (b.cap && enPuerto(j, b))) continue;
        const d = Math.hypot(b.x - z.x, b.y - z.y);
        if (d > KRAKEN.radio + b.stats.ancho * 0.4) continue;
        const dano = danoKraken(b, d < KRAKEN.radio * KRAKEN.nucleo);
        b.vida -= dano;
        b.ultimoGolpe = j.t;
        b.ultimoAgresor = null; // si lo hunde el Kraken, no es mérito de nadie
        if (b.trip > 2) b.trip -= azar.entero(1, 2); // el golpe se lleva gente al agua
        if (esInsignia(b)) { b.cap.sacudon = Math.max(b.cap.sacudon, 10); aviso(b.cap, '¡El Kraken te golpeó!', 'malo'); }
        textoFlotante(j, b.x, b.y - 30, `-${dano}`, '#ff8f8f');
      }
    }
    // después del golpe el tentáculo queda atravesado un momento: los barcos no lo cruzan
    if (z.golpe && z.t < z.aviso + 0.16 + KRAKEN.queda) for (const b of j.barcos) {
      if (b.hundiendo) continue;
      const dx = b.x - z.x, dy = b.y - z.y, d = Math.hypot(dx, dy) || 1, lim = KRAKEN.radio * 0.5 + b.stats.ancho * 0.5;
      if (d < lim) { b.x = z.x + (dx / d) * lim; b.y = z.y + (dy / d) * lim; b.v = Math.min(b.v, b.stats.velMax * 0.4); }
    }
  }
  k.zonas = k.zonas.filter((z) => z.t < z.aviso + KRAKEN.queda + 0.8);
}
