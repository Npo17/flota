// Pega todo: pantallas (astillero, puerto, fin), teclado y el ciclo del juego.
import { PRESUPUESTO, FACCIONES, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, COSTO_CANON, HABILIDADES } from './config.js';
import { costoDiseno, barrasDe, crearBarco, statsDe } from './barcos.js';
import { crearMundo, nivelZona, nombreZona } from './mundo.js';
import { MAPAS, mapaAlAzar } from './mapas.js';
import { crearPartida, actualizar, candidatoAbordaje, aviso, atracar, rindeViento, difAng, vientoEn, FORMACIONES } from './juego.js';
import { catalogoPuerto, comprar } from './puerto.js';
import { conectar, estadoDelMar, salasPublicas } from './red.js';
import { dibujarEscena, dibujarMinimapa, dibujarBarco, dibujarVistaMapa } from './dibujo.js';
import { dibujarBandera } from './banderas.js';
import { t, IDIOMAS, registrarTextos, idiomaActual, idiomaInicial, elegirIdioma } from './idioma.js';
import { TEXTOS } from './textos.js';
import { TEXTOS_HISTORIA } from './textos-historia.js';
import * as sonido from './sonido.js';
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
// Reglas que elige el jugador para el modo solo y para las salas que crea
const reglas = { viento: true, abordajes: true };
try { const g = JSON.parse(localStorage.getItem('aon-reglas') || '{}'); reglas.viento = g.viento !== false; reglas.abordajes = g.abordajes !== false; } catch {}
let diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', habilidad: 'andanada' };
let partida = null;
let red = null; // conexión al mar compartido cuando se juega en línea
let reglasPartida = null; // las reglas con las que empezó la partida de un jugador (para reaparecer con las mismas)
let cuentaAtras = 0, relojFin = null, escapeEn = 0;
let estado = 'astillero'; // astillero | mar | puerto | fin
const vista = { ancho: 0, alto: 0, zoom: 1, raton: { x: 0, y: 0 }, ratonPx: { x: 0, y: 0 }, ladoRaton: 1 };
const teclas = new Set();
let pulsos = {}; // acciones de un solo toque
let velasPedidas = 3; // de 0 (aferradas) a 3 (todo el trapo): se cambian con las flechas o la rueda

// Zoom que elige el jugador con Ctrl + rueda: de 0,55 (ves mucho mar) a 1,6 (de cerca)
let zoomJugador = 1;
try { zoomJugador = Math.max(0.55, Math.min(1.6, +localStorage.getItem('aon-zoom') || 1)); } catch {}
function cambiarZoom(f) {
  zoomJugador = Math.max(0.55, Math.min(1.6, Math.round(zoomJugador * f * 100) / 100));
  try { localStorage.setItem('aon-zoom', String(zoomJugador)); } catch {}
  ajustar();
}

// Si el equipo no llega a 60 cuadros por segundo, se baja la resolución del dibujo en dos escalones
let calidad = 1;
function ajustar() {
  const dpr = Math.min(2, window.devicePixelRatio || 1) * calidad;
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  vista.ancho = canvas.width;
  vista.alto = canvas.height;
  vista.zoom = dpr * Math.max(0.7, Math.min(1.15, innerHeight / 800)) * zoomJugador;
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
      if (clave === 'municion' || clave === 'casco') sonido.muestra(diseno.casco, diseno.municion, 0.45); // se oye cómo va a sonar ese cañón
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
  cont.append(h, d, ...grupo(t('Munición'), MUNICIONES, 'municion'), ...grupo(t('Tripulación'), TRIPULACIONES, 'trip'), ...grupo(t('Habilidad · elegí una, se usa con R'), HABILIDADES, 'habilidad'));

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

function pintarReglas() {
  for (const [id, clave, si, no] of [['reg-viento', 'viento', 'Con viento', 'Sin viento'], ['reg-abordajes', 'abordajes', 'Con abordajes', 'Sin abordajes']]) {
    const b = $(id);
    b.textContent = t(reglas[clave] ? si : no);
    b.classList.toggle('elegida', reglas[clave]);
    b.onclick = () => { reglas[clave] = !reglas[clave]; try { localStorage.setItem('aon-reglas', JSON.stringify(reglas)); } catch {} pintarReglas(); };
  }
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
  tesoroDist0 = 0; vientoCambios = -1; enBrisa = false; $('hud-tesoro').classList.add('oculto'); $('hud-cartel').classList.add('oculto');
  // el sonido de cada evento; para un cañonazo se busca qué barco disparó (el más cercano al fogonazo): según su casco y su munición suena distinto
  partida.alEfecto = (ev) => {
    let de = null;
    if (ev.k === 'c') {
      let cerca = 1e9;
      for (const b of partida.barcos) { const d = Math.hypot(b.x - ev.x, b.y - ev.y); if (d < cerca && d < b.stats.largo + 40) { cerca = d; de = b.diseno; } }
    }
    sonido.evento(ev, partida.jugador, de);
  };
  velasPedidas = 3;
  $('pantalla-astillero').classList.add('oculto');
  $('hud').classList.remove('oculto');
  $('hud-linea').classList.toggle('oculto', !partida.enLinea);
}

// Modo solo: vos contra los bots, en el mapa que elijas
$('ast-zarpar').onclick = () => {
  mundo = crearMundo(mapaElegido === 'aleatorio' ? mapaAlAzar() : mapaElegido);
  reglasPartida = { ...reglas };
  partida = crearPartida(mundo, diseno, PRESUPUESTO - costoDiseno(diseno), reglasPartida);
  partida.nombreJugador = cuenta.perfil?.nombre || '';
  empezar();
  aviso(partida, '{mapa} · {lugar}', 'bueno', { mapa: mundo.nombre, lugar: mundo.lugar });
  aviso(partida, 'Llevá el cursor a donde quieras ir y salí a buscar mercantes', 'info');
  aviso(partida, 'Los barcos de tu civilización son de tu equipo: no los podés dañar y pelean a tu favor', 'info');
  if (reglas.viento) aviso(partida, 'La flecha dorada muestra hacia dónde sopla el viento: de popa vas más rápido, de proa más lento', 'info');
};

// En línea: todos en el mismo mar
function volverAlAstillero(mensaje) {
  clearInterval(relojFin);
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

// ---------- Salas: jugar con amigos o en una sala pública ----------
// Una sala es un mar aparte, con el mapa y las reglas que eligió quien la creó. Se entra con su código.
function abrirSalas(codigo) {
  $('pantalla-salas').classList.remove('oculto');
  $('sal-info').textContent = '';
  if (codigo) $('sal-codigo').value = codigo;
  const m = MAPAS[mapaElegido];
  $('sal-resumen').textContent = `${t(m ? m.nombre : 'Mapa aleatorio')} · ${t(reglas.viento ? 'Con viento' : 'Sin viento')} · ${t(reglas.abordajes ? 'Con abordajes' : 'Sin abordajes')}`;
  pintarSalas();
}

async function pintarSalas() {
  const lista = $('sal-lista');
  const salas = await salasPublicas();
  if ($('pantalla-salas').classList.contains('oculto')) return;
  if (!salas || !salas.length) { lista.innerHTML = `<p class="suave">${t(salas ? 'No hay salas públicas ahora. Creá una.' : 'El mar compartido no responde ahora. Podés jugar solo.')}</p>`; return; }
  lista.innerHTML = salas.map((s) => `<button type="button" class="sala" data-codigo="${limpiar(s.codigo)}"><span><b>${limpiar(t('Sala de {nombre}', { nombre: s.nombre }))}</b>
    <small>${limpiar(t(MAPAS[s.mapa] ? MAPAS[s.mapa].nombre : 'Mapa aleatorio'))} · ${t('{n} de {max} capitanes', { n: s.jugadores, max: s.max })} · ${t(s.viento ? 'Con viento' : 'Sin viento')} · ${t(s.abordajes ? 'Con abordajes' : 'Sin abordajes')}</small></span><i>${t('Entrar')}</i></button>`).join('');
  for (const b of lista.children) b.onclick = () => entrarSala(b.dataset.codigo);
}

// crear: los datos de la sala si la arma este jugador; sin eso, entra a una que ya existe
function entrarSala(codigo, crear) {
  codigo = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (codigo.length < 4) { $('sal-info').textContent = t('El código tiene entre 4 y 6 letras o números.'); return; }
  if (PRESUPUESTO - costoDiseno(diseno) < 0) { $('sal-info').textContent = t('Te pasaste del presupuesto'); return; }
  if (red) { red.cerrar(); red = null; }
  $('sal-info').textContent = t('Conectando con la sala…');
  const nombre = cuenta.perfil?.nombre || `${t('Capitán')} ${Math.floor(100 + Math.random() * 900)}`;
  let adentro = false;
  red = conectar({
    nombre, diseno, sala: { codigo, crear },
    alEntrar: (p) => { adentro = true; partida = p; mundo = p.mundo; $('pantalla-salas').classList.add('oculto'); empezar(); },
    alCerrar: (motivo) => {
      if (adentro) { if (estado !== 'fin') volverAlAstillero(motivo); return; }
      red = null; // no llegó a entrar: el motivo se muestra en la misma pantalla
      $('sal-info').textContent = motivo;
      pintarSalas();
    },
    alPuerto: (ok) => { if (ok && estado === 'mar') abrirPuerto(); },
  });
}

$('ast-salas').onclick = () => abrirSalas();
$('sal-cerrar').onclick = () => { if (red && estado === 'astillero') { red.cerrar(); red = null; } $('pantalla-salas').classList.add('oculto'); };
$('sal-entrar').onclick = () => entrarSala($('sal-codigo').value);
$('sal-codigo').onkeydown = (ev) => { if (ev.key === 'Enter') entrarSala($('sal-codigo').value); };
$('sal-crear').onclick = () => {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin las que se confunden (O y 0, I y 1)
  let codigo = '';
  for (let i = 0; i < 5; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
  entrarSala(codigo, { mapa: mapaElegido === 'aleatorio' ? mapaAlAzar() : mapaElegido, max: +$('sal-max').value, publica: $('sal-publica').checked, viento: reglas.viento, abordajes: reglas.abordajes });
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
  // a los pocos segundos reaparece solo en el puerto, con el mismo barco
  cuentaAtras = 6;
  const pintar = () => { $('fin-volver').textContent = t('Volver al mar ({n})', { n: cuentaAtras }); };
  pintar();
  clearInterval(relojFin);
  relojFin = setInterval(() => { if (--cuentaAtras <= 0) reaparecer(); else pintar(); }, 1000);
}

// Te hundieron: volvés al puerto con el barco que habías armado, desde cero (sin el oro ni las mejoras de la partida anterior).
// Para armar otra flota u otra civilización está "Cambiar de flota" (o ESC en cualquier momento).
function reaparecer() {
  clearInterval(relojFin);
  if (estado !== 'fin') return;
  $('pantalla-fin').classList.add('oculto');
  if (partida.enLinea) {
    if (!red || !red.reentrar()) volverAlAstillero(t('Se cortó la conexión con el mar.')); // al llegar el barco nuevo, red avisa y arranca solo
    return;
  }
  partida = crearPartida(mundo, diseno, PRESUPUESTO - costoDiseno(diseno), reglasPartida || reglas);
  partida.nombreJugador = cuenta.perfil?.nombre || '';
  empezar();
}

$('fin-volver').onclick = reaparecer;
$('hud-orden').onclick = () => { pulsos.ordenFlota = true; };
$('hud-formacion').onclick = () => { pulsos.formacion = true; };
$('fin-otra').onclick = () => volverAlAstillero();

// ---------- Entrada ----------
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.repeat) { // ESC: dejar la partida para armar otra flota (dos veces seguidas en el mar, para no salir sin querer)
    if (estado === 'fin') return volverAlAstillero();
    if (estado === 'mar' && partida && !partida.fin) {
      const ahora = performance.now();
      if (ahora - escapeEn < 3500) { escapeEn = 0; reportar(true); return volverAlAstillero(); }
      escapeEn = ahora;
    }
    return;
  }
  if (estado !== 'mar') return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (e.repeat) return;
  teclas.add(k);
  // Teclas (13/11/2026, pedido de Nicolás): Q y W son de la flota, como en los juegos de estrategia. El disparo por teclado pasó
  // a A (babor) y D (estribor) — además del ratón y la barra — y las velas quedan en las flechas y la rueda.
  if (k === 'a') pulsos.fuego = -1;
  if (k === 'd') pulsos.fuego = 1;
  if (k === ' ') pulsos.fuegoTodo = true;
  if (k === 'r') pulsos.habilidad = true;
  if (k === 'arrowup') cambiarVelas(1);
  if (k === 'arrowdown') cambiarVelas(-1);
  if (k === 'f') pulsos.abordar = true;
  if (k === 'q' || k === 'g') pulsos.ordenFlota = true; // G y H siguen andando, por costumbre
  if (k === 'w' || k === 'h') pulsos.formacion = true;
  if (k === 'p' && !partida.fin && cercaDelPuerto()) entrarPuerto();
  if (k === 'tab') e.preventDefault();
});
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
addEventListener('blur', () => teclas.clear());
let ratonVisto = false;
addEventListener('mousemove', (e) => { vista.ratonPx = { x: e.clientX, y: e.clientY }; ratonVisto = true; });
// clic izquierdo: costado de babor (el izquierdo del barco); clic derecho: estribor. Los dos a la vez, la andanada completa.
canvas.addEventListener('mousedown', (e) => {
  if (estado !== 'mar' || (e.button !== 0 && e.button !== 2)) return;
  vista.ratonPx = { x: e.clientX, y: e.clientY }; ratonVisto = true;
  const lado = e.button === 0 ? -1 : 1;
  if (pulsos.fuego && pulsos.fuego !== lado) pulsos.fuegoTodo = true;
  else pulsos.fuego = lado;
});
function cambiarVelas(paso) { velasPedidas = Math.max(0, Math.min(3, velasPedidas + paso)); }
let ultimaRueda = 0;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); // también frena el zoom de página del navegador con Ctrl + rueda
  if (estado === 'mar' && e.ctrlKey && e.deltaY) { cambiarZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1); return; } // Ctrl + rueda: zoom de la cámara
  if (estado !== 'mar' || !e.deltaY || e.timeStamp - ultimaRueda < 130) return; // una muesca por vez, también con panel táctil
  ultimaRueda = e.timeStamp;
  cambiarVelas(e.deltaY < 0 ? 1 : -1);
}, { passive: false });
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
  $('hud-mapa').textContent = t(mundo.nombre) + (j.sala ? ` · ${t('Sala {codigo}', { codigo: j.sala })}` : '');
  $('hud-vida').style.width = `${Math.max(0, (b.vida / s.vidaMax) * 100)}%`;
  $('hud-vida-txt').textContent = `${t('Casco')} ${Math.max(0, Math.ceil(b.vida))} / ${s.vidaMax}`;
  $('hud-trip').style.width = `${Math.max(0, (b.trip / s.tripMax) * 100)}%`;
  $('hud-trip-txt').textContent = `${t('Tripulación')} ${b.trip} / ${s.tripMax}`;
  $('hud-velas').textContent = '▰'.repeat(b.velas) + '▱'.repeat(3 - b.velas);
  const esc = j.barcos.filter((x) => x.bando === 'escolta' && !x.hundiendo).length;
  $('hud-flota').textContent = `${t('{a} de {b}', { a: esc, b: j.escoltasMax })} · ${t(j.ordenFlota === 'ataque' ? 'al ataque' : 'en formación')}`;
  // con barcos capturados aparecen los dos botones de órdenes
  $('hud-flota-botones').classList.toggle('oculto', esc === 0);
  if (esc > 0) {
    const orden = `${t(j.ordenFlota === 'ataque' ? 'Atacar' : 'Seguirme')} (Q)`, forma = `${t(FORMACIONES[j.formacion || 0].nombre)} (W)`;
    if ($('hud-orden').textContent !== orden) $('hud-orden').textContent = orden;
    if ($('hud-formacion').textContent !== forma) $('hud-formacion').textContent = forma;
  }
  pintarEventos(j, b);
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
  $('hud-velas-txt').textContent = t(b.velas >= 3 ? 'A toda vela: recarga lenta' : b.velas === 2 ? 'Media vela' : b.velas === 1 ? 'Velas de combate: recarga rápida' : 'Velas aferradas: el barco se detiene') + averia;
  pintarViento(j, b);
  const hab = HABILIDADES[b.diseno.habilidad] || HABILIDADES.andanada, cdH = j.cdHabilidad || 0;
  $('hud-hab-txt').textContent = `${t(hab.nombre)} (R)${cdH > 0 ? ` · ${Math.ceil(cdH)} s` : ''}`;
  $('hud-hab').style.width = `${100 - Math.min(100, (cdH / hab.espera) * 100)}%`;

  const clave = j.avisos.map((a) => a.texto + (a.p ? JSON.stringify(a.p) : '')).join('|');
  if (clave !== avisosPintados) {
    avisosPintados = clave;
    $('avisos').innerHTML = j.avisos.map((a) => `<div class="aviso ${a.tipo}">${limpiar(t(a.texto, a.p))}</div>`).join('');
  }
  let pista = '';
  const cand = candidatoAbordaje(j, vista.raton);
  if (j.fin) pista = '';
  else if (performance.now() - escapeEn < 3500) pista = t('ESC otra vez para dejar la partida y cambiar de flota');
  else if (cercaDelPuerto()) pista = j.oroBodega ? t('P: entrar al puerto y guardar {n} de oro', { n: j.oroBodega }) : t('P: entrar al puerto');
  else if (j.gancho && j.gancho.fase === 'enganchado') pista = t('Abordando el {barco}: tu gente {a} contra {b} · F para cortar las sogas', { barco: j.gancho.obj.nombre, a: b.trip, b: j.gancho.obj.trip });
  else if (b.reparando) pista = t('Reparando el casco en la costa (hasta el 75 %)');
  else if (cand && j.cdAbordaje <= 0 && !j.gancho) pista = t(cand.cerca ? 'F: abordar el {barco} · tu gente {a} contra {b} ({ventaja})' : 'Arrimate al {barco} para abordarlo · tu gente {a} contra {b} ({ventaja})', { barco: cand.b.nombre, a: b.trip, b: cand.b.trip, ventaja: cand.ventaja });
  if ($('pista').textContent !== pista) $('pista').textContent = pista;
}

// Lo que pasa en el mar y hay que avisar: el galeón del tesoro (cartel con el tiempo que le queda), el viento que cambia
// de rumbo (cartel grande) y la brisa que agarra tu barco (solo sonido).
let tesoroDist0 = 0, tesoroVel = 0, vientoCambios = -1, enBrisa = false, relojCartel = null;
function cartel(texto) {
  const c = $('hud-cartel');
  c.textContent = texto;
  c.classList.remove('oculto'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  clearTimeout(relojCartel); relojCartel = setTimeout(() => c.classList.add('oculto'), 3600);
}
function pintarEventos(j, b) {
  // el galeón del tesoro: va de mar adentro al puerto; la barra muestra cuánto camino le queda
  const galeon = j.barcos.find((x) => x.convoy && !x.hundiendo && x.bando === 'enemigo');
  $('hud-tesoro').classList.toggle('oculto', !galeon);
  if (galeon) {
    const p = j.mundo.puerto, falta = Math.max(0, Math.hypot(galeon.x - p.x, galeon.y - p.y) - p.radio - 470);
    if (!tesoroDist0) { tesoroDist0 = Math.max(falta, 1); tesoroVel = 60; sonido.tesoro(); }
    tesoroVel += (Math.max(25, Math.abs(galeon.v || 0)) - tesoroVel) * 0.05;
    const seg = Math.round(falta / tesoroVel);
    $('hud-tesoro-barra').style.width = Math.max(0, Math.min(100, 100 * falta / tesoroDist0)) + '%';
    const txt = t('Llega al puerto en {t}', { t: `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}` });
    if ($('hud-tesoro-txt').textContent !== txt) $('hud-tesoro-txt').textContent = txt;
  } else tesoroDist0 = 0;
  // el viento cambió de rumbo
  const cambios = j.viento ? j.viento.cambios || 0 : 0;
  if (vientoCambios >= 0 && cambios > vientoCambios) { cartel(t('El viento cambió')); sonido.vientoCambio(); }
  vientoCambios = cambios;
  // agarraste una brisa
  if (b.enRafaga && !enBrisa) sonido.brisa();
  enBrisa = !!b.enRafaga;
}

// Brújula del viento: la flecha dorada apunta hacia donde sopla; el triángulo es tu barco
function pintarViento(j, b) {
  const v = j.viento;
  $('hud-viento-fila').classList.toggle('oculto', !v);
  if (!v) return;
  const aca = vientoEn(j, b.x, b.y); // el viento donde está tu barco (cambia de una zona a otra)
  const rinde = rindeViento(j, b), rel = Math.abs(difAng(b.a, aca)) * 180 / Math.PI;
  const nombre = rel < 30 ? 'Viento de popa' : rel < 75 ? 'Viento de aleta' : rel < 110 ? 'Viento de través' : rel < 155 ? 'Ciñendo' : 'Viento de proa';
  const pct = Math.round((rinde - 1) * 100);
  const txt = $('hud-viento-txt');
  txt.textContent = `${t(nombre)} · ${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)} %${b.enRafaga ? ` · ${t('ráfaga')}` : ''}`;
  txt.className = pct > 4 ? 'bien' : pct < -4 ? 'mal' : '';
  const c = $('hud-viento'), x = c.getContext('2d'), R = c.width / 2;
  x.clearRect(0, 0, c.width, c.height);
  x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 1.5;
  x.beginPath(); x.arc(R, R, R - 2, 0, Math.PI * 2); x.stroke();
  x.save(); x.translate(R, R); x.rotate(aca);
  x.strokeStyle = '#ffd166'; x.fillStyle = '#ffd166'; x.lineWidth = 3; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-R + 6, 0); x.lineTo(R - 12, 0); x.stroke();
  x.beginPath(); x.moveTo(R - 3, 0); x.lineTo(R - 13, -6); x.lineTo(R - 13, 6); x.closePath(); x.fill();
  x.restore();
  x.save(); x.translate(R, R); x.rotate(b.a);
  x.fillStyle = '#fff'; x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(9, 0); x.lineTo(-6, -4.5); x.lineTo(-3, 0); x.lineTo(-6, 4.5); x.closePath(); x.fill(); x.stroke();
  x.restore();
}

// ---------- Ciclo ----------
let anterior = performance.now();
let cuadros = 0, lentos = 0, medidos = 0;
function cuadro(ahora) {
  requestAnimationFrame(cuadro); // primero: si algo falla en este cuadro, el juego sigue en el próximo en vez de quedar congelado
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
      const entrada = { objetivo: ratonVisto ? { ...vista.raton } : null, velas: velasPedidas, ...pulsos };
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
    if (estado === 'mar' && ++cuadros % 6 === 0) { pintarHud(); dibujarMinimapa(mini, partida, 240); }
  }
  // sonido: en el astillero, la música; en el mar, las olas y el viento (más fuerte dentro de una ráfaga y con el barco lanzado)
  if (estado === 'astillero' || !partida) { sonido.ambiente('lobby'); sonido.abordaje('nada'); }
  else {
    const yo = partida.jugador;
    const sopla = partida.viento ? 0.38 + (yo && yo.enRafaga ? 0.45 : 0) : 0.10;
    // cuán adentro de un remolino está el barco: se empieza a oír un poco antes del borde y crece hasta el centro
    let remolino = 0;
    if (estado === 'mar' && yo && !partida.fin) for (const w of partida.mundo.remolinos) {
      const alcance = w.radio * 1.6, d = Math.hypot(w.x - yo.x, w.y - yo.y);
      if (d < alcance) remolino = Math.max(remolino, 1 - d / alcance);
    }
    // abordaje: la soga en el aire, y la pelea mientras estés enganchado (o te tengan enganchado a vos)
    const g = estado === 'mar' && !partida.fin ? partida.gancho : null;
    const meAbordan = estado === 'mar' && !partida.fin && (partida.meAbordan || (partida.capitanes || []).some((c) => c.gancho && c.gancho.fase === 'enganchado' && c.gancho.obj === yo && c.barco !== yo));
    sonido.abordaje((g && g.fase === 'enganchado') || meAbordan ? 'pelea' : g ? 'vuelo' : 'nada');
    sonido.ambiente('mar', estado === 'mar' && yo ? Math.min(1, sopla + 0.17 * Math.min(1, Math.abs(yo.v) / 170)) : sopla * 0.5, remolino);
  }
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
  for (const cual of ['sonido', 'musica']) {
    const barra = $('aj-vol-' + cual), numero = $('aj-vol-' + cual + '-n');
    barra.value = Math.round(sonido.volumen(cual) * 100);
    numero.textContent = barra.value + ' %';
    barra.oninput = () => { sonido.ponerVolumen(cual, barra.value / 100); numero.textContent = barra.value + ' %'; };
    if (cual === 'sonido') barra.onchange = () => sonido.muestra(); // al soltar la barra, un cañonazo para oír cómo quedó
  }
}

function cambiarIdioma(id) {
  elegirIdioma(id);
  traducirPagina();
  $('map-grilla').innerHTML = ''; // las tarjetas de mapas se arman de nuevo en el idioma elegido
  pintarAstillero();
  pintarMapa();
  pintarReglas();
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

pintarReglas();
{
  const invitacion = new URLSearchParams(location.search).get('sala');
  if (invitacion) abrirSalas(invitacion.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
}

iniciarCuenta(pintarCuenta);
pintarCuenta();

pintarAstillero();
pintarLinea();
requestAnimationFrame(cuadro);
document.documentElement.classList.remove('cargando'); // ya está todo pintado: se va la pantalla de carga (index.html)

// Para probar desde la consola
window.flota = { sonido, get partida() { return partida; }, get mundo() { return mundo; }, get red() { return red; }, get estado() { return estado; } };
