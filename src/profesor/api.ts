// Llamadas del panel del profesor a Supabase. El profesor siempre trabaja con internet.
// La seguridad la pone la base de datos (RLS y funciones que verifican que sea el profesor).

import type { SupabaseClient } from '@supabase/supabase-js';
import { obtenerSupabase, esErrorDeRed } from '../servicios/supabase';
import type { FilaPerfil, TipoUsuario } from '../almacenamiento/datos';
import type { Evento, Partida } from '../almacenamiento/cola';
import { borrarFotoDe, urlsDeFotos } from '../servicios/foto';

export type PartidaRemota = Partida & { usuario_id: string };
export type EventoRemoto = Evento & { usuario_id: string };
export type DatoRemoto = { usuario_id: string; clave: string; valor: unknown; actualizado: string };

export type Datos = {
  usuarios: FilaPerfil[];
  datos: DatoRemoto[];
  partidas: PartidaRemota[];
};

/** Error con un mensaje listo para mostrar. */
export class ErrorPanel extends Error {
  constructor(
    mensaje: string,
    readonly sesionVencida = false,
  ) {
    super(mensaje);
  }
}

async function cliente(): Promise<SupabaseClient> {
  const sb = await obtenerSupabase();
  if (!sb) throw new ErrorPanel('La aplicación no está conectada a la nube.');
  return sb;
}

function traducir(e: { message?: string; code?: string } | null | undefined): ErrorPanel {
  const m = e?.message ?? '';
  if (esErrorDeRed(e)) return new ErrorPanel('Sin conexión: el panel del profesor necesita internet.');
  if (/JWT|token|expired|401/i.test(m)) return new ErrorPanel('Su sesión terminó.', true);
  // Los mensajes de las funciones de la base de datos ya vienen en español.
  return new ErrorPanel(m || 'Algo salió mal. Inténtelo de nuevo.');
}

const PAGINA = 1000;

/** Trae todas las filas de una consulta, de 1000 en 1000. */
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await consulta(desde, desde + PAGINA - 1);
    if (error) throw traducir(error);
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return filas;
  }
}

/** Usuarios del profesor, sus datos sincronizados y sus partidas. */
export async function cargarDatos(): Promise<Datos> {
  const sb = await cliente();
  try {
    const [usuarios, datos, partidas] = await Promise.all([
      todas<FilaPerfil>((d, h) => sb.from('perfiles').select('*').eq('rol', 'usuario').order('nombre').order('id').range(d, h)),
      todas<DatoRemoto>((d, h) => sb.from('datos_usuario').select('*').neq('clave', 'preguntasVistas').order('usuario_id').order('clave').range(d, h)),
      todas<PartidaRemota>((d, h) => sb.from('partidas').select('*').order('t').order('id').range(d, h)),
    ]);
    return { usuarios, datos, partidas };
  } catch (e) {
    throw e instanceof ErrorPanel ? e : traducir(e as Error);
  }
}

/** Ejercicios respondidos (de un usuario o de todos). */
export async function cargarEventos(usuarioId?: string): Promise<EventoRemoto[]> {
  const sb = await cliente();
  try {
    return await todas<EventoRemoto>((d, h) => {
      const q = sb.from('eventos').select('*');
      // Desempate por id: con la misma hora, las páginas no repiten ni saltan filas.
      return (usuarioId ? q.eq('usuario_id', usuarioId) : q).order('t').order('id').range(d, h);
    });
  } catch (e) {
    throw e instanceof ErrorPanel ? e : traducir(e as Error);
  }
}

async function rpc<T = void>(nombre: string, args: Record<string, unknown>): Promise<T> {
  const sb = await cliente();
  try {
    const { data, error } = await sb.rpc(nombre, args);
    if (error) throw traducir(error);
    return data as T;
  } catch (e) {
    throw e instanceof ErrorPanel ? e : traducir(e as Error);
  }
}

export const usuarioLibre = (usuario: string) => rpc<boolean>('usuario_libre', { p_usuario: usuario });

export const crearUsuario = (u: { usuario: string; clave: string; nombre: string; tipo: TipoUsuario; grado: number | null }) =>
  rpc<string>('crear_usuario', { p_usuario: u.usuario, p_clave: u.clave, p_nombre: u.nombre, p_tipo: u.tipo, p_grado: u.grado });

export const editarUsuario = (id: string, u: { nombre: string; tipo: TipoUsuario; grado: number | null }) =>
  rpc('editar_usuario', { p_id: id, p_nombre: u.nombre, p_tipo: u.tipo, p_grado: u.grado });

export const cambiarClave = (id: string, clave: string) => rpc('cambiar_clave', { p_id: id, p_clave: clave });
export const fijarActivo = (id: string, activo: boolean) => rpc('fijar_activo', { p_id: id, p_activo: activo });
export async function eliminarUsuario(id: string): Promise<void> {
  // El archivo de la foto no se borra en cascada con la cuenta: se borra antes (si falla, se sigue).
  await borrarFotoDe(await cliente(), id).catch(() => undefined);
  await rpc('eliminar_usuario', { p_id: id });
}

/** URLs temporales de las fotos de los usuarios que tienen una. Si falla, sin fotos (se ven los personajes). */
export async function cargarFotos(usuarios: FilaPerfil[]): Promise<Record<string, string>> {
  try {
    return await urlsDeFotos(await cliente(), usuarios.filter((u) => u.foto).map((u) => u.id));
  } catch {
    return {};
  }
}

/** Quita la foto de un alumno (por si no es apropiada). */
export async function quitarFoto(id: string): Promise<void> {
  const error = await borrarFotoDe(await cliente(), id);
  if (error) throw traducir(error as { message?: string });
  await rpc('quitar_foto_de', { p_id: id });
}
export const reiniciarProgreso = (id: string) => rpc('reiniciar_progreso', { p_id: id });
export const fijarBanda = (id: string, pista: string, banda: string | null) => rpc('fijar_banda', { p_id: id, p_pista: pista, p_banda: banda });
export const permitirFinal = (id: string, pista: string) => rpc('permitir_final', { p_id: id, p_pista: pista });

/** ¿Sigue viva la sesión del profesor? */
export async function sesionActiva(): Promise<boolean> {
  const sb = await cliente();
  const { data } = await sb.auth.getSession();
  return !!data.session;
}
