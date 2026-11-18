// Servidor del mar compartido de Age of Navies (Cloudflare Workers + Durable Object).
// Corre la misma simulación que el modo solo (src/juego.js) y manda el estado a todos 20 veces por segundo.
// El servidor decide todo lo que importa (posiciones, daño, oro): el navegador solo manda a dónde apunta y qué dispara.
import { crearMundo } from '../src/mundo.js';
import { crearMar, agregarCapitan, quitarCapitan, avanzar, atracar, equipoDe, ataquesAFoto } from '../src/juego.js';
import { comprar } from '../src/puerto.js';
import { costoDiseno } from '../src/barcos.js';
import { PRESUPUESTO, FACCIONES, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, HABILIDADES, KRAKEN, enJuego } from '../src/config.js';
import { MAPAS } from '../src/mapas.js';

const MAX_JUGADORES = 24; // en el mar de todos
const MAX_SALA = 12; // tope de una sala
const VIDA_SALA = 70000; // una sala que no avisa en este tiempo sale de la lista de públicas
const PASO = 50; // milisegundos entre pasos de simulación
// Defensa: cuánto puede mandar cada conexión. El juego manda unos 15 mensajes por segundo (más los clics); el resto es abuso.
const LIMITE = { porSegundo: 40, rafaga: 80, largo: 4096, faltas: 400, porIp: 4, sobra: 12, entrarCada: 1500 };
// Cuánto mar ve cada jugador a su alrededor (mitad del ancho y del alto, con margen para pantallas anchas y el zoom más lejano).
// Lo de adentro se le manda en cada paso; el mar entero, uno de cada TODO_CADA pasos (para el minimapa y lo que entra en pantalla).
const VISTA = { x: 3000, y: 2000 }, TODO_CADA = 8;
// Supabase: para saber quién juega (se verifica la sesión que manda el navegador) y para informar lo que pasa en las partidas.
// La clave pública puede ir en el código; la del servidor (SERVIDOR_CLAVE) es un secreto de Cloudflare.
const SB_URL = 'https://iaglglmtemuohfhcingu.supabase.co', SB_PUBLICA = 'sb_publishable_xfHdoqpl4fo92C4I8vk-Wg_mU1nSwxA';
const INFORMAR_CADA = 60000; // cada cuánto se manda a la base de datos lo hecho por cada capitán con cuenta
const ORIGENES = ['https://ageofnavies.com', 'https://www.ageofnavies.com', 'http://localhost:5180', 'http://127.0.0.1:5180'];
// (la app de escritorio se presenta con el origen de la web; ver age-of-navies-steam)

// Todos juegan en el mismo mar; el mapa cambia una vez por día
function mapaDelDia() {
  const ids = Object.keys(MAPAS);
  return ids[Math.floor(Date.now() / 86400000) % ids.length];
}

function cabeceras(req) {
  const o = req.headers.get('Origin');
  return { 'Access-Control-Allow-Origin': ORIGENES.includes(o) ? o : ORIGENES[0], 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
}

// El código de una sala: 4 a 6 letras o números, en mayúsculas
const codigoSala = (x) => { const c = String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); return c.length >= 4 ? c : ''; };

// Cada mar es un Durable Object aparte: 'mar-1' es el de todos, 'sala-XXXX' es una sala (con amigos o pública)
// y 'salas' lleva la lista de salas públicas abiertas.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/salas') { // desde afuera solo se lee: los avisos de cada sala llegan por adentro (avisar), sin pasar por acá
      if (req.method !== 'GET') return new Response('No', { status: 405 });
      return env.MAR.get(env.MAR.idFromName('salas')).fetch(req);
    }
    if (url.pathname === '/mar' || url.pathname === '/estado') {
      const sala = codigoSala(url.searchParams.get('sala'));
      return env.MAR.get(env.MAR.idFromName(sala ? 'sala-' + sala : 'mar-1')).fetch(req);
    }
    return new Response('Age of Navies: servidor del mar', { status: 200 });
  },
};

export class Mar {
  constructor(estado, env) {
    this.env = env;
    this.sala = ''; // código de la sala; vacío en el mar de todos
    this.cfg = null; // lo que eligió quien creó la sala: { nombre, mapa, max, publica, reglas }
    this.lista = new Map(); // solo en el objeto 'salas': código -> datos de cada sala pública
    this.avisado = 0;
    this.clientes = new Map(); // socket -> { cap, entrada, conocidos, finEn }
    this.j = null;
    this.mapa = null;
    this.reloj = null;
    this.ultimo = 0;
    this.n = 0;
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/salas') { // la lista de salas públicas (GET) y los avisos de cada sala (POST, solo desde el servidor)
      const ahora = Date.now();
      if (req.method === 'POST') {
        if (req.headers.get('x-sala') !== 'interno') return new Response('No', { status: 403 });
        const d = await req.json();
        if (d.cerrar) this.lista.delete(d.codigo); else this.lista.set(d.codigo, { ...d, visto: ahora });
        return new Response('ok');
      }
      for (const [k, v] of this.lista) if (ahora - v.visto > VIDA_SALA) this.lista.delete(k);
      const salas = [...this.lista.values()].filter((x) => x.jugadores < x.max).sort((a, b) => b.jugadores - a.jugadores).slice(0, 30)
        .map((x) => ({ codigo: x.codigo, nombre: x.nombre, mapa: x.mapa, jugadores: x.jugadores, max: x.max, viento: x.viento, abordajes: x.abordajes }));
      return new Response(JSON.stringify({ salas }), { headers: cabeceras(req) });
    }
    this.sala = codigoSala(url.searchParams.get('sala'));
    if (url.pathname === '/estado') {
      const mapa = this.mapa || mapaDelDia();
      return new Response(JSON.stringify({ jugadores: this.jugando(), max: MAX_JUGADORES, mapa, nombre: MAPAS[mapa].nombre, lugar: MAPAS[mapa].lugar }), { headers: cabeceras(req) });
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se esperaba un WebSocket', { status: 426 });
    const origen = req.headers.get('Origin');
    if (origen && !ORIGENES.includes(origen)) return new Response('Origen no permitido', { status: 403 });
    // topes: conexiones por mar (los que juegan más unos de sobra para los que están eligiendo barco) y por IP
    const ip = req.headers.get('CF-Connecting-IP') || '';
    if (this.clientes.size >= (this.sala ? MAX_SALA : MAX_JUGADORES) + LIMITE.sobra) return new Response('El mar está lleno', { status: 503 });
    if (ip) { let n = 0; for (const c of this.clientes.values()) if (c.ip === ip) n++; if (n >= LIMITE.porIp) return new Response('Demasiadas conexiones', { status: 429 }); }
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    servidor.accept();
    this.atender(servidor, ip);
    return new Response(null, { status: 101, webSocket: cliente });
  }

  jugando() {
    let n = 0;
    for (const c of this.clientes.values()) if (c.cap && !c.cap.fin) n++;
    return n;
  }

  atender(ws, ip) {
    const c = { cap: null, entrada: {}, conocidos: new Map(), finEn: 0, ip, fichas: LIMITE.rafaga, recarga: Date.now(), faltas: 0, entro: 0, parcial: false };
    this.clientes.set(ws, c);
    ws.addEventListener('message', (ev) => {
      // cada conexión tiene fichas que se recargan solas (40 por segundo, hasta 80 juntas); sin fichas, el mensaje se tira.
      // Mensajes enormes o de otro tipo también. Muchas faltas seguidas: se corta la conexión.
      const ahora = Date.now();
      c.fichas = Math.min(LIMITE.rafaga, c.fichas + (ahora - c.recarga) * LIMITE.porSegundo / 1000);
      c.recarga = ahora;
      if (typeof ev.data !== 'string' || ev.data.length > LIMITE.largo || c.fichas < 1) {
        if (++c.faltas > LIMITE.faltas) { try { ws.close(1008, 'Demasiados mensajes'); } catch {} this.desconectar(ws); }
        return;
      }
      c.fichas -= 1;
      if (c.faltas > 0) c.faltas -= 0.05; // se van perdonando de a poco
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (!m || typeof m !== 'object') return;
      try { this.mensaje(ws, c, m); } catch (e) { console.log('error en mensaje', e && e.stack); }
    });
    const chau = () => this.desconectar(ws);
    ws.addEventListener('close', chau);
    ws.addEventListener('error', chau);
  }

  desconectar(ws) {
    const c = this.clientes.get(ws);
    if (!c) return;
    this.clientes.delete(ws);
    if (c.cap && this.j) { this.informar([c.cap], true); quitarCapitan(this.j, c.cap); }
    try { ws.close(); } catch {}
    if (this.clientes.size === 0) { // mar vacío: se apaga hasta que entre alguien (una sala vacía deja de existir)
      clearInterval(this.reloj);
      this.reloj = null;
      this.j = null;
      this.mapa = null;
      this.avisar(true);
      this.cfg = null;
    } else this.avisar();
  }

  // Una sala pública le cuenta a la lista cuánta gente tiene (al entrar o salir alguien y cada tanto), o que cerró
  avisar(cerrar) {
    if (!this.sala || !this.cfg || !this.cfg.publica || !this.env) return;
    this.avisado = Date.now();
    const d = cerrar ? { codigo: this.sala, cerrar: true }
      : { codigo: this.sala, nombre: this.cfg.nombre, mapa: this.mapa, jugadores: this.jugando(), max: this.cfg.max, viento: this.cfg.reglas.viento, abordajes: this.cfg.reglas.abordajes };
    this.env.MAR.get(this.env.MAR.idFromName('salas')).fetch('https://salas/salas', { method: 'POST', headers: { 'x-sala': 'interno' }, body: JSON.stringify(d) }).catch(() => {});
  }

  mensaje(ws, c, m) {
    if (m.t === 'entrar') { this.entrar(ws, c, m).catch((e) => console.log('error al entrar', e && e.stack)); return; }
    const cap = c.cap;
    if (!cap || cap.fin || !this.j) return;
    if (m.t === 'e') {
      const e = c.entrada;
      e.objetivo = Array.isArray(m.o) && Number.isFinite(m.o[0]) && Number.isFinite(m.o[1]) ? { x: m.o[0], y: m.o[1] } : null;
      e.quieto = !!m.q;
      if (Number.isFinite(m.v)) e.velas = Math.max(0, Math.min(3, Math.round(m.v))); // sin esto, el jugador tiene una versión anterior del juego
      if (m.f) e.fuegoTodo = true;
      if (m.l === 1 || m.l === -1) e.fuego = m.l;
      if (m.g) e.abordar = true;
      if (m.r) e.ordenFlota = true;
      if (m.h) e.habilidad = true;
      if (m.fm) e.formacion = true;
    } else if (m.t === 'puerto') {
      const ok = atracar(this.j, cap);
      if (ok) { c.entrada.objetivo = null; c.entrada.quieto = true; }
      ws.send(JSON.stringify({ t: 'puerto', ok }));
    } else if (m.t === 'comprar') {
      if (atracar(this.j, cap)) comprar(this.j, cap, String(m.id));
    }
  }

  // Quién juega: el navegador manda su sesión de Supabase (tk) y se verifica una sola vez por conexión. Con cuenta, el
  // capitán usa el nombre de su cuenta (nadie puede hacerse pasar por otro) y lo que hace se informa a su perfil.
  async quienEs(c, tk) {
    if (c.usuario !== undefined) return c.usuario;
    c.usuario = null;
    if (typeof tk !== 'string' || tk.length < 20 || tk.length > 4000) return null;
    try {
      const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_PUBLICA, Authorization: 'Bearer ' + tk } });
      if (!r.ok) return null;
      const u = await r.json();
      if (!u || !u.id) return null;
      const p = await fetch(SB_URL + '/rest/v1/perfiles?select=nombre&id=eq.' + encodeURIComponent(u.id), { headers: { apikey: SB_PUBLICA } });
      const filas = p.ok ? await p.json() : [];
      c.usuario = { id: u.id, nombre: filas[0] ? filas[0].nombre : null };
    } catch (e) { console.log('no se pudo verificar la sesión', e && e.message); }
    return c.usuario;
  }

  // Manda a la base de datos lo que hicieron los capitanes con cuenta desde el último informe (fin: terminó su partida)
  informar(caps, fin) {
    const clave = this.env && this.env.SERVIDOR_CLAVE;
    if (!clave) return;
    const datos = [];
    for (const cap of caps) {
      if (!cap || !cap.usuarioId) continue;
      const st = cap.stats, r = cap.informado || { hundidos: 0, capturados: 0, eliminados: 0, saqueado: 0, tiempo: 0 };
      const d = { u: cap.usuarioId, hundidos: st.hundidos - r.hundidos, capturados: st.capturados - r.capturados, eliminados: (st.eliminados || 0) - (r.eliminados || 0),
        oro: Math.round(st.saqueado - r.saqueado), segundos: Math.round(st.tiempo - r.tiempo), saqueo: Math.round(st.saqueado), fin: !!fin };
      cap.informado = { hundidos: st.hundidos, capturados: st.capturados, eliminados: st.eliminados || 0, saqueado: st.saqueado, tiempo: st.tiempo };
      if (d.hundidos || d.capturados || d.eliminados || d.oro || d.segundos >= 5 || fin) datos.push(d);
    }
    if (!datos.length) return;
    this.informes = (this.informes || 0) + 1;
    return fetch(SB_URL + '/rest/v1/rpc/servidor_progreso', { method: 'POST', headers: { apikey: SB_PUBLICA, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_clave: clave, p_datos: datos }) })
      .then((r) => { if (!r.ok) r.text().then((x) => console.log('informe rechazado', r.status, x.slice(0, 200))); })
      .catch((e) => console.log('no se pudo informar', e && e.message));
  }

  async entrar(ws, c, m) {
    if (c.cap && !c.cap.fin) return;
    const ahora = Date.now();
    if (ahora - c.entro < LIMITE.entrarCada) return;
    c.entro = ahora;
    const cuenta = await this.quienEs(c, m.tk);
    if (!this.clientes.has(ws)) return; // se fue mientras se verificaba
    c.parcial = m.cv >= 2; // cv: 2 = el navegador entiende las fotos parciales (p: 1); uno anterior recibe siempre el mar entero
    const d = m.diseno || {};
    const diseno = { faccion: d.faccion, casco: d.casco, velas: d.velas, canones: d.canones | 0, municion: d.municion, trip: d.trip, habilidad: HABILIDADES[d.habilidad] ? d.habilidad : 'andanada' };
    const valido = enJuego(diseno.faccion) && CASCOS[diseno.casco] && VELAS[diseno.velas] && MUNICIONES[diseno.municion] && TRIPULACIONES[diseno.trip]
      && diseno.canones >= 2 && diseno.canones % 2 === 0 && diseno.canones <= CASCOS[diseno.casco].maxCanones && costoDiseno(diseno) <= PRESUPUESTO;
    if (!valido) return ws.send(JSON.stringify({ t: 'no', motivo: 'Ese diseño de barco no es válido.' }));
    if (this.sala && !this.cfg) { // una sala existe mientras tenga gente: la arma el primero que entra con "crear"
      const k = m.crear;
      if (!k) return ws.send(JSON.stringify({ t: 'no', motivo: 'Esa sala no existe o ya se cerró.' }));
      this.cfg = {
        nombre: String(m.nombre || '').replace(/[<>&"']/g, '').trim().slice(0, 16) || 'Capitán',
        mapa: MAPAS[k.mapa] ? k.mapa : mapaDelDia(),
        max: Math.max(2, Math.min(MAX_SALA, k.max | 0 || 6)),
        publica: !!k.publica,
        reglas: { viento: k.viento !== false, abordajes: k.abordajes !== false },
      };
    }
    if (this.jugando() >= (this.cfg ? this.cfg.max : MAX_JUGADORES)) return ws.send(JSON.stringify({ t: 'no', motivo: this.cfg ? 'La sala está llena.' : 'El mar está lleno. Probá de nuevo en un rato.' }));

    if (!this.j) {
      this.mapa = this.cfg ? this.cfg.mapa : mapaDelDia();
      this.j = crearMar(crearMundo(this.mapa), { servidor: true, enemigos: this.cfg ? 14 : 22, reglas: this.cfg ? this.cfg.reglas : null });
      this.n = 0;
    }
    if (c.cap) { this.informar([c.cap], true); quitarCapitan(this.j, c.cap); }
    let nombre = (cuenta && cuenta.nombre) || String(m.nombre || '').replace(/[<>&"']/g, '').trim().slice(0, 16) || 'Capitán';
    const usados = new Set(this.j.capitanes.map((x) => x.nombre));
    for (let k = 2; usados.has(nombre); k++) nombre = `${nombre.replace(/ \d+$/, '')} ${k}`.slice(0, 18);
    c.cap = agregarCapitan(this.j, { id: 'c' + (++this.n), nombre, diseno, oro: PRESUPUESTO - costoDiseno(diseno) });
    if (cuenta) c.cap.usuarioId = cuenta.id;
    c.entrada = {};
    c.conocidos = new Map();
    c.finEn = 0;
    ws.send(JSON.stringify({ t: 'hola', id: c.cap.id, nombre, mapa: this.mapa, v: 5, sala: this.sala || null, reglas: this.j.reglas, informa: !!(cuenta && this.env && this.env.SERVIDOR_CLAVE) })); // v: 2 = mundo sin callejones; v: 3 = tierras de un solo cuerpo; v: 4 = sin pasos angostos entre tierras; v: 5 = mar de 7000 (era 6400)
    this.avisar();
    if (!this.reloj) {
      this.ultimo = Date.now();
      this.reloj = setInterval(() => { try { this.paso(); } catch (e) { console.log('error en paso', e && e.stack); } }, PASO);
    }
  }

  paso() {
    const j = this.j;
    if (!j) return;
    const ahora = Date.now();
    const dt = Math.max(0.02, Math.min(0.1, (ahora - this.ultimo) / 1000));
    this.ultimo = ahora;

    const entradas = {};
    for (const c of this.clientes.values()) {
      if (!c.cap) continue;
      entradas[c.cap.id] = c.entrada;
      c.entrada = { objetivo: c.entrada.objetivo, quieto: c.entrada.quieto, velas: c.entrada.velas }; // los toques (disparar, gancho) valen una sola vez
    }
    j.eventos.length = 0;
    avanzar(j, dt, entradas);

    // lo que ven todos
    const r = Math.round;
    const barcos = j.barcos.map((b) => [b.id, r(b.x), r(b.y), r(b.a * 100), r(b.v), b.velas, r(b.vida), b.trip, b.cap ? b.cap.id : 0, b.bando === 'jugador' ? 'j' : b.bando === 'escolta' ? 'e' : 'b', b.hundiendo ? 1 : 0]);
    const cofres = j.cofres.map((x) => [x.id, r(x.x), r(x.y)]);
    const tritones = j.tritones.map((x) => [r(x.x), r(x.y), r(x.a * 100)]);
    const caps = j.capitanes.filter((x) => !x.fin).map((x) => [x.id, x.nombre, r(x.stats.saqueado), x.marcasTesoro || 0]); // la 4.ª: monedas del tesoro maldito
    const ganchos = [];
    for (const cap of j.capitanes) if (cap.gancho) ganchos.push([cap.id, cap.gancho.fase === 'vuelo' ? 0 : 1, r(cap.gancho.x), r(cap.gancho.y), cap.gancho.obj ? cap.gancho.obj.id : 0]);
    const comunes = j.eventos.filter((e) => !e.p);
    // viento: rumbo (en centésimas de radián) y después x, y, radio de cada ráfaga
    const viento = j.viento ? [r(j.viento.a * 100)] : null; // null = partida sin viento
    if (viento) for (const g of j.viento.rafagas) viento.push(r(g.x), r(g.y), r(g.r));
    const rachas = []; // x, y, radio, rumbo en centésimas, décimas de segundo que le quedan
    if (viento) for (const k of j.viento.rachas) rachas.push(r(k.x), r(k.y), r(k.r), r(k.a * 100), r(k.t * 10));
    if (ahora - this.avisado > 20000) this.avisar(); // para que la sala no se caiga de la lista
    if (ahora - (this.informado || 0) > INFORMAR_CADA) { this.informado = ahora; this.informar(j.capitanes.filter((x) => !x.fin), false); }
    // el Kraken: x, y, rumbo, vida, vida máxima, cuánto emergió (%), segundos de muerte y de hundirse (en décimas), furia,
    // y sus zonas marcadas (id, x, y, tiempo y aviso en centésimas). Lo decide todo el servidor: los jugadores solo lo dibujan.
    const k = j.kraken;
    const kraken = k ? [r(k.x), r(k.y), r(k.a * 100), Math.max(0, r(k.vida)), k.vidaMax, r(k.emerge * 100), k.muerte ? Math.max(1, r(k.muerte * 10)) : 0, k.sumerge ? Math.max(1, r(k.sumerge * 10)) : 0, k.furia ? 1 : 0, k.zonas.flatMap((z) => [z.id, z.x, z.y, r(z.t * 100), r(z.aviso * 100)]),
      ataquesAFoto(k), k.mirada ? [k.mirada.id, r(k.mirada.t * 100)] : 0, k.zonas.map((z) => z.r || KRAKEN.radio), k.buceo ? Math.max(1, r(k.buceo * 10)) : 0] : null; // 10 a 13: los ataques nuevos (un navegador anterior no los lee)

    // Lo que es igual para todos se pasa a texto una sola vez por paso (antes, una vez por jugador). Cada barco es una fila.
    const filas = barcos.map((x) => JSON.stringify(x));
    const comun = JSON.stringify({ c: cofres, tr: tritones, g: ganchos, caps, ...(kraken ? { kr: kraken } : {}), ...(viento ? { vi: viento, rc: rachas, vf: [r(j.viento.f1 * 100), r(j.viento.f2 * 100), j.viento.cambios] } : {}) }).slice(1, -1); // vf: las curvas del viento y cuántas veces cambió de rumbo
    this.tic = (this.tic || 0) + 1;
    const todo = this.tic % TODO_CADA === 0;
    let todas = null;

    for (const [ws, c] of this.clientes) {
      const cap = c.cap;
      if (!cap) continue;
      // el diseño de cada barco se manda una sola vez (y de nuevo si cambia en el puerto)
      const alta = [];
      for (const b of j.barcos) {
        const ver = b.ver || 0;
        if (c.conocidos.get(b.id) === ver) continue;
        c.conocidos.set(b.id, ver);
        alta.push({ id: b.id, d: b.diseno, n: b.nombre, tipo: b.tipo, bd: b.bandera, cv: b.colorVela, cy: b.convoy ? 1 : 0, eq: equipoDe(b) });
      }
      if (c.conocidos.size > j.barcos.length + 60) for (const id of c.conocidos.keys()) if (!j.barcos.some((b) => b.id === id)) c.conocidos.delete(id);
      const bq = cap.barco;
      // los barcos: a quien entiende fotos parciales, solo los que están a la vista (y su flota), salvo cada TODO_CADA pasos
      let b;
      if (c.parcial && !todo) {
        const sel = [];
        for (let i = 0; i < j.barcos.length; i++) {
          const o = j.barcos[i];
          if (o.cap === cap || (Math.abs(o.x - bq.x) < VISTA.x && Math.abs(o.y - bq.y) < VISTA.y)) sel.push(filas[i]);
        }
        b = sel.join(',');
      } else b = todas || (todas = filas.join(','));
      const yo = {
        hb: [+cap.cdHabilidad.toFixed(1), cap.habilidad ? cap.habilidad.id : 0],
        b: bq.id, ob: cap.oroBodega, op: cap.oroPuerto, em: cap.escoltasMax, st: cap.stats, cd: +cap.cdAbordaje.toFixed(1), of: cap.ordenFlota, fo: cap.formacion || 0,
        rec: [+bq.recarga['-1'].toFixed(2), +bq.recarga['1'].toFixed(2)], recT: bq.recargaTotal ? [bq.recargaTotal['-1'] || 0, bq.recargaTotal['1'] || 0] : null,
        av: cap.avisos.map((a) => (a.p ? [a.texto, a.tipo, a.p] : [a.texto, a.tipo])), sac: +cap.sacudon.toFixed(1), rep: bq.reparando ? 1 : 0, fin: cap.fin ? 1 : 0, causa: cap.causa || null,
      };
      const ev = comunes.concat(j.eventos.filter((e) => e.p === cap.id));
      const msg = '{"t":"s","b":[' + b + '],' + comun + ',"ev":' + JSON.stringify(ev) + ',"yo":' + JSON.stringify(yo)
        + (alta.length ? ',"alta":' + JSON.stringify(alta) : '') + (c.parcial && !todo ? ',"p":1' : '') + '}';
      try { ws.send(msg); } catch { /* se cerró: lo limpia el evento close */ }
      // a los 6 segundos de hundido, el capitán sale del mar (el jugador sigue conectado hasta que vuelve a diseñar)
      if (cap.fin) {
        if (!c.finEn) c.finEn = ahora;
        else if (ahora - c.finEn > 6000) { this.informar([cap], true); quitarCapitan(j, cap); c.cap = null; }
      }
    }
  }
}
