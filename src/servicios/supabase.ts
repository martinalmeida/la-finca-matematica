// Cliente de Supabase. Se carga bajo demanda para no agrandar el arranque:
// el juego funciona sin internet y solo la sesión y la sincronización lo usan.

import type { SupabaseClient } from '@supabase/supabase-js';

let cliente: Promise<SupabaseClient | null> | null = null;

/** Con señal débil una conexión puede quedarse colgada: se corta a los 20 s y se trata como «sin internet». */
const ESPERA_MAXIMA = 20_000;

function fetchConLimite(url: RequestInfo | URL, opciones: RequestInit = {}): Promise<Response> {
  const limite = AbortSignal.timeout(ESPERA_MAXIMA);
  const signal = opciones.signal && 'any' in AbortSignal ? AbortSignal.any([opciones.signal, limite]) : (opciones.signal ?? limite);
  return fetch(url, { ...opciones, signal });
}

/** Devuelve el cliente, o null si faltan las variables de entorno. */
export function obtenerSupabase(): Promise<SupabaseClient | null> {
  if (!cliente) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    cliente = !url || !clave
      ? Promise.resolve(null)
      : import('@supabase/supabase-js').then(({ createClient }) =>
          createClient(url, clave, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
            global: { fetch: fetchConLimite },
          }),
        ).catch((e) => {
          // No se pudo descargar la librería (sin señal): el próximo intento la vuelve a pedir.
          cliente = null;
          throw e;
        });
  }
  return cliente;
}

/** Las cuentas no tienen correo: Supabase Auth usa uno sintético que nadie ve. */
export function correoDe(usuario: string): string {
  return `${normalizarUsuario(usuario)}@cuentas.lafinca.invalid`;
}

export function normalizarUsuario(usuario: string): string {
  return usuario.trim().toLowerCase();
}

/** ¿El error es de red (sin señal) y no de la cuenta? */
export function esErrorDeRed(e: unknown): boolean {
  const texto = String((e as { message?: string })?.message ?? e ?? '');
  return /fetch|network|Failed to|Load failed|NetworkError|timeout|timed out|abort/i.test(texto) || (typeof navigator !== 'undefined' && navigator.onLine === false);
}
