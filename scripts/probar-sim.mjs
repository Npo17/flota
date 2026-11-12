// Prueba rápida de la simulación sin navegador: modo solo y varios capitanes. Uso: node scripts/probar-sim.mjs
import { crearMundo } from '../src/mundo.js';
import { crearPartida, crearMar, agregarCapitan, quitarCapitan, actualizar, avanzar, atracar, rindeViento, vientoEn, FORMACIONES } from '../src/juego.js';
import { MAPAS } from '../src/mapas.js';

const diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
// con equipos por civilización, un bot español sería aliado: en las pruebas los bots son de otra civilización
const rivales = (j) => { for (const b of j.barcos) if (!b.cap) b.diseno.faccion = 'britanicos'; return j; };
let fallas = 0;
const ok = (c, m) => { if (!c) { fallas++; console.log('FALLA:', m); } };

// --- reglas de la partida: sin viento no hay viento y el barco anda igual; sin abordajes, F no tira el gancho
{
  const j = rivales(crearPartida(crearMundo('caribe'), diseno, 100, { viento: false, abordajes: false }));
  ok(j.viento === null && j.reglas.viento === false && rindeViento(j, j.jugador) === 1, 'reglas: sin viento igual hay viento');
  const x0 = j.jugador.x, y0 = j.jugador.y;
  for (let i = 0; i < 60 * 5; i++) actualizar(j, 1 / 60, { objetivo: { x: x0 + 900, y: y0 + 600 }, velas: 3 });
  ok(Math.hypot(j.jugador.x - x0, j.jugador.y - y0) > 100, 'reglas: sin viento el barco no navega');
  actualizar(j, 1 / 60, { abordar: true, objetivo: { x: x0 + 900, y: y0 } });
  ok(!j.gancho, 'reglas: sin abordajes igual salió el gancho');
  const k = crearPartida(crearMundo('caribe'), diseno, 100);
  ok(k.viento && k.reglas.viento && k.reglas.abordajes, 'reglas: por defecto tiene que haber viento y abordajes');
}

// --- modo solo en todos los mapas
for (const id of Object.keys(MAPAS)) {
  const j = crearPartida(crearMundo(id), diseno, 100);
  for (let i = 0; i < 60 * 20; i++) actualizar(j, 1 / 60, { objetivo: { x: j.jugador.x + 300, y: j.jugador.y + 200 }, fuegoTodo: i % 90 === 0 });
  ok(j.barcos.includes(j.jugador) || j.fin, `solo ${id}: el jugador desapareció`);
  ok(Number.isFinite(j.jugador.x), `solo ${id}: posición inválida`);
}

// --- solo: hundir, juntar oro, abordar, atracar, morir
{
  const j = rivales(crearPartida(crearMundo('malta'), diseno, 100));
  const yo = j.jugador, e = j.barcos.find((b) => b.bando === 'enemigo');
  yo.x = 1500; yo.y = 4500; yo.a = 0; e.x = 1500; e.y = 4680; e.a = 0;
  let n = 0;
  while (!e.hundiendo && n++ < 60 * 120) { e.x = 1500; e.y = 4680; e.v = 0; yo.x = 1500; yo.y = 4500; yo.a = 0; yo.vida = yo.stats.vidaMax; actualizar(j, 1 / 60, { fuego: 1 }); }
  ok(e.hundiendo > 0, 'solo: no se hundió el enemigo');
  ok(j.stats.hundidos === 1, 'solo: no contó el hundido: ' + j.stats.hundidos);
  for (let i = 0; i < 900 && !j.oroBodega; i++) { yo.vida = yo.stats.vidaMax; actualizar(j, 1 / 60, { objetivo: { x: 1500, y: 4680 }, velas: 3 }); } // con viento de proa tarda más
  ok(j.oroBodega > 0, 'solo: no juntó el oro');
  // abordaje: el gancho sale volando hacia el cursor; lejos o mal apuntado no engancha; a tiro y apuntado, sí, y la pelea lleva su tiempo
  {
    const l = j.barcos.find((b) => b.bando === 'enemigo' && !b.hundiendo);
    const volar = () => { for (let i = 0; i < 60 && j.gancho && j.gancho.fase === 'vuelo'; i++) { l.v = 0; yo.v = 0; actualizar(j, 1 / 60, {}); } };
    yo.vida = 1e6; // que no lo hundan otros barcos mientras se prueba
    for (const o of j.barcos) if (o !== l && o !== yo) { o.x = 300; o.y = 300; }
    yo.x = 3000; yo.y = 5200; yo.a = 0; yo.v = 0; l.x = 3000; l.y = 5520; l.a = 0; l.v = 0; j.cdAbordaje = 0;
    actualizar(j, 1 / 60, { abordar: true, objetivo: { x: l.x, y: l.y } });
    ok(!!j.gancho && j.gancho.fase === 'vuelo', 'abordaje: el gancho no salió volando');
    volar();
    ok(!j.gancho, 'abordaje: enganchó desde lejos');
    l.y = 5350; l.v = 0; yo.trip = 30; l.trip = 20; j.cdAbordaje = 0;
    actualizar(j, 1 / 60, { abordar: true, objetivo: { x: l.x + 600, y: yo.y } });
    volar();
    ok(!j.gancho, 'abordaje: enganchó sin apuntarle al barco');
    j.cdAbordaje = 0; yo.trip = 30; l.trip = 30; l.x = 3000; l.y = 5350; l.v = 0;
    actualizar(j, 1 / 60, { abordar: true, objetivo: { x: l.x, y: l.y } });
    volar();
    ok(!!j.gancho && j.gancho.obj === l, 'abordaje: no enganchó apuntando a un barco a tiro');
    for (let i = 0; i < 60 * 2; i++) { l.v = 0; actualizar(j, 1 / 60, {}); }
    ok(!!j.gancho && l.trip < 30 && yo.trip < 30, 'abordaje: la pelea no dura o no hay bajas: ' + yo.trip + ' / ' + l.trip);
    const antes = yo.trip;
    actualizar(j, 1 / 60, { abordar: true });
    ok(!j.gancho && yo.trip < antes && l.bando === 'enemigo', 'abordaje: no cortó las sogas');
    l.x = 800; l.y = 5900; j.cdAbordaje = 0; yo.vida = yo.stats.vidaMax;
  }
  // abordaje hasta capturar
  const m = j.barcos.find((b) => b.bando === 'enemigo' && !b.hundiendo);
  yo.x = 3000; yo.y = 5200; yo.a = 0; yo.v = 0; yo.trip = 200; m.x = 3000; m.y = 5260; m.a = 0; m.v = 0; m.vida = 5; j.cdAbordaje = 0;
  actualizar(j, 1 / 60, { abordar: true, objetivo: { x: m.x, y: m.y } });
  for (let i = 0; i < 60 * 15 + 30 && m.bando === 'enemigo' && !m.hundiendo; i++) { m.v = 0; actualizar(j, 1 / 60, {}); }
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
  const B = agregarCapitan(j, { id: 'b', nombre: 'Beto', diseno: { ...diseno, faccion: 'franceses' }, oro: 0 });
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
// --- viento: de popa se anda más que de proa, nunca frena del todo, las ráfagas empujan y las velas se eligen
{
  const correr = (velas, rumbo, seg = 12) => {
    const j = crearPartida(crearMundo('malta'), { ...diseno, velas }, 100);
    j.barcos = [j.jugador]; j.enemigosVivos = 0; j.viento.base = 0; j.viento.baseMeta = 0; j.viento.rafagas = []; j.viento.curvo = false; j.viento.proxCambio = Infinity; // sin ráfagas, curvas ni cambios: se mide el viento parejo
    const yo = j.jugador; yo.x = 3200; yo.y = 5600; yo.a = rumbo;
    const x0 = yo.x, y0 = yo.y;
    for (let i = 0; i < 60 * seg; i++) { j.t = 0; actualizar(j, 1 / 60, { objetivo: { x: yo.x + Math.cos(rumbo) * 500, y: yo.y + Math.sin(rumbo) * 500 }, velas: 3 }); }
    return Math.hypot(yo.x - x0, yo.y - y0);
  };
  for (const velas of ['latinas', 'cuadras', 'mixtas']) {
    const popa = correr(velas, 0), traves = correr(velas, -Math.PI / 2), proa = correr(velas, Math.PI);
    ok(popa > traves * 1.08 && traves > proa * 1.15, `viento ${velas}: popa ${popa | 0}, través ${traves | 0}, proa ${proa | 0}`);
    ok(proa > traves * 0.6, `viento ${velas}: de proa casi no avanza (${proa | 0} contra ${traves | 0})`);
  }
  // las cuadras ya corren más de por sí: lo que se compara es cuánto pierde cada una contra el viento
  ok(correr('latinas', Math.PI) / correr('latinas', -Math.PI / 2) > (correr('cuadras', Math.PI) / correr('cuadras', -Math.PI / 2)) * 1.08, 'viento: las latinas no ciñen mejor que las cuadras');
  ok(correr('cuadras', 0) > correr('latinas', 0) * 1.05, 'viento: las cuadras no rinden más de popa');
  const j = crearPartida(crearMundo('malta'), diseno, 100), yo = j.jugador;
  j.viento.a = 0; yo.a = 0; j.viento.rafagas = [];
  const sin = rindeViento(j, yo);
  j.viento.rafagas = [{ x: yo.x, y: yo.y, r: 300 }];
  ok(rindeViento(j, yo) > sin * 1.2 && yo.enRafaga, 'viento: la ráfaga no empuja');
  yo.a = Math.PI;
  ok(rindeViento(j, yo) < 1 && !yo.enRafaga, 'viento: la ráfaga empuja contra el viento');
  // velas elegidas por el capitán, sin importar a qué distancia está el cursor
  for (const v of [0, 1, 2, 3]) { actualizar(j, 1 / 60, { objetivo: { x: yo.x + 900, y: yo.y }, velas: v }); ok(yo.velas === v, `velas: pidió ${v} y quedó en ${yo.velas}`); }
  actualizar(j, 1 / 60, { objetivo: { x: yo.x + 100, y: yo.y } });
  ok(yo.velas === 1, 'velas: una entrada vieja (sin velas) ya no usa la distancia al cursor');
  ok(j.viento.rafagas.every((g) => Number.isFinite(g.x)), 'viento: ráfaga con posición inválida');
}
// --- galeón del tesoro: uno solo, con guardias que lo cubren, y rumbo al puerto
{
  const j = crearPartida(crearMundo('malta'), diseno, 100);
  j.proxConvoy = 0;
  for (let i = 0; i < 30 && !j.barcos.some((b) => b.convoy); i++) actualizar(j, 1 / 60, {});
  const tesoro = j.barcos.find((b) => b.convoy);
  ok(!!tesoro, 'tesoro: no apareció');
  if (tesoro) {
    const guardias = j.barcos.filter((b) => b.ia && b.ia.lider === tesoro);
    ok(guardias.length === 4, 'tesoro: guardias ' + guardias.length);
    ok(j.barcos.filter((b) => b.tipo === 'tesoro').length === 1, 'tesoro: hay más de uno');
    const p = j.mundo.puerto, d0 = Math.hypot(tesoro.x - p.x, tesoro.y - p.y), vida = tesoro.vida;
    j.mundo.islas = j.mundo.islas.filter((i) => i.tipo === 'puerto'); j.mundo.remolinos = []; // sin encalladuras que raspen el casco
    j.barcos = j.barcos.filter((b) => b === j.jugador || b === tesoro || guardias.includes(b));
    j.enemigosVivos = 0;
    // pegarle con guardias vivos no le hace nada
    const yo = j.jugador; yo.vida = 1e6;
    for (let i = 0; i < 60 * 8; i++) { for (const g of guardias) g.vida = g.stats.vidaMax; yo.x = tesoro.x + Math.sin(tesoro.a) * 170; yo.y = tesoro.y - Math.cos(tesoro.a) * 170; yo.a = tesoro.a; yo.v = 0; actualizar(j, 1 / 60, { fuegoTodo: true }); }
    ok(tesoro.vida > vida - 25, 'tesoro: recibió daño de cañón con los guardias vivos: ' + Math.round(vida - tesoro.vida)); // encallar o un remolino sí lo raspan
    // sin guardias, sí
    for (const g of guardias) { g.vida = -1; }
    for (let i = 0; i < 60 * 30 && tesoro.vida === vida; i++) { yo.x = tesoro.x + Math.sin(tesoro.a) * 170; yo.y = tesoro.y - Math.cos(tesoro.a) * 170; yo.a = tesoro.a; yo.v = 0; actualizar(j, 1 / 60, { fuegoTodo: true }); }
    ok(tesoro.vida < vida, 'tesoro: no recibió daño sin guardias');
    yo.x = 300; yo.y = 300;
    tesoro.vida = tesoro.stats.vidaMax;
    for (let i = 0; i < 60 * 40; i++) actualizar(j, 1 / 60, {});
    ok(!j.barcos.includes(tesoro) || Math.hypot(tesoro.x - p.x, tesoro.y - p.y) < d0 - 300, 'tesoro: no avanza hacia el puerto');
  }
  // comprar un casco más grande en el puerto
  const k = crearPartida(crearMundo('malta'), { ...diseno, casco: 'balandra', canones: 4 }, 5000);
  const { comprar, catalogoPuerto } = await import('../src/puerto.js');
  k.jugador.vida = 10;
  ok(comprar(k, k.yo, 'cascoNuevo:galeon') && k.jugador.diseno.casco === 'galeon', 'puerto: no compró el galeón');
  ok(k.jugador.vida === k.jugador.stats.vidaMax && k.jugador.stats.vidaMax > 200, 'puerto: el casco nuevo no salió entero: ' + k.jugador.vida);
  ok(!comprar(k, k.yo, 'cascoNuevo:balandra'), 'puerto: dejó volver a un casco más chico');
  ok(k.oroPuerto < 5000 && k.oroPuerto > 3000, 'puerto: cobró mal el casco: ' + k.oroPuerto);
}
// --- equipos por civilización: los de tu civilización no se dañan; bots de civilizaciones distintas se pelean
{
  const { equipoDe } = await import('../src/juego.js');
  const j = crearPartida(crearMundo('malta'), diseno, 100), yo = j.jugador;
  const [a, b] = j.barcos.filter((x) => x.bando === 'enemigo' && x.tipo !== 'mercante').slice(0, 2); // los mercantes huyen
  j.barcos = [yo, a, b]; j.enemigosVivos = 0;
  a.diseno.faccion = 'espanoles'; b.diseno.faccion = 'britanicos';
  ok(equipoDe(a) === equipoDe(yo) && equipoDe(b) !== equipoDe(yo), 'equipos: mal armados');
  yo.x = 300; yo.y = 300; j.mundo.islas = []; j.mundo.remolinos = []; a.x = 4200; a.y = 4800; b.x = 4200; b.y = 5050; a.vida = a.stats.vidaMax; b.vida = b.stats.vidaMax;
  const va = a.vida, vb = b.vida;
  let tiros = 0;
  for (let i = 0; i < 60 * 40; i++) { yo.vida = yo.stats.vidaMax; actualizar(j, 1 / 60, {}); tiros += j.balas.length ? 1 : 0; }
  ok(tiros > 60, 'equipos: los bots de distinta civilización no se pelearon'); // a veces se tiran y erran: lo que importa es que se disparen
  j.barcos = [yo, a]; a.hundiendo = 0; a.vida = a.stats.vidaMax; // ahora, sin el británico: le disparo al aliado
  b.x = 5800; b.y = 800;
  const vidaA = a.vida;
  for (let i = 0; i < 60 * 10; i++) { yo.x = 1500; yo.y = 4500; yo.a = 0; yo.v = 0; a.x = 1500; a.y = 4680; a.v = 0; actualizar(j, 1 / 60, { fuego: 1 }); }
  ok(a.vida === vidaA, 'equipos: le hice daño a un aliado');
}
// --- rachas, habilidades, refuerzo, guardias que no abandonan al tesoro y mundo sin callejones
{
  const { HABILIDADES } = await import('../src/config.js');
  const { comprar } = await import('../src/puerto.js');
  const j = crearPartida(crearMundo('malta'), { ...diseno, habilidad: 'andanada' }, 5000), yo = j.jugador;
  j.barcos = [yo]; j.enemigosVivos = 0;
  // una racha a favor empuja aunque el viento general esté de proa; en contra no
  j.viento.a = Math.PI; j.viento.rafagas = []; j.viento.curvo = false; yo.a = 0;
  const contra = rindeViento(j, yo);
  j.viento.rachas = [{ x: yo.x, y: yo.y, r: 200, a: 0.3, t: 5 }];
  ok(contra < 0.85 && rindeViento(j, yo) > 1.4, 'racha: no empuja con viento en contra');
  j.viento.rachas = [{ x: yo.x, y: yo.y, r: 200, a: Math.PI, t: 5 }];
  ok(rindeViento(j, yo) === contra, 'racha: empuja aunque sople para el otro lado');
  // las rachas ya no se crean solas (se sacó el círculo con flechitas): solo queda la brisa que se mueve
  j.viento.rachas = [];
  yo.x = 800; yo.y = 5600;
  for (let i = 0; i < 60 * 20; i++) actualizar(j, 1 / 60, {});
  ok(j.viento.rachas.length === 0, 'racha: se siguen creando rachas');
  // viento curvo: no sopla igual en todo el mar, y la diferencia nunca pasa de lo configurado
  {
    const k = crearPartida(crearMundo('malta'), diseno, 100), v = k.viento;
    ok(v.curvo, 'viento: una partida nueva no tiene el viento curvo');
    let menor = Infinity, mayor = -Infinity;
    for (let x = 0; x < k.mundo.ancho; x += 300) for (let y = 0; y < k.mundo.alto; y += 300) { const d = vientoEn(k, x, y) - v.a; menor = Math.min(menor, d); mayor = Math.max(mayor, d); }
    ok(mayor - menor > 0.8 && mayor < 1.0 && menor > -1.0, `viento: curva fuera de lo esperado (${menor.toFixed(2)} a ${mayor.toFixed(2)})`);
    // cambio de rumbo: se anuncia una vez, y en unos segundos el viento queda soplando casi al revés
    const antes = v.base; v.proxCambio = 0.01;
    let anunciado = false;
    for (let i = 0; i < 60 * 14; i++) { actualizar(k, 1 / 60, {}); anunciado = anunciado || k.avisos.some((q) => q.texto === '¡El viento cambió de rumbo!'); }
    const giro = Math.abs(Math.atan2(Math.sin(v.base - antes), Math.cos(v.base - antes)));
    ok(v.cambios === 1 && giro > 2.3, `viento: no cambió de rumbo (cambios ${v.cambios}, giro ${giro.toFixed(2)})`);
    ok(anunciado, 'viento: el cambio de rumbo no se anunció');
  }
  // galeón del tesoro: zarpa de una punta del mapa y llega al puerto entre 2 minutos y 2 y medio
  for (const mapa of Object.keys(MAPAS)) {
    const k = crearPartida(crearMundo(mapa), diseno, 100);
    k.barcos = [k.jugador]; k.enemigosVivos = 0; k.proxConvoy = 0.01; k.jugador.x = 3200; k.jugador.y = 3600;
    actualizar(k, 1 / 30, {});
    const g = k.barcos.find((b) => b.convoy);
    // de una punta si alguna tiene agua; si no (mapas de estrechos), del borde del mapa
    const alBorde = g && Math.min(g.x, k.mundo.ancho - g.x, g.y, k.mundo.alto - g.y) <= 1000;
    ok(alBorde, `tesoro (${mapa}): no zarpó del borde del mapa` + (g ? ` (${g.x | 0}, ${g.y | 0})` : ''));
    let seg = 0;
    while (g && k.barcos.includes(g) && seg < 240) { k.jugador.vida = k.jugador.stats.vidaMax; k.proxConvoy = 999; actualizar(k, 1 / 30, { quieto: true }); seg += 1 / 30; }
    ok(seg >= 115 && seg <= 160, `tesoro (${mapa}): el viaje duró ${seg | 0} s en vez de 120 a 150`);
  }
  // formaciones: la orden las recorre todas y vuelve a la primera; cada una pone a los barcos en lugares distintos
  {
    const k = crearPartida(crearMundo('malta'), diseno, 100);
    const vistas = new Set([k.formacion]);
    for (let i = 0; i < FORMACIONES.length; i++) { actualizar(k, 1 / 60, { formacion: true }); vistas.add(k.formacion); }
    ok(vistas.size === FORMACIONES.length && k.formacion === 0, `formaciones: no las recorre todas (${[...vistas]})`);
    const lugares = new Set(FORMACIONES.map((f) => [0, 1, 2].map((n) => f.lugar(n).join(',')).join(' ')));
    ok(lugares.size === FORMACIONES.length, 'formaciones: dos formaciones ponen los barcos en el mismo lugar');
  }
  // flota con el jefe parado al lado de una isla y girando en el lugar (captura de Nicolás, 15/11/2026): la flota no sale a
  // dar vueltas ni se lastima contra la costa, en ninguna formación
  for (let f = 0; f < FORMACIONES.length; f++) {
    const k = crearPartida(crearMundo('caribe'), diseno, 100), yo = k.jugador;
    const isla = k.mundo.islas.filter((i) => i.tipo === 'isla').sort((a, b) => b.r - a.r)[0];
    const flota = k.barcos.filter((b) => b.bando === 'enemigo').slice(0, 3);
    k.barcos = [yo, ...flota]; k.enemigosVivos = 0; k.proxConvoy = 999; k.formacion = f;
    yo.x = isla.x; yo.y = isla.y + isla.r + yo.stats.ancho + 60; yo.a = Math.PI / 2; yo.v = 0; yo.velas = 0;
    flota.forEach((b, n) => { b.bando = 'escolta'; b.cap = k.yo; b.ia = { estado: 'sigue' }; b.x = yo.x + (n - 1) * 140; b.y = yo.y + 160; b.v = 0; b.vida = b.stats.vidaMax; });
    for (let i = 0; i < 60 * 8; i++) actualizar(k, 1 / 60, { quieto: true }); // que se acomoden

    let recorrido = 0;
    for (let i = 0; i < 60 * 20; i++) {
      const ang = i / 60 * 1.2; // la proa (el cursor) da vueltas, con las velas arriadas
      const prev = flota.map((b) => [b.x, b.y]);
      actualizar(k, 1 / 60, { objetivo: { x: yo.x + Math.cos(ang) * 300, y: yo.y + Math.sin(ang) * 300 }, velas: 0 });
      flota.forEach((b, n) => { recorrido += Math.hypot(b.x - prev[n][0], b.y - prev[n][1]); });
      yo.vida = yo.stats.vidaMax;
    }
    ok(flota.every((b) => b.vida >= b.stats.vidaMax), `flota quieta (${FORMACIONES[f].id}): se lastimó sola: ` + flota.map((b) => Math.round(b.vida / b.stats.vidaMax * 100) + '%'));
    ok(recorrido / 3 < 400, `flota quieta (${FORMACIONES[f].id}): anduvo ${Math.round(recorrido / 3)} px dando vueltas mientras el jefe solo giraba`);

  }
  // habilidades
  yo.recarga['1'] = 3; yo.recarga['-1'] = 3;
  actualizar(j, 1 / 60, { habilidad: true });
  ok(yo.recarga['1'] === 0 && yo.recarga['-1'] === 0 && j.cdHabilidad > 30, 'habilidad: la andanada doble no recargó');
  actualizar(j, 1 / 60, { habilidad: true });
  ok(j.cdHabilidad < HABILIDADES.andanada.espera, 'habilidad: se pudo usar dos veces seguidas');
  yo.diseno.habilidad = 'carpinteros'; j.yo.cdHabilidad = 0; yo.vida = 50;
  actualizar(j, 1 / 60, { habilidad: true });
  for (let i = 0; i < 60 * 7; i++) actualizar(j, 1 / 60, {});
  ok(yo.vida > 50 + yo.stats.vidaMax * 0.22 && !j.habilidad, 'habilidad: los carpinteros no repararon: ' + yo.vida);
  // reforzar el casco en el puerto
  const antes = yo.stats.vidaMax;
  ok(comprar(j, j.yo, 'refuerzo') && yo.stats.vidaMax === antes + 45, 'puerto: el refuerzo no sumó casco');
  // el tesoro: los guardias no persiguen a un barco que se aleja, y se van cuando cae el galeón
  j.proxConvoy = 0; yo.vida = 1e6;
  for (let i = 0; i < 30 && !j.barcos.some((b) => b.convoy); i++) actualizar(j, 1 / 60, {});
  const tesoro = j.barcos.find((b) => b.convoy), guardias = j.barcos.filter((b) => b.ia && b.ia.lider === tesoro);
  ok(guardias.length === 4 && guardias.every((g) => g.tipo !== 'galeonGuerra'), 'tesoro: guardias mal armados');
  j.mundo.islas = j.mundo.islas.filter((i) => i.tipo === 'puerto'); j.mundo.remolinos = [];
  for (let i = 0; i < 60 * 20; i++) { yo.x = tesoro.x + 700; yo.y = tesoro.y + 700; yo.v = 0; yo.vida = 1e6; actualizar(j, 1 / 60, {}); }
  ok(guardias.every((g) => Math.hypot(g.x - tesoro.x, g.y - tesoro.y) < 420), 'tesoro: los guardias abandonaron al galeón: ' + guardias.map((g) => Math.round(Math.hypot(g.x - tesoro.x, g.y - tesoro.y))));
  tesoro.vida = -1; for (const g of guardias) { g.x = tesoro.x; g.y = tesoro.y + 300; }
  for (let i = 0; i < 60 * 16; i++) { yo.vida = 1e6; actualizar(j, 1 / 60, {}); }
  ok(!j.barcos.some((b) => guardias.includes(b) && !b.hundiendo), 'tesoro: los guardias no se fueron al terminar el evento');
  // mundo sin callejones: ningún islote chico deja un paso angosto con otra tierra
  for (const id of Object.keys(MAPAS)) {
    const m = crearMundo(id), chicos = m.islas.filter((i) => ['isla', 'iceberg', 'arrecife'].includes(i.tipo));
    ok(chicos.every((i) => m.islas.every((o) => o === i || Math.hypot(o.x - i.x, o.y - i.y) - o.r - i.r >= 280)), `mundo ${id}: quedó un callejón`);
    ok(crearMundo(id, { callejones: true }).islas.length >= crearMundo(id, { relleno: false }).islas.length, `mundo ${id}: la versión anterior tiene menos islas`);
    // tierras de un solo cuerpo: el relleno solo agrega tierra, no toca lo demás ni se mete en las aguas del puerto
    const sin = crearMundo(id, { relleno: false });
    ok(m.islas.length >= sin.islas.length && sin.islas.filter((i) => i.tipo === 'tierra' || i.esPuerto).every((i) => m.islas.some((o) => o.x === i.x && o.y === i.y && o.r === i.r)), `mundo ${id}: el relleno cambió las tierras que ya estaban`);
    ok(m.islas.every((i) => i.esPuerto || Math.hypot(i.x - m.puerto.x, i.y - m.puerto.y) > i.r + 200), `mundo ${id}: hay tierra encima del puerto`);
  }
}
console.log(fallas ? `${fallas} fallas` : 'todo bien');
process.exit(fallas ? 1 : 0);
