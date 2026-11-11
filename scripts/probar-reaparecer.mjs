// Prueba, sin red, de reaparecer en línea de punta a punta: el cliente (src/red.js) contra el servidor (servidor/worker.js),
// incluido el caso en que llega una foto del barco hundido después de pedir reaparecer. Uso: node scripts/probar-reaparecer.mjs
globalThis.location = { search: '' };
const { Mar } = await import('../servidor/worker.js');
const mar = new Mar(null, null);
const pendientes = []; // lo que el cliente mandó y el servidor todavía no recibió
globalThis.WebSocket = class {
  constructor() {
    this.readyState = 1;
    const cliente = this;
    this.srv = { send: (m) => cliente.onmessage({ data: m }), close() {}, addEventListener: (tipo, fn) => { if (tipo === 'message') cliente.alServidor = fn; } };
    mar.atender(this.srv);
    setTimeout(() => this.onopen(), 0);
  }
  send(m) { pendientes.push(m); }
  close() {}
};
const { conectar } = await import('../src/red.js');
const diseno = { faccion: 'vikingos', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
let entradas = 0, cerro = null, fallas = 0;
const ok = (x, m) => { if (!x) { fallas++; console.log('FALLA:', m); } };
const red = conectar({ nombre: 'Ana', diseno, alEntrar: () => entradas++, alCerrar: (m) => { cerro = m; }, alPuerto() {} });
const j = red.partida;
const ws = [...mar.clientes.keys()][0];
const entregar = () => { while (pendientes.length) ws && [...mar.clientes.keys()].length && j && wsCliente.alServidor({ data: pendientes.shift() }); };
await new Promise((r) => setTimeout(r, 10));
const wsCliente = { alServidor: (ev) => mar.mensaje(ws, mar.clientes.get(ws), JSON.parse(ev.data)) };
entregar(); clearInterval(mar.reloj);
mar.paso();
ok(entradas === 1 && j.jugador && !j.fin, 'no entró al mar');
const barco1 = j.jugador.id;
// lo hunden
mar.clientes.get(ws).cap.fin = true;
mar.paso();
ok(j.fin, 'no se enteró de que lo hundieron');
// toca "Volver al mar" enseguida: el pedido sale, pero antes de que el servidor lo reciba llega otra foto del barco hundido
ok(red.reentrar(), 'no pudo pedir reaparecer');
mar.paso();
ok(entradas === 1, 'tomó la foto del barco hundido como el barco nuevo');
entregar();
mar.paso(); mar.paso();
ok(entradas === 2, 'no avisó que entró de nuevo: ' + entradas);
ok(!j.fin && j.jugador && j.jugador.id !== barco1 && j.jugador.vida > 0, 'no reapareció con un barco nuevo y entero');
red.cuadro(0.05, { objetivo: { x: j.jugador.x + 500, y: j.jugador.y }, velas: 3 });
ok(pendientes.some((m) => JSON.parse(m).t === 'e'), 'reaparecido, no manda lo que hace el jugador');
ok(cerro === null, 'se cerró la conexión: ' + cerro);
console.log(fallas ? fallas + ' fallas' : 'todo bien');
process.exit(fallas ? 1 : 0);
