import { describe, expect, it } from 'vitest';
import { guiaFamilias, todosLosVideos, videosLecciones } from '../src/contenido/videos';
import { lecciones } from '../src/contenido/lecciones';

describe('videos de ayuda', () => {
  it('cada ruta tiene 10 lecciones y un video de introducción en cada uno de sus 10 niveles', () => {
    for (const [pista, lista] of Object.entries(lecciones)) {
      expect(lista, pista).toHaveLength(10);
      const videos = videosLecciones[pista as keyof typeof videosLecciones];
      expect(videos, pista).toHaveLength(10);
      videos.forEach((v, k) => expect(v, `${pista}, nivel ${k + 1}`).toBeTruthy());
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
