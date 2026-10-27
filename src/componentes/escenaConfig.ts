// Qué se muestra en la realidad aumentada para cada ejercicio. Va aparte de EscenaRA
// para que three.js y LocAR.js solo se descarguen cuando alguien abre la cámara.

import type { Ejercicio, Objeto } from '../juego/tipos';

export type ConfigEscena =
  /** Tocar cada objeto para contarlo. */
  | { modo: 'contar'; objeto: Objeto; cantidad: number }
  /** Meter objetos al recipiente (juntar) o sacarlos (quitar). El recipiente es el que nombra el enunciado. */
  | { modo: 'canasta'; objeto: Objeto; dentro: number; fuera: number; quitar: boolean; recipiente: { nombre: string; dibujo: Objeto } }
  /** Mostrar una cantidad (después de escribir un número en el Taller). */
  | { modo: 'cantidad'; objeto: Objeto; cantidad: number }
  /** Contar cosas reales: cada toque en la pantalla pone una marca numerada. */
  | { modo: 'real' };

/** Recipiente que nombra el enunciado («en la cubeta», «en el canasto»…). */
function recipienteDelTexto(texto: string): { nombre: string; dibujo: Objeto } | null {
  const lista: [RegExp, string, Objeto][] = [
    [/canasto/i, 'el canasto', 'canasta'],
    [/canasta/i, 'la canasta', 'canasta'],
    [/cubeta/i, 'la cubeta', 'cubeta'],
    [/bolsa/i, 'la bolsa', 'bolsa'],
  ];
  const r = lista.find(([re]) => re.test(texto));
  return r ? { nombre: r[1], dibujo: r[2] } : null;
}

/** Escena que corresponde a un ejercicio, si tiene objetos para ver en la cámara. */
export function escenaDe(ej: Ejercicio): ConfigEscena | null {
  const i = ej.interaccion;
  const recipiente = recipienteDelTexto(ej.enunciado);
  if (i.tipo === 'contar') return { modo: 'contar', objeto: i.objeto, cantidad: i.cantidad };
  // Sin un recipiente en el enunciado no se pone una canasta inventada: se cuentan los objetos.
  if (i.tipo === 'arrastrar' && i.modo === 'juntar' && i.a + i.b <= 20)
    return recipiente ? { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: i.b, quitar: false, recipiente } : { modo: 'contar', objeto: i.objeto, cantidad: i.a + i.b };
  if (i.tipo === 'arrastrar' && i.modo === 'quitar' && i.a <= 20)
    return recipiente ? { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: 0, quitar: true, recipiente } : { modo: 'contar', objeto: i.objeto, cantidad: i.a };
  const v = ej.pistas[1];
  if (v.tipo === 'objetos') {
    const total = v.grupos.reduce((s, g) => s + g, 0);
    if (total > 20) return null;
    if (recipiente && v.tachados) return { modo: 'canasta', objeto: v.objeto, dentro: total, fuera: 0, quitar: true, recipiente };
    if (recipiente && v.grupos.length === 2 && !v.vacios) return { modo: 'canasta', objeto: v.objeto, dentro: v.grupos[0], fuera: v.grupos[1], quitar: false, recipiente };
    return { modo: 'contar', objeto: v.objeto, cantidad: total };
  }
  return null;
}
