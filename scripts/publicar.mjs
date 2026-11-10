// Después de hacer push: espera a que GitHub Pages publique el último commit y vacía la caché de Cloudflare.
// Uso: node scripts/publicar.mjs   (necesita gh con sesión iniciada y CLOUDFLARE_API_TOKEN)
import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const head = sh('git rev-parse HEAD');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
  let st = '', commit = '';
  try { [st, commit] = sh('gh api repos/Npo17/flota/pages/builds/latest --jq ".status+\\" \\"+.commit"').split(' '); } catch (e) {}
  if (commit === head && st === 'built') { console.log('GitHub Pages publicó', head.slice(0, 7)); break; }
  if (commit === head && st === 'errored') { console.log('GitHub Pages falló al publicar', head.slice(0, 7)); process.exit(1); }
  if (i >= 72) { console.log('GitHub Pages no publicó en 12 min (último:', st, commit.slice(0, 7) + ')'); process.exit(1); }
  await sleep(10000);
}
await sleep(12000);
const H = { Authorization: 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN, 'Content-Type': 'application/json' };
const api = async (p, o = {}) => { const r = await (await fetch('https://api.cloudflare.com/client/v4' + p, { ...o, headers: H })).json(); if (!r.success) throw new Error(JSON.stringify(r.errors)); return r.result; };
const zona = (await api('/zones?name=ageofnavies.com'))[0];
await api(`/zones/${zona.id}/purge_cache`, { method: 'POST', body: JSON.stringify({ purge_everything: true }) });
console.log('Caché de Cloudflare vaciada');
