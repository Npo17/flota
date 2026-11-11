// Prueba, sin red, que un capitán hundido puede volver a entrar al mismo mar por la misma conexión (reaparecer).
// Uso: node scripts/probar-reentrar.mjs
import { Mar } from '../servidor/worker.js';
const diseno = { faccion: 'vikingos', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
const mar = new Mar(null, null);
const recibidos = [];
const ws = { send: (m) => recibidos.push(JSON.parse(m)), close() {}, addEventListener() {} };
mar.atender(ws);
const c = mar.clientes.get(ws);
mar.mensaje(ws, c, { t: 'entrar', nombre: 'Ana', diseno });
clearInterval(mar.reloj);
const hola1 = recibidos.find((m) => m.t === 'hola');
let fallas = 0;
const ok = (x, m) => { if (!x) { fallas++; console.log('FALLA:', m); } };
ok(hola1 && hola1.v === 4, 'no entró o no dice la versión 4 del mundo');
mar.mensaje(ws, c, { t: 'entrar', nombre: 'Ana', diseno });
ok(recibidos.filter((m) => m.t === 'hola').length === 1, 'un capitán vivo pudo entrar dos veces');
c.cap.oroPuerto = 9999; c.cap.fin = true; // lo hundieron
mar.mensaje(ws, c, { t: 'entrar', nombre: 'Ana', diseno });
const holas = recibidos.filter((m) => m.t === 'hola');
ok(holas.length === 2 && holas[1].id !== hola1.id, 'hundido, no pudo volver a entrar');
ok(c.cap && !c.cap.fin && c.cap.oroPuerto < 9999 && c.cap.nombre === 'Ana', 'no reapareció desde cero con su nombre: ' + (c.cap && c.cap.nombre));
ok(mar.j.capitanes.length === 1, 'quedó el capitán viejo en el mar');
mar.paso();
const foto = recibidos.filter((m) => m.t === 's').pop();
ok(foto && foto.alta && foto.alta.length > 0 && foto.yo.fin === 0, 'la primera foto después de reaparecer no trae los barcos');
mar.desconectar(ws);
console.log(fallas ? fallas + ' fallas' : 'todo bien');
process.exit(fallas ? 1 : 0);
