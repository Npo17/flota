-- El servidor del online informa lo que pasó en sus partidas (18/11/2026). Etapa 1 de docs/PROPUESTA-CLANES.md.
-- Hasta ahora lo informaba el navegador de cada jugador, que puede mentir. El servidor sí sabe la verdad (corre la
-- simulación) y desde ahora sabe quién juega (verifica la sesión de Supabase al entrar). Se autentica con una clave que
-- solo conocen él (secreto SERVIDOR_CLAVE en Cloudflare) y esta base de datos (acá se guarda solo su hash).

create table if not exists public.servidor_clave (id integer primary key default 1 check (id = 1), hash text not null);
alter table public.servidor_clave enable row level security;   -- sin permisos de lectura: nadie de afuera la ve
revoke all on public.servidor_clave from anon, authenticated;

-- Suma oro a un jugador y, si está en un clan, a su aporte y al clan (solo mientras está adentro). Queda en oro_eventos.
create or replace function public._sumar_oro(p_usuario uuid, p_oro integer, p_origen text) returns void
language plpgsql security definer set search_path = public as $$
declare v_clan bigint;
begin
  if coalesce(p_oro, 0) <= 0 then return; end if;
  select clan_id into v_clan from public.clan_miembros where usuario_id = p_usuario;
  insert into public.oro_eventos (usuario_id, clan_id, oro, origen) values (p_usuario, v_clan, p_oro, p_origen);
  if v_clan is not null then
    update public.clan_miembros set oro_aportado = oro_aportado + p_oro where usuario_id = p_usuario;
    update public.clan_estadias set oro_aportado = oro_aportado + p_oro where usuario_id = p_usuario and clan_id = v_clan and hasta is null;
    update public.clanes set oro_total = oro_total + p_oro where id = v_clan;
  end if;
end $$;
revoke all on function public._sumar_oro(uuid, integer, text) from public, anon, authenticated;

-- p_datos: [{ u (usuario), hundidos, capturados, eliminados, oro, segundos, saqueo (lo saqueado en esa partida), fin }]
create or replace function public.servidor_progreso(p_clave text, p_datos jsonb) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean; r jsonb; v_u uuid; v_oro integer; n integer := 0;
begin
  select hash = encode(digest(coalesce(p_clave, ''), 'sha256'), 'hex') into v_ok from public.servidor_clave where id = 1;
  if not coalesce(v_ok, false) then raise exception 'No autorizado.'; end if;
  for r in select * from jsonb_array_elements(coalesce(p_datos, '[]'::jsonb)) loop
    begin v_u := (r ->> 'u')::uuid; exception when others then continue; end;
    continue when v_u is null or not exists (select 1 from public.perfiles where id = v_u);
    v_oro := least(greatest(coalesce((r ->> 'oro')::integer, 0), 0), 500000);
    update public.perfiles set
      barcos_hundidos = barcos_hundidos + least(greatest(coalesce((r ->> 'hundidos')::integer, 0), 0), 500),
      barcos_capturados = barcos_capturados + least(greatest(coalesce((r ->> 'capturados')::integer, 0), 0), 100),
      jugadores_eliminados = jugadores_eliminados + least(greatest(coalesce((r ->> 'eliminados')::integer, 0), 0), 200),
      oro_saqueado = oro_saqueado + v_oro,
      segundos_jugados = segundos_jugados + least(greatest(coalesce((r ->> 'segundos')::integer, 0), 0), 3600),
      mejor_saqueo = greatest(mejor_saqueo, least(greatest(coalesce((r ->> 'saqueo')::integer, 0), 0), 1000000)),
      partidas = partidas + case when coalesce((r ->> 'fin')::boolean, false) then 1 else 0 end,
      actualizado = now()
    where id = v_u;
    perform public._sumar_oro(v_u, v_oro, 'online');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.servidor_progreso(text, jsonb) from public;
grant execute on function public.servidor_progreso(text, jsonb) to anon, authenticated;
