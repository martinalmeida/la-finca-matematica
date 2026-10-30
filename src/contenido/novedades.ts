// Novedades de cada versión, leídas de CHANGELOG.md (una sola fuente para el repositorio y la app).

import texto from '../../CHANGELOG.md?raw';

export type Version = {
  version: string;
  fecha: string;
  /** Grupos («Nuevo», «Arreglado»…) con sus puntos; sin grupo, el título es ''. */
  grupos: { titulo: string; puntos: string[] }[];
};

/** Versión de este build (SemVer) y fecha de compilación. */
export const VERSION = __VERSION__;
export const COMPILACION = __COMPILACION__;

const sinMarcas = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();

export function leerCambios(md: string): Version[] {
  const versiones: Version[] = [];
  for (const linea of md.split('\n')) {
    const v = /^## \[(\d+\.\d+\.\d+)\]\s*-\s*(\S+)/.exec(linea);
    if (v) {
      versiones.push({ version: v[1], fecha: v[2], grupos: [] });
      continue;
    }
    const actual = versiones[versiones.length - 1];
    if (!actual) continue;
    const g = /^### (.+)/.exec(linea);
    if (g) {
      actual.grupos.push({ titulo: sinMarcas(g[1]), puntos: [] });
      continue;
    }
    const p = /^- (.+)/.exec(linea);
    if (p) {
      if (!actual.grupos.length) actual.grupos.push({ titulo: '', puntos: [] });
      actual.grupos[actual.grupos.length - 1].puntos.push(sinMarcas(p[1]));
    }
  }
  return versiones;
}

export const cambios: Version[] = leerCambios(texto);

/** Novedades de la versión instalada (o de la más nueva del registro). */
export function novedadesActuales(): Version | undefined {
  return cambios.find((c) => c.version === VERSION) ?? cambios[0];
}
