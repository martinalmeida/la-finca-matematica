// Ruta de cada grado: 10 niveles, uno por tema. Cada tema es una «unidad» con su lección,
// y la complejidad sube de dos en dos temas (Inicio → Básico → Intermedio → Avanzado → Reto).

import type { Banda, Grado, Pista } from './tipos';
import { BANDAS, definicion, esFamilia, NIVEL_MAXIMO } from './motor';
import { num } from '../contenido/contexto';

export type Complejidad = { id: 'inicio' | 'basico' | 'intermedio' | 'avanzado' | 'reto'; nombre: string; barras: 1 | 2 | 3 | 4 | 5 };

const COMPLEJIDADES: Complejidad[] = [
  { id: 'inicio', nombre: 'Inicio', barras: 1 },
  { id: 'basico', nombre: 'Básico', barras: 2 },
  { id: 'intermedio', nombre: 'Intermedio', barras: 3 },
  { id: 'avanzado', nombre: 'Avanzado', barras: 4 },
  { id: 'reto', nombre: 'Reto', barras: 5 },
];

/** Un tema de la ruta. inicio = fin = su nivel (1 a 10). */
export type Unidad = {
  indice: number;
  inicio: number;
  fin: number;
  titulo: string;
  complejidad: Complejidad;
};

/** Los 10 temas de la ruta, con su complejidad. */
export function unidadesDe(pista: Pista): Unidad[] {
  return definicion(pista).temas.map((t, k) => ({
    indice: k,
    inicio: k + 1,
    fin: k + 1,
    titulo: t.titulo,
    complejidad: COMPLEJIDADES[Math.floor(k / 2)],
  }));
}

export function unidadDe(pista: Pista, nivel: number): Unidad {
  return unidadesDe(pista)[Math.min(NIVEL_MAXIMO, Math.max(1, nivel)) - 1];
}

/** Lo que trabaja cada ruta (para mostrar en la ruta y el perfil). */
export const RESUMEN_GRADO: Record<Pista, { nombre: string; corto: string; foco: string }> = {
  g1: { nombre: 'Ruta de 1.º', corto: '1.º', foco: 'Números, sumas y restas' },
  g2: { nombre: 'Ruta de 2.º', corto: '2.º', foco: 'Multiplicaciones' },
  g3: { nombre: 'Ruta de 3.º', corto: '3.º', foco: 'Divisiones y problemas' },
  g4: { nombre: 'Ruta de 4.º', corto: '4.º', foco: 'Divisiones avanzadas, repaso y problemas' },
  g5: { nombre: 'Ruta de 5.º', corto: '5.º', foco: 'Todas las operaciones y números decimales' },
  inclusion: { nombre: 'Ruta de Inclusión', corto: 'Inc.', foco: 'Contar, trazar y juntar con calma' },
  familia: { nombre: 'Prueba de entrada', corto: 'Familia', foco: 'Cuentas de la casa y la finca' },
  'fam-basica': { nombre: 'Cuaderno básico', corto: 'Familia', foco: 'Cuentas con plata: sumar, restar, multiplicar y repartir' },
  'fam-intermedia': { nombre: 'Cuaderno intermedio', corto: 'Familia', foco: 'Compras, producción, jornales y porcentajes' },
  'fam-avanzada': { nombre: 'Cuaderno avanzado', corto: 'Familia', foco: 'Porcentajes, unidades, proporciones y ganancia' },
};

/** «3.º grado» o «Inclusión». */
export function nombreGrado(g: Grado | null): string {
  return g === null ? 'Familia' : g === 'inclusion' ? 'Inclusión' : `${g}.º grado`;
}

/** Pista de juego de un grado. */
export function pistaDeGrado(grado: Grado): Pista {
  return grado === 'inclusion' ? 'inclusion' : (`g${grado}` as Pista);
}

/** Complejidad de la ruta frente a las demás (1 a 5 barras). */
export function barrasGrado(pista: Pista): number {
  if (pista === 'inclusion') return 1;
  if (esFamilia(pista)) return pista === 'fam-basica' ? 3 : pista === 'fam-intermedia' ? 4 : 5;
  return Number(pista.slice(1));
}

export function rangoNumeros(pista: Pista): string {
  if (pista === 'g5') return 'Números grandes y decimales';
  const limite = definicion(pista).limite;
  return limite >= 10_000_000 ? 'Números de la vida diaria' : `Números hasta ${num(limite)}`;
}

export function nombreBanda(banda: Banda): string {
  return BANDAS[banda].nombre;
}

/** Barras de la banda de exigencia (Refuerzo 1, Básico 2, Avanzado 3). */
export function barrasBanda(banda: Banda): 1 | 2 | 3 {
  return banda === 'refuerzo' ? 1 : banda === 'basico' ? 2 : 3;
}

/** Nivel con el que se practica un tema. */
export function nivelParaPracticar(u: Unidad, _actual: number): number {
  return u.inicio;
}

/** Se puede ver la lección de los temas ya abiertos y del siguiente (como adelanto). */
export function leccionDisponible(u: Unidad, actual: number): boolean {
  return u.inicio <= actual + 1;
}
