# Bitácora de Age of Navies

Lo más nuevo va arriba. Cada entrada: fecha, quién (socio y su Claude), qué cambió, por qué y qué quedó pendiente.
Sirve para que el Claude del otro socio tenga el contexto al día.

## 2026-11-10 — Nicolás + Claude

**Estado: todo lo de abajo ya está publicado** en ageofnavies.com y en el servidor del mar (`mar.ageofnavies.com`), probado en vivo.

**Contexto compartido**
- El otro socio ya tiene invitación al repo con permiso de escritura.
- `CLAUDE.md` tiene una regla nueva para los dos Claudes: en cada cambio se actualizan la bitácora y `CLAUDE.md`, en el mismo commit que el código.
- Los dos socios usan gstack; si no está instalado, `CLAUDE.md` dice cómo bajarlo.
- El servidor del mar vive en la cuenta de Cloudflare de Nicolás: por ahora lo republica él.

**Idiomas y pantalla clara u oscura**
- Botón de ajustes (⚙) en la pantalla de inicio: 8 idiomas (PT, EN, ES, FR, PL, IT, DE, TR) y pantalla oscura o clara. Se guarda en el navegador; la primera vez toma el idioma del navegador (si no lo tenemos, inglés).
- Los textos se siguen escribiendo en español en el código, con `t('...')` de `src/idioma.js`. Las traducciones están en `src/textos.js` (interfaz y avisos) y `src/textos-historia.js` (civilizaciones y mapas), una fila por texto.
- Los avisos de la simulación ahora llevan plantilla y datos aparte (`aviso(cap, 'Perdiste tu {barco}', 'malo', { barco })`) para que cada jugador los vea en su idioma, también en línea. **El servidor hay que volver a publicarlo junto con el juego** (cambió el formato de los avisos).
- Los colores de `estilos.css` pasaron a variables (`--caja`, `--tarjeta`, etc.); la pantalla clara las redefine. El mar del juego no cambia.
- `node scripts/probar-textos.mjs` revisa que no falte ninguna traducción.
- Pendiente: las traducciones las hizo Claude, sin revisión de hablantes nativos (sobre todo polaco y turco). El botón de ajustes está solo en la pantalla de inicio, no durante la partida.

**Juego en línea (mar compartido)**
- `src/juego.js` se reescribió para manejar varios capitanes; el modo solo es el caso de uno. Las compras del puerto pasaron a `src/puerto.js`.
- Servidor nuevo en `servidor/` (Cloudflare Workers + Durable Object) y cliente en `src/red.js`.
- Entre jugadores: se pueden hundir y abordar; el oro de la bodega del que pierde queda flotando; el puerto es zona segura.
- Botones nuevos en la pantalla de inicio: "Jugar online" y "Jugar solo contra bots".
- Pendiente: mostrar la soga del gancho ajeno, y más de una sala si se llena.

## 2026-11-09 — Nicolás + Claude

**Contexto compartido y publicación automática**
- Se agregaron `CLAUDE.md`, esta bitácora y el hook que sella la versión en cada commit.
- La caché de Cloudflare se vacía sola al publicar (acción de GitHub).

**Resumen de todo lo anterior (primer día del proyecto)**
- Primera versión jugable: astillero con presupuesto, mar abierto, combate contra bots, abordaje, puerto, remolinos y tritones
- El barco sigue al cursor y el clic dispara los dos costados
- Age of Navies: nombre, logo, favicon y dominio ageofnavies.com
- Gancho de abordaje, flota en formación, flota del tesoro, reparar en la costa, averías que frenan, velas de combate, Caribdis y puerto más claro
- Facciones (españoles, británicos, vikingos, japoneses, coreanos, otomanos) con bonus propio y barcos más detallados por facción
- Cuenta con Google, nombre de jugador, perfil con estadísticas y tabla de mejores saqueos (Supabase)
- Remolino sin boca, dibujo más liviano (barcos como imagen guardada, mar de un color, olas agrupadas, resolución adaptable) y gancho que hay que apuntar
- Diez mapas (Indonesia, Oceanía, América del Sur, Centroamérica, América del Norte, Europa, Polo Norte, Antártida, Pearl Harbor y el clásico) con climas propios, icebergs y selector de mapa o aleatorio
- 20 mapas históricos (1400-1700) con reglas propias: banderas del lugar, comercio, guerra, piratas, arrecifes, hielo; tripulación 'Veteranos de élite'
- 20 civilizaciones con barco, ventaja y bandera propia; banderas en el palo mayor, en las etiquetas y en el astillero; cada mapa con las banderas de su lugar
- Menú de mapas con vista previa redonda y banderas de cada lugar; banderas de época redibujadas (Unión de 1606, lises, águila imperial, armas de Portugal, emblema Tokugawa, tricolor del zar)
- Sello de versión en todos los archivos y script de publicación que vacía la caché de Cloudflare
- Vaciar la caché de Cloudflare automáticamente al publicar (GitHub Actions)
- Purga de caché: usar el identificador de zona fijo (el token solo necesita permiso de purga)

**Pendiente:** ver la lista al final de `CLAUDE.md`.
