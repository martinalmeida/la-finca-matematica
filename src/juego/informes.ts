// Resúmenes por usuario para el panel del profesor y la vista de familias.
// Son funciones puras: reciben una «fuente» de datos (la del celular o la que bajó de la nube).

import { bandaDe, fuenteLocal, haceDiagnostica, pistaDe, progresoDe, pruebasDe, resumenDe, type Fuente, type Perfil } from '../almacenamiento/datos';
import type { Banda, Operacion, Pista } from './tipos';
import { nombresErrores, type TipoError } from './errores';

export const nombresOperacion: Record<Operacion, string> = {
  suma: 'Suma',
  resta: 'Resta',
  multiplicacion: 'Multiplicación',
  division: 'División',
  mixta: 'Mixta',
};

export const OPERACIONES: Operacion[] = ['suma', 'resta', 'multiplicacion', 'division', 'mixta'];

export type FilaInforme = {
  perfil: Perfil;
  pista: Pista;
  nivelMaximo: number;
  /** Niveles superados. */
  superados: number;
  estrellas: number;
  semillas: number;
  porcentajes: Partial<Record<Operacion, { pct: number; total: number }>>;
  /** Ejercicios respondidos y aciertos (todas las operaciones). */
  ejercicios: number;
  aciertos: number;
  errores: { tipo: string; nombre: string; n: number }[];
  erroresFrecuentes: { tipo: string; n: number }[];
  masCuesta: Operacion[];
  /** Ejercicios resueltos con el paso a paso. */
  pasoAPaso: number;
  diasJugados: string[];
  /** Exigencia (estudiantes de 1.º a 5.º). */
  banda: Banda | null;
  /** Aciertos de la diagnóstica y de la final (de 10). */
  diagnostica: number | null;
  final: number | null;
  diagnosticaPorTema: boolean[] | null;
  finalPorTema: boolean[] | null;
};

export function informePerfil(p: Perfil, f: Fuente = fuenteLocal(p.id)): FilaInforme {
  const pista = pistaDe(p, f);
  const prog = progresoDe(f, pista);
  const res = resumenDe(f);
  const pruebas = pruebasDe(p, f);
  const porcentajes: FilaInforme['porcentajes'] = {};
  let ejercicios = 0;
  let aciertos = 0;
  for (const [op, v] of Object.entries(res.porOperacion) as [Operacion, { total: number; aciertos: number }][]) {
    if (v.total > 0) porcentajes[op] = { pct: Math.round((100 * v.aciertos) / v.total), total: v.total };
    ejercicios += v.total;
    aciertos += v.aciertos;
  }
  const masCuesta = (Object.entries(porcentajes) as [Operacion, { pct: number; total: number }][])
    .filter(([, v]) => v.total >= 3)
    .sort((a, b) => a[1].pct - b[1].pct)
    .slice(0, 2)
    .filter(([, v]) => v.pct < 80)
    .map(([op]) => op);
  const errores = Object.entries(res.errores)
    .filter(([t, n]) => t !== 'otro' && n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, n]) => ({ tipo, nombre: nombresErrores[tipo as TipoError] ?? tipo, n }));
  return {
    perfil: p,
    pista,
    nivelMaximo: prog.nivelMaximoDesbloqueado,
    superados: Object.values(prog.niveles).filter((n) => n.completado).length,
    estrellas: Object.values(prog.niveles).reduce((s, n) => s + n.estrellas, 0),
    semillas: prog.semillas,
    porcentajes,
    ejercicios,
    aciertos,
    errores,
    erroresFrecuentes: errores.slice(0, 3).map((e) => ({ tipo: e.nombre, n: e.n })),
    masCuesta,
    pasoAPaso: res.pasoAPaso,
    diasJugados: res.diasJugados,
    banda: p.rol === 'estudiante' && haceDiagnostica(p) ? bandaDe(p, f) : null,
    diagnostica: pruebas.diagnostica?.aciertos ?? null,
    final: pruebas.final?.aciertos ?? null,
    diagnosticaPorTema: pruebas.diagnostica?.porTema ?? null,
    finalPorTema: pruebas.final?.porTema ?? null,
  };
}

export type Celda = string | number | boolean | null | undefined;

/** CSV para Excel en español: separador «;», comillas siempre y BOM UTF-8. */
export function csv(filas: Celda[][]): string {
  return '﻿' + filas.map((f) => f.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
}

/** Aciertos por tema como texto: «1101000100» (1 = acierto). */
export function porTema(lista: boolean[] | null | undefined): string {
  return lista ? lista.map((x) => (x ? '1' : '0')).join('') : '';
}
