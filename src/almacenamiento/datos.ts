// Esquema de datos (v2) y operaciones sobre perfiles, progreso, registro, ajustes y panel docente.

import { borrar, clavesApp, escribir, leer, PREFIJO_V1 } from './almacen';
import type { Banda, Grado, Operacion, Pista } from '../juego/tipos';
import { bandaPorPuntaje, type ResultadoPrueba } from '../juego/pruebas';

export type Rol = 'estudiante' | 'familia';

export type Perfil = {
  id: string;
  codigo: string;
  apodo: string;
  avatar: string;
  rol: Rol;
  grado: Grado | null;
  creado: string;
  /** Ruta de padres que asignó la diagnóstica de familias. */
  rutaFamilia?: Pista;
};

/** Pruebas de entrada y salida del perfil en su grado (cada grado tiene las suyas). */
export type Pruebas = {
  diagnostica?: ResultadoPrueba;
  final?: ResultadoPrueba;
  /** El docente permitió repetir la prueba final. */
  repetirFinal?: boolean;
  /** Exigencia elegida a mano por el docente (si no, la da la diagnóstica). */
  banda?: Banda;
};

export type EtapaPlanta = 'semilla' | 'brote' | 'planta' | 'flor' | 'fruto' | 'cosecha';

export type EstadoNivel = { estrellas: 0 | 1 | 2 | 3; intentos: number; mejorAciertos: number; completado: boolean };

export type Progreso = {
  nivelMaximoDesbloqueado: number;
  niveles: Record<number, EstadoNivel>;
  semillas: number;
  insignias: string[];
  etapaPlanta: EtapaPlanta;
};

export type RegistroItem = {
  t: string;
  pista: string;
  nivel: number;
  plantilla: string;
  operacion: Operacion;
  correcto: boolean;
  intentos: number;
  pistasUsadas: 0 | 1 | 2 | 3;
  tipoError?: string;
  ms: number;
  /** Se resolvió con el paso a paso. */
  pasoAPaso?: boolean;
};

export type Ajustes = {
  tamanoLetra: 'normal' | 'grande' | 'muy-grande';
  sonido: boolean;
  vibracion: boolean;
  audioEnunciados: boolean;
  /** Efectos de vidrio y movimiento; «ligeros» para celulares lentos o movimiento reducido. */
  efectos: 'completos' | 'ligeros';
  /** Videos de ayuda de YouTube (necesitan internet). */
  videos: boolean;
  /** Realidad aumentada con la cámara. Apagada hasta que un adulto la active. */
  realidadAumentada: boolean;
};

/** Resumen agregado por perfil (sin detalle por ejercicio): alimenta el panel docente
 *  y la vista de familias aunque el modo investigación esté apagado. */
export type Resumen = {
  porOperacion: Partial<Record<Operacion, { total: number; aciertos: number }>>;
  errores: Record<string, number>;
  diasJugados: string[];
  retosPareja: number;
  /** Ejercicios resueltos con el paso a paso. */
  pasoAPaso: number;
};

export type Docente = { pinHash: string | null; modoInvestigacion: boolean };

const K = {
  perfiles: PREFIJO_V1 + 'perfiles',
  activo: PREFIJO_V1 + 'perfilActivo',
  ajustes: PREFIJO_V1 + 'ajustes',
  docente: PREFIJO_V1 + 'docente',
  silo: PREFIJO_V1 + 'silo',
  progreso: (id: string, pista: string) => `${PREFIJO_V1}progreso:${id}:${pista}`,
  registro: (id: string) => `${PREFIJO_V1}registro:${id}`,
  resumen: (id: string) => `${PREFIJO_V1}resumen:${id}`,
  pruebas: (id: string, pista: string) => `${PREFIJO_V1}pruebas:${id}:${pista}`,
  historias: (id: string) => `${PREFIJO_V1}historiasVistas:${id}`,
  reacciones: (id: string) => `${PREFIJO_V1}reacciones:${id}`,
  taller: (id: string) => `${PREFIJO_V1}taller:${id}`,
};

export const MAX_REGISTRO = 3000;

// --- Perfiles ---

export function listarPerfiles(): Perfil[] {
  const lista = leer<Perfil[]>(K.perfiles, []);
  return Array.isArray(lista) ? lista : [];
}

export function guardarPerfil(p: Perfil): void {
  const lista = listarPerfiles().filter((x) => x.id !== p.id);
  lista.push(p);
  escribir(K.perfiles, lista);
}

export function obtenerPerfil(id: string): Perfil | undefined {
  return listarPerfiles().find((p) => p.id === id);
}

export function perfilActivo(): string | null {
  return leer<string | null>(K.activo, null);
}

export function fijarPerfilActivo(id: string | null): void {
  if (id) escribir(K.activo, id);
  else borrar(K.activo);
}

/** Elimina el perfil y todos sus datos. */
export function eliminarPerfil(id: string): void {
  escribir(
    K.perfiles,
    listarPerfiles().filter((p) => p.id !== id),
  );
  for (const k of clavesApp()) if (k.includes(`:${id}:`) || k.endsWith(`:${id}`)) borrar(k);
  if (perfilActivo() === id) fijarPerfilActivo(null);
}

/** Reinicia el progreso del perfil, conservando apodo, código y avatar. */
export function reiniciarPerfil(id: string): void {
  for (const k of clavesApp()) {
    if ((k.includes(`progreso:${id}:`) || k.endsWith(`registro:${id}`) || k.endsWith(`resumen:${id}`) || k.includes(`pruebas:${id}:`)) && !k.includes('perfiles')) borrar(k);
  }
}

/** Ruta de juego del perfil (grado, Inclusión o la ruta de padres asignada). */
export function pistaDePerfil(p: Perfil): Pista {
  if (p.rol === 'familia' || !p.grado) return p.rutaFamilia ?? 'fam-intermedia';
  return p.grado === 'inclusion' ? 'inclusion' : (`g${p.grado}` as Pista);
}

/** Pista de la que salen las preguntas de la diagnóstica y la final. */
export function pistaDePrueba(p: Perfil): Pista {
  return p.rol === 'familia' || !p.grado ? 'familia' : pistaDePerfil(p);
}

/** Exigencia del perfil en su grado: la que eligió el docente o la que dio la diagnóstica. */
export function bandaDePerfil(p: Perfil): Banda {
  const pr = leerPruebas(p);
  return pr.banda ?? (pr.diagnostica ? bandaPorPuntaje(pr.diagnostica.aciertos, pr.diagnostica.total) : 'basico');
}

/** Inclusión no hace pruebas; los demás empiezan por la diagnóstica. */
export function haceDiagnostica(p: Perfil): boolean {
  return p.grado !== 'inclusion';
}

export function necesitaDiagnostica(p: Perfil): boolean {
  return haceDiagnostica(p) && !leerPruebas(p).diagnostica;
}

export const TODAS_LAS_PISTAS: Pista[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'inclusion', 'fam-basica', 'fam-intermedia', 'fam-avanzada'];

// --- Progreso ---

export function progresoVacio(): Progreso {
  return { nivelMaximoDesbloqueado: 1, niveles: {}, semillas: 0, insignias: [], etapaPlanta: 'semilla' };
}

export function leerProgreso(id: string, pista: Pista): Progreso {
  const p = leer<Progreso | null>(K.progreso(id, pista), null);
  return p ? { ...progresoVacio(), ...p } : progresoVacio();
}

export function guardarProgreso(id: string, pista: Pista, p: Progreso): void {
  escribir(K.progreso(id, pista), p);
}

/** Semillas e insignias de todas las pistas del perfil. */
export function totalesPerfil(id: string): { semillas: number; insignias: string[] } {
  let semillas = 0;
  const insignias = new Set<string>();
  for (const pista of TODAS_LAS_PISTAS) {
    const p = leer<Progreso | null>(K.progreso(id, pista), null);
    if (!p) continue;
    semillas += p.semillas;
    p.insignias.forEach((i) => insignias.add(i));
  }
  return { semillas, insignias: [...insignias] };
}

// --- Registro detallado (solo en modo investigación) ---

export function leerRegistro(id: string): RegistroItem[] {
  return leer<RegistroItem[]>(K.registro(id), []);
}

export function registrar(id: string, item: RegistroItem): void {
  if (!leerDocente().modoInvestigacion) return;
  const lista = leerRegistro(id);
  lista.push(item);
  // Máximo 3000 entradas: se recortan las más antiguas.
  escribir(K.registro(id), lista.length > MAX_REGISTRO ? lista.slice(lista.length - MAX_REGISTRO) : lista);
}

// --- Resumen agregado ---

export function leerResumen(id: string): Resumen {
  return { porOperacion: {}, errores: {}, diasJugados: [], retosPareja: 0, pasoAPaso: 0, ...leer<Partial<Resumen>>(K.resumen(id), {}) };
}

export function sumarAlResumen(id: string, operacion: Operacion, correcto: boolean, tipoError?: string, pasoAPaso = false): Resumen {
  const r = leerResumen(id);
  const op = r.porOperacion[operacion] ?? { total: 0, aciertos: 0 };
  op.total++;
  if (correcto) op.aciertos++;
  r.porOperacion[operacion] = op;
  if (tipoError) r.errores[tipoError] = (r.errores[tipoError] ?? 0) + 1;
  if (pasoAPaso) r.pasoAPaso++;
  const hoy = new Date().toISOString().slice(0, 10);
  if (!r.diasJugados.includes(hoy)) r.diasJugados = [...r.diasJugados.slice(-60), hoy];
  escribir(K.resumen(id), r);
  return r;
}

export function sumarRetoPareja(id: string): void {
  const r = leerResumen(id);
  r.retosPareja++;
  escribir(K.resumen(id), r);
}

// --- Ajustes ---

function movimientoReducido(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Celular de gama baja (Chrome informa la memoria): arranca con efectos ligeros. */
function equipoModesto(): boolean {
  try {
    const memoria = (navigator as { deviceMemory?: number }).deviceMemory;
    const nucleos = navigator.hardwareConcurrency;
    return (memoria !== undefined && memoria <= 2) || (/Android/.test(navigator.userAgent) && nucleos > 0 && nucleos <= 4);
  } catch {
    return false;
  }
}

export const ajustesPorDefecto: Ajustes = { tamanoLetra: 'normal', sonido: true, vibracion: true, audioEnunciados: true, efectos: 'completos', videos: true, realidadAumentada: false };

export function leerAjustes(): Ajustes {
  return { ...ajustesPorDefecto, ...(movimientoReducido() || equipoModesto() ? { efectos: 'ligeros' as const } : {}), ...leer<Partial<Ajustes>>(K.ajustes, {}) };
}


export function guardarAjustes(a: Ajustes): void {
  escribir(K.ajustes, a);
}

// --- Panel docente ---

export function leerDocente(): Docente {
  return { pinHash: null, modoInvestigacion: false, ...leer<Partial<Docente>>(K.docente, {}) };
}

export function guardarDocente(d: Docente): void {
  escribir(K.docente, d);
}

// --- Silo de la escuela (cosechas colectivas ya celebradas) ---

export function leerSilo(): { cosechas: number } {
  return leer(K.silo, { cosechas: 0 });
}

export function guardarSilo(s: { cosechas: number }): void {
  escribir(K.silo, s);
}

// --- Pruebas diagnóstica y final ---

export function leerPruebas(p: Perfil): Pruebas {
  const v = leer<Pruebas>(K.pruebas(p.id, pistaDePrueba(p)), {});
  return v && typeof v === 'object' ? v : {};
}

export function guardarPruebas(p: Perfil, pruebas: Pruebas): void {
  escribir(K.pruebas(p.id, pistaDePrueba(p)), pruebas);
}

// --- Red de la finca: historias (lecciones) vistas y reacciones a publicaciones ---

export function historiasVistas(id: string): string[] {
  const v = leer<string[]>(K.historias(id), []);
  return Array.isArray(v) ? v : [];
}

export function marcarHistoriaVista(id: string, clave: string): void {
  const v = historiasVistas(id);
  if (!v.includes(clave)) escribir(K.historias(id), [...v, clave]);
}

export function leerReacciones(id: string): Record<string, boolean> {
  return leer<Record<string, boolean>>(K.reacciones(id), {});
}

export function alternarReaccion(id: string, publicacion: string): boolean {
  const r = leerReacciones(id);
  r[publicacion] = !r[publicacion];
  escribir(K.reacciones(id), r);
  return r[publicacion];
}

// --- Taller de números: estrellas (0 a 3) por cifra ---

export function leerTaller(id: string): Record<string, number> {
  const t = leer<Record<string, number>>(K.taller(id), {});
  return t && typeof t === 'object' ? t : {};
}

export function guardarCifraTaller(id: string, cifra: number, estrellas: number): void {
  const t = leerTaller(id);
  t[cifra] = Math.max(t[cifra] ?? 0, Math.min(3, estrellas));
  escribir(K.taller(id), t);
}
