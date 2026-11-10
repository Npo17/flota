// Idiomas del juego. En el código los textos se escriben en español y acá se buscan en el idioma elegido:
// t('Volver al mar') devuelve la traducción, o el mismo texto en español si falta.
// Las traducciones viven en textos.js y textos-historia.js (una fila por texto, una columna por idioma).
// Este archivo no toca la pantalla: lo pueden importar la simulación y el servidor sin problema.

export const IDIOMAS = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français', pl: 'Polski', it: 'Italiano', de: 'Deutsch', tr: 'Türkçe' };
export const COLUMNAS = ['es', 'en', 'pt', 'fr', 'pl', 'it', 'de', 'tr']; // orden de las columnas en cada fila de textos
const dicc = {}; // idioma -> Map(texto en español -> traducción)
export const faltantes = new Set(); // textos pedidos que no tienen traducción (para revisar desde la consola)
let idioma = 'es';

export function registrarTextos(filas) {
  for (const fila of filas) {
    for (let k = 1; k < COLUMNAS.length; k++) {
      if (!fila[k]) continue;
      (dicc[COLUMNAS[k]] || (dicc[COLUMNAS[k]] = new Map())).set(fila[0], fila[k]);
    }
  }
}

export const idiomaActual = () => idioma;

// El guardado por el jugador; si no eligió, el del navegador; si no lo tenemos, inglés
export function idiomaInicial() {
  try {
    const g = localStorage.getItem('aon-idioma');
    if (g && IDIOMAS[g]) return g;
  } catch {}
  const nav = typeof navigator !== 'undefined' ? String(navigator.language || '').slice(0, 2).toLowerCase() : 'es';
  return IDIOMAS[nav] ? nav : 'en';
}

export function elegirIdioma(id) {
  idioma = IDIOMAS[id] ? id : 'es';
  try { localStorage.setItem('aon-idioma', idioma); } catch {}
  if (typeof document !== 'undefined') document.documentElement.lang = idioma;
}

// p: datos para los huecos {así}. Los datos de texto también se traducen (nombres de barcos, mapas),
// salvo "nombre", que es el nombre que eligió un jugador.
export function t(es, p) {
  if (typeof es !== 'string') return es;
  let s = es;
  if (idioma !== 'es') {
    const tr = dicc[idioma] && dicc[idioma].get(es);
    if (tr) s = tr;
    else if (es.length > 1 && es[0] !== '<' && /[a-záéíóúñ]/i.test(es)) faltantes.add(es);
  }
  if (p) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in p ? (typeof p[k] === 'string' && k !== 'nombre' ? t(p[k]) : p[k]) : m));
  return s;
}
