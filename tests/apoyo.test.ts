// Apoyo extra: menos opciones (siempre con la correcta) y números más pequeños en la misma unidad.
import { describe, expect, it } from 'vitest';
import { generarNivel } from '../src/juego/motor';
import { accionDe, dosOpciones } from '../src/juego/apoyo';
import type { Ejercicio, Pista } from '../src/juego/tipos';

function opcionesDe(ej: Ejercicio) {
  const i = ej.interaccion;
  return i.tipo === 'opciones' || i.tipo === 'contar' || i.tipo === 'razonable' ? i.opciones : i.tipo === 'tabla' ? i.opciones : undefined;
}

describe('apoyo extra', () => {
  it('dosOpciones deja la correcta y la más cercana, en el mismo orden', () => {
    expect(dosOpciones([12, 30, 15, 2], (o) => o === 15)).toEqual([12, 15]);
    expect(dosOpciones(['Ana', 'Tienen igual', 'Luis'], (o) => o === 'Luis')).toEqual(['Ana', 'Luis']);
    expect(dosOpciones([3, 4], (o) => o === 4)).toEqual([3, 4]);
  });

  it('en todos los grados, las opciones bajan a 2 y la respuesta sigue ahí', () => {
    for (const pista of ['g1', 'g2', 'g3', 'g4', 'g5', 'familia'] as Pista[]) {
      for (let nivel = 0; nivel <= 100; nivel += 3) {
        for (const ej of generarNivel({ codigo: 'AB12', pista, nivel, intento: 1, apoyo: true })) {
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

  it('con apoyo, los números son más pequeños dentro de la misma unidad', () => {
    let con = 0;
    let sin = 0;
    for (let intento = 1; intento <= 40; intento++) {
      for (const nivel of [30, 50, 70, 88]) {
        const suma = (apoyo: boolean) =>
          generarNivel({ codigo: 'CD34', pista: 'g2', nivel, intento, apoyo })
            .filter((e) => typeof e.respuesta === 'number')
            .reduce((s, e) => s + Number(e.respuesta), 0);
        con += suma(true);
        sin += suma(false);
      }
    }
    expect(con).toBeLessThan(sin);
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
