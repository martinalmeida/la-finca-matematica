// Inicio y cierre de sesión con usuario y contraseña (sin correo).
// Entrar necesita internet; después el usuario juega sin señal con la sesión guardada.

import { activarCola, aplicarRemotas, borrarDatosLocales } from '../almacenamiento/cola';
import { borrarCuenta, conPendientes, guardarCuenta, leerCuenta, type FilaPerfil } from '../almacenamiento/datos';
import { guardarFotoLocal, traerDeLaNube } from './foto';
import { correoDe, esErrorDeRed, normalizarUsuario, obtenerSupabase } from './supabase';

export type Entrada = { ok: true; cuenta: FilaPerfil } | { ok: false; error: string };

const SIN_INTERNET = 'Necesitas internet para entrar. Busca señal e inténtalo de nuevo.';

export async function iniciarSesion(usuario: string, clave: string): Promise<Entrada> {
  if (!normalizarUsuario(usuario) || !clave) return { ok: false, error: 'Escribe tu usuario y tu contraseña.' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: SIN_INTERNET };
  try {
    const sb = await obtenerSupabase();
    if (!sb) return { ok: false, error: 'La aplicación no está conectada a la nube. Avísale al profesor.' };
    const { data, error } = await sb.auth.signInWithPassword({ email: correoDe(usuario), password: clave });
    if (error) {
      if (error.code === 'user_banned') {
        // Era la cuenta guardada en este celular (la sesión había vencido): se borra lo suyo.
        const anterior = leerCuenta();
        if (anterior && anterior.usuario === normalizarUsuario(usuario)) {
          borrarDatosLocales(anterior.id);
          guardarFotoLocal(anterior.id, null);
          borrarCuenta();
          activarCola(null);
        }
        return { ok: false, error: 'Tu cuenta está desactivada. Habla con tu profesor.' };
      }
      if (error.code === 'invalid_credentials' || error.status === 400) return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      return { ok: false, error: esErrorDeRed(error) ? SIN_INTERNET : 'No se pudo entrar. Inténtalo de nuevo en un momento.' };
    }
    const id = data.user.id;
    const { data: fila, error: errorPerfil } = await sb.from('perfiles').select('*').eq('id', id).single<FilaPerfil>();
    if (errorPerfil || !fila) {
      await sb.auth.signOut({ scope: 'local' });
      return { ok: false, error: 'Esta cuenta no tiene perfil. Avísale al profesor.' };
    }
    if (!fila.activo) {
      await sb.auth.signOut({ scope: 'local' });
      return { ok: false, error: 'Tu cuenta está desactivada. Habla con tu profesor.' };
    }

    const anterior = leerCuenta();
    // Misma cuenta y misma generación: la sesión solo había vencido.
    // Si el profesor reinició el progreso mientras tanto, lo guardado aquí ya no vale: se borra.
    const mismo = anterior?.id === fila.id && anterior.generacion === fila.generacion;
    if (anterior && !mismo) {
      borrarDatosLocales(anterior.id);
      if (anterior.id !== fila.id) guardarFotoLocal(anterior.id, null);
      // Sin cuenta guardada: si la descarga de abajo falla, el próximo intento vuelve a bajar todo
      // (y no sube un avance vacío encima del de la nube).
      borrarCuenta();
    }
    if (fila.rol === 'usuario' && !mismo) {
      // Celular nuevo para esta cuenta: se baja todo lo guardado en la nube.
      const { data: filas, error: errorDatos } = await sb.from('datos_usuario').select('clave, valor').eq('usuario_id', id);
      if (errorDatos) return { ok: false, error: esErrorDeRed(errorDatos) ? SIN_INTERNET : 'No se pudo descargar tu avance. Inténtalo de nuevo.' };
      aplicarRemotas(id, filas ?? []);
      // La foto no impide entrar: si no baja ahora, baja en la próxima sincronización.
      if (fila.foto) await traerDeLaNube(sb, id, fila.foto).catch(() => undefined);
    }
    // Si es la misma cuenta (la sesión había vencido), se conserva lo que faltaba por subir.
    guardarCuenta(mismo ? conPendientes(fila, anterior) : fila);
    activarCola(fila.rol === 'usuario' ? fila.id : null);
    return { ok: true, cuenta: leerCuenta() ?? fila };
  } catch (e) {
    return { ok: false, error: esErrorDeRed(e) ? SIN_INTERNET : 'No se pudo entrar. Inténtalo de nuevo en un momento.' };
  }
}

/** Cierra la sesión y borra del celular todo lo de la cuenta. Antes conviene sincronizar. */
export async function cerrarSesion(): Promise<void> {
  const cuenta = leerCuenta();
  try {
    const sb = await obtenerSupabase();
    await sb?.auth.signOut({ scope: 'local' });
  } catch {
    // sin señal: la sesión local se borra igual (abajo)
  }
  // Sin señal, signOut no alcanza a borrar el token guardado: se borra a mano.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /^sb-.*-auth-token/.test(k)) localStorage.removeItem(k);
    }
  } catch {
    // sin almacenamiento
  }
  if (cuenta) {
    borrarDatosLocales(cuenta.id);
    guardarFotoLocal(cuenta.id, null);
  }
  borrarCuenta();
  activarCola(null);
}
