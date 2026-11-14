// La identidad visual del mar, en un solo lugar: la paleta y los escenarios.
// Es la misma idea que el inicio de la app (noche, tormenta, eclipse…): azules y turquesas profundos y algo apagados
// para el agua, y naranjas y dorados cálidos reservados para las luces y los acentos (faroles, cañonazos, botín, interfaz).
// Un escenario es un conjunto de números, no código: para sumar otro alcanza con una entrada más en ESCENAS.
// Todo esto es solo dibujo: la simulación y el servidor no lo conocen.

// Acentos compartidos con la interfaz (los mismos valores están como variables al principio de estilos.css).
export const PALETA = {
  oro: '#ffd166', oroClaro: '#ffe9a8', farol: '#ffb45e', fogonazo: '#ffc873', marfil: '#f3ead2',
  vidrio: 'rgba(5, 18, 28, 0.66)', bordeOro: 'rgba(255, 233, 168, 0.3)', noche: '#05121c',
};

// Colores de 0 a 1. hondo / medio / bajo: el agua mar adentro, a media distancia y sobre los bajíos.
// cielo: lo que el agua refleja en las pendientes. luz: el color de la luz principal (sol, luna, corona del eclipse).
// rumbo: hacia dónde está esa luz en la pantalla (radianes, 0 = derecha, -PI/2 = arriba). brillo: fuerza de los destellos.
// oleaje: altura de las olas. espuma: cuánta espuma suelta. tinte + fuerza: velo de color sobre tierra y barcos.
// vineta: oscurecimiento de los bordes. lluvia y rayos: el clima. faroles: cuánto se notan las luces. sombras: su fuerza.
// nubes: sombras de nubes que pasan sobre el mar. niebla: bancos de bruma. aves: gaviotas (solo de día).
export const ESCENAS = {
  atardecer: { hondo: [0.035, 0.150, 0.215], medio: [0.075, 0.300, 0.370], bajo: [0.250, 0.640, 0.610], cielo: [0.560, 0.420, 0.330], luz: [1.00, 0.72, 0.42],
    rumbo: -2.55, brillo: 1.0, oleaje: 1.0, espuma: 0.55, tinte: [1.00, 0.62, 0.30], fuerza: 0.10, vineta: 0.34, lluvia: 0, rayos: 0, faroles: 1.0, sombras: 0.30, nubes: 0.55, niebla: 0.10, aves: 1 },
  manana: { hondo: [0.050, 0.235, 0.330], medio: [0.105, 0.400, 0.490], bajo: [0.330, 0.740, 0.700], cielo: [0.640, 0.760, 0.860], luz: [1.00, 0.95, 0.84],
    rumbo: -0.70, brillo: 0.85, oleaje: 0.9, espuma: 0.5, tinte: [1.00, 0.96, 0.86], fuerza: 0.04, vineta: 0.24, lluvia: 0, rayos: 0, faroles: 0.3, sombras: 0.26, nubes: 0.5, niebla: 0, aves: 1 },
  noche: { hondo: [0.012, 0.055, 0.105], medio: [0.030, 0.135, 0.205], bajo: [0.085, 0.330, 0.380], cielo: [0.090, 0.150, 0.270], luz: [0.74, 0.84, 1.00],
    rumbo: -1.20, brillo: 0.9, oleaje: 0.95, espuma: 0.42, tinte: [0.035, 0.075, 0.170], fuerza: 0.50, vineta: 0.50, lluvia: 0, rayos: 0, faroles: 3.5, sombras: 0.22, nubes: 0.3, niebla: 0.30, aves: 0 },
  tormenta: { hondo: [0.035, 0.085, 0.110], medio: [0.075, 0.170, 0.200], bajo: [0.170, 0.360, 0.370], cielo: [0.240, 0.270, 0.300], luz: [0.72, 0.78, 0.84],
    rumbo: -2.2, brillo: 0.25, oleaje: 1.7, espuma: 1.0, tinte: [0.090, 0.115, 0.150], fuerza: 0.38, vineta: 0.46, lluvia: 1, rayos: 1, faroles: 2.2, sombras: 0.10, nubes: 0.1, niebla: 0.42, aves: 0 },
  eclipse: { hondo: [0.040, 0.068, 0.118], medio: [0.095, 0.150, 0.215], bajo: [0.170, 0.330, 0.370], cielo: [0.360, 0.180, 0.130], luz: [1.00, 0.58, 0.32],
    rumbo: -1.35, brillo: 0.6, oleaje: 0.9, espuma: 0.42, tinte: [0.110, 0.055, 0.105], fuerza: 0.38, vineta: 0.48, lluvia: 0, rayos: 0, faroles: 2.5, sombras: 0.20, nubes: 0.25, niebla: 0.32, aves: 0 },
  kraken: { hondo: [0.030, 0.085, 0.108], medio: [0.068, 0.170, 0.196], bajo: [0.150, 0.350, 0.350], cielo: [0.190, 0.240, 0.270], luz: [0.70, 0.82, 0.84],
    rumbo: -2.2, brillo: 0.2, oleaje: 1.9, espuma: 1.1, tinte: [0.075, 0.115, 0.150], fuerza: 0.34, vineta: 0.44, lluvia: 1, rayos: 1.7, faroles: 2.4, sombras: 0.10, nubes: 0, niebla: 0.5, aves: 0 },
};
export const ESCENA_BASE = 'atardecer';

// El escenario elegido (queda guardado en 'aon-inicio'): en la app, en su menú de inicio; en la web, en Ajustes → Configuración de gráficos.
export function escenaElegida() {
  try {
    const e = JSON.parse(localStorage.getItem('aon-inicio') || '{}').escena;
    if (ESCENAS[e]) return e;
  } catch {}
  return ESCENA_BASE;
}

// Calidad de imagen: cada nivel es un conjunto de números. escala: resolución del agua. terreno: detalle del relieve de la
// tierra (0 = tierra lisa). sombras, relieve (volumen de los barcos), ambiente (nubes, niebla, gaviotas) y luces se prenden
// o apagan. Para sumar un nivel alcanza con otra fila.
export const CALIDADES = {
  baja: { escala: 0.45, terreno: 0, sombras: false, relieve: false, ambiente: false, luces: true },
  media: { escala: 0.6, terreno: 0.6, sombras: true, relieve: true, ambiente: true, luces: true },
  alta: { escala: 0.75, terreno: 0.8, sombras: true, relieve: true, ambiente: true, luces: true },
  maxima: { escala: 1, terreno: 1, sombras: true, relieve: true, ambiente: true, luces: true },
};
// Lo que elige el jugador en Ajustes y queda guardado en 'aon-graficos': calidad (una de las de arriba), res (escala de
// resolución de todo el dibujo, 0,5 a 1), fps (tope de cuadros por segundo, 0 = sin tope), calma (menos movimiento) y
// formas (amigos y enemigos con forma además de color). Cualquier otro número guardado ahí pisa al de la calidad
// (agua: false deja el mar liso, sin el agua nueva).
const BASE = { calidad: 'alta', agua: true, calma: false, formas: false, res: 1, fps: 0 };
let crudo = null, armado = null, enMemoria = null; // enMemoria: lo elegido en esta sesión, por si el navegador no deja guardar
let leido = 0;
export function graficos() {
  const ahora = typeof performance !== 'undefined' ? performance.now() : 0;
  if (armado && ahora - leido < 500) return armado;
  leido = ahora;
  let texto = '';
  try { texto = localStorage.getItem('aon-graficos') || ''; } catch {}
  if (texto === crudo && armado) return armado;
  let g = {};
  try { g = JSON.parse(texto || '{}') || {}; } catch {}
  if (enMemoria && JSON.stringify(enMemoria) !== texto) g = enMemoria;
  crudo = texto;
  armado = { ...BASE, ...(CALIDADES[g.calidad] || CALIDADES[BASE.calidad]), ...g };
  if (!CALIDADES[armado.calidad]) armado.calidad = BASE.calidad;
  return armado;
}
export function guardarGraficos(cambios) {
  let g = enMemoria ? { ...enMemoria } : {};
  if (!enMemoria) try { g = JSON.parse(localStorage.getItem('aon-graficos') || '{}') || {}; } catch {}
  if (cambios.calidad) g = { res: g.res, fps: g.fps, calma: g.calma, formas: g.formas }; // elegir una calidad borra los retoques sueltos
  Object.assign(g, cambios);
  enMemoria = g; crudo = null; leido = -1e9;
  try { localStorage.setItem('aon-graficos', JSON.stringify(g)); } catch {}
  return graficos();
}

const luma = (c) => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;
const mezcla = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const cache = new Map();

// El escenario con el agua corrida hacia el tono propio del mapa (tropical, frío, estuario marrón…), sin cambiarle la luz:
// del mapa se toma el matiz, y la claridad la sigue mandando el escenario.
export function escenaPara(nombre, tema) {
  const clave = nombre + '|' + (tema && tema.mar ? tema.mar.join() : '');
  let e = cache.get(clave);
  if (e) return e;
  const base = ESCENAS[nombre] || ESCENAS[ESCENA_BASE];
  e = { ...base, nombre };
  if (tema && tema.mar) {
    const m = tema.mar, tono = (q) => [m[q][1] / 255, m[q][2] / 255, m[q][3] / 255];
    const hacia = (c, t, k) => { const lt = Math.max(0.02, luma(t)), lc = luma(c); return mezcla(c, [t[0] * lc / lt, t[1] * lc / lt, t[2] * lc / lt], k); };
    e.hondo = hacia(base.hondo, tono(m.length - 1), 0.45);
    e.medio = hacia(base.medio, tono(Math.min(1, m.length - 1)), 0.45);
    e.bajo = hacia(base.bajo, tono(0), 0.35);
  }
  cache.set(clave, e);
  return e;
}

// Pasa de un escenario a otro de a poco (por ejemplo, cuando el Kraken trae su tormenta): k de 0 a 1.
export function entreEscenas(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const e = { ...a };
  for (const c of Object.keys(a)) {
    if (Array.isArray(a[c])) e[c] = mezcla(a[c], b[c], k);
    else if (typeof a[c] === 'number') e[c] = a[c] + (b[c] - a[c]) * k;
  }
  return e;
}
