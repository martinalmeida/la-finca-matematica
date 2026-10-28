// Esquema de datos y operaciones sobre la cuenta, el progreso, el registro y los ajustes.
// Las derivaciones (ruta, exigencia, pruebas) reciben una «fuente» de datos, así el panel del
// profesor las calcula igual que el celular del usuario, pero con lo que bajó de la nube.

import { borrar, escribir, leer, PREFIJO_V1 } from './almacen';
import { claveLocal, encolarEvento, encolarPartida, type Partida, type TipoPartida } from './cola';
import type { Banda, Grado, Operacion, Pista } from '../juego/tipos';
import { bandaPorPuntaje, rutaFamiliaPorPuntaje, type ResultadoPrueba } from '../juego/pruebas';
import { uuid } from '../juego/perfil';

export type Rol = 'estudiante' | 'familia';
export type TipoUsuario = 'estudiante' | 'familia' | 'inclusion';

/** Renglón de la tabla «perfiles» de Supabase. */
export type FilaPerfil = {
  id: string;
  usuario: string;
  nombre: string;
  rol: 'profesor' | 'usuario';
  tipo: TipoUsuario | null;
  grado: number | null;
  activo: boolean;
  avatar: string | null;
  /** Versión de la foto subida a Storage (fotos/{id}/foto.jpg), o null si no tiene. */
  foto?: string | null;
  bandas: Partial<Record<string, Banda>>;
  finales_permitidos: Record<string, number>;
  generacion: number;
  profesor_id: string | null;
  creado: string;
  ultima_sync: string | null;
};

/** Usuario que juega (lo crea el profesor; aquí se guarda su copia local). */
export type Perfil = {
  id: string;
  /** Nombre de usuario: también es la semilla de los ejercicios. */
  usuario: string;
  nombre: string;
  avatar: string;
  rol: Rol;
  grado: Grado | null;
  /** Exigencia fijada por el profesor, por pista de prueba. */
  bandas: Partial<Record<string, Banda>>;
  /** Veces que el profesor permitió repetir la final, por pista de prueba. */
  finalesPermitidos: Record<string, number>;
};

export function perfilDeFila(f: FilaPerfil): Perfil {
  return {
    id: f.id,
    usuario: f.usuario,
    nombre: f.nombre,
    avatar: f.avatar ?? '',
    rol: f.tipo === 'familia' ? 'familia' : 'estudiante',
    grado: f.tipo === 'inclusion' ? 'inclusion' : f.tipo === 'estudiante' && f.grado ? (f.grado as Grado) : null,
    bandas: f.bandas ?? {},
    finalesPermitidos: f.finales_permitidos ?? {},
  };
}

/** Primer nombre, para saludar. */
export function primerNombre(p: { nombre: string }): string {
  return p.nombre.trim().split(/\s+/)[0] ?? p.nombre;
}

/** Pruebas de entrada y salida del perfil en su grado (cada grado tiene las suyas). */
export type Pruebas = {
  diagnostica?: ResultadoPrueba;
  final?: ResultadoPrueba;
  /** El profesor permitió repetir la prueba final (se calcula, no se guarda). */
  repetirFinal?: boolean;
  /** Permisos de repetir la final ya usados. */
  finalesUsados?: number;
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

/** Resumen agregado por usuario: alimenta los informes del profesor y la vista de familias. */
export type Resumen = {
  porOperacion: Partial<Record<Operacion, { total: number; aciertos: number }>>;
  errores: Record<string, number>;
  diasJugados: string[];
  /** Ejercicios resueltos con el paso a paso. */
  pasoAPaso: number;
};

/** Lee un dato del usuario por su clave remota («progreso:g3», «resumen»…). */
export type Fuente = (clave: string) => unknown;

/** Fuente local: lo guardado en este celular para el usuario `id`. */
export function fuenteLocal(id: string): Fuente {
  return (clave) => leer<unknown>(claveLocal(clave, id), undefined);
}

const K = {
  cuenta: PREFIJO_V1 + 'cuenta',
  ajustes: PREFIJO_V1 + 'ajustes',
  silo: PREFIJO_V1 + 'silo',
  siloEscuela: PREFIJO_V1 + 'siloEscuela',
  progreso: (id: string, pista: string) => `${PREFIJO_V1}progreso:${id}:${pista}`,
  resumen: (id: string) => `${PREFIJO_V1}resumen:${id}`,
  pruebas: (id: string, pista: string) => `${PREFIJO_V1}pruebas:${id}:${pista}`,
  historias: (id: string) => `${PREFIJO_V1}historiasVistas:${id}`,
  reacciones: (id: string) => `${PREFIJO_V1}reacciones:${id}`,
  taller: (id: string) => `${PREFIJO_V1}taller:${id}`,
};

// --- Cuenta con sesión iniciada ---

/** Cuenta de este celular: la fila de «perfiles» y lo que falta subir de ella. */
export type Cuenta = FilaPerfil & {
  avatarPendiente?: boolean;
  /** La foto cambió en este celular y falta subirla (o borrarla) en la nube. */
  fotoPendiente?: 'subir' | 'quitar';
};

/** Cuenta de este celular (la fila de «perfiles» tal como llegó de la nube). */
export function leerCuenta(): Cuenta | null {
  const c = leer<Cuenta | null>(K.cuenta, null);
  return c && typeof c === 'object' && c.id ? c : null;
}

export function guardarCuenta(c: Cuenta): void {
  escribir(K.cuenta, c);
}

/** Fila nueva de la nube sin perder lo elegido aquí que aún no ha subido (personaje y foto). */
export function conPendientes(fila: FilaPerfil, actual: Cuenta | null): Cuenta {
  if (!actual) return fila;
  return {
    ...fila,
    avatar: actual.avatarPendiente ? actual.avatar : fila.avatar,
    avatarPendiente: actual.avatarPendiente,
    foto: actual.fotoPendiente ? actual.foto : fila.foto,
    fotoPendiente: actual.fotoPendiente,
  };
}

export function borrarCuenta(): void {
  borrar(K.cuenta);
}

// --- Derivaciones (iguales en el celular y en el panel del profesor) ---

function pruebasCrudas(f: Fuente, pista: Pista): Pruebas {
  const v = f(`pruebas:${pista}`);
  return v && typeof v === 'object' ? (v as Pruebas) : {};
}

/** Pista de la que salen las preguntas de la diagnóstica y la final. */
export function pistaDePrueba(p: Perfil): Pista {
  return p.rol === 'familia' || !p.grado ? 'familia' : p.grado === 'inclusion' ? 'inclusion' : (`g${p.grado}` as Pista);
}

/** Ruta de juego: grado, Inclusión o la ruta de padres que asignó su diagnóstica. */
export function pistaDe(p: Perfil, f: Fuente): Pista {
  if (p.rol === 'familia' || !p.grado) {
    const d = pruebasCrudas(f, 'familia').diagnostica;
    return d ? rutaFamiliaPorPuntaje(d.aciertos, d.total) : 'fam-intermedia';
  }
  return pistaDePrueba(p);
}

export function pruebasDe(p: Perfil, f: Fuente): Pruebas {
  const pista = pistaDePrueba(p);
  const v = pruebasCrudas(f, pista);
  return { ...v, repetirFinal: !!v.final && (p.finalesPermitidos[pista] ?? 0) > (v.finalesUsados ?? 0) };
}

/** Exigencia en su grado: la que fijó el profesor o la que dio la diagnóstica. */
export function bandaDe(p: Perfil, f: Fuente): Banda {
  const fijada = p.bandas[pistaDePrueba(p)];
  if (fijada) return fijada;
  // A las familias su prueba de entrada les asigna el cuaderno (la ruta), no una exigencia.
  if (p.rol === 'familia' || !p.grado) return 'basico';
  const d = pruebasCrudas(f, pistaDePrueba(p)).diagnostica;
  return d ? bandaPorPuntaje(d.aciertos, d.total) : 'basico';
}

export function progresoDe(f: Fuente, pista: Pista): Progreso {
  const v = f(`progreso:${pista}`);
  return v && typeof v === 'object' ? { ...progresoVacio(), ...(v as Partial<Progreso>) } : progresoVacio();
}

export function resumenDe(f: Fuente): Resumen {
  const v = f('resumen');
  return { porOperacion: {}, errores: {}, diasJugados: [], pasoAPaso: 0, ...(v && typeof v === 'object' ? (v as Partial<Resumen>) : {}) };
}

// --- Atajos sobre los datos de este celular ---

export function pistaDePerfil(p: Perfil): Pista {
  return pistaDe(p, fuenteLocal(p.id));
}

export function bandaDePerfil(p: Perfil): Banda {
  return bandaDe(p, fuenteLocal(p.id));
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
  return progresoDe(fuenteLocal(id), pista);
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

// --- Registro en la nube: cada ejercicio y cada nivel o prueba terminada ---

export type RegistroItem = {
  pista: string;
  nivel: number;
  plantilla: string;
  operacion: Operacion;
  correcto: boolean;
  intentos: number;
  pistasUsadas: number;
  tipoError?: string;
  ms: number;
};

export function registrar(tipo: TipoPartida, item: RegistroItem): void {
  encolarEvento({
    id: uuid(),
    t: new Date().toISOString(),
    tipo,
    pista: item.pista,
    nivel: item.nivel,
    plantilla: item.plantilla,
    operacion: item.operacion,
    correcto: item.correcto,
    intentos: item.intentos,
    pistas_usadas: item.pistasUsadas,
    tipo_error: item.tipoError,
    ms: Math.round(item.ms),
  });
}

export function guardarPartida(p: Omit<Partida, 'id' | 't'>): void {
  encolarPartida({ ...p, id: uuid(), t: new Date().toISOString() });
}

// --- Resumen agregado ---

export function leerResumen(id: string): Resumen {
  return resumenDe(fuenteLocal(id));
}

/** Día en la hora del celular (AAAA-MM-DD). En Colombia, toISOString() ya es «mañana» desde las 7 p. m. */
export function fechaLocal(d: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function sumarAlResumen(id: string, operacion: Operacion, correcto: boolean, tipoError?: string, pasoAPaso = false): Resumen {
  const r = leerResumen(id);
  const op = r.porOperacion[operacion] ?? { total: 0, aciertos: 0 };
  op.total++;
  if (correcto) op.aciertos++;
  r.porOperacion[operacion] = op;
  if (tipoError) r.errores[tipoError] = (r.errores[tipoError] ?? 0) + 1;
  if (pasoAPaso) r.pasoAPaso++;
  const hoy = fechaLocal(new Date());
  if (!r.diasJugados.includes(hoy)) r.diasJugados = [...r.diasJugados.slice(-60), hoy];
  escribir(K.resumen(id), r);
  return r;
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

// --- Silo de la escuela: cosechas ya celebradas y último total que llegó de la nube ---

export function leerSilo(): { cosechas: number } {
  return leer(K.silo, { cosechas: 0 });
}

/** ¿Ya hay registro de cosechas celebradas en este celular? (no lo hay al entrar o tras un reinicio) */
export function hayRegistroSilo(): boolean {
  return leer<unknown>(K.silo, null) !== null;
}

/** ¿Ya llegó de la nube el total del silo de la escuela? */
export function siloEscuelaConocido(): boolean {
  return leer<unknown>(K.siloEscuela, null) !== null;
}

export function guardarSilo(s: { cosechas: number }): void {
  escribir(K.silo, s);
}

export function leerSiloEscuela(): number {
  const v = leer<number>(K.siloEscuela, 0);
  return typeof v === 'number' ? v : 0;
}

export function guardarSiloEscuela(total: number): void {
  escribir(K.siloEscuela, total);
}

// --- Pruebas diagnóstica y final ---

export function leerPruebas(p: Perfil): Pruebas {
  return pruebasDe(p, fuenteLocal(p.id));
}

export function guardarPruebas(p: Perfil, pruebas: Pruebas): void {
  const { repetirFinal: _calculado, ...guardar } = pruebas;
  escribir(K.pruebas(p.id, pistaDePrueba(p)), guardar);
}

/** Guarda una prueba terminada; la final consume el permiso de repetirla. */
export function guardarResultadoPrueba(p: Perfil, tipo: 'diagnostica' | 'final', res: ResultadoPrueba): void {
  const actual = leerPruebas(p);
  const usados = tipo === 'final' ? { finalesUsados: p.finalesPermitidos[pistaDePrueba(p)] ?? 0 } : {};
  guardarPruebas(p, { ...actual, [tipo]: res, ...usados });
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
