// Motor de niveles: elige plantillas según el tramo, calcula la dificultad d,
// mezcla las cuatro dimensiones y arma los niveles de cosecha (10, 20, … 100).

import { crearRng, semillaNivel, type Rng } from './rng';
import type { DefinicionPista, Dimension, Ejercicio, Pista, Respuesta, Tramo, Uso } from './tipos';
import { definiciones } from '../contenido/pistas';
import { igualNumero } from '../contenido/plantillas/util';
import { FACTOR_DIFICULTAD_APOYO, reducirOpciones } from './apoyo';

export const NIVEL_MAXIMO = 100;

/** Límites de los tramos (iguales para las seis pistas). */
export const LIMITES_TRAMOS: [number, number][] = [
  [0, 0],
  [1, 15],
  [16, 35],
  [36, 55],
  [56, 75],
  [76, 90],
  [91, 100],
];

export function esCosecha(nivel: number): boolean {
  return nivel > 0 && nivel % 10 === 0;
}

export function cantidadEjercicios(pista: Pista): number {
  return pista === 'g1' ? 4 : 5;
}

/** Aciertos mínimos para aprobar: 4 de 5 (80 %) y, en 1.º, 3 de 4 (se permite un fallo). */
export function aciertosParaAprobar(pista: Pista): number {
  return cantidadEjercicios(pista) - 1;
}

export function definicion(pista: Pista): DefinicionPista {
  return definiciones[pista];
}

export function indiceTramo(nivel: number): number {
  return LIMITES_TRAMOS.findIndex(([a, b]) => nivel >= a && nivel <= b);
}

export function tramoDe(pista: Pista, nivel: number): Tramo {
  return definicion(pista).tramos[indiceTramo(nivel)];
}

/** d = (nivel − inicioTramo) / (finTramo − inicioTramo), entre 0 y 1. */
export function dificultadEnTramo(nivel: number): number {
  const [a, b] = LIMITES_TRAMOS[indiceTramo(nivel)];
  return b === a ? 0 : (nivel - a) / (b - a);
}

/** Índice global de dificultad (no decrece): tramo + d. */
export function indiceDificultad(nivel: number): number {
  return indiceTramo(nivel) + dificultadEnTramo(nivel);
}

type Candidato = { uso: Uso; d: number; nivel: number };

function candidatosNivel(pista: Pista, nivel: number): Candidato[] {
  if (esCosecha(nivel)) {
    // Repaso mezclado de la decena anterior.
    const lista: Candidato[] = [];
    for (let n = nivel - 9; n < nivel; n++) {
      for (const uso of tramoDe(pista, n).usos) lista.push({ uso, d: dificultadEnTramo(n), nivel: n });
    }
    return lista;
  }
  const d = dificultadEnTramo(nivel);
  return tramoDe(pista, nivel).usos.map((uso) => ({ uso, d, nivel }));
}

function construir(pista: Pista, c: Candidato, rng: Rng, repaso: boolean, id: string, nivelReal: number, apoyo = false): Ejercicio {
  const p = c.uso.plantilla;
  const params = c.uso.params ?? {};
  // Con apoyo extra, la dificultad baja dentro de la misma unidad (los números se achican).
  const d = apoyo ? c.d * FACTOR_DIFICULTAD_APOYO : c.d;
  const base = p.generar({ rng, d, nivel: nivelReal, pista, repaso, params });
  const respuesta = base.respuesta;
  const validar =
    base.validar ??
    (typeof respuesta === 'number'
      ? igualNumero(respuesta)
      : (r: Respuesta) => String(r).trim().toLowerCase() === String(respuesta).trim().toLowerCase());
  const ej: Ejercicio = {
    ...base,
    id,
    pista,
    plantilla: p.id,
    dimension: base.dimension ?? p.dimension,
    operacion: base.operacion ?? p.operacion,
    validar,
    origen: { params, d: c.d, nivel: c.nivel },
    apoyo,
  };
  return apoyo ? reducirOpciones(ej) : ej;
}

export type OpcionesNivel = {
  codigo: string;
  pista: Pista;
  nivel: number;
  intento: number;
  repaso?: boolean;
  /** Apoyo extra del perfil. */
  apoyo?: boolean;
};

/** Genera los ejercicios de un nivel (4 en 1.º, 5 en los demás). */
export function generarNivel({ codigo, pista, nivel, intento, repaso = false, apoyo = false }: OpcionesNivel): Ejercicio[] {
  const rng = crearRng(semillaNivel(codigo, pista, nivel, intento) ^ (repaso ? 0x5f3759df : 0));
  const total = cantidadEjercicios(pista);
  const candidatos = candidatosNivel(pista, nivel);

  // Agrupar por dimensión para mezclar las cuatro.
  const porDimension = new Map<Dimension, Candidato[]>();
  for (const c of candidatos) {
    const dim = c.uso.plantilla.dimension;
    if (!porDimension.has(dim)) porDimension.set(dim, []);
    porDimension.get(dim)!.push(c);
  }
  const dimensiones = rng.barajar([...porDimension.keys()]);
  const usadas = new Map<string, number>();
  const enunciados = new Set<string>();
  const ejercicios: Ejercicio[] = [];

  for (let i = 0; i < total; i++) {
    const dim = dimensiones[i % dimensiones.length];
    const grupo = porDimension.get(dim)!;
    // Preferir plantillas aún no usadas en este nivel.
    const minimo = Math.min(...grupo.map((c) => usadas.get(c.uso.plantilla.id) ?? 0));
    const opciones = grupo.filter((c) => (usadas.get(c.uso.plantilla.id) ?? 0) === minimo);
    const elegido = rng.elegir(opciones);
    usadas.set(elegido.uso.plantilla.id, minimo + 1);

    let ej = construir(pista, elegido, rng, repaso, `${pista}-${nivel}-${intento}-${i}`, nivel, apoyo);
    for (let r = 0; r < 12 && enunciados.has(ej.enunciado); r++) {
      ej = construir(pista, elegido, rng, repaso, `${pista}-${nivel}-${intento}-${i}`, nivel, apoyo);
    }
    enunciados.add(ej.enunciado);
    ejercicios.push(ej);
  }
  return ejercicios;
}

/** Ejercicio parecido (misma plantilla y dificultad) para practicar tras ver la solución. */
export function generarParecido(ej: Ejercicio, semilla: number): Ejercicio {
  const def = definicion(ej.pista);
  const plantilla = def.plantillas.find((p) => p.id === ej.plantilla)!;
  const origen = ej.origen ?? { params: {}, d: 0, nivel: 0 };
  const rng = crearRng(semilla);
  let nuevo = construir(ej.pista, { uso: { plantilla, params: origen.params }, d: origen.d, nivel: origen.nivel }, rng, true, ej.id + '-p', origen.nivel, ej.apoyo);
  for (let i = 0; i < 8 && nuevo.enunciado === ej.enunciado; i++) {
    nuevo = construir(ej.pista, { uso: { plantilla, params: origen.params }, d: origen.d, nivel: origen.nivel }, rng, true, ej.id + '-p', origen.nivel, ej.apoyo);
  }
  return nuevo;
}

/** Generación de un ejercicio concreto (para pruebas y depuración). */
export function generarConUso(pista: Pista, uso: Uso, d: number, nivel: number, semilla: number, repaso = false, apoyo = false): Ejercicio {
  return construir(pista, { uso, d, nivel }, crearRng(semilla), repaso, `prueba-${semilla}`, nivel, apoyo);
}
