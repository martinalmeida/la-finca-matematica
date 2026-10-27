// Resúmenes para familias y panel docente (solo códigos, nunca nombres).

import { leerProgreso, leerRegistro, leerResumen, listarPerfiles, pistaDePerfil, type Perfil } from '../almacenamiento/datos';
import type { Operacion, Pista } from './tipos';
import { nombresErrores, type TipoError } from './errores';

export const nombresOperacion: Record<Operacion, string> = {
  suma: 'Suma',
  resta: 'Resta',
  multiplicacion: 'Multiplicación',
  division: 'División',
  mixta: 'Mixta',
};

export type FilaInforme = {
  perfil: Perfil;
  pista: Pista;
  nivelMaximo: number;
  estrellas: number;
  semillas: number;
  porcentajes: Partial<Record<Operacion, { pct: number; total: number }>>;
  erroresFrecuentes: { tipo: string; n: number }[];
  masCuesta: Operacion[];
  /** Ejercicios resueltos con el paso a paso. */
  pasoAPaso: number;
};

export function informePerfil(p: Perfil): FilaInforme {
  const pista = pistaDePerfil(p);
  const prog = leerProgreso(p.id, pista);
  const res = leerResumen(p.id);
  const porcentajes: FilaInforme['porcentajes'] = {};
  for (const [op, v] of Object.entries(res.porOperacion) as [Operacion, { total: number; aciertos: number }][]) {
    if (v.total > 0) porcentajes[op] = { pct: Math.round((100 * v.aciertos) / v.total), total: v.total };
  }
  const masCuesta = (Object.entries(porcentajes) as [Operacion, { pct: number; total: number }][])
    .filter(([, v]) => v.total >= 3)
    .sort((a, b) => a[1].pct - b[1].pct)
    .slice(0, 2)
    .filter(([, v]) => v.pct < 80)
    .map(([op]) => op);
  return {
    perfil: p,
    pista,
    nivelMaximo: prog.nivelMaximoDesbloqueado,
    estrellas: Object.values(prog.niveles).reduce((s, n) => s + n.estrellas, 0),
    semillas: prog.semillas,
    porcentajes,
    erroresFrecuentes: Object.entries(res.errores)
      .filter(([t]) => t !== 'otro')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tipo, n]) => ({ tipo: nombresErrores[tipo as TipoError] ?? tipo, n })),
    masCuesta,
    pasoAPaso: res.pasoAPaso,
  };
}

export function informeTodos(): FilaInforme[] {
  return listarPerfiles().map(informePerfil);
}

function csv(filas: (string | number | boolean | undefined)[][]): string {
  return filas.map((f) => f.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

/** CSV de resumen por perfil (códigos, sin apodos ni nombres). */
export function csvResumen(): string {
  const ops: Operacion[] = ['suma', 'resta', 'multiplicacion', 'division', 'mixta'];
  const enc = ['codigo', 'rol', 'grado', 'pista', 'nivel_maximo', 'estrellas', 'semillas', ...ops.flatMap((o) => [`${o}_pct`, `${o}_n`]), 'errores_frecuentes', 'apoyo_extra', 'paso_a_paso'];
  const filas = informeTodos().map((f) => [
    f.perfil.codigo,
    f.perfil.rol,
    f.perfil.grado ?? '',
    f.pista,
    f.nivelMaximo,
    f.estrellas,
    f.semillas,
    ...ops.flatMap((o) => [f.porcentajes[o]?.pct ?? '', f.porcentajes[o]?.total ?? 0]),
    f.erroresFrecuentes.map((e) => `${e.tipo} (${e.n})`).join('; '),
    f.perfil.apoyo ? 'si' : 'no',
    f.pasoAPaso,
  ]);
  return '﻿' + csv([enc, ...filas]);
}

/** CSV del registro detallado (modo investigación). */
export function csvRegistro(): string {
  const enc = ['codigo', 't', 'pista', 'nivel', 'plantilla', 'operacion', 'correcto', 'intentos', 'pistas_usadas', 'tipo_error', 'ms', 'paso_a_paso'];
  const filas: (string | number | boolean | undefined)[][] = [];
  for (const p of listarPerfiles()) {
    for (const r of leerRegistro(p.id)) filas.push([p.codigo, r.t, r.pista, r.nivel, r.plantilla, r.operacion, r.correcto, r.intentos, r.pistasUsadas, r.tipoError, r.ms, r.pasoAPaso ?? false]);
  }
  return '﻿' + csv([enc, ...filas]);
}

export function jsonInvestigacion(): string {
  return JSON.stringify(
    {
      app: 'la-finca-matematica',
      exportado: new Date().toISOString(),
      perfiles: listarPerfiles().map((p) => {
        const f = informePerfil(p);
        return {
          codigo: p.codigo,
          rol: p.rol,
          grado: p.grado,
          creado: p.creado,
          apoyo: !!p.apoyo,
          nivelMaximo: f.nivelMaximo,
          estrellas: f.estrellas,
          semillas: f.semillas,
          resumen: leerResumen(p.id),
          registro: leerRegistro(p.id),
        };
      }),
    },
    null,
    2,
  );
}
