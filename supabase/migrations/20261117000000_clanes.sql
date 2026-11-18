-- Amigos, clanes, cargos, invitaciones, aportes de oro y chat del clan (17/11/2026). Etapas 1 y 2 de docs/PROPUESTA-CLANES.md.
-- Como en perfiles: todo se lee con permisos (RLS) y se escribe solo a través de las funciones de abajo, que controlan quién
-- puede hacer qué. Nadie escribe las tablas directo.
--
-- Cargos (1 = el más alto): 1 Almirante · 2 Vicealmirante · 3 Capitán · 4 Teniente · 5 Marinero · 6 Grumete.
--   invitar: Teniente o más · aceptar solicitudes, fijar y borrar mensajes: Capitán o más
--   expulsar, ascender y degradar: Vicealmirante (solo a los que están de Capitán para abajo, y hasta Capitán) y Almirante (a cualquiera)
--   editar el clan (descripción, emblema, color, ingreso): Vicealmirante o más
-- Los mensajes del sistema se guardan como clave + datos (no como texto armado) para que cada jugador los vea en su idioma.

-- ---------- Amigos ----------
create table public.amigos (
  a uuid not null references public.perfiles (id) on delete cascade,   -- siempre a < b: una sola fila por pareja
  b uuid not null references public.perfiles (id) on delete cascade,
  de uuid not null,                                                    -- quién pidió la amistad
  estado text not null check (estado in ('pedido', 'amigos')),
  creado timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index amigos_b on public.amigos (b);
alter table public.amigos enable row level security;
create policy "ver mis amistades" on public.amigos for select using (auth.uid() in (a, b));

-- ---------- Clanes ----------
create table public.clanes (
  id bigint generated always as identity primary key,
  nombre text not null,
  tag text not null,
  descripcion text not null default '',
  emblema jsonb not null,                  -- por capas { forma, fondo, patron, cPatron, simbolo, cSimbolo, borde, cBorde }: se dibuja en el juego, no es una imagen subida
  color text not null,                     -- el color del clan en la partida, el marcador y los nombres
  ingreso text not null default 'solicitud' check (ingreso in ('abierto', 'solicitud', 'cerrado')),
  max_miembros integer not null default 30,
  miembros integer not null default 0,
  oro_total bigint not null default 0,     -- lo que saquearon los miembros desde que entraron (incluye a los que se fueron)
  creado timestamptz not null default now()
);
create unique index clanes_nombre on public.clanes (lower(nombre));
create unique index clanes_tag on public.clanes (upper(tag));
create index clanes_oro on public.clanes (oro_total desc);

create table public.clan_miembros (
  usuario_id uuid primary key references public.perfiles (id) on delete cascade,   -- un jugador, un solo clan
  clan_id bigint not null references public.clanes (id) on delete cascade,
  cargo smallint not null check (cargo between 1 and 6),
  ingreso timestamptz not null default now(),
  oro_aportado bigint not null default 0   -- solo desde que entró
);
create index clan_miembros_clan on public.clan_miembros (clan_id, cargo, ingreso);

create table public.clan_estadias (       -- cada paso de alguien por un clan: al irse queda acá con lo que aportó
  id bigint generated always as identity primary key,
  clan_id bigint not null references public.clanes (id) on delete cascade,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  desde timestamptz not null default now(),
  hasta timestamptz,
  oro_aportado bigint not null default 0
);
create index clan_estadias_clan on public.clan_estadias (clan_id, desde desc);
create index clan_estadias_usuario on public.clan_estadias (usuario_id, desde desc);

create table public.clan_invitaciones (
  id bigint generated always as identity primary key,
  clan_id bigint not null references public.clanes (id) on delete cascade,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  tipo text not null check (tipo in ('invitacion', 'solicitud')),     -- invitación: la manda el clan; solicitud: la pide el jugador
  de_quien uuid not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  creado timestamptz not null default now(),
  vence timestamptz not null default now() + interval '7 days'
);
create unique index clan_invitaciones_una on public.clan_invitaciones (clan_id, usuario_id, tipo) where estado = 'pendiente';
create index clan_invitaciones_usuario on public.clan_invitaciones (usuario_id) where estado = 'pendiente';

create table public.clan_chat (
  id bigint generated always as identity primary key,
  clan_id bigint not null references public.clanes (id) on delete cascade,
  autor uuid references public.perfiles (id) on delete set null,     -- null: mensaje del sistema
  tipo text not null check (tipo in ('mensaje', 'sistema')),
  texto text not null,                                               -- en los del sistema, la clave (entro, salio, ascenso…)
  datos jsonb,                                                       -- en los del sistema, los nombres y cargos
  fijado boolean not null default false,
  borrado boolean not null default false,
  creado timestamptz not null default now()
);
create index clan_chat_clan on public.clan_chat (clan_id, id desc);

create table public.oro_eventos (         -- cada saqueo informado: de acá salen el aporte al clan y los rankings por semana o mes
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  clan_id bigint references public.clanes (id) on delete set null,
  oro integer not null,
  origen text not null default 'juego',
  creado timestamptz not null default now()
);
create index oro_eventos_usuario on public.oro_eventos (usuario_id, creado desc);
create index oro_eventos_clan on public.oro_eventos (clan_id, creado desc) where clan_id is not null;

-- Permisos de lectura: clanes, miembros y estadías son públicos (perfiles y rankings); invitaciones, chat y aportes, no.
alter table public.clanes enable row level security;
alter table public.clan_miembros enable row level security;
alter table public.clan_estadias enable row level security;
alter table public.clan_invitaciones enable row level security;
alter table public.clan_chat enable row level security;
alter table public.oro_eventos enable row level security;

create or replace function public.mi_clan() returns bigint
language sql stable security definer set search_path = public as $$
  select clan_id from public.clan_miembros where usuario_id = auth.uid()
$$;
create or replace function public.mi_cargo() returns smallint
language sql stable security definer set search_path = public as $$
  select cargo from public.clan_miembros where usuario_id = auth.uid()
$$;

create policy "clanes visibles" on public.clanes for select using (true);
create policy "miembros visibles" on public.clan_miembros for select using (true);
create policy "estadias visibles" on public.clan_estadias for select using (true);
create policy "mis invitaciones o las de mi clan" on public.clan_invitaciones for select
  using (usuario_id = auth.uid() or (clan_id = public.mi_clan() and public.mi_cargo() <= 4));
create policy "chat de mi clan" on public.clan_chat for select using (clan_id = public.mi_clan());
create policy "mis saqueos" on public.oro_eventos for select using (usuario_id = auth.uid());

revoke insert, update, delete on public.amigos, public.clanes, public.clan_miembros, public.clan_estadias,
  public.clan_invitaciones, public.clan_chat, public.oro_eventos from anon, authenticated;
grant select on public.amigos, public.clanes, public.clan_miembros, public.clan_estadias,
  public.clan_invitaciones, public.clan_chat, public.oro_eventos to anon, authenticated;

-- El chat llega en tiempo real (Supabase Realtime respeta el permiso de lectura de arriba)
alter publication supabase_realtime add table public.clan_chat;

-- ---------- Ayudas internas (no se pueden llamar desde afuera) ----------
create or replace function public._yo() returns uuid
language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión.'; end if;
  if not exists (select 1 from public.perfiles where id = auth.uid()) then raise exception 'Primero elegí tu nombre de jugador.'; end if;
  return auth.uid();
end $$;

create or replace function public._sistema(p_clan bigint, p_clave text, p_datos jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.clan_chat (clan_id, autor, tipo, texto, datos) values (p_clan, null, 'sistema', p_clave, p_datos)
$$;

create or replace function public._nombre(p_usuario uuid) returns text
language sql stable security definer set search_path = public as $$
  select nombre from public.perfiles where id = p_usuario
$$;

-- Alguien entra al clan (ya controlado quién puede): fila de miembro, estadía nueva y aviso en el chat
create or replace function public._entrar(p_clan bigint, p_usuario uuid, p_cargo smallint) returns void
language plpgsql security definer set search_path = public as $$
declare v_clan public.clanes;
begin
  select * into v_clan from public.clanes where id = p_clan for update;
  if not found then raise exception 'Ese clan ya no existe.'; end if;
  if exists (select 1 from public.clan_miembros where usuario_id = p_usuario) then raise exception 'Ese jugador ya está en un clan.'; end if;
  if v_clan.miembros >= v_clan.max_miembros then raise exception 'El clan está lleno.'; end if;
  insert into public.clan_miembros (usuario_id, clan_id, cargo) values (p_usuario, p_clan, p_cargo);
  insert into public.clan_estadias (clan_id, usuario_id) values (p_clan, p_usuario);
  update public.clanes set miembros = miembros + 1 where id = p_clan;
  -- las otras invitaciones y solicitudes pendientes de ese jugador quedan sin efecto
  update public.clan_invitaciones set estado = 'cancelada' where usuario_id = p_usuario and estado = 'pendiente';
  perform public._sistema(p_clan, 'entro', jsonb_build_object('nombre', public._nombre(p_usuario)));
end $$;

-- Alguien deja el clan (se fue o lo echaron). Si era el Almirante, el mando pasa al de cargo más alto y, a igual cargo,
-- al más antiguo. Si no queda nadie, el clan se disuelve.
create or replace function public._dejar(p_usuario uuid, p_clave text) returns void
language plpgsql security definer set search_path = public as $$
declare v_m public.clan_miembros; v_nuevo uuid;
begin
  select * into v_m from public.clan_miembros where usuario_id = p_usuario for update;
  if not found then return; end if;
  update public.clan_estadias set hasta = now(), oro_aportado = v_m.oro_aportado
    where usuario_id = p_usuario and clan_id = v_m.clan_id and hasta is null;
  delete from public.clan_miembros where usuario_id = p_usuario;
  update public.clanes set miembros = miembros - 1 where id = v_m.clan_id;
  perform public._sistema(v_m.clan_id, p_clave, jsonb_build_object('nombre', public._nombre(p_usuario)));
  if v_m.cargo = 1 then
    select usuario_id into v_nuevo from public.clan_miembros where clan_id = v_m.clan_id order by cargo, ingreso limit 1;
    if v_nuevo is null then
      delete from public.clanes where id = v_m.clan_id;
    else
      update public.clan_miembros set cargo = 1 where usuario_id = v_nuevo;
      perform public._sistema(v_m.clan_id, 'almirante', jsonb_build_object('nombre', public._nombre(v_nuevo)));
    end if;
  end if;
end $$;

revoke all on function public._yo(), public._sistema(bigint, text, jsonb), public._nombre(uuid), public._entrar(bigint, uuid, smallint),
  public._dejar(uuid, text) from public, anon, authenticated;

-- ---------- Amigos ----------
create or replace function public.amistad_pedir(p_nombre text) returns text
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_otro uuid; v_a uuid; v_b uuid; v_fila public.amigos;
begin
  select id into v_otro from public.perfiles where lower(nombre) = lower(btrim(p_nombre));
  if v_otro is null then raise exception 'No hay ningún jugador con ese nombre.'; end if;
  if v_otro = v_yo then raise exception 'No podés agregarte a vos mismo.'; end if;
  v_a := least(v_yo, v_otro); v_b := greatest(v_yo, v_otro);
  select * into v_fila from public.amigos where a = v_a and b = v_b for update;
  if found then
    if v_fila.estado = 'amigos' then return 'amigos'; end if;
    if v_fila.de = v_yo then return 'pedido'; end if;
    update public.amigos set estado = 'amigos' where a = v_a and b = v_b; -- el otro ya me había pedido: quedamos amigos
    return 'amigos';
  end if;
  if (select count(*) from public.amigos where (a = v_yo or b = v_yo)) >= 200 then raise exception 'Llegaste al máximo de amigos.'; end if;
  insert into public.amigos (a, b, de, estado) values (v_a, v_b, v_yo, 'pedido');
  return 'pedido';
end $$;

create or replace function public.amistad_responder(p_otro uuid, p_aceptar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo();
begin
  if p_aceptar then
    update public.amigos set estado = 'amigos' where a = least(v_yo, p_otro) and b = greatest(v_yo, p_otro) and estado = 'pedido' and de = p_otro;
  else
    delete from public.amigos where a = least(v_yo, p_otro) and b = greatest(v_yo, p_otro);
  end if;
end $$;

-- ---------- Clanes ----------
create or replace function public._validar_clan(p_nombre text, p_tag text, p_descripcion text, p_emblema jsonb, p_color text, p_ingreso text) returns void
language plpgsql immutable as $$
begin
  if p_nombre !~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _-]{3,24}$' then raise exception 'El nombre del clan tiene que tener entre 3 y 24 caracteres (letras, números, espacio, guion).'; end if;
  if p_tag !~ '^[A-Za-z0-9]{2,5}$' then raise exception 'La etiqueta tiene que tener entre 2 y 5 letras o números.'; end if;
  if length(coalesce(p_descripcion, '')) > 300 then raise exception 'La descripción puede tener hasta 300 caracteres.'; end if;
  if p_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'El color no es válido.'; end if;
  if p_ingreso not in ('abierto', 'solicitud', 'cerrado') then raise exception 'La forma de ingreso no es válida.'; end if;
  -- el emblema, por capas: { forma, fondo, patron, cPatron, simbolo, cSimbolo, borde, cBorde }. Acá solo se controla el formato
  -- (nombres cortos y colores válidos); el juego dibuja lo que conoce, así se suman formas y símbolos sin tocar la base de datos.
  if jsonb_typeof(p_emblema) <> 'object'
    or (select count(*) from jsonb_object_keys(p_emblema) k where k not in ('forma', 'fondo', 'patron', 'cPatron', 'simbolo', 'cSimbolo', 'borde', 'cBorde')) > 0
    or coalesce(p_emblema ->> 'forma', '') !~ '^[a-z_]{2,24}$' or coalesce(p_emblema ->> 'patron', '') !~ '^[a-z_]{2,24}$' or coalesce(p_emblema ->> 'simbolo', '') !~ '^[a-z_]{2,24}$'
    or coalesce(p_emblema ->> 'fondo', '') !~ '^#[0-9a-fA-F]{6}$' or coalesce(p_emblema ->> 'cPatron', '') !~ '^#[0-9a-fA-F]{6}$'
    or coalesce(p_emblema ->> 'cSimbolo', '') !~ '^#[0-9a-fA-F]{6}$' or coalesce(p_emblema ->> 'cBorde', '') !~ '^#[0-9a-fA-F]{6}$'
    or coalesce(p_emblema ->> 'borde', '') !~ '^[0-3]$'
  then raise exception 'El emblema no es válido.'; end if;
end $$;

create or replace function public.clan_crear(p_nombre text, p_tag text, p_descripcion text, p_emblema jsonb, p_color text, p_ingreso text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_id bigint; v_nombre text := btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g')); v_tag text := upper(btrim(coalesce(p_tag, '')));
begin
  perform public._validar_clan(v_nombre, v_tag, p_descripcion, p_emblema, p_color, p_ingreso);
  if exists (select 1 from public.clan_miembros where usuario_id = v_yo) then raise exception 'Ya estás en un clan: dejalo para crear otro.'; end if;
  if exists (select 1 from public.clanes where lower(nombre) = lower(v_nombre)) then raise exception 'Ya hay un clan con ese nombre.'; end if;
  if exists (select 1 from public.clanes where upper(tag) = v_tag) then raise exception 'Ya hay un clan con esa etiqueta.'; end if;
  insert into public.clanes (nombre, tag, descripcion, emblema, color, ingreso) values (v_nombre, v_tag, coalesce(p_descripcion, ''), p_emblema, lower(p_color), p_ingreso)
    returning id into v_id;
  perform public._sistema(v_id, 'fundado', jsonb_build_object('nombre', public._nombre(v_yo)));
  perform public._entrar(v_id, v_yo, 1::smallint);
  return v_id;
end $$;

create or replace function public.clan_editar(p_descripcion text, p_emblema jsonb, p_color text, p_ingreso text) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros; v_c public.clanes;
begin
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  if not found or v_m.cargo > 2 then raise exception 'Solo el Almirante o un Vicealmirante pueden cambiar el clan.'; end if;
  select * into v_c from public.clanes where id = v_m.clan_id;
  perform public._validar_clan(v_c.nombre, v_c.tag, p_descripcion, p_emblema, p_color, p_ingreso);
  update public.clanes set descripcion = coalesce(p_descripcion, ''), emblema = p_emblema, color = lower(p_color), ingreso = p_ingreso where id = v_m.clan_id;
end $$;

-- Invitar a un jugador (por su nombre). Teniente o más.
create or replace function public.clan_invitar(p_nombre text) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros; v_otro uuid;
begin
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  if not found or v_m.cargo > 4 then raise exception 'Para invitar hay que ser Teniente o más.'; end if;
  select id into v_otro from public.perfiles where lower(nombre) = lower(btrim(p_nombre));
  if v_otro is null then raise exception 'No hay ningún jugador con ese nombre.'; end if;
  if exists (select 1 from public.clan_miembros where usuario_id = v_otro) then raise exception 'Ese jugador ya está en un clan.'; end if;
  update public.clan_invitaciones set estado = 'cancelada' where clan_id = v_m.clan_id and usuario_id = v_otro and tipo = 'invitacion' and estado = 'pendiente' and vence < now();
  insert into public.clan_invitaciones (clan_id, usuario_id, tipo, de_quien) values (v_m.clan_id, v_otro, 'invitacion', v_yo)
    on conflict (clan_id, usuario_id, tipo) where estado = 'pendiente' do nothing;
end $$;

-- Un jugador pide entrar: si el clan es abierto entra directo; si es por solicitud queda pendiente; si es cerrado, no.
create or replace function public.clan_solicitar(p_clan bigint) returns text
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_c public.clanes;
begin
  select * into v_c from public.clanes where id = p_clan;
  if not found then raise exception 'Ese clan ya no existe.'; end if;
  if exists (select 1 from public.clan_miembros where usuario_id = v_yo) then raise exception 'Ya estás en un clan.'; end if;
  if v_c.ingreso = 'cerrado' then raise exception 'Ese clan es cerrado: solo se entra por invitación.'; end if;
  if v_c.ingreso = 'abierto' then perform public._entrar(p_clan, v_yo, 6::smallint); return 'adentro'; end if;
  update public.clan_invitaciones set estado = 'cancelada' where clan_id = p_clan and usuario_id = v_yo and tipo = 'solicitud' and estado = 'pendiente' and vence < now();
  insert into public.clan_invitaciones (clan_id, usuario_id, tipo, de_quien) values (p_clan, v_yo, 'solicitud', v_yo)
    on conflict (clan_id, usuario_id, tipo) where estado = 'pendiente' do nothing;
  return 'pendiente';
end $$;

-- Responder: el invitado acepta o rechaza una invitación; un Capitán o más acepta o rechaza una solicitud.
create or replace function public.clan_responder(p_invitacion bigint, p_aceptar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_i public.clan_invitaciones; v_m public.clan_miembros;
begin
  select * into v_i from public.clan_invitaciones where id = p_invitacion for update;
  if not found or v_i.estado <> 'pendiente' then raise exception 'Esa invitación ya no está pendiente.'; end if;
  if v_i.vence < now() then update public.clan_invitaciones set estado = 'cancelada' where id = p_invitacion; raise exception 'Esa invitación venció.'; end if;
  if v_i.tipo = 'invitacion' then
    if v_i.usuario_id <> v_yo then raise exception 'Esa invitación no es para vos.'; end if;
  else
    select * into v_m from public.clan_miembros where usuario_id = v_yo;
    if not found or v_m.clan_id <> v_i.clan_id or v_m.cargo > 3 then raise exception 'Para aceptar solicitudes hay que ser Capitán o más.'; end if;
  end if;
  update public.clan_invitaciones set estado = case when p_aceptar then 'aceptada' else 'rechazada' end where id = p_invitacion;
  if p_aceptar then perform public._entrar(v_i.clan_id, v_i.usuario_id, 6::smallint); end if;
end $$;

create or replace function public.clan_salir() returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo();
begin
  if not exists (select 1 from public.clan_miembros where usuario_id = v_yo) then raise exception 'No estás en ningún clan.'; end if;
  perform public._dejar(v_yo, 'salio');
end $$;

create or replace function public.clan_expulsar(p_usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros; v_o public.clan_miembros;
begin
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  select * into v_o from public.clan_miembros where usuario_id = p_usuario;
  if v_o.usuario_id is null or v_m.usuario_id is null or v_o.clan_id <> v_m.clan_id or p_usuario = v_yo then raise exception 'No podés expulsar a ese jugador.'; end if;
  if not (v_m.cargo = 1 or (v_m.cargo = 2 and v_o.cargo >= 3)) then raise exception 'No tenés cargo para expulsar a ese jugador.'; end if;
  perform public._dejar(p_usuario, 'expulsado');
end $$;

-- Ascender o degradar. El Almirante puede dar cualquier cargo; si nombra a otro Almirante, él pasa a Vicealmirante.
-- Un Vicealmirante solo mueve a los que están de Capitán para abajo, y entre Capitán y Grumete.
create or replace function public.clan_cargo(p_usuario uuid, p_cargo smallint) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros; v_o public.clan_miembros;
begin
  if p_cargo not between 1 and 6 then raise exception 'Ese cargo no existe.'; end if;
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  select * into v_o from public.clan_miembros where usuario_id = p_usuario for update;
  if v_o.usuario_id is null or v_m.usuario_id is null or v_o.clan_id <> v_m.clan_id or p_usuario = v_yo then raise exception 'No podés cambiarle el cargo a ese jugador.'; end if;
  if v_o.cargo = p_cargo then return; end if;
  if v_m.cargo = 1 then
    if p_cargo = 1 then update public.clan_miembros set cargo = 2 where usuario_id = v_yo; end if;
  elsif not (v_m.cargo = 2 and v_o.cargo >= 3 and p_cargo >= 3) then
    raise exception 'No tenés cargo para eso.';
  end if;
  update public.clan_miembros set cargo = p_cargo where usuario_id = p_usuario;
  perform public._sistema(v_m.clan_id, case when p_cargo = 1 then 'almirante' when p_cargo < v_o.cargo then 'ascenso' else 'degradado' end,
    jsonb_build_object('nombre', public._nombre(p_usuario), 'cargo', p_cargo));
end $$;

-- ---------- Chat ----------
create or replace function public.clan_chat_enviar(p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_clan bigint; v_texto text := btrim(coalesce(p_texto, ''));
begin
  select clan_id into v_clan from public.clan_miembros where usuario_id = v_yo;
  if v_clan is null then raise exception 'No estás en ningún clan.'; end if;
  if length(v_texto) = 0 then return; end if;
  if length(v_texto) > 300 then raise exception 'El mensaje puede tener hasta 300 caracteres.'; end if;
  if (select count(*) from public.clan_chat where autor = v_yo and creado > now() - interval '10 seconds') >= 5 then
    raise exception 'Más despacio: esperá unos segundos.'; end if;
  insert into public.clan_chat (clan_id, autor, tipo, texto) values (v_clan, v_yo, 'mensaje', v_texto);
end $$;

-- Fijar (o soltar) y borrar mensajes: Capitán o más. Fijado hay uno solo por clan.
create or replace function public.clan_chat_fijar(p_mensaje bigint, p_fijar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros;
begin
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  if not found or v_m.cargo > 3 then raise exception 'Para fijar mensajes hay que ser Capitán o más.'; end if;
  if not exists (select 1 from public.clan_chat where id = p_mensaje and clan_id = v_m.clan_id and tipo = 'mensaje' and not borrado) then raise exception 'Ese mensaje no está.'; end if;
  update public.clan_chat set fijado = false where clan_id = v_m.clan_id and fijado;
  if p_fijar then update public.clan_chat set fijado = true where id = p_mensaje; end if;
end $$;

create or replace function public.clan_chat_borrar(p_mensaje bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo uuid := public._yo(); v_m public.clan_miembros; v_autor uuid;
begin
  select * into v_m from public.clan_miembros where usuario_id = v_yo;
  select autor into v_autor from public.clan_chat where id = p_mensaje and clan_id = v_m.clan_id;
  if not found then raise exception 'Ese mensaje no está.'; end if;
  if v_autor is distinct from v_yo and v_m.cargo > 3 then raise exception 'Para borrar mensajes de otros hay que ser Capitán o más.'; end if;
  update public.clan_chat set borrado = true, fijado = false, texto = '' where id = p_mensaje;
end $$;

-- ---------- Oro: cada saqueo informado suma al clan del jugador (solo mientras está adentro) ----------
create or replace function public.registrar_progreso(
  p_hundidos integer, p_capturados integer, p_eliminados integer, p_oro integer,
  p_segundos integer, p_saqueo_partida integer, p_fin boolean
) returns public.perfiles
language plpgsql security definer set search_path = public as $$
declare
  v_fila public.perfiles;
  v_ahora timestamptz := clock_timestamp();
  v_paso double precision;
  v_cupo double precision;
  v_oro integer;
  v_clan bigint;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión.'; end if;
  select * into v_fila from public.perfiles where id = auth.uid() for update;
  if not found then return null; end if;

  v_paso := greatest(0, extract(epoch from v_ahora - v_fila.cupo_t));
  v_cupo := least(150000, v_fila.cupo_oro + 250 * v_paso);
  v_oro := least(greatest(coalesce(p_oro, 0), 0), floor(v_cupo)::integer);

  update public.perfiles set
    barcos_hundidos = barcos_hundidos + least(greatest(coalesce(p_hundidos, 0), 0), 200),
    barcos_capturados = barcos_capturados + least(greatest(coalesce(p_capturados, 0), 0), 50),
    jugadores_eliminados = jugadores_eliminados + least(greatest(coalesce(p_eliminados, 0), 0), 100),
    oro_saqueado = oro_saqueado + v_oro,
    segundos_jugados = segundos_jugados + least(greatest(coalesce(p_segundos, 0), 0), ceil(v_paso)::integer + 30, 14400),
    mejor_saqueo = greatest(mejor_saqueo, least(greatest(coalesce(p_saqueo_partida, 0), 0), partida_oro + v_oro, 1000000)),
    partida_oro = case when p_fin then 0 else partida_oro + v_oro end,
    partidas = partidas + case when p_fin then 1 else 0 end,
    cupo_oro = v_cupo - v_oro,
    cupo_t = v_ahora,
    actualizado = now()
  where id = auth.uid()
  returning * into v_fila;

  if v_oro > 0 then
    select clan_id into v_clan from public.clan_miembros where usuario_id = auth.uid();
    insert into public.oro_eventos (usuario_id, clan_id, oro) values (auth.uid(), v_clan, v_oro);
    if v_clan is not null then
      update public.clan_miembros set oro_aportado = oro_aportado + v_oro where usuario_id = auth.uid();
      update public.clan_estadias set oro_aportado = oro_aportado + v_oro where usuario_id = auth.uid() and clan_id = v_clan and hasta is null;
      update public.clanes set oro_total = oro_total + v_oro where id = v_clan;
    end if;
  end if;
  return v_fila;
end $$;

-- ---------- Rankings ----------
-- Clanes más saqueadores: total o en los últimos 7 / 30 días
create or replace function public.ranking_clanes_oro(p_dias integer default null) returns table (id bigint, nombre text, tag text, emblema jsonb, color text, miembros integer, oro bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.nombre, c.tag, c.emblema, c.color, c.miembros,
    case when p_dias is null then c.oro_total else coalesce((select sum(e.oro) from public.oro_eventos e where e.clan_id = c.id and e.creado > now() - make_interval(days => p_dias)), 0) end as oro
  from public.clanes c order by 7 desc limit 50
$$;

-- Saqueadores de los últimos 7 / 30 días (el ranking de siempre, de mejor saqueo, sigue igual)
create or replace function public.ranking_saqueadores(p_dias integer) returns table (nombre text, oro bigint)
language sql stable security definer set search_path = public as $$
  select p.nombre, sum(e.oro)::bigint from public.oro_eventos e join public.perfiles p on p.id = e.usuario_id
  where e.creado > now() - make_interval(days => greatest(1, least(p_dias, 365))) group by p.nombre order by 2 desc limit 50
$$;

revoke all on function public.amistad_pedir(text), public.amistad_responder(uuid, boolean), public.clan_crear(text, text, text, jsonb, text, text),
  public.clan_editar(text, jsonb, text, text), public.clan_invitar(text), public.clan_solicitar(bigint), public.clan_responder(bigint, boolean),
  public.clan_salir(), public.clan_expulsar(uuid), public.clan_cargo(uuid, smallint), public.clan_chat_enviar(text), public.clan_chat_fijar(bigint, boolean),
  public.clan_chat_borrar(bigint), public._validar_clan(text, text, text, jsonb, text, text) from public, anon;
grant execute on function public.amistad_pedir(text), public.amistad_responder(uuid, boolean), public.clan_crear(text, text, text, jsonb, text, text),
  public.clan_editar(text, jsonb, text, text), public.clan_invitar(text), public.clan_solicitar(bigint), public.clan_responder(bigint, boolean),
  public.clan_salir(), public.clan_expulsar(uuid), public.clan_cargo(uuid, smallint), public.clan_chat_enviar(text), public.clan_chat_fijar(bigint, boolean),
  public.clan_chat_borrar(bigint) to authenticated;
revoke all on function public._validar_clan(text, text, text, jsonb, text, text) from authenticated;
grant execute on function public.ranking_clanes_oro(integer), public.ranking_saqueadores(integer) to anon, authenticated;
