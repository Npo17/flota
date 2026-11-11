// Prueba del servidor del mar con dos jugadores falsos. Uso: node scripts/probar-red.mjs [ws://localhost:8787/mar]
const URL_WS = process.argv[2] || 'ws://localhost:8787/mar';
const diseno = { faccion: 'vikingos', casco: 'bergantin', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada' };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function jugador(nombre, sala, crear) {
  const ws = new WebSocket(URL_WS + (sala ? '?sala=' + sala : ''), { headers: { Origin: 'http://localhost:5180' } });
  const p = { nombre, ws, fotos: 0, hola: null, ultima: null, bytes: 0, eventos: new Set(), puerto: null, no: null };
  ws.onopen = () => ws.send(JSON.stringify({ t: 'entrar', nombre, diseno, ...(crear ? { crear } : {}) }));
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
ok(a.hola && a.ultima && Array.isArray(a.ultima.vi), 'el mar de todos no manda el viento');
a.ws.close();

// --- salas: no existe sin crearla; con viento apagado no llega viento; la pública aparece en la lista; se llena
{
  const HTTP = URL_WS.replace('ws', 'http').replace('/mar', '');
  const cod = 'T' + Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  const nadie = jugador('Nadie', cod);
  await espera(800);
  ok(nadie.no && !nadie.hola, 'sala: se pudo entrar a una sala que no existe');
  nadie.ws.close();
  const s1 = jugador('Dueña', cod, { mapa: 'venecia', max: 2, publica: true, viento: false, abordajes: false });
  await espera(1500);
  ok(s1.hola && s1.hola.sala === cod && s1.hola.mapa === 'venecia', 'sala: no se creó: ' + (s1.no || s1.error));
  ok(s1.hola && s1.hola.reglas && s1.hola.reglas.viento === false && s1.hola.reglas.abordajes === false, 'sala: no llegaron las reglas');
  ok(s1.ultima && !s1.ultima.vi, 'sala sin viento: igual llega el viento');
  const lista = await fetch(HTTP + '/salas').then((r) => r.json()).catch(() => null);
  const mia = lista && lista.salas.find((x) => x.codigo === cod);
  ok(mia && mia.jugadores === 1 && mia.max === 2 && mia.viento === false, 'sala: no aparece bien en la lista de públicas: ' + JSON.stringify(mia));
  const s2 = jugador('Amigo', cod);
  await espera(1200);
  ok(s2.hola && s2.hola.sala === cod, 'sala: el segundo no pudo entrar: ' + s2.no);
  ok(s1.ultima.caps.length === 2, 'sala: no se ven los dos');
  const s3 = jugador('Tercero', cod);
  await espera(800);
  ok(s3.no && !s3.hola, 'sala: entró un tercero a una sala de 2');
  const lista2 = await fetch(HTTP + '/salas').then((r) => r.json()).catch(() => null);
  ok(lista2 && !lista2.salas.some((x) => x.codigo === cod), 'sala: una sala llena sigue en la lista');
  for (const p of [s1, s2, s3]) p.ws.close();
  await espera(800);
  const lista3 = await fetch(HTTP + '/salas').then((r) => r.json()).catch(() => null);
  ok(lista3 && !lista3.salas.some((x) => x.codigo === cod), 'sala: una sala vacía sigue en la lista');
  const privada = jugador('Sola', cod + 'P', { publica: false });
  await espera(1200);
  const lista4 = await fetch(HTTP + '/salas').then((r) => r.json()).catch(() => null);
  ok(privada.hola && lista4 && !lista4.salas.some((x) => x.codigo === cod + 'P'), 'sala: una sala privada aparece en la lista');
  ok(privada.ultima && Array.isArray(privada.ultima.vi), 'sala: con las reglas de siempre no llega el viento');
  privada.ws.close();
}
console.log(fallas.length ? 'FALLAS:\n- ' + fallas.join('\n- ') : 'todo bien');
process.exit(fallas.length ? 1 : 0);
