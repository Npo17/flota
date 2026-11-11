// Juego en línea: se conecta al mar compartido, manda lo que hace el jugador y arma con lo que llega
// un objeto con la misma forma que una partida del modo solo, para que las pantallas y el dibujo no cambien.
// El servidor decide posiciones, daño y oro; acá solo se suaviza el movimiento y se dibujan los efectos.
import { crearMundo } from './mundo.js';
import { crearBarco, statsDe } from './barcos.js';
import { efecto, estela, actualizarParticulas, dentroDelCasco, difAng } from './juego.js';
import { t } from './idioma.js';

// En la compu se usa el servidor publicado, salvo que la dirección lleve ?mar=local (servidor de prueba con wrangler dev)
const LOCAL = new URLSearchParams(location.search).get('mar') === 'local';
const HTTP = LOCAL ? 'http://localhost:8787' : 'https://mar.ageofnavies.com';
const WS = LOCAL ? 'ws://localhost:8787/mar' : 'wss://mar.ageofnavies.com/mar';
const VERDE = '#1f7a3f', RIVAL = '#e63946';

// Cuánta gente hay y qué mapa toca hoy (para mostrar antes de entrar)
export async function estadoDelMar() {
  try {
    const r = await fetch(HTTP + '/estado', { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// eventos: alEntrar(partida), alCerrar(motivo), alPuerto(ok)
export function conectar({ nombre, diseno, alEntrar, alCerrar, alPuerto }) {
  let ws = null, miId = null, abierta = false, cerradaAProposito = false;
  let pulsos = {}, objetivo = null, quieto = false, ultimoEnvio = 0;
  const porId = new Map();
  const nombres = new Map();
  const yo = { id: null, nombre, barco: null, oroPuerto: 0, oroBodega: 0, escoltasMax: 2 };
  const j = {
    enLinea: true, mundo: null, t: 0, yo,
    barcos: [], jugador: null, balas: [], particulas: [], cofres: [], tritones: [], textos: [], avisos: [],
    oroBodega: 0, oroPuerto: 0, escoltasMax: 2, stats: { hundidos: 0, capturados: 0, eliminados: 0, saqueado: 0, tiempo: 0 },
    cdAbordaje: 0, gancho: null, ordenFlota: 'formacion', sacudon: 0, fin: false, finEn: 0, causa: null,
    nombreJugador: nombre, jugadores: [],
    viento: null, // llega con cada foto; si el servidor es de una versión anterior, no hay viento
  };

  try { ws = new WebSocket(WS); } catch { setTimeout(() => alCerrar(t('No se pudo conectar con el mar.')), 0); }
  if (ws) {
    ws.onopen = () => { abierta = true; ws.send(JSON.stringify({ t: 'entrar', nombre, diseno })); };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } recibir(m); };
    ws.onclose = () => { if (!cerradaAProposito) alCerrar(t(miId ? 'Se cortó la conexión con el mar.' : 'No se pudo conectar con el mar. Probá de nuevo en un rato.')); };
    ws.onerror = () => {};
  }

  function recibir(m) {
    if (m.t === 'hola') {
      miId = m.id; yo.id = m.id; yo.nombre = m.nombre; j.nombreJugador = m.nombre;
      j.mundo = crearMundo(m.mapa);
    } else if (m.t === 'no') {
      cerradaAProposito = true;
      try { ws.close(); } catch {}
      alCerrar(t(m.motivo));
    } else if (m.t === 'puerto') alPuerto(m.ok);
    else if (m.t === 's') foto(m);
  }

  // Llega una foto del mar
  function foto(m) {
    if (!j.mundo) return;
    if (m.vi) {
      const rafagas = [];
      for (let k = 1; k + 2 < m.vi.length; k += 3) rafagas.push({ x: m.vi[k], y: m.vi[k + 1], r: m.vi[k + 2] });
      j.viento = { a: m.vi[0] / 100, rafagas };
    }
    for (const [id, nom] of m.caps) nombres.set(id, nom);
    j.jugadores = m.caps;
    if (m.alta) for (const a of m.alta) {
      let b = porId.get(a.id);
      if (!b) { b = crearBarco(a.d, 'enemigo', 0, 0, { nombre: a.n, tipo: a.tipo, bandera: a.bd, colorVela: a.cv }); b.id = a.id; b.nuevo = true; porId.set(a.id, b); }
      else { b.diseno = { ...a.d }; b.stats = statsDe(b.diseno); }
      b.nombreBot = a.n; b.banderaBot = a.bd; b.convoy = !!a.cy; b.equipoAlta = a.eq || null; // equipo (civilización); un servidor anterior no lo manda
    }
    const vistos = new Set();
    const lista = [];
    for (const [id, x, y, a100, v, velas, vida, trip, capId, tipo, hund] of m.b) {
      const b = porId.get(id);
      if (!b) continue; // todavía no llegó su diseño
      vistos.add(id);
      b.tx = x; b.ty = y; b.ta = a100 / 100; b.tv = v;
      if (b.nuevo) { b.x = x; b.y = y; b.a = b.ta; b.v = v; b.nuevo = false; }
      b.velas = velas; b.vida = vida; b.trip = trip;
      if (hund && !b.hundiendo) b.hundiendo = 0.0001;
      b.equipoSrv = b.equipoAlta || capId || 'enemigo';
      if (capId === miId) {
        b.cap = yo; b.bando = tipo === 'j' ? 'jugador' : 'escolta'; b.bandera = VERDE; b.esJugador = false; b.nombre = b.nombreBot;
      } else if (capId) {
        b.cap = { id: capId }; b.bando = 'enemigo'; b.bandera = RIVAL; b.esJugador = true;
        b.nombre = tipo === 'j' ? (nombres.get(capId) || t('Capitán')) : t('Flota de {nombre}', { nombre: nombres.get(capId) || t('otro capitán') });
      } else { b.cap = null; b.bando = 'enemigo'; b.bandera = b.banderaBot; b.esJugador = false; b.nombre = b.nombreBot; }
      lista.push(b);
    }
    for (const id of porId.keys()) if (!vistos.has(id)) porId.delete(id);
    j.barcos = lista;

    const y = m.yo;
    const mio = porId.get(y.b);
    if (mio) {
      const primera = !j.jugador;
      j.jugador = mio; yo.barco = mio;
      mio.recarga = { '-1': y.rec[0], '1': y.rec[1] };
      if (y.recT) mio.recargaTotal = { '-1': y.recT[0], '1': y.recT[1] };
      mio.reparando = !!y.rep;
      if (primera) alEntrar(j);
    }
    j.oroBodega = yo.oroBodega = y.ob; j.oroPuerto = yo.oroPuerto = y.op; j.escoltasMax = yo.escoltasMax = y.em;
    j.stats = y.st; j.cdAbordaje = y.cd; j.ordenFlota = y.of;
    j.avisos = y.av.map(([texto, tipo, p]) => ({ texto, tipo, p }));
    j.sacudon = Math.max(j.sacudon, y.sac);
    if (y.fin && !j.fin) { j.fin = true; j.finEn = j.t; j.causa = y.causa; }

    j.cofres = m.c.map(([id, x, yy]) => ({ id, x, y: yy }));
    j.tritones = m.tr.map(([x, yy, a100]) => ({ x, y: yy, a: a100 / 100, t: j.t }));
    const g = m.g.find((q) => q[0] === miId);
    j.gancho = g ? { fase: g[1] ? 'enganchado' : 'vuelo', x: g[2], y: g[3], obj: porId.get(g[4]) || null } : null;
    if (j.gancho && j.gancho.fase === 'enganchado' && !j.gancho.obj) j.gancho = null;

    for (const ev of m.ev) {
      if (ev.k === 'b') j.balas.push({ x: ev.x, y: ev.y, vx: ev.vx, vy: ev.vy, vida: ev.v, vidaTotal: ev.v, radio: ev.r, equipo: ev.e });
      else {
        efecto(j, ev);
        // la bala que pegó ya no sigue de largo
        if (ev.k === 'g') { const k = j.balas.findIndex((bl) => Math.abs(bl.x - ev.x) < 40 && Math.abs(bl.y - ev.y) < 40); if (k >= 0) j.balas.splice(k, 1); }
      }
    }
  }

  // Un cuadro: mandar lo que hace el jugador y mover todo con suavidad hacia lo último que dijo el servidor
  function cuadro(dt, entrada) {
    j.t += dt;
    j.sacudon = Math.max(0, j.sacudon - dt * 12);
    objetivo = entrada.objetivo || null;
    quieto = !!entrada.quieto;
    const velas = Number.isFinite(entrada.velas) ? entrada.velas : 3;
    // Un servidor de una versión anterior saca las velas de la distancia al cursor: se le manda un punto en la misma
    // dirección pero a la distancia que corresponde a las velas elegidas (salvo al tirar el gancho, que necesita el punto real)
    if (objetivo && !j.viento && j.jugador && !entrada.abordar) {
      const yo = j.jugador, dx = objetivo.x - yo.x, dy = objetivo.y - yo.y, d = Math.hypot(dx, dy) || 1, lejos = [0, 100, 215, 420][velas];
      if (d > yo.stats.largo * 0.6 + 15) objetivo = { x: yo.x + (dx / d) * lejos, y: yo.y + (dy / d) * lejos };
    }
    if (entrada.fuegoTodo) pulsos.f = 1;
    if (entrada.fuego) pulsos.l = entrada.fuego;
    if (entrada.abordar) pulsos.g = 1;
    if (entrada.ordenFlota) pulsos.r = 1;
    const ahora = performance.now();
    if (abierta && miId && !j.fin && ws.readyState === 1 && (ahora - ultimoEnvio > 66 || pulsos.f || pulsos.l || pulsos.g)) {
      ultimoEnvio = ahora;
      ws.send(JSON.stringify({ t: 'e', o: objetivo && !quieto ? [Math.round(objetivo.x), Math.round(objetivo.y)] : null, q: quieto ? 1 : 0, v: velas, ...pulsos }));
      pulsos = {};
    }

    const k = 1 - Math.exp(-dt * 9);
    const ref = j.jugador;
    for (const b of j.barcos) {
      if (b.hundiendo) { b.hundiendo = Math.min(2.95, b.hundiendo + dt); continue; }
      b.x += Math.cos(b.a) * b.v * dt;
      b.y += Math.sin(b.a) * b.v * dt;
      const dx = b.tx - b.x, dy = b.ty - b.y;
      if (Math.abs(dx) > 250 || Math.abs(dy) > 250) { b.x = b.tx; b.y = b.ty; b.a = b.ta; } // salto grande: sin deslizar
      else { b.x += dx * k; b.y += dy * k; }
      b.a += difAng(b.ta, b.a) * k;
      b.v += (b.tv - b.v) * k;
      if (ref && Math.abs(b.x - ref.x) < 1300 && Math.abs(b.y - ref.y) < 1000) estela(j, b, dt);
    }
    // balas: solo se dibujan; el daño lo resolvió el servidor
    const quedan = [];
    for (const bl of j.balas) {
      bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.vida -= dt;
      if (bl.vida <= 0) { efecto(j, { k: 's', x: bl.x, y: bl.y, r: 6 + bl.radio }); continue; }
      if (j.mundo.islas.some((i) => Math.abs(i.x - bl.x) < i.r && Math.hypot(i.x - bl.x, i.y - bl.y) < i.r * 0.95)) { efecto(j, { k: 'p', x: bl.x, y: bl.y }); continue; }
      if (j.barcos.some((b) => !b.hundiendo && b.equipoSrv !== bl.equipo && Math.abs(b.x - bl.x) < b.stats.largo && Math.abs(b.y - bl.y) < b.stats.largo && dentroDelCasco(b, bl.x, bl.y, bl.radio))) continue;
      quedan.push(bl);
    }
    j.balas = quedan;
    actualizarParticulas(j, dt);
  }

  const mandar = (m) => { if (abierta && ws.readyState === 1) ws.send(JSON.stringify(m)); };
  return {
    partida: j,
    cuadro,
    atracar: () => mandar({ t: 'puerto' }),
    comprar: (id) => mandar({ t: 'comprar', id }),
    cerrar: () => { cerradaAProposito = true; try { ws.close(); } catch {} },
  };
}
