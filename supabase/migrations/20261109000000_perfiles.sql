-- Perfiles de jugador de Age of Navies.
-- El nombre de jugador lo elige cada uno y es público; el mail de Google queda solo en auth.users y no se expone.

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  partidas integer not null default 0,
  barcos_hundidos integer not null default 0,
  barcos_capturados integer not null default 0,
  jugadores_eliminados integer not null default 0,
  oro_saqueado bigint not null default 0,
  mejor_saqueo integer not null default 0,
  segundos_jugados bigint not null default 0,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create unique index perfiles_nombre_unico on public.perfiles (lower(nombre));
create index perfiles_mejor_saqueo on public.perfiles (mejor_saqueo desc);

alter table public.perfiles enable row level security;

-- Cualquiera puede ver perfiles y ranking. Nadie escribe directo: solo a través de las funciones de abajo.
create policy "perfiles visibles para todos" on public.perfiles for select using (true);
revoke insert, update, delete on public.perfiles from anon, authenticated;
grant select on public.perfiles to anon, authenticated;

-- Elegir o cambiar el nombre de jugador (3 a 16 caracteres: letras, números, espacio, guion y guion bajo).
create or replace function public.elegir_nombre(p_nombre text)
returns public.perfiles
language plpgsql security definer set search_path = public as $$
declare
  v_nombre text := btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
  v_fila public.perfiles;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión.'; end if;
  if v_nombre !~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _-]{3,16}$' then
    raise exception 'El nombre tiene que tener entre 3 y 16 caracteres (letras, números, espacio, guion).';
  end if;
  if exists (select 1 from public.perfiles where lower(nombre) = lower(v_nombre) and id <> auth.uid()) then
    raise exception 'Ese nombre ya está en uso. Probá con otro.';
  end if;
  insert into public.perfiles (id, nombre) values (auth.uid(), v_nombre)
  on conflict (id) do update set nombre = excluded.nombre, actualizado = now()
  returning * into v_fila;
  return v_fila;
end $$;

-- Sumar lo hecho desde el último reporte. Los topes evitan números absurdos por reporte.
create or replace function public.registrar_progreso(
  p_hundidos integer, p_capturados integer, p_eliminados integer, p_oro integer,
  p_segundos integer, p_saqueo_partida integer, p_fin boolean
) returns public.perfiles
language plpgsql security definer set search_path = public as $$
declare v_fila public.perfiles;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión.'; end if;
  update public.perfiles set
    barcos_hundidos = barcos_hundidos + least(greatest(coalesce(p_hundidos, 0), 0), 200),
    barcos_capturados = barcos_capturados + least(greatest(coalesce(p_capturados, 0), 0), 50),
    jugadores_eliminados = jugadores_eliminados + least(greatest(coalesce(p_eliminados, 0), 0), 100),
    oro_saqueado = oro_saqueado + least(greatest(coalesce(p_oro, 0), 0), 100000),
    segundos_jugados = segundos_jugados + least(greatest(coalesce(p_segundos, 0), 0), 14400),
    mejor_saqueo = greatest(mejor_saqueo, least(greatest(coalesce(p_saqueo_partida, 0), 0), 1000000)),
    partidas = partidas + case when p_fin then 1 else 0 end,
    actualizado = now()
  where id = auth.uid()
  returning * into v_fila;
  return v_fila;
end $$;

revoke all on function public.elegir_nombre(text) from public, anon;
revoke all on function public.registrar_progreso(integer, integer, integer, integer, integer, integer, boolean) from public, anon;
grant execute on function public.elegir_nombre(text) to authenticated;
grant execute on function public.registrar_progreso(integer, integer, integer, integer, integer, integer, boolean) to authenticated;
