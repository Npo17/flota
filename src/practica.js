// Práctica guiada: un mar tranquilo, sin enemigos, donde el juego te va pidiendo cada maniobra de a una
// (navegar, velas, disparar cada costado, hundir, juntar el botín, la habilidad, abordar, mandar la flota y volver al puerto).
// Acá vive la lista de pasos y cuándo se da por hecho cada uno; la pantalla (el panel con el teclado dibujado) la arma main.js.
// La guía que se lee después (viento, brisas, tesoro, civilizaciones, mejoras) también está acá: GUIA.
import { crearBarco } from './barcos.js';
import { HABILIDADES } from './config.js';

// Las teclas de cada paso llevan los mismos nombres que usa el teclado dibujado en index.html (data-k).
export const PASOS = [
  { id: 'navegar', teclas: ['mover'], titulo: 'Navegar',
    texto: 'Tu barco pone la proa hacia donde esté el cursor. Llevá el cursor hasta el círculo dorado y dejá que el barco llegue.' },
  { id: 'velas', teclas: ['arrowup', 'arrowdown', 'rueda'], titulo: 'Las velas',
    texto: 'Con ↓ recogés velas y con ↑ las soltás (también con la rueda del ratón). Con menos vela vas más lento pero recargás los cañones más rápido. Recogé todas las velas hasta frenar y después soltalas todas de nuevo.' },
  { id: 'babor', teclas: ['m0', 'a'], titulo: 'Cañones de babor',
    texto: 'Los cañones están en los costados, no adelante. Con clic izquierdo (o la tecla A) dispara el costado izquierdo del barco: babor. Probalo.' },
  { id: 'estribor', teclas: ['m2', 'd'], titulo: 'Cañones de estribor',
    texto: 'Con clic derecho (o la tecla D) dispara el costado derecho: estribor.' },
  { id: 'andanada', teclas: [' '], titulo: 'Andanada completa',
    texto: 'Con la barra espaciadora disparan los dos costados a la vez.' },
  { id: 'hundir', teclas: ['m0', 'm2', 'a', 'd'], titulo: 'Hundí el barco de práctica',
    texto: 'Los abanicos a los costados de tu barco muestran hasta dónde llegan los cañones, y se van llenando mientras recargan: llenos, listos para disparar. Ponete de costado al barco de práctica, a tiro, y hundilo.' },
  { id: 'botin', teclas: ['mover'], titulo: 'Juntá el botín',
    texto: 'Los barcos hundidos dejan cofres. Pasales por encima para subir el oro a tu bodega. Ojo: el oro de la bodega se pierde si te hunden; queda a salvo recién cuando lo llevás al puerto.' },
  { id: 'habilidad', teclas: ['r'], titulo: 'Tu habilidad',
    texto: 'Con R usás la habilidad que elegiste en el astillero. La tuya es {nombre}. {desc} Después hay que esperar para usarla otra vez. Probala.' },
  { id: 'abordar', teclas: ['f'], titulo: 'Abordaje',
    texto: 'Abordar es capturar un barco en vez de hundirlo: se suma a tu flota. Arrimate al mercante, poné el cursor encima y apretá F para tirar los garfios. Gana la tripulación más numerosa, así que conviene bajarle gente a cañonazos antes. Con F otra vez cortás las sogas.' },
  { id: 'flota', teclas: ['q', 'w'], titulo: 'Tu flota',
    texto: 'El barco capturado te sigue y pelea a tu lado. Con Q le ordenás atacar o volver a seguirte, y con W cambiás la formación. Apretá las dos.' },
  { id: 'puerto', teclas: ['p'], titulo: 'Volvé al puerto',
    texto: 'Navegá hasta el puerto (el círculo dorado; en el mapa de abajo es el ancla) y, cuando estés adentro, apretá P. Ahí el oro queda guardado y se compran las mejoras.' },
];

// La guía que se lee después de la práctica (también se abre sola desde el astillero). "dibujo" elige la lámina que pinta main.js.
export const GUIA = [
  { dibujo: 'viento', titulo: 'El viento',
    texto: 'La flecha dorada de la brújula marca hacia dónde sopla. Con el viento de popa o de costado vas más rápido; de proa, más lento. No sopla igual en todo el mar: se curva de una zona a otra. Cada tanto cambia de rumbo de golpe y un cartel avisa: «El viento cambió».' },
  { dibujo: 'brisas', titulo: 'Las brisas',
    texto: 'Las manchas claras que se mueven por el mar son brisas. Si entrás en una con el viento a favor o de costado, tu barco corre un 30 % más mientras estés adentro: se oye cómo se hincha la vela. Sirven para alcanzar una presa o para escapar.' },
  { dibujo: 'remolino', titulo: 'Remolinos y costas',
    texto: 'Los remolinos te chupan hacia el centro y te hacen girar: pasales lejos o salí a toda vela. Las costas golpean el casco si las chocás. Pero si te quedás quieto junto a una isla, la tripulación repara el casco hasta el 75 %.' },
  { dibujo: 'tesoro', titulo: 'El galeón del tesoro',
    texto: 'Cada pocos minutos zarpa un galeón cargado de oro desde una punta del mapa. Suena la campana y arriba aparece un cartel con el tiempo que le queda para llegar al puerto: entre 2 y 2 minutos y medio. Va con guardias, y hay que vencerlos antes de abordarlo. Si llega al puerto, el oro se pierde.' },
  { dibujo: 'civs', titulo: 'Las civilizaciones',
    texto: 'Hay 20 civilizaciones. Cada una tiene su barco, su bandera y una ventaja propia: más casco, más velocidad, mejores abordajes, más oro… Los barcos de tu misma civilización son de tu equipo: no se dañan entre ellos y pelean a tu favor.' },
  { dibujo: 'cascos', titulo: 'Tu barco',
    texto: 'En el astillero armás tu barco con 1000 de oro. Tres cascos: balandra (rápida), bergantín (equilibrado) y galeón (una fortaleza lenta). Además elegís las velas, cuántos cañones, la munición (bala redonda, metralla contra la tripulación o bala pesada contra el casco), la tripulación y una habilidad.' },
  { dibujo: 'puerto', titulo: 'Las mejoras del puerto',
    texto: 'Con el oro que guardás en el puerto mejorás el barco: cañones de nivel 1 a 10 (cada nivel, 15 % más de daño), casco reforzado hasta nivel 10, más cañones, un casco más grande, otra munición u otras velas, y lugar para más barcos capturados (hasta 6). También reparás y reclutás marineros.' },
  { dibujo: 'mar', titulo: 'El mar y los modos de juego',
    texto: 'Cerca del puerto hay mercantes y piratas chicos; mar adentro, barcos más fuertes y más oro. Podés jugar solo contra bots, en línea con todos en el mismo mar, o en una sala con tus amigos. Si te hunden, volvés al puerto con tu barco y perdés el oro que llevabas en la bodega.' },
];

const libre = (mundo, x, y, margen) => x > 300 && y > 300 && x < mundo.ancho - 300 && y < mundo.alto - 300
  && !mundo.islas.some((i) => Math.hypot(i.x - x, i.y - y) < i.r * 1.45 + margen)
  && !mundo.remolinos.some((w) => Math.hypot(w.x - x, w.y - y) < w.radio * 1.8 + margen);

// Un punto de agua libre a cierta distancia de (x, y): prueba primero hacia "rumbo" y va abriendo el ángulo.
function aguaCerca(mundo, x, y, dist, rumbo, lejosDe) {
  for (const d of [dist, dist * 1.3, dist * 0.75, dist * 1.7]) for (let k = 0; k < 16; k++) {
    const a = rumbo + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (!libre(mundo, px, py, 150)) continue;
    if (lejosDe && Math.hypot(px - lejosDe.x, py - lejosDe.y) < lejosDe.radio + 260) continue;
    return { x: px, y: py };
  }
  return { x: x + Math.cos(rumbo) * dist, y: y + Math.sin(rumbo) * dist };
}

// Un barco quieto para practicar: no navega ni dispara (b.quieto lo deja anclado en iaEnemigo).
function blanco(j, lugar, nombre, casco, trip, oro) {
  const yo = j.jugador;
  const diseno = { faccion: yo.diseno.faccion === 'britanicos' ? 'espanoles' : 'britanicos', casco, velas: 'latinas', canones: 2, municion: 'redonda', trip: 'moderada' };
  const b = crearBarco(diseno, 'enemigo', lugar.x, lugar.y, { a: Math.atan2(yo.y - lugar.y, yo.x - lugar.x) + Math.PI / 2, velas: 0, bandera: '#8a2d2d', color: '#e9e1cc', nombre, oro });
  b.quieto = true; b.nivel = 0;
  if (trip) b.trip = trip;
  j.barcos.push(b);
  return b;
}

export function crearPractica(j) {
  // un mar sin sorpresas: ni bots, ni galeón del tesoro, ni tritones
  j.practica = true;
  j.enemigosVivos = 0;
  j.barcos = j.barcos.filter((b) => b.cap);
  j.proxConvoy = Infinity;
  j.yo.proxTritones = Infinity;
  const p = { paso: -1, t: 0, blanco: null, mercante: null, vio: {}, hecho: false, enPuerto: false };
  irA(p, j, 0);
  return p;
}

export function pasoActual(p) { return PASOS[p.paso] || null; }

// Los datos que completan el texto del paso (hoy, solo el de la habilidad)
export function datosPaso(p, j) {
  const h = HABILIDADES[j.jugador.diseno.habilidad] || HABILIDADES.andanada;
  return { nombre: h.nombre, desc: h.desc };
}

function irA(p, j, n) {
  p.paso = n; p.t = 0; p.vio = {};
  const paso = PASOS[n], yo = j.jugador, puerto = j.mundo.puerto;
  j.marca = null;
  if (!paso) { p.hecho = true; return; }
  const rumbo = Math.atan2(yo.y - puerto.y, yo.x - puerto.x) || Math.PI / 2;
  if (paso.id === 'navegar') j.marca = { ...aguaCerca(j.mundo, yo.x, yo.y, 620, rumbo, puerto), r: 95 };
  if (['babor', 'estribor', 'andanada', 'hundir'].includes(paso.id)) {
    if (!p.blanco || p.blanco.hundiendo || !j.barcos.includes(p.blanco)) p.blanco = blanco(j, aguaCerca(j.mundo, yo.x, yo.y, 300, yo.a + 0.9, puerto), 'Barco de práctica', 'balandra', 0, 130);
    if (paso.id === 'hundir') p.blanco.vida = Math.min(p.blanco.vida, 45); // ya viene tocado: dos o tres andanadas
    p.rec = { '-1': yo.recarga['-1'], '1': yo.recarga['1'] };
  }
  if (paso.id === 'botin') p.oro0 = j.oroBodega;
  if (paso.id === 'abordar') {
    p.mercante = blanco(j, aguaCerca(j.mundo, yo.x, yo.y, 320, yo.a - 0.9, puerto), 'Mercante', 'balandra', 5, 90);
    p.capturados0 = j.stats.capturados;
  }
  if (paso.id === 'puerto') j.marca = { x: puerto.x, y: puerto.y, r: puerto.radio * 0.8 };
}

export function saltarPaso(p, j) {
  const paso = PASOS[p.paso];
  if (!paso) return;
  // lo que el paso dejaba armado para el siguiente
  if (paso.id === 'hundir' && p.blanco && !p.blanco.hundiendo) j.barcos = j.barcos.filter((b) => b !== p.blanco);
  if (paso.id === 'abordar' && p.mercante && p.mercante.bando === 'enemigo') j.barcos = j.barcos.filter((b) => b !== p.mercante);
  irA(p, j, p.paso + 1);
}

// Una vez por cuadro, con la entrada del jugador (lo que apretó). Devuelve true cuando se pasó al paso siguiente.
export function avanzarPractica(p, j, entrada, dt) {
  const paso = PASOS[p.paso];
  if (!paso || j.fin) return false;
  p.t += dt;
  const yo = j.jugador, vio = p.vio;
  let listo = false;
  // el barco de práctica no se hunde hasta que el paso lo pida, y el mercante es para abordar: tampoco se hunde
  if (p.blanco && !p.blanco.hundiendo && paso.id !== 'hundir') p.blanco.vida = p.blanco.stats.vidaMax;
  if (p.mercante && p.mercante.bando === 'enemigo' && !p.mercante.hundiendo) p.mercante.vida = p.mercante.stats.vidaMax;
  const disparo = (lado) => yo.recarga[lado] > (p.rec[lado] || 0) + 0.4;
  if (p.rec) { for (const l of ['-1', '1']) if (yo.recarga[l] < p.rec[l]) p.rec[l] = yo.recarga[l]; }

  if (paso.id === 'navegar') listo = Math.hypot(yo.x - j.marca.x, yo.y - j.marca.y) < j.marca.r;
  else if (paso.id === 'velas') {
    if (yo.velas === 0) vio.abajo = true;
    listo = vio.abajo && yo.velas === 3;
  } else if (paso.id === 'babor') listo = disparo('-1');
  else if (paso.id === 'estribor') listo = disparo('1');
  else if (paso.id === 'andanada') listo = !!entrada.fuegoTodo;
  else if (paso.id === 'hundir') {
    j.marca = p.blanco && !p.blanco.hundiendo ? { x: p.blanco.x, y: p.blanco.y, r: 70, suave: true } : null;
    listo = !p.blanco || !!p.blanco.hundiendo || !j.barcos.includes(p.blanco);
  } else if (paso.id === 'botin') {
    const c = j.cofres[0];
    j.marca = c ? { x: c.x, y: c.y, r: 45, suave: true } : null;
    listo = j.oroBodega > p.oro0 || (!c && p.t > 4);
  } else if (paso.id === 'habilidad') listo = j.cdHabilidad > 0;
  else if (paso.id === 'abordar') {
    const m = p.mercante;
    j.marca = m && m.bando === 'enemigo' && !m.hundiendo ? { x: m.x, y: m.y, r: 70, suave: true } : null;
    if (m && m.bando === 'enemigo' && m.trip < 3 && !(j.gancho && j.gancho.obj === m)) m.trip = 3; // si lo barrieron a cañonazos, que quede alguien para rendirse
    listo = j.stats.capturados > p.capturados0;
    if (!listo && (!m || m.hundiendo || !j.barcos.includes(m))) { p.mercante = blanco(j, aguaCerca(j.mundo, yo.x, yo.y, 320, yo.a - 0.9, j.mundo.puerto), 'Mercante', 'balandra', 5, 90); }
  } else if (paso.id === 'flota') {
    if (entrada.ordenFlota) vio.orden = true;
    if (entrada.formacion) vio.forma = true;
    listo = vio.orden && vio.forma;
  } else if (paso.id === 'puerto') listo = p.enPuerto;

  // un instante entre un paso y el otro, para que se vea lo que acaba de pasar
  if (listo && !p.listoEn) p.listoEn = p.t;
  if (p.listoEn && p.t - p.listoEn > (paso.id === 'puerto' ? 0 : 0.9)) { p.listoEn = 0; irA(p, j, p.paso + 1); return true; }
  return false;
}
