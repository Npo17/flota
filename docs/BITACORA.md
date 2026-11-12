# Bitácora de Age of Navies

Lo más nuevo va arriba. Cada entrada: fecha, quién (socio y su Claude), qué cambió, por qué y qué quedó pendiente.
Sirve para que el Claude del otro socio tenga el contexto al día.

## 2026-11-15 (la flota ya no se estrella sola) — Nicolás + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea también rija.**

- **Problema (captura de Nicolás):** parado al lado de una isla y girando en el lugar, la flota capturada salía a dar vueltas y se estrellaba contra la costa hasta quedar al 70 %. Causa: los lugares de la formación se calculaban con la proa del momento, así que al girar daban vueltas alrededor del jefe y caían arriba de la isla; los barcos iban a toda vela a buscarlos, chocaban y `esquivarIslas` los hacía girar en redondo.
- **Arreglo (`iaEscolta` en `src/juego.js`):** con el jefe casi parado (menos de 30 de velocidad) la formación usa el último rumbo con el que venía navegando (`cap.rumboFlota`), así girar en el lugar no mueve a la flota; parados, se acercan despacio y arrían velas en su lugar. Si un lugar cae sobre una isla o pegado a la costa, se corre al agua. Ya casi en su lugar no dan volantazos por la costa de al lado.
- **Los barcos de tu flota no se lastiman contra la costa** (`moverBarco`): el choque es error del timonel de la máquina, no del jugador. Tu barco y los enemigos sí siguen lastimándose.
- **Prueba nueva** en `scripts/probar-sim.mjs` ("flota quieta"): jefe parado junto a una isla girando 20 s, en las 4 formaciones; la flota no pierde vida ni anda más de 400 px. Con el código anterior fallaba (barcos al 68-77 % y 750-1270 px de vueltas).

## 2026-11-14 (ESC abre ajustes, mejoras hasta nivel 10, botones Q W R) — Nicolás + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea rijan los niveles hasta 10 y la flota que aprieta el paso.**

- **ESC abre los Ajustes en plena partida** (solo, en línea o en sala) y el mar no se detiene. Motivo: Nicolás quiso bajar el sonido jugando en línea y tuvo que salir y perder la partida. Antes, ESC dos veces dejaba la partida; ahora eso es el botón rojo "Dejar la partida" dentro de Ajustes. ESC otra vez cierra. (`abrirAjustes` en `src/main.js`.)
- **Cañones y casco hasta nivel 10** (eran 6): `PUERTO.nivelesCanones` y `PUERTO.nivelesRefuerzo` en `src/config.js`. Los precios siguen la misma fórmula (180 × nivel y 140 × nivel). La guía del juego ya dice 10.
- **Botones de acción abajo, en el medio:** Q (orden a la flota), W (formación, con un dibujito de cómo quedan los barcos) y R (habilidad). Q y W aparecen solo con barcos capturados. El botón R se oscurece y muestra los segundos mientras la habilidad se recupera. Se pueden tocar con el ratón. `pintarAcciones` en `src/main.js`.
- **Se sacó el panel de abajo a la izquierda** (la barrita de la habilidad y las tres líneas de ayuda). Las líneas de ayuda pasaron a Ajustes → Controles. En la práctica guiada los botones van abajo a la izquierda, porque el medio lo ocupa el panel de pasos.
- **La flota obedece más rápido:** en formación, el barco que está lejos de su lugar aprieta el paso (+35 %, o +60 % si quedó muy atrás) hasta alcanzarlo (`b.apuro` en `iaEscolta` y `moverBarco`). Antes un galeón capturado nunca llegaba a formar detrás de una balandra y parecía que no hacía caso.
- **Brújula del viento más grande:** de 64 a 128 px (primero 96; Nicolás la pidió más grande todavía).
- **Botones abajo a la izquierda** (segunda vuelta, pedido de Nicolás): en el medio el cartel de ayuda ("Arrimate al Mercante…") tapaba el botón R. Ahora van Q, W, R y **F (gancho, con su dibujo)**, siempre visibles: **apagados (grises y oscuros) mientras no se pueden usar** y de color cuando sí. Q y W se encienden con barcos capturados; F, con un rival a tiro y sin espera (durante el abordaje se pone roja y dice "Cortar las sogas"); R, cuando la habilidad está lista. Los segundos de espera quedan en blanco encima. Tocar F con el ratón apunta al barco a tiro más cercano (el cursor está sobre el botón). En la práctica guiada el panel de pasos se angostó para no pisarlos.
- Pendiente: nadie lo probó a mano; revisar el balance con cañones nivel 10 (+150 % de daño).

## 2026-11-13 (práctica guiada y guía del juego) — Nicolás + Claude

**Estado: subido a `main`. La práctica y la guía no tocan el servidor; el arreglo del galeón sí (falta republicarlo).**

- **Práctica guiada** (pedido de Nicolás, para que la primera vez se entienda el juego): botón "🎓 Práctica guiada" en el astillero (y "Práctica guiada" en el menú de la app). Es una partida de un jugador en Malta, sin viento, sin bots, sin galeón del tesoro ni tritones. Son 11 pasos: navegar, velas, babor, estribor, andanada, hundir el barco de práctica, juntar el botín, la habilidad, abordar un mercante, mandar la flota (Q y W) y volver al puerto. La lista de pasos y cuándo se cumple cada uno están en `src/practica.js`; la pantalla, en `src/main.js` (`iniciarPractica`, `pintarPractica`).
- **Teclado dibujado:** el panel de abajo muestra un teclado chico (Q W R / A D F / P / espacio / flechas) y un ratón. Las teclas del paso van **pintadas de oscuro con borde dorado**; al apretarlas se encienden. Un círculo dorado marca a dónde ir y, si queda fuera de la pantalla, una flecha apunta hacia ahí (`j.marca`, dibujada en `src/dibujo.js`).
- Los barcos de la práctica están anclados y no disparan (`b.quieto`, en `iaEnemigo`). El de práctica no se hunde hasta que el paso lo pide; el mercante lleva 5 marineros para que el abordaje salga. Se puede saltar un paso o salir. La práctica no suma a las estadísticas ni al récord.
- Al entrar al puerto termina: se ve el puerto con una nota y, al salir, se abre la **guía**.
- **Guía del juego** (botón "📖 Guía del juego", también en el menú de la app): 8 láminas con dibujo y texto corto: el viento, las brisas, remolinos y costas, el galeón del tesoro, las civilizaciones, tu barco, las mejoras del puerto, y el mar y los modos de juego (`GUIA` en `src/practica.js`, láminas en `pintarLamina`).
- La primera vez el botón de práctica late en dorado, con una línea que invita a empezar por ahí (se guarda `aon-practica` en el navegador al terminarla).
- 50 textos nuevos en los 8 idiomas. Prueba nueva: `node scripts/probar-practica.mjs` recorre la práctica entera y la salta en los 20 mapas.
- **Arreglo del galeón del tesoro:** en Malta y Lepanto una de las puntas tiene un remolino al lado; cuando zarpaba de ahí, lo chupaba y se hundía solo a los 30 segundos (la prueba `probar-sim` fallaba a veces por eso). Ahora no zarpa cerca de un remolino (`actualizarConvoy` en `src/juego.js`). **En línea rige cuando Nicolás republique el servidor**, igual que la salida desde una punta y las 14 brisas.
- Pendiente: nadie la jugó todavía a mano de punta a punta (se probó por programa); un paso en vivo para el viento y las brisas (hoy se explican solo en la guía); práctica en el celular (no hay controles táctiles).

## 2026-11-13 (viento curvo, tesoro con cartel, formaciones) — Nicolás + Claude

**Estado: la web está subida a `main`. EL SERVIDOR DEL MAR HAY QUE REPUBLICARLO (lo hace Nicolás): hasta entonces, en línea sigue el viento de un solo rumbo, siguen las rachas y la tecla H no hace nada. En modo solo ya anda todo.**

- **Se sacaron las rachas** (el círculo con flechitas que aparecía cerca de cada capitán; era de Cristian). Nicolás pidió dejar un solo tipo de brisa: la mancha que se va moviendo. `actualizarViento` ya no crea ninguna; el dibujo y la cuenta quedan por compatibilidad con un servidor anterior.
- **Viento curvo:** ya no sopla igual en todo el mar. `vientoEn(j, x, y)` (`src/juego.js`) da el rumbo en cada punto: el general más una curva suave según la zona, que se corre despacio (como un mapa del pronóstico). Lo usan el rendimiento de las velas, las ráfagas (cada una viaja con el viento de donde está), los trazos de viento del mar y la brújula del HUD (muestra el viento donde está tu barco). Números en `VIENTO` (`curva`, `escala`).
- **El viento cambia de rumbo:** cada 150 a 240 segundos gira en unos segundos hasta soplar casi al revés. Se anuncia con un cartel grande ("El viento cambió"), un aviso y un sonido. El servidor manda `vf: [fase1, fase2, cambios]`; sin `vf` el navegador entiende que es un servidor anterior y usa un solo rumbo.
- **Galeón del tesoro:** cuando zarpa suena la campana de a bordo y aparece un cartel arriba con una barra y el tiempo que le queda para llegar al puerto (`pintarEventos` en `src/main.js`; se calcula en el navegador con la posición del galeón, no toca el servidor).
- **El galeón del tesoro zarpa de una punta del mapa y tarda entre 2 y 2 minutos y medio en llegar** (pedido de Nicolás). Regula su velocidad según lo que le falta (`velFija`), así los rodeos por las islas no lo atrasan. En los mapas de estrechos, donde las cuatro puntas son tierra, sale del borde del mapa, del agua más alejada del puerto. `probar-sim` lo comprueba en los veinte mapas. **Vive en el servidor: en línea rige cuando se republique.**
- **Más brisas:** de 9 a 14 ráfagas en el mar (`VIENTO.rafagas`). Al sacar las rachas habían quedado pocas; Nicolás pidió más, sin llenar el mapa. En línea rige al republicar el servidor.
- **Flota:** con barcos capturados aparecen dos botones en el panel: la orden (seguirme o atacar, tecla G) y la **formación** (tecla H): a tu lado, en línea, en cuña y en frente (`FORMACIONES` en `src/juego.js`). Teclas: **Q** la orden y **W** la formación, como pidió Nicolás (estilo Age of Empires 3); para liberarlas, el disparo por teclado pasó a A y D y las velas quedaron en las flechas y la rueda. G y H siguen andando.
- **La recarga se ve en el abanico de puntería** (idea de Nicolás): se sacaron las dos barritas de babor y estribor del panel de abajo. Al disparar, el abanico de ese costado queda vacío (solo el contorno) y se llena desde el barco hacia afuera, con un filo claro en el frente; lleno = cañones listos (`dibujarEscena` en `src/dibujo.js`).
- **Sonido al agarrar una brisa:** un soplo y la lona que se hincha.
- Pruebas nuevas en `probar-sim`: no se crean rachas, el viento es curvo y dentro de lo configurado, el cambio de rumbo gira y se anuncia, las formaciones se recorren todas y son distintas. 14 textos nuevos con sus 7 traducciones.
- Pendiente: dar órdenes a un barco en particular o a grupos; los bots siguen sin usar el viento.

## 2026-11-12 (sonido y música) — Nicolás + Claude

**Estado: subido a `main` y publicado. No toca el servidor.**

- **El juego ahora suena** (`src/sonido.js`): música en el astillero (y en el menú de la app), y en el mar las olas, el viento (más fuerte dentro de una ráfaga y con el barco lanzado; casi nada si la partida es sin viento) y los cañones, propios y ajenos, más bajos, apagados y con un instante de demora cuanto más lejos, y hacia el lado del que vienen. También suenan los impactos en el casco, los hundimientos y los salpicones cercanos.
- **No hay archivos de audio:** todo se genera con Web Audio. La música es una pieza corta escrita en el código (re menor, 6/8), no al azar. Se eligió así para que sea original y no pese; si se consigue música grabada con licencia, se cambia solo esa parte.
- **Ajustes → Sonido:** dos barras, "Efectos y ambiente" y "Música", de 0 a 100 %. Al soltar la de efectos suena un cañonazo de muestra. Se guardan en el navegador.
- **El estampido del cañón es una grabación real** (`sonido/canon.mp3`, CC0, origen anotado en `sonido/LEEME.md`): Nicolás pidió algo más parecido a un cañón de verdad que el sonido armado a mano. Encima se le suman el chasquido, el silbido de la metralla y el eco; el tono sigue cambiando con el casco y la munición. Si la grabación no carga, suena el estampido anterior. Regla: solo grabaciones con licencia de uso comercial, nada sacado de videos.
- **Abordaje con sonido:** al tirar el gancho, el silbido de la soga; si engancha, el golpe de madera y hierro; y mientras dura la pelea, sables, gritos, golpes en la cubierta y un tumulto de fondo (también cuando te abordan a vos: en línea `red.js` lo avisa con `j.meAbordan`). Si el gancho erra, un chapuzón. Todo generado, sin grabaciones.
- **Cañones y combate con grabaciones reales** (segunda vuelta, pedido de Nicolás: que suenen a cañón y a combate de verdad). El cañón alterna dos disparos grabados; el abordaje usa gritos de carga grabados de fondo y choques de espadas grabados encima. Todo CC0, de Freesound, con origen en `sonido/LEEME.md`. Lo armado a mano queda solo de respaldo si una grabación no carga. `sonido.grabaciones()` dice cuántas cargaron.
- En la web el navegador no deja sonar nada hasta el primer clic o tecla; en la app suena desde que abre.
- **Ajustes pedidos por Nicolás al escucharlo:** un **clic de madera** en todos los botones (también los del menú de la app); **cañones de pólvora negra** (chasquido del fogonazo, estampido grave y ronco, y un trueno largo que rueda y vuelve en eco; de lejos queda solo el trueno); y el **viento a menos de la mitad**. Y **cada cañón suena según el barco y la munición**: chicos y secos en la balandra, medianos en el bergantín, graves y largos en el galeón; la metralla suena rasgada y con poco trueno, la bala pesada es la más grave y la de más eco. Qué barco disparó se saca del más cercano al fogonazo (no hizo falta tocar el servidor). En el astillero, al elegir casco o munición suena un disparo de muestra. Y **el remolino suena**: un fondo grave que late y gira de un oído al otro; se oye apenas un poco antes del borde (avisa sin molestar) y crece rápido hacia el centro, girando más rápido y con el gorgoteo del agua que traga.
- Probado: sin errores en web y app; `sonido.probar()` mide que cada cosa suena y que una andanada entera no satura; en una partida los cañonazos llegan al sonido. **Nadie lo escuchó todavía con oídos:** los niveles y el gusto de la música los tiene que juzgar Nicolás.

## 2026-11-12 (arreglo de verdad de "Volver al mar" en línea, y pantalla de carga) — Nicolás + Claude

**Estado: subido a `main` y publicado. No toca el servidor.**

- **"Volver al mar" seguía congelando el juego en línea.** El arreglo de abajo era cierto pero no era la causa principal. La causa: al reaparecer, `src/red.js` dejaba `j.jugador` en `null` hasta la primera foto del barco nuevo, y `cuadro()` en `src/main.js` usa ese barco en cada cuadro (cursor, cámara). Saltaba un error, y como `requestAnimationFrame` se pedía al final de `cuadro()`, el bucle se cortaba para siempre: pantalla congelada con "Casco 0", aunque el barco nuevo ya existía en el servidor.
- Ahora `j.jugador` no se borra nunca (sigue siendo el barco anterior hasta que llega el nuevo; una bandera `barcoNuevo` avisa la entrada), y `cuadro()` pide el próximo cuadro **al empezar**, así un error en un cuadro no congela el juego.
- **Cómo se probó:** en la app contra `wrangler dev`, con un guion que lleva el barco a un remolino hasta hundirse, toca "Volver al mar" y repite. Antes: barco nuevo quieto y error en consola. Después: dos hundimientos seguidos, las dos veces reaparece y navega, sin errores. `probar-reaparecer` ahora también exige que nunca quede sin barco. Lección: la prueba sin red no corre `cuadro()`; lo de la pantalla hay que probarlo con el juego abierto.
- **Pantalla de carga en la web:** al recargar se veía un instante el astillero vacío (cajas sin texto ni barco). Ahora `<html class="cargando">` muestra solo el logo hasta que `main.js` termina de pintar y saca la clase (a los 8 segundos se saca sola, por si el juego no arranca). La portada de la app (`#presentacion`) queda a la vista.

## 2026-11-12 (arreglo: reaparecer en línea quedaba trabado) — Nicolás + Claude

**Estado: subido a `main` y publicado. No toca el servidor.**

- Nicolás tocó "Volver al mar" jugando en línea y el juego quedó trabado con el barco hundido. Era una carrera en `src/red.js`: entre el pedido de reaparecer y la respuesta del servidor llegaba otra foto del barco hundido, y se tomaba como el barco nuevo. Ahora, desde que se pide reaparecer hasta que llega el saludo del servidor, las fotos se ignoran, y el saludo deja la partida limpia.
- No pasaba esperando la cuenta regresiva entera, porque a los 6 segundos el servidor ya sacó al capitán y deja de mandar fotos. Por eso no lo vi al probar.
- Prueba nueva: `node scripts/probar-reaparecer.mjs` (cliente contra servidor sin red, con esa foto de más). Falla con la versión anterior y pasa con el arreglo.

## 2026-11-12 (sin pasos angostos entre tierras) — Nicolás + Claude

**Estado: subido a `main` y publicado en la web. El servidor también quedó republicado** (`v: 4`, lo corrió Nicolás) y pasa `probar-red` en vivo.

- Nicolás encontró que seguían quedando callejones: dos tierras grandes que no se tocan pero dejan un canal angosto. Ahora `crearMundo` también une las tierras separadas por menos de 280, salvo que ese paso sea la única entrada a una parte del mar (lo comprueba recorriendo el mar desde el puerto en una grilla). Medido en los 20 mapas: el mar que queda en pasos de menos de 280 bajó de 2745 celdas a 246.
- Cambia el aspecto de varios mapas: las costas pasan a ser franjas enteras en lugar de círculos en fila.

## 2026-11-12 (tierras de un solo cuerpo y reaparecer en el puerto) — Nicolás + Claude

**Estado: subido a `main` y publicado en la web junto con la entrada de abajo. El servidor del mar también quedó republicado** (lo corrió Nicolás el 12/11/2026) y pasa `probar-red` en vivo, salas incluidas.

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
