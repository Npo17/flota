// Sella la versión en index.html para que el navegador y Cloudflare nunca mezclen archivos viejos con nuevos.
// Cada archivo del juego se pide con ?v=<huella>; al cambiar cualquier archivo cambia la huella y todo se vuelve a bajar junto.
// Uso: node scripts/version.mjs   (correrlo antes de cada commit que se vaya a publicar)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const modulos = readdirSync('src').filter((f) => f.endsWith('.js')).sort();
const h = createHash('sha1');
for (const f of [...modulos.map((m) => 'src/' + m), 'estilos.css', 'vendor/supabase.min.js']) h.update(readFileSync(f));
const v = h.digest('hex').slice(0, 8);

const mapa = { imports: Object.fromEntries(modulos.map((m) => [`/src/${m}`, `/src/${m}?v=${v}`])) };
let html = readFileSync('index.html', 'utf8');
html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
html = html.replace(/(href="estilos\.css)(\?v=\w+)?"/, `$1?v=${v}"`);
html = html.replace(/(src="vendor\/supabase\.min\.js)(\?v=\w+)?"/, `$1?v=${v}"`);
html = html.replace(/(src="src\/main\.js)(\?v=\w+)?"/, `$1?v=${v}"`);
html = html.replace('  <link rel="stylesheet"', `  <script type="importmap">${JSON.stringify(mapa)}</script>\n  <link rel="stylesheet"`);
writeFileSync('index.html', html);
console.log('versión', v);
