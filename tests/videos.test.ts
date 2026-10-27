import { describe, expect, it } from 'vitest';
import { guiaFamilias, todosLosVideos, videosLecciones } from '../src/contenido/videos';
import { lecciones } from '../src/contenido/lecciones';
import { unidadesDe } from '../src/juego/complejidad';
import { nivelMaximo } from '../src/juego/motor';
import type { Pista } from '../src/juego/tipos';

describe('videos de ayuda', () => {
  it('cada ruta tiene una lección por unidad y un video de introducción en cada nivel', () => {
    for (const [pista, lista] of Object.entries(lecciones) as [Pista, unknown[]][]) {
      expect(lista, pista).toHaveLength(unidadesDe(pista).length);
      const videos = videosLecciones[pista];
      expect(videos, pista).toHaveLength(nivelMaximo(pista));
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
