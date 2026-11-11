# Bitácora de Age of Navies

Lo más nuevo va arriba. Cada entrada: fecha, quién (socio y su Claude), qué cambió, por qué y qué quedó pendiente.
Sirve para que el Claude del otro socio tenga el contexto al día.

## 2026-11-10 (propuestas de arte para seis civilizaciones más) — Cristian + Claude

**Estado: subido a la rama `propuestas-arte-barcos` (no a `main`). Nada de esto está en el juego todavía:** son propuestas para que Cristian elija.

- Carpeta nueva `propuestas/` con una galería (`http://localhost:5180/propuestas/`) que muestra **3 diseños por casco** para suecos, holandeses, alemanes, otomanos, chinos y japoneses (54 en total), al lado del dibujo genérico de hoy. Se puede cambiar el daño (4 estados), las velas, la cantidad de cañones y el fondo, ver cada barco en grande y marcar el elegido; "Copiar mi elección" arma el texto para pasarle a Claude.
- `propuestas/motor.js` es el mismo estilo de `src/arte-frances.js` y `src/arte-portugues.js`, pero armado por piezas (formas de casco, velas cuadras, latinas, de junco y cangrejas, castillos, casetas, toldos, remos, orzas). `propuestas/emblemas.js` tiene los emblemas de vela y los mascarones. Un archivo por civilización con sus 9 diseños y la referencia histórica de cada uno.
- Segunda tanda, después de la primera devolución de Cristian: holandeses sin el león tallado (se parecía al británico), bergantines alemanes nuevos (Bunte Kuh, coca de Bremen, fragata Berlin), otomanos rehechos de cero (velas latinas de color, cúpula en la popa, sin el cajón de remos), tigre y dragón tallados para los juncos chinos y proa de caja en los atakebune. Lo nuevo está en `propuestas/emblemas2.js`. Gustaron: todos los suecos, la balandra y el galeón alemanes, el Duyfken y el Brederode holandeses.
- **Tercera tanda (2026-11-11), con la devolución de Cristian.** Elegidos: suecos (galera de Gustavo Vasa, Lybska Svan, Kronan), holandeses (Statenjacht, De Zeven Provinciën), alemanes (Kraier, fragata Berlin, Adler von Lübeck), otomanos (Kalyata, Kalyon). Siguen abiertos: bergantín holandés, bergantín otomano, y todos los chinos y japoneses (rehechos; los japoneses ahora son solo barcos japoneses).
- Reglas de estilo que dejó Cristian: **nada de íconos redondos ni discos debajo del mascarón**, ni velas de proa debajo de una talla; las tallas tienen que verse como tallas (no infantiles ni de colores); sin ojos pintados en los juncos. Lo nuevo está en `propuestas/emblemas3.js`.
- La bandera de la civilización en el asta de popa se hizo en la rama `viento-y-controles` (junto con los equipos por civilización), no en esta. La galería la dibuja igual que el juego.
- **Elección de Cristian (2026-11-11, cuarta vuelta):**
  - Suecos: balandra "Galera de Gustavo Vasa · sin corona", bergantín "Lybska Svan", galeón "Kronan".
  - Holandeses: bergantín "Witte Valk", galeón "De Zeven Provinciën". Balandra pendiente: el Statenjacht va en tres versiones nuevas (sirena grande, caballo marino, halcón), porque la sirena casi no se veía.
  - Alemanes: bergantín "Berlin · águila tallada", galeón "Adler von Lübeck". Balandra pendiente: el Kraier le gustó, pero pidió otra talla (el águila roja queda para la Berlin); van tres (grifo, llave de Bremen, vaca de Hamburgo).
  - Otomanos: balandra "Kalyata", bergantín "Kadırga", galeón "Kalyon". Completos.
  - Chinos: balandra "Wugongchuan". Bergantín y galeón pendientes: los tigres y dragones le siguen pareciendo infantiles.
  - Japoneses: ninguno todavía.
- **Quinta vuelta (2026-11-12).** Cristian pidió tigres y dragones "más serios" y dijo que la sirena holandesa parecía un hombre. Esta vez se estudió primero cómo están hechos el león británico y el dragón portugués (los aprobados) y se copiaron sus reglas: dos o tres tonos de madera, contorno fino y oscuro, ojos chicos y rasgados con ceja, nada de blancos brillantes ni bigotes enrulados. Está en `propuestas/emblemas4.js` (`tigreSerio`, `dragonSerio`, `sirenaSeria`, `tajamar`). Juncos y Statenjacht usan las tallas nuevas; los japoneses quedaron más sobrios (sin borla ni medallón en la proa, cortina de guerra lisa con pocos mon, dragón del Atakemaru rehecho).
- Pendiente: con lo que elija Cristian, pasar cada civilización a su `src/arte-<civilización>.js` y sumarla al mapa `ARTE` de `src/dibujo.js`. Ojo con los remos: en la galería los de galeras y barcos japoneses están dibujados quietos; en el juego los pone y los mueve `dibujo.js`. Decidir también si `propuestas/` se sube al repo (quedaría pública en el sitio) o queda solo en la compu.

## 2026-11-10 (arte de barcos, franceses) — Cristian + Claude

**Estado: probado en localhost; commit con el OK de Cristian.** Sigue la entrada de abajo.

- Quinta civilización con arte propio: **franceses** (`src/arte-frances.js`, enganchado en el mapa `ARTE` de `src/dibujo.js`). Casco azul con franja dorada ancha, velas cuadras con flores de lis y relinga azul, sin velas latinas ni cangreja (todo el aparejo es cuadro).
- Mascarones: flor de lis (balandra), espada Joyeuse suelta, sin plataforma (bergantín) y sol radiante (galeón).
- Solo dibujo: no se tocó la simulación ni `servidor/`, no hay que republicar nada.

## 2026-11-10 (arte de barcos, españoles y portugueses) — Cristian + Claude

**Estado: probado en localhost; commit y push con el OK de Cristian.** Sigue la entrada de abajo (británicos y vikingos).

- Dos civilizaciones más con arte propio, enganchadas en el mapa `ARTE` de `src/dibujo.js`: **españoles** (`src/arte-espanol.js`) y **portugueses** (`src/arte-portugues.js`). Misma mecánica que antes: un diseño por casco, cuatro estados de daño, respeta cañones, velas abiertas y color de vela del diseño.
- Españoles: cruz de Borgoña en las velas, vela latina en el palo de popa; mascarones: venera de Santiago (balandra), cruz de Santiago (bergantín) y águila bicéfala (galeón).
- Portugueses: cruz de la Orden de Cristo en todas las velas; velas latinas en balandra y bergantín, nao con castillo de popa alto en el galeón; mascarones: esfera armilar, gallo de Barcelos y dragón alado.
- Solo dibujo: no se tocó la simulación ni `servidor/`, no hay que republicar nada.
- Pendiente: las otras 16 civilizaciones siguen con el dibujo genérico; sumar una es un archivo `src/arte-<civilización>.js` más una línea en `ARTE`.

## 2026-11-10 (arte de barcos) — Cristian + Claude

**Estado: probado en localhost, sin commitear ni publicar.** Falta el OK de Cristian, `/qa` y `/review` antes del commit.

- Barcos nuevos, dibujados en código y vistos 100 % desde arriba, para **británicos** y **vikingos**. Las otras 18 civilizaciones siguen con el dibujo de siempre.
- Archivos nuevos: `src/arte-britanico.js` y `src/arte-vikingo.js`. Cada uno trae un diseño propio por casco (balandra, bergantín, galeón). Británicos: voluta, unicornio y león de proa; franja dorada, portas de cañón y castillos en el galeón. Vikingos: voluta estilo Oseberg, dragón sin cuernos y dragón con cuernos, con escudos.
- `src/dibujo.js`: el mapa `ARTE` decide qué civilizaciones usan arte propio; `imagenBarco` lo llama en lugar del dibujo genérico. La imagen cacheada ahora distingue **4 estados de daño** (más de 75 %, 50–75 %, 25–50 %, menos de 25 % de casco): hollín, grietas, agujeros, portas reventadas, velas rasgadas, brecha en el casco y palo quebrado. La clave del cache suma el nivel de daño.
- Respetan el diseño del jugador: cañones por lado (`diseno.canones / 2`), velas abiertas (`b.velas`) y color de vela. Los remos, el farol, la bandera del bando y el humo los sigue poniendo `dibujo.js`; los remos de estas dos civilizaciones son más cortos.
- El arte se dibuja un 12 % (británicos) o 20 % (vikingos) más ancho que el casco del juego para que se vea más imponente. **No cambia las colisiones ni nada de la simulación**: no hace falta republicar el servidor.
- Pendiente / ideas: arte propio para las otras civilizaciones (el mapa `ARTE` está pensado para sumarlas de a una); si se quiere un casco realmente más ancho, hay que tocar `ancho` en `src/config.js` (simulación: republicar el servidor).

## 2026-11-10 — Nicolás + Claude

**Estado: todo lo de abajo ya está publicado** en ageofnavies.com y en el servidor del mar (`mar.ageofnavies.com`), probado en vivo.

**Contexto compartido**
- El otro socio ya tiene invitación al repo con permiso de escritura.
- `CLAUDE.md` tiene una regla nueva para los dos Claudes: en cada cambio se actualizan la bitácora y `CLAUDE.md`, en el mismo commit que el código.
- gstack es obligatorio para los dos socios: si el Claude no tiene esos skills, no toca nada hasta instalarlo. `CLAUDE.md` dice cómo bajarlo y qué skill usar en cada momento (`/qa`, `/review`, `/investigate`, etc.).
- Modo equipo de gstack activado en el repo (`.claude/settings.json` + `.claude/hooks/check-gstack.cjs`): si falta gstack, bloquea los skills y muestra cómo instalarlo. `.gitignore` deja pasar solo esos dos archivos de `.claude/`.
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
