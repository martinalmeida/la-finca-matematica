// Apoyo extra para quienes aprenden a otro ritmo: menos opciones para elegir y
// datos para el «paso a paso» (qué pasa en el problema y cómo se ve).

import type { Calculo, Ejercicio, Respuesta } from './tipos';

/** Factor que baja la dificultad dentro de la unidad (números más pequeños). */
export const FACTOR_DIFICULTAD_APOYO = 0.5;

/** Deja la respuesta correcta y el distractor más cercano, en el orden original. */
export function dosOpciones<T extends Respuesta>(opciones: T[], esCorrecta: (o: T) => boolean): T[] {
  if (opciones.length <= 2) return opciones;
  const correcta = opciones.find(esCorrecta);
  if (correcta === undefined) return opciones;
  const otras = opciones.filter((o) => o !== correcta);
  const c = Number(correcta);
  const cercana = typeof correcta === 'number' && otras.every((o) => typeof o === 'number')
    ? [...otras].sort((a, b) => Math.abs(Number(a) - c) - Math.abs(Number(b) - c))[0]
    : otras[0];
  return opciones.filter((o) => o === correcta || o === cercana);
}

/** Copia del ejercicio con menos opciones para elegir (2 en lugar de 3 o 4). */
export function reducirOpciones(ej: Ejercicio): Ejercicio {
  const i = ej.interaccion;
  switch (i.tipo) {
    case 'opciones':
      return { ...ej, interaccion: { ...i, opciones: dosOpciones(i.opciones, (o) => ej.validar(o)) } };
    case 'contar':
      return { ...ej, interaccion: { ...i, opciones: dosOpciones(i.opciones, (o) => ej.validar(o)) } };
    case 'tabla':
      return i.opciones ? { ...ej, interaccion: { ...i, opciones: dosOpciones(i.opciones, (o) => ej.validar(o)) } } : ej;
    case 'razonable': {
      const est = Number(String(ej.respuesta).split(':')[1]);
      return { ...ej, interaccion: { ...i, opciones: dosOpciones(i.opciones, (o) => o === est) } };
    }
    default:
      return ej;
  }
}

export type Accion = 'juntar' | 'quitar' | 'repetir' | 'repartir';

/** Qué pasa en el problema, según el cálculo principal (null si no aplica el paso a paso). */
export function accionDe(calculo: Calculo | undefined): Accion | null {
  switch (calculo?.op) {
    case 'suma':
      return 'juntar';
    case 'resta':
      return 'quitar';
    case 'multiplicacion':
      return 'repetir';
    case 'division':
      return 'repartir';
    default:
      return null;
  }
}

export const ACCIONES: Record<Accion, { nombre: string; signo: string; ayuda: string }> = {
  juntar: { nombre: 'Juntar', signo: '+', ayuda: 'Se juntan o se agregan cosas: sumamos.' },
  quitar: { nombre: 'Quitar', signo: '−', ayuda: 'Se quitan, se gastan o se comparan cosas: restamos.' },
  repetir: { nombre: 'Repetir grupos', signo: '×', ayuda: 'Se repite el mismo grupo varias veces: multiplicamos.' },
  repartir: { nombre: 'Repartir', signo: '÷', ayuda: 'Se reparte en partes iguales: dividimos.' },
};
