// Prueba de progresión: un estudiante simulado aprueba los niveles 0 a 100 en cada pista.
import { describe, expect, it } from 'vitest';
import { definiciones } from '../src/contenido/pistas';
import { aciertosParaAprobar, cantidadEjercicios, generarNivel, indiceDificultad, LIMITES_TRAMOS } from '../src/juego/motor';
import { aplicarResultado, calcularEstrellas } from '../src/juego/progresion';
import { progresoVacio } from '../src/almacenamiento/datos';
import type { Ejercicio, Pista } from '../src/juego/tipos';

const PISTAS = Object.keys(definiciones) as Pista[];

/** Magnitud de un ejercicio: el mayor número de sus datos y respuesta. */
function magnitud(ej: Ejercicio): number {
  const nums = Object.values(ej.datos).filter((v): v is number => typeof v === 'number');
  if (typeof ej.respuesta === 'number') nums.push(ej.respuesta);
  return Math.max(0, ...nums);
}

function mediaMagnitud(pista: Pista, nivel: number, muestras = 40): number {
  let s = 0;
  let n = 0;
  for (let i = 0; i < muestras; i++) {
    for (const ej of generarNivel({ codigo: 'FM-P-TEST', pista, nivel, intento: i + 1 })) {
      s += Math.log10(1 + magnitud(ej));
      n++;
    }
  }
  return s / n;
}

describe('reglas de aprobación y estrellas', () => {
  it('4 de 5 y 3 de 4', () => {
    expect(cantidadEjercicios('g1')).toBe(4);
    expect(aciertosParaAprobar('g1')).toBe(3);
    expect(cantidadEjercicios('g3')).toBe(5);
    expect(aciertosParaAprobar('g3')).toBe(4);
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
    p = aplicarResultado(p, { pista: 'g2', nivel: 0, aciertos: 5, total: 5, errores: 0, pistasUsadas: 0, intento: 1, repaso: false, semillas: 5 }).progreso;
    const antes = { ...p };
    const e = aplicarResultado(p, { pista: 'g2', nivel: 1, aciertos: 1, total: 5, errores: 6, pistasUsadas: 3, intento: 1, repaso: false, semillas: 1 });
    expect(e.aprobado).toBe(false);
    expect(e.progreso.semillas).toBeGreaterThanOrEqual(antes.semillas);
    expect(e.progreso.nivelMaximoDesbloqueado).toBe(1);
  });
});

describe('progresión de 0 a 100 en cada pista', () => {
  for (const pista of PISTAS) {
    it(`${pista}: se desbloquea de uno en uno y la dificultad nunca baja`, () => {
      let p = progresoVacio();
      let previo = -1;
      for (let nivel = 0; nivel <= 100; nivel++) {
        const ejercicios = generarNivel({ codigo: 'FM-1-SIMU', pista, nivel, intento: 1 });
        expect(ejercicios.length).toBe(cantidadEjercicios(pista));
        // Sin enunciados repetidos dentro del nivel.
        expect(new Set(ejercicios.map((e) => e.enunciado)).size).toBe(ejercicios.length);
        // Cada nivel (salvo los muy cortos) mezcla al menos 3 dimensiones.
        expect(new Set(ejercicios.map((e) => e.dimension)).size).toBeGreaterThanOrEqual(3);
        expect(nivel).toBe(p.nivelMaximoDesbloqueado);
        const e = aplicarResultado(p, { pista, nivel, aciertos: ejercicios.length, total: ejercicios.length, errores: 0, pistasUsadas: 0, intento: 1, repaso: false, semillas: ejercicios.length });
        p = e.progreso;
        const indice = indiceDificultad(nivel);
        expect(indice).toBeGreaterThanOrEqual(previo);
        previo = indice;
      }
      expect(p.nivelMaximoDesbloqueado).toBe(100);
      expect(p.niveles[100].completado).toBe(true);
      expect(p.etapaPlanta).toBe('cosecha');
      expect(p.insignias).toContain('cosechador-100');
      expect(p.insignias).toContain('explorador');
    });

    it(`${pista}: dentro de cada tramo, los números no se achican al subir la dificultad`, () => {
      for (const [a, b] of LIMITES_TRAMOS) {
        if (a === b) continue;
        // Se comparan niveles que no son de cosecha.
        const inicio = a % 10 === 0 ? a + 1 : a;
        const fin = b % 10 === 0 ? b - 1 : b;
        expect(mediaMagnitud(pista, fin) + 0.05).toBeGreaterThanOrEqual(mediaMagnitud(pista, inicio));
      }
    });
  }

  it('la generación es reproducible con la misma semilla y cambia con el intento', () => {
    const a = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 40, intento: 1 }).map((e) => e.enunciado);
    const b = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 40, intento: 1 }).map((e) => e.enunciado);
    const c = generarNivel({ codigo: 'FM-3-AAAA', pista: 'g3', nivel: 40, intento: 2 }).map((e) => e.enunciado);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
