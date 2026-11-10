// Revisa las traducciones: que cada fila tenga los 8 idiomas, que los huecos {así} coincidan
// y que los textos que usa el juego tengan su fila. Uso: node scripts/probar-textos.mjs
import { readFileSync } from 'node:fs';
import { TEXTOS } from '../src/textos.js';
import { TEXTOS_HISTORIA } from '../src/textos-historia.js';
import { COLUMNAS } from '../src/idioma.js';
import { FACCIONES, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, ENEMIGOS } from '../src/config.js';
import { MAPAS } from '../src/mapas.js';

let errores = 0;
const mal = (m) => { errores++; console.log('✗', m); };
const filas = [...TEXTOS, ...TEXTOS_HISTORIA];
const claves = new Set();
const huecos = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

for (const f of filas) {
  if (!Array.isArray(f) || f.length !== COLUMNAS.length) { mal(`fila con ${f.length} columnas: ${String(f[0]).slice(0, 60)}`); continue; }
  if (claves.has(f[0])) mal(`fila repetida: ${f[0]}`);
  claves.add(f[0]);
  f.forEach((txt, k) => {
    if (typeof txt !== 'string' || !txt.trim()) mal(`falta ${COLUMNAS[k]}: ${f[0]}`);
    else if (huecos(txt) !== huecos(f[0])) mal(`huecos distintos en ${COLUMNAS[k]}: ${f[0]}`);
  });
}

// Textos que el juego usa
const usados = new Set();
for (const cat of [FACCIONES, CASCOS, VELAS, MUNICIONES, TRIPULACIONES, ENEMIGOS]) for (const o of Object.values(cat)) for (const k of ['nombre', 'desc', 'bono']) if (o[k]) usados.add(o[k]);
for (const m of Object.values(MAPAS)) for (const k of ['nombre', 'lugar', 'desc', 'rasgo']) usados.add(m[k]);
const html = readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/<[a-z0-9]+[^>]*\sdata-t>([^<]+)</g)) usados.add(m[1].trim());
for (const m of html.matchAll(/placeholder="([^"]+)" data-t-ph/g)) usados.add(m[1]);
// literales entre comillas simples que parecen frases para el jugador
const pareceTexto = (s) => /[a-záéíóúñ]{3}/i.test(s) && (/[áéíóúñ¡¿…]/.test(s) || /^[A-ZÁÉÍÓÚ¡¿+\-{][^_]*$/.test(s) && /[a-z]/.test(s)) && !/px|rgba|system-ui|^#|\.js$|^[A-Z][a-z]+[A-Z]|^Enter$|^Escape$|^Upgrade$|^Origin$|^Content-Type|^Access-Control|^Cache-Control|^No se pudo guardar el progreso$/.test(s);
for (const archivo of ['src/main.js', 'src/puerto.js', 'src/red.js', 'src/juego.js', 'src/dibujo.js', 'src/cuenta.js', 'src/mundo.js', 'src/barcos.js', 'servidor/worker.js']) {
  const codigo = readFileSync(archivo, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).map((l) => l.replace(/\s\/\/ .*$/, '')).join('\n');
  for (const m of codigo.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) if (pareceTexto(m[1])) usados.add(m[1]);
}
const sinTraducir = new Set(['{mapa} · {lugar}', 'Age of Navies: servidor del mar', 'Se esperaba un WebSocket', 'Origen no permitido']);
for (const u of usados) if (!claves.has(u) && !sinTraducir.has(u)) mal(`sin traducción: ${u}`);

console.log(`${filas.length} textos × ${COLUMNAS.length - 1} idiomas, ${usados.size} usados por el juego`);
if (errores) { console.log(`${errores} problemas`); process.exit(1); }
console.log('todo bien');
