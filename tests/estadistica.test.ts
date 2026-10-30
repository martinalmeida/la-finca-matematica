// Estadística de los informes: valores de referencia de tablas y de R/SciPy.
import { describe, expect, it } from 'vitest';
import { desviacion, gananciaNormalizada, magnitudEfecto, media, mediana, normalCDF, pareado, pBilateralT, tCritico } from '../src/profesor/estadistica';

describe('estadística', () => {
  it('descriptivas', () => {
    expect(media([1, 2, 3, 4])).toBe(2.5);
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(desviacion([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(media([])).toBeNull();
  });

  it('distribución t y normal', () => {
    expect(tCritico(4)).toBeCloseTo(2.7764, 3);
    expect(tCritico(10)).toBeCloseTo(2.2281, 3);
    expect(tCritico(29)).toBeCloseTo(2.0452, 3);
    expect(pBilateralT(2.2281, 10)).toBeCloseTo(0.05, 3);
    expect(pBilateralT(9, 4)).toBeCloseTo(0.000845, 5);
    expect(pBilateralT(0, 7)).toBeCloseTo(1, 6);
    expect(normalCDF(1.959964)).toBeCloseTo(0.975, 4);
    expect(normalCDF(-1)).toBeCloseTo(0.158655, 4);
  });

  it('prueba t pareada, efecto y Wilcoxon', () => {
    // R: t.test(c(5,5,7,8,9), c(3,4,5,6,7), paired = TRUE) → t = 9, df = 4, p = 0.000845, IC [1,2447 ; 2,3553]
    const r = pareado([3, 4, 5, 6, 7], [5, 5, 7, 8, 9])!;
    expect(r.diferencia).toBeCloseTo(1.8, 6);
    expect(r.t).toBeCloseTo(9, 4);
    expect(r.gl).toBe(4);
    expect(r.p).toBeCloseTo(0.000845, 5);
    expect(r.ic95![0]).toBeCloseTo(1.2447, 3);
    expect(r.ic95![1]).toBeCloseTo(2.3553, 3);
    expect(r.d).toBeCloseTo(4.025, 2);
    expect(r.magnitud).toBe('grande');
    expect(r.mejoraron).toBe(5);
    // Wilcoxon con 5 diferencias positivas: W+ = 15; z con corrección y empates.
    expect(r.wilcoxon!.w).toBe(15);
    expect(r.wilcoxon!.p).toBeLessThan(0.1);
  });

  it('casos límite', () => {
    expect(pareado([], [])).toBeNull();
    const uno = pareado([4], [6])!;
    expect(uno.t).toBeNull();
    expect(uno.diferencia).toBe(2);
    const iguales = pareado([3, 4], [5, 6])!;
    expect(iguales.t).toBeNull();
    expect(iguales.ic95).toEqual([2, 2]);
    expect(gananciaNormalizada(40, 70)).toBeCloseTo(0.5);
    expect(gananciaNormalizada(100, 100)).toBeNull();
    expect(magnitudEfecto(0.3)).toBe('pequeño');
  });
});
