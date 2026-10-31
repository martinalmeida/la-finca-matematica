-- Encuesta de satisfacción (2026-10-31): al terminar la ruta (prueba final; en Inclusión, el último
-- nivel) cada usuario responde una vez una encuesta sobre la aplicación. El profesor la ve en sus
-- informes. Solo agrega: una tabla y una función nuevas; no cambia nada de lo que ya existe.
-- La encuesta trata de la app, no del progreso: «reiniciar progreso» no la borra (borrar la cuenta sí).

begin;

create table if not exists public.encuestas (
  id uuid primary key,
  usuario_id uuid not null unique references public.perfiles (id) on delete cascade,
  -- Cuándo la respondió (en el celular, aunque estuviera sin señal).
  t timestamptz not null,
  pista text not null check (length(pista) <= 40),
  -- Tipo y grado del usuario al responder (copiados del perfil).
  tipo text,
  grado int,
  version_app text check (length(version_app) <= 60),
  -- {"facil": 5, "videos": null, …}: de 1 a 5 (null = «no lo usé»).
  respuestas jsonb not null,
  gusto text check (length(gusto) <= 1000),
  mejorar text check (length(mejorar) <= 1000),
  recibida timestamptz not null default now()
);

alter table public.encuestas enable row level security;

-- Solo lectura directa; se escribe con enviar_encuesta.
revoke insert, update, delete, truncate on public.encuestas from anon, authenticated;
revoke all on public.encuestas from anon;
grant select on public.encuestas to authenticated;

drop policy if exists encuestas_leer on public.encuestas;
create policy encuestas_leer on public.encuestas for select to authenticated
  using (usuario_id = auth.uid() or public.es_mi_usuario(usuario_id));

-- Guarda la encuesta del usuario que llama. Una sola por usuario: si ya hay una, no hace nada
-- (así reintentar un envío que sí llegó no duplica ni cambia la respuesta).
create or replace function public.enviar_encuesta(
  p_id uuid, p_t timestamptz, p_pista text, p_respuestas jsonb, p_gusto text, p_mejorar text, p_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
  v_par record;
begin
  select * into v_perfil from public.perfiles where id = auth.uid();
  if v_perfil.id is null or v_perfil.rol <> 'usuario' then
    raise exception 'Cuenta no encontrada' using errcode = '42501';
  end if;
  if not v_perfil.activo then
    raise exception 'Cuenta desactivada' using errcode = '42501';
  end if;
  if p_id is null or p_t is null or p_pista is null or length(p_pista) > 40 then
    raise exception 'Encuesta incompleta' using errcode = '22023';
  end if;
  if jsonb_typeof(p_respuestas) is distinct from 'object' then
    raise exception 'Respuestas inválidas' using errcode = '22023';
  end if;
  for v_par in select key, value from jsonb_each(p_respuestas) loop
    if v_par.key not in ('facil', 'gusto', 'aprendi', 'videos', 'dibujos_voz', 'otra_vez', 'recomendar') then
      raise exception 'Pregunta desconocida: %', v_par.key using errcode = '22023';
    end if;
    if jsonb_typeof(v_par.value) <> 'null'
       and (jsonb_typeof(v_par.value) <> 'number' or v_par.value::text not in ('1', '2', '3', '4', '5')) then
      raise exception 'Respuesta fuera de rango en %', v_par.key using errcode = '22023';
    end if;
  end loop;

  insert into public.encuestas (id, usuario_id, t, pista, tipo, grado, version_app, respuestas, gusto, mejorar)
  values (
    p_id, v_perfil.id, p_t, p_pista, v_perfil.tipo, v_perfil.grado, left(p_version, 60), p_respuestas,
    nullif(left(trim(p_gusto), 1000), ''), nullif(left(trim(p_mejorar), 1000), '')
  )
  on conflict do nothing;
end $$;

revoke execute on function public.enviar_encuesta(uuid, timestamptz, text, jsonb, text, text, text) from public, anon;
grant execute on function public.enviar_encuesta(uuid, timestamptz, text, jsonb, text, text, text) to authenticated;

commit;
