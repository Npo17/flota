// Hilo aparte que arma las baldosas de tierra con relieve (ver src/terreno.js), para que el juego no se frene mientras tanto.
// Recibe el mapa de cada partida ({ id, mundo }) y pedidos ({ id, tanda, clave, tx, ty, rumbo, px }); devuelve la imagen ya lista.
// Guarda solo los últimos mapas: si le piden uno que ya soltó, contesta { falta } y se lo vuelven a mandar.
// Carga terreno.js con la misma versión (?v=) con la que lo abrieron, así los dos usan siempre el mismo código.
const listo = import('./terreno.js' + self.location.search);
const mapas = new Map(); // id → terreno (los más nuevos al final)

self.onmessage = async (e) => {
  const m = e.data;
  let crearTerreno;
  try { ({ crearTerreno } = await listo); } catch { self.postMessage({ fallo: true }); return; }
  if (m.mundo) {
    try { mapas.set(m.id, crearTerreno(m.mundo, { obrero: true })); } catch { self.postMessage({ fallo: true }); return; }
    while (mapas.size > 3) mapas.delete(mapas.keys().next().value);
    return;
  }
  const terreno = mapas.get(m.id);
  if (!terreno) { self.postMessage({ id: m.id, clave: m.clave, falta: true }); return; }
  let img = null, fallo = false;
  try { img = terreno.armarYa(m.tx, m.ty, m.rumbo, m.px); } catch { fallo = true; }
  self.postMessage({ id: m.id, tanda: m.tanda, clave: m.clave, tx: m.tx, ty: m.ty, img, fallo }, img ? [img] : []);
};
