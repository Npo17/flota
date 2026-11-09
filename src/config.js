// Piezas del astillero, mejoras del puerto y enemigos.
// Todo lo que se balancea vive acá.

export const PRESUPUESTO = 1000;

export const CASCOS = {
  balandra: { nombre: 'Balandra', desc: 'Liviana y rápida. Pocos cañones.', costo: 150, vida: 90, vel: 170, giro: 2.0, maxCanones: 6, largo: 58, ancho: 20, tripBase: 14 },
  bergantin: { nombre: 'Bergantín', desc: 'El equilibrio: aguanta y pega.', costo: 320, vida: 165, vel: 138, giro: 1.45, maxCanones: 10, largo: 78, ancho: 26, tripBase: 22 },
  galeon: { nombre: 'Galeón', desc: 'Una fortaleza lenta llena de cañones.', costo: 520, vida: 290, vel: 108, giro: 1.0, maxCanones: 16, largo: 104, ancho: 34, tripBase: 34 },
};

export const VELAS = {
  latinas: { nombre: 'Latinas', desc: 'Giran mejor, corren normal.', costo: 0, vel: 1.0, giro: 1.15 },
  cuadras: { nombre: 'Cuadras', desc: 'Más velocidad en recta.', costo: 140, vel: 1.2, giro: 0.95 },
  mixtas: { nombre: 'Mixtas', desc: 'Lo mejor de las dos.', costo: 230, vel: 1.15, giro: 1.15 },
};

export const COSTO_CANON = 35;
export const PESO_CANON = 0.015; // cada cañón resta 1,5 % de velocidad

export const MUNICIONES = {
  redonda: { nombre: 'Bala redonda', desc: 'Pareja y confiable.', costo: 0, dano: 10, alcance: 330, recarga: 3.0, perdigones: 1, tripu: 0.12, vel: 520, radio: 4 },
  metralla: { nombre: 'Metralla', desc: 'Lluvia de bolitas: barre la tripulación.', costo: 120, dano: 2.6, alcance: 220, recarga: 2.6, perdigones: 5, tripu: 0.22, vel: 480, radio: 2.2 },
  pesada: { nombre: 'Bala pesada', desc: 'Una bala enorme que parte cascos.', costo: 170, dano: 23, alcance: 370, recarga: 4.6, perdigones: 1, tripu: 0.15, vel: 470, radio: 6.5 },
};

export const TRIPULACIONES = {
  moderada: { nombre: 'Moderada', desc: 'Lo justo para navegar.', costo: 0, mult: 1.0, abordaje: 1.0 },
  curtida: { nombre: 'Curtida', desc: 'Más gente, recarga más rápido.', costo: 120, mult: 1.5, abordaje: 1.2 },
  sanconcha: { nombre: 'De la sanconcha', desc: 'Una banda de bestias. Ganan cualquier abordaje.', costo: 260, mult: 2.1, abordaje: 1.5 },
};

// Precios del puerto
export const PUERTO = {
  repararPorPunto: 1,
  marinero: 8,
  parCanones: 80,
  nivelCanones: (n) => 180 * n, // n = nivel que se compra
  escolta: (n) => 220 * n, // n = cantidad de lugares que vas a tener
  municion: { redonda: 60, metralla: 160, pesada: 220 },
};

export const ESCOLTAS_INICIALES = 2;
export const ESCOLTAS_MAX = 6;

// Tipos de barcos enemigos. "nivel" sube a medida que te alejás del puerto.
export const ENEMIGOS = {
  mercante: { nombre: 'Mercante', casco: 'balandra', velas: 'latinas', canones: 2, municion: 'redonda', trip: 'moderada', conducta: 'huye', oro: [35, 70], color: '#d9c48a', minNivel: 0 },
  balandro: { nombre: 'Balandro pirata', casco: 'balandra', velas: 'cuadras', canones: 4, municion: 'redonda', trip: 'moderada', conducta: 'ataca', oro: [60, 110], color: '#3b3b3b', minNivel: 0 },
  corsario: { nombre: 'Corsario', casco: 'bergantin', velas: 'latinas', canones: 8, municion: 'redonda', trip: 'curtida', conducta: 'ataca', oro: [120, 200], color: '#8a2d2d', minNivel: 1 },
  cazador: { nombre: 'Cazador', casco: 'bergantin', velas: 'mixtas', canones: 8, municion: 'metralla', trip: 'curtida', conducta: 'ataca', oro: [150, 230], color: '#2d4f8a', minNivel: 2 },
  galeonGuerra: { nombre: 'Galeón de guerra', casco: 'galeon', velas: 'cuadras', canones: 14, municion: 'pesada', trip: 'curtida', conducta: 'ataca', oro: [300, 480], color: '#5a2d7a', minNivel: 2 },
  tesoro: { nombre: 'Galeón del tesoro', casco: 'galeon', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', conducta: 'huye', oro: [420, 650], color: '#c9a227', minNivel: 1 },
};

export const MUNDO = { ancho: 6400, alto: 6400 };
