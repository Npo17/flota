// Recorre la práctica guiada entera, paso por paso, como lo haría un jugador. Uso: node scripts/probar-practica.mjs
import { crearMundo } from '../src/mundo.js';
import { MAPAS } from '../src/mapas.js';
import { crearPartida, actualizar, atracar } from '../src/juego.js';
import { PASOS, GUIA, crearPractica, avanzarPractica, pasoActual, saltarPaso } from '../src/practica.js';

let errores = 0;
const ok = (c, m) => { if (!c) { errores++; console.log('✗', m); } };
const diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', habilidad: 'andanada' };

function nueva(mapa = 'malta', d = diseno) {
  const j = crearPartida(crearMundo(mapa), d, 400, { viento: false, abordajes: true });
  return [j, crearPractica(j)];
}
// avanza el juego con una entrada fija hasta que cambie de paso (o se acabe el tiempo)
function hasta(j, p, entrada, seg = 20, cadaCuadro) {
  const paso = p.paso;
  for (let i = 0; i < seg * 60 && p.paso === paso && !p.hecho; i++) {
    const e = typeof entrada === 'function' ? entrada(i) : (i === 0 ? entrada : { velas: entrada.velas });
    if (cadaCuadro) cadaCuadro();
    actualizar(j, 1 / 60, e);
    avanzarPractica(p, j, e, 1 / 60);
  }
  return p.paso !== paso;
}
const id = (p) => pasoActual(p)?.id;

{
  const [j, p] = nueva();
  const yo = () => j.jugador;
  ok(j.barcos.length === 1 && j.enemigosVivos === 0, 'práctica: el mar no arranca vacío');
  ok(id(p) === 'navegar' && j.marca, 'práctica: no empieza por navegar');
  ok(hasta(j, p, (i) => ({ objetivo: { x: j.marca.x, y: j.marca.y }, velas: 3 }), 40), 'navegar: no se llega a la marca navegando');
  ok(id(p) === 'velas', 'tras navegar no vienen las velas');
  hasta(j, p, () => ({ velas: 0 }), 0.5);
  ok(id(p) === 'velas', 'velas: se dio por hecho solo con recogerlas');
  ok(hasta(j, p, () => ({ velas: 3 }), 3), 'velas: no pasa al soltarlas de nuevo');
  ok(id(p) === 'babor' && p.blanco && p.blanco.quieto, 'babor: no apareció el barco de práctica');
  ok(hasta(j, p, { fuego: -1, velas: 0 }, 3), 'babor: disparar a babor no cumple el paso');
  ok(hasta(j, p, { fuego: 1, velas: 0 }, 3), 'estribor: disparar a estribor no cumple el paso');
  ok(hasta(j, p, { fuegoTodo: true, velas: 0 }, 3), 'andanada: la barra no cumple el paso');
  ok(id(p) === 'hundir' && p.blanco.vida <= 45, 'hundir: el blanco no quedó tocado');
  const b = p.blanco;
  ok(hasta(j, p, (i) => ({ velas: 0, fuego: i % 30 === 0 ? -1 : 0 }), 40, () => { yo().x = b.x; yo().y = b.y + 110; yo().a = 0; yo().v = 0; yo().recarga['-1'] = Math.min(yo().recarga['-1'], 0.3); }), 'hundir: no se hunde el barco de práctica');
  ok(id(p) === 'botin' && j.cofres.length > 0, 'botín: el barco hundido no dejó cofres');
  ok(hasta(j, p, () => ({ velas: 0 }), 5, () => { if (j.cofres[0]) { yo().x = j.cofres[0].x; yo().y = j.cofres[0].y; } }) && j.oroBodega > 0, 'botín: no se juntó el oro');
  ok(hasta(j, p, { habilidad: true, velas: 0 }, 3), 'habilidad: R no cumple el paso');
  ok(id(p) === 'abordar' && p.mercante, 'abordar: no apareció el mercante');
  const m = p.mercante;
  ok(hasta(j, p, (i) => ({ velas: 0, objetivo: { x: m.x, y: m.y }, abordar: i === 5 }), 40, () => { if (!j.gancho) { yo().x = m.x - 90; yo().y = m.y; yo().v = 0; } }), 'abordar: no se captura el mercante');
  ok(m.bando === 'escolta' && j.stats.capturados === 1, 'abordar: el mercante no quedó en la flota');
  hasta(j, p, { ordenFlota: true, velas: 0 }, 1);
  ok(id(p) === 'flota', 'flota: con una sola tecla ya pasó');
  ok(hasta(j, p, { formacion: true, velas: 0 }, 3), 'flota: Q y W no cumplen el paso');
  ok(id(p) === 'puerto' && j.marca, 'puerto: no marca el puerto');
  yo().x = j.mundo.puerto.x; yo().y = j.mundo.puerto.y + 50;
  ok(atracar(j, j.yo), 'puerto: no se puede atracar');
  ok(j.oroPuerto > 400, 'puerto: el oro no quedó guardado');
}

// saltando todos los pasos tampoco se rompe nada, en cualquier mapa y con cualquier casco
for (const mapa of Object.keys(MAPAS)) for (const casco of ['balandra', 'galeon']) {
  const [j, p] = nueva(mapa, { ...diseno, casco, canones: 4 });
  const p0 = j.mundo.puerto, m0 = j.marca;
  ok(m0 && !j.mundo.islas.some((i) => Math.hypot(i.x - m0.x, i.y - m0.y) < i.r * 1.2), `${mapa}: la primera marca cae en tierra`);
  ok(Math.hypot(m0.x - p0.x, m0.y - p0.y) > p0.radio, `${mapa}: la primera marca cae dentro del puerto`);
  for (let n = 0; n < PASOS.length; n++) {
    for (let i = 0; i < 30; i++) { actualizar(j, 1 / 60, { velas: 1 }); avanzarPractica(p, j, { velas: 1 }, 1 / 60); }
    for (const b of [p.blanco, p.mercante]) if (b && j.barcos.includes(b)) ok(!j.mundo.islas.some((i) => Math.hypot(i.x - b.x, i.y - b.y) < i.r), `${mapa}: un barco de la práctica apareció en tierra`);
    saltarPaso(p, j);
  }
  ok(p.hecho && !pasoActual(p), `${mapa}: saltando todo no se termina`);
}
ok(PASOS.every((x) => x.titulo && x.texto && x.teclas.length) && GUIA.every((x) => x.titulo && x.texto && x.dibujo), 'faltan datos en un paso o en una lámina');

if (errores) { console.log(`${errores} problemas`); process.exit(1); }
console.log(`práctica guiada: ${PASOS.length} pasos y ${GUIA.length} láminas, todo bien`);
