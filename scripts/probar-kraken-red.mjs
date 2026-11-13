// Prueba, sin red, del Kraken en línea de punta a punta: el servidor (servidor/worker.js) lo despierta, marca una zona y golpea;
// el cliente (src/red.js) tiene que ver lo mismo: el Kraken en el mismo lugar, con la misma vida, y la zona donde la puso el servidor.
// Uso: node scripts/probar-kraken-red.mjs
globalThis.location = { search: '' };
const { Mar } = await import('../servidor/worker.js');
const { KRAKEN } = await import('../src/config.js');
const mar = new Mar(null, null);
const pendientes = [];
globalThis.WebSocket = class {
  constructor() {
    this.readyState = 1;
    const cliente = this;
    this.srv = { send: (m) => cliente.onmessage({ data: m }), close() {}, addEventListener() {} };
    mar.atender(this.srv);
    setTimeout(() => this.onopen(), 0);
  }
  send(m) { pendientes.push(m); }
  close() {}
};
const { conectar } = await import('../src/red.js');
const diseno = { faccion: 'vikingos', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
let fallas = 0;
const ok = (x, m) => { if (!x) { fallas++; console.log('FALLA:', m); } };
const red = conectar({ nombre: 'Ana', diseno, alEntrar() {}, alCerrar() {}, alPuerto() {} });
const j = red.partida;
await new Promise((r) => setTimeout(r, 10));
const ws = [...mar.clientes.keys()][0];
const entregar = () => { while (pendientes.length) mar.mensaje(ws, mar.clientes.get(ws), JSON.parse(pendientes.shift())); };
entregar(); clearInterval(mar.reloj);
mar.paso();
ok(j.jugador && !j.kraken, 'arrancó con un Kraken en el mar');

// el capitán junta las marcas: el servidor lo despierta y el cliente lo ve
const s = mar.j, cap = mar.clientes.get(ws).cap;
s.barcos = s.barcos.filter((b) => b.cap); s.enemigosVivos = 0; s.proxConvoy = 1e9; cap.proxTritones = 1e9;
cap.barco.x = 1500; cap.barco.y = 1500;
cap.marcasTesoro = KRAKEN.marcas;
mar.paso();
const k = s.kraken;
ok(!!k, 'el servidor no lo despertó');
ok(j.kraken && Math.abs(j.kraken.x - k.x) <= 1 && Math.abs(j.kraken.y - k.y) <= 1 && j.kraken.vidaMax === k.vidaMax, 'el cliente no lo ve donde está');
ok(j.avisos.some((a) => a.texto.includes('despertó al Kraken')), 'al cliente no le llegó el aviso');

// emerge, marca una zona sobre el barco y golpea: el cliente ve la zona en el mismo lugar y el barco pierde vida
k.emerge = 1; k.prox = 0;
cap.barco.x = k.x + 380; cap.barco.y = k.y; cap.barco.v = 0;
mar.clientes.get(ws).entrada = { quieto: true };
mar.paso();
ok(k.zonas.length === 1, 'el servidor no marcó la zona');
const z = k.zonas[0], zc = j.kraken && j.kraken.zonas[0];
ok(zc && zc.x === z.x && zc.y === z.y && Math.abs(zc.aviso - z.aviso) < 0.02, 'el cliente ve la zona en otro lugar');
// entre fotos el reloj de la zona sigue corriendo en el cliente
const t0 = zc ? zc.t : 0;
red.cuadro(0.1, { quieto: true });
ok(zc && zc.t > t0, 'la zona no se llena entre foto y foto');
const vida0 = cap.barco.vida;
const pasos = (seg) => Math.ceil(seg / 0.02); // mar.paso() llamado seguido avanza 0,02 s (el mínimo)
for (let i = 0; i < pasos(z.aviso + 0.3); i++) { cap.barco.x = z.x; cap.barco.y = z.y; cap.barco.v = 0; mar.paso(); }
ok(cap.barco.vida < vida0, 'el golpe no le sacó vida al barco en el servidor');
ok(Math.abs(j.jugador.vida - Math.round(cap.barco.vida)) <= 1, 'el cliente no ve la vida que le quedó');

// muere: el cliente lo ve morir y después desaparecer
k.vida = 0; k.muerte = 0.0001; k.zonas = [];
mar.paso();
ok(j.kraken && j.kraken.muerte > 0, 'el cliente no ve que se está muriendo');
for (let i = 0; i < pasos(KRAKEN.muerteDura + 0.5); i++) mar.paso();
ok(!j.kraken, 'el cliente lo sigue viendo después de que desapareció');

console.log(fallas ? `${fallas} fallas` : 'todo bien');
process.exit(fallas ? 1 : 0);
