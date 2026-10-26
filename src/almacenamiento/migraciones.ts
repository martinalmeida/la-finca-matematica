// Migraciones de esquema. Cada versión nueva agrega una función que transforma
// los datos de la versión anterior. La versión actual se guarda en fincaMat:version.

import { clavesApp, escribirTexto, leerTexto } from './almacen';

export const VERSION_ACTUAL = 1;
const CLAVE_VERSION = 'fincaMat:version';

type Migracion = { a: number; aplicar: () => void };

/**
 * Lista de migraciones en orden. Ejemplo para una futura v2:
 * { a: 2, aplicar: () => { copiar cada fincaMat:v1:* a fincaMat:v2:* transformando los datos } }
 */
const migraciones: Migracion[] = [
  {
    a: 1,
    aplicar: () => {
      // v0 → v1: no había datos previos; solo se marca la versión.
    },
  },
];

export function versionGuardada(): number {
  const v = Number(leerTexto(CLAVE_VERSION));
  if (Number.isFinite(v) && v > 0) return v;
  return clavesApp().some((k) => k.startsWith('fincaMat:v1:')) ? 1 : 0;
}

export function migrar(): number {
  let version = versionGuardada();
  for (const m of migraciones) {
    if (m.a > version) {
      m.aplicar();
      version = m.a;
    }
  }
  escribirTexto(CLAVE_VERSION, String(Math.max(version, VERSION_ACTUAL)));
  return version;
}
