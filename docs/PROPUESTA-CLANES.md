# Clanes, guerras y clasificatorias — propuesta (17/11/2026)

Propuesta para revisar antes de programar. Nada de esto está hecho todavía.

## 1. Lo que hay hoy y condiciona el diseño

| Pieza | Cómo está hecha | Qué implica |
|---|---|---|
| **Usuarios** | Login con Google en Supabase; tabla `perfiles` (nombre público, estadísticas, mejor saqueo). En la app de escritorio no hay cuentas hasta el login con Steam. | Clanes y clasificatorias exigen cuenta. En la app hay que esperar el login con Steam (o abrir Google desde la app) para que se pueda entrar a un clan. |
| **Amigos** | **No existen.** Las "salas" se comparten con un código. | Hay que hacer la lista de amigos (pedidos de amistad + búsqueda por nombre) antes o junto con las invitaciones a clanes. |
| **Saqueos** | El navegador informa al terminar o al entrar al puerto (`registrar_progreso`), con topes desde el 16/11. | Para que el oro del clan y las clasificatorias sean confiables, **el oro de las partidas online lo tiene que informar el servidor**, no el navegador. |
| **Online** | Un servidor (Cloudflare, un "objeto" por mar o sala) corre la simulación y manda fotos 20 veces por segundo. El jugador entra con un nombre escrito, **sin cuenta**. | El servidor tiene que saber quién es cada jugador (verificar su sesión de Supabase al entrar). Es la base de todo lo demás. |
| **Equipos** | Cada civilización es un equipo (`equipoDe`): no se dañan entre sí. | En una guerra, el equipo pasa a ser el clan: se reutiliza tal cual, sin tocar la lógica de daño. |
| **Oro y mejoras** | Viven solo durante la partida. Al hundirte volvés al puerto con el barco base, sin oro ni mejoras. | En guerras y clasificatorias cambia la regla: reaparecés con tus mejoras y perdés solo parte del oro (lo pide el punto 6). |
| **Galeón del tesoro** | Sale cada 200–260 s al azar, con 4 guardias, rumbo al puerto. Tres galeones despiertan al Kraken. | En guerra se usa una versión aparte: 2 veces por partida, en horario fijo, en el centro, con mejora temporal para el clan que lo hunde. |
| **Kraken** | Lo despierta quien junta 3 monedas del tesoro maldito. | Una regla nueva `kraken: false` lo apaga en guerras y clasificatorias. |
| **Puerto** | Uno solo, en el centro del mapa. | Las guerras necesitan un puerto por bando y una zona neutral al medio: mapas de guerra con dos puertos. |

## 2. Datos (Supabase)

Todo se escribe solo a través de funciones del servidor de base de datos (como hoy `registrar_progreso`), que controlan cargo, pertenencia y límites. Nadie escribe tablas directo.

**Jugadores y amigos**
- `perfiles` (existe): se agregan `skin_activa` e `insignia_temporada`.
- `amigos (usuario_a, usuario_b, estado: pedido|amigos, creado)`.

**Clanes**
- `clanes (id, nombre único, tag 2–5 letras único, descripcion, emblema jsonb, color, ingreso: abierto|solicitud|cerrado, max_miembros 30, oro_total, creado)`.
  - El emblema es un diseño, no una imagen subida: forma de bandera, 2–3 colores y un símbolo naval de una lista (ancla, timón, calavera, ballena, rosa de los vientos…). Así se dibuja igual en el juego, en la bandera del barco y en el marcador, y nadie sube imágenes ofensivas.
- `clan_miembros (clan_id, usuario_id único, cargo 1–6, ingreso, oro_aportado)`. El usuario único garantiza un solo clan a la vez.
- `clan_estadias (clan_id, usuario_id, desde, hasta, oro_aportado)`: cada paso de alguien por el clan. Al irse, su aporte queda acá en el historial y deja de sumar; si vuelve, empieza una estadía nueva desde cero.
- `clan_invitaciones (id, clan_id, usuario_id, tipo: invitacion|solicitud, de_quien, estado, creado, vence +7 días)`.
- `clan_chat (id, clan_id, autor null = sistema, tipo, texto, fijado, borrado, creado)`. Llega en tiempo real con Supabase Realtime, que solo deja leer a los miembros.
- `clan_actividad`: los mensajes del sistema (entró, se fue, ascenso, resultado de guerra) quedan también como registro.

Cargos (1 = más alto): Almirante · Vicealmirante · Capitán · Teniente · Marinero · Grumete. Los permisos van en una sola tabla de reglas, así se ajustan sin tocar código. Si el Almirante se va, el mando pasa al de cargo más alto y, a igual cargo, al más antiguo.

**Oro**
- `oro_eventos (usuario_id, clan_id, oro, origen: solo|online|guerra|clasificatoria, creado)`: cada saqueo que se informa. De acá salen el aporte al clan (solo desde la fecha de ingreso), "clanes más saqueadores" y los filtros semanal y mensual. El ranking individual de saqueos que ya existe sigue igual.

**Guerras**
- `guerras (id, clan_a, clan_b, modo: versus|oro|zonas, por_bando 3|5, clasificatoria, estado: desafio|aceptada|jugando|terminada|cancelada, mapa, marcador_a, marcador_b, desempate_a, desempate_b, ganador, elo_antes/despues de cada clan, temporada_id, fechas)`.
- `guerra_jugadores (guerra_id, usuario_id, clan_id, bajas, hundido, oro, segundos_en_zonas)`.

**Clasificatorias y temporadas**
- `temporadas (id, nombre, inicio, fin, estado)`: duración configurable (3–4 meses).
- `elo_jugadores (usuario_id, temporada_id, elo, partidas, victorias, posicionamiento_restante)`.
- `elo_clanes (clan_id, temporada_id, elo, partidas, victorias, posicionamiento_restante)`.
- `partidas_clasificatorias (id, temporada_id, jugadores jsonb, resultado jsonb, fecha)`.
- `recompensas (temporada_id, rango, skin, bandera)` y `recompensas_obtenidas (temporada_id, usuario_id o clan_id, rango_final, elo_final)`: el historial que se ve en los perfiles.

**Quién informa los resultados:** el servidor del online, con una clave privada de Supabase guardada como secreto en Cloudflare (la cargás vos, nunca va al repo ni al chat). El ELO se calcula en la base de datos, en un solo lugar.

## 3. Servidor y juego

**Identidad (lo primero de todo):** al entrar online, el juego manda la sesión de Supabase; el servidor la verifica y sabe qué cuenta juega. Sin sesión se puede seguir jugando el mar libre como hoy, pero no guerras ni clasificatorias.

**Reglas de partida nuevas** (`j.reglas`, el mismo lugar donde hoy están viento y abordajes): `modo`, `kraken`, `bandos`, `duracion`, `reaparicion` (con mejoras y 30 % de oro), `escudo` (5 s, se corta al disparar). El mar libre y el modo solo siguen exactamente igual.

**Mapas de guerra:** los 20 mapas, con dos puertos (uno por bando, en lados opuestos) y una zona neutral marcada en el medio. Cerca de cada puerto hay cañones de costa: castigan al rival que se acerca y el puerto propio es zona segura.

**Objetos del servidor nuevos:**
- `guerra-<id>`: la sala de cada guerra. Solo entran los elegidos de cada clan, con su cuenta.
- `cola`: la fila de la Solo Queue, que junta jugadores de ELO parecido y abre una partida.

**Modos:**
- **Versus:** baja = hundir a un capitán del otro clan. Bajas repetidas: el mismo atacante contra la misma víctima en 2 minutos vale 1, ½ y después 0. Recompensa por racha: 3 o más hundidos sin morir le ponen una recompensa encima (+1 por cada 2 de racha). Efecto, sonido y punto en el marcador en cada baja.
- **Supremacía de Oro:** suma todo el oro que junta cada clan (bots, saqueos, galeón).
- **Dominio de Zonas:** 7 zonas en un mar de 7000 (5 en mapas con mucha tierra). Se captura con barcos adentro durante 10 s sin rivales; con barcos de los dos clanes la zona queda en disputa. Desempate: tiempo total de control. Sin galeón ni Kraken.
- **Galeón del tesoro tipo Drake (Versus y Oro):** a los 5 y a los 12 minutos, con aviso 60 s antes y cuenta regresiva. Sale en el centro, con guardias. El clan que lo hunde gana 2000 de oro (que suma al marcador en Supremacía) y +20 % de daño durante 90 s para todo el equipo.
- **Tiempo:** 15 minutos por guerra, configurable.

**Marcador estilo LoL:** una franja fija arriba al centro, con la bandera y el tag de cada clan en su color, el puntaje grande al medio y el tiempo debajo. En Zonas, además, una fila de banderitas con el color de cada zona. Se dibuja con el resto del HUD, con los mismos datos que ya llegan del servidor.

**Insignias:** un juego de íconos SVG propios, los 13 rangos y los 6 cargos, cada uno con forma y color distintos (galones, anclas, estrellas, laureles) para reconocerlos de un vistazo. Un solo archivo `src/insignias.js` los dibuja en todas partes: HUD, chat, rankings, perfiles y nombres sobre los barcos.

## 4. ELO y rangos

- ELO clásico, empieza en 1200, K = 40 en las 10 partidas de posicionamiento y K = 24 después. Se sube o se baja según el ELO del rival.
- En la Solo Queue con más de dos jugadores, cada jugador se compara con cada uno de los otros según en qué puesto terminó.
- **Rangos** (iguales para jugadores y clanes, con ELO y rankings aparte):

| Rango | ELO | Divisiones |
|---|---|---|
| Grumete | < 900 | — |
| Marinero | 900 | — |
| Cabo | 1000 | — |
| Suboficial | 1100 | — |
| Guardiamarina | 1200 | — |
| Alférez | 1300 | — |
| Teniente | 1400 | III · II · I |
| Capitán de Corbeta | 1550 | III · II · I |
| Capitán de Fragata | 1700 | III · II · I |
| Capitán de Navío | 1850 | III · II · I |
| Contraalmirante | 2000 | III · II · I |
| Almirante | 2200 | — |
| Gran Almirante | Los 10 mejores con 2200 o más | — |

- **Fin de temporada:** reinicio parcial, ELO nuevo = 1200 + (ELO − 1200) × 0,5, y 5 partidas de posicionamiento.

## 5. Recompensas de temporada

- Un **diseño de barco por rango y por temporada**, armado con el motor de arte que ya dibuja los barcos de cada civilización (colores del casco, velas, estandartes, dorados). Cuanto más alto el rango, más vistoso. No se vuelve a dar en otra temporada.
- Una bandera o insignia de temporada para el perfil.
- Lo mismo para los clanes: una bandera de temporada para el emblema.

## 6. Pantallas

- **Clan:** resumen (nombre, tag, emblema, color, Almirante, miembros, oro total, ELO, rango, puestos en los rankings) y pestañas Miembros · Chat · Guerras · Temporadas · Actividad.
- **Crear clan:** con un editor de emblema (forma, colores, símbolo) y vista previa en la vela del barco.
- **Perfil de otro jugador:** rango de Solo Queue, ELO, clan, cargo y temporadas con los barcos ganados.
- **Rankings:** Solo Queue · Clanes por ELO · Clanes más saqueadores · Saqueadores (el de hoy). Cada uno con temporada actual e históricos, y semanal y mensual donde aplique.
- **Clasificatorias:** el botón de la fila con tiempo de espera, la temporada actual y cuánto falta para que termine.
- **Todo en los 8 idiomas** del juego, en la web y en la app.

## 7. Etapas

Cada etapa se publica sola y funciona sin las siguientes. Lo que ya anda no cambia.

| # | Etapa | Qué queda andando |
|---|---|---|
| 0 | **Cimientos** | El servidor sabe qué cuenta juega. El oro online lo informa el servidor (más confiable, también para la tabla de hoy). Tabla `oro_eventos`. Insignias SVG. Perfil público de otro jugador. |
| 1 | **Amigos y clanes** | Lista de amigos y búsqueda. Crear clan con emblema y color, cargos, invitaciones y solicitudes (que vencen a los 7 días), abrir, cerrar o por solicitud, irse y traspaso de mando, oro aportado desde el ingreso, pantalla del clan, rankings "Clanes más saqueadores" y de miembros. |
| 2 | **Chat del clan** | Tiempo real, insignias junto a cada nombre, mensajes del sistema, fijar y borrar. |
| 3 | **Motor de guerra + Versus** | Mapas con dos puertos y cañones de costa, escudo de reaparición, reaparecer con mejoras, sin Kraken, marcador estilo LoL, bajas con antiabuso y recompensa por racha. Se prueba con bots haciendo de jugadores. |
| 4 | **Guerra de clanes completa** | Desafiar, aceptar, elegir modo, 3 vs 3 o 5 vs 5 y quiénes juegan, sala de guerra, galeón tipo Drake, Supremacía de Oro, Dominio de Zonas e historial de guerras. |
| 5–7 | *Reemplazadas por la sección 10 (ajuste del 17/11).* | |

## 8. Riesgos y cosas a tener en cuenta

- **Gente en la fila:** la Solo Queue y las guerras necesitan jugadores conectados al mismo tiempo. Hoy la tabla tiene 5 cuentas. Conviene publicar clanes y chat (etapas 1–2) primero, que funcionan con poca gente, y las colas cuando haya más jugadores.
- **La app sin cuentas:** hasta que llegue el login con Steam, en la app no se puede entrar a un clan.
- **Trampas:** con el servidor informando resultados (etapa 0), las guerras y la Solo Queue quedan protegidas. El modo solo sigue dependiendo del navegador y no cuenta para clasificatorias.
- **Moderación:** nombres de clan y chat entre desconocidos piden un filtro de palabras y la opción de reportar. Se propone sumarlos en la etapa 2.
- **Tamaño:** es el cambio más grande del juego hasta ahora. Cada etapa son varias sesiones de trabajo, con pruebas y revisión.

## 9. Decisiones que necesito

1. **Formato de la Solo Queue:** todos contra todos de 6 capitanes (propuesto), duelo 1 vs 1, o equipos al azar 3 vs 3.
2. **Tamaño de las guerras:** 3 vs 3 y 5 vs 5 (propuesto), o uno solo.
3. **Duración:** 15 minutos por guerra y por partida clasificatoria (propuesto).
4. **El nombre:** el pedido dice "Age of Navy"; el juego y el dominio son "Age of Navies". Se asume Age of Navies.
5. **Por dónde empezar:** etapas 0, 1 y 2 primero (propuesto), y las colas cuando haya más jugadores.

## 10. Ajuste del 17/11: tres clasificatorias, evento de clanes de fin de semana y recompensas por clasificatoria

### Qué está hecho y qué no

- **Hecho (sin publicar):** la base de datos de amigos, clanes, cargos, invitaciones, aportes de oro y chat (`supabase/migrations/20261117000000_clanes.sql`) y las insignias (`src/insignias.js`). Nada de eso cambia con este ajuste.
- **Sin empezar:** guerras, colas, ELO, temporadas y recompensas. El ajuste se aplica sobre el papel, así que no hay nada para deshacer.
- **Las insignias de rango sirven igual para las tres clasificatorias:** misma escala, del Grumete al Gran Almirante.

### Datos que cambian o se agregan

**ELO, uno por clasificatoria**
- `elo_jugadores (usuario_id, cola: solo|flota, temporada_id, elo, partidas, victorias, posicionamiento_restante)`, con clave (usuario, cola, temporada). Un jugador tiene dos filas por temporada: Solo Queue y Flota.
- `elo_clanes (clan_id, temporada_id, elo, partidas, victorias, posicionamiento_restante)`: solo se mueve en el evento de fin de semana.
- El Gran Almirante sale de los 10 mejores **de cada clasificatoria** por separado.

**Grupos de Flota**
- Los grupos son de 2 a 5 jugadores (amigos o no, del mismo clan o no) y viven en el servidor de colas mientras están armados: se crean, se invita, se marca "listo" y se entra a la cola. No hace falta guardarlos en la base de datos; si alguien cierra el juego, sale del grupo.
- La invitación al grupo le llega al amigo en tiempo real (Supabase Realtime, un canal por jugador).
- `partidas_clasificatorias (id, cola: solo|flota, temporada_id, modo, equipos jsonb, resultado jsonb, fecha)`: queda guardado quién jugó con quién, el resultado y cuánto ELO movió cada uno.

**Emparejamiento de Flota**
- Equipos del mismo tamaño (5 vs 5, 3 vs 3…). Primero se cruzan grupos armados de tamaño parecido y los lugares que faltan se completan con jugadores sueltos.
- El ELO de un equipo es el promedio de sus jugadores, con un pequeño recargo a los grupos armados (juegan mejor coordinados).
- Cada jugador gana o pierde según el promedio del equipo rival.
- Modo: Versus por defecto (ver decisiones).

**Evento de clanes de fin de semana**
- `eventos_clanes (id, temporada_id, inscripcion_desde, abre, cierra, estado: proximo|inscripcion|abierto|cerrado, ajustes jsonb)`. Por defecto abre el sábado 00:00 y cierra el domingo 23:59, hora de Argentina; se configura en `ajustes`.
- `evento_inscripciones (evento_id, clan_id, por_bando 3|5, alineacion uuid[], suplentes uuid[], inscripto_por, creado)`. Durante la semana el clan se inscribe y arma su alineación; solo los cargos que pueden elegir participantes la cambian.
- `guerras` suma `evento_id`. Las guerras con `evento_id` son las únicas que mueven el ELO del clan.
- `evento_resultados (evento_id, clan_id, posicion, victorias, derrotas, elo_antes, elo_despues, rango_antes, rango_despues)`: el resumen que se muestra al cerrar.
- Apertura y cierre: una tarea programada en la base de datos (pg_cron, como el aviso por mail de BoxBox) cambia el estado, deja el mensaje en el chat de cada clan inscripto y arma el resumen al cerrar. En el juego, un cartel con la cuenta regresiva y el aviso cuando se abre.

**Temporadas y recompensas por clasificatoria**
- `temporadas` suma `ajustes jsonb`: duración, reinicio, mínimo de guerras para la recompensa del clan y horario del evento.
- `recompensas (id, temporada_id, cola: solo|flota|clanes, rango_desde, tipo, datos jsonb)`. Los tipos:
  - **Solo Queue:** `skin`, el diseño del barco.
  - **Flota:** `velas`, `estela` y `canonazo`.
  - **Clanes:** para el clan, `emblema_animado` y `marco`; para los miembros, `mascaron`.
- `recompensas_obtenidas (temporada_id, cola, usuario_id o clan_id, rango_final, elo_final, recompensa_id)`. Para la recompensa de clan, el miembro tiene que haber jugado el mínimo de guerras de la temporada, que se cuenta en `guerra_jugadores`.
- `perfiles` suma qué recompensa usa cada uno: `skin`, `velas`, `estela`, `canonazo` y `mascaron`. El juego las dibuja con el mismo motor de arte de los barcos.

### Perfil y rankings
- **Perfil:** los tres rangos con su insignia y ELO (Solo Queue, Flota y el del clan), y el historial de temporadas por clasificatoria con lo que ganó en cada una.
- **Junto al nombre:** sigue la insignia de Solo Queue.
- **Rankings:** Solo Queue · Flota · Clanes por ELO · Clanes más saqueadores · Saqueadores.

### Servidor del juego
- Un servidor de colas (`colas`) con tres filas: Solo Queue, Flota con grupos, y guerras del evento (solo abierta durante el fin de semana).
- Las salas de partida son las mismas para los tres. Cambian solo las reglas (bandos, modo, sin Kraken) y a quién se le informa el resultado.

### Etapas, nuevo orden (las 0 a 4 no cambian)

| # | Etapa | Qué queda andando |
|---|---|---|
| 5 | **Solo Queue** | Fila, emparejamiento, ELO personal, rangos e insignia junto al nombre |
| 6 | **Flota** | Grupos con amigos, invitación en tiempo real, emparejamiento por tamaño y nivel, ELO de Flota |
| 7 | **Evento de clanes** | Inscripción y alineación durante la semana, cuenta regresiva, apertura con aviso, guerras clasificatorias del fin de semana, resumen al cerrar |
| 8 | **Temporadas y recompensas** | Cierre de temporada con reinicio parcial, recompensas de cada clasificatoria (barcos, velas, estelas, cañonazos, mascarones, emblemas animados y marcos), historial en perfiles y rankings de temporada |

### Decisiones nuevas
1. **Modo de la Flota:** Versus siempre (propuesto), o un modo al azar entre los tres de guerra.
2. **Formato del evento de clanes:** fila continua todo el fin de semana (propuesto: cada clan busca guerra cuando tiene a su alineación conectada y se empareja con el ELO más cercano; puesto final según victorias), o llaves de 8 clanes con horarios fijos, como el Clash del LoL. Las llaves piden que los 8 clanes estén a la misma hora, y con poca gente es difícil.
3. **Guerras amistosas entre semana:** sin ELO, para practicar (propuesto), o nada fuera del evento.
4. **Mínimo de guerras para la recompensa del clan:** 3 por temporada (propuesto).

### Decidido por Nicolás (17/11)
1. Solo Queue y Flota: siempre Versus.
2. Guerras de clanes: en un desafío directo, los dos clanes eligen el modo; en la fila abierta del evento, el modo rota cada fin de semana (Versus → Supremacía de Oro → Dominio de Zonas).
3. Evento de clanes: fila abierta continua, del sábado 15:00 al domingo 21:00 (hora de Argentina, configurable). Sin llaves.
4. Guerras amistosas entre clanes durante la semana, sin ELO: sí.
5. Mínimo para la recompensa del clan: 3 guerras jugadas en la temporada.
6. Insignias de rangos y de cargos: quedan como están.
7. Emblemas: muy personalizables, por capas (forma + fondo + patrón + símbolo + borde), con muchas formas, patrones y símbolos, color libre en cada capa y vista previa en tiempo real. Se guarda como `{ forma, fondo, patron, cPatron, simbolo, cSimbolo, borde, cBorde }`; la base de datos solo controla el formato (nombres cortos y colores válidos) y el juego dibuja lo que conoce (lo desconocido cae en uno por defecto), así se pueden sumar formas y símbolos sin tocar la base de datos.
