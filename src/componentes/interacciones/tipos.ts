import type { Ejercicio, Respuesta } from '../../juego/tipos';

export type PropsInteraccion = {
  ej: Ejercicio;
  /** No se puede responder (ya acertó o se mostró la solución). */
  bloqueado: boolean;
  onResponder: (r: Respuesta) => void;
  /** Respuestas equivocadas ya intentadas (para marcar opciones). */
  fallidas: Respuesta[];
  /** Respuesta correcta revelada (tras acertar o ver la solución). */
  correcta: Respuesta | null;
  /** Intentos fallidos (sube aunque no se marquen las fallidas, como en Inclusión): limpia la pizarra. */
  errores?: number;
};
