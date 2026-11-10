# Age of Navies

Juego web de barcos de la era de la vela (1400–1700). Se juega en https://ageofnavies.com.
Lo hacen dos socios, cada uno con su Claude. Este archivo y `docs/BITACORA.md` son el contexto compartido: lo que no esté acá o en el código, el otro Claude no lo sabe.

## Antes de tocar nada

1. `git pull --rebase origin main` — el otro socio puede haber subido cambios.
2. Leer las últimas entradas de `docs/BITACORA.md`.
3. Una sola vez por compu: `git config core.hooksPath .githooks` (sella la versión sola en cada commit).

## Cómo se trabaja

- **Idioma:** todo en español rioplatense, también los textos del juego, los commits y los comentarios del código.
- **Roles de Claude:** dev (implementa y prueba), QA (busca bugs y los verifica en el navegador) y CEO (propone mejoras con datos reales, sin inventar números).
- **Flujo:** cada cambio se prueba primero en localhost y se muestra al socio. **No se sube nada sin su OK explícito.**
- **Al terminar un cambio:** agregar una entrada arriba de todo en `docs/BITACORA.md` (qué cambió, por qué, qué quedó pendiente) y commitearla junto con el código.
- **Commits:** en español, describiendo el cambio para un jugador, con la línea `Co-Authored-By` de Claude.
- **Originalidad:** es un juego propio. Sirven de referencia de género otros juegos de barcos y de estrategia, pero no se copian nombres, arte, unidades ni bonificaciones de ningún juego existente. Las civilizaciones, banderas y mapas salen de la historia real.

## Probar en la compu

```bash
python -m http.server 5180
```

Abrir http://localhost:5180. No hay paso de build: es HTML, CSS y módulos de JavaScript sin dependencias.

## Publicar

1. Commit (el hook corre `node scripts/version.mjs` y sella `?v=` en `index.html`; si no está el hook, correrlo a mano antes del commit).
2. `git push origin main`.
3. GitHub Pages publica solo y una acción de GitHub vacía la caché de Cloudflare. No hay que hacer nada más.

El sello de versión existe porque una vez el sitio quedó roto por mezclar archivos viejos (en caché) con nuevos. No sacarlo.

## Dónde está cada cosa

| Archivo | Qué tiene |
|---|---|
| `index.html`, `estilos.css` | Pantallas (diseño de flota, puerto, perfil, menú de mapas) e indicadores |
| `src/config.js` | Todo el balance: civilizaciones, cascos, velas, munición, tripulación, precios del puerto, enemigos |
| `src/mapas.js` | Los 20 mapas históricos: clima, costas y reglas de cada uno |
| `src/mundo.js` | Genera el mundo de una partida a partir del mapa (con semilla: el mismo mapa sale siempre igual) |
| `src/barcos.js` | Estadísticas de un barco según su diseño |
| `src/juego.js` | La simulación: movimiento, cañones, bots, gancho de abordaje, flota, remolinos, tritones, flota del tesoro |
| `src/dibujo.js` | Todo lo que se pinta en el canvas; los barcos se guardan como imagen para que sea fluido |
| `src/banderas.js` | Banderas históricas de cada civilización |
| `src/cuenta.js` | Login con Google, nombre de jugador y estadísticas (Supabase) |
| `src/puerto.js` | Qué se compra en el puerto y qué hace cada compra (lo usan la pantalla y el servidor) |
| `src/red.js` | Juego en línea: se conecta al mar compartido y arma una partida con lo que manda el servidor |
| `servidor/` | Servidor del mar compartido (Cloudflare Workers + Durable Object). Corre la misma `juego.js` |
| `src/main.js` | Une todo: pantallas, controles y el ciclo del juego |
| `supabase/migrations/` | Tablas y funciones de la base |
| `scripts/` | `version.mjs` (sello de versión) y `publicar.mjs` (publicación manual de respaldo) |

La simulación (`juego.js`) no toca la pantalla ni el teclado: recibe una entrada y avanza un paso. Mantenerlo así, porque es lo que va a permitir pasarla a un servidor cuando llegue el multijugador.

## Juego en línea

- Hay un solo mar compartido para todos, estilo agar.io. El mapa cambia una vez por día. El modo solo sigue aparte, con el mapa que se elija.
- El servidor (`servidor/worker.js`, en `mar.ageofnavies.com`) corre `src/juego.js` con varios capitanes y manda una foto del mar 20 veces por segundo. Decide posiciones, daño y oro; el navegador solo manda a dónde apunta y qué dispara.
- `juego.js` maneja varios capitanes (`j.capitanes`); el modo solo es el caso de uno. No meterle nada de pantalla ni de teclado.
- El puerto es zona segura: ahí no se puede disparar ni recibir daño.
- Publicar el servidor: `cd servidor && npx wrangler deploy` (necesita `npx wrangler login` una vez). Solo hace falta si cambió algo de `servidor/` o de la simulación.
- Probar sin navegador: `node scripts/probar-sim.mjs` (simulación) y `node scripts/probar-red.mjs` (servidor, con `npx wrangler dev` corriendo en `servidor/`). Para que el juego en la compu use ese servidor de prueba: `http://localhost:5180/?mar=local`.

## Reglas del juego que ya se decidieron

- El barco navega hacia el cursor; cuanto más lejos está el cursor, más velas (y recarga más lenta). El clic dispara los dos costados.
- Se pelea de costado. El gancho de abordaje (F) hay que apuntarlo y los barcos enteros se resisten.
- El oro saqueado está en riesgo hasta entrar al puerto. Los barcos capturados navegan en formación; con G atacan.
- Un barco dañado va más lento. Parado junto a una isla se repara hasta el 75 %.
- Los remolinos son solo remolinos (sin monstruo). No hay Kraken.
- Mapas y civilizaciones son de 1400 a 1700, con banderas de época (no las modernas).

## Servicios

- **Hosting:** GitHub Pages desde `main`, detrás de Cloudflare (proxy, SSL estricto, Web Analytics).
- **Base de datos:** Supabase, proyecto `age-of-navies`. La clave que aparece en `src/cuenta.js` es la pública y está bien que esté en el código. Las claves privadas nunca van al repo.
- **Login:** Google, configurado en Supabase.
- El repo es público: no escribir acá mails, claves ni datos personales.

## Pendientes conocidos

- En línea: mostrar la soga del gancho de otros jugadores; salas adicionales si se llena el mar (24 jugadores).
- Habilidades especiales (por ejemplo, el ancla para girar en el lugar).
- Sonido y controles para celular.
