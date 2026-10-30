// Motor de niveles: cada ruta tiene sus temas (10, o 23 en Inclusión) y cada nivel trae 10 preguntas
// de su tema. La dificultad d sube de pregunta en pregunta dentro del rango de la banda.
// También arma las pruebas diagnóstica y final: una pregunta por tema, con d fija.

import { crearRng, hashTexto, semillaNivel, type Rng } from './rng';
import type { Banda, DefinicionPista, Dimension, Ejercicio, Pista, Respuesta, Tema, Uso } from './tipos';
import { definiciones } from '../contenido/pistas';
import { igualNumero } from '../contenido/plantillas/util';
import { reducirOpciones } from './apoyo';
import { frase, huella, type Vistas } from './vistas';

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

/** Último nivel de la ruta (10 en las rutas con pruebas). */
export function nivelMaximo(pista: Pista): number {
  return definicion(pista).temas.length;
}

/** Tema de un nivel (1 a nivelMaximo). */
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

/** Preguntas de esta partida (nivel o prueba): no se repite ninguna, ni su frase si se puede. */
type Usadas = { exactas: Set<string>; frases: Set<string> };

const nuevasUsadas = (): Usadas => ({ exactas: new Set(), frases: new Set() });

/** Intentos para encontrar una pregunta que el usuario no haya visto. */
const INTENTOS = 60;

/** Puntaje de una candidata: nunca vista y con frase nueva es lo ideal (150). */
function puntaje(ej: Ejercicio, usadas: Usadas, vistas?: Vistas): number {
  const h = huella(ej);
  if (usadas.exactas.has(h) || vistas?.exactas.has(h)) return -1;
  const f = frase(ej);
  let p = usadas.frases.has(f) ? 0 : 100;
  const reciente = vistas?.frases.get(f);
  // Frase ya vista: mejor cuanto más vieja.
  p += reciente === undefined ? 50 : Math.floor(50 * (1 - (reciente + 1) / Math.max(1, vistas!.frases.size)));
  return p;
}

/** Construye la pregunta buscando una que el usuario nunca haya visto (en este nivel ni antes)
 *  y, entre esas, una situación (frase) que no salió en este nivel ni hace poco. */
function construirSinRepetir(pista: Pista, c: Candidato, rng: Rng, repaso: boolean, id: string, apoyo: boolean, usadas: Usadas, vistas?: Vistas): Ejercicio {
  let mejor: Ejercicio | null = null;
  let mejorPuntaje = -2;
  for (let r = 0; r < INTENTOS && mejorPuntaje < 150; r++) {
    const ej = construir(pista, c, rng, repaso, id, apoyo);
    const p = puntaje(ej, usadas, vistas);
    if (p > mejorPuntaje) {
      mejor = ej;
      mejorPuntaje = p;
    }
  }
  usadas.exactas.add(huella(mejor!));
  usadas.frases.add(frase(mejor!));
  return mejor!;
}

export type OpcionesNivel = {
  codigo: string;
  pista: Pista;
  nivel: number;
  intento: number;
  repaso?: boolean;
  banda?: Banda;
  /** Cambia las preguntas en cada entrada al nivel (salir y volver no repite el mismo juego). */
  variante?: number;
  /** Preguntas que el usuario ya vio: no se repiten. */
  vistas?: Vistas;
};

/** Genera las 10 preguntas de un nivel: mezcla los usos del tema (y sus dimensiones) y sube la dificultad. */
export function generarNivel({ codigo, pista, nivel, intento, repaso = false, banda = BANDA_POR_DEFECTO, variante = 0, vistas }: OpcionesNivel): Ejercicio[] {
  const rng = crearRng(semillaNivel(codigo, pista, nivel, intento) ^ (repaso ? 0x5f3759df : 0) ^ (variante ? hashTexto(String(variante)) : 0));
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
  const preguntas = nuevasUsadas();
  const ejercicios: Ejercicio[] = [];

  for (let i = 0; i < PREGUNTAS_POR_NIVEL; i++) {
    const grupo = porDimension.get(dimensiones[i % dimensiones.length])!;
    // Preferir los usos menos repetidos en este nivel.
    const minimo = Math.min(...grupo.map((u) => usadas.get(u) ?? 0));
    const uso = rng.elegir(grupo.filter((u) => (usadas.get(u) ?? 0) === minimo));
    usadas.set(uso, minimo + 1);
    const d = pista === 'inclusion' ? dificultadPregunta('basico', i) : dificultadPregunta(banda, i);
    ejercicios.push(construirSinRepetir(pista, { uso, d, nivel }, rng, repaso, `${pista}-${nivel}-${intento}-${i}`, apoyo, preguntas, vistas));
  }
  return ejercicios;
}

export type TipoPrueba = 'diagnostica' | 'final';

/** Prueba diagnóstica o final: una pregunta por tema, con la misma dificultad.
 *  La final es una forma paralela (mismos usos, otra semilla). */
export function generarPrueba({ codigo, pista, tipo, intento = 1, vistas }: { codigo: string; pista: Pista; tipo: TipoPrueba; intento?: number; vistas?: Vistas }): Ejercicio[] {
  const rng = crearRng(hashTexto(`${codigo}|${pista}|prueba-${tipo}|${intento}`));
  const preguntas = nuevasUsadas();
  return definicion(pista).temas.map((tema, k) =>
    construirSinRepetir(pista, { uso: tema.prueba ?? tema.usos[0], d: D_PRUEBA, nivel: k + 1 }, rng, false, `${pista}-${tipo}-${intento}-${k}`, false, preguntas, vistas),
  );
}

/** Ejercicio parecido (misma plantilla y dificultad) para practicar tras ver la solución. */
export function generarParecido(ej: Ejercicio, semilla: number, vistas?: Vistas): Ejercicio {
  const def = definicion(ej.pista);
  const plantilla = def.plantillas.find((p) => p.id === ej.plantilla)!;
  const origen = ej.origen ?? { params: {}, d: 0, nivel: 1 };
  const rng = crearRng(semilla);
  const c = { uso: { plantilla, params: origen.params }, d: origen.d, nivel: origen.nivel };
  // La del nivel cuenta como usada: el parecido nunca es la misma pregunta.
  const usadas = nuevasUsadas();
  usadas.exactas.add(huella(ej));
  return construirSinRepetir(ej.pista, c, rng, true, ej.id + '-p', ej.apoyo ?? false, usadas, vistas);
}

/** Generación de un ejercicio concreto (para pruebas y depuración). */
export function generarConUso(pista: Pista, uso: Uso, d: number, nivel: number, semilla: number, repaso = false, apoyo = false): Ejercicio {
  return construir(pista, { uso, d, nivel }, crearRng(semilla), repaso, `prueba-${semilla}`, apoyo);
}
