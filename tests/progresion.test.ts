// Prueba de progresión: un estudiante simulado aprueba los niveles 1 a 10 en cada ruta.
import { describe, expect, it } from 'vitest';
import { aciertosParaAprobar, BANDAS, dificultadPregunta, generarNivel, NIVEL_MAXIMO, PREGUNTAS_POR_NIVEL } from '../src/juego/motor';
import { aplicarResultado, calcularEstrellas } from '../src/juego/progresion';
import { progresoVacio, TODAS_LAS_PISTAS } from '../src/almacenamiento/datos';
import type { Banda, Ejercicio } from '../src/juego/tipos';

/** Magnitud de un ejercicio: el mayor número de sus datos y respuesta. */
function magnitud(ej: Ejercicio): number {
  const nums = Object.values(ej.datos).filter((v): v is number => typeof v === 'number');
  if (typeof ej.respuesta === 'number') nums.push(ej.respuesta);
  return Math.max(0, ...nums);
}

describe('reglas de aprobación y estrellas', () => {
  it('aciertos para pasar según la banda; Inclusión nunca pierde', () => {
    expect(aciertosParaAprobar('g3', 'refuerzo')).toBe(7);
    expect(aciertosParaAprobar('g3', 'basico')).toBe(8);
    expect(aciertosParaAprobar('g3', 'avanzado')).toBe(9);
    expect(aciertosParaAprobar('inclusion', 'avanzado')).toBe(0);
  });
  it('la dificultad sube dentro del rango de la banda', () => {
    for (const banda of Object.keys(BANDAS) as Banda[]) {
      expect(dificultadPregunta(banda, 0)).toBeCloseTo(BANDAS[banda].desde);
      expect(dificultadPregunta(banda, PREGUNTAS_POR_NIVEL - 1)).toBeCloseTo(BANDAS[banda].hasta);
      for (let i = 1; i < PREGUNTAS_POR_NIVEL; i++) expect(dificultadPregunta(banda, i)).toBeGreaterThan(dificultadPregunta(banda, i - 1));
    }
  });
  it('estrellas', () => {
    expect(calcularEstrellas(true, 0, 0)).toBe(3);
    expect(calcularEstrellas(true, 1, 0)).toBe(2);
    expect(calcularEstrellas(true, 0, 1)).toBe(2);
    expect(calcularEstrellas(true, 2, 1)).toBe(1);
    expect(calcularEstrellas(false, 0, 0)).toBe(0);
  });
  it('no aprobar nunca quita semillas ni niveles', () => {
    let p = progresoVacio();
    p = aplicarResultado(p, { pista: 'g2', nivel: 1, aciertos: 10, total: 10, errores: 0, pistasUsadas: 0, intento: 1, repaso: false, semillas: 10 }).progreso;
    const antes = { ...p };
    const e = aplicarResultado(p, { pista: 'g2', nivel: 2, aciertos: 5, total: 10, errores: 6, pistasUsadas: 3, intento: 1, repaso: false, semillas: 1 });
    expect(e.aprobado).toBe(false);
    expect(e.progreso.semillas).toBeGreaterThanOrEqual(antes.semillas);
    expect(e.progreso.nivelMaximoDesbloqueado).toBe(2);
  });
  it('7 de 10 aprueba en Refuerzo pero no en Básico', () => {
    const r = { pista: 'g4' as const, nivel: 1, aciertos: 7, total: 10, errores: 3, pistasUsadas: 0, intento: 1, repaso: false, semillas: 7 };
    expect(aplicarResultado(progresoVacio(), { ...r, banda: 'refuerzo' }).aprobado).toBe(true);
    expect(aplicarResultado(progresoVacio(), { ...r, banda: 'basico' }).aprobado).toBe(false);
  });
});

describe('progresión de 1 a 10 en cada ruta', () => {
  for (const pista of TODAS_LAS_PISTAS) {
    it(`${pista}: 10 preguntas por nivel, se desbloquea de uno en uno`, () => {
      let p = progresoVacio();
      for (let nivel = 1; nivel <= NIVEL_MAXIMO; nivel++) {
        const ejercicios = generarNivel({ codigo: 'FM-1-SIMU', pista, nivel, intento: 1 });
        expect(ejercicios.length).toBe(PREGUNTAS_POR_NIVEL);
        // Casi sin enunciados repetidos (en Inclusión la repetición es parte de la rutina).
        if (pista !== 'inclusion') expect(new Set(ejercicios.map((e) => e.enunciado)).size).toBeGreaterThanOrEqual(PREGUNTAS_POR_NIVEL - 2);
        expect(nivel).toBe(p.nivelMaximoDesbloqueado);
        p = aplicarResultado(p, { pista, nivel, aciertos: 10, total: 10, errores: 0, pistasUsadas: 0, intento: 1, repaso: false, semillas: 10 }).progreso;
      }
      expect(p.nivelMaximoDesbloqueado).toBe(NIVEL_MAXIMO);
      expect(p.niveles[NIVEL_MAXIMO].completado).toBe(true);
      expect(p.etapaPlanta).toBe('cosecha');
      expect(p.insignias).toContain('ruta-completa');
      expect(p.insignias).toContain('explorador');
    });
  }

  it('Avanzado trae números más grandes que Refuerzo en el mismo tema', () => {
    for (const pista of ['g2', 'g3', 'g4', 'g5'] as const) {
      let refuerzo = 0;
      let avanzado = 0;
      for (let intento = 1; intento <= 20; intento++) {
        for (let nivel = 1; nivel <= NIVEL_MAXIMO; nivel++) {
          refuerzo += generarNivel({ codigo: 'CD34', pista, nivel, intento, banda: 'refuerzo' }).reduce((s, e) => s + Math.log10(1 + magnitud(e)), 0);
          avanzado += generarNivel({ codigo: 'CD34', pista, nivel, intento, banda: 'avanzado' }).reduce((s, e) => s + Math.log10(1 + magnitud(e)), 0);
        }
      }
      expect(avanzado, pista).toBeGreaterThan(refuerzo);
    }
  });

  it('la generación es reproducible con la misma semilla y cambia con el intento', () => {
    const a = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 4, intento: 1 }).map((e) => e.enunciado);
    const b = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 4, intento: 1 }).map((e) => e.enunciado);
    const c = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 4, intento: 2 }).map((e) => e.enunciado);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
