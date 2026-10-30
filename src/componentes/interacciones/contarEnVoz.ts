// Contar en voz alta (Inclusión): cada toque dice el número que va («uno», «dos»…) y al final
// «¡Hay tres naranjas!». Solo habla si la lectura en voz alta está activada.

import type { Ejercicio, Objeto, Respuesta } from '../../juego/tipos';
import { esFemenino, nombreObjeto, pluralObjeto } from '../Ilustraciones';
import { enteroEnPalabras } from '../../servicios/numerosEnPalabras';
import { useApp } from '../../estado';
import { useVoz } from '../../servicios/voz';

/** El número del conteo en palabras: 1 → «uno», 7 → «siete». */
export function palabraConteo(n: number): string {
  return enteroEnPalabras(n);
}

/** «¡Hay tres naranjas!», «¡Hay una gallina!» (sin cifras: también es lo que se lee). */
export function textoHay(n: number, objeto?: Objeto): string {
  if (!objeto) return `¡Hay ${palabraConteo(n)}!`;
  const cuantos = enteroEnPalabras(n, esFemenino(objeto) ? 'una' : 'un');
  return `¡Hay ${cuantos} ${n === 1 ? nombreObjeto(objeto) : pluralObjeto(objeto)}!`;
}

/** Lee en voz alta un conteo o un aviso corto, si la voz está activada. */
export function useDecir(): (texto: string) => void {
  const { ajustes } = useApp();
  const voz = useVoz();
  return (texto: string) => {
    if (ajustes.audioEnunciados && voz.disponible) voz.leer(texto, 'conteo');
  };
}

/**
 * Aprendizaje sin error (Inclusión): después de un intento fallido, la respuesta correcta
 * late suave para guiar. null si no hay que guiar.
 */
export function guiaInclusion(ej: Ejercicio, fallidas: Respuesta[], bloqueado: boolean): Respuesta | null {
  return ej.pista === 'inclusion' && fallidas.length > 0 && !bloqueado ? ej.respuesta : null;
}
