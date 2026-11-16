-- Topes para la tabla de mejores saqueos (16/11/2026).
-- El navegador es el que informa lo que se hizo en la partida, así que cualquiera con cuenta podía mandar el número que
-- quisiera (hasta 1.000.000) sin jugar. Estos topes no le cambian nada a quien juega de verdad, pero hacen que inventar un
-- récord lleve casi tanto tiempo como hacerlo:
--  * cupo de oro por cuenta: arranca en 0 y se recarga a 250 de oro por segundo de reloj, hasta 150.000 juntos (alcanza
--    para el botín del Kraken, 7.200 con el bono, el oro en bodega de un capitán hundido o una racha larga sin pasar por el
--    puerto). El oro informado de más no se cuenta. Una cuenta recién hecha no puede mandar un récord al instante.
--  * el mejor saqueo de una partida no puede pasar del oro que esa partida fue informando (partida_oro).
--  * el tiempo jugado no puede ser más que el tiempo que pasó de verdad desde el informe anterior (más 30 s de margen).

alter table public.perfiles
  add column if not exists partida_oro bigint not null default 0,
  add column if not exists cupo_oro double precision not null default 0,
  add column if not exists cupo_t timestamptz not null default now();

create or replace function public.registrar_progreso(
  p_hundidos integer, p_capturados integer, p_eliminados integer, p_oro integer,
  p_segundos integer, p_saqueo_partida integer, p_fin boolean
) returns public.perfiles
language plpgsql security definer set search_path = public as $$
declare
  v_fila public.perfiles;
  v_ahora timestamptz := clock_timestamp();
  v_paso double precision;   -- segundos de reloj desde el informe anterior
  v_cupo double precision;   -- oro que se puede aceptar ahora
  v_oro integer;             -- oro aceptado en este informe
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
  return v_fila;
end $$;

revoke all on function public.registrar_progreso(integer, integer, integer, integer, integer, integer, boolean) from public, anon;
grant execute on function public.registrar_progreso(integer, integer, integer, integer, integer, integer, boolean) to authenticated;
