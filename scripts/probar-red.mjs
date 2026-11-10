// Prueba del servidor del mar con dos jugadores falsos. Uso: node scripts/probar-red.mjs [ws://localhost:8787/mar]
const URL_WS = process.argv[2] || 'ws://localhost:8787/mar';
const diseno = { faccion: 'vikingos', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function jugador(nombre) {
  const ws = new WebSocket(URL_WS, { headers: { Origin: 'http://localhost:5180' } });
  const p = { nombre, ws, fotos: 0, hola: null, ultima: null, bytes: 0, eventos: new Set(), puerto: null, no: null };
  ws.onopen = () => ws.send(JSON.stringify({ t: 'entrar', nombre, diseno }));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data); p.bytes += ev.data.length;
    if (m.t === 'hola') p.hola = m; else if (m.t === 'no') p.no = m.motivo; else if (m.t === 'puerto') p.puerto = m.ok;
    else if (m.t === 's') { p.fotos++; p.ultima = m; for (const e of m.ev) p.eventos.add(e.k); }
  };
  ws.onerror = (e) => { p.error = String(e.message || e); };
  return p;
}
const a = jugador('Ana'), b = jugador('Ana');
await espera(2500);
const fallas = [];
const ok = (c, m) => { if (!c) fallas.push(m); };
ok(a.hola && b.hola, 'no llegó el saludo: ' + (a.error || b.error || a.no));
if (a.hola && b.hola) {
  ok(a.hola.nombre !== b.hola.nombre, 'dos jugadores con el mismo nombre');
  ok(a.hola.mapa === b.hola.mapa, 'mapas distintos');
  ok(a.fotos > 20, 'pocas fotos: ' + a.fotos);
  const yoA = a.ultima.yo, miBarco = a.ultima.b.find((x) => x[0] === yoA.b);
  ok(miBarco && miBarco[8] === a.hola.id, 'mi barco no figura como mío');
  ok(a.ultima.caps.length === 2, 'no ve a los 2 capitanes: ' + a.ultima.caps.length);
  // navegar
  const x0 = miBarco[1], y0 = miBarco[2];
  for (let i = 0; i < 40; i++) { a.ws.send(JSON.stringify({ t: 'e', o: [x0 + 900, y0 + 900] })); await espera(66); }
  const m2 = a.ultima.b.find((x) => x[0] === yoA.b);
  ok(Math.hypot(m2[1] - x0, m2[2] - y0) > 80, 'el barco no se movió: ' + Math.round(Math.hypot(m2[1] - x0, m2[2] - y0)));
  // disparar afuera del puerto
  for (let i = 0; i < 60; i++) { a.ws.send(JSON.stringify({ t: 'e', o: [x0 + 2500, y0 + 2500], f: i % 20 === 0 ? 1 : 0 })); await espera(66); }
  ok(a.eventos.has('b') && b.eventos.has('b'), 'no llegaron las balas a los dos: ' + [...a.eventos] + ' / ' + [...b.eventos]);
  // B sigue en el puerto: puede atracar y comprar
  b.ws.send(JSON.stringify({ t: 'puerto' })); await espera(300);
  ok(b.puerto === true, 'B no pudo atracar');
  const oro = b.ultima.yo.op;
  b.ws.send(JSON.stringify({ t: 'comprar', id: 'canones' })); await espera(300);
  ok(b.ultima.yo.op === oro - 80, 'la compra no descontó: ' + oro + ' -> ' + b.ultima.yo.op);
  // desconexión
  b.ws.close(); await espera(500);
  ok(a.ultima.caps.length === 1, 'B no desapareció al desconectarse');
  console.log(`fotos/s ≈ ${(a.fotos / 8.5).toFixed(0)}, ${(a.bytes / a.fotos / 1024).toFixed(1)} KB por foto, barcos: ${a.ultima.b.length}, mapa: ${a.hola.mapa}`);
}
a.ws.close();
console.log(fallas.length ? 'FALLAS:\n- ' + fallas.join('\n- ') : 'todo bien');
process.exit(fallas.length ? 1 : 0);
