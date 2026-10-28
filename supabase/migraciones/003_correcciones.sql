-- Correcciones de la auditoría (2026-10-27):
-- 1. sincronizar bloquea la fila del perfil: un «reiniciar progreso» que entra a la vez ya no se
--    pierde (antes las filas viejas podían insertarse después del borrado).
-- 2. sincronizar solo acepta las claves que usa la app (progreso, pruebas, resumen, historiasVistas,
--    reacciones, taller).
-- 3. silo_escuela ignora valores de semillas que no son números enteros razonables: un dato raro
--    de un usuario ya no rompe el silo de toda la escuela.

begin;

create or replace function public.sincronizar(p_generacion int, p_filas jsonb, p_eventos jsonb, p_partidas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
begin
  -- «for update»: espera a que termine un reinicio del profesor y ve la generación nueva.
  select * into v_perfil from public.perfiles where id = auth.uid() for update;
  if v_perfil.id is null or v_perfil.rol <> 'usuario' then
    raise exception 'Cuenta no encontrada' using errcode = '42501';
  end if;
  if not v_perfil.activo then
    return jsonb_build_object('estado', 'inactivo');
  end if;
  if p_generacion is distinct from v_perfil.generacion then
    return jsonb_build_object('estado', 'generacion', 'perfil', to_jsonb(v_perfil));
  end if;

  insert into public.datos_usuario (usuario_id, clave, valor, actualizado)
  select v_perfil.id, f.clave, f.valor, f.actualizado
    from jsonb_to_recordset(coalesce(p_filas, '[]'::jsonb)) as f(clave text, valor jsonb, actualizado timestamptz)
   where split_part(f.clave, ':', 1) in ('progreso', 'pruebas', 'resumen', 'historiasVistas', 'reacciones', 'taller')
     and length(f.clave) <= 64
  on conflict (usuario_id, clave) do update
    set valor = excluded.valor, actualizado = excluded.actualizado
    where public.datos_usuario.actualizado <= excluded.actualizado;

  insert into public.eventos (id, usuario_id, t, tipo, pista, nivel, plantilla, operacion, correcto, intentos, pistas_usadas, tipo_error, ms)
  select e.id, v_perfil.id, e.t, e.tipo, e.pista, e.nivel, e.plantilla, e.operacion, e.correcto, e.intentos, e.pistas_usadas, e.tipo_error, e.ms
    from jsonb_to_recordset(coalesce(p_eventos, '[]'::jsonb)) as e(
      id uuid, t timestamptz, tipo text, pista text, nivel int, plantilla text, operacion text,
      correcto boolean, intentos int, pistas_usadas int, tipo_error text, ms int)
  on conflict (id) do nothing;

  insert into public.partidas (id, usuario_id, t, tipo, pista, nivel, aciertos, total, estrellas, ms_total, repaso, banda)
  select x.id, v_perfil.id, x.t, x.tipo, x.pista, x.nivel, x.aciertos, x.total, x.estrellas, x.ms_total, coalesce(x.repaso, false), x.banda
    from jsonb_to_recordset(coalesce(p_partidas, '[]'::jsonb)) as x(
      id uuid, t timestamptz, tipo text, pista text, nivel int, aciertos int, total int,
      estrellas int, ms_total int, repaso boolean, banda text)
  on conflict (id) do nothing;

  update public.perfiles set ultima_sync = now() where id = v_perfil.id returning * into v_perfil;
  return jsonb_build_object('estado', 'ok', 'perfil', to_jsonb(v_perfil));
end $$;

create or replace function public.silo_escuela()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select least(coalesce(sum(
           case when jsonb_typeof(d.valor -> 'semillas') = 'number'
                then greatest(0, least((d.valor ->> 'semillas')::numeric, 100000))
                else 0 end), 0), 2000000000)::int
    from public.datos_usuario d
    join public.perfiles p on p.id = d.usuario_id
   where d.clave like 'progreso:%'
     and p.activo
     and p.profesor_id = (select profesor_id from public.perfiles where id = auth.uid());
$$;

revoke execute on function public.sincronizar(int, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.sincronizar(int, jsonb, jsonb, jsonb) to authenticated;
revoke execute on function public.silo_escuela() from public, anon;
grant execute on function public.silo_escuela() to authenticated;

commit;
