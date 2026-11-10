// Pega todo: pantallas (astillero, puerto, fin), teclado y el ciclo del juego.
import { PRESUPUESTO, FACCIONES, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, COSTO_CANON } from './config.js';
import { costoDiseno, barrasDe, crearBarco, statsDe } from './barcos.js';
import { crearMundo, nivelZona, nombreZona } from './mundo.js';
import { MAPAS, mapaAlAzar } from './mapas.js';
import { crearPartida, actualizar, candidatoAbordaje, aviso, atracar } from './juego.js';
import { catalogoPuerto, comprar } from './puerto.js';
import { conectar, estadoDelMar } from './red.js';
import { dibujarEscena, dibujarMinimapa, dibujarBarco, dibujarVistaMapa } from './dibujo.js';
import { dibujarBandera } from './banderas.js';
import { t, IDIOMAS, registrarTextos, idiomaActual, idiomaInicial, elegirIdioma } from './idioma.js';
import { TEXTOS } from './textos.js';
import { TEXTOS_HISTORIA } from './textos-historia.js';
import { cuenta, iniciarCuenta, entrarConGoogle, salir, elegirNombre, registrarProgreso, ranking } from './cuenta.js';

const $ = (id) => document.getElementById(id);
registrarTextos(TEXTOS);
registrarTextos(TEXTOS_HISTORIA);
elegirIdioma(idiomaInicial());
const canvas = $('mar'), ctx = canvas.getContext('2d');
const mini = $('minimapa').getContext('2d');

let mundo = null;
let mapaElegido = 'aleatorio';
try { mapaElegido = localStorage.getItem('aon-mapa') || 'aleatorio'; } catch {}
if (mapaElegido !== 'aleatorio' && !MAPAS[mapaElegido]) mapaElegido = 'aleatorio';
let diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
let partida = null;
let red = null; // conexión al mar compartido cuando se juega en línea
let estado = 'astillero'; // astillero | mar | puerto | fin
const vista = { ancho: 0, alto: 0, zoom: 1, raton: { x: 0, y: 0 }, ratonPx: { x: 0, y: 0 }, ladoRaton: 1 };
const teclas = new Set();
let pulsos = {}; // acciones de un solo toque

// Si el equipo no llega a 60 cuadros por segundo, se baja la resolución del dibujo en dos escalones
let calidad = 1;
function ajustar() {
  const dpr = Math.min(2, window.devicePixelRatio || 1) * calidad;
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  vista.ancho = canvas.width;
  vista.alto = canvas.height;
  vista.zoom = dpr * Math.max(0.7, Math.min(1.15, innerHeight / 800));
  canvas.style.imageRendering = 'auto';
}
addEventListener('resize', ajustar);
ajustar();

// ---------- Astillero ----------
function grupo(titulo, catalogo, clave) {
  const h = document.createElement('h3');
  h.textContent = titulo;
  const caja = document.createElement('div');
  caja.className = 'opciones' + (clave === 'faccion' ? ' civs' : '');
  for (const [id, o] of Object.entries(catalogo)) {
    const b = document.createElement('button');
    b.className = 'opcion' + (diseno[clave] === id ? ' elegida' : '');
    if (clave === 'faccion') {
      b.title = t(o.desc);
      b.innerHTML = `<span class="civ"><canvas width="42" height="28"></canvas><b>${t(o.nombre)}</b></span><em>${t(o.bono)}</em>`;
      dibujarBandera(b.querySelector('canvas').getContext('2d'), id, 42, 28);
    } else b.innerHTML = `<b>${t(o.nombre)}</b><small>${t(o.desc)}</small><em>${o.costo ? t('{n} oro', { n: o.costo }) : t('Incluida')}</em>`;
    b.onclick = () => {
      diseno[clave] = id;
      diseno.canones = Math.min(diseno.canones, CASCOS[diseno.casco].maxCanones);
      pintarAstillero();
    };
    caja.appendChild(b);
  }
  return [h, caja];
}

function pintarAstillero() {
  const cont = $('ast-opciones');
  cont.innerHTML = '';
  $('ast-sub').innerHTML = t('Diseñá tu barco con {oro} de oro. Lo que no gastes te queda guardado en el puerto para después.', { oro: `<b>${PRESUPUESTO}</b>` });
  cont.append(...grupo(t('Civilización · cambia el barco, la bandera y da una ventaja'), FACCIONES, 'faccion'), ...grupo(t('Casco'), CASCOS, 'casco'), ...grupo(t('Velas'), VELAS, 'velas'));
  const max = CASCOS[diseno.casco].maxCanones;
  const h = document.createElement('h3');
  h.textContent = t('Cañones · {n} oro cada uno (cada cañón te hace un poco más lento)', { n: COSTO_CANON });
  const d = document.createElement('div');
  d.className = 'deslizador';
  d.innerHTML = `<input type="range" min="2" max="${max}" step="2" value="${diseno.canones}"><b>${t('{n} cañones', { n: diseno.canones })}</b>`;
  d.querySelector('input').oninput = (e) => { diseno.canones = +e.target.value; pintarAstillero(); };
  cont.append(h, d, ...grupo(t('Munición'), MUNICIONES, 'municion'), ...grupo(t('Tripulación'), TRIPULACIONES, 'trip'));

  const resto = PRESUPUESTO - costoDiseno(diseno);
  $('ast-resto').textContent = t('{n} oro', { n: resto });
  $('ast-resto').style.color = resto < 0 ? '#ff6b6b' : '';
  $('ast-zarpar').disabled = resto < 0;
  $('ast-zarpar').textContent = t(resto < 0 ? 'Te pasaste del presupuesto' : 'Jugar solo contra bots');
  if (resto < 0) $('ast-linea').disabled = true;
  else if (!red) $('ast-linea').disabled = false;
  const barras = barrasDe(diseno);
  $('ast-barras').innerHTML = Object.entries(barras).map(([k, v]) =>
    `<div class="stat"><span>${t(k)}</span><div><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div></div>`).join('');
  const s = statsDe(diseno);
  $('ast-barras').innerHTML += `<p class="suave">${t('{casco} de casco · {gente} marineros · {n} cañones por lado', { casco: s.vidaMax, gente: s.tripMax, n: diseno.canones / 2 })}</p>`;

  const c = $('ast-vista'), cx = c.getContext('2d');
  cx.clearRect(0, 0, c.width, c.height);
  const b = crearBarco(diseno, 'jugador', 0, 0, { a: -0.25, velas: 3, bandera: '#1f7a3f' });
  cx.save();
  cx.translate(c.width / 2, c.height / 2);
  cx.scale(2.1, 2.1);
  dibujarBarco(cx, b, { sinBarra: true });
  cx.restore();

  let mejor = 0;
  try { mejor = +localStorage.getItem('flota-mejor') || 0; } catch {}
  $('ast-mejor').textContent = mejor ? t('Tu mejor saqueo: {n} de oro', { n: mejor }) : '';
}

// Menú de mapas: un botón muestra el elegido y abre la grilla con vista previa y banderas de cada lugar
const mundosVista = {};
const mundoVista = (id) => mundosVista[id] || (mundosVista[id] = crearMundo(id));
const banderasDe = (m) => [...new Set(m.reglas.facciones || [])].slice(0, 4);

function pintarMapa() {
  const m = MAPAS[mapaElegido];
  dibujarVistaMapa($('ast-mapa-vista').getContext('2d'), m ? mundoVista(mapaElegido) : null, 128);
  $('ast-mapa-nombre').textContent = t(m ? m.nombre : 'Mapa aleatorio');
  $('ast-mapa-lugar').textContent = t(m ? m.lugar : 'Cada partida, un lugar distinto de la historia');
  $('ast-mapa-desc').innerHTML = m ? `${t(m.desc)}<br><b>${t(m.rasgo)}</b>` : '';
}

function elegirMapa(id) {
  mapaElegido = id;
  try { localStorage.setItem('aon-mapa', id); } catch {}
  pintarMapa();
  $('pantalla-mapas').classList.add('oculto');
}

function abrirMapas() {
  const grilla = $('map-grilla');
  if (!grilla.children.length) {
    const tarjeta = (id, m) => {
      const b = document.createElement('button');
      b.className = 'mapa-carta';
      b.dataset.id = id;
      const flags = m ? banderasDe(m).map(() => '<canvas width="36" height="24"></canvas>').join('') : '';
      b.innerHTML = `<canvas class="vista" width="220" height="220"></canvas><div class="flags">${flags}</div>`
        + `<b>${t(m ? m.nombre : 'Mapa aleatorio')}</b><span>${t(m ? m.lugar : 'Sorpresa')}</span>`
        + `<small>${t(m ? m.rasgo : 'Cada partida te toca un lugar distinto de la historia.')}</small>`;
      dibujarVistaMapa(b.querySelector('.vista').getContext('2d'), m ? mundoVista(id) : null, 220);
      if (m) b.querySelectorAll('.flags canvas').forEach((c, q) => dibujarBandera(c.getContext('2d'), banderasDe(m)[q], 36, 24));
      b.onclick = () => elegirMapa(id);
      grilla.appendChild(b);
    };
    tarjeta('aleatorio', null);
    for (const [id, m] of Object.entries(MAPAS)) tarjeta(id, m);
  }
  for (const b of grilla.children) b.classList.toggle('elegida', b.dataset.id === mapaElegido);
  $('pantalla-mapas').classList.remove('oculto');
}
$('ast-mapa-btn').onclick = abrirMapas;
$('map-cerrar').onclick = () => $('pantalla-mapas').classList.add('oculto');
pintarMapa();

function empezar() {
  estado = 'mar';
  $('pantalla-astillero').classList.add('oculto');
  $('hud').classList.remove('oculto');
  $('hud-linea').classList.toggle('oculto', !partida.enLinea);
}

// Modo solo: vos contra los bots, en el mapa que elijas
$('ast-zarpar').onclick = () => {
  mundo = crearMundo(mapaElegido === 'aleatorio' ? mapaAlAzar() : mapaElegido);
  partida = crearPartida(mundo, diseno, PRESUPUESTO - costoDiseno(diseno));
  partida.nombreJugador = cuenta.perfil?.nombre || '';
  empezar();
  aviso(partida, '{mapa} · {lugar}', 'bueno', { mapa: mundo.nombre, lugar: mundo.lugar });
  aviso(partida, 'Llevá el cursor a donde quieras ir y salí a buscar mercantes', 'info');
};

// En línea: todos en el mismo mar
function volverAlAstillero(mensaje) {
  if (red) { red.cerrar(); red = null; }
  partida = null;
  estado = 'astillero';
  for (const id of ['pantalla-puerto', 'pantalla-fin']) $(id).classList.add('oculto');
  $('hud').classList.add('oculto');
  $('pantalla-astillero').classList.remove('oculto');
  $('ast-linea').disabled = false;
  pintarAstillero();
  pintarLinea(mensaje);
}

$('ast-linea').onclick = () => {
  $('ast-linea').disabled = true;
  $('ast-linea-info').textContent = t('Conectando con el mar…');
  const nombre = cuenta.perfil?.nombre || `${t('Capitán')} ${Math.floor(100 + Math.random() * 900)}`;
  red = conectar({
    nombre, diseno,
    alEntrar: (p) => { partida = p; mundo = p.mundo; empezar(); },
    alCerrar: (motivo) => { if (estado !== 'fin') volverAlAstillero(motivo); },
    alPuerto: (ok) => { if (ok && estado === 'mar') abrirPuerto(); },
  });
};

async function pintarLinea(mensaje) {
  const info = $('ast-linea-info');
  if (mensaje) info.textContent = mensaje;
  const e = await estadoDelMar();
  if (estado !== 'astillero' || $('ast-linea').disabled) return;
  const base = e ? t(e.jugadores === 1 ? '1 capitán en {mapa} · el mapa cambia cada día' : '{n} capitanes en {mapa} · el mapa cambia cada día', { n: e.jugadores, mapa: e.nombre }) : t('El mar compartido no responde ahora. Podés jugar solo.');
  info.textContent = mensaje ? `${mensaje} ${e ? '' : base}`.trim() : base;
  $('ast-linea').disabled = !e;
}

// ---------- Puerto ----------
function cercaDelPuerto() {
  const p = mundo.puerto, b = partida.jugador;
  return Math.hypot(b.x - p.x, b.y - p.y) < p.radio;
}

function entrarPuerto() {
  if (partida.enLinea) { red.atracar(); return; } // el servidor confirma y recién ahí se abre
  if (atracar(partida, partida.yo)) abrirPuerto();
}

function abrirPuerto() {
  reportar(false);
  estado = 'puerto';
  oroPuertoPintado = -1;
  $('pantalla-puerto').classList.remove('oculto');
  pintarPuerto();
}

let oroPuertoPintado = -1, clavePuerto = '';
function pintarPuerto() {
  const j = partida, b = j.jugador, s = b.stats, d = b.diseno;
  const grupos = catalogoPuerto(j, j.yo);
  oroPuertoPintado = j.oroPuerto;
  clavePuerto = clavePuertoDe();

  const cont = $('pto-opciones');
  cont.innerHTML = '';
  for (const [titulo, items] of grupos) {
    const h = document.createElement('h3');
    h.textContent = titulo;
    const caja = document.createElement('div');
    caja.className = 'opciones';
    for (const it of items) {
      const alcanza = it.parcial ? j.oroPuerto > 0 : j.oroPuerto >= it.costo;
      const btn = document.createElement('button');
      btn.className = 'opcion' + (it.elegida ? ' elegida' : '');
      const precio = it.ok ? t('{n} oro', { n: it.costo }) : (it.listo || t('Listo'));
      btn.innerHTML = `<b>${it.t}</b><small>${it.d}</small><em class="${it.ok && !alcanza ? 'caro' : ''}">${precio}</em>`;
      btn.disabled = !it.ok || !alcanza;
      btn.onclick = () => {
        if (j.enLinea) { btn.disabled = true; red.comprar(it.id); return; } // se repinta cuando el servidor confirma
        comprar(j, j.yo, it.id);
        pintarPuerto();
      };
      caja.appendChild(btn);
    }
    cont.append(h, caja);
  }

  // Resumen del barco, igual que en el astillero
  $('pto-oro').textContent = t('{n} oro', { n: j.oroPuerto });
  const barras = barrasDe(d);
  $('pto-barras').innerHTML = Object.entries(barras).map(([k, v]) =>
    `<div class="stat"><span>${t(k)}</span><div><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div></div>`).join('')
    + `<p class="suave">${t('Casco {a} de {b} · {c} de {d} marineros · {n} cañones por lado', { a: Math.ceil(b.vida), b: s.vidaMax, c: b.trip, d: s.tripMax, n: d.canones / 2 })}</p>`;
  const c = $('pto-vista'), cx = c.getContext('2d');
  cx.clearRect(0, 0, c.width, c.height);
  const copia = crearBarco(d, 'jugador', 0, 0, { a: -0.25, velas: 3, bandera: '#1f7a3f' });
  cx.save();
  cx.translate(c.width / 2, c.height / 2);
  cx.scale(2.1, 2.1);
  dibujarBarco(cx, copia, { sinBarra: true });
  cx.restore();
}

// En línea, el puerto se repinta cuando cambia algo que mandó el servidor (oro, casco, gente, diseño)
function clavePuertoDe() {
  const b = partida.jugador;
  return [partida.oroPuerto, Math.ceil(b.vida), b.trip, partida.escoltasMax, JSON.stringify(b.diseno)].join('|');
}

$('pto-salir').onclick = () => {
  estado = 'mar';
  $('pantalla-puerto').classList.add('oculto');
};

// ---------- Fin ----------
function mostrarFin() {
  estado = 'fin';
  reportar(true);
  const st = partida.stats;
  const total = Math.round(st.saqueado);
  let mejor = 0;
  try {
    mejor = +localStorage.getItem('flota-mejor') || 0;
    if (total > mejor) localStorage.setItem('flota-mejor', String(total));
  } catch {}
  const min = Math.floor(st.tiempo / 60), seg = Math.floor(st.tiempo % 60);
  $('fin-datos').innerHTML = `
    <div class="fila"><span>${t('Oro saqueado')}</span><b class="oro">${total}</b></div>
    <div class="fila"><span>${t('Barcos hundidos')}</span><b>${st.hundidos}</b></div>
    <div class="fila"><span>${t('Barcos capturados')}</span><b>${st.capturados}</b></div>
    ${partida.enLinea ? `<div class="fila"><span>${t('Jugadores eliminados')}</span><b>${st.eliminados || 0}</b></div>` : ''}
    <div class="fila"><span>${t('Tiempo en el mar')}</span><b>${min}:${String(seg).padStart(2, '0')}</b></div>
    <p class="suave">${total > mejor ? t('¡Nuevo récord!') : t('Tu récord: {n} de oro', { n: mejor })}</p>`;
  $('fin-titulo').textContent = partida.enLinea && partida.causa ? t('Te hundió {nombre}', { nombre: partida.causa }) : t('Te hundieron');
  $('pantalla-puerto').classList.add('oculto');
  $('pantalla-fin').classList.remove('oculto');
  $('hud').classList.add('oculto');
}

$('fin-otra').onclick = () => volverAlAstillero();

// ---------- Entrada ----------
addEventListener('keydown', (e) => {
  if (estado !== 'mar') return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (e.repeat) return;
  teclas.add(k);
  if (k === 'q') pulsos.fuego = -1;
  if (k === 'e') pulsos.fuego = 1;
  if (k === ' ') pulsos.fuegoTodo = true;
  if (k === 'f') pulsos.abordar = true;
  if (k === 'g') pulsos.ordenFlota = true;
  if (k === 'p' && !partida.fin && cercaDelPuerto()) entrarPuerto();
  if (k === 'tab') e.preventDefault();
});
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
addEventListener('blur', () => teclas.clear());
let ratonVisto = false;
addEventListener('mousemove', (e) => { vista.ratonPx = { x: e.clientX, y: e.clientY }; ratonVisto = true; });
canvas.addEventListener('mousedown', (e) => {
  if (estado === 'mar' && e.button === 0) { vista.ratonPx = { x: e.clientX, y: e.clientY }; ratonVisto = true; pulsos.fuegoTodo = true; }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function ratonAMundo() {
  const dpr = canvas.width / innerWidth, yo = partida.jugador;
  vista.raton.x = yo.x + (vista.ratonPx.x * dpr - vista.ancho / 2) / vista.zoom;
  vista.raton.y = yo.y + (vista.ratonPx.y * dpr - vista.alto / 2) / vista.zoom;
}

// ---------- HUD ----------
let avisosPintados = '';
let banderaHud = '';
let tablaPintada = '';
function pintarHud() {
  const j = partida, b = j.jugador, s = b.stats;
  $('hud-nombre').textContent = `${t(CASCOS[b.diseno.casco].nombre)} · ${t((FACCIONES[b.diseno.faccion] || FACCIONES.espanoles).nombre)}`;
  if (banderaHud !== b.diseno.faccion) { banderaHud = b.diseno.faccion; dibujarBandera($('hud-bandera').getContext('2d'), banderaHud, 30, 20); }
  $('hud-zona').textContent = t(nombreZona(nivelZona(mundo, b.x, b.y)));
  $('hud-mapa').textContent = t(mundo.nombre);
  $('hud-vida').style.width = `${Math.max(0, (b.vida / s.vidaMax) * 100)}%`;
  $('hud-vida-txt').textContent = `${t('Casco')} ${Math.max(0, Math.ceil(b.vida))} / ${s.vidaMax}`;
  $('hud-trip').style.width = `${Math.max(0, (b.trip / s.tripMax) * 100)}%`;
  $('hud-trip-txt').textContent = `${t('Tripulación')} ${b.trip} / ${s.tripMax}`;
  $('hud-velas').textContent = '▰'.repeat(b.velas) + '▱'.repeat(3 - b.velas);
  const esc = j.barcos.filter((x) => x.bando === 'escolta' && !x.hundiendo).length;
  $('hud-flota').textContent = `${t('{a} de {b}', { a: esc, b: j.escoltasMax })} · ${t(j.ordenFlota === 'ataque' ? 'al ataque' : 'en formación')}`;
  $('hud-bodega').textContent = j.oroBodega;
  $('hud-puerto').textContent = j.oroPuerto;
  $('hud-hundidos').textContent = j.stats.hundidos;
  if (j.enLinea) {
    $('hud-eliminados').textContent = j.stats.eliminados || 0;
    const top = [...j.jugadores].sort((a, c) => c[2] - a[2]).slice(0, 5);
    const clave = top.map((x) => x[1] + x[2]).join('|') + j.jugadores.length;
    if (clave !== tablaPintada) {
      tablaPintada = clave;
      $('hud-tabla').innerHTML = `<div class="fila"><b>${t('En el mar')}</b><span>${j.jugadores.length}</span></div>`
        + top.map((x, q) => `<div class="fila${x[0] === j.yo.id ? ' yo' : ''}"><span>${q + 1}. ${limpiar(x[1])}</span><b class="oro">${x[2]}</b></div>`).join('');
    }
  }
  const total = (lado) => (b.recargaTotal && b.recargaTotal[lado]) || s.recarga;
  $('hud-rec-izq').style.width = `${100 - Math.min(100, (b.recarga['-1'] / total('-1')) * 100)}%`;
  $('hud-rec-der').style.width = `${100 - Math.min(100, (b.recarga['1'] / total('1')) * 100)}%`;
  const averia = b.vida < s.vidaMax * 0.7 ? ` · ${t('averiado, vas más lento')}` : '';
  $('hud-velas-txt').textContent = t(b.velas >= 3 ? 'A toda vela: recarga lenta' : b.velas === 2 ? 'Media vela' : 'Velas de combate: recarga rápida') + averia;

  const clave = j.avisos.map((a) => a.texto + (a.p ? JSON.stringify(a.p) : '')).join('|');
  if (clave !== avisosPintados) {
    avisosPintados = clave;
    $('avisos').innerHTML = j.avisos.map((a) => `<div class="aviso ${a.tipo}">${limpiar(t(a.texto, a.p))}</div>`).join('');
  }
  let pista = '';
  const cand = candidatoAbordaje(j);
  if (j.fin) pista = '';
  else if (cercaDelPuerto()) pista = j.oroBodega ? t('P: entrar al puerto y guardar {n} de oro', { n: j.oroBodega }) : t('P: entrar al puerto');
  else if (j.gancho && j.gancho.fase === 'enganchado') pista = t('Tirando de la soga del {barco}…', { barco: j.gancho.obj.nombre });
  else if (b.reparando) pista = t('Reparando el casco en la costa (hasta el 75 %)');
  else if (cand && j.cdAbordaje <= 0 && !j.gancho) pista = t('F: apuntá con el cursor y tirá el gancho al {barco} · tu gente {a} contra {b} ({ventaja})', { barco: cand.b.nombre, a: b.trip, b: cand.b.trip, ventaja: cand.ventaja });
  if ($('pista').textContent !== pista) $('pista').textContent = pista;
}

// ---------- Ciclo ----------
let anterior = performance.now();
let cuadros = 0, lentos = 0, medidos = 0;
function cuadro(ahora) {
  const real = ahora - anterior;
  const dt = Math.min(0.05, real / 1000);
  anterior = ahora;
  if (estado === 'mar' && !document.hidden && real < 250) {
    medidos++;
    if (real > 21) lentos++;
    if (medidos >= 120) {
      if (lentos > 70 && calidad > 0.6) { calidad = calidad > 0.8 ? 0.8 : 0.6; ajustar(); }
      medidos = 0; lentos = 0;
    }
  }
  if (partida) {
    ratonAMundo();
    if (estado === 'mar') {
      const entrada = { objetivo: ratonVisto ? { ...vista.raton } : null, ...pulsos };
      pulsos = {};
      if (partida.enLinea) red.cuadro(dt, entrada);
      else actualizar(partida, dt, entrada);
      if (partida.fin && partida.t - partida.finEn > 2.2) mostrarFin();
    } else if (partida.enLinea && (estado === 'puerto' || estado === 'fin')) {
      // en línea el mar no se detiene: el barco queda quieto en el puerto, que es zona segura
      red.cuadro(dt, { quieto: true });
      if (estado === 'puerto') {
        if (partida.fin) mostrarFin();
        else if (clavePuertoDe() !== clavePuerto) pintarPuerto();
      }
    }
    dibujarEscena(ctx, partida, vista);
    if (estado === 'mar' && ++cuadros % 6 === 0) { pintarHud(); dibujarMinimapa(mini, partida, 170); }
  }
  requestAnimationFrame(cuadro);
}


// ---------- Cuenta, nombre de jugador y perfil ----------
const limpiar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pintarCuenta() {
  const caja = $('cuenta');
  if (!cuenta.disponible) { caja.innerHTML = ''; return; }
  if (cuenta.cargando) { caja.innerHTML = `<span class="suave">${t('Cargando tu cuenta…')}</span>`; return; }
  if (!cuenta.usuario) {
    caja.innerHTML = `<button id="cta-entrar" class="boton">${t('Entrar con Google')}</button><span class="suave">${t('Para guardar tus estadísticas')}</span>`;
    $('cta-entrar').onclick = () => entrarConGoogle().catch((e) => alert(e.message));
    return;
  }
  if (!cuenta.perfil) { // entró con Google pero todavía no eligió su nombre de jugador
    caja.innerHTML = `<button id="cta-nombre" class="boton">${t('Elegir nombre de jugador')}</button>`;
    $('cta-nombre').onclick = () => abrirNombre();
    if (estado === 'astillero') abrirNombre();
    return;
  }
  caja.innerHTML = `<button id="cta-perfil" class="boton">⚓ ${limpiar(cuenta.perfil.nombre)}</button><button id="cta-salir" class="boton enlace">${t('Salir')}</button>`;
  $('cta-perfil').onclick = () => abrirPerfil();
  $('cta-salir').onclick = () => salir();
}

function abrirNombre() {
  $('nom-input').value = cuenta.perfil?.nombre || '';
  $('nom-error').textContent = '';
  $('pantalla-nombre').classList.remove('oculto');
  $('nom-cancelar').classList.toggle('oculto', !cuenta.perfil);
  setTimeout(() => $('nom-input').focus(), 50);
}

$('nom-form').onsubmit = async (e) => {
  e.preventDefault();
  $('nom-guardar').disabled = true;
  try {
    await elegirNombre($('nom-input').value);
    $('pantalla-nombre').classList.add('oculto');
    if (!$('pantalla-perfil').classList.contains('oculto')) abrirPerfil();
  } catch (err) { $('nom-error').textContent = err.message; }
  $('nom-guardar').disabled = false;
};
$('nom-cancelar').onclick = () => $('pantalla-nombre').classList.add('oculto');

async function abrirPerfil() {
  const p = cuenta.perfil;
  if (!p) return;
  const h = Math.floor(p.segundos_jugados / 3600), m = Math.floor((p.segundos_jugados % 3600) / 60);
  $('per-nombre').textContent = p.nombre;
  const dato = (t, v) => `<div class="dato"><b>${v}</b><span>${t}</span></div>`;
  $('per-datos').innerHTML = dato(t('Barcos hundidos'), p.barcos_hundidos) + dato(t('Barcos capturados'), p.barcos_capturados)
    + dato(t('Jugadores eliminados'), p.jugadores_eliminados) + dato(t('Oro saqueado'), p.oro_saqueado)
    + dato(t('Mejor saqueo'), p.mejor_saqueo) + dato(t('Partidas'), p.partidas) + dato(t('Tiempo en el mar'), `${h} h ${m} min`);
  $('per-ranking').innerHTML = `<p class="suave">${t('Cargando…')}</p>`;
  $('pantalla-perfil').classList.remove('oculto');
  const top = await ranking();
  $('per-ranking').innerHTML = top.length
    ? top.map((r, i) => `<div class="fila${r.nombre === p.nombre ? ' yo' : ''}"><span>${i + 1}. ${limpiar(r.nombre)}</span><b class="oro">${r.mejor_saqueo}</b></div>`).join('')
    : `<p class="suave">${t('Todavía no hay nadie en la tabla.')}</p>`;
}
$('per-cerrar').onclick = () => $('pantalla-perfil').classList.add('oculto');
$('per-cambiar').onclick = () => abrirNombre();

// Manda al perfil lo hecho desde el último reporte (al entrar al puerto y al terminar la partida)
function reportar(fin) {
  if (!partida || !cuenta.perfil) return;
  const st = partida.stats, r = partida.reportado || (partida.reportado = { hundidos: 0, capturados: 0, eliminados: 0, saqueado: 0, tiempo: 0 });
  const d = {
    hundidos: st.hundidos - r.hundidos, capturados: st.capturados - r.capturados, eliminados: (st.eliminados || 0) - (r.eliminados || 0), oro: Math.round(st.saqueado - r.saqueado),
    segundos: Math.round(st.tiempo - r.tiempo), saqueoPartida: Math.round(st.saqueado), fin,
  };
  partida.reportado = { hundidos: st.hundidos, capturados: st.capturados, eliminados: st.eliminados || 0, saqueado: st.saqueado, tiempo: st.tiempo };
  registrarProgreso(d);
}

// ---------- Ajustes: idioma y pantalla clara u oscura ----------
// Los textos fijos del HTML llevan data-t; la primera vez se guarda el texto en español, que es la clave para traducir
function traducirPagina() {
  for (const el of document.querySelectorAll('[data-t]')) {
    if (!el.dataset.t) el.dataset.t = el.textContent.trim();
    el.textContent = t(el.dataset.t);
  }
  for (const el of document.querySelectorAll('[data-t-ph]')) {
    if (!el.dataset.tPh) el.dataset.tPh = el.placeholder;
    el.placeholder = t(el.dataset.tPh);
  }
  $('aj-abrir').title = t('Ajustes');
}

let tema = 'oscuro';
try { tema = localStorage.getItem('aon-tema') === 'claro' ? 'claro' : 'oscuro'; } catch {}
function ponerTema(id) {
  tema = id;
  document.documentElement.dataset.tema = id;
  try { localStorage.setItem('aon-tema', id); } catch {}
}

function pintarAjustes() {
  $('aj-idiomas').innerHTML = Object.entries(IDIOMAS).map(([id, nombre]) =>
    `<button type="button" class="chip${id === idiomaActual() ? ' elegida' : ''}" data-id="${id}" title="${nombre}">${id.toUpperCase()}</button>`).join('');
  for (const b of $('aj-idiomas').children) b.onclick = () => cambiarIdioma(b.dataset.id);
  $('aj-idioma-nombre').textContent = IDIOMAS[idiomaActual()];
  for (const b of $('aj-temas').children) {
    b.classList.toggle('elegida', b.dataset.id === tema);
    b.onclick = () => { ponerTema(b.dataset.id); pintarAjustes(); };
  }
}

function cambiarIdioma(id) {
  elegirIdioma(id);
  traducirPagina();
  $('map-grilla').innerHTML = ''; // las tarjetas de mapas se arman de nuevo en el idioma elegido
  pintarAstillero();
  pintarMapa();
  pintarCuenta();
  pintarLinea();
  pintarAjustes();
  if (estado === 'puerto') pintarPuerto();
  avisosPintados = ''; tablaPintada = '';
}

$('aj-abrir').onclick = () => { pintarAjustes(); $('pantalla-ajustes').classList.remove('oculto'); };
$('aj-cerrar').onclick = () => $('pantalla-ajustes').classList.add('oculto');
ponerTema(tema);
traducirPagina();
pintarMapa();

iniciarCuenta(pintarCuenta);
pintarCuenta();

pintarAstillero();
pintarLinea();
requestAnimationFrame(cuadro);

// Para probar desde la consola
window.flota = { get partida() { return partida; }, get mundo() { return mundo; }, get red() { return red; }, get estado() { return estado; } };
