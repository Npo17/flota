// Simulación del mar: barcos, balas, bots, abordajes, remolinos y tritones.
import { ENEMIGOS, ESCOLTAS_INICIALES } from './config.js';
import { crearBarco, disenoEnemigo } from './barcos.js';
import { nivelZona } from './mundo.js';
import { azar } from './rng.js';

const TAU = Math.PI * 2;
const ENEMIGOS_VIVOS = 18;

export function difAng(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function crearPartida(mundo, diseno, oroInicial) {
  const p = mundo.puerto;
  const jugador = crearBarco(diseno, 'jugador', p.x, p.y + 60, { a: Math.PI / 2, velas: 0, bandera: '#1f7a3f', nombre: 'Tu barco' });
  const j = {
    mundo,
    t: 0,
    barcos: [jugador],
    jugador,
    balas: [],
    pendientes: [], // cañonazos escalonados de una andanada
    particulas: [],
    cofres: [],
    tritones: [],
    textos: [],
    avisos: [],
    oroBodega: 0,
    oroPuerto: oroInicial,
    escoltasMax: ESCOLTAS_INICIALES,
    stats: { hundidos: 0, capturados: 0, saqueado: 0, tiempo: 0 },
    proxTritones: azar.rango(25, 45),
    cdAbordaje: 0,
    gancho: null,
    ordenFlota: 'formacion', // 'formacion' | 'ataque'
    proxConvoy: azar.rango(70, 100),
    fin: false,
  };
  for (let i = 0; i < ENEMIGOS_VIVOS; i++) spawnEnemigo(j, true);
  return j;
}

export function aviso(j, texto, tipo = 'info') {
  j.avisos.push({ texto, tipo, t: 3.2 });
  if (j.avisos.length > 4) j.avisos.shift();
}

function textoFlotante(j, x, y, texto, color) {
  j.textos.push({ x, y, texto, color, t: 1.6 });
}

// ---------- Enemigos ----------
function spawnEnemigo(j, inicial) {
  const { mundo, jugador } = j;
  for (let intento = 0; intento < 60; intento++) {
    const x = azar.rango(250, mundo.ancho - 250), y = azar.rango(250, mundo.alto - 250);
    if (Math.hypot(x - mundo.puerto.x, y - mundo.puerto.y) < 900) continue;
    const dj = Math.hypot(x - jugador.x, y - jugador.y);
    if (dj < (inicial ? 1100 : 1300)) continue;
    if (mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.2 + 80)) continue;
    const nivel = nivelZona(mundo, x, y);
    const tipo = elegirTipo(nivel);
    const e = ENEMIGOS[tipo];
    const b = crearBarco(disenoEnemigo(tipo, nivel), 'enemigo', x, y, {
      a: azar.rango(0, TAU), velas: 1, bandera: e.color, color: tipo === 'tesoro' ? '#f6e7b0' : '#e9e1cc',
      nombre: e.nombre, tipo, colorVela: tipo === 'tesoro' ? '#f3d98b' : null, oro: Math.round(azar.rango(e.oro[0], e.oro[1]) * (1 + nivel * 0.25)),
    });
    b.nivel = nivel;
    j.barcos.push(b);
    return;
  }
}

function elegirTipo(nivel) {
  const pesos = nivel === 0
    ? { mercante: 6, balandro: 4 }
    : nivel === 1
      ? { mercante: 3, balandro: 3, corsario: 4, tesoro: 1 }
      : { balandro: 1, corsario: 3, cazador: 3, galeonGuerra: 3, tesoro: 1.5 };
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(pesos)) { r -= w; if (r <= 0) return k; }
  return 'mercante';
}

// ---------- Disparos ----------
export function disparar(j, b, lado) {
  if (b.hundiendo || b.recarga[lado] > 0 || b.diseno.canones < 2) return false;
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
    j.balas.push({
      x, y, vx: Math.cos(ang) * vel + ca * b.v * 0.5, vy: Math.sin(ang) * vel + sa * b.v * 0.5,
      vida, vidaTotal: vida, dano: s.dano, tripu: s.tripu, radio: s.radioBala,
      equipo: equipoDe(b), dueno: b,
    });
  }
  for (let k = 0; k < 4; k++) {
    j.particulas.push({ tipo: 'humo', x: x + nx * 6, y: y + ny * 6, vx: nx * azar.rango(20, 60) + azar.rango(-10, 10), vy: ny * azar.rango(20, 60) + azar.rango(-10, 10), t: 0, vida: azar.rango(0.8, 1.4), r: azar.rango(5, 9) });
  }
  j.particulas.push({ tipo: 'fogonazo', x: x + nx * 4, y: y + ny * 4, t: 0, vida: 0.12, r: 9 });
  if (b === j.jugador) j.sacudon = Math.max(j.sacudon || 0, 2.5);
}

export function equipoDe(b) {
  return b.bando === 'enemigo' ? 'enemigo' : 'aliado';
}

function dentroDelCasco(b, x, y, margen = 0) {
  const dx = x - b.x, dy = y - b.y;
  const ca = Math.cos(b.a), sa = Math.sin(b.a);
  const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
  const A = b.stats.largo / 2 + margen, B = b.stats.ancho / 2 + margen;
  return (lx * lx) / (A * A) + (ly * ly) / (B * B) <= 1;
}

// ---------- Paso de simulación ----------
export function actualizar(j, dt, entrada) {
  if (j.fin) {
    j.t += dt;
    actualizarHundidos(j, dt);
    actualizarParticulas(j, dt);
    return;
  }
  j.t += dt;
  j.stats.tiempo += dt;
  j.cdAbordaje = Math.max(0, j.cdAbordaje - dt);
  j.sacudon = Math.max(0, (j.sacudon || 0) - dt * 12);

  controlarJugador(j, entrada, dt);
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

  actualizarGancho(j, dt);
  moverBalas(j, dt);
  actualizarConvoy(j, dt);
  actualizarTritones(j, dt);
  actualizarCofres(j, dt);
  actualizarHundidos(j, dt);
  actualizarParticulas(j, dt);

  for (const a of j.avisos) a.t -= dt;
  j.avisos = j.avisos.filter((a) => a.t > 0);
  for (const t of j.textos) { t.t -= dt; t.y -= 22 * dt; }
  j.textos = j.textos.filter((t) => t.t > 0);

  const vivos = j.barcos.filter((b) => b.bando === 'enemigo' && !b.hundiendo).length;
  if (vivos < ENEMIGOS_VIVOS && Math.random() < dt * 0.5) spawnEnemigo(j, false);
}

function controlarJugador(j, e, dt) {
  const b = j.jugador;
  if (b.hundiendo) return;
  if (e.objetivo) {
    // el barco navega hacia el cursor: cuanto más lejos, más velas
    const d = Math.hypot(e.objetivo.x - b.x, e.objetivo.y - b.y);
    const cerca = b.stats.largo * 0.6 + 15;
    if (d > cerca) b.timon = Math.max(-1, Math.min(1, difAng(Math.atan2(e.objetivo.y - b.y, e.objetivo.x - b.x), b.a) * 2.5));
    else b.timon = 0;
    b.velas = d <= cerca ? 0 : d < 150 ? 1 : d < 280 ? 2 : 3;
  }
  if (e.fuegoTodo) { disparar(j, b, -1); disparar(j, b, 1); }
  if (e.fuego) disparar(j, b, e.fuego);
  if (e.abordar) lanzarGancho(j, e.objetivo);
  if (e.ordenFlota) {
    j.ordenFlota = j.ordenFlota === 'formacion' ? 'ataque' : 'formacion';
    aviso(j, j.ordenFlota === 'ataque' ? 'Flota: ¡al ataque!' : 'Flota: en formación, a tu lado', 'info');
  }
}

function moverBarco(j, b, dt) {
  if (b.hundiendo) { b.v *= 1 - dt; b.x += Math.cos(b.a) * b.v * dt; b.y += Math.sin(b.a) * b.v * dt; return; }
  const s = b.stats;
  for (const k of ['-1', '1']) b.recarga[k] = Math.max(0, b.recarga[k] - dt);
  const pocaGente = b.trip < s.tripMax * 0.25 ? 0.65 : 1;
  // casco roto = barco lento: por debajo del 70 % de vida va perdiendo hasta la mitad de velocidad
  const averia = 0.5 + 0.5 * Math.min(1, b.vida / (s.vidaMax * 0.7));
  const frenoGancho = j.gancho && j.gancho.fase === 'enganchado' && j.gancho.obj === b ? 0.3 + 0.55 * Math.min(1, b.vida / s.vidaMax) : 1;
  const objetivo = (s.velMax * b.velas) / 3 * pocaGente * averia * frenoGancho;
  b.v += (objetivo - b.v) * Math.min(1, dt * (objetivo > b.v ? 0.7 : 1.1));
  const agarre = 0.3 + 0.7 * Math.min(1, b.v / (s.velMax * 0.45));
  b.a += b.timon * s.giro * agarre * dt;
  let vx = Math.cos(b.a) * b.v, vy = Math.sin(b.a) * b.v;

  // remolinos: te chupan y te hacen girar
  for (const w of j.mundo.remolinos) {
    const dx = w.x - b.x, dy = w.y - b.y, d = Math.hypot(dx, dy);
    if (d < w.radio) {
      const f = 1 - d / w.radio;
      const nx = dx / (d || 1), ny = dy / (d || 1);
      vx += nx * 95 * f + -ny * 85 * f * w.giro;
      vy += ny * 95 * f + nx * 85 * f * w.giro;
      b.a += 0.9 * f * dt * w.giro;
      if (d < 55) {
        b.vida -= 16 * dt;
        if (Math.random() < dt * 0.6 && b.trip > 1) b.trip -= 1;
        if (b === j.jugador && Math.random() < dt) aviso(j, '¡El remolino te está tragando!', 'malo');
      }
      if (b === j.jugador && !b.enRemolino) { b.enRemolino = true; aviso(j, '¡Remolino! Alejá el cursor y salí de costado', 'malo'); }
    } else if (b === j.jugador && d > w.radio + 60 && b.enRemolino && cercaDeRemolino(j, b) === null) b.enRemolino = false;
  }
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
        if (b === j.jugador) aviso(j, i.tipo === 'iceberg' ? '¡Chocaste un iceberg!' : '¡Encallaste contra la costa!', 'malo');
      }
      b.v = Math.min(b.v, s.velMax * 0.45); // roza la costa y sigue, sin quedar clavado
    }
  }
  // carenar: parado junto a una isla y sin recibir golpes, la tripulación repara (hasta el 75 %)
  b.reparando = false;
  if (b.bando !== 'enemigo' && b.v < 22 && b.vida < s.vidaMax * 0.75 && j.t - (b.ultimoGolpe ?? -99) > 4) {
    if (j.mundo.islas.some((i) => i.tipo !== 'iceberg' && Math.hypot(b.x - i.x, b.y - i.y) < i.r + 130)) {
      b.vida = Math.min(s.vidaMax * 0.75, b.vida + 4 * dt);
      b.reparando = true;
    }
  }
  b.x = Math.max(60, Math.min(j.mundo.ancho - 60, b.x));
  b.y = Math.max(60, Math.min(j.mundo.alto - 60, b.y));

  // estela
  const aLaVista = Math.abs(b.x - j.jugador.x) < 1300 && Math.abs(b.y - j.jugador.y) < 1000;
  if (aLaVista && b.v > 30 && Math.random() < dt * 22) {
    const ca = Math.cos(b.a), sa = Math.sin(b.a);
    j.particulas.push({ tipo: 'estela', x: b.x - ca * s.largo * 0.5 + azar.rango(-4, 4), y: b.y - sa * s.largo * 0.5 + azar.rango(-4, 4), t: 0, vida: 1.6, r: s.ancho * 0.25 });
  }
  if (aLaVista && b.vida < s.vidaMax * 0.45 && Math.random() < dt * 6) {
    j.particulas.push({ tipo: 'humoNegro', x: b.x + azar.rango(-10, 10), y: b.y + azar.rango(-6, 6), vx: azar.rango(-8, 8), vy: azar.rango(-18, -6), t: 0, vida: 1.8, r: azar.rango(4, 8) });
  }
  if (b.vida <= 0) hundir(j, b);
}

function cercaDeRemolino(j, b) {
  for (const w of j.mundo.remolinos) if (Math.hypot(w.x - b.x, w.y - b.y) < w.radio + 40) return w;
  return null;
}

function separarBarcos(j) {
  const bs = j.barcos;
  for (let a = 0; a < bs.length; a++) {
    for (let c = a + 1; c < bs.length; c++) {
      const A = bs[a], B = bs[c];
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
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
      if (dentroDelCasco(b, bl.x, bl.y, bl.radio)) {
        golpear(j, b, bl);
        pego = true;
        break;
      }
    }
    if (!pego && bl.equipo === 'aliado') {
      for (const tr of j.tritones) {
        if (!tr.muerto && Math.hypot(tr.x - bl.x, tr.y - bl.y) < 14 + bl.radio) {
          tr.muerto = true; pego = true;
          textoFlotante(j, tr.x, tr.y, '¡Tritón abatido!', '#9be7c4');
          salpicar(j, tr.x, tr.y, 10);
          break;
        }
      }
    }
    if (pego) continue;
    if (bl.vida <= 0) { salpicar(j, bl.x, bl.y, 6 + bl.radio); continue; }
    if (j.mundo.islas.some((i) => Math.hypot(i.x - bl.x, i.y - bl.y) < i.r * 0.95)) {
      // la bala termina en la arena
      j.particulas.push({ tipo: 'polvo', x: bl.x, y: bl.y, t: 0, vida: 0.6, r: 8 });
      continue;
    }
    quedan.push(bl);
  }
  j.balas = quedan;
}

function golpear(j, b, bl) {
  b.vida -= bl.dano;
  b.ultimoGolpe = j.t;
  if (Math.random() < bl.tripu && b.trip > 0) b.trip -= 1;
  for (let k = 0; k < 4; k++) {
    j.particulas.push({ tipo: 'astilla', x: bl.x, y: bl.y, vx: azar.rango(-90, 90), vy: azar.rango(-90, 90), t: 0, vida: 0.5, r: 2 });
  }
  j.particulas.push({ tipo: 'humo', x: bl.x, y: bl.y, vx: 0, vy: -10, t: 0, vida: 0.7, r: 6 });
  if (b === j.jugador) j.sacudon = Math.max(j.sacudon || 0, 5);
  if (bl.dueno === j.jugador && bl.dano >= 5) textoFlotante(j, bl.x, bl.y - 8, `-${Math.round(bl.dano)}`, '#ffd166');
  if (b.bando === 'enemigo') b.ia.provocado = 8;
}

function salpicar(j, x, y, r) {
  j.particulas.push({ tipo: 'salpicon', x, y, t: 0, vida: 0.7, r });
}

function hundir(j, b) {
  if (b.hundiendo) return;
  b.hundiendo = 0.0001;
  b.vida = 0;
  for (let k = 0; k < 14; k++) {
    j.particulas.push({ tipo: k % 2 ? 'astilla' : 'humoNegro', x: b.x + azar.rango(-20, 20), y: b.y + azar.rango(-10, 10), vx: azar.rango(-60, 60), vy: azar.rango(-60, 60), t: 0, vida: azar.rango(0.6, 1.6), r: azar.rango(2, 8) });
  }
  if (b.bando === 'enemigo') {
    j.stats.hundidos++;
    const partes = b.oro <= 0 ? 0 : b.convoy ? 9 : b.oro > 200 ? 3 : b.oro > 90 ? 2 : 1;
    const abre = b.convoy ? 110 : 25;
    for (let k = 0; k < partes; k++) {
      j.cofres.push({ x: b.x + azar.rango(-abre, abre), y: b.y + azar.rango(-abre, abre), oro: Math.round(b.oro / partes), t: 0 });
    }
    if (b.convoy) aviso(j, '¡Cayó el galeón del tesoro! El oro quedó flotando por todos lados', 'bueno');
    else if (partes && Math.hypot(b.x - j.jugador.x, b.y - j.jugador.y) < 900) aviso(j, `¡Hundiste un ${b.nombre}! Juntá el botín`, 'bueno');
  } else if (b.bando === 'escolta') {
    aviso(j, `Perdiste tu ${b.nombre}`, 'malo');
  } else if (b === j.jugador) {
    // Si tenés escoltas, tomás el mando de una
    const relevo = j.barcos.find((x) => x.bando === 'escolta' && !x.hundiendo);
    const perdido = Math.round(j.oroBodega / 2);
    if (relevo) {
      relevo.bando = 'jugador';
      relevo.bandera = '#1f7a3f';
      b.bando = 'escolta';
      j.jugador = relevo;
      j.oroBodega -= perdido;
      aviso(j, `¡Te hundieron! Tomás el mando del ${relevo.nombre}. Se perdieron ${perdido} de oro`, 'malo');
    } else {
      j.oroBodega = 0;
      j.fin = true;
      j.finEn = j.t;
    }
  }
}

function actualizarHundidos(j, dt) {
  for (const b of j.barcos) if (b.hundiendo) b.hundiendo += dt;
  j.barcos = j.barcos.filter((b) => !b.hundiendo || b.hundiendo < 3);
}

function actualizarCofres(j, dt) {
  const quedan = [];
  for (const c of j.cofres) {
    c.t += dt;
    const juntador = j.barcos.find((b) => b.bando !== 'enemigo' && !b.hundiendo && Math.hypot(b.x - c.x, b.y - c.y) < b.stats.largo * 0.5 + 22);
    if (juntador) {
      j.oroBodega += c.oro;
      j.stats.saqueado += c.oro;
      textoFlotante(j, c.x, c.y, `+${c.oro} oro`, '#ffd166');
      continue;
    }
    if (c.t < 75) quedan.push(c);
  }
  j.cofres = quedan;
}

function actualizarParticulas(j, dt) {
  for (const p of j.particulas) {
    p.t += dt;
    if (p.vx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; }
  }
  j.particulas = j.particulas.filter((p) => p.t < p.vida);
  if (j.particulas.length > 900) j.particulas.splice(0, j.particulas.length - 900);
}

// ---------- Abordaje con gancho ----------
export const ALCANCE_GANCHO = 250;

// El enemigo más cercano al que le llega el gancho, con una idea de cómo viene la pelea
export function candidatoAbordaje(j) {
  const yo = j.jugador;
  if (yo.hundiendo) return null;
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
function lanzarGancho(j, objetivo) {
  if (j.gancho || j.cdAbordaje > 0 || !objetivo) return;
  const yo = j.jugador;
  const a = Math.atan2(objetivo.y - yo.y, objetivo.x - yo.x);
  j.gancho = { fase: 'vuelo', x: yo.x, y: yo.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, lejos: 0, obj: null, t: 0 };
}

function soltarGancho(j, espera, texto) {
  j.gancho = null;
  j.cdAbordaje = espera;
  if (texto) aviso(j, texto, 'info');
}

function actualizarGancho(j, dt) {
  const g = j.gancho;
  if (!g) return;
  const yo = j.jugador;
  g.t += dt;
  if (g.fase === 'vuelo') {
    if (yo.hundiendo) return soltarGancho(j, 2);
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.lejos += 520 * dt;
    for (const b of j.barcos) {
      if (b.bando !== 'enemigo' || b.hundiendo || !dentroDelCasco(b, g.x, g.y, 5)) continue;
      g.fase = 'enganchado';
      g.obj = b;
      g.t = 0;
      aviso(j, `¡Enganchado! Tu gente tira de la soga del ${b.nombre}`, 'bueno');
      return;
    }
    if (g.lejos > ALCANCE_GANCHO || j.mundo.islas.some((i) => Math.hypot(i.x - g.x, i.y - g.y) < i.r)) soltarGancho(j, 4, 'Erraste el gancho');
    return;
  }
  const e = g.obj;
  if (yo.hundiendo || e.hundiendo || e.bando !== 'enemigo') return soltarGancho(j, 2);
  const d = Math.hypot(e.x - yo.x, e.y - yo.y);
  if (d > 400 || g.t > 14) return soltarGancho(j, 6, 'Se cortó la soga: el barco estaba muy entero y se soltó');
  // la soga acerca los dos barcos; el más chico se mueve más
  const mYo = yo.stats.largo ** 2, mEl = e.stats.largo ** 2;
  const entero = Math.max(0, Math.min(1, e.vida / e.stats.vidaMax));
  const tiron = (95 - 55 * entero) * dt, nx = (e.x - yo.x) / (d || 1), ny = (e.y - yo.y) / (d || 1);
  e.x -= nx * tiron * (mYo / (mYo + mEl));
  e.y -= ny * tiron * (mYo / (mYo + mEl));
  yo.x += nx * tiron * (mEl / (mYo + mEl));
  yo.y += ny * tiron * (mEl / (mYo + mEl));
  if (d < (yo.stats.ancho + e.stats.ancho) * 0.5 + 48) {
    j.gancho = null;
    j.cdAbordaje = 5;
    resolverAbordaje(j, e);
  }
}

function resolverAbordaje(j, e) {
  const yo = j.jugador;
  const mio = yo.trip * yo.stats.abordaje * azar.rango(0.75, 1.25);
  const suyo = e.trip * e.stats.abordaje * azar.rango(0.75, 1.25) * 1.1;
  if (mio > suyo) {
    const bajas = Math.max(0, Math.min(yo.trip - 1, Math.round(e.trip * azar.rango(0.3, 0.6))));
    yo.trip -= bajas;
    j.oroBodega += e.oro;
    j.stats.saqueado += e.oro;
    if (e.oro) textoFlotante(j, e.x, e.y, `+${e.oro} oro`, '#ffd166');
    const escoltas = j.barcos.filter((b) => b.bando === 'escolta' && !b.hundiendo).length;
    if (escoltas < j.escoltasMax) {
      e.bando = 'escolta';
      e.oro = 0;
      e.convoy = false;
      e.vida = Math.max(e.vida, e.stats.vidaMax * 0.4);
      e.trip = Math.max(4, Math.round(e.stats.tripMax * 0.4));
      e.bandera = '#1f7a3f';
      e.ia = { estado: 'sigue' };
      j.stats.capturados++;
      aviso(j, `¡Abordaje ganado! El ${e.nombre} se suma a tu flota (−${bajas} marineros)`, 'bueno');
    } else {
      e.oro = 0;
      hundir(j, e);
      aviso(j, `¡Abordaje ganado! Flota llena: lo saqueaste y lo hundiste (−${bajas} marineros)`, 'bueno');
    }
  } else {
    const bajas = Math.max(0, Math.min(yo.trip - 1, Math.round(yo.trip * azar.rango(0.35, 0.55))));
    yo.trip -= bajas;
    e.trip = Math.max(1, e.trip - Math.round(e.trip * 0.3));
    aviso(j, `¡Abordaje rechazado! Perdiste ${bajas} marineros. Bajales gente a cañonazos y probá de nuevo`, 'malo');
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

function masCercano(j, b, equipo, radio) {
  let mejor = null, mejorD = radio;
  for (const o of j.barcos) {
    if (o.hundiendo || equipoDe(o) !== equipo) continue;
    if (Math.hypot(o.x - j.mundo.puerto.x, o.y - j.mundo.puerto.y) < j.mundo.puerto.radio + 60) continue; // el puerto es zona segura
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
  const cerca = masCercano(j, b, 'aliado', radioVista);
  const debil = b.vida < b.stats.vidaMax * 0.25;
  if (ia.lider && !ia.lider.hundiendo && ia.lider.bando === 'enemigo') {
    const L = ia.lider;
    const amenaza = masCercano(j, L, 'aliado', 560) || masCercano(j, b, 'aliado', 420);
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

// Dispara si justo tiene un enemigo de costado y a tiro, sin maniobrar
function fuegoOportunista(j, b) {
  const en = masCercano(j, b, 'enemigo', b.stats.alcance * 0.95);
  if (!en) return;
  const rel = difAng(Math.atan2(en.o.y - b.y, en.o.x - b.x), b.a);
  if (Math.abs(rel - Math.PI / 2) < 0.45) disparar(j, b, 1);
  if (Math.abs(rel + Math.PI / 2) < 0.45) disparar(j, b, -1);
}

function iaEscolta(j, b, dt) {
  if (b.hundiendo) return;
  const lider = j.jugador;
  const sana = b.vida > b.stats.vidaMax * 0.3;
  const enemigo = j.ordenFlota === 'ataque' && sana ? masCercano(j, b, 'enemigo', 520) : null;
  if (enemigo && Math.hypot(enemigo.o.x - lider.x, enemigo.o.y - lider.y) < 700) {
    combatir(j, b, enemigo.o, enemigo.d);
  } else {
    // en formación: a la par del jefe, una de cada lado
    const escoltas = j.barcos.filter((x) => x.bando === 'escolta' && !x.hundiendo);
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
  j.proxConvoy = azar.rango(200, 260);
  const { mundo, jugador } = j;
  for (let intento = 0; intento < 80; intento++) {
    const x = azar.rango(500, mundo.ancho - 500), y = azar.rango(500, mundo.alto - 500);
    const nivel = nivelZona(mundo, x, y);
    if (nivel < 1 || Math.hypot(x - jugador.x, y - jugador.y) < 1300) continue;
    if (mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.2 + 200)) continue;
    const a = azar.rango(0, TAU);
    const d = disenoEnemigo('tesoro', nivel);
    d.refuerzo = 160;
    const tesoro = crearBarco(d, 'enemigo', x, y, { a, velas: 1, bandera: '#c9a227', color: '#f6e7b0', nombre: 'Galeón del tesoro', tipo: 'tesoro', colorVela: '#f3d98b', oro: Math.round(azar.rango(1000, 1400)) });
    tesoro.nivel = nivel;
    tesoro.convoy = true;
    j.barcos.push(tesoro);
    const guardia = nivel >= 2 ? 'galeonGuerra' : 'corsario';
    for (const lado of [-1, 1]) {
      const g = crearBarco(disenoEnemigo(guardia, nivel), 'enemigo', x - Math.sin(a) * 110 * lado, y + Math.cos(a) * 110 * lado, {
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
  const yo = j.jugador;
  const zona = nivelZona(j.mundo, yo.x, yo.y);
  if (zona >= 1) j.proxTritones -= dt * (zona === 2 ? 1 : 0.35);
  if (j.proxTritones <= 0 && !yo.hundiendo) {
    j.proxTritones = azar.rango(40, 70);
    const n = 3 + zona + Math.floor(j.stats.tiempo / 240);
    for (let k = 0; k < n; k++) {
      const ang = azar.rango(0, TAU), d = azar.rango(420, 560);
      j.tritones.push({ x: yo.x + Math.cos(ang) * d, y: yo.y + Math.sin(ang) * d, a: 0, t: azar.rango(0, 3), muerto: false });
    }
    aviso(j, `¡Tritones! ${n} vienen a abordarte. Bajalos a cañonazos`, 'malo');
  }
  const quedan = [];
  for (const tr of j.tritones) {
    if (tr.muerto) continue;
    tr.t += dt;
    // van al barco aliado más cercano
    let obj = null, od = Infinity;
    for (const b of j.barcos) {
      if (b.bando === 'enemigo' || b.hundiendo) continue;
      const d = Math.hypot(b.x - tr.x, b.y - tr.y);
      if (d < od) { obj = b; od = d; }
    }
    if (!obj || od > 1400) continue; // se pierden en el mar
    const ang = Math.atan2(obj.y - tr.y, obj.x - tr.x) + Math.sin(tr.t * 3) * 0.5;
    tr.a = ang;
    const vel = 178;
    tr.x += Math.cos(ang) * vel * dt;
    tr.y += Math.sin(ang) * vel * dt;
    if (Math.random() < dt * 8) j.particulas.push({ tipo: 'estela', x: tr.x, y: tr.y, t: 0, vida: 0.8, r: 4 });
    if (dentroDelCasco(obj, tr.x, tr.y, 6)) {
      const bajas = Math.min(obj.trip - 1, azar.entero(1, 3));
      obj.trip -= Math.max(0, bajas);
      textoFlotante(j, tr.x, tr.y, `-${bajas} marineros`, '#ff6b6b');
      if (obj === j.jugador) j.sacudon = 4;
      continue;
    }
    quedan.push(tr);
  }
  j.tritones = quedan;
}
