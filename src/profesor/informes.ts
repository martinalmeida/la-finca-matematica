// Informes del profesor: arma cada usuario con lo que bajó de la nube y calcula los
// agregados por grupo (grado, Familias, Inclusión). Todo es puro: se prueba sin red.

import { perfilDeFila, pistaDePrueba, type Fuente, type FilaPerfil, type Perfil } from '../almacenamiento/datos';
import { csv, informePerfil, OPERACIONES, porTema, type Celda, type FilaInforme } from '../juego/informes';
import { definicion, nivelMaximo } from '../juego/motor';
import { nombresErrores, type TipoError } from '../juego/errores';
import type { Banda, Operacion, Pista } from '../juego/tipos';
import type { Datos, EventoRemoto, PartidaRemota } from './api';

export type Grupo = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'familia' | 'inclusion';

export const GRUPOS: { id: Grupo; nombre: string }[] = [
  { id: 'g1', nombre: '1.º grado' },
  { id: 'g2', nombre: '2.º grado' },
  { id: 'g3', nombre: '3.º grado' },
  { id: 'g4', nombre: '4.º grado' },
  { id: 'g5', nombre: '5.º grado' },
  { id: 'familia', nombre: 'Familias' },
  { id: 'inclusion', nombre: 'Inclusión' },
];

export const nombreGrupo = (g: Grupo) => GRUPOS.find((x) => x.id === g)!.nombre;

export function grupoDe(f: Pick<FilaPerfil, 'tipo' | 'grado'>): Grupo {
  if (f.tipo === 'familia') return 'familia';
  if (f.tipo === 'inclusion') return 'inclusion';
  return `g${f.grado ?? 1}` as Grupo;
}

export type Alumno = {
  fila: FilaPerfil;
  perfil: Perfil;
  grupo: Grupo;
  fuente: Fuente;
  informe: FilaInforme;
  /** Partidas en orden de fecha. */
  partidas: PartidaRemota[];
  ultimaActividad: string | null;
  /** Tiempo promedio por ejercicio (ms), de las partidas. */
  msPorEjercicio: number | null;
  /** Jugó en los últimos 7 días. */
  activoSemana: boolean;
  /** Días distintos con niveles, pruebas o ejercicios (AAAA-MM-DD). */
  diasActivos: string[];
};

const DIA = 86_400_000;

export function armarAlumnos(d: Datos, ahora = Date.now()): Alumno[] {
  const porUsuario = new Map<string, Map<string, unknown>>();
  for (const x of d.datos) {
    if (!porUsuario.has(x.usuario_id)) porUsuario.set(x.usuario_id, new Map());
    porUsuario.get(x.usuario_id)!.set(x.clave, x.valor);
  }
  const partidas = new Map<string, PartidaRemota[]>();
  for (const p of d.partidas) {
    if (!partidas.has(p.usuario_id)) partidas.set(p.usuario_id, []);
    partidas.get(p.usuario_id)!.push(p);
  }
  return d.usuarios.map((fila) => {
    const perfil = perfilDeFila(fila);
    const mapa = porUsuario.get(fila.id) ?? new Map();
    const fuente: Fuente = (clave) => mapa.get(clave);
    const informe = informePerfil(perfil, fuente);
    const lista = (partidas.get(fila.id) ?? []).slice().sort((a, b) => a.t.localeCompare(b.t));
    const ultimaPartida = lista.length ? lista[lista.length - 1].t : null;
    const ultimoDia = informe.diasJugados.length ? informe.diasJugados[informe.diasJugados.length - 1] : null;
    const ultimaActividad = [ultimaPartida, ultimoDia].filter((x): x is string => !!x).sort().pop() ?? null;
    const diasActivos = [...new Set([...informe.diasJugados, ...lista.map((p) => new Date(p.t).toLocaleDateString('en-CA'))])].sort();
    const ejercicios = lista.reduce((s, p) => s + p.total, 0);
    const ms = lista.reduce((s, p) => s + (p.ms_total ?? 0), 0);
    return {
      fila,
      perfil,
      grupo: grupoDe(fila),
      fuente,
      informe,
      partidas: lista,
      ultimaActividad,
      msPorEjercicio: ejercicios > 0 ? ms / ejercicios : null,
      activoSemana: !!ultimaActividad && ahora - new Date(ultimaActividad).getTime() < 7 * DIA,
      diasActivos,
    };
  });
}

export type TemaGrupo = { titulo: string; antes: number | null; despues: number | null; nAntes: number; nDespues: number };

export type ResumenGrupo = {
  grupo: Grupo;
  nombre: string;
  usuarios: number;
  activosSemana: number;
  conDiagnostica: number;
  conFinal: number;
  /** Promedio de aciertos (de 10). */
  diagnosticaProm: number | null;
  finalProm: number | null;
  /** Ganancia promedio entre quienes tienen las dos pruebas. */
  gananciaProm: number | null;
  pares: number;
  /** % de aciertos por tema en la diagnóstica y en la final. */
  porTema: TemaGrupo[];
  bandas: Record<Banda, number>;
  porOperacion: Partial<Record<Operacion, { total: number; aciertos: number }>>;
  errores: { tipo: string; nombre: string; n: number }[];
  superadosProm: number | null;
  nivelesRuta: number;
  msPorEjercicio: number | null;
};

const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

/** Pista de las pruebas del grupo (los temas de la diagnóstica y la final). */
function pistaPruebasGrupo(g: Grupo): Pista {
  return g === 'familia' ? 'familia' : g === 'inclusion' ? 'inclusion' : g;
}

export function resumenGrupo(alumnos: Alumno[], grupo: Grupo): ResumenGrupo {
  const del = alumnos.filter((a) => a.grupo === grupo && a.fila.activo);
  const inf = del.map((a) => a.informe);
  const diag = inf.filter((i) => i.diagnostica !== null);
  const fin = inf.filter((i) => i.final !== null);
  const pares = inf.filter((i) => i.diagnostica !== null && i.final !== null);

  const pistaPruebas = pistaPruebasGrupo(grupo);
  const temas = grupo === 'inclusion' ? [] : definicion(pistaPruebas).temas;
  const porTemaGrupo: TemaGrupo[] = temas.map((t, k) => {
    const antes = diag.map((i) => i.diagnosticaPorTema?.[k]).filter((x): x is boolean => x !== undefined);
    const despues = fin.map((i) => i.finalPorTema?.[k]).filter((x): x is boolean => x !== undefined);
    return {
      titulo: t.titulo,
      antes: antes.length ? Math.round((100 * antes.filter(Boolean).length) / antes.length) : null,
      despues: despues.length ? Math.round((100 * despues.filter(Boolean).length) / despues.length) : null,
      nAntes: antes.length,
      nDespues: despues.length,
    };
  });

  const bandas: Record<Banda, number> = { refuerzo: 0, basico: 0, avanzado: 0 };
  for (const i of inf) if (i.banda && i.diagnostica !== null) bandas[i.banda]++;

  const porOperacion: ResumenGrupo['porOperacion'] = {};
  const errores = new Map<string, number>();
  for (const a of del) {
    const res = a.fuente('resumen') as { porOperacion?: Record<string, { total: number; aciertos: number }>; errores?: Record<string, number> } | undefined;
    for (const [op, v] of Object.entries(res?.porOperacion ?? {})) {
      const o = (porOperacion[op as Operacion] ??= { total: 0, aciertos: 0 });
      o.total += v.total;
      o.aciertos += v.aciertos;
    }
    for (const [t, n] of Object.entries(res?.errores ?? {})) if (t !== 'otro') errores.set(t, (errores.get(t) ?? 0) + n);
  }

  const ejercicios = del.reduce((s, a) => s + a.partidas.reduce((x, p) => x + p.total, 0), 0);
  const ms = del.reduce((s, a) => s + a.partidas.reduce((x, p) => x + (p.ms_total ?? 0), 0), 0);
  const pistaRuta: Pista = grupo === 'familia' ? 'fam-intermedia' : grupo === 'inclusion' ? 'inclusion' : grupo;

  return {
    grupo,
    nombre: nombreGrupo(grupo),
    usuarios: del.length,
    activosSemana: del.filter((a) => a.activoSemana).length,
    conDiagnostica: diag.length,
    conFinal: fin.length,
    diagnosticaProm: promedio(diag.map((i) => i.diagnostica!)),
    finalProm: promedio(fin.map((i) => i.final!)),
    gananciaProm: promedio(pares.map((i) => i.final! - i.diagnostica!)),
    pares: pares.length,
    porTema: porTemaGrupo,
    bandas,
    porOperacion,
    errores: [...errores.entries()].sort((a, b) => b[1] - a[1]).map(([tipo, n]) => ({ tipo, nombre: nombresErrores[tipo as TipoError] ?? tipo, n })),
    superadosProm: promedio(inf.map((i) => i.superados)),
    nivelesRuta: nivelMaximo(pistaRuta),
    msPorEjercicio: ejercicios > 0 ? ms / ejercicios : null,
  };
}

// ───────────── Exportaciones (CSV para Excel o SPSS) ─────────────

const fecha = (iso: string | null | undefined) => (iso ? iso.slice(0, 19).replace('T', ' ') : '');
const tipoTexto = (f: FilaPerfil) => (f.tipo === 'estudiante' ? 'estudiante' : f.tipo === 'familia' ? 'familia' : 'inclusion');

export function csvResumen(alumnos: Alumno[]): string {
  const enc = [
    'usuario', 'nombre', 'tipo', 'grado', 'grupo', 'activo', 'creado', 'ultima_sincronizacion', 'ultima_actividad',
    'ruta', 'nivel_actual', 'niveles_superados', 'niveles_ruta', 'estrellas', 'semillas',
    'ejercicios', 'aciertos', 'pct_aciertos', ...OPERACIONES.flatMap((o) => [`${o}_pct`, `${o}_n`]),
    'errores_frecuentes', 'paso_a_paso', 'dias_jugados', 'seg_por_ejercicio', 'partidas',
    'banda', 'diagnostica', 'final', 'diferencia', 'diagnostica_por_tema', 'final_por_tema',
  ];
  const filas: Celda[][] = alumnos.map((a) => {
    const i = a.informe;
    return [
      a.fila.usuario, a.fila.nombre, tipoTexto(a.fila), a.fila.grado ?? '', nombreGrupo(a.grupo), a.fila.activo ? 'si' : 'no',
      fecha(a.fila.creado), fecha(a.fila.ultima_sync), fecha(a.ultimaActividad),
      i.pista, i.nivelMaximo, i.superados, nivelMaximo(i.pista), i.estrellas, i.semillas,
      i.ejercicios, i.aciertos, i.ejercicios ? Math.round((100 * i.aciertos) / i.ejercicios) : '',
      ...OPERACIONES.flatMap((o) => [i.porcentajes[o]?.pct ?? '', i.porcentajes[o]?.total ?? 0]),
      i.erroresFrecuentes.map((e) => `${e.tipo} (${e.n})`).join(', '), i.pasoAPaso, a.diasActivos.length,
      a.msPorEjercicio !== null ? (a.msPorEjercicio / 1000).toFixed(1) : '', a.partidas.length,
      i.banda ?? '', i.diagnostica ?? '', i.final ?? '', i.diagnostica !== null && i.final !== null ? i.final - i.diagnostica : '',
      porTema(i.diagnosticaPorTema), porTema(i.finalPorTema),
    ];
  });
  return csv([enc, ...filas]);
}

export function csvEventos(eventos: EventoRemoto[], alumnos: Alumno[]): string {
  const por = new Map(alumnos.map((a) => [a.fila.id, a]));
  const enc = ['usuario', 'nombre', 'grupo', 'fecha', 'tipo', 'pista', 'nivel', 'plantilla', 'operacion', 'correcto', 'intentos', 'pistas_usadas', 'tipo_error', 'ms'];
  const filas: Celda[][] = eventos.map((e) => {
    const a = por.get(e.usuario_id);
    return [a?.fila.usuario ?? e.usuario_id, a?.fila.nombre ?? '', a ? nombreGrupo(a.grupo) : '', fecha(e.t), e.tipo, e.pista, e.nivel, e.plantilla, e.operacion, e.correcto ? 1 : 0, e.intentos, e.pistas_usadas, e.tipo_error ?? '', e.ms];
  });
  return csv([enc, ...filas]);
}

export function csvPartidas(alumnos: Alumno[]): string {
  const enc = ['usuario', 'nombre', 'grupo', 'fecha', 'tipo', 'pista', 'nivel', 'aciertos', 'total', 'estrellas', 'segundos', 'repaso', 'banda'];
  const filas: Celda[][] = alumnos.flatMap((a) =>
    a.partidas.map((p) => [a.fila.usuario, a.fila.nombre, nombreGrupo(a.grupo), fecha(p.t), p.tipo, p.pista, p.nivel ?? '', p.aciertos, p.total, p.estrellas ?? '', Math.round((p.ms_total ?? 0) / 1000), p.repaso ? 1 : 0, p.banda ?? '']),
  );
  return csv([enc, ...filas]);
}

/** Pista de las pruebas de un alumno (para fijar banda o permitir la final). */
export const pistaPruebasDe = (a: Alumno) => pistaDePrueba(a.perfil);

// ───────────── Sugerencias para crear cuentas ─────────────

/** «José Pérez Gómez» → «jose.perez». */
export function sugerirUsuario(nombre: string): string {
  const partes = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const base = partes.length >= 2 ? `${partes[0]}.${partes[1]}` : (partes[0] ?? '');
  return base.slice(0, 26);
}

const PALABRAS = ['mango', 'cacao', 'yuca', 'mazorca', 'arepa', 'guama', 'lulo', 'mora', 'panela', 'gallo', 'vaca', 'loro', 'sol', 'rio', 'pino', 'limon', 'coco', 'pato', 'perro', 'gato', 'luna', 'nube', 'flor', 'maiz'];

/** Contraseña fácil de recordar: palabra de la finca + dos cifras («mango27»). */
export function sugerirClave(azar: () => number = Math.random): string {
  const p = PALABRAS[Math.floor(azar() * PALABRAS.length)];
  return `${p}${10 + Math.floor(azar() * 90)}`;
}
