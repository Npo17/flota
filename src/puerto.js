// El puerto: qué se puede comprar y qué hace cada compra.
// Lo usan la pantalla del puerto (para mostrar) y la simulación (para cobrar y aplicar), también en el servidor.
import { MUNICIONES, VELAS, PUERTO, ESCOLTAS_MAX } from './config.js';
import { rearmar } from './barcos.js';

// Devuelve [[título del grupo, [ítems]]]. Cada ítem: id, t (título), d (descripción), costo, ok (se puede comprar),
// parcial (se paga hasta donde alcance el oro), listo (texto cuando ya no hace falta), elegida, hacer(oro).
export function catalogoPuerto(j, cap) {
  const b = cap.barco, s = b.stats, d = b.diseno;
  const escoltas = j.barcos.filter((x) => x.cap === cap && x.bando === 'escolta' && !x.hundiendo);
  const dano = Math.ceil(s.vidaMax - b.vida), faltan = s.tripMax - b.trip;
  const danoEsc = escoltas.reduce((a, e) => a + Math.ceil(e.stats.vidaMax - e.vida) + (e.stats.tripMax - e.trip) * 3, 0);
  const nivel = (d.nivelCanones || 0) + 1;

  const arreglos = [
    { id: 'casco', t: 'Reparar el casco', d: dano ? `Te faltan ${dano} puntos de casco.` : 'El casco está entero.', costo: dano * PUERTO.repararPorPunto, ok: dano > 0, parcial: true, listo: 'Casco entero',
      hacer: (oro) => { b.vida = Math.min(s.vidaMax, b.vida + Math.floor(oro / PUERTO.repararPorPunto)); } },
    { id: 'marineros', t: 'Reclutar marineros', d: `Tenés ${b.trip} de ${s.tripMax}. Más gente recarga más rápido y gana abordajes.`, costo: faltan * PUERTO.marinero, ok: faltan > 0, parcial: true, listo: 'Tripulación completa',
      hacer: (oro) => { b.trip = Math.min(s.tripMax, b.trip + Math.floor(oro / PUERTO.marinero)); } },
  ];
  if (escoltas.length) arreglos.push({ id: 'flota', t: 'Arreglar la flota', d: `Repara y llena de gente tus ${escoltas.length} barcos capturados.`, costo: danoEsc, ok: danoEsc > 0,
    hacer: () => { for (const e of escoltas) { e.vida = e.stats.vidaMax; e.trip = e.stats.tripMax; } } });

  return [
    ['Reparar y tripular', arreglos],
    ['Cañones', [
      { id: 'canones', t: 'Sumar 2 cañones', d: `Tenés ${d.canones} de ${s.maxCanones} que entran en este casco. Pegás más, pero vas un poco más lento.`, costo: PUERTO.parCanones, ok: d.canones < s.maxCanones, listo: 'Casco lleno',
        hacer: () => { d.canones += 2; } },
      { id: 'nivel', t: `Cañones nivel ${nivel}`, d: 'Cada bala hace 15 % más de daño.', costo: PUERTO.nivelCanones(nivel), ok: nivel <= 6, listo: 'Al máximo',
        hacer: () => { d.nivelCanones = nivel; } },
    ]],
    // munición y velas: se ve cuál tenés puesta
    ['Munición', Object.entries(MUNICIONES).map(([id, m]) => ({
      id: 'mun:' + id, t: m.nombre, d: m.desc, costo: PUERTO.municion[id], ok: id !== d.municion, elegida: id === d.municion, listo: 'La que usás',
      hacer: () => { d.municion = id; },
    }))],
    ['Velas', Object.entries(VELAS).map(([id, v]) => ({
      id: 'vela:' + id, t: v.nombre, d: v.desc, costo: Math.max(60, v.costo), ok: id !== d.velas, elegida: id === d.velas, listo: 'Las que usás',
      hacer: () => { d.velas = id; },
    }))],
    ['Flota', [
      { id: 'escolta', t: 'Agrandar la flota', d: `Hoy podés llevar ${cap.escoltasMax} barcos capturados (tenés ${escoltas.length}). Suma un lugar más.`, costo: PUERTO.escolta(cap.escoltasMax + 1), ok: cap.escoltasMax < ESCOLTAS_MAX, listo: 'Al máximo',
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
