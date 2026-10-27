import { describe, expect, it } from 'vitest';
import { guiaFamilias, todosLosVideos, videosLecciones } from '../src/contenido/videos';
import { lecciones } from '../src/contenido/lecciones';

describe('videos de ayuda', () => {
  it('cada ruta tiene 10 lecciones y una casilla de video por tema (puede estar vacía)', () => {
    for (const [pista, lista] of Object.entries(lecciones)) {
      expect(lista, pista).toHaveLength(10);
      expect(videosLecciones[pista as keyof typeof videosLecciones], pista).toHaveLength(10);
    }
  });

  it('los identificadores tienen el formato de YouTube', () => {
    for (const v of todosLosVideos()) expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
  });

  it('la guía de familias trae videos con tema', () => {
    expect(guiaFamilias.length).toBeGreaterThanOrEqual(5);
    for (const g of guiaFamilias) expect(g.tema.length).toBeGreaterThan(3);
  });
});
