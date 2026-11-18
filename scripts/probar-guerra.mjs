// Prueba del motor de guerra (18/11/2026): dos bandos con su puerto, bajas con antiabuso y recompensa por racha,
// reaparecer con las mejoras y escudo, cañones de costa, galeón del tesoro con mejora, fin por tiempo, Supremacía de Oro y
// Dominio de Zonas. Corre la simulación sin pantalla, igual que el servidor.
import { crearMundo } from '../src/mundo.js';
import { crearMar, agregarCapitan, avanzar, disparar, GUERRA, guerraAFoto, guerraDeFoto } from '../src/juego.js';

let fallas = 0;
const ok = (x, m) => { if (!x) { fallas++; console.log('✗', m); } };
const diseno = { faccion: 'espanoles', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', habilidad: 'andanada' };
const pasar = (j, s, entradas = {}) => { for (let i = 0; i < s * 20; i++) avanzar(j, 0.05, entradas); };
const mar = (modo) => {
  const j = crearMar(crearMundo('lepanto', { bandos: 2 }), { servidor: true, enemigos: 0, reglas: { modo, bandos: [{ nombre: 'Azules', tag: 'AZU', color: '#3f8fc0' }, { nombre: 'Rojos', tag: 'ROJ', color: '#e63946' }] } });
  j.tritones = []; j.proxTritones = 1e9;
  return j;
};
const hundirA = (j, victima, agresor) => { victima.barco.ultimoAgresor = agresor; victima.barco.vida = -1; avanzar(j, 0.05, {}); };
const lejos = (j, cap) => { cap.barco.x = j.mundo.ancho / 2; cap.barco.y = j.mundo.alto / 2 - 900; cap.proxTritones = 1e9; };

// ---------- Versus ----------
{
  const j = mar('versus');
  ok(j.guerra && j.guerra.modo === 'versus' && j.reglas.kraken === false, 'versus: no armó la guerra o hay Kraken');
  const [pa, pb] = j.mundo.puertos;
  const a1 = agregarCapitan(j, { id: 'a1', nombre: 'Ana', diseno, equipo: 'A' });
  const a2 = agregarCapitan(j, { id: 'a2', nombre: 'Alba', diseno, equipo: 'A' });
  const b1 = agregarCapitan(j, { id: 'b1', nombre: 'Beto', diseno: { ...diseno, nivelCanones: 5 }, equipo: 'B' });
  for (const c of [a1, a2, b1]) c.proxTritones = 1e9;
  ok(Math.hypot(a1.barco.x - pa.x, a1.barco.y - pa.y) < 300 && Math.hypot(b1.barco.x - pb.x, b1.barco.y - pb.y) < 300, 'versus: no salieron de su puerto');
  // primera baja: 1 punto
  lejos(j, b1); b1.oroBodega = 1000;
  hundirA(j, b1, a1);
  ok(j.guerra.marcador.A === 1, 'versus: la primera baja no sumó 1: ' + j.guerra.marcador.A);
  ok(b1.oroBodega === 700, 'versus: no perdió el 30 % del oro en bodega: ' + b1.oroBodega);
  ok(!b1.fin, 'versus: el hundido terminó la partida (tenía que reaparecer)');
  pasar(j, GUERRA.reaparecer + 0.2);
  ok(!b1.barco.hundiendo && Math.hypot(b1.barco.x - pb.x, b1.barco.y - pb.y) < 300, 'versus: no reapareció en su puerto');
  ok(b1.barco.diseno.nivelCanones === 5, 'versus: reapareció sin sus mejoras');
  ok(b1.barco.escudoHasta > j.t, 'versus: reapareció sin escudo');
  // con escudo no recibe daño; al disparar, se corta
  const vida0 = b1.barco.vida;
  a1.barco.x = b1.barco.x; a1.barco.y = b1.barco.y - 120; a1.barco.a = 0; b1.barco.a = 0;
  a1.barco.recarga[1] = a1.barco.recarga[-1] = 0; disparar(j, a1.barco, 1); disparar(j, a1.barco, -1); pasar(j, 1);
  ok(b1.barco.vida >= vida0, 'versus: le pegaron con escudo');
  lejos(j, a1); b1.barco.x = j.mundo.ancho / 2 + 300; b1.barco.y = j.mundo.alto / 2 + 900; // fuera de los puertos (ahí no se dispara, y la costa castiga)
  b1.barco.recarga[1] = 0; disparar(j, b1.barco, 1);
  ok(!b1.barco.escudoHasta, 'versus: disparar no cortó el escudo');
  // la misma víctima de nuevo: ½ y después 0
  lejos(j, b1); hundirA(j, b1, a1); pasar(j, GUERRA.reaparecer + 0.2);
  ok(j.guerra.marcador.A === 1.5, 'versus: la segunda baja seguida no valió ½: ' + j.guerra.marcador.A);
  lejos(j, b1); hundirA(j, b1, a1); pasar(j, GUERRA.reaparecer + 0.2);
  ok(j.guerra.marcador.A === 1.5, 'versus: la tercera baja seguida sumó: ' + j.guerra.marcador.A);
  // racha: a1 lleva 3 sin morir; si b1 lo hunde, cobra la recompensa (+1 por cada 2 de racha)
  ok(a1.racha === 3, 'versus: no contó la racha: ' + a1.racha);
  lejos(j, a1); hundirA(j, a1, b1);
  ok(j.guerra.marcador.B === 2, 'versus: no cobró la recompensa por la racha (1 + 1): ' + j.guerra.marcador.B);
  ok(a1.racha === 0, 'versus: la racha no volvió a 0 al hundirse');
  // fuego amigo: un barco del mismo bando no recibe daño
  pasar(j, GUERRA.reaparecer + 0.2);
  a2.barco.x = a1.barco.x = j.mundo.ancho / 2; a2.barco.y = j.mundo.alto / 2 + 800; a1.barco.y = a2.barco.y - 120; a1.barco.a = a2.barco.a = 0;
  a1.barco.escudoHasta = a2.barco.escudoHasta = 0;
  const vidaAmiga = a2.barco.vida;
  a1.barco.recarga[1] = a1.barco.recarga[-1] = 0; disparar(j, a1.barco, 1); disparar(j, a1.barco, -1); pasar(j, 1);
  ok(a2.barco.vida === vidaAmiga, 'versus: hubo fuego amigo');
  // cañones de costa: b1 cerca del puerto rival
  b1.barco.escudoHasta = 0; b1.barco.x = pa.x + 200; b1.barco.y = pa.y; b1.barco.velas = 0;
  const vidaCosta = b1.barco.vida; pasar(j, 2.1);
  ok(b1.barco.vida < vidaCosta, 'versus: los cañones de costa no dispararon');
  // un barco del bando, en su propio puerto, no recibe nada
  const vidaPropia = a2.barco.vida; a2.barco.x = pa.x + 150; a2.barco.y = pa.y; a2.barco.velas = 0; pasar(j, 2.1);
  ok(a2.barco.vida >= vidaPropia, 'versus: la costa le disparó al propio bando');
  // galeón del tesoro: aviso y salida a los 5 minutos, en el centro
  j.guerra.t = GUERRA.galeones[0] - 0.5; pasar(j, 1);
  const galeon = j.barcos.find((b) => b.convoy && b.guerra);
  ok(galeon && Math.hypot(galeon.x - j.mundo.puerto.x, galeon.y - j.mundo.puerto.y) < 800, 'versus: no salió el galeón en el centro');
  // lo hunde el bando A: oro para todos y más daño
  for (const g of j.barcos.filter((b) => b.equipo === 'tesoro' && !b.convoy)) { g.ultimoAgresor = a1; g.vida = -1; }
  pasar(j, 0.2);
  const oroAntes = a2.oroBodega + a1.oroBodega;
  galeon.ultimoAgresor = a1; galeon.vida = -1; pasar(j, 0.2);
  ok(a1.oroBodega + a2.oroBodega > oroAntes && j.guerra.mejora.A > j.t, 'versus: hundir el galeón no dio oro o la mejora');
  // fin por tiempo
  j.guerra.t = j.guerra.duracion - 0.1; pasar(j, 0.3);
  ok(j.guerra.fin && j.guerra.fin.ganador === 'B', 'versus: no terminó o ganó el que no era (B iba 2 a 1,5): ' + JSON.stringify(j.guerra.fin));
  // la foto ida y vuelta
  const f = guerraDeFoto(JSON.parse(JSON.stringify(guerraAFoto(j.guerra))));
  ok(f.marcador.B === 2 && f.bandos[0].tag === 'AZU' && f.fin.ganador === 'B', 'versus: la foto de la guerra no vuelve igual');
}

// ---------- Supremacía de Oro ----------
{
  const j = mar('oro');
  const a1 = agregarCapitan(j, { id: 'a1', nombre: 'Ana', diseno, equipo: 'A' });
  const b1 = agregarCapitan(j, { id: 'b1', nombre: 'Beto', diseno, equipo: 'B' });
  for (const c of [a1, b1]) c.proxTritones = 1e9;
  lejos(j, b1); b1.oroBodega = 2000;
  hundirA(j, b1, a1);
  ok(j.guerra.marcador.A >= 600 && j.guerra.marcador.B === 0, 'oro: el oro ganado no sumó al marcador: ' + JSON.stringify(j.guerra.marcador));
}

// ---------- Dominio de Zonas ----------
{
  const j = mar('zonas');
  ok(j.guerra.zonas.length >= 5 && j.guerra.zonas.length <= 9, 'zonas: cantidad de zonas fuera de 5 a 9: ' + j.guerra.zonas.length);
  ok(j.guerra.galeones.length === 0, 'zonas: hay galeón del tesoro en Dominio de Zonas');
  const a1 = agregarCapitan(j, { id: 'a1', nombre: 'Ana', diseno, equipo: 'A' });
  const b1 = agregarCapitan(j, { id: 'b1', nombre: 'Beto', diseno, equipo: 'B' });
  for (const c of [a1, b1]) c.proxTritones = 1e9;
  const z = j.guerra.zonas[0];
  const quieto = (b, z) => { b.x = z.x; b.y = z.y; b.velas = 0; b.v = 0; };
  for (let i = 0; i < 20 * (GUERRA.zonas.captura + 1); i++) { quieto(a1.barco, z); avanzar(j, 0.05, {}); }
  ok(z.duena === 'A' && j.guerra.marcador.A === 1, 'zonas: no tomó la zona: ' + JSON.stringify(z));
  // en disputa no avanza
  const z2 = j.guerra.zonas[1];
  for (let i = 0; i < 20 * (GUERRA.zonas.captura + 1); i++) { quieto(a1.barco, z2); quieto(b1.barco, { x: z2.x + 60, y: z2.y }); avanzar(j, 0.05, {}); }
  ok(!z2.duena && z2.disputa, 'zonas: una zona en disputa cambió de dueño');
  // fin con desempate por tiempo de control
  j.guerra.marcador = { A: 0, B: 0 }; for (const zz of j.guerra.zonas) zz.duena = null;
  j.guerra.control = { A: 50, B: 10 }; j.guerra.t = j.guerra.duracion - 0.05; avanzar(j, 0.1, {});
  ok(j.guerra.fin && j.guerra.fin.ganador === 'A', 'zonas: el desempate por tiempo de control no funcionó');
}

// ---------- El mar de siempre no cambia ----------
{
  const j = crearMar(crearMundo('lepanto'), { servidor: true, enemigos: 0 });
  ok(!j.guerra && !j.mundo.puertos && j.reglas.kraken !== false, 'mar libre: tiene cosas de guerra');
}

console.log(fallas ? `${fallas} fallas` : 'todo bien');
process.exit(fallas ? 1 : 0);
