// Migraciones de esquema. Cada versión nueva agrega una función que transforma
// los datos de la versión anterior. La versión actual se guarda en fincaMat:version.

import { borrar, clavesApp, escribirTexto, leerTexto, PREFIJO_V1 } from './almacen';

export const VERSION_ACTUAL = 4;
export const CLAVE_VERSION = 'fincaMat:version';

type Migracion = { a: number; aplicar: () => void };

/**
 * Lista de migraciones en orden. Las claves conservan el prefijo fincaMat:v1:.
 */
const migraciones: Migracion[] = [
  {
    a: 1,
    aplicar: () => {
      // v0 → v1: no había datos previos; solo se marca la versión.
    },
  },
  {
    a: 2,
    aplicar: () => {
      // v1 → v2: de 101 niveles a 10 temas con pruebas diagnóstica y final.
      // Se conservan los perfiles (sin el antiguo «apoyo extra») y se borra el progreso viejo,
      // que no corresponde a los niveles nuevos. Cada perfil hará la diagnóstica al entrar.
      const clavePerfiles = PREFIJO_V1 + 'perfiles';
      try {
        const lista = JSON.parse(leerTexto(clavePerfiles) ?? '[]') as Record<string, unknown>[];
        if (Array.isArray(lista)) {
          escribirTexto(clavePerfiles, JSON.stringify(lista.map(({ apoyo: _apoyo, ...resto }) => resto)));
        }
      } catch {
        // perfiles ilegibles: se dejan como están
      }
      for (const k of clavesApp()) {
        if (k.startsWith(PREFIJO_V1 + 'progreso:') || k.startsWith(PREFIJO_V1 + 'tutorialVisto:')) borrar(k);
      }
    },
  },
  {
    a: 3,
    aplicar: () => {
      // v2 → v3: la ruta de Inclusión pasa de 10 temas a 23 niveles en 7 bloques.
      // Su progreso no corresponde a los niveles nuevos y las lecciones vistas eran de otros temas.
      let inclusion: string[] = [];
      try {
        const lista = JSON.parse(leerTexto(PREFIJO_V1 + 'perfiles') ?? '[]') as { id?: string; grado?: unknown }[];
        if (Array.isArray(lista)) inclusion = lista.filter((x) => x.grado === 'inclusion' && typeof x.id === 'string').map((x) => x.id!);
      } catch {
        // perfiles ilegibles: solo se borra el progreso
      }
      for (const k of clavesApp()) {
        if (k.startsWith(PREFIJO_V1 + 'progreso:') && k.endsWith(':inclusion')) borrar(k);
      }
      for (const id of inclusion) borrar(PREFIJO_V1 + 'historiasVistas:' + id);
    },
  },
  {
    a: 4,
    aplicar: () => {
      // v3 → v4: los perfiles anónimos del celular se reemplazan por cuentas que crea el profesor.
      // Se borran perfiles, progreso, registro y PIN docente; solo se conservan los ajustes del celular.
      for (const k of clavesApp()) {
        if (k.startsWith(PREFIJO_V1) && k !== PREFIJO_V1 + 'ajustes') borrar(k);
      }
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
