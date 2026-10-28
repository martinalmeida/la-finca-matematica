import { describe, expect, it } from 'vitest';
import { guiaFamilias, repetidosPermitidos, todosLosVideos, videosLecciones } from '../src/contenido/videos';
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

  it('los identificadores tienen el formato de YouTube y cada video trae título, canal y duración', () => {
    for (const v of todosLosVideos()) {
      expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(v.titulo.length, v.id).toBeGreaterThan(3);
      expect(v.canal.length, v.id).toBeGreaterThan(1);
      expect(v.duracion, v.id).toMatch(/^\d{1,2}:\d{2}$/);
    }
  });

  it('dentro de una ruta no se repite un video (cada nivel trata un tema distinto)', () => {
    for (const [pista, lista] of Object.entries(videosLecciones) as [Pista, { id: string }[]][]) {
      const permitidos = repetidosPermitidos[pista] ?? [];
      const vistos = new Set<string>();
      for (const v of lista) {
        if (!permitidos.includes(v.id)) expect(vistos.has(v.id), `${pista}: ${v.id} repetido`).toBe(false);
        vistos.add(v.id);
      }
    }
  });

  it('un mismo video no tiene dos títulos distintos', () => {
    const titulos = new Map<string, string>();
    for (const lista of Object.values(videosLecciones))
      for (const v of lista) {
        expect(titulos.get(v.id) ?? v.titulo, v.id).toBe(v.titulo);
        titulos.set(v.id, v.titulo);
      }
  });

  it('la guía de familias trae videos con tema', () => {
    expect(guiaFamilias.length).toBeGreaterThanOrEqual(5);
    for (const g of guiaFamilias) expect(g.tema.length).toBeGreaterThan(3);
  });
});
