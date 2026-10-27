// Niveles de complejidad ligados al grado: cada grado tiene su propia ruta de 101 niveles,
// dividida en 7 unidades (los tramos del motor), y cada unidad tiene una etiqueta de complejidad.

import type { Pista } from './tipos';
import { definicion, indiceTramo, LIMITES_TRAMOS } from './motor';
import { num } from '../contenido/contexto';

export type Complejidad = { id: 'inicio' | 'basico' | 'intermedio' | 'avanzado' | 'reto'; nombre: string; barras: 1 | 2 | 3 | 4 | 5 };

const COMPLEJIDADES: Complejidad[] = [
  { id: 'inicio', nombre: 'Inicio', barras: 1 },
  { id: 'basico', nombre: 'Básico', barras: 2 },
  { id: 'basico', nombre: 'Básico', barras: 2 },
  { id: 'intermedio', nombre: 'Intermedio', barras: 3 },
  { id: 'intermedio', nombre: 'Intermedio', barras: 3 },
  { id: 'avanzado', nombre: 'Avanzado', barras: 4 },
  { id: 'reto', nombre: 'Reto', barras: 5 },
];

export type Unidad = {
  indice: number;
  inicio: number;
  fin: number;
  titulo: string;
  complejidad: Complejidad;
};

/** Las 7 unidades de la ruta de un grado, con su complejidad. */
export function unidadesDe(pista: Pista): Unidad[] {
  return definicion(pista).tramos.map((t, k) => ({
    indice: k,
    inicio: LIMITES_TRAMOS[k][0],
    fin: LIMITES_TRAMOS[k][1],
    titulo: t.titulo,
    complejidad: COMPLEJIDADES[k],
  }));
}

export function unidadDe(pista: Pista, nivel: number): Unidad {
  return unidadesDe(pista)[indiceTramo(Math.min(nivel, 100))];
}

/** Lo que trabaja cada grado: rango numérico y operaciones (para mostrar en la ruta y el perfil). */
export const RESUMEN_GRADO: Record<Pista, { nombre: string; corto: string; foco: string }> = {
  g1: { nombre: 'Ruta de 1.º', corto: '1.º', foco: 'Contar, sumar y restar' },
  g2: { nombre: 'Ruta de 2.º', corto: '2.º', foco: 'Sumar y restar llevando; grupos iguales' },
  g3: { nombre: 'Ruta de 3.º', corto: '3.º', foco: 'Tablas, multiplicar y repartir' },
  g4: { nombre: 'Ruta de 4.º', corto: '4.º', foco: 'Multiplicar por 2 cifras y dividir con residuo' },
  g5: { nombre: 'Ruta de 5.º', corto: '5.º', foco: 'Números grandes, divisiones y proporciones' },
  familia: { nombre: 'Cuaderno de la finca', corto: 'Familia', foco: 'Cuentas de la casa y la finca' },
};

/** Complejidad del grado frente a los demás (1 a 5 barras). */
export function barrasGrado(pista: Pista): number {
  return pista === 'familia' ? 5 : Number(pista.slice(1));
}

export function rangoNumeros(pista: Pista): string {
  const limite = definicion(pista).limite;
  return limite >= 10_000_000 ? 'Números de la vida diaria' : `Números hasta ${num(limite)}`;
}

/** Nivel con el que se practica una unidad: el nivel actual si está dentro de ella; si no, su primer nivel. */
export function nivelParaPracticar(u: Unidad, actual: number): number {
  return actual >= u.inicio && actual <= u.fin ? actual : u.inicio;
}

/** Se puede ver la lección de las unidades ya abiertas y de la siguiente (como adelanto). */
export function leccionDisponible(u: Unidad, actual: number, unidades: Unidad[]): boolean {
  const k = unidades.findIndex((x) => actual >= x.inicio && actual <= x.fin);
  return u.indice <= (k < 0 ? unidades.length - 1 : k) + 1;
}
