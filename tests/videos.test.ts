import { describe, expect, it } from 'vitest';
import { guiaFamilias, todosLosVideos, videosLecciones } from '../src/contenido/videos';
import { lecciones } from '../src/contenido/lecciones';

describe('videos de ayuda', () => {
  it('cada lección de cada grado y de familias tiene su video', () => {
    for (const [pista, lista] of Object.entries(lecciones)) {
      expect(videosLecciones[pista as keyof typeof videosLecciones]).toHaveLength(lista.length);
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
