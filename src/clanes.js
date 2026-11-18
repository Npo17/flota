// Clanes y amigos (17/11/2026): las pantallas. Todo lo que cambia algo pasa por las funciones de la base de datos
// (supabase/migrations/20261117000000_clanes.sql), que controlan cargos y permisos; acá solo se muestra y se piden cosas.
// Los permisos de la pantalla copian los de la base de datos, para no ofrecer botones que después van a fallar.
import { t } from './idioma.js';
import { cuenta, supa } from './cuenta.js';
import { emblemaSVG, emblemaAlAzar, FORMAS, PATRONES, SIMBOLOS, PALETA } from './emblemas.js';
import { cargoSVG, CARGOS } from './insignias.js';

const limpiar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $c = (sel) => capa && capa.querySelector(sel);
const fmt = (n) => Number(n || 0).toLocaleString();
const fecha = (s) => new Date(s).toLocaleDateString();
const PUEDE = { invitar: 4, aceptar: 3, fijar: 3, editar: 2 }; // cargo máximo (1 = Almirante) para cada cosa
const nombreCargo = (c) => t(CARGOS[c] || '');

let capa = null, yo = null, miClan = null, miembros = [], pestana = 'miembros', canal = null, nombres = new Map();

function armar() {
  if (capa) return;
  capa = document.createElement('div');
  capa.id = 'pantalla-clan';
  capa.className = 'pantalla oculto';
  capa.innerHTML = '<div class="caja ancha clan"><div class="clan-cuerpo"></div><div class="botones"><button type="button" class="boton principal clan-cerrar"></button></div></div>';
  document.body.appendChild(capa);
  $c('.clan-cerrar').onclick = cerrar;
}

function cerrar() {
  capa.classList.add('oculto');
  if (canal) { supa().removeChannel(canal); canal = null; }
}

const aviso = (msg, malo) => {
  const p = $c('.clan-aviso');
  if (p) { p.textContent = msg; p.classList.toggle('malo', !!malo); }
};
async function llamar(fn, args, ok) {
  const { data, error } = await supa().rpc(fn, args);
  if (error) { aviso(t(error.message), true); return null; }
  if (ok) aviso(ok);
  return data ?? true;
}

// ---------- Entrada ----------
export async function abrirClan() {
  armar();
  $c('.clan-cerrar').textContent = t('Cerrar');
  capa.classList.remove('oculto');
  if (!cuenta.perfil) { $c('.clan-cuerpo').innerHTML = `<p>${t('Entrá con Google y elegí tu nombre de jugador para tener clan.')}</p>`; return; }
  yo = cuenta.usuario.id;
  $c('.clan-cuerpo').innerHTML = `<p class="suave">${t('Cargando…')}</p>`;
  await cargarMiClan();
  if (miClan) pintarClan(); else pintarSinClan('buscar');
}

async function cargarMiClan() {
  const sb = supa();
  const { data: m } = await sb.from('clan_miembros').select('clan_id, cargo, ingreso, oro_aportado').eq('usuario_id', yo).maybeSingle();
  miClan = null; miembros = [];
  if (!m) return;
  const [{ data: c }, { data: ms }] = await Promise.all([
    sb.from('clanes').select('*').eq('id', m.clan_id).single(),
    sb.from('clan_miembros').select('usuario_id, cargo, ingreso, oro_aportado, perfiles(nombre)').eq('clan_id', m.clan_id).order('cargo').order('ingreso'),
  ]);
  miClan = { ...c, yo: m };
  miembros = ms || [];
  for (const x of miembros) nombres.set(x.usuario_id, x.perfiles?.nombre || '?');
}

// ---------- Sin clan: buscar, crear, mis invitaciones ----------
function pintarSinClan(cual) {
  pestana = cual;
  $c('.clan-cuerpo').innerHTML = `<h2>⚓ ${t('Clanes')}</h2>
    <div class="clan-pestanas">${[['buscar', t('Buscar clan')], ['crear', t('Crear clan')], ['invitaciones', t('Mis invitaciones')]].map(([k, n]) => `<button type="button" class="chip${k === cual ? ' elegida' : ''}" data-p="${k}">${n}</button>`).join('')}</div>
    <p class="clan-aviso suave"></p><div class="clan-panel"></div>`;
  capa.querySelectorAll('.clan-pestanas .chip').forEach((b) => { b.onclick = () => pintarSinClan(b.dataset.p); });
  if (cual === 'buscar') panelBuscar();
  else if (cual === 'crear') panelEditor(null);
  else panelMisInvitaciones();
}

const filaClan = (c, extra = '') => `<div class="clan-fila">${emblemaSVG(c.emblema, 44, c.nombre)}<div class="clan-fila-txt"><b style="color:${limpiar(c.color)}">[${limpiar(c.tag)}]</b> ${limpiar(c.nombre)}<span class="suave">${t('{n} miembros', { n: c.miembros })} · ${t('{n} de oro', { n: fmt(c.oro ?? c.oro_total) })}${c.ingreso ? ' · ' + t({ abierto: 'Abierto', solicitud: 'Por solicitud', cerrado: 'Cerrado' }[c.ingreso]) : ''}</span></div>${extra}</div>`;

async function panelBuscar() {
  const panel = $c('.clan-panel');
  panel.innerHTML = `<input class="campo clan-busca" type="search" maxlength="24" placeholder="${t('Buscar por nombre o etiqueta')}"><div class="clan-lista"><p class="suave">${t('Cargando…')}</p></div>`;
  const lista = panel.querySelector('.clan-lista');
  const mostrar = (cs) => {
    lista.innerHTML = cs.length ? cs.map((c) => filaClan(c, c.ingreso === 'cerrado' ? `<span class="suave">${t('Solo por invitación')}</span>`
      : `<button type="button" class="boton" data-id="${c.id}">${t(c.ingreso === 'abierto' ? 'Unirme' : 'Pedir entrar')}</button>`)).join('') : `<p class="suave">${t('No hay clanes con ese nombre.')}</p>`;
    lista.querySelectorAll('button[data-id]').forEach((b) => {
      b.onclick = async () => {
        const r = await llamar('clan_solicitar', { p_clan: +b.dataset.id });
        if (r === 'adentro') return abrirClan();
        if (r) { b.disabled = true; b.textContent = t('Pedido enviado'); }
      };
    });
  };
  const todos = async () => {
    const { data } = await supa().from('clanes').select('id, nombre, tag, emblema, color, miembros, max_miembros, ingreso, oro_total').order('oro_total', { ascending: false }).limit(30);
    mostrar(data || []);
  };
  let espera = 0;
  panel.querySelector('.clan-busca').oninput = (e) => {
    clearTimeout(espera);
    const q = e.target.value.trim().replace(/[%_,()]/g, '');
    espera = setTimeout(async () => {
      if (!q) return todos();
      const { data } = await supa().from('clanes').select('id, nombre, tag, emblema, color, miembros, max_miembros, ingreso, oro_total').or(`nombre.ilike.%${q}%,tag.ilike.%${q}%`).limit(30);
      mostrar(data || []);
    }, 300);
  };
  todos();
}

async function panelMisInvitaciones() {
  const panel = $c('.clan-panel');
  const { data } = await supa().from('clan_invitaciones').select('id, tipo, vence, clanes(id, nombre, tag, emblema, color, miembros, oro_total)')
    .eq('usuario_id', yo).eq('estado', 'pendiente').gt('vence', new Date().toISOString());
  const invs = (data || []).filter((i) => i.tipo === 'invitacion' && i.clanes), pedidas = (data || []).filter((i) => i.tipo === 'solicitud' && i.clanes);
  panel.innerHTML = (invs.length ? invs.map((i) => filaClan(i.clanes, `<span class="clan-acciones"><button type="button" class="boton" data-si="${i.id}">${t('Aceptar')}</button><button type="button" class="boton enlace" data-no="${i.id}">${t('Rechazar')}</button></span>`)).join('')
    : `<p class="suave">${t('No tenés invitaciones.')}</p>`)
    + (pedidas.length ? `<h3>${t('Pedidos que mandaste')}</h3>` + pedidas.map((i) => filaClan(i.clanes, `<span class="suave">${t('Esperando respuesta')}</span>`)).join('') : '');
  panel.querySelectorAll('[data-si]').forEach((b) => { b.onclick = async () => { if (await llamar('clan_responder', { p_invitacion: +b.dataset.si, p_aceptar: true })) abrirClan(); }; });
  panel.querySelectorAll('[data-no]').forEach((b) => { b.onclick = async () => { if (await llamar('clan_responder', { p_invitacion: +b.dataset.no, p_aceptar: false })) panelMisInvitaciones(); }; });
}

// ---------- El editor: crear el clan o cambiarle emblema, color, descripción e ingreso ----------
function panelEditor(clan) {
  const panel = $c('.clan-panel');
  const e = clan ? { ...clan.emblema } : emblemaAlAzar();
  let color = clan ? clan.color : '#ffd166';
  const nuevo = !clan;
  const muestras = (clave) => `<div class="clan-colores" data-c="${clave}">${PALETA.map((c) => `<button type="button" class="muestra" style="background:${c}" data-v="${c}" aria-label="${c}"></button>`).join('')}<input type="color" class="libre" aria-label="${t('Otro color')}"></div>`;
  const grilla = (clave, lista, dibujo) => `<div class="clan-grilla" data-g="${clave}">${Object.keys(lista).map((k) => `<button type="button" class="opcion-mini" data-v="${k}" title="${k}">${dibujo(k)}</button>`).join('')}</div>`;
  panel.innerHTML = `<div class="clan-editor">
    <div class="clan-vista"><div class="clan-vista-grande"></div><div class="clan-vista-chica"></div>
      <button type="button" class="boton clan-azar">🎲 ${t('Al azar')}</button></div>
    <div class="clan-controles">
      ${nuevo ? `<label>${t('Nombre del clan')}<input class="campo" name="nombre" maxlength="24" autocomplete="off"></label>
      <label>${t('Etiqueta (2 a 5 letras)')}<input class="campo" name="tag" maxlength="5" autocomplete="off"></label>` : ''}
      <label>${t('Descripción')}<textarea class="campo" name="descripcion" maxlength="300" rows="2"></textarea></label>
      <label>${t('Ingreso')}<select class="campo" name="ingreso"><option value="abierto">${t('Abierto: entra cualquiera')}</option><option value="solicitud">${t('Por solicitud: aprueban los Capitanes o más')}</option><option value="cerrado">${t('Cerrado: solo por invitación')}</option></select></label>
      <h4>${t('Color del clan')}</h4>${muestras('color')}
      <h4>${t('Forma')}</h4>${grilla('forma', FORMAS, (k) => emblemaSVG({ ...e, forma: k, simbolo: 'ancla', patron: 'liso' }, 34))}
      <h4>${t('Fondo')}</h4>${muestras('fondo')}
      <h4>${t('Patrón')}</h4>${grilla('patron', PATRONES, (k) => emblemaSVG({ forma: 'rectangular', fondo: '#1d3f6e', patron: k, cPatron: '#f3ead2', simbolo: 'ancla', cSimbolo: '#1d3f6e' }, 34))}
      <h4>${t('Color del patrón')}</h4>${muestras('cPatron')}
      <h4>${t('Símbolo')}</h4>${grilla('simbolo', SIMBOLOS, (k) => emblemaSVG({ forma: 'circulo', fondo: '#173a52', patron: 'liso', simbolo: k, cSimbolo: '#ffd166' }, 34))}
      <h4>${t('Color del símbolo')}</h4>${muestras('cSimbolo')}
      <h4>${t('Borde')}</h4><div class="clan-pestanas" data-g="borde">${[0, 1, 2, 3].map((k) => `<button type="button" class="chip" data-v="${k}">${[t('Sin borde'), t('Fino'), t('Medio'), t('Grueso')][k]}</button>`).join('')}</div>
      <h4>${t('Color del borde')}</h4>${muestras('cBorde')}
    </div></div>
    <button type="button" class="boton principal clan-guardar">${nuevo ? t('Fundar el clan') : t('Guardar cambios')}</button>`;
  const f = (n) => panel.querySelector(`[name="${n}"]`);
  if (clan) { f('descripcion').value = clan.descripcion || ''; f('ingreso').value = clan.ingreso; } else f('ingreso').value = 'solicitud';
  const pintar = () => {
    const nombre = nuevo ? f('nombre').value.trim() : clan.nombre, tag = (nuevo ? f('tag').value : clan.tag).toUpperCase();
    panel.querySelector('.clan-vista-grande').innerHTML = emblemaSVG(e, 150, nombre);
    // así se va a ver en el chat y en los rankings
    panel.querySelector('.clan-vista-chica').innerHTML = `${emblemaSVG(e, 26)} <b style="color:${color}">[${limpiar(tag || 'TAG')}]</b> ${limpiar(nombre || t('Nombre del clan'))}`;
    panel.querySelectorAll('[data-g]').forEach((g) => g.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('elegida', String(e[g.dataset.g]) === b.dataset.v)));
    panel.querySelectorAll('.clan-colores').forEach((g) => { const v = g.dataset.c === 'color' ? color : e[g.dataset.c]; g.querySelectorAll('.muestra').forEach((b) => b.classList.toggle('elegida', b.dataset.v === v)); g.querySelector('.libre').value = v; });
  };
  panel.querySelectorAll('[data-g]').forEach((g) => g.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { e[g.dataset.g] = b.dataset.v; pintar(); }; }));
  panel.querySelectorAll('.clan-colores').forEach((g) => {
    const poner = (v) => { if (g.dataset.c === 'color') color = v; else e[g.dataset.c] = v; pintar(); };
    g.querySelectorAll('.muestra').forEach((b) => { b.onclick = () => poner(b.dataset.v); });
    g.querySelector('.libre').oninput = (ev) => poner(ev.target.value);
  });
  if (nuevo) { f('nombre').oninput = pintar; f('tag').oninput = pintar; }
  panel.querySelector('.clan-azar').onclick = () => { Object.assign(e, emblemaAlAzar()); pintar(); };
  panel.querySelector('.clan-guardar').onclick = async () => {
    const emblema = { forma: e.forma, fondo: e.fondo, patron: e.patron, cPatron: e.cPatron, simbolo: e.simbolo, cSimbolo: e.cSimbolo, borde: String(e.borde), cBorde: e.cBorde };
    if (nuevo) {
      const id = await llamar('clan_crear', { p_nombre: f('nombre').value, p_tag: f('tag').value, p_descripcion: f('descripcion').value, p_emblema: emblema, p_color: color, p_ingreso: f('ingreso').value });
      if (id) abrirClan();
    } else if (await llamar('clan_editar', { p_descripcion: f('descripcion').value, p_emblema: emblema, p_color: color, p_ingreso: f('ingreso').value }, t('Cambios guardados.'))) {
      await cargarMiClan(); pintarClan('ajustes');
    }
  };
  pintar();
}

// ---------- Con clan ----------
function pintarClan(cual) {
  if (cual) pestana = cual;
  const c = miClan, mio = c.yo.cargo;
  const almirante = miembros.find((m) => m.cargo === 1);
  const pest = [['miembros', t('Miembros')], ['chat', t('Chat')], ['actividad', t('Actividad')]];
  if (mio <= PUEDE.invitar) pest.splice(2, 0, ['reclutar', t('Reclutar')]);
  if (mio <= PUEDE.editar) pest.push(['ajustes', t('Ajustes')]);
  if (!pest.some(([k]) => k === pestana)) pestana = 'miembros';
  $c('.clan-cuerpo').innerHTML = `<div class="clan-cabecera" style="--clan:${limpiar(c.color)}">${emblemaSVG(c.emblema, 84, c.nombre)}
    <div><h2><span style="color:${limpiar(c.color)}">[${limpiar(c.tag)}]</span> ${limpiar(c.nombre)}</h2>
    <p class="suave">${limpiar(c.descripcion)}</p>
    <div class="clan-datos"><span>${cargoSVG(1, 16)} ${limpiar(almirante?.perfiles?.nombre || '')}</span><span>👥 ${c.miembros} / ${c.max_miembros}</span><span>💰 ${fmt(c.oro_total)}</span>
    <span>${t({ abierto: 'Abierto', solicitud: 'Por solicitud', cerrado: 'Cerrado' }[c.ingreso])}</span><span>${t('Tu cargo')}: ${cargoSVG(mio, 16)} ${nombreCargo(mio)}</span></div></div></div>
    <div class="clan-pestanas">${pest.map(([k, n]) => `<button type="button" class="chip${k === pestana ? ' elegida' : ''}" data-p="${k}">${n}</button>`).join('')}</div>
    <p class="clan-aviso suave"></p><div class="clan-panel"></div>
    <button type="button" class="boton enlace clan-salir">${t('Dejar el clan')}</button>`;
  capa.querySelectorAll('.clan-pestanas .chip').forEach((b) => { b.onclick = () => pintarClan(b.dataset.p); });
  $c('.clan-salir').onclick = async () => {
    if (!confirm(mio === 1 ? t('Sos el Almirante: si te vas, el mando pasa al de cargo más alto. ¿Dejar el clan?') : t('¿Dejar el clan?'))) return;
    if (await llamar('clan_salir', {})) abrirClan();
  };
  if (pestana !== 'chat' && canal) { supa().removeChannel(canal); canal = null; }
  ({ miembros: panelMiembros, chat: panelChat, actividad: panelActividad, reclutar: panelReclutar, ajustes: () => panelEditor(miClan) })[pestana]();
}

function panelMiembros() {
  const mio = miClan.yo.cargo;
  // qué cargos le puedo dar a alguien (los mismos controles que la base de datos)
  const opciones = (o) => (mio === 1 ? [1, 2, 3, 4, 5, 6] : mio === 2 && o.cargo >= 3 ? [3, 4, 5, 6] : []);
  const echar = (o) => o.usuario_id !== yo && (mio === 1 || (mio === 2 && o.cargo >= 3));
  const total = miembros.reduce((a, m) => a + Number(m.oro_aportado || 0), 0) || 1;
  $c('.clan-panel').innerHTML = `<div class="clan-tabla"><div class="clan-tabla-cab"><span>${t('Miembro')}</span><span>${t('Cargo')}</span><span>${t('Oro aportado')}</span><span>${t('Desde')}</span><span></span></div>`
    + [...miembros].sort((a, b) => a.cargo - b.cargo || b.oro_aportado - a.oro_aportado).map((m) => {
      const ops = m.usuario_id === yo ? [] : opciones(m);
      return `<div class="clan-tabla-fila${m.usuario_id === yo ? ' yo' : ''}"><span>${cargoSVG(m.cargo, 18)} ${limpiar(m.perfiles?.nombre)}</span>
        <span>${ops.length ? `<select class="campo mini" data-u="${m.usuario_id}">${ops.map((k) => `<option value="${k}"${k === m.cargo ? ' selected' : ''}>${nombreCargo(k)}</option>`).join('')}</select>` : nombreCargo(m.cargo)}</span>
        <span class="oro">${fmt(m.oro_aportado)} <small class="suave">${Math.round(100 * m.oro_aportado / total)} %</small></span><span class="suave">${fecha(m.ingreso)}</span>
        <span>${echar(m) ? `<button type="button" class="boton enlace" data-echar="${m.usuario_id}">${t('Expulsar')}</button>` : ''}</span></div>`;
    }).join('') + '</div>';
  capa.querySelectorAll('select[data-u]').forEach((s) => {
    s.onchange = async () => {
      if (+s.value === 1 && !confirm(t('Vas a pasarle el mando: vos quedás de Vicealmirante. ¿Seguro?'))) { s.value = miembros.find((m) => m.usuario_id === s.dataset.u).cargo; return; }
      if (await llamar('clan_cargo', { p_usuario: s.dataset.u, p_cargo: +s.value })) { await cargarMiClan(); pintarClan('miembros'); }
    };
  });
  capa.querySelectorAll('[data-echar]').forEach((b) => {
    b.onclick = async () => { if (confirm(t('¿Expulsar a este miembro?')) && await llamar('clan_expulsar', { p_usuario: b.dataset.echar })) { await cargarMiClan(); pintarClan('miembros'); } };
  });
}

// Los mensajes del sistema se guardan como clave + datos y se arman acá, en el idioma de cada uno
const SISTEMA = {
  fundado: '{nombre} fundó el clan', entro: '{nombre} se sumó al clan', salio: '{nombre} dejó el clan', expulsado: '{nombre} fue expulsado del clan',
  almirante: '{nombre} es el nuevo Almirante', ascenso: '{nombre} ascendió a {cargo}', degradado: '{nombre} pasó a {cargo}',
};
const textoSistema = (m) => {
  const d = m.datos || {};
  const clave = { fundado: t('{nombre} fundó el clan', d), entro: t('{nombre} se sumó al clan', d), salio: t('{nombre} dejó el clan', d), expulsado: t('{nombre} fue expulsado del clan', d),
    almirante: t('{nombre} es el nuevo Almirante', d), ascenso: t('{nombre} ascendió a {cargo}', { ...d, cargo: nombreCargo(d.cargo) }), degradado: t('{nombre} pasó a {cargo}', { ...d, cargo: nombreCargo(d.cargo) }) }[m.texto];
  return clave || SISTEMA[m.texto] || m.texto;
};

async function nombresDe(ids) {
  const faltan = [...new Set(ids)].filter((id) => id && !nombres.has(id));
  if (!faltan.length) return;
  const { data } = await supa().from('perfiles').select('id, nombre').in('id', faltan);
  for (const p of data || []) nombres.set(p.id, p.nombre);
}

async function panelChat() {
  const panel = $c('.clan-panel');
  const mio = miClan.yo.cargo, cargos = new Map(miembros.map((m) => [m.usuario_id, m.cargo]));
  panel.innerHTML = `<div class="chat-fijado oculto"></div><div class="chat-lista"><p class="suave">${t('Cargando…')}</p></div>
    <form class="chat-escribir"><input class="campo nombre-propio" maxlength="300" autocomplete="off" placeholder="${t('Escribí a tu clan…')}"><button class="boton">${t('Enviar')}</button></form>`;
  const lista = panel.querySelector('.chat-lista');
  let mensajes = [];
  const pintarMsj = (m) => {
    if (m.tipo === 'sistema') return `<div class="chat-msj sistema" data-id="${m.id}">⚓ ${limpiar(textoSistema(m))} <small>${new Date(m.creado).toLocaleString()}</small></div>`;
    const cg = cargos.get(m.autor);
    const acciones = (mio <= PUEDE.fijar ? `<button type="button" class="chat-bt" data-fijar="${m.id}" title="${t('Fijar')}">📌</button>` : '')
      + (mio <= PUEDE.fijar || m.autor === yo ? `<button type="button" class="chat-bt" data-borrar="${m.id}" title="${t('Borrar')}">🗑</button>` : '');
    return `<div class="chat-msj${m.autor === yo ? ' mio' : ''}" data-id="${m.id}">${cg ? cargoSVG(cg, 16) : ''}<b>${limpiar(nombres.get(m.autor) || '?')}</b>
      ${m.borrado ? `<i class="suave">${t('Mensaje borrado')}</i>` : limpiar(m.texto)} <small>${new Date(m.creado).toLocaleTimeString()}</small>${m.borrado ? '' : acciones}</div>`;
  };
  const pintarTodo = () => {
    lista.innerHTML = mensajes.length ? mensajes.map(pintarMsj).join('') : `<p class="suave">${t('Todavía no hay mensajes.')}</p>`;
    lista.scrollTop = lista.scrollHeight;
    const fijo = mensajes.find((m) => m.fijado && !m.borrado), caja = panel.querySelector('.chat-fijado');
    caja.classList.toggle('oculto', !fijo);
    if (fijo) caja.innerHTML = `📌 <b>${limpiar(nombres.get(fijo.autor) || '?')}</b>: ${limpiar(fijo.texto)}${mio <= PUEDE.fijar ? ` <button type="button" class="chat-bt" data-soltar="${fijo.id}">✕</button>` : ''}`;
    panel.querySelectorAll('[data-fijar]').forEach((b) => { b.onclick = () => llamar('clan_chat_fijar', { p_mensaje: +b.dataset.fijar, p_fijar: true }); });
    panel.querySelectorAll('[data-soltar]').forEach((b) => { b.onclick = () => llamar('clan_chat_fijar', { p_mensaje: +b.dataset.soltar, p_fijar: false }); });
    panel.querySelectorAll('[data-borrar]').forEach((b) => { b.onclick = () => { if (confirm(t('¿Borrar este mensaje?'))) llamar('clan_chat_borrar', { p_mensaje: +b.dataset.borrar }); }; });
  };
  const { data } = await supa().from('clan_chat').select('*').eq('clan_id', miClan.id).order('id', { ascending: false }).limit(80);
  mensajes = (data || []).reverse();
  // el mensaje fijado puede ser más viejo que los últimos 80
  if (!mensajes.some((m) => m.fijado)) { const { data: f } = await supa().from('clan_chat').select('*').eq('clan_id', miClan.id).eq('fijado', true).limit(1); if (f && f[0]) mensajes.unshift({ ...f[0], viejo: true }); }
  await nombresDe(mensajes.map((m) => m.autor));
  pintarTodo();
  // en tiempo real: mensajes nuevos, fijados y borrados
  if (canal) supa().removeChannel(canal);
  canal = supa().channel('clan-chat-' + miClan.id).on('postgres_changes', { event: '*', schema: 'public', table: 'clan_chat', filter: 'clan_id=eq.' + miClan.id }, async (cambio) => {
    const m = cambio.new;
    if (!m || !m.id) return;
    await nombresDe([m.autor]);
    const i = mensajes.findIndex((x) => x.id === m.id);
    if (m.fijado) mensajes.forEach((x) => { if (x.id !== m.id) x.fijado = false; });
    if (i >= 0) mensajes[i] = m; else mensajes.push(m);
    if (m.tipo === 'sistema') { await cargarMiClan(); for (const x of miembros) cargos.set(x.usuario_id, x.cargo); }
    pintarTodo();
  }).subscribe();
  const form = panel.querySelector('.chat-escribir'), campo = form.querySelector('input');
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;
    campo.value = '';
    if (!await llamar('clan_chat_enviar', { p_texto: texto })) campo.value = texto;
  };
  campo.focus();
}

async function panelActividad() {
  const { data } = await supa().from('clan_chat').select('*').eq('clan_id', miClan.id).eq('tipo', 'sistema').order('id', { ascending: false }).limit(100);
  const { data: idas } = await supa().from('clan_estadias').select('usuario_id, desde, hasta, oro_aportado').eq('clan_id', miClan.id).not('hasta', 'is', null).order('hasta', { ascending: false }).limit(50);
  await nombresDe((idas || []).map((x) => x.usuario_id));
  $c('.clan-panel').innerHTML = `<div class="clan-actividad">${(data || []).map((m) => `<div>⚓ ${limpiar(textoSistema(m))} <small class="suave">${new Date(m.creado).toLocaleString()}</small></div>`).join('') || `<p class="suave">${t('Todavía no hay actividad.')}</p>`}</div>`
    + ((idas || []).length ? `<h3>${t('Aportes de los que se fueron')}</h3>` + idas.map((x) => `<div class="fila"><span>${limpiar(nombres.get(x.usuario_id))} <small class="suave">${fecha(x.desde)} – ${fecha(x.hasta)}</small></span><b class="oro">${fmt(x.oro_aportado)}</b></div>`).join('') : '');
}

async function panelReclutar() {
  const panel = $c('.clan-panel'), mio = miClan.yo.cargo;
  panel.innerHTML = `<form class="clan-invitar"><input class="campo nombre-propio" maxlength="16" autocomplete="off" placeholder="${t('Nombre del jugador')}"><button class="boton">${t('Invitar')}</button></form>
    <h3>${t('Tus amigos')}</h3><div class="clan-amigos"><p class="suave">${t('Cargando…')}</p></div>
    ${mio <= PUEDE.aceptar ? `<h3>${t('Pedidos para entrar')}</h3><div class="clan-solicitudes"></div>` : ''}`;
  panel.querySelector('.clan-invitar').onsubmit = async (ev) => {
    ev.preventDefault();
    const inp = ev.target.querySelector('input');
    if (await llamar('clan_invitar', { p_nombre: inp.value }, t('Invitación enviada a {nombre}.', { nombre: inp.value.trim() }))) inp.value = '';
  };
  const amigos = await listaAmigos();
  const enClan = new Set(miembros.map((m) => m.usuario_id));
  const libres = amigos.filter((a) => a.estado === 'amigos' && !enClan.has(a.id));
  panel.querySelector('.clan-amigos').innerHTML = libres.length ? libres.map((a) => `<div class="fila"><span>${limpiar(a.nombre)}</span><button type="button" class="boton" data-inv="${limpiar(a.nombre)}">${t('Invitar')}</button></div>`).join('')
    : `<p class="suave">${t('No tenés amigos para invitar. Sumalos desde Amigos.')}</p>`;
  panel.querySelectorAll('[data-inv]').forEach((b) => { b.onclick = async () => { if (await llamar('clan_invitar', { p_nombre: b.dataset.inv }, t('Invitación enviada a {nombre}.', { nombre: b.dataset.inv }))) { b.disabled = true; b.textContent = t('Invitado'); } }; });
  if (mio <= PUEDE.aceptar) {
    const { data } = await supa().from('clan_invitaciones').select('id, usuario_id, creado, perfiles!clan_invitaciones_usuario_id_fkey(nombre)').eq('clan_id', miClan.id).eq('tipo', 'solicitud').eq('estado', 'pendiente').gt('vence', new Date().toISOString());
    const caja = panel.querySelector('.clan-solicitudes');
    caja.innerHTML = (data || []).length ? data.map((s) => `<div class="fila"><span>${limpiar(s.perfiles?.nombre)} <small class="suave">${fecha(s.creado)}</small></span><span class="clan-acciones"><button type="button" class="boton" data-si="${s.id}">${t('Aceptar')}</button><button type="button" class="boton enlace" data-no="${s.id}">${t('Rechazar')}</button></span></div>`).join('')
      : `<p class="suave">${t('No hay pedidos pendientes.')}</p>`;
    caja.querySelectorAll('[data-si]').forEach((b) => { b.onclick = async () => { if (await llamar('clan_responder', { p_invitacion: +b.dataset.si, p_aceptar: true })) { await cargarMiClan(); pintarClan('reclutar'); } }; });
    caja.querySelectorAll('[data-no]').forEach((b) => { b.onclick = async () => { if (await llamar('clan_responder', { p_invitacion: +b.dataset.no, p_aceptar: false })) panelReclutar(); }; });
  }
}

// ---------- Amigos ----------
async function listaAmigos() {
  const { data } = await supa().from('amigos').select('a, b, de, estado');
  const filas = (data || []).map((f) => ({ id: f.a === yo ? f.b : f.a, estado: f.estado, meLoPidio: f.estado === 'pedido' && f.de !== yo }));
  await nombresDe(filas.map((f) => f.id));
  return filas.map((f) => ({ ...f, nombre: nombres.get(f.id) || '?' })).sort((x, y) => x.nombre.localeCompare(y.nombre));
}

export async function abrirAmigos() {
  armar();
  $c('.clan-cerrar').textContent = t('Cerrar');
  capa.classList.remove('oculto');
  if (!cuenta.perfil) { $c('.clan-cuerpo').innerHTML = `<p>${t('Entrá con Google y elegí tu nombre de jugador para tener amigos.')}</p>`; return; }
  yo = cuenta.usuario.id;
  $c('.clan-cuerpo').innerHTML = `<h2>👥 ${t('Amigos')}</h2><form class="clan-invitar"><input class="campo nombre-propio" maxlength="16" autocomplete="off" placeholder="${t('Nombre del jugador')}"><button class="boton">${t('Agregar')}</button></form>
    <p class="clan-aviso suave"></p><div class="clan-panel"><p class="suave">${t('Cargando…')}</p></div>`;
  $c('.clan-invitar').onsubmit = async (ev) => {
    ev.preventDefault();
    const inp = ev.target.querySelector('input');
    const r = await llamar('amistad_pedir', { p_nombre: inp.value });
    if (r) { aviso(r === 'amigos' ? t('¡Ahora son amigos!') : t('Pedido de amistad enviado.')); inp.value = ''; pintarAmigos(); }
  };
  pintarAmigos();
}

async function pintarAmigos() {
  const todos = await listaAmigos();
  const pedidos = todos.filter((a) => a.meLoPidio), amigos = todos.filter((a) => a.estado === 'amigos'), esperando = todos.filter((a) => a.estado === 'pedido' && !a.meLoPidio);
  const panel = $c('.clan-panel');
  panel.innerHTML = (pedidos.length ? `<h3>${t('Te quieren agregar')}</h3>` + pedidos.map((a) => `<div class="fila"><span>${limpiar(a.nombre)}</span><span class="clan-acciones"><button type="button" class="boton" data-si="${a.id}">${t('Aceptar')}</button><button type="button" class="boton enlace" data-no="${a.id}">${t('Rechazar')}</button></span></div>`).join('') : '')
    + `<h3>${t('Tus amigos')} (${amigos.length})</h3>` + (amigos.length ? amigos.map((a) => `<div class="fila"><span>${limpiar(a.nombre)}</span><button type="button" class="boton enlace" data-no="${a.id}">${t('Quitar')}</button></div>`).join('') : `<p class="suave">${t('Todavía no agregaste a nadie. Escribí el nombre de un jugador arriba.')}</p>`)
    + (esperando.length ? `<h3>${t('Esperando que acepten')}</h3>` + esperando.map((a) => `<div class="fila"><span>${limpiar(a.nombre)}</span><button type="button" class="boton enlace" data-no="${a.id}">${t('Cancelar')}</button></div>`).join('') : '');
  panel.querySelectorAll('[data-si]').forEach((b) => { b.onclick = async () => { if (await llamar('amistad_responder', { p_otro: b.dataset.si, p_aceptar: true })) pintarAmigos(); }; });
  panel.querySelectorAll('[data-no]').forEach((b) => { b.onclick = async () => { if (await llamar('amistad_responder', { p_otro: b.dataset.no, p_aceptar: false })) pintarAmigos(); }; });
}
