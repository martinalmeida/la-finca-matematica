// Copia de seguridad: exporta e importa todos los datos de la app en un archivo JSON local.

import { borrar, clavesApp, escribirTexto, leerTexto } from './almacen';
import { CLAVE_VERSION, migrar, VERSION_ACTUAL } from './migraciones';

export type Copia = {
  app: 'la-finca-matematica';
  version: number;
  fecha: string;
  datos: Record<string, string>;
};

export function crearCopia(): Copia {
  const datos: Record<string, string> = {};
  for (const k of clavesApp()) {
    const v = leerTexto(k);
    if (v !== null) datos[k] = v;
  }
  return { app: 'la-finca-matematica', version: VERSION_ACTUAL, fecha: new Date().toISOString(), datos };
}

export function validarCopia(obj: unknown): obj is Copia {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Partial<Copia>;
  return c.app === 'la-finca-matematica' && typeof c.version === 'number' && !!c.datos && typeof c.datos === 'object' && Object.keys(c.datos).every((k) => k.startsWith('fincaMat:'));
}

/** Reemplaza los datos actuales por los de la copia. */
export function restaurarCopia(texto: string): { ok: true } | { ok: false; error: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(texto);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  if (!validarCopia(obj)) return { ok: false, error: 'El archivo no es una copia de La Finca Matemática.' };
  if (obj.version > VERSION_ACTUAL) return { ok: false, error: 'La copia es de una versión más nueva de la aplicación.' };
  for (const k of clavesApp()) borrar(k);
  for (const [k, v] of Object.entries(obj.datos)) escribirTexto(k, typeof v === 'string' ? v : JSON.stringify(v));
  // La versión de la copia manda: así una copia nueva no pasa por migraciones viejas.
  if (!(CLAVE_VERSION in obj.datos)) escribirTexto(CLAVE_VERSION, String(obj.version));
  migrar();
  return { ok: true };
}

/** Descarga un archivo local (sin red). */
export function descargar(nombre: string, contenido: string, tipo = 'application/json'): void {
  const blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}
