-- Foto de perfil (2026-10-27).
-- Cada usuario sube su foto a Storage, bucket privado «fotos», en {su id}/foto.jpg.
-- perfiles.foto guarda la versión vigente (una marca de tiempo) o null: así otro celular
-- sabe cuándo debe bajarla de nuevo. El profesor ve las fotos de sus alumnos y las puede quitar.

begin;

alter table public.perfiles add column if not exists foto text check (foto is null or length(foto) <= 40);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 300000, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ¿El archivo es del propio usuario (rol usuario)?
create or replace function public._foto_propia(p_nombre text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_nombre = auth.uid()::text || '/foto.jpg'
     and exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'usuario' and p.activo);
$$;

-- ¿El archivo es de un alumno del profesor que llama?
create or replace function public._foto_de_mi_usuario(p_nombre text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
     where p.profesor_id = auth.uid() and p_nombre = p.id::text || '/foto.jpg'
  );
$$;

drop policy if exists fotos_leer on storage.objects;
create policy fotos_leer on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (public._foto_propia(name) or public._foto_de_mi_usuario(name)));

drop policy if exists fotos_subir on storage.objects;
create policy fotos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public._foto_propia(name));

drop policy if exists fotos_cambiar on storage.objects;
create policy fotos_cambiar on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public._foto_propia(name))
  with check (bucket_id = 'fotos' and public._foto_propia(name));

drop policy if exists fotos_borrar on storage.objects;
create policy fotos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (public._foto_propia(name) or public._foto_de_mi_usuario(name)));

-- El usuario fija (o quita, con null) la versión de su foto.
create or replace function public.fijar_foto(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_version is not null and (length(p_version) > 40 or p_version !~ '^[0-9a-z-]+$') then
    raise exception 'Versión de foto inválida' using errcode = '22023';
  end if;
  update public.perfiles set foto = p_version where id = auth.uid() and rol = 'usuario';
end $$;

-- El profesor quita la foto de un alumno (el archivo lo borra el panel con la API de Storage).
create or replace function public.quitar_foto_de(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._exigir_mio(p_id);
  update public.perfiles set foto = null where id = p_id;
end $$;

revoke execute on function public._foto_propia(text), public._foto_de_mi_usuario(text), public.fijar_foto(text), public.quitar_foto_de(uuid) from public, anon;
-- Las políticas de Storage evalúan las dos funciones internas con el rol de quien llama.
grant execute on function public._foto_propia(text), public._foto_de_mi_usuario(text), public.fijar_foto(text), public.quitar_foto_de(uuid) to authenticated;

commit;
