// El puerto: qué se puede comprar y qué hace cada compra.
// Lo usan la pantalla del puerto (para mostrar) y la simulación (para cobrar y aplicar), también en el servidor.
import { MUNICIONES, VELAS, CASCOS, PUERTO, ESCOLTAS_MAX } from './config.js';
import { rearmar } from './barcos.js';
import { t } from './idioma.js';

// Devuelve [[título del grupo, [ítems]]]. Cada ítem: id, t (título), d (descripción), costo, ok (se puede comprar),
// parcial (se paga hasta donde alcance el oro), listo (texto cuando ya no hace falta), elegida, hacer(oro).
export function catalogoPuerto(j, cap) {
  const b = cap.barco, s = b.stats, d = b.diseno;
  const escoltas = j.barcos.filter((x) => x.cap === cap && x.bando === 'escolta' && !x.hundiendo);
  const dano = Math.ceil(s.vidaMax - b.vida), faltan = s.tripMax - b.trip;
  const danoEsc = escoltas.reduce((a, e) => a + Math.ceil(e.stats.vidaMax - e.vida) + (e.stats.tripMax - e.trip) * 3, 0);
  const nivel = (d.nivelCanones || 0) + 1;

  const arreglos = [
    { id: 'casco', t: t('Reparar el casco'), d: dano ? t('Te faltan {n} puntos de casco.', { n: dano }) : t('El casco está entero.'), costo: dano * PUERTO.repararPorPunto, ok: dano > 0, parcial: true, listo: t('Casco entero'),
      hacer: (oro) => { b.vida = Math.min(s.vidaMax, b.vida + Math.floor(oro / PUERTO.repararPorPunto)); } },
    { id: 'marineros', t: t('Reclutar marineros'), d: t('Tenés {a} de {b}. Más gente recarga más rápido y gana abordajes.', { a: b.trip, b: s.tripMax }), costo: faltan * PUERTO.marinero, ok: faltan > 0, parcial: true, listo: t('Tripulación completa'),
      hacer: (oro) => { b.trip = Math.min(s.tripMax, b.trip + Math.floor(oro / PUERTO.marinero)); } },
  ];
  if (escoltas.length) arreglos.push({ id: 'flota', t: t('Arreglar la flota'), d: t('Repara y llena de gente tus {n} barcos capturados.', { n: escoltas.length }), costo: danoEsc, ok: danoEsc > 0,
    hacer: () => { for (const e of escoltas) { e.vida = e.stats.vidaMax; e.trip = e.stats.tripMax; } } });

  return [
    [t('Reparar y tripular'), arreglos],
    [t('Cañones'), [
      { id: 'canones', t: t('Sumar 2 cañones'), d: t('Tenés {a} de {b} que entran en este casco. Pegás más, pero vas un poco más lento.', { a: d.canones, b: s.maxCanones }), costo: PUERTO.parCanones, ok: d.canones < s.maxCanones, listo: t('Casco lleno'),
        hacer: () => { d.canones += 2; } },
      { id: 'nivel', t: t('Cañones nivel {n}', { n: nivel }), d: t('Cada bala hace 15 % más de daño.'), costo: PUERTO.nivelCanones(nivel), ok: nivel <= 6, listo: t('Al máximo'),
        hacer: () => { d.nivelCanones = nivel; } },
    ]],
    // casco: se puede pasar a uno más grande (nunca a uno más chico). El barco nuevo sale entero y conserva cañones, gente y mejoras.
    [t('Casco'), Object.entries(CASCOS).map(([id, c]) => {
      const sube = c.costo > CASCOS[d.casco].costo;
      return {
        id: 'cascoNuevo:' + id, t: t(c.nombre), d: t(c.desc), costo: sube ? PUERTO.cambioCasco(c.costo - CASCOS[d.casco].costo) : 0, ok: sube, elegida: id === d.casco,
        listo: id === d.casco ? t('El que tenés') : t('Más chico que el tuyo'),
        hacer: () => { d.casco = id; b.vida = Infinity; }, // rearmar() lo deja con el casco nuevo entero
      };
    })],
    // munición y velas: se ve cuál tenés puesta
    [t('Munición'), Object.entries(MUNICIONES).map(([id, m]) => ({
      id: 'mun:' + id, t: t(m.nombre), d: t(m.desc), costo: PUERTO.municion[id], ok: id !== d.municion, elegida: id === d.municion, listo: t('La que usás'),
      hacer: () => { d.municion = id; },
    }))],
    [t('Velas'), Object.entries(VELAS).map(([id, v]) => ({
      id: 'vela:' + id, t: t(v.nombre), d: t(v.desc), costo: Math.max(60, v.costo), ok: id !== d.velas, elegida: id === d.velas, listo: t('Las que usás'),
      hacer: () => { d.velas = id; },
    }))],
    [t('Flota'), [
      { id: 'escolta', t: t('Agrandar la flota'), d: t('Hoy podés llevar {a} barcos capturados (tenés {b}). Suma un lugar más.', { a: cap.escoltasMax, b: escoltas.length }), costo: PUERTO.escolta(cap.escoltasMax + 1), ok: cap.escoltasMax < ESCOLTAS_MAX, listo: t('Al máximo'),
        hacer: () => { cap.escoltasMax++; } },
    ]],
  ];
}

// Compra un ítem con el oro guardado en el puerto. Devuelve true si se hizo.
export function comprar(j, cap, id) {
  const it = catalogoPuerto(j, cap).flatMap(([, items]) => items).find((x) => x.id === id);
  if (!it || !it.ok) return false;
  if (it.parcial ? cap.oroPuerto <= 0 : cap.oroPuerto < it.costo) return false;
  const paga = it.parcial ? Math.min(it.costo, cap.oroPuerto) : it.costo;
  it.hacer(paga);
  cap.oroPuerto -= paga;
  rearmar(cap.barco);
  cap.barco.ver = (cap.barco.ver || 0) + 1; // el diseño cambió: en línea hay que volver a mandarlo
  return true;
}
