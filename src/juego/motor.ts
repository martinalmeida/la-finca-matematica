// Motor de niveles: cada ruta tiene 10 temas (niveles 1 a 10) y cada nivel trae 10 preguntas
// de su tema. La dificultad d sube de pregunta en pregunta dentro del rango de la banda.
// También arma las pruebas diagnóstica y final: una pregunta por tema, con d fija.

import { crearRng, hashTexto, semillaNivel, type Rng } from './rng';
import type { Banda, DefinicionPista, Dimension, Ejercicio, Pista, Respuesta, Tema, Uso } from './tipos';
import { definiciones } from '../contenido/pistas';
import { igualNumero } from '../contenido/plantillas/util';
import { reducirOpciones } from './apoyo';

export const NIVEL_MAXIMO = 10;
export const PREGUNTAS_POR_NIVEL = 10;
/** Dificultad de las preguntas de las pruebas (diagnóstica y final). */
export const D_PRUEBA = 0.5;

export const BANDAS: Record<Banda, { nombre: string; desde: number; hasta: number; aprobar: number; descripcion: string }> = {
  refuerzo: { nombre: 'Refuerzo', desde: 0, hasta: 0.5, aprobar: 7, descripcion: 'Números más pequeños, dos opciones y ayudas a la vista.' },
  basico: { nombre: 'Básico', desde: 0.2, hasta: 0.8, aprobar: 8, descripcion: 'Números de la medida justa para el grado.' },
  avanzado: { nombre: 'Avanzado', desde: 0.5, hasta: 1, aprobar: 9, descripcion: 'Números más grandes y retos más exigentes.' },
};

export const BANDA_POR_DEFECTO: Banda = 'basico';

export function esFamilia(pista: Pista): boolean {
  return pista === 'familia' || pista.startsWith('fam-');
}

/** Rutas de padres que asigna la diagnóstica de familias. */
export const RUTAS_FAMILIA: Pista[] = ['fam-basica', 'fam-intermedia', 'fam-avanzada'];

/** Aciertos mínimos para aprobar un nivel. En Inclusión nunca se pierde. */
export function aciertosParaAprobar(pista: Pista, banda: Banda = BANDA_POR_DEFECTO): number {
  return pista === 'inclusion' ? 0 : BANDAS[banda].aprobar;
}

export function definicion(pista: Pista): DefinicionPista {
  return definiciones[pista];
}

/** Tema de un nivel (1 a 10). */
export function temaDe(pista: Pista, nivel: number): Tema {
  const temas = definicion(pista).temas;
  return temas[Math.min(temas.length, Math.max(1, nivel)) - 1];
}

/** Dificultad de la pregunta i (0..total−1): sube de forma pareja dentro del rango de la banda. */
export function dificultadPregunta(banda: Banda, i: number, total = PREGUNTAS_POR_NIVEL): number {
  const { desde, hasta } = BANDAS[banda];
  return total <= 1 ? desde : desde + ((hasta - desde) * i) / (total - 1);
}

type Candidato = { uso: Uso; d: number; nivel: number };

function construir(pista: Pista, c: Candidato, rng: Rng, repaso: boolean, id: string, apoyo = false): Ejercicio {
  const p = c.uso.plantilla;
  const params = c.uso.params ?? {};
  const base = p.generar({ rng, d: c.d, nivel: c.nivel, pista, repaso, params });
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

/** Construye y, si el enunciado ya salió, lo intenta de nuevo (hasta 12 veces). */
function construirSinRepetir(pista: Pista, c: Candidato, rng: Rng, repaso: boolean, id: string, apoyo: boolean, enunciados: Set<string>): Ejercicio {
  let ej = construir(pista, c, rng, repaso, id, apoyo);
  for (let r = 0; r < 12 && enunciados.has(ej.enunciado); r++) ej = construir(pista, c, rng, repaso, id, apoyo);
  enunciados.add(ej.enunciado);
  return ej;
}

export type OpcionesNivel = {
  codigo: string;
  pista: Pista;
  nivel: number;
  intento: number;
  repaso?: boolean;
  banda?: Banda;
};

/** Genera las 10 preguntas de un nivel: mezcla los usos del tema (y sus dimensiones) y sube la dificultad. */
export function generarNivel({ codigo, pista, nivel, intento, repaso = false, banda = BANDA_POR_DEFECTO }: OpcionesNivel): Ejercicio[] {
  const rng = crearRng(semillaNivel(codigo, pista, nivel, intento) ^ (repaso ? 0x5f3759df : 0));
  const usos = temaDe(pista, nivel).usos;
  const apoyo = banda === 'refuerzo' && pista !== 'inclusion';

  // Agrupar por dimensión para alternarlas.
  const porDimension = new Map<Dimension, Uso[]>();
  for (const uso of usos) {
    const dim = uso.plantilla.dimension;
    if (!porDimension.has(dim)) porDimension.set(dim, []);
    porDimension.get(dim)!.push(uso);
  }
  const dimensiones = rng.barajar([...porDimension.keys()]);
  const usadas = new Map<Uso, number>();
  const enunciados = new Set<string>();
  const ejercicios: Ejercicio[] = [];

  for (let i = 0; i < PREGUNTAS_POR_NIVEL; i++) {
    const grupo = porDimension.get(dimensiones[i % dimensiones.length])!;
    // Preferir los usos menos repetidos en este nivel.
    const minimo = Math.min(...grupo.map((u) => usadas.get(u) ?? 0));
    const uso = rng.elegir(grupo.filter((u) => (usadas.get(u) ?? 0) === minimo));
    usadas.set(uso, minimo + 1);
    const d = pista === 'inclusion' ? dificultadPregunta('basico', i) : dificultadPregunta(banda, i);
    ejercicios.push(construirSinRepetir(pista, { uso, d, nivel }, rng, repaso, `${pista}-${nivel}-${intento}-${i}`, apoyo, enunciados));
  }
  return ejercicios;
}

export type TipoPrueba = 'diagnostica' | 'final';

/** Prueba diagnóstica o final: una pregunta por tema, con la misma dificultad.
 *  La final es una forma paralela (mismos usos, otra semilla). */
export function generarPrueba({ codigo, pista, tipo, intento = 1 }: { codigo: string; pista: Pista; tipo: TipoPrueba; intento?: number }): Ejercicio[] {
  const rng = crearRng(hashTexto(`${codigo}|${pista}|prueba-${tipo}|${intento}`));
  const enunciados = new Set<string>();
  return definicion(pista).temas.map((tema, k) =>
    construirSinRepetir(pista, { uso: tema.prueba ?? tema.usos[0], d: D_PRUEBA, nivel: k + 1 }, rng, false, `${pista}-${tipo}-${intento}-${k}`, false, enunciados),
  );
}

/** Ejercicio parecido (misma plantilla y dificultad) para practicar tras ver la solución. */
export function generarParecido(ej: Ejercicio, semilla: number): Ejercicio {
  const def = definicion(ej.pista);
  const plantilla = def.plantillas.find((p) => p.id === ej.plantilla)!;
  const origen = ej.origen ?? { params: {}, d: 0, nivel: 1 };
  const rng = crearRng(semilla);
  const c = { uso: { plantilla, params: origen.params }, d: origen.d, nivel: origen.nivel };
  let nuevo = construir(ej.pista, c, rng, true, ej.id + '-p', ej.apoyo);
  for (let i = 0; i < 8 && nuevo.enunciado === ej.enunciado; i++) nuevo = construir(ej.pista, c, rng, true, ej.id + '-p', ej.apoyo);
  return nuevo;
}

/** Generación de un ejercicio concreto (para pruebas y depuración). */
export function generarConUso(pista: Pista, uso: Uso, d: number, nivel: number, semilla: number, repaso = false, apoyo = false): Ejercicio {
  return construir(pista, { uso, d, nivel }, crearRng(semilla), repaso, `prueba-${semilla}`, apoyo);
}
