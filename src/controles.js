// Las teclas del juego, que el jugador puede cambiar en Ajustes → Controles. Quedan guardadas en 'aon-teclas'.
// Cada acción tiene su tecla por defecto (las de siempre). El ratón (apuntar, clic para disparar, rueda para las velas)
// no se cambia acá. ESC queda siempre para abrir y cerrar los ajustes.
export const ACCIONES = [
  { id: 'babor', nombre: 'Disparar a babor', def: 'a' },
  { id: 'estribor', nombre: 'Disparar a estribor', def: 'd' },
  { id: 'andanada', nombre: 'Andanada completa', def: ' ' },
  { id: 'habilidad', nombre: 'Habilidad', def: 'r' },
  { id: 'masVela', nombre: 'Más vela', def: 'arrowup' },
  { id: 'menosVela', nombre: 'Menos vela', def: 'arrowdown' },
  { id: 'abordar', nombre: 'Abordar', def: 'f' },
  { id: 'flota', nombre: 'Orden a la flota', def: 'q' },
  { id: 'formacion', nombre: 'Formación', def: 'w' },
  { id: 'puerto', nombre: 'Entrar al puerto', def: 'p' },
];
const RESERVADAS = ['escape', 'tab'];
// Teclas viejas que siguen andando mientras nadie las use para otra cosa (G y H eran la flota antes de Q y W)
const VIEJAS = { g: 'flota', h: 'formacion' };

let teclas = null;
function cargar() {
  if (teclas) return teclas;
  teclas = Object.fromEntries(ACCIONES.map((a) => [a.id, a.def]));
  try { Object.assign(teclas, JSON.parse(localStorage.getItem('aon-teclas') || '{}')); } catch {}
  return teclas;
}
function guardar() { try { localStorage.setItem('aon-teclas', JSON.stringify(teclas)); } catch {} }

export const teclaDe = (id) => cargar()[id];
export function accionDe(k) {
  const t = cargar();
  for (const a of ACCIONES) if (t[a.id] === k) return a.id;
  return VIEJAS[k] && !Object.values(t).includes(k) ? VIEJAS[k] : null;
}
// La tecla de fábrica de una acción (el teclado dibujado de la práctica muestra esas)
export const teclaDefecto = (id) => (ACCIONES.find((a) => a.id === id) || {}).def;

// Pone una tecla nueva. Si ya la usaba otra acción, esa otra se queda con la tecla vieja (se intercambian).
export function cambiarTecla(id, k) {
  if (RESERVADAS.includes(k)) return false;
  const t = cargar(), otra = ACCIONES.find((a) => a.id !== id && t[a.id] === k);
  if (otra) t[otra.id] = t[id];
  t[id] = k;
  guardar();
  return true;
}
export function restablecerTeclas() { teclas = Object.fromEntries(ACCIONES.map((a) => [a.id, a.def])); guardar(); }

// El nombre que se muestra de una tecla
const NOMBRES = { ' ': 'Espacio', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', enter: 'Enter', shift: 'Shift', control: 'Ctrl', alt: 'Alt', backspace: '⌫' };
export const nombreTecla = (k) => NOMBRES[k] || (k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1));
