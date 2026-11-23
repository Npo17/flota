-- Guerras de clanes (19/11/2026). Etapa 4 de docs/PROPUESTA-CLANES.md.
--  * Amistosas: cualquier día, sin ELO. Un Capitán o más desafía a otro clan (modo y 3 vs 3 o 5 vs 5); un Capitán o más del
--    otro clan acepta; cada clan arma su alineación y los elegidos entran a la sala de la guerra (código G + id).
--  * Evento de fin de semana: del sábado 15:00 al domingo 21:00 (hora de Argentina; se cambia en temporadas.ajustes). Los
--    clanes se inscriben con su alineación durante la semana. Con el evento abierto, "Buscar guerra" los cruza con el clan
--    inscripto de ELO más parecido que también esté buscando. El modo rota cada fin de semana. Solo estas guerras mueven el
--    ELO del clan.
--  * El resultado lo informa el servidor del juego (con su clave), nunca el navegador.
-- El evento se abre y se cierra solo, por horario: la primera consulta después de abrir deja el aviso en el chat de cada
-- clan inscripto (no hace falta una tarea programada).

-- ---------- Temporadas (la etapa 6 suma recompensas y cierre) ----------
create table if not exists public.temporadas (
  id integer primary key,
  nombre text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  ajustes jsonb not null default '{}'   -- evento: { dia_abre (0=domingo…6=sábado), hora_abre, dia_cierra, hora_cierra, zona }, min_guerras, …
);
alter table public.temporadas enable row level security;
create policy "temporadas visibles" on public.temporadas for select using (true);
revoke insert, update, delete on public.temporadas from anon, authenticated;
grant select on public.temporadas to anon, authenticated;
insert into public.temporadas (id, nombre, inicio, fin, ajustes) values
  (1, 'Temporada 1', '2026-11-01 00:00-03', '2027-03-01 00:00-03',
   '{"evento": {"dia_abre": 6, "hora_abre": 15, "dia_cierra": 0, "hora_cierra": 21, "zona": "America/Argentina/Buenos_Aires"}, "min_guerras": 3, "duracion_guerra": 900}')
on conflict (id) do nothing;

create or replace function public.temporada_actual() returns public.temporadas
language sql stable security definer set search_path = public as $$
  select * from public.temporadas where now() >= inicio order by inicio desc limit 1
$$;

-- ---------- ELO de los clanes (por temporada) ----------
create table if not exists public.elo_clanes (
  clan_id bigint not null references public.clanes (id) on delete cascade,
  temporada_id integer not null references public.temporadas (id),
  elo integer not null default 1200,
  partidas integer not null default 0,
  victorias integer not null default 0,
  derrotas integer not null default 0,
  posicionamiento integer not null default 10,  -- partidas de posicionamiento que le quedan (ELO se mueve más)
  primary key (clan_id, temporada_id)
);
alter table public.elo_clanes enable row level security;
create policy "elo de clanes visible" on public.elo_clanes for select using (true);
revoke insert, update, delete on public.elo_clanes from anon, authenticated;
grant select on public.elo_clanes to anon, authenticated;

-- ---------- Eventos de fin de semana ----------
create table if not exists public.eventos_clanes (
  id integer primary key,                 -- semana: días desde el 1/1/2026 / 7
  temporada_id integer references public.temporadas (id),
  abre timestamptz not null,
  cierra timestamptz not null,
  modo text not null,
  avisado boolean not null default false
);
alter table public.eventos_clanes enable row level security;
create policy "eventos visibles" on public.eventos_clanes for select using (true);
revoke insert, update, delete on public.eventos_clanes from anon, authenticated;
grant select on public.eventos_clanes to anon, authenticated;

create table if not exists public.evento_inscripciones (
  evento_id integer not null references public.eventos_clanes (id) on delete cascade,
  clan_id bigint not null references public.clanes (id) on delete cascade,
  por_bando integer not null check (por_bando in (3, 5)),
  alineacion uuid[] not null,
  inscripto_por uuid not null,
  buscando timestamptz,                   -- cuándo tocó "Buscar guerra" (vale 2 minutos)
  creado timestamptz not null default now(),
  primary key (evento_id, clan_id)
);
alter table public.evento_inscripciones enable row level security;
create policy "inscripciones visibles" on public.evento_inscripciones for select using (true);
revoke insert, update, delete on public.evento_inscripciones from anon, authenticated;
grant select on public.evento_inscripciones to anon, authenticated;

-- ---------- Guerras ----------
create table if not exists public.guerras (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('amistosa', 'evento')),
  evento_id integer references public.eventos_clanes (id),
  clan_a bigint not null references public.clanes (id) on delete cascade,
  clan_b bigint not null references public.clanes (id) on delete cascade,
  modo text not null check (modo in ('versus', 'oro', 'zonas')),
  por_bando integer not null check (por_bando in (3, 5)),
  mapa text not null,
  estado text not null default 'desafio' check (estado in ('desafio', 'aceptada', 'jugando', 'terminada', 'cancelada', 'rechazada')),
  alineacion_a uuid[] not null default '{}',
  alineacion_b uuid[] not null default '{}',
  marcador_a numeric, marcador_b numeric, desempate_a numeric, desempate_b numeric,
  ganador bigint,
  elo_a_antes integer, elo_a_despues integer, elo_b_antes integer, elo_b_despues integer,
  desafiada_por uuid,
  creada timestamptz not null default now(),
  empezo timestamptz, termino timestamptz,
  check (clan_a <> clan_b)
);
create index if not exists guerras_clan_a on public.guerras (clan_a, creada desc);
create index if not exists guerras_clan_b on public.guerras (clan_b, creada desc);
create index if not exists guerras_evento on public.guerras (evento_id) where evento_id is not null;
alter table public.guerras enable row level security;
create policy "guerras visibles" on public.guerras for select using (true);
revoke insert, update, delete on public.guerras from anon, authenticated;
grant select on public.guerras to anon, authenticated;

create table if not exists public.guerra_jugadores (
  guerra_id bigint not null references public.guerras (id) on delete cascade,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  clan_id bigint not null,
  bajas numeric not null default 0,
  hundido integer not null default 0,
  oro integer not null default 0,
  primary key (guerra_id, usuario_id)
);
alter table public.guerra_jugadores enable row level security;
create policy "jugadores de guerras visibles" on public.guerra_jugadores for select using (true);
revoke insert, update, delete on public.guerra_jugadores from anon, authenticated;
grant select on public.guerra_jugadores to anon, authenticated;

-- ---------- El evento de la semana: se arma solo por horario ----------
create or replace function public._evento_de(p_cuando timestamptz) returns public.eventos_clanes
language plpgsql security definer set search_path = public as $$
declare
  v_temp public.temporadas := public.temporada_actual();
  v_aj jsonb := coalesce(v_temp.ajustes -> 'evento', '{"dia_abre": 6, "hora_abre": 15, "dia_cierra": 0, "hora_cierra": 21, "zona": "America/Argentina/Buenos_Aires"}');
  v_zona text := coalesce(v_aj ->> 'zona', 'America/Argentina/Buenos_Aires');
  v_local timestamp := p_cuando at time zone v_zona;
  v_dia_abre integer := (v_aj ->> 'dia_abre')::integer;
  -- el sábado de esta "semana de evento" (de domingo a sábado, con el cierre el domingo siguiente)
  v_base date := (v_local::date - ((extract(dow from v_local)::integer - v_dia_abre + 7) % 7));
  v_abre timestamptz; v_cierra timestamptz; v_id integer; v_ev public.eventos_clanes;
begin
  v_abre := (v_base + make_interval(hours => (v_aj ->> 'hora_abre')::integer)) at time zone v_zona;
  v_cierra := (v_base + ((((v_aj ->> 'dia_cierra')::integer - v_dia_abre + 7) % 7) * interval '1 day') + make_interval(hours => (v_aj ->> 'hora_cierra')::integer)) at time zone v_zona;
  if p_cuando >= v_cierra then  -- ya cerró el de esta semana: el próximo
    v_abre := v_abre + interval '7 days'; v_cierra := v_cierra + interval '7 days';
  end if;
  v_id := floor(extract(epoch from v_abre - '2026-01-03 15:00-03'::timestamptz) / 604800)::integer;
  insert into public.eventos_clanes (id, temporada_id, abre, cierra, modo)
    values (v_id, v_temp.id, v_abre, v_cierra, (array['versus', 'oro', 'zonas'])[1 + ((v_id % 3) + 3) % 3])
    on conflict (id) do nothing;
  select * into v_ev from public.eventos_clanes where id = v_id;
  return v_ev;
end $$;

-- El evento actual o el próximo, con su estado. Al abrir, la primera consulta avisa en el chat de los clanes inscriptos.
create or replace function public.evento_actual() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_ev public.eventos_clanes := public._evento_de(now()); v_abierto boolean; r record;
begin
  v_abierto := now() >= v_ev.abre and now() < v_ev.cierra;
  if v_abierto and not v_ev.avisado then
    update public.eventos_clanes set avisado = true where id = v_ev.id and not avisado;
    if found then
      for r in select clan_id from public.evento_inscripciones where evento_id = v_ev.id loop
        perform public._sistema(r.clan_id, 'evento_abre', jsonb_build_object('modo', v_ev.modo));
      end loop;
    end if;
  end if;
  return jsonb_build_object('id', v_ev.id, 'abre', v_ev.abre, 'cierra', v_ev.cierra, 'modo', v_ev.modo, 'abierto', v_abierto, 'ahora', now(),
    'temporada', (select jsonb_build_object('id', id, 'nombre', nombre, 'fin', fin) from public.temporada_actual()));
end $$;

-- ---------- Ayudas ----------
create or replace function public._mi_miembro(p_cargo_max integer, p_mensaje text) returns public.clan_miembros
language plpgsql stable security definer set search_path = public as $$
declare v_m public.clan_miembros;
begin
  select * into v_m from public.clan_miembros where usuario_id = public._yo();
  if not found then raise exception 'No estás en ningún clan.'; end if;
  if v_m.cargo > p_cargo_max then raise exception '%', p_mensaje; end if;
  return v_m;
end $$;

create or replace function public._validar_alineacion(p_clan bigint, p_alineacion uuid[], p_por_bando integer) returns uuid[]
language plpgsql stable security definer set search_path = public as $$
declare v uuid[];
begin
  select array_agg(distinct u) into v from unnest(coalesce(p_alineacion, '{}')) u
    where exists (select 1 from public.clan_miembros m where m.usuario_id = u and m.clan_id = p_clan);
  if coalesce(array_length(v, 1), 0) = 0 then raise exception 'Elegí al menos un miembro del clan para la alineación.'; end if;
  if array_length(v, 1) > p_por_bando then raise exception 'La alineación tiene más jugadores de los que entran.'; end if;
  return v;
end $$;

create or replace function public._elo_clan(p_clan bigint, p_temp integer) returns public.elo_clanes
language plpgsql security definer set search_path = public as $$
declare v public.elo_clanes;
begin
  insert into public.elo_clanes (clan_id, temporada_id) values (p_clan, p_temp) on conflict do nothing;
  select * into v from public.elo_clanes where clan_id = p_clan and temporada_id = p_temp;
  return v;
end $$;

create or replace function public._mapa_guerra(p_id bigint) returns text
language sql immutable as $$
  select (array['lepanto','gibraltar','cadiz','gravelinas','oresund','bosforo','malta','venecia','cartagena','portroyal','tortuga','habana','magallanes','buenaesperanza','molucas','noryang','nagasaki','kealakekua','nuevazembla','riodelaplata'])[1 + (p_id % 20)::integer]
$$;

-- ---------- Amistosas ----------
create or replace function public.guerra_desafiar(p_clan bigint, p_modo text, p_por_bando integer) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para desafiar hay que ser Capitán o más.'); v_id bigint;
begin
  if p_modo not in ('versus', 'oro', 'zonas') then raise exception 'Ese modo de guerra no existe.'; end if;
  if p_por_bando not in (3, 5) then raise exception 'Las guerras son de 3 contra 3 o de 5 contra 5.'; end if;
  if p_clan = v_m.clan_id or not exists (select 1 from public.clanes where id = p_clan) then raise exception 'Ese clan no se puede desafiar.'; end if;
  if exists (select 1 from public.guerras where estado in ('desafio', 'aceptada', 'jugando') and tipo = 'amistosa'
      and ((clan_a = v_m.clan_id and clan_b = p_clan) or (clan_a = p_clan and clan_b = v_m.clan_id))) then
    raise exception 'Ya hay una guerra pendiente con ese clan.'; end if;
  insert into public.guerras (tipo, clan_a, clan_b, modo, por_bando, mapa, desafiada_por) values ('amistosa', v_m.clan_id, p_clan, p_modo, p_por_bando, 'lepanto', public._yo())
    returning id into v_id;
  update public.guerras set mapa = public._mapa_guerra(v_id) where id = v_id;
  perform public._sistema(p_clan, 'desafio', jsonb_build_object('clan', (select nombre from public.clanes where id = v_m.clan_id), 'modo', p_modo, 'n', p_por_bando));
  return v_id;
end $$;

create or replace function public.guerra_responder(p_guerra bigint, p_aceptar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para responder desafíos hay que ser Capitán o más.'); v_g public.guerras;
begin
  select * into v_g from public.guerras where id = p_guerra for update;
  if not found or v_g.estado <> 'desafio' then raise exception 'Ese desafío ya no está pendiente.'; end if;
  if v_g.clan_b <> v_m.clan_id then raise exception 'Ese desafío no es para tu clan.'; end if;
  update public.guerras set estado = case when p_aceptar then 'aceptada' else 'rechazada' end where id = p_guerra;
  perform public._sistema(v_g.clan_a, case when p_aceptar then 'desafio_aceptado' else 'desafio_rechazado' end, jsonb_build_object('clan', (select nombre from public.clanes where id = v_g.clan_b)));
end $$;

-- Cancelar un desafío propio todavía no aceptado, o una guerra aceptada que nunca empezó
create or replace function public.guerra_cancelar(p_guerra bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para cancelar hay que ser Capitán o más.'); v_g public.guerras;
begin
  select * into v_g from public.guerras where id = p_guerra for update;
  if not found or v_g.estado not in ('desafio', 'aceptada') or v_m.clan_id not in (v_g.clan_a, v_g.clan_b) then raise exception 'Esa guerra no se puede cancelar.'; end if;
  update public.guerras set estado = 'cancelada' where id = p_guerra;
end $$;

-- La alineación de mi clan para una guerra aceptada (Capitán o más)
create or replace function public.guerra_alineacion(p_guerra bigint, p_alineacion uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para elegir la alineación hay que ser Capitán o más.'); v_g public.guerras; v uuid[];
begin
  select * into v_g from public.guerras where id = p_guerra for update;
  if not found or v_g.estado not in ('aceptada', 'jugando') or v_m.clan_id not in (v_g.clan_a, v_g.clan_b) then raise exception 'Esa guerra no admite cambios de alineación.'; end if;
  v := public._validar_alineacion(v_m.clan_id, p_alineacion, v_g.por_bando);
  if v_m.clan_id = v_g.clan_a then update public.guerras set alineacion_a = v where id = p_guerra;
  else update public.guerras set alineacion_b = v where id = p_guerra; end if;
end $$;

-- ---------- Evento de fin de semana ----------
create or replace function public.evento_inscribir(p_por_bando integer, p_alineacion uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para inscribir al clan hay que ser Capitán o más.'); v_ev public.eventos_clanes := public._evento_de(now()); v uuid[];
begin
  if p_por_bando not in (3, 5) then raise exception 'Las guerras son de 3 contra 3 o de 5 contra 5.'; end if;
  v := public._validar_alineacion(v_m.clan_id, p_alineacion, p_por_bando);
  insert into public.evento_inscripciones (evento_id, clan_id, por_bando, alineacion, inscripto_por) values (v_ev.id, v_m.clan_id, p_por_bando, v, public._yo())
    on conflict (evento_id, clan_id) do update set por_bando = excluded.por_bando, alineacion = excluded.alineacion, inscripto_por = excluded.inscripto_por;
end $$;

-- Buscar guerra en el evento abierto: se cruza con el clan inscripto (mismo tamaño) que también esté buscando y tenga el
-- ELO más parecido. Devuelve la guerra si la encontró, o null si quedó buscando (el navegador vuelve a preguntar).
create or replace function public.evento_buscar() returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_m public.clan_miembros := public._mi_miembro(3, 'Para buscar guerra hay que ser Capitán o más.');
  v_ev public.eventos_clanes := public._evento_de(now()); v_ins public.evento_inscripciones; v_otro public.evento_inscripciones;
  v_temp integer := (public.temporada_actual()).id; v_elo integer; v_id bigint;
begin
  if not (now() >= v_ev.abre and now() < v_ev.cierra) then raise exception 'La guerra de clanes no está abierta ahora.'; end if;
  select * into v_ins from public.evento_inscripciones where evento_id = v_ev.id and clan_id = v_m.clan_id for update;
  if not found then raise exception 'Tu clan no está inscripto en este evento.'; end if;
  -- ¿ya tiene una guerra del evento armada o en juego?
  select id into v_id from public.guerras where evento_id = v_ev.id and estado in ('aceptada', 'jugando') and v_m.clan_id in (clan_a, clan_b) limit 1;
  if v_id is not null then return v_id; end if;
  v_elo := (public._elo_clan(v_m.clan_id, v_temp)).elo;
  select i.* into v_otro from public.evento_inscripciones i
    where i.evento_id = v_ev.id and i.clan_id <> v_m.clan_id and i.por_bando = v_ins.por_bando and i.buscando > now() - interval '2 minutes'
      and not exists (select 1 from public.guerras g where g.evento_id = v_ev.id and g.estado in ('aceptada', 'jugando') and i.clan_id in (g.clan_a, g.clan_b))
    order by abs(coalesce((select e.elo from public.elo_clanes e where e.clan_id = i.clan_id and e.temporada_id = v_temp), 1200) - v_elo),
             (select count(*) from public.guerras g where g.evento_id = v_ev.id and ((g.clan_a = i.clan_id and g.clan_b = v_m.clan_id) or (g.clan_b = i.clan_id and g.clan_a = v_m.clan_id))),
             i.buscando
    limit 1 for update;
  if not found then
    update public.evento_inscripciones set buscando = now() where evento_id = v_ev.id and clan_id = v_m.clan_id;
    return null;
  end if;
  insert into public.guerras (tipo, evento_id, clan_a, clan_b, modo, por_bando, mapa, estado, alineacion_a, alineacion_b, desafiada_por)
    values ('evento', v_ev.id, v_otro.clan_id, v_m.clan_id, v_ev.modo, v_ins.por_bando, 'lepanto', 'aceptada', v_otro.alineacion, v_ins.alineacion, public._yo())
    returning id into v_id;
  update public.guerras set mapa = public._mapa_guerra(v_id) where id = v_id;
  update public.evento_inscripciones set buscando = null where evento_id = v_ev.id and clan_id in (v_m.clan_id, v_otro.clan_id);
  perform public._sistema(v_m.clan_id, 'guerra_encontrada', jsonb_build_object('clan', (select nombre from public.clanes where id = v_otro.clan_id)));
  perform public._sistema(v_otro.clan_id, 'guerra_encontrada', jsonb_build_object('clan', (select nombre from public.clanes where id = v_m.clan_id)));
  return v_id;
end $$;

create or replace function public.evento_dejar_de_buscar() returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros := public._mi_miembro(3, 'Para buscar guerra hay que ser Capitán o más.');
begin
  update public.evento_inscripciones set buscando = null where clan_id = v_m.clan_id and evento_id = (public._evento_de(now())).id;
end $$;

-- El resumen de un evento: posiciones (victorias, después ELO ganado), con los cambios de rango
create or replace function public.evento_resumen(p_evento integer) returns table (clan_id bigint, nombre text, tag text, emblema jsonb, color text, victorias integer, derrotas integer, elo_antes integer, elo_despues integer)
language sql stable security definer set search_path = public as $$
  with partes as (
    select g.id, g.clan_a as clan, g.ganador = g.clan_a as gano, g.ganador is not null and g.ganador <> g.clan_a as perdio, g.elo_a_antes as antes, g.elo_a_despues as despues, g.termino from public.guerras g where g.evento_id = p_evento and g.estado = 'terminada'
    union all
    select g.id, g.clan_b, g.ganador = g.clan_b, g.ganador is not null and g.ganador <> g.clan_b, g.elo_b_antes, g.elo_b_despues, g.termino from public.guerras g where g.evento_id = p_evento and g.estado = 'terminada'
  )
  select c.id, c.nombre, c.tag, c.emblema, c.color, count(*) filter (where p.gano)::integer, count(*) filter (where p.perdio)::integer,
    (array_agg(p.antes order by p.termino))[1], (array_agg(p.despues order by p.termino desc))[1]
  from partes p join public.clanes c on c.id = p.clan
  group by c.id order by 6 desc, (array_agg(p.despues order by p.termino desc))[1] - (array_agg(p.antes order by p.termino))[1] desc
$$;

-- ---------- Lo que pide y lo que informa el servidor del juego ----------
-- La sala de una guerra (código G + id en base 36) pide sus datos al entrar el primero
create or replace function public.servidor_guerra(p_clave text, p_guerra bigint) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean; v_g public.guerras; v_a public.clanes; v_b public.clanes;
begin
  select hash = encode(digest(coalesce(p_clave, ''), 'sha256'), 'hex') into v_ok from public.servidor_clave where id = 1;
  if not coalesce(v_ok, false) then raise exception 'No autorizado.'; end if;
  select * into v_g from public.guerras where id = p_guerra;
  if not found or v_g.estado not in ('aceptada', 'jugando') then return null; end if;
  if v_g.estado = 'aceptada' then update public.guerras set estado = 'jugando', empezo = now() where id = p_guerra; end if;
  select * into v_a from public.clanes where id = v_g.clan_a;
  select * into v_b from public.clanes where id = v_g.clan_b;
  return jsonb_build_object('id', v_g.id, 'tipo', v_g.tipo, 'modo', v_g.modo, 'por_bando', v_g.por_bando, 'mapa', v_g.mapa,
    'duracion', coalesce(((public.temporada_actual()).ajustes ->> 'duracion_guerra')::integer, 900),
    'bandos', jsonb_build_array(
      jsonb_build_object('clan', v_a.id, 'nombre', v_a.nombre, 'tag', v_a.tag, 'color', v_a.color, 'emblema', v_a.emblema, 'alineacion', to_jsonb(v_g.alineacion_a)),
      jsonb_build_object('clan', v_b.id, 'nombre', v_b.nombre, 'tag', v_b.tag, 'color', v_b.color, 'emblema', v_b.emblema, 'alineacion', to_jsonb(v_g.alineacion_b))));
end $$;

-- El final: marcador, desempate, quién ganó y lo de cada jugador. En las del evento, mueve el ELO de los dos clanes.
create or replace function public.servidor_guerra_fin(p_clave text, p_guerra bigint, p_datos jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ok boolean; v_g public.guerras; v_ganador bigint; v_temp integer := (public.temporada_actual()).id;
  v_ea public.elo_clanes; v_eb public.elo_clanes; v_esp double precision; v_ka integer; v_kb integer; v_ra double precision; v_na integer; v_nb integer; r jsonb;
begin
  select hash = encode(digest(coalesce(p_clave, ''), 'sha256'), 'hex') into v_ok from public.servidor_clave where id = 1;
  if not coalesce(v_ok, false) then raise exception 'No autorizado.'; end if;
  select * into v_g from public.guerras where id = p_guerra for update;
  if not found or v_g.estado = 'terminada' then return; end if;
  v_ganador := case p_datos ->> 'ganador' when 'A' then v_g.clan_a when 'B' then v_g.clan_b else null end;
  update public.guerras set estado = 'terminada', termino = now(), ganador = v_ganador,
    marcador_a = (p_datos -> 'marcador' ->> 'A')::numeric, marcador_b = (p_datos -> 'marcador' ->> 'B')::numeric,
    desempate_a = (p_datos -> 'control' ->> 'A')::numeric, desempate_b = (p_datos -> 'control' ->> 'B')::numeric
  where id = p_guerra;
  for r in select * from jsonb_array_elements(coalesce(p_datos -> 'jugadores', '[]')) loop
    begin
      insert into public.guerra_jugadores (guerra_id, usuario_id, clan_id, bajas, hundido, oro)
        values (p_guerra, (r ->> 'u')::uuid, case r ->> 'bando' when 'A' then v_g.clan_a else v_g.clan_b end,
          coalesce((r ->> 'bajas')::numeric, 0), coalesce((r ->> 'hundido')::integer, 0), coalesce((r ->> 'oro')::integer, 0))
        on conflict do nothing;
    exception when others then null; end;
  end loop;
  if v_g.tipo = 'evento' then
    v_ea := public._elo_clan(v_g.clan_a, v_temp); v_eb := public._elo_clan(v_g.clan_b, v_temp);
    v_esp := 1 / (1 + power(10, (v_eb.elo - v_ea.elo) / 400.0));
    v_ra := case when v_ganador = v_g.clan_a then 1 when v_ganador = v_g.clan_b then 0 else 0.5 end;
    v_ka := case when v_ea.posicionamiento > 0 then 40 else 24 end; v_kb := case when v_eb.posicionamiento > 0 then 40 else 24 end;
    v_na := round(v_ea.elo + v_ka * (v_ra - v_esp)); v_nb := round(v_eb.elo + v_kb * ((1 - v_ra) - (1 - v_esp)));
    update public.elo_clanes set elo = v_na, partidas = partidas + 1, victorias = victorias + (v_ra = 1)::integer, derrotas = derrotas + (v_ra = 0)::integer, posicionamiento = greatest(0, posicionamiento - 1)
      where clan_id = v_g.clan_a and temporada_id = v_temp;
    update public.elo_clanes set elo = v_nb, partidas = partidas + 1, victorias = victorias + (v_ra = 0)::integer, derrotas = derrotas + (v_ra = 1)::integer, posicionamiento = greatest(0, posicionamiento - 1)
      where clan_id = v_g.clan_b and temporada_id = v_temp;
    update public.guerras set elo_a_antes = v_ea.elo, elo_a_despues = v_na, elo_b_antes = v_eb.elo, elo_b_despues = v_nb where id = p_guerra;
  end if;
  perform public._sistema(v_g.clan_a, 'guerra_fin', jsonb_build_object('rival', (select nombre from public.clanes where id = v_g.clan_b), 'gano', v_ganador = v_g.clan_a, 'empate', v_ganador is null, 'marcador', format('%s - %s', p_datos -> 'marcador' ->> 'A', p_datos -> 'marcador' ->> 'B'), 'modo', v_g.modo));
  perform public._sistema(v_g.clan_b, 'guerra_fin', jsonb_build_object('rival', (select nombre from public.clanes where id = v_g.clan_a), 'gano', v_ganador = v_g.clan_b, 'empate', v_ganador is null, 'marcador', format('%s - %s', p_datos -> 'marcador' ->> 'B', p_datos -> 'marcador' ->> 'A'), 'modo', v_g.modo));
end $$;

-- ---------- Ranking de clanes por ELO de guerra (temporada actual) ----------
create or replace function public.ranking_clanes_elo() returns table (id bigint, nombre text, tag text, emblema jsonb, color text, elo integer, partidas integer, victorias integer)
language sql stable security definer set search_path = public as $$
  select c.id, c.nombre, c.tag, c.emblema, c.color, e.elo, e.partidas, e.victorias
  from public.elo_clanes e join public.clanes c on c.id = e.clan_id
  where e.temporada_id = (public.temporada_actual()).id and e.partidas > 0
  order by e.elo desc limit 50
$$;

-- ---------- Permisos ----------
revoke all on function public._evento_de(timestamptz), public._mi_miembro(integer, text), public._validar_alineacion(bigint, uuid[], integer), public._elo_clan(bigint, integer) from public, anon, authenticated;
revoke all on function public.guerra_desafiar(bigint, text, integer), public.guerra_responder(bigint, boolean), public.guerra_cancelar(bigint), public.guerra_alineacion(bigint, uuid[]),
  public.evento_inscribir(integer, uuid[]), public.evento_buscar(), public.evento_dejar_de_buscar() from public, anon;
grant execute on function public.guerra_desafiar(bigint, text, integer), public.guerra_responder(bigint, boolean), public.guerra_cancelar(bigint), public.guerra_alineacion(bigint, uuid[]),
  public.evento_inscribir(integer, uuid[]), public.evento_buscar(), public.evento_dejar_de_buscar() to authenticated;
grant execute on function public.evento_actual(), public.evento_resumen(integer), public.ranking_clanes_elo(), public.temporada_actual() to anon, authenticated;
revoke all on function public.servidor_guerra(text, bigint), public.servidor_guerra_fin(text, bigint, jsonb) from public;
grant execute on function public.servidor_guerra(text, bigint), public.servidor_guerra_fin(text, bigint, jsonb) to anon, authenticated;
