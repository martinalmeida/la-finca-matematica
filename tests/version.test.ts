// La versión del paquete y la primera de CHANGELOG.md deben coincidir: cada versión publicada
// lleva sus novedades (las muestra la app en Ajustes y en el panel del profesor).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { leerCambios } from '../src/contenido/novedades';

const paquete = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const cambios = leerCambios(readFileSync('CHANGELOG.md', 'utf8'));

describe('versiones', () => {
  it('la versión del paquete es SemVer y es la primera del registro de cambios', () => {
    expect(paquete.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(cambios[0]?.version).toBe(paquete.version);
  });

  it('cada versión tiene fecha, novedades y va en orden de la más nueva a la más vieja', () => {
    const num = (v: string) => v.split('.').map(Number).reduce((s, x) => s * 1000 + x, 0);
    for (let i = 0; i < cambios.length; i++) {
      expect(cambios[i].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(cambios[i].grupos.flatMap((g) => g.puntos).length).toBeGreaterThan(0);
      if (i > 0) expect(num(cambios[i - 1].version)).toBeGreaterThan(num(cambios[i].version));
    }
  });
});
