// Mete un jugador de prueba en el mar durante unos segundos. Uso: node scripts/jugador-falso.mjs [segundos] [ws://...]
const seg = +(process.argv[2] || 20), URL_WS = process.argv[3] || 'ws://localhost:8787/mar';
const ws = new WebSocket(URL_WS, { headers: { Origin: 'http://localhost:5180' } });
let yo = null, t = 0;
ws.onopen = () => ws.send(JSON.stringify({ t: 'entrar', nombre: 'Barbanegra', diseno: { faccion: 'britanicos', casco: 'galeon', velas: 'latinas', canones: 8, municion: 'redonda', trip: 'moderada' } }));
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.t === 's') { const b = m.b.find((x) => x[0] === m.yo.b); if (b) yo = b; } };
const reloj = setInterval(() => { t += 0.1; if (yo && ws.readyState === 1) ws.send(JSON.stringify({ t: 'e', o: [yo[1] + Math.cos(t / 3) * 400, yo[2] + 300 + Math.sin(t / 3) * 400], f: Math.random() < 0.05 ? 1 : 0 })); }, 100);
setTimeout(() => { clearInterval(reloj); ws.close(); process.exit(0); }, seg * 1000);
