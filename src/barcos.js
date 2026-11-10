// Cómo se arma un barco a partir de su diseño (casco, velas, cañones, munición, tripulación).
import { CASCOS, VELAS, MUNICIONES, TRIPULACIONES, COSTO_CANON, PESO_CANON, ENEMIGOS, FACCIONES } from './config.js';

export function costoDiseno(d) {
  return CASCOS[d.casco].costo + VELAS[d.velas].costo + d.canones * COSTO_CANON
    + MUNICIONES[d.municion].costo + TRIPULACIONES[d.trip].costo;
}

// Estadísticas que salen del diseño. nivelCanones suma +15 % de daño por nivel.
export function statsDe(d) {
  const c = CASCOS[d.casco], v = VELAS[d.velas], m = MUNICIONES[d.municion], t = TRIPULACIONES[d.trip];
  const nivel = d.nivelCanones || 0;
  const f = (FACCIONES[d.faccion] || {}).mods || {};
  return {
    vidaMax: Math.round(c.vida * (f.vida || 1)) + (d.refuerzo || 0),
    velMax: c.vel * v.vel * (1 - d.canones * PESO_CANON) * (f.vel || 1),
    giro: c.giro * v.giro * (f.giro || 1),
    largo: c.largo,
    ancho: c.ancho,
    maxCanones: c.maxCanones,
    tripMax: Math.round((c.tripBase * t.mult + d.canones) * (f.trip || 1)),
    tripNecesaria: c.tripBase + d.canones * 1.2,
    abordaje: t.abordaje * (f.abordaje || 1),
    dano: m.dano * (1 + 0.15 * nivel) * (f.dano || 1),
    alcance: m.alcance * (f.alcance || 1),
    oro: f.oro || 1,
    recarga: m.recarga / (f.recarga || 1),
    perdigones: m.perdigones,
    tripu: m.tripu,
    velBala: m.vel,
    radioBala: m.radio,
    mastiles: d.casco === 'balandra' ? 1 : d.casco === 'bergantin' ? 2 : 3,
  };
}

// Para mostrar barras en el astillero (0 a 1)
export function barrasDe(d) {
  const s = statsDe(d);
  const porLado = d.canones / 2;
  const fuego = porLado * s.dano * s.perdigones / s.recarga;
  return {
    Velocidad: s.velMax / 210,
    Giro: s.giro / 2.4,
    Casco: s.vidaMax / 300,
    'Potencia de fuego': fuego / 45,
    Tripulación: s.tripMax / 90,
  };
}

let siguienteId = 1;

export function crearBarco(diseno, bando, x, y, extra = {}) {
  const stats = statsDe(diseno);
  return {
    id: siguienteId++,
    diseno: { ...diseno },
    stats,
    bando, // 'jugador' | 'escolta' | 'enemigo'
    x, y, a: extra.a ?? 0, v: 0,
    velas: extra.velas ?? 1, // 0 a 3
    timon: 0,
    vida: stats.vidaMax,
    trip: stats.tripMax,
    recarga: { '-1': 0, '1': 0 },
    golpeIsla: 0,
    hundiendo: 0,
    color: extra.color || '#f4ecd6',
    colorVela: extra.colorVela || null,
    bandera: extra.bandera || '#c0392b',
    nombre: extra.nombre || 'Tu barco',
    tipo: extra.tipo || null,
    oro: extra.oro || 0,
    ia: { estado: 'pasea', destino: null, t: 0 },
  };
}

// Recalcula stats después de mejorar en el puerto sin perder el daño ni la gente.
export function rearmar(b) {
  const vidaFrac = b.vida / b.stats.vidaMax;
  b.stats = statsDe(b.diseno);
  b.vida = Math.min(b.stats.vidaMax, Math.max(1, Math.round(vidaFrac * b.stats.vidaMax)));
  b.trip = Math.min(b.trip, b.stats.tripMax);
}

function faccionAlAzar(lista) {
  const ids = lista && lista.length ? lista : Object.keys(FACCIONES);
  return ids[Math.floor(Math.random() * ids.length)];
}

export function disenoEnemigo(tipo, nivel, facciones) {
  const e = ENEMIGOS[tipo];
  return {
    faccion: faccionAlAzar(facciones), casco: e.casco, velas: e.velas, canones: e.canones, municion: e.municion, trip: e.trip,
    nivelCanones: Math.max(0, nivel - e.minNivel), refuerzo: nivel * 15,
  };
}
