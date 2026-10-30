// Paso del avance de Inclusión de la ruta anterior (23 niveles) a la nueva (33 niveles hasta el 10).
import { describe, expect, it } from 'vitest';
import { progresoDe, type Fuente } from '../src/almacenamiento/datos';
import { aRutaNueva, NIVELES_INCLUSION, RUTA_INCLUSION, superadosEnRutaNueva } from '../src/almacenamiento/rutaInclusion';

const viejo = (superados: number) => ({
  nivelMaximoDesbloqueado: superados + 1,
  niveles: Object.fromEntries(Array.from({ length: superados }, (_, k) => [k + 1, { estrellas: 3, intentos: 1, mejorAciertos: 10, completado: true }])),
  semillas: 40,
  insignias: ['primer-nivel'],
  etapaPlanta: 'brote',
});

describe('ruta nueva de Inclusión', () => {
  it('ubica a cada niño en lo equivalente, sin pasarlo adelante', () => {
    expect(superadosEnRutaNueva(0)).toBe(0);
    for (let s = 1; s <= 23; s++) {
      expect(superadosEnRutaNueva(s)).toBeGreaterThanOrEqual(superadosEnRutaNueva(s - 1));
      expect(superadosEnRutaNueva(s)).toBeLessThan(NIVELES_INCLUSION);
    }
  });

  it('convierte el avance al leerlo y conserva semillas e insignias', () => {
    const f: Fuente = (k) => (k === 'progreso:inclusion' ? viejo(8) : undefined);
    const p = progresoDe(f, 'inclusion');
    expect(p.ruta).toBe(RUTA_INCLUSION);
    expect(p.nivelMaximoDesbloqueado).toBe(superadosEnRutaNueva(8) + 1);
    expect(Object.values(p.niveles).filter((n) => n.completado)).toHaveLength(superadosEnRutaNueva(8));
    expect(p.semillas).toBe(40);
    expect(p.insignias).toEqual(['primer-nivel']);
  });

  it('no vuelve a convertir lo que ya está en la ruta nueva', () => {
    const nuevo = aRutaNueva(viejo(3) as never);
    expect(aRutaNueva({ ...nuevo, nivelMaximoDesbloqueado: 20 })).toMatchObject({ nivelMaximoDesbloqueado: 20 });
    // Quien no ha jugado empieza en el nivel 1 de la ruta nueva.
    expect(progresoDe(() => undefined, 'inclusion')).toMatchObject({ nivelMaximoDesbloqueado: 1, ruta: RUTA_INCLUSION });
  });

  it('las demás rutas no cambian', () => {
    const f: Fuente = (k) => (k === 'progreso:g3' ? viejo(4) : undefined);
    expect(progresoDe(f, 'g3').ruta).toBeUndefined();
  });
});
