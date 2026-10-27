// Banda Refuerzo: menos opciones (siempre con la correcta) y paso a paso.
import { describe, expect, it } from 'vitest';
import { generarNivel, NIVEL_MAXIMO } from '../src/juego/motor';
import { accionDe, dosOpciones } from '../src/juego/apoyo';
import { TODAS_LAS_PISTAS } from '../src/almacenamiento/datos';
import type { Ejercicio } from '../src/juego/tipos';

function opcionesDe(ej: Ejercicio) {
  const i = ej.interaccion;
  return i.tipo === 'opciones' || i.tipo === 'contar' || i.tipo === 'razonable' ? i.opciones : i.tipo === 'tabla' ? i.opciones : undefined;
}

describe('banda Refuerzo', () => {
  it('dosOpciones deja la correcta y la más cercana, en el mismo orden', () => {
    expect(dosOpciones([12, 30, 15, 2], (o) => o === 15)).toEqual([12, 15]);
    expect(dosOpciones(['Ana', 'Tienen igual', 'Luis'], (o) => o === 'Luis')).toEqual(['Ana', 'Luis']);
    expect(dosOpciones([3, 4], (o) => o === 4)).toEqual([3, 4]);
  });

  it('en todas las rutas (menos Inclusión), las opciones bajan a 2 y la respuesta sigue ahí', () => {
    for (const pista of TODAS_LAS_PISTAS.filter((p) => p !== 'inclusion')) {
      for (let nivel = 1; nivel <= NIVEL_MAXIMO; nivel++) {
        for (const ej of generarNivel({ codigo: 'AB12', pista, nivel, intento: 1, banda: 'refuerzo' })) {
          expect(ej.apoyo).toBe(true);
          const op = opcionesDe(ej);
          if (!op) continue;
          expect(op.length, `${ej.plantilla} ${JSON.stringify(op)}`).toBe(2);
          const objetivo = ej.interaccion.tipo === 'razonable' ? Number(String(ej.respuesta).split(':')[1]) : null;
          expect(op.some((o) => (objetivo !== null ? o === objetivo : ej.validar(o))), `${ej.plantilla}: ${JSON.stringify(op)} sin ${ej.respuesta}`).toBe(true);
        }
      }
    }
  });

  it('el paso a paso sabe qué pasa en cada operación', () => {
    expect(accionDe({ op: 'suma', a: 1, b: 2 })).toBe('juntar');
    expect(accionDe({ op: 'resta', a: 5, b: 2 })).toBe('quitar');
    expect(accionDe({ op: 'multiplicacion', a: 3, b: 2 })).toBe('repetir');
    expect(accionDe({ op: 'division', a: 6, b: 2 })).toBe('repartir');
    expect(accionDe({ op: 'conteo', a: 6, b: 0 })).toBeNull();
    expect(accionDe(undefined)).toBeNull();
  });
});
