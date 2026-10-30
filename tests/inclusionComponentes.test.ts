// Piezas de la ruta de Inclusión: dado, marco de 10, conteo en voz alta, guía sin error y la escena de la cámara.

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DibujoFigura, puntosDado } from '../src/componentes/Figuras';
import { guiaInclusion, palabraConteo, textoHay } from '../src/componentes/interacciones/contarEnVoz';
import { teclaMasMenos } from '../src/componentes/interacciones/Poner';
import { escenaDe } from '../src/componentes/escenaConfig';
import type { Ejercicio, Figura, Interaccion, Respuesta, Visual } from '../src/juego/tipos';

const dibujo = (figura: Figura) => renderToStaticMarkup(createElement(DibujoFigura, { figura }));

function ej(interaccion: Interaccion, respuesta: Respuesta, extra: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'x',
    plantilla: 'x',
    pista: 'inclusion',
    dimension: 'comprension',
    operacion: 'suma',
    enunciado: 'Pon tres naranjas en la canasta.',
    datos: {},
    respuesta,
    validar: (r) => String(r) === String(respuesta),
    distractores: [],
    interaccion,
    pistas: ['', { tipo: 'texto', texto: '' }, ''],
    explicacion: '',
    ...extra,
  };
}

describe('dado', () => {
  it('cada cara tiene tantos puntos como dice, sin repetir lugar', () => {
    for (let n = 1; n <= 6; n++) {
      const p = puntosDado(n);
      expect(p).toHaveLength(n);
      expect(new Set(p.map((x) => x.join(','))).size).toBe(n);
      expect((dibujo({ dado: n }).match(/<circle/g) ?? []).length).toBe(n);
    }
  });
  it('las caras clásicas: el uno en el centro, el cinco con centro, el seis sin centro', () => {
    expect(puntosDado(1)).toEqual([[20, 20]]);
    expect(puntosDado(5)).toContainEqual([20, 20]);
    expect(puntosDado(6)).not.toContainEqual([20, 20]);
  });
});

describe('marco de 10', () => {
  it('diez casillas; se llenan las primeras (fila de arriba primero)', () => {
    for (const n of [0, 1, 5, 7, 10]) {
      const h = dibujo({ marco: n, objeto: 'huevo' });
      expect((h.match(/class="marco-casilla/g) ?? []).length).toBe(10);
      const llenas = [...h.matchAll(/class="marco-casilla( llena)?/g)].map((m) => !!m[1]);
      expect(llenas).toEqual(Array.from({ length: 10 }, (_, k) => k < n));
    }
  });
  it('sin objeto, fichas redondas', () => {
    const h = dibujo({ marco: 3 });
    expect((h.match(/<circle/g) ?? []).length).toBe(3);
    expect(h).not.toMatch(/NaN|undefined/);
  });
});

describe('contar en voz alta', () => {
  it('en palabras, sin cifras', () => {
    expect([1, 2, 3, 10].map(palabraConteo)).toEqual(['uno', 'dos', 'tres', 'diez']);
    expect(textoHay(3, 'gallina')).toBe('¡Hay tres gallinas!');
    expect(textoHay(1, 'gallina')).toBe('¡Hay una gallina!');
    expect(textoHay(1, 'huevo')).toBe('¡Hay un huevo!');
    for (let n = 1; n <= 10; n++) expect(textoHay(n, 'naranja')).not.toMatch(/\d/);
  });
  it('teclas para sumar y quitar uno', () => {
    const t = (key: string) => teclaMasMenos({ key } as KeyboardEvent);
    expect(['+', 'ArrowUp', 'ArrowRight'].map(t)).toEqual([1, 1, 1]);
    expect(['-', 'ArrowDown', 'ArrowLeft', 'Backspace'].map(t)).toEqual([-1, -1, -1, -1]);
    expect(t('a')).toBe(0);
  });
});

describe('aprendizaje sin error', () => {
  const e = ej({ tipo: 'opciones', opciones: [2, 3] }, 3);
  it('guía a la correcta solo en Inclusión y después de un intento fallido', () => {
    expect(guiaInclusion(e, [], false)).toBeNull();
    expect(guiaInclusion(e, [2], false)).toBe(3);
    expect(guiaInclusion(e, [2], true)).toBeNull();
    expect(guiaInclusion({ ...e, pista: 'g1' }, [2], false)).toBeNull();
  });
});

describe('ver en mi finca (escena de la cámara)', () => {
  it('poner: los objetos van a la canasta del enunciado', () => {
    expect(escenaDe(ej({ tipo: 'poner', objeto: 'naranja', cantidad: 3, disponibles: 5, recipiente: { nombre: 'la canasta', dibujo: 'canasta' } }, 3))).toEqual({
      modo: 'canasta',
      objeto: 'naranja',
      dentro: 0,
      fuera: 3,
      quitar: false,
      recipiente: { nombre: 'la canasta', dibujo: 'canasta' },
    });
    // Una persona no se dibuja como recipiente: se cuentan los objetos.
    expect(escenaDe(ej({ tipo: 'poner', objeto: 'pan', cantidad: 2, disponibles: 4, recipiente: { nombre: 'Ana', dibujo: 'nino' } }, 2))).toEqual({ modo: 'contar', objeto: 'pan', cantidad: 2 });
  });
  it('marco, emparejar y canastas para comparar', () => {
    expect(escenaDe(ej({ tipo: 'marco', cantidad: 7, objeto: 'huevo' }, 7))).toEqual({ modo: 'contar', objeto: 'huevo', cantidad: 7 });
    expect(escenaDe(ej({ tipo: 'emparejar', objeto: 'pan', opciones: [2, 4] }, 4))).toEqual({ modo: 'contar', objeto: 'pan', cantidad: 4 });
    const canastas: Interaccion = {
      tipo: 'figuras',
      opciones: [
        { id: 'a', etiqueta: 'vacía', figura: { objeto: 'huevo', cantidad: 0 } },
        { id: 'b', etiqueta: 'con huevos', figura: { objeto: 'huevo', cantidad: 4 } },
      ],
    };
    expect(escenaDe(ej(canastas, 'a'))).toEqual({ modo: 'contar', objeto: 'huevo', cantidad: 4 });
    // Figuras sin objetos que contar (formas, colores): sin cámara.
    expect(escenaDe(ej({ tipo: 'figuras', opciones: [{ id: 'a', etiqueta: 'círculo', figura: { forma: 'circulo' } }] }, 'a'))).toBeNull();
  });
  it('el marco con dibujos del enunciado', () => {
    const dibujoMarco: Visual = { tipo: 'figuras', figuras: [{ id: 'm', etiqueta: '', figura: { marco: 6, objeto: 'naranja' } }] };
    expect(escenaDe(ej({ tipo: 'opciones', opciones: [5, 6, 7] }, 6, { dibujo: dibujoMarco }))).toEqual({ modo: 'contar', objeto: 'naranja', cantidad: 6 });
  });
});
