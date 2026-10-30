// Motor de los informes del profesor: filtra lo que bajó de la nube (por periodo, grupo, usuario,
// operación y tipo de actividad) y calcula todas las métricas de las vistas, el PDF y el Excel.
// Todo es puro: recibe los datos y la hora «ahora», y se prueba sin red (tests/metricas.test.ts).

import type { Operacion, Pista } from '../juego/tipos';
import { haceDiagnostica, pistaDePrueba, pruebasDe, progresoDe } from '../almacenamiento/datos';
import { definicion, nivelMaximo, temaDe } from '../juego/motor';
import { nombresErrores, type TipoError } from '../juego/errores';
import { nombresOperacion, OPERACIONES } from '../juego/informes';
import { GRUPOS, nombreGrupo, type Alumno, type Grupo } from './informes';
import type { EventoRemoto, PartidaRemota } from './api';
import { gananciaNormalizada, media, mediana, pareado, type Pareado } from './estadistica';
import { definiciones } from '../contenido/pistas';
import { PISTA_INCLUSION_ANTERIOR, TITULOS_INCLUSION_ANTERIOR } from '../almacenamiento/rutaInclusion';

// ───────────── Ruta anterior de Inclusión ─────────────

/** ¿El ejercicio es de la ruta anterior de Inclusión? (las plantillas nuevas empiezan por «in-»). */
const esInclusionAnterior = (e: Pick<EventoRemoto, 'pista' | 'plantilla'>) => e.pista === 'inclusion' && !e.plantilla.startsWith('in-');

/** Lo jugado en la ruta anterior de Inclusión queda aparte, con sus títulos de entonces. */
export function separarRutaAnterior<T extends Pick<EventoRemoto, 'pista' | 'plantilla'>>(eventos: T[]): T[] {
  return eventos.map((e) => (esInclusionAnterior(e) ? { ...e, pista: PISTA_INCLUSION_ANTERIOR } : e));
}

/** Partidas de la ruta anterior de Inclusión: los niveles nuevos tienen 5 actividades; los de antes, 10. */
export function separarPartidasAnteriores<T extends Pick<PartidaRemota, 'pista' | 'tipo' | 'total'>>(partidas: T[]): T[] {
  return partidas.map((p) => (p.pista === 'inclusion' && p.tipo === 'nivel' && p.total === 10 ? { ...p, pista: PISTA_INCLUSION_ANTERIOR } : p));
}

/** ¿La ruta tiene definición en el juego actual? (la ruta anterior de Inclusión ya no). */
const rutaVigente = (p: string): p is Pista => p in definiciones;

// ───────────── Filtros ─────────────

export type Actividad = 'todo' | 'niveles' | 'pruebas';

export type Filtros = {
  /** Fechas AAAA-MM-DD (hora de Colombia), ambas incluidas. Null = sin límite. */
  desde: string | null;
  hasta: string | null;
  /** Vacío = todos. */
  grupos: Grupo[];
  alumnos: string[];
  operaciones: Operacion[];
  actividad: Actividad;
  /** Incluir cuentas desactivadas. */
  inactivos: boolean;
};

export const FILTROS_INICIALES: Filtros = { desde: null, hasta: null, grupos: [], alumnos: [], operaciones: [], actividad: 'todo', inactivos: false };

export type Periodo = '7' | '30' | '90' | 'mes' | 'todo' | 'personalizado';

const DIA = 86_400_000;

// Colombia no tiene horario de verano: siempre UTC−5. Calcularlo así es cientos de veces más rápido
// que toLocaleDateString con zona horaria, y los informes lo hacen miles de veces.
const DESFASE = 5 * 3600_000;
const cacheDia = new Map<string, string>();

/** Fecha AAAA-MM-DD en la hora de Colombia. */
export function diaDe(iso: string | number | Date): string {
  if (typeof iso === 'string') {
    let d = cacheDia.get(iso);
    if (d === undefined) {
      d = new Date(new Date(iso).getTime() - DESFASE).toISOString().slice(0, 10);
      if (cacheDia.size > 200_000) cacheDia.clear();
      cacheDia.set(iso, d);
    }
    return d;
  }
  return new Date(new Date(iso).getTime() - DESFASE).toISOString().slice(0, 10);
}

const sumarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const diasEntre = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / DIA);

/** Rango de fechas de un periodo predefinido. */
export function rangoDePeriodo(p: Periodo, ahora = Date.now()): { desde: string | null; hasta: string | null } {
  const hoy = diaDe(ahora);
  if (p === 'todo' || p === 'personalizado') return { desde: null, hasta: null };
  if (p === 'mes') return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  return { desde: sumarDias(hoy, -(Number(p) - 1)), hasta: hoy };
}

/** Lunes de la semana de un día. */
export function lunesDe(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return sumarDias(dia, -dow);
}

// ───────────── Conjunto filtrado ─────────────

export type Conjunto = {
  filtros: Filtros;
  alumnos: Alumno[];
  eventos: EventoRemoto[];
  partidas: PartidaRemota[];
  /** Rango efectivo (con los datos, si el filtro no tiene límites). */
  desde: string | null;
  hasta: string | null;
};

function enRango(dia: string, desde: string | null, hasta: string | null) {
  return (!desde || dia >= desde) && (!hasta || dia <= hasta);
}

const esPrueba = (tipo: string) => tipo === 'prueba-diagnostica' || tipo === 'prueba-final';

export function filtrar(alumnos: Alumno[], eventos: EventoRemoto[], f: Filtros): Conjunto {
  const sel = alumnos.filter(
    (a) => (f.inactivos || a.fila.activo) && (!f.grupos.length || f.grupos.includes(a.grupo)) && (!f.alumnos.length || f.alumnos.includes(a.fila.id)),
  );
  const ids = new Set(sel.map((a) => a.fila.id));
  const tipoOk = (tipo: string) => f.actividad === 'todo' || (f.actividad === 'pruebas' ? esPrueba(tipo) : tipo === 'nivel');
  const ev = eventos.filter(
    (e) => ids.has(e.usuario_id) && tipoOk(e.tipo) && (!f.operaciones.length || f.operaciones.includes(e.operacion as Operacion)) && enRango(diaDe(e.t), f.desde, f.hasta),
  );
  const pa = sel.flatMap((a) => a.partidas).filter((p) => tipoOk(p.tipo) && enRango(diaDe(p.t), f.desde, f.hasta));
  const dias = ev.map((e) => diaDe(e.t)).sort();
  return {
    filtros: f,
    alumnos: sel,
    eventos: ev,
    partidas: pa,
    desde: f.desde ?? dias[0] ?? null,
    hasta: f.hasta ?? dias[dias.length - 1] ?? null,
  };
}

/** El mismo filtro, en el periodo anterior de igual duración (para comparar). Null sin límites. */
export function filtrosAnteriores(f: Filtros): Filtros | null {
  if (!f.desde || !f.hasta) return null;
  const largo = diasEntre(f.desde, f.hasta) + 1;
  return { ...f, desde: sumarDias(f.desde, -largo), hasta: sumarDias(f.desde, -1) };
}

// ───────────── Medidas básicas ─────────────

/** Acierto al primer intento: respondió bien sin equivocarse antes. */
export const alPrimerIntento = (e: Pick<EventoRemoto, 'correcto' | 'intentos'>) => e.correcto && (e.intentos ?? 1) <= 1;

const pct = (a: number, n: number) => (n > 0 ? (100 * a) / n : null);

export type Medidas = {
  ejercicios: number;
  /** % acertados al primer intento. */
  primerIntento: number | null;
  /** % resueltos bien (aunque sea en otro intento). */
  logro: number | null;
  minutos: number;
  segMediana: number | null;
  pistasPorEjercicio: number | null;
};

export function medidas(ev: EventoRemoto[]): Medidas {
  const n = ev.length;
  return {
    ejercicios: n,
    primerIntento: pct(ev.filter(alPrimerIntento).length, n),
    logro: pct(ev.filter((e) => e.correcto).length, n),
    minutos: ev.reduce((s, e) => s + (e.ms ?? 0), 0) / 60000,
    segMediana: n ? mediana(ev.map((e) => (e.ms ?? 0) / 1000)) : null,
    pistasPorEjercicio: n ? ev.reduce((s, e) => s + (e.pistas_usadas ?? 0), 0) / n : null,
  };
}

// ───────────── Indicadores (tarjetas) ─────────────

export type Indicadores = Medidas & {
  alumnos: number;
  activos: number;
  minutosPorActivo: number | null;
  diasActivosProm: number | null;
  nivelesSuperados: number;
  /** Serie del % al primer intento para la mini tendencia de las tarjetas. */
  tendencia: (number | null)[];
  tendenciaEjercicios: (number | null)[];
};

export function indicadores(c: Conjunto): Indicadores {
  const m = medidas(c.eventos);
  const porAlumno = new Map<string, Set<string>>();
  for (const e of c.eventos) {
    if (!porAlumno.has(e.usuario_id)) porAlumno.set(e.usuario_id, new Set());
    porAlumno.get(e.usuario_id)!.add(diaDe(e.t));
  }
  const activos = porAlumno.size;
  const superados = new Set(
    c.partidas.filter((p) => p.tipo === 'nivel' && !p.repaso && (p.estrellas ?? 0) > 0).map((p) => `${p.usuario_id}|${p.pista}|${p.nivel}`),
  );
  const s = serie(c, 12);
  return {
    ...m,
    alumnos: c.alumnos.length,
    activos,
    minutosPorActivo: activos ? m.minutos / activos : null,
    diasActivosProm: activos ? media([...porAlumno.values()].map((x) => x.size)) : null,
    nivelesSuperados: superados.size,
    tendencia: s.puntos.map((p) => p.primerIntento),
    tendenciaEjercicios: s.puntos.map((p) => p.ejercicios),
  };
}

// ───────────── Evolución en el tiempo ─────────────

export type PuntoSerie = Medidas & { desde: string; activos: number };
export type Serie = { unidad: 'dia' | 'semana' | 'mes'; puntos: PuntoSerie[] };

/** Agrupa por día (≤ 31 días), semana (≤ 26 semanas) o mes. `maxPuntos` recorta al final. */
export function serie(c: Conjunto, maxPuntos?: number): Serie {
  if (!c.desde || !c.hasta) return { unidad: 'semana', puntos: [] };
  const largo = diasEntre(c.desde, c.hasta) + 1;
  const unidad: Serie['unidad'] = largo <= 31 ? 'dia' : largo <= 26 * 7 ? 'semana' : 'mes';
  const clave = (dia: string) => (unidad === 'dia' ? dia : unidad === 'semana' ? lunesDe(dia) : `${dia.slice(0, 7)}-01`);
  const cubos: string[] = [];
  for (let d = clave(c.desde); d <= c.hasta; ) {
    cubos.push(d);
    d = unidad === 'dia' ? sumarDias(d, 1) : unidad === 'semana' ? sumarDias(d, 7) : (() => {
      const [a, m] = d.split('-').map(Number);
      return m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
    })();
  }
  const por = new Map<string, EventoRemoto[]>(cubos.map((k) => [k, []]));
  for (const e of c.eventos) por.get(clave(diaDe(e.t)))?.push(e);
  let puntos = cubos.map((k) => {
    const ev = por.get(k)!;
    return { ...medidas(ev), desde: k, activos: new Set(ev.map((e) => e.usuario_id)).size };
  });
  if (maxPuntos && puntos.length > maxPuntos) puntos = puntos.slice(-maxPuntos);
  return { unidad, puntos };
}

// ───────────── Por operación, por tema y por ejercicio (plantilla) ─────────────

export type FilaDesglose = Medidas & { id: string; etiqueta: string; detalle?: string; alumnos: number; erroresTop?: string };

function desglosar(ev: EventoRemoto[], clave: (e: EventoRemoto) => string, etiqueta: (k: string, e: EventoRemoto) => { etiqueta: string; detalle?: string }): FilaDesglose[] {
  const grupos = new Map<string, EventoRemoto[]>();
  for (const e of ev) {
    const k = clave(e);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(e);
  }
  return [...grupos.entries()].map(([k, lista]) => {
    const errores = contarErrores(lista);
    return {
      id: k,
      ...etiqueta(k, lista[0]),
      ...medidas(lista),
      alumnos: new Set(lista.map((e) => e.usuario_id)).size,
      erroresTop: errores[0] ? errores[0].nombre : undefined,
    };
  });
}

export function porOperacion(c: Conjunto): FilaDesglose[] {
  const filas = desglosar(c.eventos, (e) => e.operacion, (k) => ({ etiqueta: nombresOperacion[k as Operacion] ?? k }));
  return filas.sort((a, b) => OPERACIONES.indexOf(a.id as Operacion) - OPERACIONES.indexOf(b.id as Operacion));
}

/** Nombre de un tema (pista + nivel) con el grupo, si hay varios. */
export function nombreTema(pista: string, nivel: number): string {
  if (pista === PISTA_INCLUSION_ANTERIOR) return TITULOS_INCLUSION_ANTERIOR[nivel - 1] ?? `Nivel ${nivel}`;
  try {
    return temaDe(pista as Pista, nivel).titulo;
  } catch {
    return `Nivel ${nivel}`;
  }
}

const NOMBRE_PISTA: Record<string, string> = {
  familia: 'Familias (prueba)',
  'fam-basica': 'Familias · básica',
  'fam-intermedia': 'Familias · intermedia',
  'fam-avanzada': 'Familias · avanzada',
  inclusion: 'Inclusión',
  [PISTA_INCLUSION_ANTERIOR]: 'Inclusión (ruta anterior)',
};
const ORDEN_PISTAS = ['g1', 'g2', 'g3', 'g4', 'g5', 'familia', 'fam-basica', 'fam-intermedia', 'fam-avanzada', 'inclusion', PISTA_INCLUSION_ANTERIOR];
/** Orden de las rutas en selectores y tablas: grados, familias e Inclusión. */
export const ordenarPistas = <T extends string>(lista: T[]): T[] => [...lista].sort((a, b) => ORDEN_PISTAS.indexOf(a) - ORDEN_PISTAS.indexOf(b));

export const nombrePista = (p: string) => NOMBRE_PISTA[p] ?? (/^g\d$/.test(p) ? `${p.slice(1)}.º grado` : p);

export function porTema(c: Conjunto): FilaDesglose[] {
  const varias = new Set(c.eventos.map((e) => e.pista)).size > 1;
  const filas = desglosar(
    c.eventos,
    (e) => `${e.pista}|${e.nivel}`,
    (_k, e) => ({ etiqueta: nombreTema(e.pista, e.nivel), detalle: `${varias ? nombrePista(e.pista) + ' · ' : ''}Nivel ${e.nivel}` }),
  );
  return filas.sort((a, b) => {
    const [pa, na] = a.id.split('|');
    const [pb, nb] = b.id.split('|');
    return pa === pb ? Number(na) - Number(nb) : ORDEN_PISTAS.indexOf(pa) - ORDEN_PISTAS.indexOf(pb);
  });
}

export function porPlantilla(c: Conjunto): FilaDesglose[] {
  return desglosar(c.eventos, (e) => e.plantilla, (k, e) => ({ etiqueta: k, detalle: nombresOperacion[e.operacion as Operacion] ?? e.operacion })).sort((a, b) => b.ejercicios - a.ejercicios);
}

// ───────────── Errores ─────────────

export type ConteoError = { tipo: string; nombre: string; n: number; pct: number };

export const nombreError = (t: string) => nombresErrores[t as TipoError] ?? t;

/** Tipos de error detectados (en los ejercicios con algún error), del más frecuente al menos. */
export function contarErrores(ev: EventoRemoto[]): ConteoError[] {
  const conError = ev.filter((e) => e.tipo_error);
  const n = new Map<string, number>();
  for (const e of conError) n.set(e.tipo_error!, (n.get(e.tipo_error!) ?? 0) + 1);
  return [...n.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, k]) => ({ tipo, nombre: nombreError(tipo), n: k, pct: (100 * k) / conError.length }));
}

export type MatrizErrores = {
  tipos: { id: string; etiqueta: string }[];
  operaciones: { id: string; etiqueta: string }[];
  valor: Map<string, number>;
  /** Ejercicios con error y total de ejercicios (para la tasa). */
  conError: number;
  total: number;
};

export function matrizErrores(c: Conjunto): MatrizErrores {
  const conteo = contarErrores(c.eventos);
  const ops = OPERACIONES.filter((o) => c.eventos.some((e) => e.operacion === o && e.tipo_error));
  const valor = new Map<string, number>();
  for (const e of c.eventos) if (e.tipo_error) valor.set(`${e.tipo_error}|${e.operacion}`, (valor.get(`${e.tipo_error}|${e.operacion}`) ?? 0) + 1);
  return {
    tipos: conteo.map((x) => ({ id: x.tipo, etiqueta: x.nombre })),
    operaciones: ops.map((o) => ({ id: o, etiqueta: nombresOperacion[o] })),
    valor,
    conError: c.eventos.filter((e) => e.tipo_error).length,
    total: c.eventos.length,
  };
}

// ───────────── Prueba de entrada y prueba final ─────────────

export type FilaPrePost = {
  id: string;
  nombre: string;
  grupo: Grupo;
  pista: Pista;
  /** % de aciertos (0–100). */
  antes: number | null;
  despues: number | null;
  aciertosAntes: number | null;
  aciertosDespues: number | null;
  total: number;
  diferencia: number | null;
  ganancia: number | null;
  fechaAntes: string | null;
  fechaDespues: string | null;
  minutosAntes: number | null;
  minutosDespues: number | null;
  porTemaAntes: boolean[] | null;
  porTemaDespues: boolean[] | null;
};

export type TemaPrePost = { id: string; etiqueta: string; antes: number | null; despues: number | null; nAntes: number; nDespues: number };

export type PrePost = {
  filas: FilaPrePost[];
  conEntrada: number;
  conFinal: number;
  /** Estadística sobre quienes tienen las dos pruebas (en % de aciertos). */
  estadistica: Pareado | null;
  gananciaNormalizadaProm: number | null;
  /** Por tema, para cada pista de prueba presente (los temas de cada grado son distintos). */
  temas: { pista: Pista; nombre: string; temas: TemaPrePost[] }[];
  /** Quienes deberían hacer la prueba y aún no la hicieron. */
  sinEntrada: string[];
};

/** Pre/post de los alumnos seleccionados. No depende del periodo: es la última prueba de cada uno. */
export function prePost(c: Conjunto): PrePost {
  const filas: FilaPrePost[] = [];
  const sinEntrada: string[] = [];
  for (const a of c.alumnos) {
    if (!haceDiagnostica(a.perfil)) continue;
    const pista = pistaDePrueba(a.perfil);
    const pr = pruebasDe(a.perfil, a.fuente);
    const d = pr.diagnostica ?? null;
    const f = pr.final ?? null;
    if (!d) sinEntrada.push(a.fila.id);
    if (!d && !f) continue;
    const pa = d ? (100 * d.aciertos) / d.total : null;
    const pd = f ? (100 * f.aciertos) / f.total : null;
    filas.push({
      id: a.fila.id,
      nombre: a.fila.nombre,
      grupo: a.grupo,
      pista,
      antes: pa,
      despues: pd,
      aciertosAntes: d?.aciertos ?? null,
      aciertosDespues: f?.aciertos ?? null,
      total: (d ?? f)!.total,
      diferencia: pa !== null && pd !== null ? pd - pa : null,
      ganancia: pa !== null && pd !== null ? gananciaNormalizada(pa, pd) : null,
      fechaAntes: d?.fecha ?? null,
      fechaDespues: f?.fecha ?? null,
      minutosAntes: d ? d.ms / 60000 : null,
      minutosDespues: f ? f.ms / 60000 : null,
      porTemaAntes: d?.porTema ?? null,
      porTemaDespues: f?.porTema ?? null,
    });
  }
  const pares = filas.filter((f) => f.antes !== null && f.despues !== null);
  const pistas = ordenarPistas([...new Set(filas.map((f) => f.pista))]);
  const temas = pistas.map((pista) => {
    const delaPista = filas.filter((f) => f.pista === pista);
    const lista = definicion(pista).temas.map((t, k) => {
      const an = delaPista.map((f) => f.porTemaAntes?.[k]).filter((x): x is boolean => x !== undefined);
      const de = delaPista.map((f) => f.porTemaDespues?.[k]).filter((x): x is boolean => x !== undefined);
      return { id: `${pista}|${k + 1}`, etiqueta: t.titulo, antes: pct(an.filter(Boolean).length, an.length), despues: pct(de.filter(Boolean).length, de.length), nAntes: an.length, nDespues: de.length };
    });
    return { pista, nombre: pista === 'familia' ? 'Familias' : nombrePista(pista), temas: lista };
  });
  const ganancias = pares.map((f) => f.ganancia).filter((g): g is number => g !== null);
  return {
    filas,
    conEntrada: filas.filter((f) => f.antes !== null).length,
    conFinal: filas.filter((f) => f.despues !== null).length,
    estadistica: pareado(
      pares.map((f) => f.antes!),
      pares.map((f) => f.despues!),
    ),
    gananciaNormalizadaProm: media(ganancias),
    temas,
    sinEntrada,
  };
}

// ───────────── Alertas (seguimiento) ─────────────

export type TonoAlerta = 'aviso' | 'grave' | 'critico';
export type Alerta = { tipo: string; tono: TonoAlerta; texto: string };

export const UMBRALES = { diasSinJugar: 7, diasSinJugarGrave: 14, aciertoBajo: 65, aciertoMuyBajo: 50, minimoEjercicios: 10, intentosAtascado: 3, pistasAltas: 1.5, recientes: 20 };

export function alertasDe(a: Alumno, eventosAlumno: EventoRemoto[], ahora = Date.now()): Alerta[] {
  const al: Alerta[] = [];
  const u = UMBRALES;
  if (!a.ultimaActividad) al.push({ tipo: 'nunca', tono: 'critico', texto: 'Nunca ha jugado' });
  else {
    const dias = Math.floor((ahora - new Date(a.ultimaActividad).getTime()) / DIA);
    if (dias >= u.diasSinJugar) al.push({ tipo: 'inactivo', tono: dias >= u.diasSinJugarGrave ? 'grave' : 'aviso', texto: `${dias} días sin jugar` });
  }
  const recientes = [...eventosAlumno].sort((x, y) => x.t.localeCompare(y.t)).slice(-u.recientes);
  if (recientes.length >= u.minimoEjercicios) {
    const p = pct(recientes.filter(alPrimerIntento).length, recientes.length)!;
    if (p < u.aciertoBajo) al.push({ tipo: 'acierto', tono: p < u.aciertoMuyBajo ? 'grave' : 'aviso', texto: `Acierto reciente ${Math.round(p)} %` });
    const pistas = recientes.reduce((s, e) => s + (e.pistas_usadas ?? 0), 0) / recientes.length;
    if (pistas >= u.pistasAltas) al.push({ tipo: 'pistas', tono: 'aviso', texto: `Usa muchas pistas (${pistas.toFixed(1).replace('.', ',')} por ejercicio)` });
  }
  const pista = a.informe.pista;
  const prog = progresoDe(a.fuente, pista);
  const actual = prog.niveles[a.informe.nivelMaximo];
  if (actual && !actual.completado && actual.intentos >= u.intentosAtascado) al.push({ tipo: 'atascado', tono: 'grave', texto: `Atascado en el nivel ${a.informe.nivelMaximo} (${actual.intentos} intentos)` });
  if (haceDiagnostica(a.perfil)) {
    const pr = pruebasDe(a.perfil, a.fuente);
    if (!pr.diagnostica) al.push({ tipo: 'sin-entrada', tono: 'aviso', texto: 'Sin prueba de entrada' });
    else if (pr.final && pr.final.aciertos < pr.diagnostica.aciertos) al.push({ tipo: 'bajo-final', tono: 'grave', texto: `Bajó en la final (${pr.diagnostica.aciertos} → ${pr.final.aciertos})` });
  }
  return al;
}

// ───────────── Tabla comparativa de alumnos ─────────────

export type FilaAlumno = Medidas & {
  id: string;
  nombre: string;
  usuario: string;
  grupo: Grupo;
  pista: Pista;
  nivelActual: number;
  nivelesRuta: number;
  superados: number;
  /** % de la ruta superada. */
  avance: number;
  dias: number;
  ultima: string | null;
  antes: number | null;
  despues: number | null;
  diferencia: number | null;
  /** Cambio del % al primer intento: segunda mitad del periodo vs. primera. */
  tendencia: number | null;
  operacionDebil: string | null;
  errorFrecuente: string | null;
  alertas: Alerta[];
};

export function filasAlumnos(c: Conjunto, ahora = Date.now()): FilaAlumno[] {
  const por = new Map<string, EventoRemoto[]>(c.alumnos.map((a) => [a.fila.id, []]));
  for (const e of c.eventos) por.get(e.usuario_id)?.push(e);
  const pp = new Map(prePost(c).filas.map((f) => [f.id, f]));
  return c.alumnos.map((a) => {
    const ev = por.get(a.fila.id)!;
    const m = medidas(ev);
    const orden = [...ev].sort((x, y) => x.t.localeCompare(y.t));
    const mitad = Math.floor(orden.length / 2);
    const p1 = medidas(orden.slice(0, mitad)).primerIntento;
    const p2 = medidas(orden.slice(mitad)).primerIntento;
    const ops = OPERACIONES.map((o) => ({ o, m: medidas(ev.filter((e) => e.operacion === o)) })).filter((x) => x.m.ejercicios >= 5 && x.m.primerIntento !== null);
    ops.sort((x, y) => x.m.primerIntento! - y.m.primerIntento!);
    const errores = contarErrores(ev);
    const ruta = nivelMaximo(a.informe.pista);
    const f = pp.get(a.fila.id);
    return {
      ...m,
      id: a.fila.id,
      nombre: a.fila.nombre,
      usuario: a.fila.usuario,
      grupo: a.grupo,
      pista: a.informe.pista,
      nivelActual: a.informe.nivelMaximo,
      nivelesRuta: ruta,
      superados: a.informe.superados,
      avance: ruta ? (100 * a.informe.superados) / ruta : 0,
      dias: new Set(ev.map((e) => diaDe(e.t))).size,
      ultima: a.ultimaActividad,
      antes: f?.antes ?? null,
      despues: f?.despues ?? null,
      diferencia: f?.diferencia ?? null,
      tendencia: orden.length >= 10 && p1 !== null && p2 !== null ? p2 - p1 : null,
      operacionDebil: ops.length && ops[0].m.primerIntento! < 80 ? nombresOperacion[ops[0].o] : null,
      errorFrecuente: errores[0]?.nombre ?? null,
      alertas: alertasDe(a, por.get(a.fila.id)!, ahora),
    };
  });
}

/** Mapa alumno × tema: % al primer intento de cada alumno en cada tema (solo una pista a la vez). */
export { rutaVigente };

export function mapaAlumnoTema(c: Conjunto, pista: Pista): { temas: { id: string; etiqueta: string }[]; valor: Map<string, number>; n: Map<string, number> } {
  const temas = definicion(pista).temas.map((t, k) => ({ id: String(k + 1), etiqueta: `${k + 1}. ${t.titulo}` }));
  const ok = new Map<string, number>();
  const n = new Map<string, number>();
  for (const e of c.eventos) {
    if (e.pista !== pista) continue;
    const k = `${e.usuario_id}|${e.nivel}`;
    n.set(k, (n.get(k) ?? 0) + 1);
    if (alPrimerIntento(e)) ok.set(k, (ok.get(k) ?? 0) + 1);
  }
  const valor = new Map<string, number>();
  for (const [k, total] of n) valor.set(k, (100 * (ok.get(k) ?? 0)) / total);
  return { temas, valor, n };
}

// ───────────── Textos para el informe ─────────────

/** Descripción legible de los filtros aplicados (portada del PDF y primera hoja del Excel). */
export function describirFiltros(f: Filtros, alumnos: Alumno[]): string[] {
  const fecha = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const lineas = [
    f.desde || f.hasta ? `Periodo: ${f.desde ? fecha(f.desde) : 'el inicio'} a ${f.hasta ? fecha(f.hasta) : 'hoy'}` : 'Periodo: todo el registro',
    `Grupos: ${f.grupos.length ? f.grupos.map(nombreGrupo).join(', ') : 'todos'}`,
  ];
  if (f.alumnos.length) {
    const nombres = alumnos.filter((a) => f.alumnos.includes(a.fila.id)).map((a) => a.fila.nombre);
    lineas.push(`Usuarios: ${nombres.length <= 6 ? nombres.join(', ') : `${nombres.length} seleccionados`}`);
  }
  if (f.operaciones.length) lineas.push(`Operaciones: ${f.operaciones.map((o) => nombresOperacion[o]).join(', ')}`);
  if (f.actividad !== 'todo') lineas.push(`Actividad: ${f.actividad === 'niveles' ? 'solo niveles' : 'solo pruebas'}`);
  if (f.inactivos) lineas.push('Incluye cuentas desactivadas');
  return lineas;
}

/** Definiciones de las métricas (se muestran con «?» y van al final del PDF y del Excel). */
export const DEFINICIONES: Record<string, string> = {
  primerIntento: 'Acierto al primer intento: porcentaje de ejercicios respondidos bien sin equivocarse antes.',
  logro: 'Resueltos: porcentaje de ejercicios que terminaron bien, aunque fuera en el segundo o tercer intento.',
  minutos: 'Tiempo en tarea: suma del tiempo que el usuario pasó en cada ejercicio (desde que aparece hasta que responde).',
  segMediana: 'Tiempo típico por ejercicio: mediana de los segundos por ejercicio (no la afectan los ejercicios abandonados).',
  pistas: 'Pistas por ejercicio: promedio de pistas pedidas en cada ejercicio (0 a 3).',
  activos: 'Usuarios activos: los que respondieron al menos un ejercicio en el periodo.',
  dias: 'Días activos: días distintos con al menos un ejercicio.',
  superados: 'Niveles superados: niveles distintos aprobados (con al menos una estrella) en el periodo, sin contar repasos.',
  ganancia: 'Ganancia normalizada de Hake: (final − entrada) / (100 − entrada). 0,3 a 0,7 es una ganancia media; más de 0,7, alta.',
  t: 'Prueba t para muestras pareadas: compara la misma persona antes y después. p < 0,05 indica una diferencia estadísticamente significativa.',
  d: 'd de Cohen (pareada): tamaño del efecto. 0,2 pequeño, 0,5 mediano, 0,8 grande.',
  wilcoxon: 'Wilcoxon de rangos con signo: alternativa no paramétrica a la prueba t, recomendable con grupos pequeños (menos de 30).',
  tendencia: 'Tendencia: cambio del acierto al primer intento entre la primera y la segunda mitad de los ejercicios del periodo.',
};

export const listaGrupos = GRUPOS;
