-- Silo de la escuela: semillas de todos los usuarios del mismo profesor.
-- Cada usuario juega en su celular, así que el total sale de la nube.

begin;

create or replace function public.silo_escuela()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((d.valor ->> 'semillas')::int), 0)::int
    from public.datos_usuario d
    join public.perfiles p on p.id = d.usuario_id
   where d.clave like 'progreso:%'
     and p.activo
     and p.profesor_id = (select profesor_id from public.perfiles where id = auth.uid());
$$;

revoke execute on function public.silo_escuela() from public, anon;
grant execute on function public.silo_escuela() to authenticated;

commit;
