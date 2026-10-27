// Pruebas diagnóstica y final: qué banda o ruta asigna el puntaje y cómo se comparan.

import type { Banda, Pista } from './tipos';
import { definicion } from './motor';

export type ResultadoPrueba = {
  fecha: string;
  /** Pista de la que salieron las preguntas (el grado, o «familia» para padres). */
  pista: Pista;
  /** Acierto o no en la pregunta de cada tema, en orden. */
  porTema: boolean[];
  aciertos: number;
  total: number;
  /** Duración total en milisegundos. */
  ms: number;
};

/** 0–4 Refuerzo, 5–7 Básico, 8–10 Avanzado (escalado si la prueba no tiene 10 preguntas). */
export function bandaPorPuntaje(aciertos: number, total = 10): Banda {
  const p = total > 0 ? (10 * aciertos) / total : 0;
  if (p >= 8) return 'avanzado';
  if (p >= 5) return 'basico';
  return 'refuerzo';
}

/** Ruta de padres: 0–4 Básica, 5–7 Intermedia, 8–10 Avanzada. */
export function rutaFamiliaPorPuntaje(aciertos: number, total = 10): Pista {
  const banda = bandaPorPuntaje(aciertos, total);
  return banda === 'avanzado' ? 'fam-avanzada' : banda === 'basico' ? 'fam-intermedia' : 'fam-basica';
}

export type ComparacionTema = { titulo: string; antes: boolean; despues: boolean };

export type Comparacion = {
  temas: ComparacionTema[];
  antes: number;
  despues: number;
  total: number;
  /** Temas que pasaron de error a acierto. */
  mejoras: number;
};

/** Compara la final con la diagnóstica tema por tema. */
export function compararPruebas(diagnostica: ResultadoPrueba, final: ResultadoPrueba): Comparacion {
  const temas = definicion(diagnostica.pista).temas.map((t, k) => ({
    titulo: t.titulo,
    antes: !!diagnostica.porTema[k],
    despues: !!final.porTema[k],
  }));
  return {
    temas,
    antes: diagnostica.aciertos,
    despues: final.aciertos,
    total: diagnostica.total,
    mejoras: temas.filter((t) => !t.antes && t.despues).length,
  };
}
