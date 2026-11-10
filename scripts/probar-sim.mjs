// Prueba rápida de la simulación sin navegador: modo solo y varios capitanes. Uso: node scripts/probar-sim.mjs
import { crearMundo } from '../src/mundo.js';
import { crearPartida, crearMar, agregarCapitan, quitarCapitan, actualizar, avanzar, atracar } from '../src/juego.js';
import { MAPAS } from '../src/mapas.js';

const diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
let fallas = 0;
const ok = (c, m) => { if (!c) { fallas++; console.log('FALLA:', m); } };

// --- modo solo en todos los mapas
for (const id of Object.keys(MAPAS)) {
  const j = crearPartida(crearMundo(id), diseno, 100);
  for (let i = 0; i < 60 * 20; i++) actualizar(j, 1 / 60, { objetivo: { x: j.jugador.x + 300, y: j.jugador.y + 200 }, fuegoTodo: i % 90 === 0 });
  ok(j.barcos.includes(j.jugador) || j.fin, `solo ${id}: el jugador desapareció`);
  ok(Number.isFinite(j.jugador.x), `solo ${id}: posición inválida`);
}

// --- solo: hundir, juntar oro, abordar, atracar, morir
{
  const j = crearPartida(crearMundo('malta'), diseno, 100);
  const yo = j.jugador, e = j.barcos.find((b) => b.bando === 'enemigo');
  yo.x = 1500; yo.y = 4500; yo.a = 0; e.x = 1500; e.y = 4680; e.a = 0;
  let n = 0;
  while (!e.hundiendo && n++ < 60 * 120) { e.x = 1500; e.y = 4680; e.v = 0; yo.x = 1500; yo.y = 4500; yo.a = 0; yo.vida = yo.stats.vidaMax; actualizar(j, 1 / 60, { fuego: 1 }); }
  ok(e.hundiendo > 0, 'solo: no se hundió el enemigo');
  ok(j.stats.hundidos === 1, 'solo: no contó el hundido: ' + j.stats.hundidos);
  for (let i = 0; i < 300; i++) actualizar(j, 1 / 60, { objetivo: { x: 1500, y: 4680 } });
  ok(j.oroBodega > 0, 'solo: no juntó el oro');
  // abordaje con gancho
  const m = j.barcos.find((b) => b.bando === 'enemigo' && !b.hundiendo);
  yo.x = 3000; yo.y = 5200; yo.a = 0; yo.v = 0; yo.trip = 200; m.x = 3000; m.y = 5370; m.vida = 5; j.cdAbordaje = 0;
  actualizar(j, 1 / 60, { abordar: true, objetivo: { x: m.x, y: m.y } });
  for (let i = 0; i < 60 * 15 && m.bando === 'enemigo' && !m.hundiendo; i++) { m.v = 0; actualizar(j, 1 / 60, {}); }
  ok(m.bando === 'escolta' && m.cap === j.yo, 'solo: el abordaje no capturó: ' + m.bando);
  ok(j.stats.capturados === 1, 'solo: no contó la captura');
  // atracar
  const p = j.mundo.puerto; yo.x = p.x; yo.y = p.y + 40; const bodega = j.oroBodega, puerto = j.oroPuerto;
  ok(atracar(j, j.yo) && j.oroBodega === 0 && j.oroPuerto === puerto + bodega, 'solo: atracar no guardó el oro');
  // perder el insignia con escolta: relevo
  yo.x = 800; yo.y = 800; yo.vida = -1; j.oroBodega = 100; actualizar(j, 1 / 60, {});
  ok(j.jugador === m && !j.fin, 'solo: no tomó el mando de la escolta');
  m.vida = -1; actualizar(j, 1 / 60, {});
  ok(j.fin, 'solo: no terminó la partida');
}

// --- varios capitanes: pelea entre jugadores, eliminación, desconexión
{
  const j = crearMar(crearMundo('malta'), { servidor: true, enemigos: 10 });
  const A = agregarCapitan(j, { id: 'a', nombre: 'Ana', diseno, oro: 0 });
  const B = agregarCapitan(j, { id: 'b', nombre: 'Beto', diseno, oro: 0 });
  ok(A.barco !== B.barco && Math.hypot(A.barco.x - B.barco.x, A.barco.y - B.barco.y) > 20, 'multi: salen del mismo punto');
  // en el puerto no se pueden dañar
  for (let i = 0; i < 200; i++) avanzar(j, 0.05, { a: { fuegoTodo: true }, b: {} });
  ok(B.barco.vida === B.barco.stats.vidaMax, 'multi: se dañaron dentro del puerto');
  // afuera, Ana hunde a Beto
  B.oroBodega = 300;
  let n = 0;
  while (!B.fin && n++ < 20 * 200) {
    A.barco.x = 1500; A.barco.y = 4500; A.barco.a = 0; A.barco.vida = A.barco.stats.vidaMax;
    B.barco.x = 1500; B.barco.y = 4680; B.barco.a = 0; B.barco.v = 0;
    avanzar(j, 0.05, { a: { fuego: 1 }, b: {} });
  }
  ok(B.fin, 'multi: Ana no pudo hundir a Beto');
  ok(A.stats.eliminados === 1, 'multi: no contó la eliminación: ' + A.stats.eliminados);
  ok(j.cofres.reduce((s, c) => s + c.oro, 0) >= 290, 'multi: el oro de Beto no quedó flotando');
  ok(j.eventos.some((e) => e.k === 'b') && j.eventos.some((e) => e.k === 'h'), 'multi: faltan eventos');
  ok(j.particulas.length === 0, 'multi: el servidor creó partículas');
  quitarCapitan(j, B);
  ok(j.capitanes.length === 1 && !j.barcos.some((b) => b.cap === B), 'multi: no se quitó al capitán');
  for (let i = 0; i < 400; i++) avanzar(j, 0.05, { a: { objetivo: { x: 2000, y: 4000 } } });
  ok(Number.isFinite(A.barco.x), 'multi: posición inválida');
}
console.log(fallas ? `${fallas} fallas` : 'todo bien');
process.exit(fallas ? 1 : 0);
