# Bitácora de Age of Navies

Lo más nuevo va arriba. Cada entrada: fecha, quién (socio y su Claude), qué cambió, por qué y qué quedó pendiente.
Sirve para que el Claude del otro socio tenga el contexto al día.

## 2026-11-13 (tirones en la web y Ajustes ordenado) — Nicolás + Claude

**Estado: subido con el OK de Nicolás.** No toca la simulación ni el servidor.

- **Tirones al navegar (Nicolás: "corre, frena" y una línea amarilla en las orillas):** el relieve de la tierra (`src/terreno.js`) armaba cada baldosa entera en un cuadro (50–160 ms) y al entrar baldosas nuevas el juego se frenaba. Ahora cada baldosa se arma de a poco (un generador que se pausa cada 4 filas), con 1–2 ms por cuadro y menos si el cuadro anterior vino lento; primero las que se ven y después una de margen alrededor, para que estén listas antes de llegar. Medido navegando junto a la costa de Lepanto: antes, tirones de 83 a 161 ms; ahora, ninguno arriba de 67 ms. La "línea amarilla" era la arena de la tierra lisa provisoria (dibujada un 10 % más grande) que asomaba en todas las costas mientras faltaba alguna baldosa: ahora la tierra lisa se pinta solo para las islas que todavía no tienen relieve, y al tamaño exacto.
- **Otros tirones:** el brillo de los barcos arma a lo sumo 2 direcciones de luz por cuadro (mientras, usa la más cercana); la caché de imágenes de barcos suelta las más viejas de a 20 en vez de vaciarse entera; `graficos()` lee `aon-graficos` a lo sumo cada medio segundo.
- **Queda:** navegando rápido siguen apareciendo cuadros de 33–44 ms (con el monitor a 60, uno de cada 15 aprox.), y también con el terreno apagado: no vienen del terreno. Sin investigar.
- **Ajustes ordenado (pedido de Nicolás):** tres botones que se abren de a uno: **Idioma**, **Configuración de gráficos** (pantalla clara u oscura, calidad, resolución, cuadros por segundo, menos movimiento, formas; en la app también la ventana) y **Configuración de controles** (las teclas). Sonido queda siempre a la vista. Se sacó la ayuda vieja de controles con las letras de fábrica. La app de escritorio (`preload.cjs`) mete "Ventana" dentro de gráficos.

## 2026-11-13 (aspecto del mar, Tandas C y D: tierra con relieve, barcos con volumen, bruma, llegada y ajustes de gráficos) — Nicolás + Claude

**Estado: subido el 13/11 con el OK de Nicolás (servidor republicado por Nicolás, versión a4bfd313).** Sigue sin tocar la simulación ni el servidor: no hay que republicar nada.

- **`src/terreno.js` (nuevo): la tierra con relieve.** Arena mojada y seca, vegetación, bosque con copas, roca en las pendientes, sierras tierra adentro en las tierras grandes, nieve y roca en los mapas de hielo, arena negra en los volcánicos, icebergs de caras quebradas y bancos de arena que se transparentan. Usa las mismas costas que el juego (la forma exacta se recorta con el mismo trazo que antes), así que se choca donde se ve. El mundo se pinta por baldosas de 400 unidades, una vez cada una (una por cuadro como mucho); mientras falta alguna a la vista se ve la tierra lisa de antes. La luz del relieve es la del escenario. Los colores salen de `tema` en `src/mapas.js`.
- **Barcos con volumen (`imagenLuz` en `src/dibujo.js`):** el dibujo de cada barco queda igual y se lo ilumina como relieve: la altura sale del propio dibujo (casco redondeado hacia la borda, lo claro más alto) y la luz es la del escenario. 24 versiones por dirección de luz, armadas cuando hacen falta. Además un cabeceo y rolido muy leve. **No es un modelo 3D**: para eso hace falta arte nuevo (ver pendientes).
- **La sombra fija del arte pasó a ser opcional** (`o.sinSombra` en `arte-motor.js` y en los cinco `arte-*.js` dibujados a mano): en el mar la sombra la pone el escenario según su luz; en el astillero y el puerto `dibujarBarco` la pone abajo a la derecha como siempre.
- **Ambiente (`src/dibujo.js`):** sombras de nubes que pasan con el viento, bancos de bruma con paralaje (más en noche, tormenta, eclipse y kraken) y gaviotas de día. Cada escenario lo regula con `nubes`, `niebla` y `aves` en `src/escenarios.js`.
- **Llegada desde el menú:** al zarpar la imagen sale de lo oscuro y la cámara arranca un 30 % más cerca y se abre en 2,4 s. Con "menos movimiento" no hay acercamiento.
- **Ajustes → Gráficos (nuevo):** calidad Baja / Media / Alta / Máxima (`CALIDADES` en `src/escenarios.js`: resolución del agua, detalle del terreno, sombras, relieve de barcos, ambiente), escala de resolución 50–100 %, tope de cuadros por segundo (30 / 60 / 120 / sin tope), "Menos movimiento en pantalla" y "Amigos y enemigos con formas, además del color" (rombo rojo con cruz = enemigo, círculo verde = propio, al lado de la barra de vida). Todo queda en `aon-graficos`. Textos en los 8 idiomas. Ventana / pantalla completa ya estaba en la app.
- **Rendimiento (PC de Nicolás, 2560×1369, 12 barcos):** 140 fps de mañana junto a la isla del puerto, 143–146 de noche con bruma frente a una costa grande, 129 en Nueva Zembla con hielo. Antes de todo esto: 134.
- **Capturas:** `docs/visual/tanda-c-*.jpg` y `tanda-d-ajustes.jpg`.
- **Corrección tras la prueba de Nicolás y Cristian (mismo día):** el agua les pareció demasiado realista. Ahora por defecto va **dibujada**: color por profundidad, oleaje apenas marcado, casi sin destellos ni espuma fina, y encima las olitas de trazo de siempre (`uReal` en `src/agua.js`; el agua detallada queda con `aguaReal: true` en `aon-graficos`, sin botón). A los barcos se les subió el volumen (más sombra, veta de madera, colores menos chillones), pero **siguen siendo el mismo dibujo**: Nicolás espera un barco realista y eso es redibujar cada barco (decisión pendiente, con Cristian).
- **PRUEBA de barco realista (pedida por Nicolás): `src/arte-realista.js`.** Solo el **galeón español**, redibujado con madera tabla por tabla, velas de tela con sombra y pliegues, cañones de metal, jarcia y la sombra del aparejo sobre la cubierta. Mantiene medidas, palos, cruz de Borgoña, latina, cebadera, franja roja, galería y el águila del mascarón. Se enchufa en `imagenBarco` (`dibujo.js`); `barcoPrueba: false` en `aon-graficos` lo apaga. **Es para que Nicolás y Cristian decidan el estilo**: si no va, se borra el archivo y esas líneas. Comparación en `docs/visual/prueba-galeon-realista.jpg`.
- **Gaviotas:** ahora son pájaros dibujados (cuerpo, cola, pico, alas de punta negra que baten y planean, sombra) y vuelan alrededor del puerto, no por todo el mar.
- **Barcos: acabado realista en los 33 (aprobado por Nicolás con la prueba del galeón español).** `src/arte-real.js` (nuevo) trae las piezas comunes: vela hinchada con luz, sombra, costuras y pliegues; cubierta tabla por tabla con desgaste y sombra de la borda; casco redondeado; cañones de metal con cureña; sombra del aparejo sobre la cubierta. Cada `arte-*.js` y `arte-motor.js` siguen dibujando su diseño (casco, colores, emblemas, tallas) y llaman a esas piezas con `if (REAL.on)`: **no se cambió ningún diseño de Cristian, solo el acabado**. El galeón español conserva su versión entera en `src/arte-realista.js`. `barcosReal: false` en `aon-graficos` vuelve al acabado plano. Lámina: `docs/visual/barcos-realistas-33.jpg`. Las velas ahora ocupan más lugar (se ven hinchadas, no de canto): en el Atakemaru japonés tapan bastante la proa.
- **Solo 12 civilizaciones en juego:** españoles, británicos, franceses, portugueses, holandeses, suecos, alemanes, venecianos, otomanos, vikingos, chinos y japoneses. Las otras 8 (daneses, rusos, polacos, coreanos, mogoles, omaníes, mexicas, incas) quedan **guardadas, no borradas**: `FUERA_DE_JUEGO` en `src/config.js` les pone `dlc: true` y `FACCIONES_JUEGO` / `enJuego()` las sacan del astillero, de la guía, de las banderas de cada mapa y de los barcos que salen al mar (`faccionAlAzar` en `barcos.js`). Para devolver una alcanza con sacarla de esa lista. En la app, el selector de civilización también las filtra (`preload.cjs` de `age-of-navies-steam`). La guía dice 12 en los 8 idiomas. **Toca `barcos.js`, `config.js` y `servidor/worker.js`: hay que republicar el servidor (lo hace Nicolás).**
- **Puerto con más detalle (`dibujarPuerto`):** pueblo con casas de techo a dos aguas, iglesia con torre, faro, depósitos, plaza y senderos; muelle con pilotes, tablas una por una, cajones, toneles y botes amarrados que se mecen. Luces y sombras según el escenario.
- **Venecianos ya tiene barcos propios (`src/arte-veneciano.js`, con el motor por piezas):** Fusta (balandra), Galea sottile (bergantín) y Galeaza de Lepanto (galeón, con castillo artillado a proa y león dorado). Rojo veneciano y oro, latinas a rayas rojas y blancas, toldo de popa, fanales. Anotados en `arte-elegidos.js` y con sus faroles en `luces.js`. **Son propuesta de Claude, sin revisar por Cristian**: se cambian como cualquier otro diseño del motor. El león de la vela es el león rampante que ya existía, no el león alado de San Marcos.
- **Orillas e isla del puerto (pedido de Nicolás tras probar):** con el agua nueva ya no se pintan las dos bandas de bajíos de borde duro (los bajíos los esfuma el agua); la rompiente dejó de ser un anillo entero y llega en tramos cortados, más pegada a la arena, con un hilo de espuma en el borde. `terreno.js`: más relieve en las islas chicas, playa con franja húmeda, algas y cantos, pasto con manchones secos, flores y piedras; nieve con ventisqueros, charcos de hielo y roca que asoma, y sombras más azules. Isla del puerto: sembrados cercados y parvas (leñeras y huellas de trineo en la nieve), árboles y rocas sueltos, botes varados y redes en la playa, pozo en la plaza, y techos nevados, plaza y senderos según el clima.
- **Témpanos rehechos:** hielo quebrado en caras de verdad (cada cara con su luz, grietas azules, nieve en lo que mira a la luz, borde turquesa) en `terreno.js`, y en `dibujo.js` la parte sumergida como mancha turquesa esfumada y un hilo de espuma en el borde. **Kraken visto con todo lo nuevo** (despertado a mano en la prueba): funciona, anochece y llueve bien; el Kraken mismo sigue con su dibujo plano de antes y la escena queda bastante oscura (`docs/visual/kraken-con-lo-nuevo.jpg`).
- **Kraken con volumen y escena más clara (pedido de Nicolás):** mismo diseño aprobado el 15/11, sin cambiar formas ni colores de base. En `kraken-dibujo.js`: sombra de tentáculos y cuerpo sobre el agua, lomo con luz y canto más hondo (tentáculo redondo), manto con luz arriba y bordes oscuros, brillo mojado más fuerte, y `dibujarKrakenLuz` (nuevo, va encima del velo): los ojos brillan en lo oscuro (ámbar; naranja y latiendo cuando se enfurece) y un resplandor frío del agua revuelta alrededor. Escenario `kraken` menos negro (`fuerza` 0,46 → 0,34, `vineta` 0,52 → 0,44, agua algo más clara): ahora se ven las islas y los barcos. Solo visto al despertar; falta mirarlo atacando, enfurecido y muriendo.
- **Remolinos rehechos:** en vez de cuatro líneas en espiral, un embudo oscuro con espuma: dos estampas hechas una sola vez (`estampasRemolino` en `dibujo.js`), la de afuera con bandas anchas que gira despacio y la de adentro con hilos finos que gira más rápido. Mismo lugar, tamaño y sentido de giro que antes (la simulación no cambia). Con "menos movimiento" giran más lento.
- **Lluvia rehecha (a Nicolás le parecían rayas pasando por la pantalla y círculos en el agua):** en `agua.js` la lluvia pica toda la superficie con gotas chicas y tupidas (punto claro al caer y anillo corto), en dos tamaños, y viene en cortinas que el viento corre, con el agua más gris donde llueve fuerte. En `dibujarTormenta` (`kraken-dibujo.js`): tres capas de gotas a distinta altura (chicas, muchas y lentas abajo; pocas, largas y rápidas arriba) que se corren distinto al avanzar el barco, inclinadas según el viento; franjas de lluvia tupida que cruzan la pantalla; y gotas que revientan sobre la cubierta de cada barco. Con "menos movimiento": la mitad de gotas y más lentas. Ajustado mirando capturas quietas: falta el visto bueno en movimiento.
- **Oro, tritones y balas (a Nicolás le quedaban muy de dibujito):** el oro que flota es un arcón de madera con zunchos de hierro y la tapa entreabierta por donde asoma el oro, medio hundido, girado y meciéndose, con un destello cada tanto (ya no es un cuadrado con cruz ni tiene el halo amarillo que latía). Los tritones nadan a flor de agua: cola de escamas que ondula velada por el agua, aleta translúcida, hombros y cabeza de piel verdosa con pelo oscuro, tridente de bronce. Las balas llevan un punto de brillo del lado de la luz y, de noche, un resplandor chico de hierro caliente (`dibujarLuces`); de día casi no cambia. Todo en `dibujo.js`; mismos tamaños y posiciones, la simulación no cambia.
- **Ajustes → Controles (pedido de Nicolás):** cada acción del teclado se puede cambiar: clic en la tecla y se aprieta la nueva (ESC cancela); si la tecla ya era de otra acción, se intercambian; botón "Restablecer teclas". Acciones: disparar a babor (A), a estribor (D), andanada (espacio), habilidad (R), más y menos vela (↑ ↓), abordar (F), orden a la flota (Q), formación (W), puerto (P). Queda en `aon-teclas`; lógica en `src/controles.js` (nuevo), pantalla en `main.js`. ESC y Tab quedan reservadas; G y H siguen andando para la flota mientras no se usen para otra cosa. El ratón no se cambia. El teclado dibujado de la práctica sigue mostrando las teclas de fábrica, y el texto de ayuda de controles también. La calidad "Máxima" ahora se llama **Ultra** (Baja / Media / Alta / Ultra).
- **Revisión antes de subir (`/review` + revisión adversaria):** arreglado: el tope de cuadros por segundo hacía que el juego bajara solo la resolución (con tope 30 todos los cuadros contaban como lentos) y redondeaba al monitor (60 daba 48 en 144 Hz); el oleaje, la lluvia y las nubes giraban **al revés** del viento (`difAng` invertido); durante la llegada desde el menú el ratón apuntaba con el zoom equivocado; el relieve de los barcos usaba demasiada memoria (24 → 12 direcciones de luz, caché de imágenes 400 → 160); el puerto se rearmaba en cada paso de la tormenta del Kraken; los ajustes de gráficos no andaban si el navegador no deja guardar. **El servidor ahora rechaza civilizaciones fuera del juego** (`enJuego` en `servidor/worker.js`). Quedan anotados sin arreglar: la primera baldosa del terreno se arma aunque tarde (tirón al empezar o al cambiar la calidad), el agua no se recupera si se pierde el contexto WebGL (queda el mar liso hasta recargar), y con más de 16 islas cerca algunas costas pierden los bajíos.
- **Pendiente / no hecho:**
  - **Sincronización vertical:** no se puede prender o apagar desde el juego; en la app necesita un arranque con otra opción (cambio en `age-of-navies-steam`). Hoy la app va siempre sincronizada con el monitor.
  - **Sin medir en equipo modesto ni Steam Deck.**
  - **Para Cristian:** la prueba nueva "flota quieta" de `probar-sim` falla a veces (1 de cada 10 corridas, "anduvo 484 px dando vueltas", límite 400). Arma la flota con barcos enemigos al azar, y con solo 12 civilizaciones en juego cambian los barcos que salen. Con tu versión sola no la vi fallar en 6 corridas. No es del dibujo: es el movimiento de la escolta o el límite de la prueba.
  - **Dato suelto:** en Gibraltar, pegado a la costa norte con 12 barcos, da 37–50 fps **también en la versión publicada** (medido contra `HEAD`): no viene de estos cambios; hay que mirarlo aparte.
  - **Barcos como modelo de verdad (Tanda E):** necesita arte nuevo por barco; lo decide Nicolás con Cristian.
  - Las civilizaciones sin arte propio siguen con su dibujo genérico y su sombra fija.
  - `/review` y `/design-review` sin correr todavía (van antes del commit).

## 2026-11-13 (aspecto del mar, Tanda B: faroles, cañonazos, sombras y escenarios completos) — Nicolás + Claude

**Estado: subido el 13/11 con el OK de Nicolás (servidor republicado por Nicolás, versión a4bfd313).** Sigue sin tocar la simulación ni el servidor.

- **`src/luces.js` (nuevo):** los faroles de cada barco como datos (`LUCES`: por civilización y por casco, lista de puntos con `x`, `y`, `r`, `i` y `color` opcional). Galeones europeos con dos fanales de popa y uno de proa; galeras otomanas bajo la toldilla y en el espolón; vikingos con teas rojizas; juncos chinos con faroles de papel repartidos; japoneses en las esquinas del castillo. Para ajustar un barco se toca su fila, no la lógica.
- **`dibujarLuces` (`src/dibujo.js`):** resplandores sumados, encima del velo del escenario, con parpadeo leve. `faroles` del escenario dice cuánto se notan (casi nada de mañana, mucho de noche). También los faroles del muelle y un brillo en el oro que flota. El farol fijo que pintaba `dibujarBarco` queda solo para las vistas del astillero (`sinFarol`).
- **Cañonazos:** cada fogonazo deja un destello cálido de 0,38 s que ilumina el agua y los barcos cercanos (la partícula de la simulación dura 0,12 s; el dibujo la recuerda un poco más en `j.destellos`).
- **Sombras:** la silueta real de cada barco (su misma imagen, oscura y con el borde blando, guardada una vez por imagen), corrida al lado contrario de la luz del escenario (`rumbo`). La sombra de los árboles sigue la misma luz.
- **Escenarios completos:** tormenta y kraken traen lluvia (en pantalla y con anillos donde cae en el agua, en `agua.js`) y relámpagos con su trueno; la lluvia del escenario también suena. **El Kraken ya no pone su propia noche encima:** mientras está despierto el escenario se corre de a poco al de `kraken` (`entreEscenas`) y vuelve cuando se va. `dibujarTormenta` (`src/kraken-dibujo.js`) recibe opciones (`sinOscuro`, `rayos`, `calma`).
- **Preferencias nuevas en `aon-graficos`:** `luces` y `sombras` (false las apaga). Con `calma`, el relámpago destella mucho menos.
- **Medido** (misma compu, 2560×1369, 12 barcos): 146 cuadros por segundo de noche con todas las luces; 120 con lluvia y rayos.
- **Pruebas:** `probar-sim`, `probar-textos` y `probar-kraken` bien. Visto en la app en atardecer, mañana, noche, tormenta, eclipse y kraken, sin errores de consola. **No se vio un Kraken de verdad despertando con el escenario nuevo** (solo el escenario `kraken` fijo): probarlo jugando.
- **A ajustar a ojo:** `faroles` y `sombras` por escenario; en `dibujarLuces`, `radio` y `fuerza`; la posición de cada farol en `LUCES`.
- **Queda para la Tanda C:** niebla, nubes que pasan, partículas, cabeceo de los barcos y la transición del inicio al juego. **Punto de control de profundidad:** ver la respuesta a Nicolás (se recomienda no cambiar la cámara todavía).

## 2026-11-13 (aspecto del mar, Tanda A: paleta, agua nueva y estelas) — Nicolás + Claude

**Estado: subido el 13/11 con el OK de Nicolás (servidor republicado por Nicolás, versión a4bfd313).** No toca la simulación ni el servidor: no hay nada que republicar.

Pedido: que entrar al juego no sea un corte seco con el inicio de la app (cinematográfico, con escenarios). Se hace por tandas con parada: A ambiente base, B luz (faroles, cañonazos, sombras, escenarios completos), C atmósfera y transición, D calidad y plataforma, E profundidad (solo si se aprueba).

- **`src/escenarios.js` (nuevo):** la identidad visual en un solo lugar. `PALETA` (acentos cálidos), `ESCENAS` (atardecer, mañana, noche, tormenta, eclipse, kraken: cada una es un conjunto de números, no código) y `escenaElegida()`, que lee el escenario elegido en el inicio de la app (`aon-inicio` en el navegador). En la web, donde no hay selector, vale `atardecer`. `escenaPara()` corre el agua hacia el matiz de cada mapa (tropical, frío, estuario marrón) sin cambiarle la luz.
- **`src/agua.js` (nuevo):** el agua es un lienzo WebGL (`#agua`) DEBAJO del lienzo del juego, que ahora es transparente donde hay mar. Una sola pasada: oleaje lento en tres capas que siguen al viento, color que se oscurece mar adentro y se aclara sobre los bajíos, camino de destellos hacia la luz del escenario, cáusticas en el agua baja y vetas de espuma. Dentro de una ráfaga el agua se riza y se aclara. Si no hay WebGL (o `agua: false`), `dibujo.js` pinta el mar liso de siempre con la paleta nueva.
- **`src/dibujo.js`:** las rayas rectas del viento son hilos de espuma curvos; rompiente animada en la costa; las **estelas** se arman en el dibujo con el camino de cada barco (espuma de popa que se ensancha, brazos en V desde la proa y bigote de proa, según velocidad y tamaño). La partícula `estela` de la simulación se sigue creando pero ya no se dibuja. Al final, el **velo del escenario** (tiñe tierra y barcos; el agua trae su color) y la **viñeta**. Las barras de vida y los nombres salieron de `dibujarBarco` a `dibujarRotulo` y se pintan DESPUÉS del velo, para que de noche se lean igual.
- **`estilos.css`:** variables `--vidrio`, `--borde-oro`, `--farol`; los paneles del mar usan el mismo vidrio oscuro con borde dorado que el inicio (la pantalla clara conserva los suyos).
- **Preferencias** (`aon-graficos` en el navegador, todavía sin pantalla): `agua` (false = mar liso), `calma` (agua cuatro veces más lenta), `escala` (resolución del agua, 0,75 por defecto). La pantalla de opciones llega en la Tanda D.
- **Medido** en la compu de Nicolás, ventana de 2560×1369, 12 barcos a la vista: 134 y 122 cuadros por segundo antes; 134 y 128 después. Falta medir en gama baja (Tanda D).
- **Capturas** de antes y después por escenario en `docs/visual/` (no se commitean si pesan: decidirlo al cerrar).
- **Alcance de arte:** se trabaja solo con las civilizaciones que tienen arte propio. Hoy son 11 (`ARTE` en `dibujo.js`): británicos, españoles, portugueses, franceses, vikingos, suecos, holandeses, alemanes (`hanseaticos`), otomanos, chinos y japoneses. **Venecianos NO tiene arte propio** (usa el dibujo genérico): hay que confirmar con Cristian cuáles son las 12. Las demás (daneses, rusos, polacos, coreanos, mogoles, omaníes, mexicas, incas) no se tocaron.
- **A ajustar a ojo:** en `ESCENAS`, `brillo` (destellos), `oleaje`, `espuma`, `fuerza` del velo y `vineta`; en `agua.js`, el tamaño de las olas; en `dibujarEstelas`, `DURA_ESTELA` y las opacidades.
- **Pendiente de esta tanda:** el Kraken sigue trayendo su propia noche por encima (se unifica con los escenarios en la Tanda B); `/review` y `/design-review` antes del commit.

## 2026-11-13 (barcos encajados en la costa, flota que se reagrupa y avisos grandes) — Cristian + Claude

**Estado: probado en localhost, sin subir. TOCA LA SIMULACIÓN: hay que republicar el servidor (lo hace Nicolás).** Los avisos grandes viajan por la red sin cambiar el mensaje.

- **Por qué se encajaban:** `bloqueado` (src/juego.js) detectaba el atasco por velocidad (`v < 14`). Pegado a una costa o al borde del mapa el barco seguía con `v` alta (60–90) sin moverse, o daba vueltas en el lugar, y nunca se lo daba por trabado. Medido con 4 escoltas y un jefe que cruza el mapa 10 minutos en los 20 mapas: hasta **556 s seguidos pegadas a la costa** (Lepanto, Magallanes, Kealakekua) y escoltas a más de 7000 del jefe.
- **Arreglo:** ahora se mide el avance real (ventana de 1,5 s: lo que anduvo contra lo que debió andar; dos ventanas malas seguidas = trabado). El escape ya no es "al lado contrario de la isla más cercana" (en un borde del mapa apuntaba afuera del mapa): `rumboLibre` prueba 24 rumbos y elige el de más agua libre, sin alejarse de más del jefe. En `moverBarco` la salida de las islas hace dos pasadas (entre dos tierras pegadas salir de una metía en la otra). Medido después: peor caso **25 s** pegada a la costa, y bots enemigos 31 s.
- **Reagrupe de la flota (pedido de Cristian):** una escolta a más de `REAGRUPE_FLOTA` (2500, `src/config.js`) de su jefe aparece en el agua detrás de él (240 a 680, sin pisar tierra ni otro barco) con un salpicón en los dos lugares y el aviso "¡Tu flota se reagrupó junto a tu barco!" (máximo uno cada 8 s). Si una escolta se traba 3 veces en 40 s y está a más de 700 del jefe, también aparece a su lado. No pasa si el jefe la está abordando.
- **Avisos grandes:** `avisoLargo` (monedas, "falta UNA moneda", Kraken despierto, furioso, caído, deuda saldada) agrega " grande" al tipo y sale en letra grande, con entrada animada, 7 s. Cliente viejo: ve una clase de más y lo muestra normal. Los avisos de cada ataque del Kraken (lluvia, barrido…) siguen chicos.
- Pruebas nuevas en `probar-sim`: reagrupe a 2500, aparece en el agua y avisa; escolta pegada al borde sale sola. Texto nuevo con 7 traducciones.
- **Pendiente / idea:** el reagrupe vale solo para las escoltas; un barco enemigo trabado sale del paso pero no se teletransporta.

## 2026-11-13 (Kraken: monedas de Flint Braun, deuda saldada y ocho ataques) — Cristian + Claude

**Estado: probado en localhost y commiteado. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea rijan los ataques nuevos, las monedas en la tabla y la deuda saldada.** Un navegador viejo con el servidor nuevo, o al revés, no se rompe: los datos nuevos van al final de la foto y quien no los conoce los ignora.

Pedido de Cristian después de probar el Kraken de Nicolás (le gustó cómo se ve; tenía un solo ataque y se volvía predecible).

- **Monedas del tesoro maldito de Flint Braun:** cada galeón del tesoro hundido es una moneda (lo que antes se llamaba "marca"). Una moneda sale del agua girando, con brillo verde, y vuela al barco del que lo hundió (evento `'mo'`, dibujo `dibujarMonedas` en `src/kraken-dibujo.js`, tres toques de campana que desafinan). Todo el mar recibe "¡{nombre} consiguió una moneda del tesoro maldito de Flint Braun!".
- **Las monedas se ven:** en la tabla del mar, a la derecha del puntaje de cada jugador (la foto del servidor manda la 4.ª columna en `caps`), y en tu panel ("Monedas malditas 2 / 3", solo si tenés alguna; vale también en el modo solo).
- **Cuando zarpa un galeón y alguien tiene una moneda menos de las necesarias**, además del aviso de siempre ("¡Flota del tesoro! …") sale "A {nombre} le falta UNA moneda para desatar la maldición del Kraken".
- **Deuda saldada:** si el Kraken hunde el barco insignia del capitán que lo despertó, se vuelve a lo profundo y todo el mar lee "{nombre} saldó su deuda con el Kraken" (`hundir` en `src/juego.js`, con `kraken.invocador`). Si el que lo despertó se va del mar, el Kraken sigue (no se cambió; queda para decidir).
- **Ocho ataques** en lugar de uno (del documento de Nicolás). Cada vez que le toca elige uno al azar según `KRAKEN.pesos`:
  - **Zona marcada**, la de siempre.
  - **Lluvia de zonas:** 6 zonas chicas en línea, círculo o espiral que se llenan una detrás de otra.
  - **Barrido:** una franja en arco alrededor suyo que se llena en el sentido en que va a barrer; se esquiva saliendo hacia afuera o hacia el Kraken.
  - **Chorro de agua:** una línea desde la boca que se llena desde el Kraken; pega y arrastra al barco.
  - **Agarre:** un círculo chico que se cierra sobre un barco; si no sale, el tentáculo lo agarra 6 s, no se mueve y pierde casco de a poco. Los aliados (otros capitanes o tu flota) cortan el tentáculo a cañonazos; las balas del barco agarrado no lo cortan. Se ve la vida del tentáculo.
  - **Nube de tinta:** una mancha negra cerca del barco que tapa lo que hay debajo durante 9 s.
  - **Mirada fija:** clava los ojos en un barco 8 s y todos los ataques van a ese. Se corta si ese barco se mete en la tinta o si los demás le sacan el 3 % de la vida (distraerlo).
  - **Buceo:** se sumerge (no se le puede pegar), deja un remolino de 4,5 s que arrastra al centro y sale cerca del capitán más cercano.
- **Furia** (por debajo del 40 %): hasta 3 ataques a la vez, avisos 15 % más cortos, más seguido, a veces dos ataques distintos juntos (`combinadoFuria`), dos tentáculos más y los ojos encendidos.
- Todos los números nuevos en `KRAKEN` (`src/config.js`): `pesos`, `lluvia`, `barrido`, `chorro`, `agarre`, `tinta`, `mirada`, `buceo`, `maxAtaques`, `combinadoFuria`.
- **En línea:** la foto `kr` suma al final los ataques (`ataquesAFoto` / `ataquesDeFoto` en `src/juego.js`), la mirada, el radio de cada zona y el buceo.
- **Pruebas nuevas** en `scripts/probar-kraken.mjs`: monedas (evento, aviso a todos, aviso del 3.er galeón), deuda saldada, lluvia en secuencia, barrido dentro y fuera de la franja, chorro que pega y empuja, agarre que inmoviliza y un aliado que corta el tentáculo, mirada que se corta con la tinta, buceo con remolino sin recibir daño, los ataques que van y vuelven por la foto, y que los ocho salgan en 4 minutos de pelea enfurecido. `probar-kraken-red.mjs`: el cliente ve el barrido igual que el servidor y la tabla trae las monedas. Las pruebas viejas fijan `k.forzar = 'zona'` porque son de la zona marcada.
- **Visto en el navegador:** moneda, barrido, chorro, agarre (con la barra del tentáculo), lluvia, mirada, tinta y furia. El remolino del buceo no llegué a verlo en pantalla (quedó fuera del cuadro), pero la prueba lo cubre.
- Ojo: en una de nueve corridas `probar-sim` falló "flota quieta (cuña)" por poco (441 px contra 400); no se repitió en otras cinco. Parece azar de esa prueba, no de este cambio.
- **A ajustar jugando:** los pesos de cada ataque, cuánto pegan el barrido (1,4 veces el borde de una zona) y el chorro, la vida del tentáculo (160), el empuje del chorro y la fuerza del remolino.

## 2026-11-15 (el Kraken) — Nicolás + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que el Kraken exista en línea; la web y la app ya lo tienen en el modo solo.**

Idea de Nicolás y Cristian: el que captura muchos galeones del tesoro queda tan fuerte que nadie lo puede hundir y juega hasta aburrirse; el Kraken es la maldición que le pone dificultad. Diseño aprobado por los dos en una página aparte (cuatro vueltas: rosado, más monstruo, muerte animada y, al final, criatura natural con ventosas y dos ojos enormes, siguiendo el documento de Nicolás).

- **La maldición** (`marcaTesoro` en `src/juego.js`): cada galeón del tesoro que un capitán hunde le deja una marca (desde el cambio de Cristian del 13/11 el galeón ya no se aborda; si vuelve a abordarse, capturarlo también cuenta). Con 2 se le avisa ("Si hundís 1 más, cuidado: puede despertar el Kraken"); con la 3.ª despierta cerca suyo, se hace de noche y hay tormenta, y se le avisa a todo el mar. Si ya hay un Kraken, el siguiente espera a que ese se vaya.
- **El combate:** emerge en 5 s (no pega ni recibe daño hasta casi terminar), persigue al capitán más cercano, su cuerpo no se atraviesa. Ataque principal: **zona marcada** sobre un barco a su alcance (prefiere capitanes y flotas, pero pega a todo barco que quede adentro, bots incluidos). Aviso 1,3 s (+0,15 bergantín, +0,45 galeón, que giran más lento); el golpe saca 22 % de la vida máxima en el centro y 11 % en el borde (mínimo 90 y 45). Después el tentáculo queda atravesado 0,9 s. Por debajo del 40 % se enfurece: dos zonas a la vez, aviso 15 % más corto, ataques más seguidos. Solo le pegan los cañones de capitanes y flotas.
- **Vida y botín:** 12.000 con un capitán, +60 % por cada capitán más. Muere con animación (se retuerce, tinta, gira, se hunde) y a los 4 s deja 6.000 de oro en 16 cofres, para el que los junte. El último cañonazo cuenta como hundido. Si 25 s nadie se le acerca (o todos están en el puerto), vuelve a lo profundo.
- **Todos los números** en `KRAKEN` (`src/config.js`), para ajustar el balance sin tocar la lógica.
- **Dibujo** (`src/kraken-dibujo.js`): el de la página de diseño, a escala del mar. La barra rosa vieja arriba (`#hud-kraken`), debajo de la del tesoro si las dos están. La tormenta: oscuridad, lluvia y relámpagos, que llegan y se van de a poco.
- **Sonido** (`src/sonido.js`, generado como el resto, sin archivos): rugido al despertar (se oye en todo el mar), gruñido y burbujas al marcar zona, latigazo + golpe + madera al pegar, chillido cuando le pegan, rugido largo y burbujas al morir; lluvia y ventarrón de fondo y un trueno con cada relámpago.
- **En línea:** lo decide todo el servidor y manda `kr` en cada foto (posición, vida, zonas); el cliente solo dibuja y hace correr los relojes entre foto y foto. Un servidor anterior no lo manda y no pasa nada.
- **Pruebas:** `scripts/probar-kraken.mjs` (maldición, lugar en los 20 mapas, zona centro/borde/afuera, esquivar con un galeón a toda vela, golpe a bots, cañones, furia, muerte y oro, que se vaya, vida con dos capitanes) y `scripts/probar-kraken-red.mjs` (servidor contra cliente: lo ven en el mismo lugar, la zona igual, el daño, la muerte). Probado en la app sin sonido con capturas de la zona, el golpe y la muerte; los sonidos medidos sin parlantes.
- **Quedó para después** (del documento de Nicolás): barrido en arco, agarre que los aliados cortan a cañonazos, lluvia de zonas, remolino al sumergirse, nube de tinta, chorro de agua, mirada fija, tentáculos y ojos con vida propia (cegar un ojo desvía las zonas), consecuencias en el barco (velas rotas, agua), ataque distinto a barcos grandes y chicos, trofeo cosmético, aviso previo con niebla y gaviotas, música de combate.
- **A ajustar a ojo jugando:** cuánto dura la pelea (vida 12.000), si el aviso de 1,3 s alcanza para una balandra o un bergantín, cuánto pega, cada cuánto marca zonas y si 6.000 de oro es "mucho mucho".
## 2026-11-13 (tesoro sin abordaje, flota que junta oro, mosquetes contra tritones, bots que pierden gente) — Cristian + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea también rija.** En modo solo y en salas locales ya anda todo.

- **El galeón del tesoro no se aborda nunca** (pedido de Cristian): hay que hundir a los guardias y después hundirlo a él. El gancho que lo toca se suelta con el aviso "El galeón del tesoro no se aborda: hundilo a cañonazos", y la ayuda de F ya no lo ofrece (`actualizarGancho` y `barcoBajo` en `src/juego.js`). La lámina del tesoro de la guía lo dice (texto y sus 7 traducciones).
- **La flota junta el oro que está a la vista:** cuando no está peleando, cada barco capturado va al cofre flotante más cercano dentro de 650 del barco del jugador (`VISTA_ORO`) que no tenga otro barco de la flota más cerca, lo levanta y vuelve a su lugar. Vale para las dos órdenes (seguir y atacar) y todas las formaciones (`cofreParaEscolta` en `iaEscolta`).
- **La tripulación les tira con mosquetes a los tritones:** tu barco y los de tu flota, solos, a los que están a menos de 280 de la borda (`MOSQUETES` y `mosquetes()` en `src/juego.js`). Con más gente en cubierta tiran más seguido; aciertan un 65 %. Bajan cerca de la mitad de una ola; el resto sigue siendo con cañonazos. Se ve un humito y un salpicón y suena un chasquido (evento nuevo `'m'`; un navegador viejo lo ignora sin romperse).
- **A los bots el casco castigado también les baja la gente:** además de la baja al azar por bala (que sigue igual para todos), cada punto de casco que pierde un bot se lleva su parte de la tripulación (`BAJAS_CASCO = 0.75`: con el 60 % del casco perdido le queda cerca de la mitad de la gente). Así un bot castigado es más fácil de abordar. **A los barcos de los jugadores no se les cambió nada.**
- **Pruebas nuevas** en `scripts/probar-sim.mjs`: el tesoro sin guardias no se puede abordar y avisa; la flota junta los cofres a la vista, no va a uno lejano y vuelve a su lugar; los mosquetes bajan al menos un tercio de 10 olas de tritones (sin bajarlos a todos); un bot con el 60 % del casco perdido queda con 40-65 % de la gente. También se probó en el navegador (localhost): 5 tritones abatidos sin perder marineros y la flota levantando un cofre.
- Pendiente / a decidir: los números (alcance y cadencia de los mosquetes, `BAJAS_CASCO`, `VISTA_ORO`) salieron a ojo; si se juega distinto de lo esperado, se tocan ahí. Nadie lo jugó todavía en línea.

## 2026-11-15 (la flota no hunde al barco que estás abordando) — Nicolás + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea también rija.**

- **Problema (Nicolás):** con 4 barcos en la flota al ataque, abordó otro para sumarlo y su propia flota se lo hundió durante el abordaje.
- **Arreglo (`abordandoMiJefe` en `src/juego.js`):** mientras el gancho de tu capitán tiene agarrado un barco, tu flota no lo elige como blanco (`masCercano`) y sus balas lo atraviesan sin daño (`moverBalas`). Tus propios cañones sí le pegan, por si lo querés hundir igual. Antes de que el gancho llegue (vuelo) no hay protección.
- **Ojo, no cambia:** con la flota llena, el abordaje ganado saquea y hunde el barco a propósito ("Flota llena: lo saqueaste y lo hundiste"). Para sumarlo hay que agrandar la flota en el puerto (empieza en 2, máximo 6).
- **Prueba nueva** en `scripts/probar-sim.mjs` ("abordaje con flota"): 4 barcos al ataque al lado de un barco que abordás → se captura; sin abordaje, la misma flota lo hunde. Con el código anterior fallaba.

## 2026-11-15 (los tritones ya no cruzan la tierra) — Nicolás + Claude

**Estado: subido a `main`. EL SERVIDOR HAY QUE REPUBLICARLO (lo hace Nicolás) para que en línea también rija.**

- **Problema (captura de Nicolás):** los tritones iban en línea recta al barco y cruzaban islas y costas caminando.
- **Arreglo (`actualizarTritones` en `src/juego.js`):** salen solo del agua (`enTierra`); si se meten en la costa quedan en la orilla y la bordean hacia el lado del barco; entre dos tierras pegadas, si el empujón los mete en otra, se quedan donde estaban; trabados más de 10 s contra la costa (caleta sin salida) se sumergen y desaparecen.
- **Prueba nueva** en `scripts/probar-sim.mjs` ("tritones"): en los 20 mapas, 8 tritones del otro lado de una isla suelta durante 25 s; ninguno pisa tierra y al menos 4 la rodean y llegan al barco. Con el código anterior fallaba en los 20 mapas.

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
