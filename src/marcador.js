// El marcador de las guerras (18/11/2026), estilo el Clash del LoL: una franja fija arriba al centro con la bandera, la
// etiqueta y el nombre de cada bando en su color, el puntaje grande al medio y el tiempo que queda. Debajo, lo que viene
// (el galeón del tesoro y su cuenta regresiva, la mejora del que lo hundió) y en Dominio de Zonas una banderita por zona.
// Al terminar, el resultado grande en el centro. Se arma una vez y en cada cuadro solo cambian los números.
import { t } from './idioma.js';
import { emblemaSVG } from './emblemas.js';

let caja = null, firma = '', ultimaBaja = -1;
const limpiar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
const MODOS = { versus: () => t('Versus'), oro: () => t('Supremacía de Oro'), zonas: () => t('Dominio de Zonas') };
const valor = (g, id) => (g.modo === 'oro' ? Math.round(g.marcador[id]).toLocaleString() : String(Math.round(g.marcador[id] * 10) / 10));

export function pintarMarcador(j) {
  const g = j && j.guerra;
  document.body.classList.toggle('en-guerra', !!g); // los avisos grandes bajan para no taparlo
  document.body.classList.toggle('guerra-fin', !!(g && g.fin));
  if (!g) { if (caja) caja.classList.add('oculto'); return; }
  if (!caja) { caja = document.createElement('div'); caja.id = 'marcador-guerra'; document.body.appendChild(caja); }
  caja.classList.remove('oculto');
  const [A, B] = g.bandos;
  const mio = j.miBando || (j.yo && j.yo.equipo) || null;
  const f = A.nombre + A.tag + A.color + B.nombre + B.tag + B.color + g.modo + mio + t('Versus');
  if (f !== firma) { // la estructura solo cambia si cambian los bandos o el idioma
    firma = f;
    const lado = (b, der) => `<div class="mg-bando${der ? ' der' : ''}${mio === b.id ? ' mio' : ''}" style="--bando:${limpiar(b.color)}">
      ${b.emblema ? emblemaSVG(b.emblema, 38) : `<span class="mg-pastilla"></span>`}<div class="mg-nombre"><b>[${limpiar(b.tag)}]</b><span>${limpiar(b.nombre)}</span></div><div class="mg-puntos" data-b="${b.id}"></div></div>`;
    caja.innerHTML = `<div class="mg-franja">${lado(A, false)}<div class="mg-centro"><div class="mg-tiempo"></div><div class="mg-modo">${MODOS[g.modo] ? MODOS[g.modo]() : ''}</div></div>${lado(B, true)}</div>
      <div class="mg-abajo"></div><div class="mg-zonas"></div><div class="mg-fin oculto"></div>`;
  }
  caja.querySelector('[data-b="A"]').textContent = valor(g, 'A');
  caja.querySelector('[data-b="B"]').textContent = valor(g, 'B');
  const resta = g.resta != null ? g.resta : g.duracion - g.t;
  const tiempo = caja.querySelector('.mg-tiempo');
  tiempo.textContent = mmss(resta);
  tiempo.classList.toggle('ultimo', resta <= 60);
  // lo que viene: el galeón del tesoro y la mejora del que lo hundió
  const cosas = [];
  const prox = (g.galeones || []).map((x) => (typeof x === 'number' ? x : x.salio ? -1 : x.t - g.t)).filter((x) => x >= 0).sort((a, b) => a - b)[0];
  if (prox != null && prox <= 90) cosas.push(`⚓ ${t('Galeón del tesoro en {t}', { t: mmss(prox) })}`);
  for (const b of g.bandos) {
    const hasta = g.mejora[b.id], queda = g.resta != null ? hasta : hasta - j.t;
    if (queda > 0) cosas.push(`<span style="color:${limpiar(b.color)}">⚔ [${limpiar(b.tag)}] ${t('más daño')} ${mmss(queda)}</span>`);
  }
  caja.querySelector('.mg-abajo').innerHTML = cosas.join(' · ');
  // zonas: una banderita por zona, del color de su dueño
  caja.querySelector('.mg-zonas').innerHTML = g.modo === 'zonas' ? g.zonas.map((z) => {
    const b = g.bandos.find((x) => x.id === z.duena);
    return `<span class="mg-zona${z.disputa ? ' disputa' : ''}" style="--z:${b ? limpiar(b.color) : 'rgba(243,234,210,0.35)'}">${z.id}</span>`;
  }).join('') : '';
  // una baja: el número salta
  if (j.ultimaBaja && j.ultimaBaja.t !== ultimaBaja) {
    ultimaBaja = j.ultimaBaja.t;
    const el = caja.querySelector(`[data-b="${j.ultimaBaja.a}"]`);
    if (el) { el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta'); }
  }
  // el final
  const fin = caja.querySelector('.mg-fin');
  if (g.fin) {
    const gana = g.bandos.find((x) => x.id === g.fin.ganador);
    fin.classList.remove('oculto');
    fin.innerHTML = gana ? `<b style="color:${limpiar(gana.color)}">${t('¡Ganó {bando}!', { bando: limpiar(gana.nombre) })}</b><span>${valor(g, 'A')} – ${valor(g, 'B')}</span>${mio ? `<em>${t(mio === gana.id ? '¡Victoria!' : 'Derrota')}</em>` : ''}`
      : `<b>${t('¡Empate!')}</b><span>${valor(g, 'A')} – ${valor(g, 'B')}</span>`;
  } else fin.classList.add('oculto');
}
