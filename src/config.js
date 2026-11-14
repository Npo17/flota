// Piezas del astillero, mejoras del puerto y enemigos.
// Todo lo que se balancea vive acá.

export const PRESUPUESTO = 1000;

// Civilizaciones: potencias navales de la era de la vela. Cada una cambia el aspecto del barco y da una ventaja chica.
// mods multiplica: vida, vel, giro, recarga (más alto = recarga más rápido), abordaje, dano, alcance, trip (tripulación), oro (botín).
const MADERA = { casco: '#5b3518', cubierta: '#b07a44' };
export const FACCIONES = {
  espanoles: { nombre: 'Españoles', desc: 'Galeones de la flota de Indias.', bono: '+12 % de casco', mods: { vida: 1.12 },
    estilo: { forma: 'galeon', ...MADERA, franja: '#8f1d1d', vela: '#f4ecd6', patron: 'cruz', colorPatron: '#b3261e' } },
  britanicos: { nombre: 'Británicos', desc: 'Artilleros de la marina real.', bono: 'Recargan 10 % más rápido', mods: { recarga: 1.1 },
    estilo: { forma: 'galeon', casco: '#231a12', franja: '#d8a93a', cubierta: '#b98a52', vela: '#f5f1e4', patron: 'liso' } },
  franceses: { nombre: 'Franceses', desc: 'Navíos del Rey Sol, azul y oro.', bono: '+8 % de daño', mods: { dano: 1.08 },
    estilo: { forma: 'galeon', casco: '#1f2f55', franja: '#d4af37', cubierta: '#b98a52', vela: '#f7f4ea', patron: 'puntos', colorPatron: '#d4af37' } },
  portugueses: { nombre: 'Portugueses', desc: 'Carabelas que abrieron la ruta a la India.', bono: '+8 % de giro y +5 % de velocidad', mods: { giro: 1.08, vel: 1.05 },
    estilo: { forma: 'galeon', casco: '#4a2f18', franja: '#1f5f3a', cubierta: '#b88a55', vela: '#f7f3ea', patron: 'cruzRecta', colorPatron: '#c8102e', tipoVela: 'latina' } },
  holandeses: { nombre: 'Holandeses', desc: 'Mercaderes de la Compañía de las Indias.', bono: '+15 % de oro saqueado', mods: { oro: 1.15 },
    estilo: { forma: 'galeon', casco: '#3a2a1a', franja: '#e07b1a', cubierta: '#c09560', vela: '#efe6cf', patron: 'liso' } },
  suecos: { nombre: 'Suecos', desc: 'La gran potencia del Báltico.', bono: '+10 % de alcance', mods: { alcance: 1.1 },
    estilo: { forma: 'galeon', casco: '#24375f', franja: '#f2c230', cubierta: '#b98a52', vela: '#f5f1e4', patron: 'banda', colorPatron: '#f2c230' } },
  daneses: { nombre: 'Daneses', desc: 'Dueños del peaje del Sund.', bono: '+8 % de casco y +8 % en abordajes', mods: { vida: 1.08, abordaje: 1.08 },
    estilo: { forma: 'galeon', casco: '#5a1f1f', franja: '#f1ece0', cubierta: '#b07a44', vela: '#f5f1e4', patron: 'banda', colorPatron: '#c8102e' } },
  rusos: { nombre: 'Rusos', desc: 'La flota nueva del zar Pedro.', bono: '+15 % de tripulación', mods: { trip: 1.15 },
    estilo: { forma: 'galeon', casco: '#2c3a2c', franja: '#f1ece0', cubierta: '#a98050', vela: '#f7f4ea', patron: 'cruz', colorPatron: '#1f3f8a' } },
  hanseaticos: { nombre: 'Alemanes', desc: 'Cocas de la Hansa bajo el águila imperial.', bono: '+20 % de oro, −5 % de velocidad', mods: { oro: 1.2, vel: 0.95 },
    estilo: { forma: 'tortuga', casco: '#4a3320', franja: '#b3261e', cubierta: '#b58a58', vela: '#f2c230', patron: 'banda', colorPatron: '#1b1b1f' } },
  polacos: { nombre: 'Polacos', desc: 'Vencedores de Oliwa, bravos al abordaje.', bono: '+20 % en abordajes', mods: { abordaje: 1.2 },
    estilo: { forma: 'galeon', casco: '#5a2f1a', franja: '#c8102e', cubierta: '#b88555', vela: '#f7f4ea', patron: 'banda', colorPatron: '#c8102e' } },
  venecianos: { nombre: 'Venecianos', desc: 'Galeras de la Serenísima República.', bono: '+8 % de velocidad y +8 % de giro', mods: { vel: 1.08, giro: 1.08 },
    estilo: { forma: 'galera', casco: '#5a1a1a', franja: '#d4af37', cubierta: '#b88555', vela: '#f4ecd6', patron: 'rayas', colorPatron: '#c9a227', tipoVela: 'latina', remos: true } },
  otomanos: { nombre: 'Otomanos', desc: 'Galeras rápidas de vela latina y remo.', bono: '+10 % de velocidad', mods: { vel: 1.1 },
    estilo: { forma: 'galera', casco: '#5a2f1a', franja: '#1f6f5c', cubierta: '#b88555', vela: '#e9dcc0', patron: 'rayas', colorPatron: '#a3262a', tipoVela: 'latina', remos: true } },
  vikingos: { nombre: 'Vikingos', desc: 'Barcos dragón, livianos y feroces.', bono: '+25 % en abordajes y +5 % de velocidad', mods: { abordaje: 1.25, vel: 1.05 },
    estilo: { forma: 'drakkar', casco: '#4a2c14', franja: '#7a4a22', cubierta: '#9a6a3a', vela: '#f0e6cf', patron: 'rayas', colorPatron: '#b3261e', escudos: ['#b3261e', '#e0b23c', '#2d5d8a', '#2f7a4a'], dragon: '#c9a227', remos: true } },
  chinos: { nombre: 'Chinos', desc: 'Juncos de la flota del tesoro de los Ming.', bono: '+20 % de tripulación', mods: { trip: 1.2 },
    estilo: { forma: 'caja', casco: '#5a2a1a', franja: '#c8102e', cubierta: '#c49a62', vela: '#b5482a', patron: 'sables', colorPatron: '#5a1f12' } },
  japoneses: { nombre: 'Japoneses', desc: 'Naves de guerra con castillo de madera.', bono: '+15 % de giro', mods: { giro: 1.15 },
    estilo: { forma: 'caja', casco: '#2a2320', franja: '#7a1f1f', cubierta: '#c9a36a', vela: '#f7f3ea', patron: 'sol', colorPatron: '#c8102e', torre: '#d7b77e' } }, // vela con el sol rojo de los barcos del sello bermejo
  coreanos: { nombre: 'Coreanos', desc: 'Barcos tortuga con techo blindado.', bono: '+20 % de casco, −8 % de velocidad', mods: { vida: 1.2, vel: 0.92 },
    estilo: { forma: 'tortuga', casco: '#3b2a1a', franja: '#6b4a22', cubierta: '#8a6a3a', vela: '#c9925a', patron: 'sables', colorPatron: '#6b3a1a', techo: '#3f5a3a', dragon: '#d9b23c' } },
  mogoles: { nombre: 'Mogoles', desc: 'Naves de la India, cargadas de artillería.', bono: '+10 % de daño, −5 % de giro', mods: { dano: 1.1, giro: 0.95 },
    estilo: { forma: 'galera', casco: '#3f2a1a', franja: '#1f7a4a', cubierta: '#b88a55', vela: '#efe3c4', patron: 'rayas', colorPatron: '#1f7a4a', tipoVela: 'latina' } },
  omanies: { nombre: 'Omaníes', desc: 'Veleros árabes que corren con el monzón.', bono: '+12 % de velocidad, −8 % de casco', mods: { vel: 1.12, vida: 0.92 },
    estilo: { forma: 'galera', casco: '#4a3020', franja: '#c8102e', cubierta: '#c09560', vela: '#f7f3ea', patron: 'liso', tipoVela: 'latina' } },
  mexicas: { nombre: 'Mexicas', desc: 'Canoas de guerra del lago de Tenochtitlan.', bono: '+30 % en abordajes, −10 % de casco', mods: { abordaje: 1.3, vida: 0.9 },
    estilo: { forma: 'drakkar', casco: '#6b4a2a', franja: '#1fa0a0', cubierta: '#b58a58', vela: '#f0e6cf', patron: 'banda', colorPatron: '#1fa0a0', escudos: ['#1fa0a0', '#f2c230', '#c8102e'], remos: true } },
  incas: { nombre: 'Incas', desc: 'Balsas de vela de la costa del Pacífico.', bono: '+10 % de casco y +10 % de tripulación', mods: { vida: 1.1, trip: 1.1 },
    estilo: { forma: 'caja', casco: '#9a7a44', franja: '#c9a85a', cubierta: '#dcc27e', vela: '#f2ead0', patron: 'sol', colorPatron: '#e0a82e' } },
};

// Las civilizaciones que están en el juego son las 12 que tienen sus barcos terminados. Las otras 8 quedan guardadas para
// más adelante (por ejemplo como contenido adicional): siguen definidas arriba, con su bandera y su dibujo, pero no se pueden
// elegir, no aparecen en las listas y no salen como barcos del mar. Para devolver una al juego alcanza con sacarla de acá.
export const FUERA_DE_JUEGO = ['daneses', 'rusos', 'polacos', 'coreanos', 'mogoles', 'omanies', 'mexicas', 'incas'];
for (const id of FUERA_DE_JUEGO) if (FACCIONES[id]) FACCIONES[id].dlc = true;
export const enJuego = (id) => !!FACCIONES[id] && !FACCIONES[id].dlc;
export const FACCIONES_JUEGO = Object.fromEntries(Object.entries(FACCIONES).filter(([, f]) => !f.dlc)); // lo que se muestra y se elige

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
  elite: { nombre: 'Veteranos de élite', desc: 'Lobos de mar curtidos en mil combates. Temibles al abordaje.', costo: 260, mult: 2.1, abordaje: 1.5 },
};

// Precios del puerto
export const PUERTO = {
  repararPorPunto: 1,
  marinero: 8,
  parCanones: 80,
  nivelCanones: (n) => 180 * n, // n = nivel que se compra
  escolta: (n) => 150 * n, // n = cantidad de lugares que vas a tener
  municion: { redonda: 60, metralla: 160, pesada: 220 },
  refuerzo: (n) => 140 * n, puntosRefuerzo: 45, nivelesRefuerzo: 10, nivelesCanones: 10, // hasta nivel 10 desde el 14/11/2026 (eran 6): partidas más largas // reforzar el casco: n = nivel que se compra
  cambioCasco: (diferencia) => Math.round(diferencia * 2.5), // pasar a un casco más grande: la diferencia de precio del astillero, por 2,5
};

// El Kraken (15/11/2026): la maldición del tesoro. Todo lo que se ajusta del jefe está acá, para tocar el balance sin tocar la lógica.
// Los daños de la zona son fracción de la vida máxima del barco golpeado (con un mínimo), así pega fuerte también a un galeón reforzado.
export const KRAKEN = {
  marcas: 3,              // galeones del tesoro que un capitán tiene que capturar o hundir para despertarlo (con uno menos, se le avisa)
  vida: 12000,            // con un solo capitán en el mar…
  porJugador: 0.6,        // …y un 60 % más por cada capitán extra
  emerger: 5,             // segundos que tarda en salir del agua (no pega ni recibe daño hasta casi terminar)
  cuerpo: 115,            // radio del cuerpo: los barcos no lo atraviesan y las balas le pegan ahí
  distancia: 380,         // a qué distancia se queda del barco que persigue
  vel: 60,                // velocidad con la que se acerca
  alcance: 650,           // hasta dónde llegan sus tentáculos para marcar una zona
  radio: 90,              // radio de la zona marcada
  nucleo: 0.45,           // parte del radio donde el golpe saca el daño alto
  aviso: 1.3,             // segundos que la zona se va llenando antes del golpe…
  extraBergantin: 0.15,   // …un poco más para los barcos medianos…
  extraGaleon: 0.45,      // …y bastante más para los galeones, que giran lento
  danoCentro: 0.22, danoBorde: 0.11, danoMin: 45, // fracción de la vida máxima del barco (el borde saca la mitad); nunca menos que danoMin
  queda: 0.9,             // segundos que el tentáculo queda atravesado después del golpe, como obstáculo
  cada: [3.5, 5.5],       // segundos entre una zona y la siguiente
  primerAtaque: 2.5,      // después de emerger, cuánto espera antes de la primera zona
  zonas: 1,               // zonas a la vez…
  furia: 0.4,             // …por debajo de este resto de vida se enfurece:
  zonasFuria: 2, avisoFuria: 0.85, cadaFuria: 0.6, // dos zonas a la vez, aviso 15 % más corto y ataques más seguidos
  oro: 6000,              // el botín: queda flotando en cofres, para el que los junte
  seVa: 25,               // segundos sin ningún capitán cerca antes de hundirse y desaparecer
  olvida: 2200,           // a partir de qué distancia un capitán ya no cuenta como cerca
  muerteOro: 4,           // segundos de la animación de muerte hasta que sale el oro
  muerteDura: 5.4,        // segundos hasta que desaparece del todo
  // Más ataques, para que no sea predecible (Cristian, 13/11/2026). Cada vez que le toca atacar elige uno al azar según estos pesos.
  pesos: { zona: 3, lluvia: 2, barrido: 2, chorro: 2, agarre: 1.5, tinta: 1, mirada: 1, buceo: 1 },
  maxAtaques: 2, maxAtaquesFuria: 3, // cuántas cosas puede tener en marcha a la vez (zonas, barridos, chorros…)
  combinadoFuria: 0.45,   // enfurecido, chance de largar dos ataques distintos juntos
  lluvia: { gotas: 6, radio: 46, paso: 0.28 },              // zonas chicas en línea, círculo o espiral que se llenan una detrás de otra
  barrido: { ancho: 120, arco: 1.1, aviso: 1.6 },           // un tentáculo barre una franja en arco alrededor suyo: se esquiva yendo hacia afuera o hacia adentro
  chorro: { largo: 640, ancho: 70, aviso: 1.3, empuje: 380 }, // chorro de agua en línea recta desde la boca: pega y empuja
  agarre: { aviso: 1.1, radio: 70, dura: 6, vida: 160, dano: 0.025 }, // atrapa un barco y lo deja quieto; los aliados cortan el tentáculo a cañonazos
  tinta: { radio: 260, dura: 9 },                           // nube de tinta negra: no se ve qué hay abajo
  mirada: { dura: 8, distraer: 0.03 },                      // clava los ojos en un barco: los ataques van a ese; se corta con tinta o pegándole entre los demás
  buceo: { dura: 4.5, radio: 380, fuerza: 120, cada: 30 },  // se sumerge, deja un remolino que arrastra al centro y sale en otro lado
};

export const ESCOLTAS_INICIALES = 2;
export const ESCOLTAS_MAX = 6;
// Si una escolta queda más lejos que esto de su jefe (trabada en una costa, perdida), aparece junto a él
export const REAGRUPE_FLOTA = 2500;

// Tipos de barcos enemigos. "nivel" sube a medida que te alejás del puerto.
export const ENEMIGOS = {
  mercante: { nombre: 'Mercante', casco: 'balandra', velas: 'latinas', canones: 2, municion: 'redonda', trip: 'moderada', conducta: 'huye', oro: [80, 150], color: '#d9c48a', minNivel: 0 },
  balandro: { nombre: 'Balandro pirata', casco: 'balandra', velas: 'cuadras', canones: 4, municion: 'redonda', trip: 'moderada', conducta: 'ataca', oro: [60, 110], color: '#3b3b3b', minNivel: 0 },
  corsario: { nombre: 'Corsario', casco: 'bergantin', velas: 'latinas', canones: 8, municion: 'redonda', trip: 'curtida', conducta: 'ataca', oro: [120, 200], color: '#8a2d2d', minNivel: 1 },
  cazador: { nombre: 'Cazador', casco: 'bergantin', velas: 'mixtas', canones: 8, municion: 'metralla', trip: 'curtida', conducta: 'ataca', oro: [150, 230], color: '#2d4f8a', minNivel: 2 },
  galeonGuerra: { nombre: 'Galeón de guerra', casco: 'galeon', velas: 'cuadras', canones: 14, municion: 'pesada', trip: 'curtida', conducta: 'ataca', oro: [300, 480], color: '#5a2d7a', minNivel: 2 },
  tesoro: { nombre: 'Galeón del tesoro', casco: 'galeon', velas: 'latinas', canones: 6, municion: 'redonda', trip: 'moderada', conducta: 'huye', oro: [420, 650], color: '#c9a227', minNivel: 1 },
};

// Habilidades: el capitán elige una en el astillero y la usa con R. espera = segundos hasta poder usarla de nuevo.
export const HABILIDADES = {
  andanada: { nombre: 'Andanada doble', desc: 'Ataque: recarga al instante los dos costados.', espera: 40, dura: 0 },
  ancla: { nombre: 'Ancla de combate', desc: 'Maniobra: clavás el ancla y girás casi en el lugar durante 3 segundos.', espera: 30, dura: 3 },
  carpinteros: { nombre: 'Carpinteros', desc: 'Defensa: reparan un cuarto del casco en 6 segundos.', espera: 60, dura: 6 },
  trapo: { nombre: 'Remos y trapo', desc: 'Velocidad: durante 5 segundos vas 60 % más rápido, sople como sople el viento.', espera: 35, dura: 5 },
};

export const MUNDO = { ancho: 6400, alto: 6400 };

// Viento. "rinde" dice cuánto anda el barco según el ángulo entre su rumbo y hacia dónde sopla el viento:
// 0° = viento de popa, 45° = de aleta, 90° = de través, 135° = ciñendo, 180° = de proa. De proa se pierde como mucho un tercio:
// la primera versión quitaba más de la mitad y volver al puerto contra el viento se hacía imposible.
// Las latinas ciñen mejor, las cuadras rinden más con el viento a favor y las mixtas quedan en el medio.
export const VIENTO = {
  rinde: {
    latinas: [1.12, 1.18, 1.0, 0.9, 0.76],
    cuadras: [1.3, 1.3, 1.0, 0.8, 0.64],
    mixtas: [1.2, 1.25, 1.0, 0.86, 0.7],
  },
  rafaga: 1.3, // dentro de una ráfaga, con el viento a favor o de través
  anguloRafaga: 100, // hasta qué ángulo la ráfaga empuja
  rafagas: 14, radioRafaga: [260, 430], velRafaga: 70, // 14 desde el 13/11/2026 (eran 9): al sacar las rachas quedaban pocas brisas; cubren cerca de un séptimo del mar
  // rachas: soplos cortos que aparecen cerca de cada capitán, en cualquier dirección. Si los tomás con la proa más o menos
  // hacia donde soplan, empujan fuerte aunque el viento general esté en contra.
  racha: 1.5, duraRacha: 6, radioRacha: [170, 240], cadaRacha: [3, 6], anguloRacha: 60,
  vaiven: 0.6, // cuánto rota el viento (en radianes) alrededor de su rumbo del día
  // El viento no sopla igual en todo el mar: se curva de una zona a otra, como en un mapa del pronóstico, y esas curvas se corren despacio.
  curva: 0.85, // cuánto se aparta, como mucho, del rumbo general (en radianes)
  escala: 2 * Math.PI / 4200, // tamaño de las curvas: una vuelta completa cada 4200 de mar
  cadaCambio: [150, 240], // cada cuántos segundos el viento cambia de rumbo de golpe (un evento que se anuncia)
  giroCambio: 0.35, // a qué velocidad gira hasta el rumbo nuevo (radianes por segundo)
};
