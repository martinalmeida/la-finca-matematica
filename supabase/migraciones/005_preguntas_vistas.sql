-- Preguntas vistas (2026-10-30): cada usuario guarda las huellas de las preguntas que ya vio para
-- que no le salga ninguna repetida, tampoco en otro celular. sincronizar acepta la clave
-- «preguntasVistas» y la UNE con lo que ya había en la nube (no la pisa).

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

  -- Preguntas vistas: se unen las de todos los celulares (nunca se pisan) y se guarda la lista de
  -- frases recientes del envío más nuevo. Tope de 40 000 huellas por usuario.
  insert into public.datos_usuario (usuario_id, clave, valor, actualizado)
  select v_perfil.id, f.clave, f.valor, f.actualizado
    from jsonb_to_recordset(coalesce(p_filas, '[]'::jsonb)) as f(clave text, valor jsonb, actualizado timestamptz)
   where f.clave = 'preguntasVistas'
     -- «case» y no «and»: un valor raro se ignora sin romper la sincronización.
     and case when jsonb_typeof(f.valor -> 'e') = 'array' then jsonb_array_length(f.valor -> 'e') <= 40000 else false end
  on conflict (usuario_id, clave) do update
    set valor = jsonb_build_object(
          'e', (select coalesce(jsonb_agg(h), '[]'::jsonb)
                  from (select h from (
                          select h from jsonb_array_elements_text(
                                          case when jsonb_typeof(public.datos_usuario.valor -> 'e') = 'array'
                                               then public.datos_usuario.valor -> 'e' else '[]'::jsonb end) as h
                          union
                          select h from jsonb_array_elements_text(excluded.valor -> 'e') as h) u
                        limit 40000) t),
          'f', case when public.datos_usuario.actualizado <= excluded.actualizado
                    then excluded.valor -> 'f' else public.datos_usuario.valor -> 'f' end),
        actualizado = greatest(public.datos_usuario.actualizado, excluded.actualizado);

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

revoke execute on function public.sincronizar(int, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.sincronizar(int, jsonb, jsonb, jsonb) to authenticated;

commit;
