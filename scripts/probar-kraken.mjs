// Prueba del Kraken sin navegador: la maldición del tesoro, la zona marcada (centro, borde y esquivar), el daño de los cañones,
// la furia, la muerte con su oro y que se vaya si nadie lo enfrenta. Uso: node scripts/probar-kraken.mjs
import { crearMundo } from '../src/mundo.js';
import { crearPartida, crearMar, agregarCapitan, actualizar, avanzar, danoKraken } from '../src/juego.js';
import { KRAKEN } from '../src/config.js';
import { MAPAS } from '../src/mapas.js';

const diseno = { faccion: 'espanoles', casco: 'galeon', velas: 'cuadras', canones: 14, municion: 'pesada', trip: 'curtida' };
let fallas = 0;
const ok = (c, m) => { if (!c) { fallas++; console.log('FALLA:', m); } };
const paso = (j, seg, entrada = {}) => { for (let i = 0; i < seg * 60; i++) actualizar(j, 1 / 60, entrada); };
const textos = (j) => j.avisos.map((a) => a.texto);

// Un mar vacío (sin bots ni tesoro) con el jugador lejos del puerto, para probar al Kraken solo
function marVacio(mapa = 'caribe') {
  const j = crearPartida(crearMundo(mapa), diseno, 100);
  j.barcos = [j.jugador]; j.enemigosVivos = 0; j.proxConvoy = 1e9; j.yo.proxTritones = 1e9;
  j.mundo.remolinos = [];
  return j;
}
// Pone al Kraken ya despierto y afuera del agua, en un lugar libre a cierta distancia del jugador
function conKraken(j) {
  j.yo.marcasTesoro = KRAKEN.marcas;
  actualizar(j, 1 / 60, {});
  const k = j.kraken;
  k.emerge = 1; k.prox = 999;
  return k;
}

// --- 1. la maldición: con una marca menos avisa; con la última despierta, cerca del que lo despertó y en el agua
{
  const j = marVacio(), yo = j.jugador;
  yo.x = 1500; yo.y = 1500;
  // hundir un galeón del tesoro con el jugador como último agresor suma una marca y, con una menos de las necesarias, avisa
  const k0 = crearPartida(crearMundo('caribe'), diseno, 100);
  k0.proxConvoy = 0.01; k0.jugador.x = 3200; k0.jugador.y = 3600;
  actualizar(k0, 1 / 30, {});
  const galeon = k0.barcos.find((b) => b.convoy);
  ok(!!galeon, 'maldición: no salió el galeón del tesoro para la prueba');
  if (galeon) {
    k0.yo.marcasTesoro = KRAKEN.marcas - 2;
    for (const g of k0.barcos.filter((b) => b.ia && b.ia.lider === galeon)) g.vida = -1; // sin guardias
    actualizar(k0, 1 / 60, {});
    galeon.ultimoAgresor = k0.yo; galeon.vida = -1;
    actualizar(k0, 1 / 60, {});
    ok(k0.yo.marcasTesoro === KRAKEN.marcas - 1, 'maldición: hundir el galeón del tesoro no sumó la marca: ' + k0.yo.marcasTesoro);
    ok(textos(k0).some((t) => t.includes('puede despertar el Kraken')), 'maldición: con una marca menos no avisó');
    ok(!k0.kraken, 'maldición: despertó antes de tiempo');
  }
  // la última marca lo despierta
  j.yo.marcasTesoro = KRAKEN.marcas;
  actualizar(j, 1 / 60, {});
  const k = j.kraken;
  ok(!!k, 'maldición: con todas las marcas no despertó');
  if (k) {
    const d = Math.hypot(k.x - yo.x, k.y - yo.y);
    ok(d > 450 && d < 2500, `maldición: despertó a ${Math.round(d)} del capitán`);
    ok(!j.mundo.islas.some((i) => Math.hypot(i.x - k.x, i.y - k.y) < i.r + KRAKEN.cuerpo), 'maldición: despertó en tierra');
    ok(j.yo.marcasTesoro === 0, 'maldición: no se reiniciaron las marcas');
    ok(k.vida === KRAKEN.vida && k.vidaMax === KRAKEN.vida, 'maldición: vida inicial distinta de KRAKEN.vida con un solo capitán');
    ok(textos(j).some((t) => t.includes('despertó al Kraken')), 'maldición: no avisó que despertó');
    // mientras emerge no pega ni recibe daño
    ok(k.emerge < 1 && k.zonas.length === 0, 'emerger: arrancó ya afuera del agua');
    paso(j, KRAKEN.emerger + 0.5);
    ok(k.emerge === 1, 'emerger: no terminó de salir');
  }
}

// --- 2. en todos los mapas despierta en el agua, lejos del puerto
for (const mapa of Object.keys(MAPAS)) {
  const j = marVacio(mapa), m = j.mundo;
  j.jugador.x = m.puerto.x + 900; j.jugador.y = m.puerto.y;
  j.yo.marcasTesoro = KRAKEN.marcas;
  actualizar(j, 1 / 60, {});
  const k = j.kraken;
  ok(!!k, `lugar (${mapa}): no despertó`);
  if (k) {
    ok(!m.islas.some((i) => Math.hypot(i.x - k.x, i.y - k.y) < i.r + KRAKEN.cuerpo), `lugar (${mapa}): en tierra`);
    ok(Math.hypot(k.x - m.puerto.x, k.y - m.puerto.y) > m.puerto.radio + 600, `lugar (${mapa}): pegado al puerto`);
  }
}

// --- 3. la zona marcada: se queda adentro y recibe el golpe fuerte; en el borde, la mitad; afuera, nada
for (const [donde, dist, espera] of [['centro', 0, 'centro'], ['borde', KRAKEN.radio * 0.75, 'borde'], ['afuera', KRAKEN.radio * 2.2, 'nada']]) {
  const j = marVacio(), yo = j.jugador, k = conKraken(j);
  yo.x = k.x + 380; yo.y = k.y; yo.v = 0; yo.vida = yo.stats.vidaMax;
  k.prox = 0;
  actualizar(j, 1 / 60, { quieto: true });
  const z = k.zonas[0];
  ok(!!z, `zona (${donde}): no marcó ninguna zona`);
  if (!z) continue;
  ok(Math.hypot(z.x - yo.x, z.y - yo.y) < 5, `zona (${donde}): no la marcó sobre el barco`);
  ok(Math.abs(z.aviso - (KRAKEN.aviso + KRAKEN.extraGaleon)) < 0.01, `zona (${donde}): un galeón no tuvo aviso extra (${z.aviso})`);
  ok(textos(j).some((t) => t.includes('marcó una zona')), `zona (${donde}): no avisó al capitán`);
  yo.x = z.x + dist; yo.y = z.y;
  const antes = yo.vida;
  for (let i = 0; i < 60 * (z.aviso + 0.5); i++) { yo.x = z.x + dist; yo.y = z.y; yo.v = 0; actualizar(j, 1 / 60, { quieto: true }); }
  const saco = Math.round(antes - yo.vida);
  const debe = espera === 'centro' ? danoKraken(yo, true) : espera === 'borde' ? danoKraken(yo, false) : 0;
  ok(saco === debe, `zona (${donde}): sacó ${saco} y tenía que sacar ${debe}`);
}

// --- 4. esquivar: el barco que sale navegando del círculo antes de que se llene no recibe nada
{
  const j = marVacio(), yo = j.jugador, k = conKraken(j);
  yo.x = k.x + 380; yo.y = k.y; yo.a = Math.PI / 2; yo.v = yo.stats.velMax * 0.7; yo.vida = yo.stats.vidaMax;
  k.prox = 0;
  actualizar(j, 1 / 60, { velas: 3 });
  const z = k.zonas[0], antes = yo.vida;
  for (let i = 0; i < 60 * (z.aviso + 0.5); i++) actualizar(j, 1 / 60, { objetivo: { x: yo.x + Math.cos(yo.a) * 400, y: yo.y + Math.sin(yo.a) * 400 }, velas: 3 });
  ok(yo.vida === antes, `esquivar: un galeón a toda vela no alcanzó a salir de la zona (perdió ${Math.round(antes - yo.vida)})`);
  ok(Math.hypot(yo.x - z.x, yo.y - z.y) > KRAKEN.radio, 'esquivar: el barco quedó adentro');
}

// --- 5. el golpe pega a todos: también a los barcos de la flota y a los bots que estén adentro
{
  const j = crearPartida(crearMundo('caribe'), diseno, 100), yo = j.jugador;
  const bot = j.barcos.find((b) => b.bando === 'enemigo');
  j.barcos = [yo, bot]; j.enemigosVivos = 0; j.proxConvoy = 1e9; j.yo.proxTritones = 1e9; j.mundo.remolinos = [];
  const k = conKraken(j);
  yo.x = k.x + 380; yo.y = k.y; yo.v = 0;
  k.prox = 0; actualizar(j, 1 / 60, { quieto: true });
  const z = k.zonas[0];
  bot.x = z.x + 30; bot.y = z.y + 10; bot.ia.t = 99;
  const antes = bot.vida;
  for (let i = 0; i < 60 * (z.aviso + 0.3); i++) { bot.x = z.x + 30; bot.y = z.y + 10; bot.v = 0; actualizar(j, 1 / 60, { quieto: true }); }
  ok(bot.vida < antes, 'golpe: no le pegó al bot que estaba en la zona');
}

// --- 6. cañonazos: le bajan vida; furia por debajo del 40 %; muerte, oro y desaparece
{
  const j = marVacio(), yo = j.jugador, k = conKraken(j);
  yo.x = k.x; yo.y = k.y + 300; yo.a = 0; yo.v = 0;
  const v0 = k.vida;
  for (let i = 0; i < 60 * 6; i++) { yo.x = k.x; yo.y = k.y + 300; yo.a = 0; yo.v = 0; yo.vida = yo.stats.vidaMax; k.prox = 999; actualizar(j, 1 / 60, { fuego: -1, quieto: true }); }
  ok(k.vida < v0, 'cañones: el Kraken no perdió vida con una andanada encima');
  k.vida = k.vidaMax * KRAKEN.furia - 1; k.prox = 0;
  actualizar(j, 1 / 60, { quieto: true });
  ok(k.furia, 'furia: no se enfureció por debajo del límite');
  ok(textos(j).some((t) => t.includes('furioso')), 'furia: no avisó');
  k.zonas = []; k.prox = 0;
  // con furia puede tener dos zonas a la vez (hace falta otro barco para la segunda)
  const otro = agregarCapitan(j, { id: 'b', nombre: 'Otro', diseno }).barco;
  otro.x = k.x - 380; otro.y = k.y;
  actualizar(j, 1 / 60, { quieto: true }); k.prox = 0; actualizar(j, 1 / 60, { quieto: true });
  ok(k.zonas.length === 2, 'furia: no marcó dos zonas a la vez: ' + k.zonas.length);
  j.capitanes = j.capitanes.filter((c) => c.id !== 'b'); j.barcos = j.barcos.filter((b) => b !== otro);
  // el último cañonazo
  k.vida = 1;
  const hundidos = j.stats.hundidos;
  for (let i = 0; i < 60 * 6 && !k.muerte; i++) { yo.x = k.x; yo.y = k.y + 300; yo.a = 0; yo.v = 0; yo.vida = yo.stats.vidaMax; yo.recarga['-1'] = 0; actualizar(j, 1 / 60, { fuego: -1, quieto: true }); }
  ok(k.muerte > 0 && k.zonas.length === 0, 'muerte: no murió con el último cañonazo');
  ok(j.stats.hundidos === hundidos + 1, 'muerte: no se le contó al que le dio el último cañonazo');
  yo.x = 300; yo.y = 300; // lejos, para no juntar el oro antes de contarlo
  paso(j, KRAKEN.muerteOro - 0.3);
  ok(j.cofres.length === 0 || j.cofres.reduce((s, c) => s + c.oro, 0) < KRAKEN.oro / 2, 'muerte: el oro salió antes de que termine de hundirse');
  paso(j, 0.6);
  const oro = j.cofres.reduce((s, c) => s + c.oro, 0);
  ok(Math.abs(oro - KRAKEN.oro) < 20, `muerte: dejó ${oro} de oro y tenía que dejar ${KRAKEN.oro}`);
  paso(j, KRAKEN.muerteDura - KRAKEN.muerteOro);
  ok(!j.kraken, 'muerte: el Kraken no desapareció');
}

// --- 7. si nadie lo enfrenta, se vuelve a lo profundo; en el puerto no te persigue ni te pega
{
  const j = marVacio(), yo = j.jugador, k = conKraken(j), p = j.mundo.puerto;
  yo.x = p.x; yo.y = p.y; yo.v = 0;
  k.prox = 0;
  paso(j, 2, { quieto: true });
  ok(k.zonas.length === 0, 'puerto: marcó una zona sobre un barco en el puerto');
  paso(j, KRAKEN.seVa + 4, { quieto: true });
  ok(!j.kraken, 'se va: no se fue con el único capitán en el puerto');
}

// --- 8. en línea: varios capitanes le suben la vida; la simulación del servidor lo maneja igual
{
  const j = crearMar(crearMundo('caribe'), { servidor: true, enemigos: 0 });
  const A = agregarCapitan(j, { id: 'a', nombre: 'Ana', diseno }), B = agregarCapitan(j, { id: 'b', nombre: 'Beto', diseno });
  A.barco.x = 1500; A.barco.y = 1500; B.barco.x = 1600; B.barco.y = 1500;
  j.proxConvoy = 1e9; A.proxTritones = B.proxTritones = 1e9;
  A.marcasTesoro = KRAKEN.marcas;
  avanzar(j, 1 / 20, {});
  ok(j.kraken && j.kraken.vidaMax === Math.round(KRAKEN.vida * (1 + KRAKEN.porJugador)), 'en línea: con dos capitanes la vida no subió: ' + (j.kraken && j.kraken.vidaMax));
  ok(j.eventos.some((e) => e.k === 'kd'), 'en línea: no se emitió el evento de que despertó');
  ok(B.avisos.some((a) => a.texto.includes('despertó al Kraken')), 'en línea: el otro capitán no se enteró');
}

console.log(fallas ? `${fallas} fallas` : 'todo bien');
process.exit(fallas ? 1 : 0);
