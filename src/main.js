// Pega todo: pantallas (astillero, puerto, fin), teclado y el ciclo del juego.
import { PRESUPUESTO, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, COSTO_CANON, PUERTO, ESCOLTAS_MAX } from './config.js';
import { costoDiseno, barrasDe, crearBarco, rearmar, statsDe } from './barcos.js';
import { crearMundo, nivelZona, nombreZona } from './mundo.js';
import { crearPartida, actualizar, candidatoAbordaje, aviso } from './juego.js';
import { dibujarEscena, dibujarMinimapa, dibujarBarco } from './dibujo.js';

const $ = (id) => document.getElementById(id);
const canvas = $('mar'), ctx = canvas.getContext('2d');
const mini = $('minimapa').getContext('2d');

const mundo = crearMundo();
let diseno = { casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
let partida = null;
let estado = 'astillero'; // astillero | mar | puerto | fin
const vista = { ancho: 0, alto: 0, zoom: 1, raton: { x: 0, y: 0 }, ratonPx: { x: 0, y: 0 }, ladoRaton: 1 };
const teclas = new Set();
let pulsos = {}; // acciones de un solo toque

function ajustar() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  vista.ancho = canvas.width;
  vista.alto = canvas.height;
  vista.zoom = dpr * Math.max(0.7, Math.min(1.15, innerHeight / 800));
}
addEventListener('resize', ajustar);
ajustar();

// ---------- Astillero ----------
function grupo(titulo, catalogo, clave) {
  const h = document.createElement('h3');
  h.textContent = titulo;
  const caja = document.createElement('div');
  caja.className = 'opciones';
  for (const [id, o] of Object.entries(catalogo)) {
    const b = document.createElement('button');
    b.className = 'opcion' + (diseno[clave] === id ? ' elegida' : '');
    b.innerHTML = `<b>${o.nombre}</b><small>${o.desc}</small><em>${o.costo ? o.costo + ' oro' : 'Incluida'}</em>`;
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
  cont.append(...grupo('Casco', CASCOS, 'casco'), ...grupo('Velas', VELAS, 'velas'));
  const max = CASCOS[diseno.casco].maxCanones;
  const h = document.createElement('h3');
  h.textContent = `Cañones · ${COSTO_CANON} oro cada uno (cada cañón te hace un poco más lento)`;
  const d = document.createElement('div');
  d.className = 'deslizador';
  d.innerHTML = `<input type="range" min="2" max="${max}" step="2" value="${diseno.canones}"><b>${diseno.canones} cañones</b>`;
  d.querySelector('input').oninput = (e) => { diseno.canones = +e.target.value; pintarAstillero(); };
  cont.append(h, d, ...grupo('Munición', MUNICIONES, 'municion'), ...grupo('Tripulación', TRIPULACIONES, 'trip'));

  const resto = PRESUPUESTO - costoDiseno(diseno);
  $('ast-total').textContent = PRESUPUESTO;
  $('ast-resto').textContent = `${resto} oro`;
  $('ast-resto').style.color = resto < 0 ? '#ff6b6b' : '';
  $('ast-zarpar').disabled = resto < 0;
  $('ast-zarpar').textContent = resto < 0 ? 'Te pasaste del presupuesto' : '¡Zarpar!';
  const barras = barrasDe(diseno);
  $('ast-barras').innerHTML = Object.entries(barras).map(([k, v]) =>
    `<div class="stat"><span>${k}</span><div><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div></div>`).join('');
  const s = statsDe(diseno);
  $('ast-barras').innerHTML += `<p class="suave">${s.vidaMax} de casco · ${s.tripMax} marineros · ${diseno.canones / 2} cañones por lado</p>`;

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
  $('ast-mejor').textContent = mejor ? `Tu mejor saqueo: ${mejor} de oro` : '';
}

$('ast-zarpar').onclick = () => {
  partida = crearPartida(mundo, diseno, PRESUPUESTO - costoDiseno(diseno));
  estado = 'mar';
  $('pantalla-astillero').classList.add('oculto');
  $('hud').classList.remove('oculto');
  aviso(partida, 'Llevá el cursor a donde quieras ir y salí a buscar mercantes', 'info');
};

// ---------- Puerto ----------
function cercaDelPuerto() {
  const p = mundo.puerto, b = partida.jugador;
  return Math.hypot(b.x - p.x, b.y - p.y) < p.radio;
}

function entrarPuerto() {
  if (partida.oroBodega > 0) partida.oroPuerto += partida.oroBodega;
  partida.oroBodega = 0;
  partida.jugador.velas = 0;
  estado = 'puerto';
  $('pantalla-puerto').classList.remove('oculto');
  pintarPuerto();
}

function pintarPuerto() {
  const j = partida, b = j.jugador, s = b.stats, d = b.diseno;
  const escoltas = j.barcos.filter((x) => x.bando === 'escolta' && !x.hundiendo);
  const grupos = [];

  // Reparar y tripular
  const dano = Math.ceil(s.vidaMax - b.vida), faltan = s.tripMax - b.trip;
  const danoEsc = escoltas.reduce((a, e) => a + Math.ceil(e.stats.vidaMax - e.vida) + (e.stats.tripMax - e.trip) * 3, 0);
  const arreglos = [
    { t: 'Reparar el casco', d: dano ? `Te faltan ${dano} puntos de casco.` : 'El casco está entero.', costo: dano * PUERTO.repararPorPunto, ok: dano > 0, parcial: true, listo: 'Casco entero',
      hacer: (oro) => { b.vida = Math.min(s.vidaMax, b.vida + Math.floor(oro / PUERTO.repararPorPunto)); } },
    { t: 'Reclutar marineros', d: `Tenés ${b.trip} de ${s.tripMax}. Más gente recarga más rápido y gana abordajes.`, costo: faltan * PUERTO.marinero, ok: faltan > 0, parcial: true, listo: 'Tripulación completa',
      hacer: (oro) => { b.trip = Math.min(s.tripMax, b.trip + Math.floor(oro / PUERTO.marinero)); } },
  ];
  if (escoltas.length) arreglos.push({ t: 'Arreglar la flota', d: `Repara y llena de gente tus ${escoltas.length} barcos capturados.`, costo: danoEsc, ok: danoEsc > 0,
    hacer: () => { for (const e of escoltas) { e.vida = e.stats.vidaMax; e.trip = e.stats.tripMax; } } });
  grupos.push(['Reparar y tripular', arreglos]);

  // Cañones
  const nivel = (d.nivelCanones || 0) + 1;
  grupos.push(['Cañones', [
    { t: 'Sumar 2 cañones', d: `Tenés ${d.canones} de ${s.maxCanones} que entran en este casco. Pegás más, pero vas un poco más lento.`, costo: PUERTO.parCanones, ok: d.canones < s.maxCanones, listo: 'Casco lleno',
      hacer: () => { d.canones += 2; } },
    { t: `Cañones nivel ${nivel}`, d: 'Cada bala hace 15 % más de daño.', costo: PUERTO.nivelCanones(nivel), ok: nivel <= 6, listo: 'Al máximo',
      hacer: () => { d.nivelCanones = nivel; } },
  ]]);

  // Munición y velas: se ve cuál tenés puesta
  grupos.push(['Munición', Object.entries(MUNICIONES).map(([id, m]) => ({
    t: m.nombre, d: m.desc, costo: PUERTO.municion[id], ok: id !== d.municion, elegida: id === d.municion, listo: 'La que usás',
    hacer: () => { d.municion = id; },
  }))]);
  grupos.push(['Velas', Object.entries(VELAS).map(([id, v]) => ({
    t: v.nombre, d: v.desc, costo: Math.max(60, v.costo), ok: id !== d.velas, elegida: id === d.velas, listo: 'Las que usás',
    hacer: () => { d.velas = id; },
  }))]);

  // Flota
  grupos.push(['Flota', [
    { t: 'Agrandar la flota', d: `Hoy podés llevar ${j.escoltasMax} barcos capturados (tenés ${escoltas.length}). Suma un lugar más.`, costo: PUERTO.escolta(j.escoltasMax + 1), ok: j.escoltasMax < ESCOLTAS_MAX, listo: 'Al máximo',
      hacer: () => { j.escoltasMax++; } },
  ]]);

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
      const precio = it.ok ? `${it.costo} oro` : (it.listo || 'Listo');
      btn.innerHTML = `<b>${it.t}</b><small>${it.d}</small><em class="${it.ok && !alcanza ? 'caro' : ''}">${precio}</em>`;
      btn.disabled = !it.ok || !alcanza;
      btn.onclick = () => {
        const paga = it.parcial ? Math.min(it.costo, j.oroPuerto) : it.costo;
        it.hacer(paga);
        j.oroPuerto -= paga;
        rearmar(b);
        pintarPuerto();
      };
      caja.appendChild(btn);
    }
    cont.append(h, caja);
  }

  // Resumen del barco, igual que en el astillero
  $('pto-oro').textContent = `${j.oroPuerto} oro`;
  const barras = barrasDe(d);
  $('pto-barras').innerHTML = Object.entries(barras).map(([k, v]) =>
    `<div class="stat"><span>${k}</span><div><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div></div>`).join('')
    + `<p class="suave">Casco ${Math.ceil(b.vida)} de ${s.vidaMax} · ${b.trip} de ${s.tripMax} marineros · ${d.canones / 2} cañones por lado</p>`;
  const c = $('pto-vista'), cx = c.getContext('2d');
  cx.clearRect(0, 0, c.width, c.height);
  const copia = crearBarco(d, 'jugador', 0, 0, { a: -0.25, velas: 3, bandera: '#1f7a3f' });
  cx.save();
  cx.translate(c.width / 2, c.height / 2);
  cx.scale(2.1, 2.1);
  dibujarBarco(cx, copia, { sinBarra: true });
  cx.restore();
}

$('pto-salir').onclick = () => {
  estado = 'mar';
  $('pantalla-puerto').classList.add('oculto');
};

// ---------- Fin ----------
function mostrarFin() {
  estado = 'fin';
  const st = partida.stats;
  const total = Math.round(st.saqueado);
  let mejor = 0;
  try {
    mejor = +localStorage.getItem('flota-mejor') || 0;
    if (total > mejor) localStorage.setItem('flota-mejor', String(total));
  } catch {}
  const min = Math.floor(st.tiempo / 60), seg = Math.floor(st.tiempo % 60);
  $('fin-datos').innerHTML = `
    <div class="fila"><span>Oro saqueado</span><b class="oro">${total}</b></div>
    <div class="fila"><span>Barcos hundidos</span><b>${st.hundidos}</b></div>
    <div class="fila"><span>Barcos capturados</span><b>${st.capturados}</b></div>
    <div class="fila"><span>Tiempo en el mar</span><b>${min}:${String(seg).padStart(2, '0')}</b></div>
    <p class="suave">${total > mejor ? '¡Nuevo récord!' : `Tu récord: ${mejor} de oro`}</p>`;
  $('pantalla-fin').classList.remove('oculto');
  $('hud').classList.add('oculto');
}

$('fin-otra').onclick = () => {
  $('pantalla-fin').classList.add('oculto');
  $('pantalla-astillero').classList.remove('oculto');
  estado = 'astillero';
  partida = null;
  pintarAstillero();
};

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
function pintarHud() {
  const j = partida, b = j.jugador, s = b.stats;
  $('hud-nombre').textContent = CASCOS[b.diseno.casco].nombre;
  $('hud-zona').textContent = nombreZona(nivelZona(mundo, b.x, b.y));
  $('hud-vida').style.width = `${Math.max(0, (b.vida / s.vidaMax) * 100)}%`;
  $('hud-vida-txt').textContent = `Casco ${Math.max(0, Math.ceil(b.vida))} / ${s.vidaMax}`;
  $('hud-trip').style.width = `${Math.max(0, (b.trip / s.tripMax) * 100)}%`;
  $('hud-trip-txt').textContent = `Tripulación ${b.trip} / ${s.tripMax}`;
  $('hud-velas').textContent = '▰'.repeat(b.velas) + '▱'.repeat(3 - b.velas);
  const esc = j.barcos.filter((x) => x.bando === 'escolta' && !x.hundiendo).length;
  $('hud-flota').textContent = `${esc} de ${j.escoltasMax} · ${j.ordenFlota === 'ataque' ? 'al ataque' : 'en formación'}`;
  $('hud-bodega').textContent = j.oroBodega;
  $('hud-puerto').textContent = j.oroPuerto;
  $('hud-hundidos').textContent = j.stats.hundidos;
  const total = (lado) => (b.recargaTotal && b.recargaTotal[lado]) || s.recarga;
  $('hud-rec-izq').style.width = `${100 - Math.min(100, (b.recarga['-1'] / total('-1')) * 100)}%`;
  $('hud-rec-der').style.width = `${100 - Math.min(100, (b.recarga['1'] / total('1')) * 100)}%`;
  const averia = b.vida < s.vidaMax * 0.7 ? ' · averiado, vas más lento' : '';
  $('hud-velas-txt').textContent = (b.velas >= 3 ? 'A toda vela: recarga lenta' : b.velas === 2 ? 'Media vela' : 'Velas de combate: recarga rápida') + averia;

  const clave = j.avisos.map((a) => a.texto).join('|');
  if (clave !== avisosPintados) {
    avisosPintados = clave;
    $('avisos').innerHTML = j.avisos.map((a) => `<div class="aviso ${a.tipo}">${a.texto}</div>`).join('');
  }
  let pista = '';
  const cand = candidatoAbordaje(j);
  if (cercaDelPuerto()) pista = j.oroBodega ? `P: entrar al puerto y guardar ${j.oroBodega} de oro` : 'P: entrar al puerto';
  else if (j.gancho && j.gancho.fase === 'enganchado') pista = `Tirando de la soga del ${j.gancho.obj.nombre}…`;
  else if (b.reparando) pista = 'Reparando el casco en la costa (hasta el 75 %)';
  else if (cand && j.cdAbordaje <= 0) pista = `F: tirar el gancho al ${cand.b.nombre} · tu gente ${b.trip} contra ${cand.b.trip} (${cand.ventaja})`;
  if ($('pista').textContent !== pista) $('pista').textContent = pista;
}

// ---------- Ciclo ----------
let anterior = performance.now();
function cuadro(ahora) {
  const dt = Math.min(0.05, (ahora - anterior) / 1000);
  anterior = ahora;
  if (partida) {
    ratonAMundo();
    if (estado === 'mar') {
      const entrada = { objetivo: ratonVisto ? { ...vista.raton } : null, ...pulsos };
      pulsos = {};
      actualizar(partida, dt, entrada);
      if (partida.fin && partida.t - partida.finEn > 2.2) mostrarFin();
    }
    dibujarEscena(ctx, partida, vista);
    if (estado === 'mar') { pintarHud(); dibujarMinimapa(mini, partida, 170); }
  }
  requestAnimationFrame(cuadro);
}

pintarAstillero();
requestAnimationFrame(cuadro);

// Para probar desde la consola
window.flota = { get partida() { return partida; }, mundo };
