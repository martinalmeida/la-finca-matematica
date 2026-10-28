// Sincronización con la nube. Sube lo pendiente de la cola (progreso, ejercicios,
// partidas) y baja la cuenta para aplicar lo que decidió el profesor: grado, tipo,
// exigencia, permiso de repetir la final, desactivación o reinicio del progreso.

import { borrarDatosLocales, confirmarLote, pendientes, tomarLote, type Lote } from '../almacenamiento/cola';
import { conPendientes, guardarCuenta, guardarSiloEscuela, leerCuenta, type FilaPerfil } from '../almacenamiento/datos';
import { escribir, leer, PREFIJO_V1 } from '../almacenamiento/almacen';
import { esErrorDeRed, obtenerSupabase } from './supabase';
import { subirPendiente, traerDeLaNube } from './foto';

export type EstadoSync = 'ok' | 'sin-red' | 'sin-sesion' | 'inactivo' | 'eliminado' | 'reiniciado' | 'error';

type ErrorNube = { message?: string; code?: string } | null | undefined;

/** ¿El error dice que la cuenta ya no existe o que está desactivada? (Si no, null.) */
export function estadoDeCuenta(e: ErrorNube): 'inactivo' | 'eliminado' | null {
  if (!e) return null;
  // Auth (al renovar la sesión) y la base (sincronizar: el perfil se borró con la cuenta).
  if (e.code === 'user_not_found' || (e.code === '42501' && /Cuenta no encontrada/i.test(e.message ?? ''))) return 'eliminado';
  if (e.code === 'user_banned') return 'inactivo';
  return null;
}

/** Sin avances por subir, igual se pregunta a la nube cada tanto si la cuenta sigue activa. */
const REVISAR_CUENTA = 5 * 60_000;

type Aviso = { estado: EstadoSync; cuentaCambio: boolean };

const K_ULTIMA = PREFIJO_V1 + 'ultimaSync';
/** Ejercicios por envío: los lotes grandes se parten. */
const POR_ENVIO = 400;

const oyentes = new Set<(a: Aviso) => void>();
let enCurso: Promise<EstadoSync> | null = null;
let temporizador: number | undefined;

export function alSincronizar(f: (a: Aviso) => void): () => void {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

function avisar(a: Aviso) {
  oyentes.forEach((f) => f(a));
}

export function ultimaSincronizacion(): string | null {
  return leer<string | null>(K_ULTIMA, null);
}

export { pendientes };

/** Parte el lote para no mandar miles de ejercicios en una sola llamada. */
function partir(lote: Lote): Lote[] {
  const lotes: Lote[] = [{ filas: lote.filas, eventos: lote.eventos.slice(0, POR_ENVIO), partidas: lote.partidas }];
  for (let i = POR_ENVIO; i < lote.eventos.length; i += POR_ENVIO) lotes.push({ filas: [], eventos: lote.eventos.slice(i, i + POR_ENVIO), partidas: [] });
  return lotes;
}

/** ¿Cambió algo de la cuenta que afecte lo que se ve? */
function cambioVisible(antes: FilaPerfil, despues: FilaPerfil): boolean {
  const k: (keyof FilaPerfil)[] = ['nombre', 'tipo', 'grado', 'activo', 'generacion'];
  return k.some((c) => antes[c] !== despues[c]) || JSON.stringify(antes.bandas) !== JSON.stringify(despues.bandas) || JSON.stringify(antes.finales_permitidos) !== JSON.stringify(despues.finales_permitidos);
}

async function sincronizar(): Promise<EstadoSync> {
  const cuenta = leerCuenta();
  if (!cuenta || cuenta.rol !== 'usuario') return 'ok';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'sin-red';
  try {
    const sb = await obtenerSupabase();
    if (!sb) return 'error';
    const { data: sesion, error: errorSesion } = await sb.auth.getSession();
    if (errorSesion) return estadoDeCuenta(errorSesion) ?? (esErrorDeRed(errorSesion) ? 'sin-red' : 'sin-sesion');
    if (!sesion.session || sesion.session.user.id !== cuenta.id) return 'sin-sesion';

    if (cuenta.avatarPendiente && cuenta.avatar) {
      const { error } = await sb.rpc('elegir_avatar', { p_avatar: cuenta.avatar });
      // Si mientras subía eligió otro personaje, ese sigue pendiente.
      const ahora = leerCuenta() ?? cuenta;
      if (!error && ahora.avatar === cuenta.avatar) guardarCuenta({ ...ahora, avatarPendiente: false });
    }

    if (cuenta.fotoPendiente) {
      const error = await subirPendiente(sb, cuenta);
      // Si mientras subía cambió otra vez la foto, esa sigue pendiente.
      const ahora = leerCuenta() ?? cuenta;
      if (!error && ahora.foto === cuenta.foto && ahora.fotoPendiente === cuenta.fotoPendiente) guardarCuenta({ ...ahora, fotoPendiente: undefined });
    }

    let perfil: FilaPerfil | null = null;
    for (const lote of partir(tomarLote(cuenta.id))) {
      const { data, error } = await sb.rpc('sincronizar', {
        p_generacion: cuenta.generacion,
        p_filas: lote.filas,
        p_eventos: lote.eventos,
        p_partidas: lote.partidas,
      });
      if (error) return estadoDeCuenta(error) ?? (esErrorDeRed(error) ? 'sin-red' : /JWT|token|401/i.test(error.message) ? 'sin-sesion' : 'error');
      const r = data as { estado: 'ok' | 'inactivo' | 'generacion'; perfil?: FilaPerfil };
      if (r.estado === 'inactivo') return 'inactivo';
      // El profesor reinició el progreso (también si el reinicio entró mientras se subía este lote):
      // lo de este celular ya no vale.
      if (r.perfil && (r.estado === 'generacion' || r.perfil.generacion !== cuenta.generacion)) {
        const actual = leerCuenta() ?? cuenta;
        borrarDatosLocales(cuenta.id);
        guardarCuenta(conPendientes(r.perfil, actual));
        return 'reiniciado';
      }
      confirmarLote(cuenta.id, lote);
      perfil = r.perfil ?? perfil;
    }
    if (perfil) {
      const actual = leerCuenta() ?? cuenta;
      guardarCuenta(conPendientes(perfil, actual));
      if (cambioVisible(cuenta, perfil)) avisar({ estado: 'ok', cuentaCambio: true });
      // Foto cambiada desde otro celular (o quitada por el profesor). La foto no es crítica: si falla, la próxima vez.
      if ('foto' in perfil && !(leerCuenta() ?? actual).fotoPendiente) await traerDeLaNube(sb, cuenta.id, perfil.foto).catch(() => undefined);
    }
    const silo = await sb.rpc('silo_escuela');
    if (!silo.error && typeof silo.data === 'number') guardarSiloEscuela(silo.data);
    escribir(K_ULTIMA, new Date().toISOString());
    return 'ok';
  } catch (e) {
    return esErrorDeRed(e) ? 'sin-red' : 'error';
  }
}

/** Sincroniza ya (si ya hay una en curso, espera esa). */
export function sincronizarAhora(): Promise<EstadoSync> {
  if (!enCurso) {
    enCurso = sincronizar()
      .then((estado) => {
        avisar({ estado, cuentaCambio: estado === 'reiniciado' || estado === 'inactivo' });
        return estado;
      })
      .finally(() => {
        enCurso = null;
      });
  }
  return enCurso;
}

/** Sincroniza en unos segundos (al terminar un nivel o una prueba). */
export function sincronizarPronto(): void {
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => void sincronizarAhora(), 2500);
}

/** Sincroniza al abrir, al volver la señal y al volver a la app; con señal, cada minuto si hay algo
 *  por subir y cada 5 minutos si no (para enterarse de que el profesor desactivó o borró la cuenta). */
export function iniciarSincronizacion(): () => void {
  const alVolverSenal = () => void sincronizarAhora();
  const alVerse = () => {
    if (document.visibilityState === 'visible') void sincronizarAhora();
  };
  window.addEventListener('online', alVolverSenal);
  document.addEventListener('visibilitychange', alVerse);
  let ultimaRevision = Date.now();
  const intervalo = window.setInterval(() => {
    if (!navigator.onLine) return;
    const cuenta = leerCuenta();
    const porSubir = pendientes() > 0 || cuenta?.avatarPendiente || cuenta?.fotoPendiente;
    const toca = document.visibilityState === 'visible' && Date.now() - ultimaRevision >= REVISAR_CUENTA;
    if (porSubir || toca) {
      ultimaRevision = Date.now();
      void sincronizarAhora();
    }
  }, 60_000);
  void sincronizarAhora();
  return () => {
    window.removeEventListener('online', alVolverSenal);
    document.removeEventListener('visibilitychange', alVerse);
    window.clearInterval(intervalo);
  };
}
