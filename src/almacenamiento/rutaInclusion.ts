// Ruta de Inclusión: paso de la ruta anterior (23 niveles hasta el 100, versión 1.2) a la nueva
// (8 bloques y 33 niveles cortos hasta el 10, versión 1.3).
//
// - El avance guardado se convierte al leerlo (no con una migración de una sola vez): así queda
//   bien también cuando se baja de la nube en otro celular y en el panel del profesor.
// - Los ejercicios y partidas viejos que guardó la nube conservan su número de nivel de la ruta
//   anterior: el panel los reconoce (plantillas sin el prefijo «in-», o partidas de 10 preguntas)
//   y los muestra con los títulos de antes.

import type { EtapaPlanta, Progreso } from './datos';

/** Versión de la ruta guardada en el avance de Inclusión. */
export const RUTA_INCLUSION = 2;

/** Niveles de la ruta nueva. */
export const NIVELES_INCLUSION = 33;

/** Títulos de los 23 niveles de la ruta anterior (para los informes de lo que se jugó antes). */
export const TITULOS_INCLUSION_ANTERIOR = [
  'Clasificar por color, forma y tamaño',
  'Alto y bajo, grande y pequeño, largo y corto',
  'Uno, muchos y ninguno',
  'Más, menos e igual',
  'Reconocer y contar 1, 2 y 3',
  'Cantidad y número',
  'Ordenar 3 objetos por su altura',
  'Contar de uno en uno hasta 10',
  'Conocer los números de dos en dos',
  'Completar la fila: 1, 2, __',
  'Mayor y menor',
  'Contar y escribir hasta 20',
  'Antes, después y entre',
  'Partir un número: el 5 es 3 y 2',
  'Juntar dos grupos y contar todo',
  'Quitar y contar lo que queda',
  'Cuentos cortos con dibujos',
  'Sumas hasta 5 y luego hasta 10',
  'Restas hasta 5 y luego hasta 10',
  'Sumar y restar sin dibujos',
  'Problemas sencillos',
  'Decena y unidad',
  'Sumas y restas hasta 20 y hasta 100',
];

/** Ruta en los informes para lo jugado en la ruta anterior. */
export const PISTA_INCLUSION_ANTERIOR = 'inclusion-anterior';

/**
 * Niveles superados en la ruta anterior → niveles superados en la nueva (índice = superados antes).
 * Es conservador: ante la duda, el niño queda antes y repasa con las actividades nuevas, más fáciles.
 */
const SUPERADOS_NUEVOS = [0, 3, 7, 9, 11, 12, 15, 16, 21, 25, 26, 26, 26, 26, 26, 27, 28, 29, 29, 31, 32, 32, 32, 32];

const ETAPAS: EtapaPlanta[] = ['semilla', 'brote', 'planta', 'flor', 'fruto', 'cosecha'];
const etapa = (completados: number, total: number): EtapaPlanta => {
  for (let k = ETAPAS.length - 1; k > 0; k--) if (completados >= Math.ceil((k * total) / (ETAPAS.length - 1))) return ETAPAS[k];
  return 'semilla';
};

/** Superados en la ruta anterior → superados en la nueva. */
export function superadosEnRutaNueva(superadosAntes: number): number {
  return SUPERADOS_NUEVOS[Math.max(0, Math.min(SUPERADOS_NUEVOS.length - 1, superadosAntes))];
}

/** Avance de Inclusión en la ruta nueva (si ya lo está, queda igual). */
export function aRutaNueva(p: Progreso): Progreso {
  if (p.ruta === RUTA_INCLUSION) return p;
  // Sin nada jugado: solo se marca la versión.
  const antes = Object.values(p.niveles ?? {}).filter((n) => n?.completado).length;
  const superados = Math.max(antes, Math.max(0, (p.nivelMaximoDesbloqueado ?? 1) - 1));
  const nuevos = superadosEnRutaNueva(superados);
  const niveles: Progreso['niveles'] = {};
  for (let n = 1; n <= nuevos; n++) niveles[n] = { estrellas: 3, intentos: 1, mejorAciertos: 5, completado: true };
  return {
    ...p,
    ruta: RUTA_INCLUSION,
    nivelMaximoDesbloqueado: Math.min(NIVELES_INCLUSION, nuevos + 1),
    niveles,
    etapaPlanta: etapa(nuevos, NIVELES_INCLUSION),
  };
}
