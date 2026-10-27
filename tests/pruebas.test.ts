// Pruebas diagnóstica y final: una pregunta por tema, forma paralela, bandas y rutas.
import { describe, expect, it } from 'vitest';
import { definicion, generarPrueba } from '../src/juego/motor';
import { bandaPorPuntaje, compararPruebas, rutaFamiliaPorPuntaje, type ResultadoPrueba } from '../src/juego/pruebas';
import type { Pista } from '../src/juego/tipos';

const PISTAS_PRUEBA: Pista[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'familia'];

describe('pruebas diagnóstica y final', () => {
  for (const pista of PISTAS_PRUEBA) {
    it(`${pista}: 10 preguntas, una por tema; la final es distinta pero de los mismos temas`, () => {
      const diag = generarPrueba({ codigo: 'FM-3-PRUE', pista, tipo: 'diagnostica' });
      const final = generarPrueba({ codigo: 'FM-3-PRUE', pista, tipo: 'final' });
      expect(diag.length).toBe(10);
      expect(final.length).toBe(10);
      definicion(pista).temas.forEach((t, k) => {
        const uso = t.prueba ?? t.usos[0];
        expect(diag[k].plantilla).toBe(uso.plantilla.id);
        expect(final[k].plantilla).toBe(uso.plantilla.id);
        expect(diag[k].validar(diag[k].respuesta)).toBe(true);
      });
      expect(diag.map((e) => e.enunciado)).not.toEqual(final.map((e) => e.enunciado));
      // Reproducible.
      expect(generarPrueba({ codigo: 'FM-3-PRUE', pista, tipo: 'diagnostica' }).map((e) => e.enunciado)).toEqual(diag.map((e) => e.enunciado));
    });
  }

  it('la diagnóstica muestra varias formas de responder (sirve de tutorial)', () => {
    for (const pista of ['g1', 'g2', 'g3'] as Pista[]) {
      const tipos = new Set(generarPrueba({ codigo: 'FM-1-TUTO', pista, tipo: 'diagnostica' }).map((e) => e.interaccion.tipo));
      expect(tipos.size, pista).toBeGreaterThanOrEqual(3);
    }
  });

  it('bandas por puntaje', () => {
    expect([0, 4].map((n) => bandaPorPuntaje(n))).toEqual(['refuerzo', 'refuerzo']);
    expect([5, 7].map((n) => bandaPorPuntaje(n))).toEqual(['basico', 'basico']);
    expect([8, 10].map((n) => bandaPorPuntaje(n))).toEqual(['avanzado', 'avanzado']);
  });

  it('rutas de padres por puntaje', () => {
    expect(rutaFamiliaPorPuntaje(3)).toBe('fam-basica');
    expect(rutaFamiliaPorPuntaje(6)).toBe('fam-intermedia');
    expect(rutaFamiliaPorPuntaje(9)).toBe('fam-avanzada');
  });

  it('compara la final con la diagnóstica tema por tema', () => {
    const base = { fecha: '', pista: 'g2' as Pista, total: 10, ms: 0 };
    const diag: ResultadoPrueba = { ...base, porTema: [true, false, false, true, false, false, false, false, false, false], aciertos: 2 };
    const final: ResultadoPrueba = { ...base, porTema: [true, true, true, true, false, true, false, true, false, false], aciertos: 6 };
    const c = compararPruebas(diag, final);
    expect(c.antes).toBe(2);
    expect(c.despues).toBe(6);
    expect(c.mejoras).toBe(4);
    expect(c.temas.length).toBe(10);
    expect(c.temas[1]).toEqual({ titulo: definicion('g2').temas[1].titulo, antes: false, despues: true });
  });
});
