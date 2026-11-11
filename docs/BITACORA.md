# Bitácora de Age of Navies

Lo más nuevo va arriba. Cada entrada: fecha, quién (socio y su Claude), qué cambió, por qué y qué quedó pendiente.
Sirve para que el Claude del otro socio tenga el contexto al día.

## 2026-11-12 (tierras de un solo cuerpo y reaparecer en el puerto) — Nicolás + Claude

**Estado: subido a `main` y publicado en la web junto con la entrada de abajo. EL SERVIDOR DEL MAR SIGUE SIN REPUBLICAR** (lo tiene que correr Nicolás: `cd servidor && npx wrangler deploy`). Hasta entonces, en línea: no hay salas (el juego avisa que la sala no existe), no hay viento ni las reglas nuevas, y las costas son las viejas; reaparecer sí funciona.

- **Tierras de un solo cuerpo.** Entre dos círculos de tierra grande que se tocaban quedaba un rincón en punta y los bots se metían ahí. `crearMundo` ahora rellena el tramo entre los dos centros con círculos de radio intermedio (no toca las aguas del puerto). Medido en los 20 mapas: las celdas de mar encajonadas entre tierras bajaron de 432 a 89. Quedan algunos rincones entre tres tierras. Los islotes de tres mapas (Gravelinas, Venecia, Nueva Zembla) cambiaron un poco de lugar, porque ahora también esquivan el relleno.
- **Reaparecer.** Al hundirte ya no volvés a armar la flota: a los 6 segundos reaparecés en el puerto con el mismo barco, desde cero. "Cambiar de flota" o ESC (dos veces) llevan al astillero. Vale para un jugador, el mar de todos y las salas.
- El servidor pasa a decir `v: 3` (mundo con relleno). Con el servidor publicado anterior, el navegador arma el mundo viejo, así que no se desfasan las costas.
- Pruebas: `probar-sim` (el relleno no cambia las tierras ni tapa el puerto), `probar-reentrar` (nuevo) y, a mano en la app, hundirse y reaparecer con las mismas reglas, y salir con ESC. La reaparición en línea se probó en el servidor sin red y el flujo del navegador con el aviso de fin simulado; no con un hundimiento real entre dos jugadores.

## 2026-11-12 (salas, reglas de la partida y gancho que vuela) — Nicolás + Claude

**Estado: subido a `main` y publicado en la web. El servidor, ver la entrada de arriba.** Probado en localhost contra `wrangler dev` (`probar-sim`, `probar-red`, `probar-textos` y a mano en el navegador).

- **Salas ("Jugar con amigos").** Botón nuevo en el astillero. Se crea una sala con el mapa elegido, de 2 a 12 jugadores, pública o privada, y con las reglas de abajo; da un código de 5 letras para pasarle a los amigos (o el enlace `?sala=CODIGO`). Las públicas aparecen en una lista para quien no tiene con quién jugar. Detalles de cómo está hecho en `CLAUDE.md`, "Juego en línea". No hay lista de amigos todavía: Google no da amigos y los de Steam llegan con la integración de Steam.
- **Reglas de la partida:** viento sí o no y abordajes sí o no. Dos botones en el astillero, debajo del mapa; valen para el modo solo y para la sala que uno crea.
- **Gancho:** vuelve a salir volando hacia el cursor, como antes de los cambios de Cristian, pero llega a 210 (antes 250). Si engancha, sigue la pelea por tripulación de Cristian tal cual. Se sacó la condición de igualar la velocidad. Cristian: lo pidió Nicolás después de jugarlo, porque arrimarse e igualar la velocidad le resultó tosco.
- **Ramas:** se borraron `viento-y-controles` y `propuestas-arte-barcos`, que ya estaban enteras en `main`. Regla nueva en `CLAUDE.md`: rama que entra a `main`, rama que se borra.
- `probar-sim` suma pruebas de reglas y del gancho en vuelo; `probar-red` suma las de salas (no existe sin crearla, sin viento no llega viento, la pública aparece en la lista, se llena, la privada no aparece). 24 textos nuevos con sus 7 traducciones.
- Pendiente: lista de amigos e invitaciones; los bots siguen sin usar el viento.

## 2026-11-12 (todo a `main`: seis civilizaciones con arte propio y la jugabilidad nueva) — Cristian + Claude

**Estado: publicado en ageofnavies.com por pedido de Cristian. EL SERVIDOR DEL MAR NO ESTÁ REPUBLICADO.**

- Se juntaron en `main` las ramas `viento-y-controles` y `propuestas-arte-barcos` (las dos entradas de abajo).
- **Arte propio para suecos, holandeses, alemanes, otomanos, chinos y japoneses** (ya son 11 de 20 civilizaciones). Cristian eligió un diseño por casco; la lista está en `src/arte-elegidos.js`. El motor por piezas y los diseños pasaron de `propuestas/` a `src/` (`arte-motor.js`, `arte-emblemas*.js`, `arte-<civilización>.js`); la galería sigue en `/propuestas/` y usa esos mismos archivos.
- En las civilizaciones de remo (otomanos) los remos los sigue poniendo `dibujo.js`; el diseño no dibuja los suyos. Detalle sin resolver: el Kalyon otomano es un galeón de vela y el juego igual le pone remos, porque los remos van por civilización y no por barco.
- **Nicolás: hay que republicar el servidor** (`cd servidor && npx wrangler deploy`). Mientras tanto, "Jugar online" funciona pero con las reglas viejas del servidor: sin viento, sin rachas, sin equipos por civilización, sin habilidades, con el gancho viejo, el tesoro viejo y los mapas con callejones. Lo probé desde localhost contra el servidor publicado: navegar, velas con W / S y disparo por costado andan. El modo solo tiene todo lo nuevo.
- No se corrió `/review` ni `/qa` de gstack sobre estos cambios: Cristian pidió publicar ya. Se probó con `probar-sim`, `probar-textos`, partidas en modo solo y la prueba en línea de arriba.
- Pendiente: probar el modo en línea con el servidor nuevo (`npx wrangler dev` y `?mar=local`) antes o apenas se republique; revisar las referencias históricas de las tarjetas de la galería, que no se contrastaron con fuentes.

## 2026-11-12 (ajustes después de una partida larga de Cristian) — Cristian + Claude

**Estado: ya está en `main`** (ver la entrada de arriba).

Cristian jugó hasta comprar el galeón y dejó esta lista; está todo hecho:

- **Zoom con Ctrl + rueda** (se sacaron las teclas). La rueda sola sigue manejando las velas.
- **Guardias del tesoro:** eran imposibles (dos galeones de guerra y dos corsarios con mejoras de zona). Ahora son dos corsarios y dos balandros sin mejoras. Ya no abandonan al galeón para perseguirte: solo pelean con lo que se le acerca a menos de 430 y vuelven a su puesto si se alejaron. Cuando el galeón cae o lo capturan, se retiran y desaparecen a los 14 segundos; si llega al puerto, entran con él.
- **Reforzar el casco** en el puerto (+45 de casco por nivel, 6 niveles, 140 × nivel de oro), porque las mejoras se quedaban cortas contra los enemigos de mar adentro. No toqué a los enemigos comunes: si sigue desparejo, lo próximo es bajarles las mejoras de zona.
- **Oro más fácil:** los mercantes llevan 80 a 150 (antes 35 a 70) y se ven siempre en el minimapa como un rombo dorado.
- **Rachas de viento:** soplos de 6 segundos en cualquier dirección, cerca de cada capitán. Con la proa a menos de 60° de donde soplan dan +50 %, aunque el viento general esté en contra. Se ven como un círculo punteado con flechas.
- **Tritones:** vienen menos (2 a 6 en lugar de 3 a 9), nadan más lento, cada uno saca 1 o 2 marineros en lugar de hasta 3, y es mucho más fácil pegarles con una bala.
- **Habilidad a elección:** se elige una en el astillero y se usa con R. Andanada doble (recarga los dos costados, 40 s), ancla de combate (girás casi en el lugar 3 s, 30 s), carpinteros (reparan un cuarto del casco en 6 s, 60 s), remos y trapo (+60 % de velocidad 5 s, 35 s). Los bots no las usan.
- **Mapa y brújula del viento más grandes** (240 y 64 px).
- **Sin callejones:** `crearMundo` saca los islotes y escollos que dejan un paso de menos de 280 con otra tierra (53 de 574 entre los 20 mapas). **Bots:** si uno quiere andar y no avanza durante 2 segundos, deja lo que hacía y sale derecho hacia el lado contrario a la costa.
- Para no romper el juego en línea mientras el servidor no se republique: el servidor nuevo manda `v: 2` al entrar; sin eso, el navegador arma el mundo viejo. **Hay que republicar el servidor.**
- Pendiente: los bots siguen sin usar el viento ni las habilidades; el balance contra los enemigos de mar adentro está apenas tocado.

## 2026-11-11 (viento, velas y disparo por lado) — Cristian + Claude

**Estado: ya está en `main`** (ver la entrada de más arriba).

- **Viento** (pedido de Cristian: que sea la mecánica central). `src/juego.js` tiene `j.viento` (rumbo que rota despacio y 9 ráfagas que viajan con él) y `rindeViento(j, b)`, que multiplica la velocidad según el ángulo entre el rumbo del barco y el viento y según el tipo de vela. Tabla y números en `VIENTO`, en `src/config.js`. Vale para todos los barcos, también bots y escoltas.
- **Velas**: ya no dependen de la distancia del cursor. El navegador manda `velas` (0 a 3) en la entrada; se cambian con W / S, flechas o la rueda. El cursor cerca del barco ya no lo frena.
- **Disparo**: clic izquierdo babor, clic derecho estribor, los dos juntos o espacio la andanada completa.
- **Pantalla**: rayas de viento sobre el agua (más densas dentro de las ráfagas), ráfagas en el minimapa, brújula del viento en el indicador con cuánto suma o resta, ayuda de controles nueva. 13 textos nuevos con sus 7 traducciones.
- **Ajustes después de que Cristian lo jugó (mismo día):**
  - Viento de proa mucho más suave: ahora se pierde como mucho un tercio (latinas −24 %, mixtas −30 %, cuadras −36 %). Antes era más de la mitad y no se podía volver al puerto contra el viento.
  - **Galeón del tesoro como evento:** ya no sale suelto entre los enemigos comunes. Cada tanto zarpa UNO desde mar adentro rumbo al puerto con cuatro guardias en formación (dos galeones de guerra y dos corsarios). Mientras quede un guardia no recibe daño ni se lo puede abordar. Lleva entre 1600 y 2200 de oro; si llega al puerto, se pierde hasta el próximo.
  - **Casco nuevo en el puerto:** se puede pasar a un casco más grande (nunca más chico) pagando la diferencia del astillero por 2,5 (bergantín a galeón: 500). Sale entero y conserva cañones, gente y mejoras. Así se puede arrancar chico y terminar con el mejor galeón.
  - **Abordaje nuevo** (reemplaza al gancho que salía volando y resolvía todo con una tirada). Ahora hay que arrimarse, igualar la velocidad y apretar F con el cursor sobre el casco del otro barco. Empieza una pelea de varios segundos: cada bando pierde gente según la fuerza del otro, se ven las sogas y una barra con las dos tripulaciones, el costado trabado no dispara y cualquiera corta las sogas con F (pierde un 10 % de su gente). El rival se rinde cuando le queda un cuarto de su tripulación; la tuya se retira cuando le queda un 30 %. Números en `ABORDAJE` (`src/juego.js`). El mensaje de red no cambió: sigue viajando como "gancho enganchado".
- **Segunda ronda de ajustes (2026-11-11), después de que Cristian lo jugó:**
  - **Equipos por civilización.** Cada civilización es un bando: los barcos de tu civilización (bots y otros jugadores) son aliados, no se dañan ni se abordan, y pelean a tu favor. Bots de civilizaciones distintas se pelean entre ellos (el oro de los hundidos queda flotando). El galeón del tesoro y sus guardias son un equipo aparte, enemigo de todos los capitanes; los bots no se meten con él. `equipoDe()` en `src/juego.js`. Barra de vida verde = tu equipo, roja = rival. En línea el servidor manda el equipo de cada barco (`eq` en `alta`); con un servidor anterior se sigue usando el capitán como equipo.
  - **Bandera de la civilización entera en el asta de popa** (sin el recuadro verde del bando, que Cristian no quería), más grande y flameando. Se sacó la bandera que iba en el medio del barco. Un barco capturado pasa a llevar tu bandera.
  - **Abordaje más fácil de activar:** los garfios llegan a 120 de separación entre cascos (antes 75) y toleran más diferencia de velocidad. Con F van al rival bajo el cursor o, si el cursor no está sobre ninguno, al rival a tiro más cercano al cursor.
  - **Zoom:** + / − (o Z / X) acercan y alejan la cámara, de 0,55 a 1,6. Se guarda en el navegador.
- **Cambia dos reglas que estaban como decididas** en `CLAUDE.md` (velas por distancia del cursor y clic que dispara los dos costados). Nicolás: lo pidió Cristian después de jugarlo; si no estás de acuerdo, hablalo con él antes de publicar.
- **Hay que republicar el servidor** (`servidor/worker.js` y la simulación cambiaron). Mientras no se republique, el modo en línea sigue andando sin viento: el juego detecta que el servidor no lo manda y le traduce las velas. No probé el modo en línea, ni con el servidor viejo ni con `wrangler dev`.
- `scripts/probar-sim.mjs` suma pruebas de viento y de velas. La prueba de juntar oro ahora espera más, porque con viento de proa se tarda más en llegar.
- Pendiente / ideas: que los bots usen el viento a su favor (hoy solo lo sufren); que las civilizaciones de remo ciñan mejor; controles para celular.

## 2026-11-10 (propuestas de arte para seis civilizaciones más) — Cristian + Claude

**Estado: ya está en `main` y los elegidos están en el juego** (ver la entrada de más arriba).

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
