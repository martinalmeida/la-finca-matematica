// Encuesta de satisfacción en los informes del profesor: tasa de respuesta, promedio y reparto de
// cada pregunta y comentarios. Puro: se prueba sin red.

import { terminoRuta } from '../almacenamiento/encuesta';
import { ABIERTAS, ESCALA, PREGUNTAS_ENCUESTA, type ClavePregunta } from '../contenido/encuesta';
import type { Alumno } from './informes';

/** Renglón de la tabla «encuestas» de Supabase. */
export type EncuestaRemota = {
  id: string;
  usuario_id: string;
  t: string;
  pista: string;
  tipo: string | null;
  grado: number | null;
  version_app: string | null;
  respuestas: Partial<Record<ClavePregunta, number | null>>;
  gusto: string | null;
  mejorar: string | null;
  recibida: string;
};

export type ResumenPregunta = {
  clave: ClavePregunta;
  texto: string;
  /** Respuestas con carita (de 1 a 5). */
  n: number;
  /** «No lo usé». */
  noUso: number;
  /** Cuántos eligieron 1, 2, 3, 4 y 5. */
  conteo: [number, number, number, number, number];
  promedio: number | null;
  /** % que eligió 4 o 5. */
  deAcuerdo: number | null;
};

export type Comentario = { alumno: Alumno; t: string; gusto: string | null; mejorar: string | null };

export type ResumenEncuesta = {
  /** Usuarios de la selección que terminaron la ruta (o que ya respondieron). */
  terminaron: number;
  respondieron: number;
  /** % de los que terminaron que ya respondieron. */
  tasa: number | null;
  /** % de todas las respuestas con carita que fueron 4 o 5. */
  satisfaccion: number | null;
  /** Promedio de todas las respuestas con carita (de 1 a 5). */
  promedio: number | null;
  preguntas: ResumenPregunta[];
  comentarios: Comentario[];
};

export const TEXTO_ESCALA = ESCALA.map((e) => `${e.valor} = ${e.texto}`).join(', ');

export const DEFINICION_ENCUESTA =
  `Encuesta de satisfacción: al terminar la ruta (prueba final; en Inclusión, el último nivel) cada usuario responde una vez sobre la aplicación con caritas de 1 a 5 (${TEXTO_ESCALA}). ` +
  'Satisfacción = % de las respuestas que fueron 4 o 5. «No lo usé» no cuenta en los promedios.';

const valido = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 5;

export function terminoRutaAlumno(a: Alumno): boolean {
  return !!a.encuesta || terminoRuta(a.perfil, a.fuente);
}

export function resumenEncuesta(alumnos: Alumno[]): ResumenEncuesta {
  const conEncuesta = alumnos.filter((a) => a.encuesta);
  const terminaron = alumnos.filter(terminoRutaAlumno).length;
  let total = 0;
  let suma = 0;
  let altos = 0;
  const preguntas = PREGUNTAS_ENCUESTA.map((p): ResumenPregunta => {
    const conteo: ResumenPregunta['conteo'] = [0, 0, 0, 0, 0];
    let noUso = 0;
    for (const a of conEncuesta) {
      const r = a.encuesta!.respuestas ?? {};
      if (!(p.clave in r)) continue;
      const x = r[p.clave];
      if (x === null) noUso++;
      else if (valido(x)) conteo[x - 1]++;
    }
    const n = conteo.reduce((s, x) => s + x, 0);
    const sumaP = conteo.reduce((s, x, i) => s + x * (i + 1), 0);
    total += n;
    suma += sumaP;
    altos += conteo[3] + conteo[4];
    return { clave: p.clave, texto: p.corto, n, noUso, conteo, promedio: n ? sumaP / n : null, deAcuerdo: n ? (100 * (conteo[3] + conteo[4])) / n : null };
  });
  const comentarios = conEncuesta
    .filter((a) => a.encuesta!.gusto || a.encuesta!.mejorar)
    .map((a) => ({ alumno: a, t: a.encuesta!.t, gusto: a.encuesta!.gusto, mejorar: a.encuesta!.mejorar }))
    .sort((x, y) => y.t.localeCompare(x.t));
  return {
    terminaron,
    respondieron: conEncuesta.length,
    tasa: terminaron ? (100 * conEncuesta.length) / terminaron : null,
    satisfaccion: total ? (100 * altos) / total : null,
    promedio: total ? suma / total : null,
    preguntas,
    comentarios,
  };
}

/** Columnas de la encuesta para el Excel (en el orden de las preguntas). */
export const COLUMNAS_ENCUESTA = [...PREGUNTAS_ENCUESTA.map((p) => p.corto), ABIERTAS.gusto.corto, ABIERTAS.mejorar.corto];

/** Valores de la encuesta de un usuario para el Excel: número, «No lo usé» o vacío (no se la preguntaron). */
export function valoresEncuesta(e: EncuestaRemota): (string | number)[] {
  const r = e.respuestas ?? {};
  return [...PREGUNTAS_ENCUESTA.map((p) => (!(p.clave in r) ? '' : r[p.clave] === null ? 'No lo usé' : valido(r[p.clave]) ? (r[p.clave] as number) : '')), e.gusto ?? '', e.mejorar ?? ''];
}
