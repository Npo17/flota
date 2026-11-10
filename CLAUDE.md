# Age of Navies

Juego web de barcos de la era de la vela (1400–1700). Se juega en https://ageofnavies.com.
Lo hacen dos socios, cada uno con su Claude. Este archivo y `docs/BITACORA.md` son el contexto compartido: lo que no esté acá o en el código, el otro Claude no lo sabe.

## Antes de tocar nada

1. `git pull --rebase origin main` — el otro socio puede haber subido cambios.
2. Leer las últimas entradas de `docs/BITACORA.md`.
3. Una sola vez por compu: `git config core.hooksPath .githooks` (sella la versión sola en cada commit).
4. **Comprobar que gstack está instalado. Sin gstack no se trabaja en este repo** (ver "gstack es obligatorio" más abajo).

## Regla para el Claude de cada socio: mantener estos .md al día

Vale para los dos Claudes, en **cada cambio**, sin que el socio lo pida:

- Agregar la entrada del cambio arriba de todo en `docs/BITACORA.md` (qué cambió, por qué, qué quedó pendiente, qué hay que republicar).
- Actualizar este `CLAUDE.md` si cambió algo de lo que dice: un archivo nuevo en la tabla, una regla del juego decidida, un paso para probar o publicar, un pendiente que se resolvió o apareció.
- Commitear los `.md` **en el mismo commit** que el código, así nunca quedan atrasados.
- Si algo de este archivo ya no es cierto, corregirlo en el momento; no dejarlo para después.

Lo que no quede escrito acá, el Claude del otro socio no lo sabe.

## gstack es obligatorio

Este proyecto se trabaja con [gstack](https://github.com/garrytan/gstack), el paquete de skills y subagentes para Claude Code. Los dos socios trabajan igual, con las mismas herramientas.

**Instrucción para Claude, al empezar cada sesión:** fijate si tenés disponibles los skills de gstack (`/review`, `/qa`, `/investigate`, `/plan-ceo-review`). **Si no están, no hagas nada en este repo:** no edites archivos, no commitees, no publiques. Decile al socio que falta gstack, instalalo con el comando de abajo (necesita Git, [Bun](https://bun.sh/) y Node.js) y recién después seguí.

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

Se clona en la compu de cada socio (`~/.claude/skills/gstack`), no adentro de este repo. Si después de instalarlo los skills siguen sin aparecer, reiniciar Claude Code.

**Cómo se usa en cada cambio** (no es opcional):

| Momento | Skill |
|---|---|
| Proponer una mejora o decidir qué hacer | `/plan-ceo-review` (y `/plan-eng-review` si el cambio es grande) |
| Un bug que no se entiende | `/investigate`, antes de tocar código |
| Probar el cambio en el navegador (localhost) | `/qa` |
| Antes de commitear | `/review` sobre el diff |
| Cambios de login, base de datos o servidor | `/cso` |
| Cambios visuales | `/design-review` |

Lo que encuentren `/qa` y `/review` se arregla antes de mostrarle el cambio al socio. `/ship` y `/land-and-deploy` no reemplazan las reglas de este archivo: acá se publica solo con el OK del socio y con los pasos de "Publicar".

## Cómo se trabaja

- **Idioma:** se trabaja en español rioplatense: commits, comentarios del código y los textos del juego tal como se escriben en el código (después se traducen a 8 idiomas, ver "Idiomas y pantalla clara").
- **Roles de Claude:** dev (implementa y prueba), QA (busca bugs y los verifica en el navegador) y CEO (propone mejoras con datos reales, sin inventar números).
- **Flujo:** cada cambio se prueba primero en localhost y se muestra al socio. **No se sube nada sin su OK explícito.**
- **Al terminar un cambio:** actualizar `docs/BITACORA.md` y este archivo, como dice la regla de arriba.
- **Antes de commitear:** correr `node scripts/probar-sim.mjs` y `node scripts/probar-textos.mjs`.
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
3. GitHub Pages publica solo y una acción de GitHub vacía la caché de Cloudflare (tarda cerca de un minuto).
4. Si cambió algo de `servidor/` o de la simulación (`src/juego.js`, `src/puerto.js`, `src/mundo.js`, `src/barcos.js`, `src/config.js`, `src/mapas.js`), republicar también el servidor del mar (ver "Juego en línea"). Si no, el sitio y el servidor quedan con reglas distintas.

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
| `src/idioma.js`, `src/textos.js`, `src/textos-historia.js` | Idiomas: la función `t()` y las traducciones (una fila por texto, una columna por idioma) |
| `src/puerto.js` | Qué se compra en el puerto y qué hace cada compra (lo usan la pantalla y el servidor) |
| `src/red.js` | Juego en línea: se conecta al mar compartido y arma una partida con lo que manda el servidor |
| `servidor/` | Servidor del mar compartido (Cloudflare Workers + Durable Object). Corre la misma `juego.js` |
| `src/main.js` | Une todo: pantallas, controles y el ciclo del juego |
| `supabase/migrations/` | Tablas y funciones de la base |
| `scripts/` | `version.mjs` (sello de versión), `publicar.mjs` (publicación manual de respaldo) y las pruebas `probar-sim`, `probar-red` y `probar-textos` |

La simulación (`juego.js`) no toca la pantalla ni el teclado: recibe una entrada y avanza un paso. Mantenerlo así, porque el mismo archivo corre en el navegador (modo solo) y en el servidor (juego en línea).

## Idiomas y pantalla clara

- El juego está en 8 idiomas (ES, EN, PT, FR, PL, IT, DE, TR). En el código los textos se escriben **en español** y se muestran con `t('texto')`; los huecos van `{así}` y los datos aparte: `t('{n} oro', { n: 50 })`.
- Cada texto nuevo necesita su fila en `src/textos.js` (o `src/textos-historia.js` si es de civilizaciones o mapas) con las 7 traducciones. `node scripts/probar-textos.mjs` avisa si falta alguna.
- Los textos fijos de `index.html` llevan el atributo `data-t`.
- La simulación no traduce: manda el texto en español y los datos (`aviso(cap, 'Perdiste tu {barco}', 'malo', { barco })`) y la pantalla lo traduce. Así en línea cada jugador lo ve en su idioma.
- Los colores están en variables al principio de `estilos.css`; la pantalla clara (`data-tema="claro"`) las redefine. No escribir colores fijos en reglas nuevas.

## Juego en línea

- Hay un solo mar compartido para todos, estilo agar.io. El mapa cambia una vez por día. El modo solo sigue aparte, con el mapa que se elija.
- El servidor (`servidor/worker.js`, en `mar.ageofnavies.com`) corre `src/juego.js` con varios capitanes y manda una foto del mar 20 veces por segundo. Decide posiciones, daño y oro; el navegador solo manda a dónde apunta y qué dispara.
- `juego.js` maneja varios capitanes (`j.capitanes`); el modo solo es el caso de uno. No meterle nada de pantalla ni de teclado.
- El puerto es zona segura: ahí no se puede disparar ni recibir daño.
- En la pantalla de inicio hay dos botones: "Jugar online" (el mar compartido) y jugar solo contra bots eligiendo el mapa.
- Publicar el servidor: `cd servidor && npx wrangler deploy` (necesita `npx wrangler login` una vez). El servidor está en la cuenta de Cloudflare de Nicolás: hasta que el otro socio tenga acceso a esa cuenta, la republicación la hace él (avisarle en la bitácora con "hay que republicar el servidor").
- Probar sin navegador: `node scripts/probar-sim.mjs` (simulación) y `node scripts/probar-red.mjs` (servidor, con `npx wrangler dev` corriendo en `servidor/`). Para que el juego en la compu use ese servidor de prueba: `http://localhost:5180/?mar=local`. Sin `?mar=local`, localhost se conecta al servidor publicado.
- Después de publicar el servidor: `node scripts/probar-red.mjs wss://mar.ageofnavies.com/mar` y mirar `https://mar.ageofnavies.com/estado`.

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
- Revisión de las traducciones por hablantes nativos; botón de ajustes durante la partida.
