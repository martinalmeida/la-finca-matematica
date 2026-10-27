-- La Finca Matemática: cuentas con usuario y contraseña (rol profesor / usuario),
-- progreso sincronizado y registro de ejercicios para los informes.
--
-- Las cuentas viven en Supabase Auth con un correo sintético que nadie ve
-- ({usuario}@cuentas.lafinca.invalid). Solo el profesor crea cuentas, mediante
-- funciones security definer; no hay registro público.

begin;

-- ───────────────────────── Tablas ─────────────────────────

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9._]{3,30}$'),
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  rol text not null check (rol in ('profesor', 'usuario')),
  tipo text check (tipo in ('estudiante', 'familia', 'inclusion')),
  grado int check (grado between 1 and 5),
  activo boolean not null default true,
  avatar text,
  -- Banda fijada por el profesor, por pista de prueba: {"g3": "avanzado"}.
  bandas jsonb not null default '{}'::jsonb,
  -- Veces que el profesor permitió repetir la prueba final, por pista: {"g3": 1}.
  finales_permitidos jsonb not null default '{}'::jsonb,
  -- Sube con cada «reiniciar progreso»: el celular borra lo suyo al verla cambiar.
  generacion int not null default 0,
  profesor_id uuid references public.perfiles (id) on delete set null,
  creado timestamptz not null default now(),
  ultima_sync timestamptz,
  constraint perfil_coherente check (
    (rol = 'profesor' and tipo is null and grado is null)
    or (rol = 'usuario' and tipo = 'estudiante' and grado is not null)
    or (rol = 'usuario' and tipo in ('familia', 'inclusion') and grado is null)
  )
);

create index if not exists perfiles_profesor on public.perfiles (profesor_id);

-- Espejo de las claves por usuario del almacenamiento local (progreso, pruebas, resumen…).
create table if not exists public.datos_usuario (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  clave text not null check (length(clave) <= 120),
  valor jsonb not null,
  actualizado timestamptz not null,
  primary key (usuario_id, clave)
);

-- Un renglón por ejercicio respondido (niveles y pruebas). Solo se agregan.
create table if not exists public.eventos (
  id uuid primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  t timestamptz not null,
  tipo text not null check (tipo in ('nivel', 'prueba-diagnostica', 'prueba-final')),
  pista text not null,
  nivel int,
  plantilla text,
  operacion text,
  correcto boolean not null,
  intentos int,
  pistas_usadas int,
  tipo_error text,
  ms int
);

create index if not exists eventos_usuario_t on public.eventos (usuario_id, t);

-- Un renglón por nivel o prueba terminada.
create table if not exists public.partidas (
  id uuid primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  t timestamptz not null,
  tipo text not null check (tipo in ('nivel', 'prueba-diagnostica', 'prueba-final')),
  pista text not null,
  nivel int,
  aciertos int not null,
  total int not null,
  estrellas int,
  ms_total int,
  repaso boolean not null default false,
  banda text
);

create index if not exists partidas_usuario_t on public.partidas (usuario_id, t);

-- ───────────────────────── Seguridad por filas ─────────────────────────

alter table public.perfiles enable row level security;
alter table public.datos_usuario enable row level security;
alter table public.eventos enable row level security;
alter table public.partidas enable row level security;

-- Solo lectura directa; toda escritura pasa por las funciones de abajo.
revoke insert, update, delete, truncate on public.perfiles, public.datos_usuario, public.eventos, public.partidas from anon, authenticated;
revoke all on public.perfiles, public.datos_usuario, public.eventos, public.partidas from anon;

-- ¿El usuario `u` es alumno del profesor que llama? (security definer: evita recursión de RLS)
create or replace function public.es_mi_usuario(u uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfiles p where p.id = u and p.profesor_id = auth.uid());
$$;

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles for select to authenticated
  using (id = auth.uid() or profesor_id = auth.uid());

drop policy if exists datos_leer on public.datos_usuario;
create policy datos_leer on public.datos_usuario for select to authenticated
  using (usuario_id = auth.uid() or public.es_mi_usuario(usuario_id));

drop policy if exists eventos_leer on public.eventos;
create policy eventos_leer on public.eventos for select to authenticated
  using (usuario_id = auth.uid() or public.es_mi_usuario(usuario_id));

drop policy if exists partidas_leer on public.partidas;
create policy partidas_leer on public.partidas for select to authenticated
  using (usuario_id = auth.uid() or public.es_mi_usuario(usuario_id));

-- ───────────────────────── Funciones internas ─────────────────────────

create or replace function public._correo(p_usuario text)
returns text
language sql
immutable
as $$ select p_usuario || '@cuentas.lafinca.invalid' $$;

create or replace function public._exigir_profesor()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and rol = 'profesor' and activo) then
    raise exception 'Solo el profesor puede hacer esto' using errcode = '42501';
  end if;
end $$;

create or replace function public._exigir_mio(p_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public._exigir_profesor();
  if not public.es_mi_usuario(p_id) then
    raise exception 'Ese usuario no existe o no es suyo' using errcode = '42501';
  end if;
end $$;

create or replace function public._validar_clave(p_clave text)
returns void
language plpgsql
immutable
as $$
begin
  if p_clave is null or length(p_clave) < 4 or length(p_clave) > 72 then
    raise exception 'La contraseña debe tener entre 4 y 72 caracteres' using errcode = '22023';
  end if;
end $$;

-- Crea la cuenta en auth (ya confirmada, sin correo) y su perfil.
create or replace function public._crear_cuenta(
  p_usuario text, p_clave text, p_nombre text, p_rol text, p_tipo text, p_grado int, p_profesor uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_usuario text := lower(trim(p_usuario));
  v_correo text := public._correo(lower(trim(p_usuario)));
begin
  perform public._validar_clave(p_clave);
  if v_usuario !~ '^[a-z0-9._]{3,30}$' then
    raise exception 'El usuario debe tener de 3 a 30 letras sin tilde, números, punto o guion bajo' using errcode = '22023';
  end if;
  if exists (select 1 from public.perfiles where usuario = v_usuario) or exists (select 1 from auth.users where email = v_correo) then
    raise exception 'El usuario «%» ya existe', v_usuario using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_correo,
    extensions.crypt(p_clave, extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('usuario', v_usuario), now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_correo, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into public.perfiles (id, usuario, nombre, rol, tipo, grado, profesor_id)
  values (v_id, v_usuario, trim(p_nombre), p_rol, p_tipo, p_grado, p_profesor);

  return v_id;
end $$;

-- Solo para el script de instalación (no se concede a nadie por la API).
create or replace function public.crear_profesor(p_usuario text, p_clave text, p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.perfiles where rol = 'profesor') then
    raise exception 'Ya existe una cuenta de profesor';
  end if;
  return public._crear_cuenta(p_usuario, p_clave, p_nombre, 'profesor', null, null, null);
end $$;

-- ───────────────────────── Funciones del profesor ─────────────────────────

create or replace function public.usuario_libre(p_usuario text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public._exigir_profesor();
  return not exists (select 1 from public.perfiles where usuario = lower(trim(p_usuario)));
end $$;

create or replace function public.crear_usuario(p_usuario text, p_clave text, p_nombre text, p_tipo text, p_grado int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_profesor();
  return public._crear_cuenta(
    p_usuario, p_clave, p_nombre, 'usuario', p_tipo,
    case when p_tipo = 'estudiante' then p_grado end, auth.uid()
  );
end $$;

create or replace function public.editar_usuario(p_id uuid, p_nombre text, p_tipo text, p_grado int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  update public.perfiles
     set nombre = trim(p_nombre),
         tipo = p_tipo,
         grado = case when p_tipo = 'estudiante' then p_grado end
   where id = p_id;
end $$;

create or replace function public.cambiar_clave(p_id uuid, p_clave text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  perform public._validar_clave(p_clave);
  update auth.users
     set encrypted_password = extensions.crypt(p_clave, extensions.gen_salt('bf')), updated_at = now()
   where id = p_id;
end $$;

create or replace function public.fijar_activo(p_id uuid, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  update public.perfiles set activo = p_activo where id = p_id;
  update auth.users set banned_until = case when p_activo then null else '2999-01-01'::timestamptz end where id = p_id;
  if not p_activo then
    delete from auth.sessions where user_id = p_id;
  end if;
end $$;

create or replace function public.eliminar_usuario(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  delete from auth.users where id = p_id; -- en cascada: perfil, datos, eventos y partidas
end $$;

create or replace function public.reiniciar_progreso(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  delete from public.datos_usuario where usuario_id = p_id;
  delete from public.eventos where usuario_id = p_id;
  delete from public.partidas where usuario_id = p_id;
  update public.perfiles
     set generacion = generacion + 1, bandas = '{}'::jsonb, finales_permitidos = '{}'::jsonb
   where id = p_id;
end $$;

create or replace function public.fijar_banda(p_id uuid, p_pista text, p_banda text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  if p_banda is not null and p_banda not in ('refuerzo', 'basico', 'avanzado') then
    raise exception 'Banda desconocida' using errcode = '22023';
  end if;
  update public.perfiles
     set bandas = case when p_banda is null then bandas - p_pista else bandas || jsonb_build_object(p_pista, p_banda) end
   where id = p_id;
end $$;

create or replace function public.permitir_final(p_id uuid, p_pista text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  update public.perfiles
     set finales_permitidos = finales_permitidos
       || jsonb_build_object(p_pista, coalesce((finales_permitidos ->> p_pista)::int, 0) + 1)
   where id = p_id;
end $$;

-- ───────────────────────── Funciones del usuario ─────────────────────────

create or replace function public.elegir_avatar(p_avatar text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(p_avatar) > 40 then
    raise exception 'Avatar inválido' using errcode = '22023';
  end if;
  update public.perfiles set avatar = p_avatar where id = auth.uid() and rol = 'usuario';
end $$;

-- Sube lo pendiente del celular y devuelve el perfil vigente.
-- Si el profesor reinició el progreso (generación distinta) no guarda nada:
-- el celular debe borrar lo suyo y seguir desde cero.
create or replace function public.sincronizar(p_generacion int, p_filas jsonb, p_eventos jsonb, p_partidas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
begin
  select * into v_perfil from public.perfiles where id = auth.uid();
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

-- ───────────────────────── Permisos de ejecución ─────────────────────────

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.es_mi_usuario(uuid),
  public.usuario_libre(text),
  public.crear_usuario(text, text, text, text, int),
  public.editar_usuario(uuid, text, text, int),
  public.cambiar_clave(uuid, text),
  public.fijar_activo(uuid, boolean),
  public.eliminar_usuario(uuid),
  public.reiniciar_progreso(uuid),
  public.fijar_banda(uuid, text, text),
  public.permitir_final(uuid, text),
  public.elegir_avatar(text),
  public.sincronizar(int, jsonb, jsonb, jsonb)
to authenticated;

commit;
