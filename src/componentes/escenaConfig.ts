// Qué se muestra en la realidad aumentada para cada ejercicio. Va aparte de EscenaRA
// para que three.js y LocAR.js solo se descarguen cuando alguien abre la cámara.

import type { Ejercicio, Objeto } from '../juego/tipos';

export type ConfigEscena =
  /** Tocar cada objeto para contarlo. */
  | { modo: 'contar'; objeto: Objeto; cantidad: number }
  /** Meter objetos a la canasta (juntar) o sacarlos (quitar). */
  | { modo: 'canasta'; objeto: Objeto; dentro: number; fuera: number; quitar: boolean }
  /** Mostrar una cantidad (después de escribir un número en el Taller). */
  | { modo: 'cantidad'; objeto: Objeto; cantidad: number }
  /** Contar cosas reales: cada toque en la pantalla pone una marca numerada. */
  | { modo: 'real' };

/** Escena que corresponde a un ejercicio, si tiene objetos para ver en la cámara. */
export function escenaDe(ej: Ejercicio): ConfigEscena | null {
  const i = ej.interaccion;
  if (i.tipo === 'contar') return { modo: 'contar', objeto: i.objeto, cantidad: i.cantidad };
  if (i.tipo === 'arrastrar' && i.modo === 'juntar' && i.a + i.b <= 20) return { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: i.b, quitar: false };
  if (i.tipo === 'arrastrar' && i.modo === 'quitar' && i.a <= 20) return { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: 0, quitar: true };
  const v = ej.pistas[1];
  if (v.tipo === 'objetos') {
    const total = v.grupos.reduce((s, g) => s + g, 0);
    if (total > 20) return null;
    if (v.tachados) return { modo: 'canasta', objeto: v.objeto, dentro: total, fuera: 0, quitar: true };
    if (v.grupos.length === 2) return { modo: 'canasta', objeto: v.objeto, dentro: v.grupos[0], fuera: v.grupos[1], quitar: false };
    return { modo: 'contar', objeto: v.objeto, cantidad: total };
  }
  return null;
}
